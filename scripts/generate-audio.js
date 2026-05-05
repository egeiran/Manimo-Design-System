#!/usr/bin/env node
// generate-audio.js — synthesize narration audio for a scene via the
// ElevenLabs TTS REST API.
//
// Default mode (recommended): single-track. One ElevenLabs `/with-timestamps`
// call generates one continuous MP3 (`scene.mp3`) plus per-character timing
// data, from which we derive the audio-time offset where each beat's
// narration begins. Result feels like a single continuous reading instead
// of five separate clips with restart-y silence between them.
//
// Legacy mode: `--legacy` runs the previous per-beat behavior (one MP3 per
// beat, no timestamps). Kept for partial regenerations and as a fallback.
//
// Usage:
//   node scripts/generate-audio.js spring-oscillation
//   node scripts/generate-audio.js spring-oscillation --dry-run
//   node scripts/generate-audio.js spring-oscillation --force
//   node scripts/generate-audio.js spring-oscillation --voice <voice_id>
//   node scripts/generate-audio.js spring-oscillation --legacy   (per-beat)
//
// Free-tier note: ElevenLabs gives 10 000 characters / month. A 5-beat
// scene is typically 500-700 chars. Single-track mode uses one API call
// per scene (cheaper at the request level), legacy mode uses N calls.
//
// Requires ELEVENLABS_API_KEY in env or .env at the repo root.

import { resolve, dirname, join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';

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
  } else if (a.startsWith('--')) {
    console.error(`Unknown flag: ${a}`);
    process.exit(1);
  } else {
    positional.push(a);
  }
}

if (positional.length !== 1) {
  console.error('Usage: node scripts/generate-audio.js <scene-id> [--dry-run] [--force] [--legacy] [--voice <id>] [--unsafe-narration]');
  process.exit(1);
}

const sceneId = positional[0];
const specPath = join(ROOT, 'motion', `${sceneId}.spec.json`);
if (!existsSync(specPath)) {
  console.error(`Spec not found: ${specPath}`);
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, 'utf8'));

// ─── Pre-flight: refuse formula-shaped narration ────────────────────────
// Per CLAUDE.md hard rule 9, the `narration` field is read verbatim by TTS
// and must be spoken English, not symbols. We catch the most common
// regressions before spending API quota on bad audio. Bypass with
// --unsafe-narration (ONLY when narration genuinely needs a non-prose
// character, e.g. an actual citation).
function checkNarrationIsSpoken(beats) {
  // Unicode chars that occur in math but never in natural speech text.
  const MATH_SYMBOLS = /[√½¼¾⅓⅔²³⁴⁵⁶⁷⁸⁹⁰₀₁₂₃₄₅₆₇₈₉πωθμαβγλΩΔ∫∑∏≈≤≥≠∂±·×÷→⇒⇔]/;
  // "X = " patterns: single Latin letter equation lhs (e.g. "F = ma").
  // Excludes "T equals" (already spoken). Allows "the e equals m c squared"
  // as a corner case — we only flag the equals-sign form.
  const EQUATION = /(^|\W)[A-Za-z]\s*=\s*\S/;
  // "%" is fine in writing but TTS reads it inconsistently — prefer "percent".
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
  console.error('\nRewrite the narration in motion/' + sceneId + '.spec.json');
  console.error('(and mirror in motion/' + sceneId + '.jsx NARRATION array), then re-run.');
  console.error('To bypass (rare cases only): pass --unsafe-narration.');
  process.exit(1);
}

const beats = (spec.beats || []).filter(b => b.narration && b.narration.trim());
if (beats.length === 0) {
  console.error('No beats with non-empty narration in this spec.');
  process.exit(1);
}

const totalChars = beats.reduce((n, b) => n + b.narration.length, 0);
const mode = flags.legacy ? 'legacy (per-beat)' : 'single-track';
console.log(`Scene: ${sceneId}`);
console.log(`Mode:  ${mode}`);
console.log(`Beats with narration: ${beats.length}`);
console.log(`Total characters: ${totalChars}  (free tier = 10 000 / month)`);

// Default voice — `JBFqnCBsd6RMkjVDRZzb` is "George", a calm British male
// from ElevenLabs' default library. Pairs well with the multilingual_v2
// model so Norwegian narration also sounds natural. Override with --voice.
// Some other voices to try: `21m00Tcm4TlvDq8ikWAM` (Rachel, female, US),
// `pNInz6obpgDQGcFmaJgB` (Adam, male, US deep).
const VOICE_ID = flags.voice || 'JBFqnCBsd6RMkjVDRZzb';
const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_FORMAT = 'mp3_44100_128';

const outDir = join(ROOT, 'motion', 'audio', sceneId);
mkdirSync(outDir, { recursive: true });

// ─── Dry run ───────────────────────────────────────────────────────────
if (flags['dry-run']) {
  if (flags.legacy) {
    console.log('\n[dry-run] would call ElevenLabs once per beat:');
    for (const b of beats) {
      const fname = `${b.id}.mp3`;
      const exists = existsSync(join(outDir, fname));
      console.log(`  ${b.id.padEnd(20)} ${String(b.narration.length).padStart(4)}ch  →  ${fname}${exists ? '  (exists, would skip)' : ''}`);
    }
  } else {
    console.log('\n[dry-run] would make one /with-timestamps call:');
    console.log(`  voice:  ${VOICE_ID}`);
    console.log(`  model:  ${MODEL_ID}`);
    console.log(`  text:   ${totalChars} chars (${beats.length} beats joined with spaces)`);
    console.log(`  output: ${join(outDir, 'scene.mp3')}`);
    const sceneExists = existsSync(join(outDir, 'scene.mp3'));
    if (sceneExists) console.log('  (scene.mp3 already exists — pass --force to regenerate)');
  }
  process.exit(0);
}

// ─── Real run ──────────────────────────────────────────────────────────
const apiKey = process.env.ELEVENLABS_API_KEY;

// Legacy per-beat mode requires a working key — there's no useful fallback
// equivalent for that path and it's deprecated anyway.
if (flags.legacy) {
  if (!apiKey) {
    console.error('Missing ELEVENLABS_API_KEY. Add it to .env or export it in your shell.');
    process.exit(1);
  }
  await runLegacyPerBeat();
} else {
  await runSingleTrack();
}

// ─── Single-track mode ─────────────────────────────────────────────────
async function runSingleTrack() {
  const sceneMp3 = join(outDir, 'scene.mp3');
  const manifestPath = join(outDir, 'manifest.json');

  if (existsSync(sceneMp3) && !flags.force) {
    console.log(`✓ scene.mp3 exists — pass --force to regenerate.`);
    process.exit(0);
  }

  // Join beats with single space — ElevenLabs handles sentence-final
  // punctuation as a natural pause. Track per-beat character offsets so
  // we can derive audio-time start of each beat from the alignment array.
  const segments = beats.map(b => b.narration.trim());
  const fullText = segments.join(' ');
  const charOffsets = []; // index where each beat's first char lands
  let cursor = 0;
  for (const s of segments) {
    charOffsets.push(cursor);
    cursor += s.length + 1; // +1 for the joining space (final beat's +1 unused)
  }

  // Try the ElevenLabs API. On any failure (missing key, expired key,
  // quota exhausted, network) fall back to estimated timings — the agent
  // never fails outright; a later re-run with a working key fills in the
  // real audio without changing the wire-up shape.
  const round2 = v => Math.round(v * 100) / 100;
  let json = null;
  let apiError = null;
  if (!apiKey) {
    apiError = 'ELEVENLABS_API_KEY not set';
  } else {
    try {
      process.stdout.write(`↓ /with-timestamps (${fullText.length} chars) `);
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=${OUTPUT_FORMAT}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ text: fullText, model_id: MODEL_ID }),
      });
      if (!res.ok) {
        const errText = await res.text();
        apiError = `HTTP ${res.status} — ${errText.slice(0, 200).trim()}`;
      } else {
        json = await res.json();
      }
    } catch (e) {
      apiError = e.message || String(e);
    }
  }

  if (apiError) {
    console.log(`\n⚠ Audio generation skipped: ${apiError}`);
    console.log('  Falling back to estimated timings (~14 chars/sec). The');
    console.log('  scene will be silent until this script is re-run with a');
    console.log('  working ELEVENLABS_API_KEY.\n');
    return runFallback(segments);
  }

  // Save audio + derive offsets from alignment
  const audioBuf = Buffer.from(json.audio_base64, 'base64');
  writeFileSync(sceneMp3, audioBuf);
  console.log(`(${(audioBuf.length / 1024).toFixed(0)} KB)`);

  const charStarts = json.alignment?.character_start_times_seconds || [];
  const charEnds   = json.alignment?.character_end_times_seconds   || [];

  const tracks = beats.map((b, i) => {
    const offset = charOffsets[i];
    const audioStart = i === 0 ? 0 : round2(charStarts[offset] ?? 0);
    return { id: b.id, audioStart, narration: segments[i] };
  });

  const totalSec = round2(charEnds[charEnds.length - 1] ?? 0);
  writeFileSync(manifestPath, JSON.stringify({
    sceneId,
    mode: 'single-track',
    voice: VOICE_ID,
    model: MODEL_ID,
    audio: `audio/${sceneId}/scene.mp3`,
    durationSec: totalSec,
    tracks,
  }, null, 2) + '\n');

  console.log(`\nWrote scene.mp3 (${totalSec}s) and manifest.json to ${outDir}`);
  console.log(`Characters consumed this run: ${fullText.length}`);

  // Clean up stray per-beat MP3s left over from legacy runs.
  const stale = readdirSync(outDir).filter(f => f.endsWith('.mp3') && f !== 'scene.mp3');
  for (const f of stale) unlinkSync(join(outDir, f));
  if (stale.length) console.log(`Removed ${stale.length} legacy per-beat MP3(s).`);

  printWireUp({ tracks, totalSec, audio: true });
}

// Fallback path used when the ElevenLabs API is unavailable. Estimates each
// beat's narration duration at ~14 chars/sec (measured from real ElevenLabs
// output) plus 0.3 s inter-beat buffer, writes a no-audio manifest, and
// prints a wire-up that omits <SceneNarration> so the scene still plays
// (silently) with sprite timings sized for the eventual audio.
function runFallback(segments) {
  const CPS = 14;          // chars/second — ElevenLabs default ≈ 14
  const PAD = 0.3;         // small breath between beats
  const round2 = v => Math.round(v * 100) / 100;

  let cursor = 0;
  const tracks = beats.map((b, i) => {
    const audioStart = round2(cursor);
    cursor += b.narration.length / CPS + PAD;
    return { id: b.id, audioStart, narration: segments[i] };
  });
  const totalSec = round2(cursor - PAD);

  const manifestPath = join(outDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({
    sceneId,
    mode: 'fallback-estimated',
    chars: segments.reduce((n, s) => n + s.length, 0),
    durationSec: totalSec,
    tracks,
    note: 'Estimated at 14 chars/sec — no audio file. Re-run with ELEVENLABS_API_KEY set to overwrite with real audio.',
  }, null, 2) + '\n');

  console.log(`Wrote fallback manifest.json (estimated ${totalSec}s) to ${outDir}`);
  printWireUp({ tracks, totalSec, audio: false });
}

// Print the four-file wire-up the caller (human or agent) needs to apply.
// `audio: true` means a real scene.mp3 exists — include <SceneNarration>
// and `loop={false}`. `audio: false` means estimated only — skip those.
function printWireUp({ tracks, totalSec, audio }) {
  const sceneDur = Math.ceil(totalSec + 0.5);
  const minutes = Math.floor(totalSec / 60);
  const secs = String(Math.round(totalSec % 60)).padStart(2, '0');

  console.log('\n─── Wire-up — apply these edits ───────────────────────');

  console.log(`\n  motion/${sceneId}.jsx`);
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

  console.log(`\n  motion/${sceneId}.spec.json`);
  console.log(`    duration: ${sceneDur}`);
  console.log(`    beats[].start / end matching the Sprite ranges above`);

  console.log(`\n  motion/scene-manifest.json`);
  console.log(`    duration: ${sceneDur}  (this scene's entry)`);

  console.log(`\n  ui_kits/studio/app.jsx`);
  console.log(`    duration: '${minutes}:${secs}'  (this scene's initialScenes entry)`);
  console.log('────────────────────────────────────────────────────────');
}

// ─── Legacy per-beat mode ──────────────────────────────────────────────
async function runLegacyPerBeat() {
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
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({ text: b.narration, model_id: MODEL_ID }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`\nfailed: HTTP ${res.status} ${errText.slice(0, 300)}`);
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    charsUsed += b.narration.length;
    console.log(`(${(buf.length / 1024).toFixed(0)} KB)`);
  }

  const manifestPath = join(outDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({
    sceneId,
    mode: 'legacy-per-beat',
    voice: VOICE_ID,
    model: MODEL_ID,
    tracks,
  }, null, 2) + '\n');

  console.log(`\nWrote ${tracks.length} tracks to ${outDir}`);
  console.log(`Characters consumed this run: ${charsUsed}`);
}
