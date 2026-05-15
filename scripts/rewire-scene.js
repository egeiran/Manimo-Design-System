#!/usr/bin/env node
// rewire-scene.js — after audio regen, push the new audioStart/durationSec
// values into every place that holds the old ones:
//   motion/<subj>/<id>.jsx           SCENE_DURATION + introEnd + Sprite start/end
//   motion/<subj>/<id>.spec.json     duration + beats[].start / end
//   motion/scene-manifest.json       this scene's duration
//   ui_kits/studio/app.jsx           initialScenes entry duration (live-<id>)
//
// Beat ordering: spec.beats[i].id maps to audio manifest tracks[i].id
// (we sanity-check this). beats[i].start = audioStart[i], beats[i].end =
// audioStart[i+1] (or SCENE_DURATION for the last one). SCENE_DURATION =
// ceil(audioDur + tailBuffer).
//
// Usage:
//   node scripts/rewire-scene.js <scene-id> [--tail 1.0] [--dry-run]

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let sceneId = null;
let tail = 1.0;
let dryRun = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--tail') tail = parseFloat(args[++i]);
  else if (args[i] === '--dry-run') dryRun = true;
  else sceneId = args[i];
}
if (!sceneId) {
  console.error('Usage: node scripts/rewire-scene.js <scene-id> [--tail 1.0] [--dry-run]');
  process.exit(1);
}

const sceneManifestPath = join(ROOT, 'motion', 'scene-manifest.json');
const sceneManifest = JSON.parse(readFileSync(sceneManifestPath, 'utf8'));
const sceneEntry = sceneManifest.scenes.find(s => s.id === sceneId);
if (!sceneEntry) { console.error(`scene ${sceneId} not in manifest`); process.exit(1); }

const subj = sceneEntry.subject_id || 'fysikk';
const jsxPath = join(ROOT, 'motion', subj, sceneEntry.file);
const specPath = join(ROOT, 'motion', subj, sceneEntry.spec);
const audioManPath = join(ROOT, 'motion', subj, 'audio', sceneId, 'manifest.json');
const studioPath = join(ROOT, 'ui_kits', 'studio', 'app.jsx');

const audioMan = JSON.parse(readFileSync(audioManPath, 'utf8'));
const audioDur = audioMan.durationSec;
const tracks = audioMan.tracks;
const newDuration = Math.ceil(audioDur + tail);

console.log(`scene: ${sceneId}  audio=${audioDur}s  →  SCENE_DURATION=${newDuration}  (tail ${(newDuration - audioDur).toFixed(2)}s)`);

const spec = JSON.parse(readFileSync(specPath, 'utf8'));
if (spec.beats.length !== tracks.length) {
  console.error(`!! spec has ${spec.beats.length} beats, audio has ${tracks.length} tracks. Aborting.`);
  process.exit(1);
}
for (let i = 0; i < spec.beats.length; i++) {
  if (spec.beats[i].id !== tracks[i].id) {
    console.error(`!! beat id mismatch at index ${i}: spec=${spec.beats[i].id} audio=${tracks[i].id}. Aborting.`);
    process.exit(1);
  }
}

// New start/end for each beat
const oldStarts = spec.beats.map(b => b.start);
const oldEnds = spec.beats.map(b => b.end);
const newStarts = tracks.map(t => t.audioStart);
const newEnds = newStarts.map((s, i) => i === newStarts.length - 1 ? newDuration : newStarts[i + 1]);
const oldDuration = spec.duration;

console.log('  beats:');
for (let i = 0; i < spec.beats.length; i++) {
  console.log(`    ${spec.beats[i].id.padEnd(20)} ${oldStarts[i]}→${newStarts[i]}  ..  ${oldEnds[i]}→${newEnds[i]}`);
}
console.log(`  duration: ${oldDuration} → ${newDuration}`);

if (dryRun) { console.log('(dry-run — no writes)'); process.exit(0); }

// ── 1. spec.json ───────────────────────────────────────────────────────
for (let i = 0; i < spec.beats.length; i++) {
  spec.beats[i].start = newStarts[i];
  spec.beats[i].end = newEnds[i];
}
spec.duration = newDuration;
writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n');
console.log(`  wrote ${specPath.replace(ROOT + '/', '')}`);

// ── 2. scene-manifest.json ─────────────────────────────────────────────
sceneEntry.duration = newDuration;
writeFileSync(sceneManifestPath, JSON.stringify(sceneManifest, null, 2) + '\n');
console.log(`  wrote motion/scene-manifest.json (duration ${oldDuration}→${newDuration})`);

// ── 3. ui_kits/studio/app.jsx ──────────────────────────────────────────
let studio = readFileSync(studioPath, 'utf8');
const studioRe = new RegExp(`(\\{[^}]*id:\\s*'live-${sceneId}'[^}]*duration:\\s*)(\\d+(?:\\.\\d+)?)([^}]*\\})`, 'g');
let studioHits = 0;
const newStudio = studio.replace(studioRe, (_m, before, _num, after) => { studioHits++; return `${before}${newDuration}${after}`; });
if (studioHits === 0) console.log(`  (no live-${sceneId} entry in studio app.jsx — skipping)`);
else { writeFileSync(studioPath, newStudio); console.log(`  wrote ui_kits/studio/app.jsx (${studioHits} hit)`); }

// ── 4. <id>.jsx — the gnarly one ───────────────────────────────────────
let jsx = readFileSync(jsxPath, 'utf8');

// SCENE_DURATION constant
const sdRe = /(const\s+SCENE_DURATION\s*=\s*)(\d+(?:\.\d+)?)/;
if (!sdRe.test(jsx)) { console.error(`!! no SCENE_DURATION in ${jsxPath}`); process.exit(1); }
jsx = jsx.replace(sdRe, `$1${newDuration}`);

// introEnd={X}  → first beat's NEW start (i.e., when intro ends and first
// content beat begins). For most scenes this is newStarts[1] (intro is
// beat 0). If introEnd doesn't match oldStarts[1], we leave it alone.
const introRe = /(introEnd=\{)([\d.]+)(\})/;
const introMatch = jsx.match(introRe);
if (introMatch) {
  const introVal = parseFloat(introMatch[2]);
  const idx = oldStarts.indexOf(introVal);
  if (idx >= 0) {
    const replacement = newStarts[idx];
    jsx = jsx.replace(introRe, `$1${replacement}$3`);
    console.log(`  introEnd ${introVal} → ${replacement}`);
  } else {
    console.log(`  introEnd ${introVal} not in oldStarts — left as-is`);
  }
}

// <Sprite start={A} end={B}>   — replace each occurrence by mapping
// (A,B) → (newStarts[i], newEnds[i] or SCENE_DURATION literal).
// Some Sprites have end={SCENE_DURATION} which is fine to keep.
const spriteRe = /(<Sprite\s+start=\{)([\d.]+)(\}\s+end=\{)([\d.]+|SCENE_DURATION)(\})/g;
let spriteHits = 0;
jsx = jsx.replace(spriteRe, (_m, p1, sStr, p2, eStr, p3) => {
  const s = parseFloat(sStr);
  const idx = oldStarts.indexOf(s);
  if (idx < 0) {
    console.log(`  !! Sprite start={${sStr}} doesn't match any beat start — leaving alone`);
    return _m;
  }
  spriteHits++;
  const newS = newStarts[idx];
  let newE;
  if (eStr === 'SCENE_DURATION') newE = 'SCENE_DURATION';
  else {
    const e = parseFloat(eStr);
    const eIdx = oldEnds.indexOf(e);
    if (eIdx < 0) {
      console.log(`  !! Sprite end={${eStr}} doesn't match any beat end — using newEnds[${idx}]=${newEnds[idx]}`);
      newE = newEnds[idx];
    } else {
      newE = newEnds[eIdx];
    }
  }
  return `${p1}${newS}${p2}${newE}${p3}`;
});
console.log(`  Sprite blocks updated: ${spriteHits}`);

writeFileSync(jsxPath, jsx);
console.log(`  wrote ${jsxPath.replace(ROOT + '/', '')}`);
console.log('done.');
