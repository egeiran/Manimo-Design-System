#!/usr/bin/env node
// generate-audio.js — synthesize narration audio for a scene.
//
// Engine chain (default `--engine auto` / no flag):
//   elevenlabs → mistral → local (say/espeak) → estimated-timings
// Each link is tried in order. The first one that produces a usable
// scene.mp3 + manifest wins; earlier failures are logged and the next
// link runs. Estimated-timings is the final no-audio fallback so the
// script never exits non-zero on TTS failure (the nightly agent depends
// on graceful degradation).
//
// Norwegian scenes (`spec.language === 'no'`) drop Mistral from the
// chain — Voxtral does not support Norwegian. English is the project
// default per CLAUDE.md.
//
// Explicit `--engine X` runs only that engine. On failure the chain
// goes straight to estimated-timings, preserving today's per-engine
// semantics.
//
// Engines (`--engine`):
//   auto         try the full chain (default)
//   elevenlabs   ElevenLabs cloud — single-track /with-timestamps,
//                  best quality, char-level offsets (needs ELEVENLABS_API_KEY)
//   mistral      Mistral Voxtral TTS — per-beat MP3 + ffmpeg concat
//                  (needs MISTRAL_API_KEY; English-family languages only)
//   say          macOS built-in `say` — offline
//   espeak       Linux `espeak-ng` — offline
//   local        auto-pick: `say` on macOS, `espeak-ng` on Linux
//
// ElevenLabs `--legacy` runs the previous per-beat behaviour (one MP3
// per beat, no timestamps). Deprecated; kept as escape hatch.
//
// Usage:
//   node scripts/generate-audio.js <scene-id>
//   node scripts/generate-audio.js <scene-id> --engine mistral
//   node scripts/generate-audio.js <scene-id> --engine local
//   node scripts/generate-audio.js <scene-id> --dry-run
//   node scripts/generate-audio.js <scene-id> --force
//   node scripts/generate-audio.js <scene-id> --voice <id>
//   node scripts/generate-audio.js <scene-id> --legacy   (elevenlabs only)
//
// Env (read from .env at repo root):
//   ELEVENLABS_API_KEY   needed for the elevenlabs engine
//   MISTRAL_API_KEY      needed for the mistral engine
//   MISTRAL_VOICE_ID     optional pin; if unset the script auto-lists
//                          /v1/audio/voices and picks the first English preset
//
// Free-tier: ElevenLabs gives 10 000 chars / month. Voxtral is paid
// ($0.016 / 1 000 chars, no free tier). Local engines have no quota.
//
// Local + mistral need ffmpeg + ffprobe on PATH.

import { resolve, dirname, join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Load .env if present. Avoiding a `dotenv` dep — repo deliberately keeps
// devDependencies minimal.
function loadDotenv() {
  const path = join(ROOT, '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
loadDotenv();

// ─── CLI parsing ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const positional = [];
const flags = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dry-run' || a === '--force' || a === '--legacy' || a === '--unsafe-narration') {
    flags[a.slice(2)] = true;
  } else if (a === '--voice') {
    flags.voice = args[++i];
  } else if (a === '--engine') {
    flags.engine = args[++i];
  } else if (a.startsWith('--')) {
    console.error(`Unknown flag: ${a}`);
    process.exit(1);
  } else {
    positional.push(a);
  }
}

if (positional.length !== 1) {
  console.error('Usage: node scripts/generate-audio.js <scene-id> [--engine auto|elevenlabs|mistral|say|espeak|local] [--dry-run] [--force] [--legacy] [--voice <id>] [--unsafe-narration]');
  process.exit(1);
}

const VALID_ENGINES = ['auto', 'elevenlabs', 'mistral', 'say', 'espeak', 'local'];
const ENGINE = flags.engine || 'auto';
if (!VALID_ENGINES.includes(ENGINE)) {
  console.error(`--engine must be one of: ${VALID_ENGINES.join(', ')}`);
  process.exit(1);
}
if (flags.legacy && ENGINE !== 'elevenlabs') {
  console.error(`--legacy only applies to --engine elevenlabs.`);
  process.exit(1);
}

const sceneId = positional[0];

// Resolve manifest entry → spec path + subject_id. Manifest fields (`spec`,
// `html`, `file`) are bare filenames; the subject folder is added here.
const manifestEntry = readManifestEntry(sceneId);
const subjectId = manifestEntry?.subject_id || null;
const specPath = resolveSpecPath(sceneId, manifestEntry, subjectId);
if (!existsSync(specPath)) {
  console.error(`Spec not found: ${specPath}`);
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, 'utf8'));

function readManifestEntry(id) {
  const manifestPath = join(ROOT, 'motion', 'scene-manifest.json');
  if (!existsSync(manifestPath)) return null;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    return (manifest.scenes || []).find(s => s.id === id) || null;
  } catch { return null; }
}

function resolveSpecPath(id, entry, subject) {
  const specName = entry?.spec || `${id}.spec.json`;
  if (subject) return join(ROOT, 'motion', subject, specName);
  return join(ROOT, 'motion', specName);
}

// ─── Pre-flight: refuse formula-shaped narration ────────────────────────
// Per CLAUDE.md hard rule 9, the `narration` field is read verbatim by TTS
// and must be spoken English, not symbols. We catch the most common
// regressions before spending API quota on bad audio. Bypass with
// --unsafe-narration (ONLY when narration genuinely needs a non-prose
// character, e.g. an actual citation).
function checkNarrationIsSpoken(beats) {
  const MATH_SYMBOLS = /[√½¼¾⅓⅔²³⁴⁵⁶⁷⁸⁹⁰₀₁₂₃₄₅₆₇₈₉πωθμαβγλΩΔ∫∑∏≈≤≥≠∂±·×÷→⇒⇔]/;
  const EQUATION = /(^|\W)[A-Za-z]\s*=\s*\S/;
  const PERCENT = /\d\s*%/;

  const issues = [];
  for (const b of beats) {
    const text = b.narration || '';
    const m1 = text.match(MATH_SYMBOLS);
    if (m1) issues.push({ id: b.id, kind: 'math symbol', sample: m1[0], text });
    const m2 = text.match(EQUATION);
    if (m2) issues.push({ id: b.id, kind: 'equation form', sample: m2[0].trim(), text });
    const m3 = text.match(PERCENT);
    if (m3) issues.push({ id: b.id, kind: 'percent sign', sample: m3[0], text });
  }
  return issues;
}

const narrationIssues = checkNarrationIsSpoken(spec.beats || []);
if (narrationIssues.length && !flags['unsafe-narration']) {
  console.error('\n✗ Refusing to generate audio — narration looks formula-shaped:');
  for (const i of narrationIssues) {
    console.error(`  beat "${i.id}": ${i.kind} "${i.sample}"`);
    console.error(`    text: "${i.text}"`);
  }
  console.error('\nPer CLAUDE.md hard rule 9, narration must be spoken English.');
  console.error('Examples of fixes:');
  console.error('  "F = ma"          → "force equals mass times acceleration"');
  console.error('  "½Mv²"            → "one half m v squared"');
  console.error('  "v = √(4gh/3)"    → "v equals the square root of four g h divided by three"');
  console.error('  "15%"             → "fifteen percent"');
  console.error('  "ω₀"              → "omega zero"');
  const _subjPrefix = subjectId ? subjectId + '/' : '';
  const _specName = manifestEntry?.spec || (sceneId + '.spec.json');
  const _jsxName = manifestEntry?.file || (sceneId + '.jsx');
  console.error('\nRewrite the narration in motion/' + _subjPrefix + _specName);
  console.error('(and mirror in motion/' + _subjPrefix + _jsxName + ' NARRATION array), then re-run.');
  console.error('To bypass (rare cases only): pass --unsafe-narration.');
  process.exit(1);
}

const beats = (spec.beats || []).filter(b => b.narration && b.narration.trim());
if (beats.length === 0) {
  console.error('No beats with non-empty narration in this spec.');
  process.exit(1);
}

const totalChars = beats.reduce((n, b) => n + b.narration.length, 0);
const sceneLanguage = spec.language || 'en';

// ─── Defaults ──────────────────────────────────────────────────────────
// ElevenLabs voice `JBFqnCBsd6RMkjVDRZzb` is "George", a calm British male
// from the default library. Pairs well with multilingual_v2.
const ELEVENLABS_VOICE = flags.voice || 'JBFqnCBsd6RMkjVDRZzb';
const ELEVENLABS_MODEL = 'eleven_multilingual_v2';
const ELEVENLABS_FORMAT = 'mp3_44100_128';
const MISTRAL_MODEL = 'voxtral-mini-tts-2603';
const MISTRAL_BASE = 'https://api.mistral.ai/v1';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const outDir = subjectId
  ? join(ROOT, 'motion', subjectId, 'audio', sceneId)
  : join(ROOT, 'motion', 'audio', sceneId);
mkdirSync(outDir, { recursive: true });
const sceneMp3 = join(outDir, 'scene.mp3');
const manifestJson = join(outDir, 'manifest.json');

// ─── Build the chain ───────────────────────────────────────────────────
let chain;
if (ENGINE === 'auto') {
  chain = ['elevenlabs', 'mistral', 'local'];
  if (sceneLanguage === 'no') {
    // Voxtral does not currently support Norwegian (en/fr/es/pt/it/nl/de/hi/ar
    // only). Skip it cleanly so the chain doesn't burn an API request that
    // would render English audio over a Norwegian script.
    chain = chain.filter(e => e !== 'mistral');
  }
} else {
  chain = [ENGINE];
}

const modeStr = ENGINE === 'auto'
  ? `auto (${chain.join(' → ')} → estimated)`
  : (flags.legacy ? `${ENGINE} (legacy per-beat)` : ENGINE);
console.log(`Scene: ${sceneId}`);
console.log(`Mode:  ${modeStr}`);
console.log(`Lang:  ${sceneLanguage}`);
console.log(`Beats with narration: ${beats.length}`);
console.log(`Total characters: ${totalChars}`);

// ─── Dry run ───────────────────────────────────────────────────────────
if (flags['dry-run']) {
  for (const e of chain) {
    console.log(`\n[dry-run] ${e}:`);
    if (e === 'elevenlabs') {
      if (flags.legacy) {
        console.log('  would call ElevenLabs once per beat:');
        for (const b of beats) {
          const fname = `${b.id}.mp3`;
          const exists = existsSync(join(outDir, fname));
          console.log(`    ${b.id.padEnd(20)} ${String(b.narration.length).padStart(4)}ch  →  ${fname}${exists ? '  (exists, would skip)' : ''}`);
        }
      } else {
        console.log('  would make one /with-timestamps call:');
        console.log(`    voice:  ${ELEVENLABS_VOICE}`);
        console.log(`    model:  ${ELEVENLABS_MODEL}`);
        console.log(`    text:   ${totalChars} chars (${beats.length} beats joined with spaces)`);
        console.log(`    output: ${sceneMp3}`);
      }
    } else if (e === 'mistral') {
      const voiceHint = flags.voice || process.env.MISTRAL_VOICE_ID || '(auto-list /v1/audio/voices, pick first English preset)';
      console.log(`  would render each beat via POST ${MISTRAL_BASE}/audio/speech then ffmpeg concat:`);
      console.log(`    model:  ${MISTRAL_MODEL}`);
      console.log(`    voice:  ${voiceHint}`);
      for (const b of beats) {
        console.log(`    ${b.id.padEnd(20)} ${String(b.narration.length).padStart(4)}ch`);
      }
      console.log(`    → concat to ${sceneMp3}`);
    } else {
      const picked = pickLocalBinary(e) || e;
      console.log(`  would render with local engine "${picked}":`);
      for (const b of beats) {
        console.log(`    ${b.id.padEnd(20)} ${String(b.narration.length).padStart(4)}ch  →  ${b.id}.${picked === 'say' ? 'aiff' : 'wav'} (tmp)`);
      }
      console.log(`    → concat to ${sceneMp3}`);
    }
  }
  if (existsSync(sceneMp3)) console.log('\n(scene.mp3 already exists — pass --force to regenerate)');
  process.exit(0);
}

// ─── Cache ─────────────────────────────────────────────────────────────
if (existsSync(sceneMp3) && !flags.force) {
  console.log(`\n✓ scene.mp3 exists — pass --force to regenerate.`);
  process.exit(0);
}

// ─── Run the chain ─────────────────────────────────────────────────────
let result = null;
let winningEngine = null;
for (const engine of chain) {
  console.log(`\n→ Trying engine: ${engine}`);
  try {
    if (engine === 'elevenlabs') {
      result = flags.legacy ? await runElevenLabsLegacy() : await runElevenLabsSingleTrack();
    } else if (engine === 'mistral') {
      result = await runMistral();
    } else {
      result = await runLocal(engine);
    }
    if (result?.ok) {
      winningEngine = engine;
      if (chain.length > 1) console.log(`✓ ${engine} won`);
      break;
    }
  } catch (err) {
    const msg = (err?.message || String(err)).split('\n')[0].slice(0, 240);
    console.warn(`✗ ${engine} failed: ${msg}`);
    if (chain.length > 1) console.warn(`  → falling back to next engine`);
  }
}

if (!result?.ok) {
  console.warn('\n⚠ All audio engines failed. Falling back to estimated timings.');
  console.warn('  The scene will be silent until this script is re-run with');
  console.warn('  ELEVENLABS_API_KEY or MISTRAL_API_KEY set, or with `say`/`espeak-ng`');
  console.warn('  available on PATH.\n');
  result = runFallback();
  winningEngine = 'fallback-estimated';
}

// Cleanup stale per-beat MP3s if the winner is single-file (everything
// except legacy-per-beat which IS per-beat).
if (result.mode !== 'legacy-per-beat') {
  const stale = readdirSync(outDir).filter(f => f.endsWith('.mp3') && f !== 'scene.mp3');
  for (const f of stale) try { unlinkSync(join(outDir, f)); } catch {}
  if (stale.length) console.log(`Removed ${stale.length} legacy per-beat MP3(s).`);
}

printWireUp(result);

// ─── Engines ───────────────────────────────────────────────────────────

async function runElevenLabsSingleTrack() {
  if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

  // Join beats with single space — ElevenLabs handles sentence-final
  // punctuation as a natural pause. Track per-beat character offsets so
  // we can derive audio-time start of each beat from the alignment array.
  const segments = beats.map(b => b.narration.trim());
  const fullText = segments.join(' ');
  const charOffsets = [];
  let cursor = 0;
  for (const s of segments) {
    charOffsets.push(cursor);
    cursor += s.length + 1; // +1 for the joining space (final beat's +1 unused)
  }

  process.stdout.write(`↓ /with-timestamps (${fullText.length} chars) `);
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}/with-timestamps?output_format=${ELEVENLABS_FORMAT}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ text: fullText, model_id: ELEVENLABS_MODEL }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs HTTP ${res.status} — ${errText.slice(0, 200).trim()}`);
  }
  const json = await res.json();
  const audioBuf = Buffer.from(json.audio_base64, 'base64');
  writeFileSync(sceneMp3, audioBuf);
  console.log(`(${(audioBuf.length / 1024).toFixed(0)} KB)`);

  const round2 = v => Math.round(v * 100) / 100;
  const charStarts = json.alignment?.character_start_times_seconds || [];
  const charEnds = json.alignment?.character_end_times_seconds || [];
  const tracks = beats.map((b, i) => {
    const offset = charOffsets[i];
    const audioStart = i === 0 ? 0 : round2(charStarts[offset] ?? 0);
    return { id: b.id, audioStart, narration: segments[i] };
  });
  const totalSec = round2(charEnds[charEnds.length - 1] ?? 0);

  writeFileSync(manifestJson, JSON.stringify({
    sceneId,
    mode: 'single-track',
    engine: 'elevenlabs',
    voice: ELEVENLABS_VOICE,
    model: ELEVENLABS_MODEL,
    audio: `audio/${sceneId}/scene.mp3`,
    durationSec: totalSec,
    tracks,
  }, null, 2) + '\n');

  console.log(`Wrote scene.mp3 (${totalSec}s) and manifest.json to ${outDir}`);
  console.log(`Characters consumed this run: ${fullText.length}`);
  return { ok: true, tracks, totalSec, audio: true, mode: 'single-track' };
}

async function runElevenLabsLegacy() {
  if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

  let charsUsed = 0;
  const tracks = [];
  for (const b of beats) {
    const fname = `${b.id}.mp3`;
    const dest = join(outDir, fname);
    tracks.push({
      id: b.id,
      start: b.start,
      end: b.end,
      src: `audio/${sceneId}/${fname}`,
      narration: b.narration,
    });

    if (existsSync(dest) && !flags.force) {
      console.log(`✓ ${fname} (exists — pass --force to regenerate)`);
      continue;
    }

    process.stdout.write(`↓ ${b.id} (${b.narration.length}ch) `);
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}?output_format=${ELEVENLABS_FORMAT}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({ text: b.narration, model_id: ELEVENLABS_MODEL }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ElevenLabs HTTP ${res.status} ${errText.slice(0, 300)}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    charsUsed += b.narration.length;
    console.log(`(${(buf.length / 1024).toFixed(0)} KB)`);
  }

  writeFileSync(manifestJson, JSON.stringify({
    sceneId,
    mode: 'legacy-per-beat',
    engine: 'elevenlabs',
    voice: ELEVENLABS_VOICE,
    model: ELEVENLABS_MODEL,
    tracks,
  }, null, 2) + '\n');

  console.log(`Wrote ${tracks.length} tracks to ${outDir}`);
  console.log(`Characters consumed this run: ${charsUsed}`);
  // Legacy mode has no single scene.mp3; derive a synthetic totalSec from
  // beat start/end so the wire-up still prints something sensible.
  const totalSec = beats.length ? Math.max(...beats.map(b => b.end || 0)) : 0;
  return { ok: true, tracks, totalSec, audio: true, mode: 'legacy-per-beat' };
}

async function runMistral() {
  if (!MISTRAL_API_KEY) throw new Error('MISTRAL_API_KEY not set');
  if (sceneLanguage === 'no') {
    throw new Error("Voxtral does not support Norwegian (language='no')");
  }
  if (!hasBinary('ffmpeg') || !hasBinary('ffprobe')) {
    throw new Error('ffmpeg + ffprobe required on PATH for mistral concat');
  }

  // Voice resolution: explicit flag > env var > auto-list /v1/audio/voices
  // and pick the first preset tagged English. No documented preset voice
  // catalogue exists in Mistral's public docs as of 2026-05, so we list
  // at runtime — costs one extra GET when neither flag nor env is set.
  let voiceId = flags.voice || process.env.MISTRAL_VOICE_ID || null;
  let voiceSource = voiceId ? (flags.voice ? '--voice flag' : 'MISTRAL_VOICE_ID env') : null;
  if (!voiceId) {
    voiceId = await pickFirstEnglishMistralVoice();
    voiceSource = 'auto-listed /v1/audio/voices';
  }
  console.log(`Engine: mistral (${MISTRAL_MODEL})  Voice: ${voiceId}  via ${voiceSource}`);

  const tmpDir = join(ROOT, '.tmp', 'audio', sceneId);
  mkdirSync(tmpDir, { recursive: true });

  const round2 = v => Math.round(v * 100) / 100;
  const INTER_BEAT_GAP = 0.25;
  const beatFiles = [];
  const tracks = [];
  let cursor = 0;
  let charsUsed = 0;

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const beatPath = join(tmpDir, `${b.id}.mistral.mp3`);
    process.stdout.write(`↓ ${b.id} (${b.narration.length}ch) `);
    const buf = await mistralSynth(b.narration, voiceId);
    writeFileSync(beatPath, buf);
    charsUsed += b.narration.length;
    const dur = round2(probeDuration(beatPath));
    console.log(`(${(buf.length / 1024).toFixed(0)} KB, ${dur}s)`);
    beatFiles.push(beatPath);

    tracks.push({
      id: b.id,
      audioStart: round2(cursor),
      narration: b.narration,
    });
    cursor += dur + (i < beats.length - 1 ? INTER_BEAT_GAP : 0);
  }
  const totalSec = round2(cursor);

  concatBeatsToSceneMp3(tmpDir, beatFiles, INTER_BEAT_GAP, sceneMp3);

  writeFileSync(manifestJson, JSON.stringify({
    sceneId,
    mode: 'mistral',
    engine: 'mistral',
    voice: voiceId,
    model: MISTRAL_MODEL,
    audio: `audio/${sceneId}/scene.mp3`,
    durationSec: totalSec,
    tracks,
  }, null, 2) + '\n');

  for (const f of beatFiles) try { unlinkSync(f); } catch {}

  console.log(`Wrote scene.mp3 (${totalSec}s) and manifest.json to ${outDir}`);
  console.log(`Characters consumed this run: ${charsUsed}`);
  return { ok: true, tracks, totalSec, audio: true, mode: 'mistral' };
}

async function pickFirstEnglishMistralVoice() {
  const url = `${MISTRAL_BASE}/audio/voices?limit=100`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mistral GET /audio/voices HTTP ${res.status} — ${errText.slice(0, 200)}`);
  }
  const json = await res.json();
  // Response shape varies — try a few likely keys.
  const list = Array.isArray(json) ? json : (json.data || json.voices || []);
  if (!list.length) {
    throw new Error('Mistral /audio/voices returned no voices — set MISTRAL_VOICE_ID or pass --voice');
  }
  const englishLike = v => {
    const langs = v.languages || v.language || [];
    if (typeof langs === 'string') return langs.toLowerCase().startsWith('en');
    if (Array.isArray(langs)) return langs.some(l => String(l).toLowerCase().startsWith('en'));
    return false;
  };
  const pick = list.find(englishLike) || list[0];
  const id = pick.voice_id || pick.id;
  if (!id) {
    throw new Error('Mistral /audio/voices entries lack voice_id — set MISTRAL_VOICE_ID or pass --voice');
  }
  return id;
}

async function mistralSynth(text, voiceId) {
  const url = `${MISTRAL_BASE}/audio/speech`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      voice_id: voiceId,
      input: text,
      response_format: 'mp3',
      stream: false,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mistral HTTP ${res.status} — ${errText.slice(0, 200).trim()}`);
  }
  // Mistral docs document `audio_data` (base64) in JSON. Some routes/
  // proxies return raw audio bytes — handle both.
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json')) {
    const json = await res.json();
    const b64 = json.audio_data || json.audio_base64;
    if (!b64) throw new Error('Mistral JSON response missing audio_data field');
    return Buffer.from(b64, 'base64');
  }
  return Buffer.from(await res.arrayBuffer());
}

async function runLocal(requested) {
  const binary = pickLocalBinary(requested);
  if (!binary) {
    if (requested === 'say') throw new Error('`say` not found on PATH (macOS only)');
    if (requested === 'espeak') throw new Error('`espeak-ng`/`espeak` not found on PATH (apt-get install espeak-ng)');
    throw new Error('No local TTS engine available — install `espeak-ng` or run on macOS');
  }
  if (!hasBinary('ffmpeg') || !hasBinary('ffprobe')) {
    throw new Error('ffmpeg + ffprobe required on PATH (brew install ffmpeg)');
  }

  const voice = flags.voice || defaultLocalVoice(binary, sceneLanguage);
  console.log(`Engine: ${binary}${voice ? `   Voice: ${voice}` : '   Voice: (system default)'}`);

  const tmpDir = join(ROOT, '.tmp', 'audio', sceneId);
  mkdirSync(tmpDir, { recursive: true });

  const round2 = v => Math.round(v * 100) / 100;
  const ext = binary === 'say' ? 'aiff' : 'wav';
  // Tiny gap between beats so concatenated speech doesn't run together as
  // one breath. ElevenLabs adds this naturally via punctuation; offline
  // engines tend to clip the trailing silence.
  const INTER_BEAT_GAP = 0.25;
  const beatFiles = [];
  const tracks = [];
  let cursor = 0;

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const beatPath = join(tmpDir, `${b.id}.${ext}`);
    process.stdout.write(`↓ ${b.id} (${b.narration.length}ch) `);
    renderBeatLocal(binary, voice, b.narration, beatPath);
    const dur = round2(probeDuration(beatPath));
    console.log(`(${dur}s)`);
    beatFiles.push(beatPath);

    tracks.push({
      id: b.id,
      audioStart: round2(cursor),
      narration: b.narration,
    });
    cursor += dur + (i < beats.length - 1 ? INTER_BEAT_GAP : 0);
  }
  const totalSec = round2(cursor);

  concatBeatsToSceneMp3(tmpDir, beatFiles, INTER_BEAT_GAP, sceneMp3);

  writeFileSync(manifestJson, JSON.stringify({
    sceneId,
    mode: `local-${binary}`,
    engine: `local-${binary}`,
    voice: voice || null,
    audio: `audio/${sceneId}/scene.mp3`,
    durationSec: totalSec,
    tracks,
  }, null, 2) + '\n');

  for (const f of beatFiles) try { unlinkSync(f); } catch {}

  console.log(`Wrote scene.mp3 (${totalSec}s) and manifest.json to ${outDir}`);
  return { ok: true, tracks, totalSec, audio: true, mode: `local-${binary}` };
}

function runFallback() {
  // Per-beat duration estimate at ~14 chars/sec (measured from real
  // ElevenLabs output) plus 0.3 s inter-beat buffer. No audio file is
  // written; if a previous engine left a stale scene.mp3, drop it so the
  // manifest's fallback-estimated mode matches reality.
  if (existsSync(sceneMp3)) {
    try { unlinkSync(sceneMp3); } catch {}
  }
  const CPS = 14;
  const PAD = 0.3;
  const round2 = v => Math.round(v * 100) / 100;

  let cursor = 0;
  const tracks = beats.map(b => {
    const audioStart = round2(cursor);
    cursor += b.narration.length / CPS + PAD;
    return { id: b.id, audioStart, narration: b.narration };
  });
  const totalSec = round2(cursor - PAD);

  writeFileSync(manifestJson, JSON.stringify({
    sceneId,
    mode: 'fallback-estimated',
    engine: 'fallback-estimated',
    chars: beats.reduce((n, b) => n + b.narration.length, 0),
    durationSec: totalSec,
    tracks,
    note: 'Estimated at 14 chars/sec — no audio file. Re-run with ELEVENLABS_API_KEY or MISTRAL_API_KEY set, or with `say`/`espeak-ng` on PATH, to overwrite with real audio.',
  }, null, 2) + '\n');

  console.log(`Wrote fallback manifest.json (estimated ${totalSec}s) to ${outDir}`);
  return { ok: true, tracks, totalSec, audio: false, mode: 'fallback-estimated' };
}

// ─── Helpers ───────────────────────────────────────────────────────────

function concatBeatsToSceneMp3(tmpDir, beatFiles, gapSec, outMp3) {
  const silencePath = join(tmpDir, '_gap.wav');
  const sil = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'lavfi', '-i', `anullsrc=r=22050:cl=mono`,
    '-t', String(gapSec),
    '-c:a', 'pcm_s16le',
    silencePath,
  ]);
  if (sil.status !== 0) throw new Error('ffmpeg failed to generate silence padding');

  const listPath = join(tmpDir, 'concat.txt');
  const escaped = p => p.replace(/'/g, "'\\''");
  const lines = [];
  for (let i = 0; i < beatFiles.length; i++) {
    lines.push(`file '${escaped(beatFiles[i])}'`);
    if (i < beatFiles.length - 1) lines.push(`file '${escaped(silencePath)}'`);
  }
  writeFileSync(listPath, lines.join('\n') + '\n');

  process.stdout.write(`encoding scene.mp3… `);
  const ff = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', listPath,
    '-c:a', 'libmp3lame', '-b:a', '128k',
    '-ar', '44100',
    outMp3,
  ]);
  if (ff.status !== 0) {
    throw new Error(`ffmpeg concat failed: ${ff.stderr?.toString().slice(0, 500)}`);
  }
  console.log('done');
  try { unlinkSync(silencePath); } catch {}
  try { unlinkSync(listPath); } catch {}
}

function pickLocalBinary(requested) {
  if (requested === 'say') return hasBinary('say') ? 'say' : null;
  if (requested === 'espeak') {
    if (hasBinary('espeak-ng')) return 'espeak-ng';
    if (hasBinary('espeak')) return 'espeak';
    return null;
  }
  // local: auto-detect
  if (hasBinary('say')) return 'say';
  if (hasBinary('espeak-ng')) return 'espeak-ng';
  if (hasBinary('espeak')) return 'espeak';
  return null;
}

function hasBinary(name) {
  // `command -v` is more portable than `which` and respects shell builtins.
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'sh',
    process.platform === 'win32' ? [name] : ['-c', `command -v ${name}`],
    { stdio: 'ignore' });
  return r.status === 0;
}

function defaultLocalVoice(binary, lang) {
  if (binary === 'say') {
    if (lang === 'no') return 'Nora';
    return null; // system default (typically Samantha on en-US machines)
  }
  if (lang === 'no') return 'no';
  return 'en-us';
}

function renderBeatLocal(binary, voice, text, outPath) {
  const args = [];
  if (binary === 'say') {
    if (voice) args.push('-v', voice);
    args.push('-o', outPath, '--', text);
  } else {
    if (voice) args.push('-v', voice);
    args.push('-w', outPath, text);
  }
  const r = spawnSync(binary, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    const err = (r.stderr || '').toString().trim().slice(0, 300);
    throw new Error(`${binary} failed (status ${r.status}): ${err || '(no stderr)'}`);
  }
}

function probeDuration(path) {
  const r = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    path,
  ], { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`ffprobe failed for ${path}: ${(r.stderr || '').toString().slice(0, 200)}`);
  }
  const v = parseFloat(r.stdout.trim());
  if (!isFinite(v) || v <= 0) throw new Error(`ffprobe returned non-positive duration for ${path}`);
  return v;
}

// ─── Wire-up output (engine-agnostic) ──────────────────────────────────
function printWireUp({ tracks, totalSec, audio }) {
  const sceneDur = Math.ceil(totalSec + 0.5);
  const minutes = Math.floor(totalSec / 60);
  const secs = String(Math.round(totalSec % 60)).padStart(2, '0');

  const subjectPrefix = subjectId ? `${subjectId}/` : '';
  const jsxName = manifestEntry?.file || `${sceneId}.jsx`;
  const specName = manifestEntry?.spec || `${sceneId}.spec.json`;

  console.log('\n─── Wire-up — apply these edits ───────────────────────');

  console.log(`\n  motion/${subjectPrefix}${jsxName}`);
  console.log(`    const SCENE_DURATION = ${sceneDur};`);
  if (audio) {
    console.log(`    const NARRATION_AUDIO = 'audio/${sceneId}/scene.mp3';`);
    console.log(`    // Inside <Scene>, at the very top:`);
    console.log(`    <SceneNarration src={NARRATION_AUDIO} />`);
    console.log(`    // <Stage> wrapper — prevent loop restarting audio:`);
    console.log(`    <Stage … loop={false}>`);
  } else {
    console.log(`    // (no <SceneNarration> — no audio yet; keep <Stage> default loop=true)`);
  }
  console.log(`    // Sprite ranges:`);
  for (let i = 0; i < tracks.length; i++) {
    const start = tracks[i].audioStart;
    const end = i + 1 < tracks.length ? tracks[i + 1].audioStart : 'SCENE_DURATION';
    console.log(`      <Sprite start={${start}} end={${end}}>  // ${tracks[i].id}`);
  }

  console.log(`\n  motion/${subjectPrefix}${specName}`);
  console.log(`    duration: ${sceneDur}`);
  console.log(`    beats[].start / end matching the Sprite ranges above`);

  console.log(`\n  motion/scene-manifest.json`);
  console.log(`    duration: ${sceneDur}  (this scene's entry)`);

  console.log(`\n  ui_kits/studio/app.jsx`);
  console.log(`    duration: '${minutes}:${secs}'  (this scene's initialScenes entry)`);
  console.log('────────────────────────────────────────────────────────');
}
