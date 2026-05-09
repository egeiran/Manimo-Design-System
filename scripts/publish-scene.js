#!/usr/bin/env node
// publish-scene.js — upload a Manimo scene's rendered video + metadata to
// the kort-forklart Supabase project.
//
// For each scene:
//   1. Verifies renders/<id>.mp4 exists (run `npm run render` first if not)
//   2. Extracts a poster JPG from ~1/3 into the video via ffmpeg
//   3. Uploads <id>/video.mp4 + <id>/poster.jpg to the public `scenes` bucket
//   4. Upserts a row in the `scenes` table with metadata + public URLs
//
// Re-publishing the same scene is safe: storage uploads use x-upsert and the
// SQL upsert merges on the id primary key, so it just refreshes the files.
//
// Usage:
//   node scripts/publish-scene.js damped-oscillation
//   node scripts/publish-scene.js all
//   node scripts/publish-scene.js damped-oscillation --dry-run
//
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env at the repo root.
// (Service role only — never bundle this in any client app.)

import { resolve, dirname, join } from 'path';
import { mkdirSync, existsSync, readFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUCKET = 'scenes';

// ─── .env loader (mirrors generate-audio.js — repo avoids dotenv dep) ────
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

// ─── CLI ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {};
const positional = [];
for (const a of args) {
  if (a === '--dry-run' || a === '--force') flags[a.slice(2)] = true;
  else if (a.startsWith('--')) {
    console.error(`Unknown flag: ${a}`);
    process.exit(1);
  } else positional.push(a);
}
if (positional.length !== 1) {
  console.error('Usage: node scripts/publish-scene.js <scene-id|all> [--dry-run]');
  process.exit(1);
}

// ─── Env ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!flags['dry-run'] && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Add them to .env at the repo root (see .env.example).');
  process.exit(1);
}

// ─── Manifest lookup ─────────────────────────────────────────────────────
const manifestPath = join(ROOT, 'motion', 'scene-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const target = positional[0];
const scenes = target === 'all'
  ? manifest.scenes
  : manifest.scenes.filter(s => s.id === target);
if (scenes.length === 0) {
  console.error(`Scene id "${target}" not found in motion/scene-manifest.json.`);
  console.error('Known ids: ' + manifest.scenes.map(s => s.id).join(', '));
  process.exit(1);
}

// ─── ffmpeg presence (poster extraction) ────────────────────────────────
if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
  console.error('ffmpeg not found on PATH. Install with: brew install ffmpeg');
  process.exit(1);
}

console.log(`Target:   ${SUPABASE_URL || '(dry-run)'}`);
console.log(`Bucket:   ${BUCKET}`);
console.log(`Scenes:   ${scenes.map(s => s.id).join(', ')}`);
console.log('');

let failures = 0;
for (const scene of scenes) {
  try {
    await publishOne(scene);
  } catch (err) {
    failures++;
    console.error(`  ✗ ${scene.id}: ${err.message}`);
  }
}

if (failures > 0) {
  console.error(`\nDone with ${failures} failure(s).`);
  process.exit(1);
}
console.log('\nDone.');

// ─── per-scene ───────────────────────────────────────────────────────────
async function publishOne(scene) {
  const { id, title, eyebrow, topic, language, duration, prerequisites, concepts } = scene;
  console.log(`── ${id}`);

  const videoPath = join(ROOT, 'renders', `${id}.mp4`);
  if (!existsSync(videoPath)) {
    throw new Error(`renders/${id}.mp4 not found. Run: npm run render motion/${scene.html}`);
  }

  // Poster: pick a frame ~1/3 into the scene to skip the empty intro beat.
  const posterDir = join(ROOT, '.tmp', 'publish', id);
  mkdirSync(posterDir, { recursive: true });
  const posterPath = join(posterDir, 'poster.jpg');
  const posterTime = Math.max(0.5, Math.min(duration - 0.5, duration / 3));
  const ff = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', String(posterTime),
    '-i', videoPath,
    '-vframes', '1',
    '-q:v', '3',
    posterPath,
  ], { stdio: 'inherit' });
  if (ff.status !== 0) throw new Error('ffmpeg failed to extract poster frame');

  const hasAudio = existsSync(join(ROOT, 'motion', 'audio', id, 'scene.mp3'));
  const videoSizeMB = (statSize(videoPath) / 1e6).toFixed(1);
  const posterSizeKB = (statSize(posterPath) / 1024).toFixed(0);

  if (flags['dry-run']) {
    console.log(`  (dry-run) video.mp4 ${videoSizeMB} MB + poster.jpg ${posterSizeKB} KB`);
    console.log(`  (dry-run) row: ${title} (${language}, ${duration}s, audio=${hasAudio})`);
    return;
  }

  const videoKey = `${id}/video.mp4`;
  const posterKey = `${id}/poster.jpg`;
  await uploadFile(videoKey, videoPath, 'video/mp4');
  await uploadFile(posterKey, posterPath, 'image/jpeg');
  console.log(`  ✓ uploaded ${videoKey} (${videoSizeMB} MB) + ${posterKey} (${posterSizeKB} KB)`);

  await upsertRow({
    id,
    title,
    eyebrow: eyebrow || null,
    topic: topic || null,
    language,
    duration_seconds: duration,
    prerequisites: prerequisites || [],
    concepts: concepts || [],
    video_url: publicUrl(videoKey),
    poster_url: publicUrl(posterKey),
    has_audio: hasAudio,
    updated_at: new Date().toISOString(),
  });
  console.log(`  ✓ row upserted`);
}

// ─── Supabase REST helpers ───────────────────────────────────────────────
async function uploadFile(key, path, contentType) {
  const body = readFileSync(path);
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`storage upload failed (${res.status}): ${text}`);
  }
}

async function upsertRow(row) {
  const url = `${SUPABASE_URL}/rest/v1/scenes`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`scenes upsert failed (${res.status}): ${text}`);
  }
}

function publicUrl(key) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

function statSize(p) { try { return statSync(p).size; } catch { return 0; } }
