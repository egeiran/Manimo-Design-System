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
  if (a === '--dry-run' || a === '--force' || a === '--legacy') {
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
  console.error('Usage: node scripts/generate-audio.js <scene-id> [--dry-run] [--force] [--legacy] [--voice <id>]');
  process.exit(1);
}

const sceneId = positional[0];
const specPath = join(ROOT, 'motion', `${sceneId}.spec.json`);
if (!existsSync(specPath)) {
  console.error(`Spec not found: ${specPath}`);
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, 'utf8'));

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
if (!apiKey) {
  console.error('Missing ELEVENLABS_API_KEY. Add it to .env or export it in your shell.');
  process.exit(1);
}

if (flags.legacy) {
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
    console.error(`\nfailed: HTTP ${res.status} ${errText.slice(0, 300)}`);
    process.exit(1);
  }
  const json = await res.json();

  // Save audio
  const audioBuf = Buffer.from(json.audio_base64, 'base64');
  writeFileSync(sceneMp3, audioBuf);
  console.log(`(${(audioBuf.length / 1024).toFixed(0)} KB)`);

  // Derive per-beat audio-time offsets from character alignment
  const charStarts = json.alignment?.character_start_times_seconds || [];
  const charEnds   = json.alignment?.character_end_times_seconds   || [];
  const round2 = v => Math.round(v * 100) / 100;

  const tracks = beats.map((b, i) => {
    const offset = charOffsets[i];
    const audioStart = i === 0 ? 0 : round2(charStarts[offset] ?? 0);
    return {
      id: b.id,
      audioStart,
      narration: segments[i],
    };
  });

  const totalSec = round2(charEnds[charEnds.length - 1] ?? 0);
  const manifest = {
    sceneId,
    mode: 'single-track',
    voice: VOICE_ID,
    model: MODEL_ID,
    audio: `audio/${sceneId}/scene.mp3`,
    durationSec: totalSec,
    tracks,
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\nWrote scene.mp3 (${totalSec}s) and manifest.json to ${outDir}`);
  console.log(`Characters consumed this run: ${fullText.length}`);

  // Clean up stray per-beat MP3s left over from legacy runs. Anything in
  // outDir that ends in .mp3 and isn't `scene.mp3` was written by the
  // legacy mode and is no longer referenced — safe to remove.
  const stale = readdirSync(outDir)
    .filter(f => f.endsWith('.mp3') && f !== 'scene.mp3');
  for (const f of stale) unlinkSync(join(outDir, f));
  if (stale.length) console.log(`Removed ${stale.length} legacy per-beat MP3(s).`);

  // Print suggested JSX updates so a single copy/paste wires it up.
  console.log('\n─── Suggested updates for motion/' + sceneId + '.jsx ───');
  console.log(`  const SCENE_DURATION = ${Math.ceil(totalSec + 0.5)};`);
  console.log('');
  console.log(`  // Single continuous narration track (replaces NARRATION_TRACKS).`);
  console.log(`  const NARRATION_AUDIO = 'audio/${sceneId}/scene.mp3';`);
  console.log('');
  console.log(`  // Mount once at the top of <Scene>:`);
  console.log(`  <SceneNarration src={NARRATION_AUDIO} />`);
  console.log('');
  console.log(`  // Sprite start times — match audio-time offsets from manifest.json:`);
  for (const t of tracks) {
    console.log(`    <Sprite start={${t.audioStart}}>  // ${t.id}`);
  }
  console.log('────────────────────────────────────────────────');
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
