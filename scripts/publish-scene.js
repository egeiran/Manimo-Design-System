#!/usr/bin/env node
// publish-scene.js — upsert a Manimo scene's metadata into the kort-forklart
// Supabase project. The scene itself is served as live HTML from GitHub Pages
// (no MP4 upload, no Storage bucket).
//
// For each scene we upsert a row in `public.scenes` with a `scene_url` that
// embeds the live HTML at https://egeiran.github.io/Manimo-Design-System/
// motion/<id>.html?embed=1. Re-publishing the same id is safe (merge-duplicates
// on the primary key).
//
// Usage:
//   node scripts/publish-scene.js damped-oscillation
//   node scripts/publish-scene.js all
//   node scripts/publish-scene.js damped-oscillation --dry-run
//
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env at the repo root.
// (Service role only — never bundle this in any client app.)

import { resolve, dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Live-HTML host. Update if Pages moves to a custom domain.
const SCENE_BASE_URL = 'https://egeiran.github.io/Manimo-Design-System/motion';

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
  if (a === '--dry-run') flags['dry-run'] = true;
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

console.log(`Target:   ${SUPABASE_URL || '(dry-run)'}`);
console.log(`Host:     ${SCENE_BASE_URL}`);
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
  const {
    id, html, title, eyebrow, topic, language, duration, prerequisites, concepts,
    subject_id, chapter_number,
  } = scene;
  console.log(`── ${id}`);

  const sceneUrl = `${SCENE_BASE_URL}/${html}?embed=1`;
  const hasAudio = existsSync(join(ROOT, 'motion', 'audio', id, 'scene.mp3'));
  const subjectId = subject_id ?? null;
  const chapterNumber = Number.isInteger(chapter_number) ? chapter_number : null;
  const attach = subjectId === null
    ? '(unattached)'
    : `${subjectId}${chapterNumber === null ? '' : ` ch.${chapterNumber}`}`;

  if (flags['dry-run']) {
    console.log(`  (dry-run) row: ${title} (${language}, ${duration}s, audio=${hasAudio}, ${attach})`);
    console.log(`  (dry-run) scene_url: ${sceneUrl}`);
    return;
  }

  await validateAttachment(subjectId, chapterNumber);

  await upsertRow({
    id,
    title,
    eyebrow: eyebrow || null,
    topic: topic || null,
    language,
    duration_seconds: duration,
    prerequisites: prerequisites || [],
    concepts: concepts || [],
    scene_url: sceneUrl,
    has_audio: hasAudio,
    subject_id: subjectId,
    chapter_number: chapterNumber,
    updated_at: new Date().toISOString(),
  });
  console.log(`  ✓ row upserted (${sceneUrl}) [${attach}]`);
}

// ─── Validation (warn-only, skipped in --dry-run) ────────────────────────
async function validateAttachment(subjectId, chapterNumber) {
  if (!subjectId) return;
  try {
    const subjUrl = `${SUPABASE_URL}/rest/v1/subjects?id=eq.${encodeURIComponent(subjectId)}&select=id`;
    const subjRes = await fetch(subjUrl, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (subjRes.ok) {
      const rows = await subjRes.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        console.warn(`  ⚠ subject_id "${subjectId}" not found in public.subjects — row will still upsert (FK is ON DELETE SET NULL)`);
      }
    }
    if (chapterNumber !== null) {
      const chUrl = `${SUPABASE_URL}/rest/v1/chapters?subject_id=eq.${encodeURIComponent(subjectId)}&chapter_number=eq.${chapterNumber}&select=chapter_number`;
      const chRes = await fetch(chUrl, {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      if (chRes.ok) {
        const rows = await chRes.json();
        if (!Array.isArray(rows) || rows.length === 0) {
          console.warn(`  ⚠ (${subjectId}, ch.${chapterNumber}) not found in public.chapters — composite FK will null-out the link`);
        }
      }
    }
  } catch (err) {
    console.warn(`  ⚠ validation skipped: ${err.message}`);
  }
}

// ─── Supabase REST ───────────────────────────────────────────────────────
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
