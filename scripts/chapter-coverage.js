#!/usr/bin/env node
// chapter-coverage.js — show which chapters of a subject already have
// scenes in kort-forklart's Supabase project, and which are still empty
// or thin. The nightly authoring agent runs this at the start of every
// run to pick the most under-served chapter as the focus for the run.
//
// Source of truth for the chapter list is Supabase `public.chapters`
// (subject_id + chapter_number is the PK; `public.scenes` references it
// via the `scenes_chapter_fk` composite FK). We deliberately do NOT
// duplicate the chapter list inside this repo — kort-forklart owns it,
// and authoring against a local copy would drift the moment the course
// table is reorganised.
//
// Usage:
//   node scripts/chapter-coverage.js                  # defaults to ade
//   node scripts/chapter-coverage.js ade
//   node scripts/chapter-coverage.js fysikk
//   node scripts/chapter-coverage.js ade --json
//
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env at the repo
// root (same vars publish-scene.js uses). If they're missing, the
// script falls back to local-manifest counts so the nightly agent can
// still see *something* — kort-forklart chapter titles will be absent
// in that mode, flagged in the header.

import { resolve, dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ─── .env loader (mirrors publish-scene.js — no dotenv dep) ──────────────
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
const flags = { json: false };
const positional = [];
for (const a of args) {
  if (a === '--json') flags.json = true;
  else if (a === '--help' || a === '-h') {
    console.log('Usage: node scripts/chapter-coverage.js [subject_id] [--json]');
    process.exit(0);
  } else if (a.startsWith('--')) {
    console.error(`Unknown flag: ${a}`);
    process.exit(1);
  } else positional.push(a);
}
const subjectId = positional[0] || 'ade';

// ─── Env ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseOk = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

// ─── Local manifest fallback / cross-check ───────────────────────────────
const manifestPath = join(ROOT, 'motion', 'scene-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const localScenes = manifest.scenes.filter(s => s.subject_id === subjectId);

// ─── Pull chapters + scenes from Supabase ────────────────────────────────
let chapters = null;     // [{ chapter_number, title?, ... }]
let remoteScenes = null; // [{ id, chapter_number, title }]
let supabaseError = null;

if (supabaseOk) {
  try {
    chapters = await sb(`chapters?subject_id=eq.${encodeURIComponent(subjectId)}&select=*&order=chapter_number.asc`);
    remoteScenes = await sb(`scenes?subject_id=eq.${encodeURIComponent(subjectId)}&select=id,chapter_number,title,topic&order=chapter_number.asc.nullsfirst`);
  } catch (err) {
    supabaseError = err.message;
  }
}

// ─── Build coverage map ──────────────────────────────────────────────────
const scenesByChapter = new Map(); // chapter_number → [{id, title, source, ...}]
const recordScene = (chapterNumber, scene) => {
  const key = Number.isInteger(chapterNumber) ? chapterNumber : null;
  if (!scenesByChapter.has(key)) scenesByChapter.set(key, []);
  scenesByChapter.get(key).push(scene);
};

// Index local manifest entries so we can pair them with remote rows and
// flag mismatches (e.g. local says ch.14, Supabase has ch=NULL because
// the FK null'd it out).
const localById = new Map(localScenes.map(s => [s.id, s]));

// Prefer the remote view (it's what kort-forklart actually exposes), but
// always overlay local-manifest entries so the agent sees scenes that
// exist on disk but haven't been published yet.
const remoteIds = new Set();
if (remoteScenes) {
  for (const s of remoteScenes) {
    const local = localById.get(s.id);
    const localCh = local && Number.isInteger(local.chapter_number)
      ? local.chapter_number
      : null;
    const remoteCh = Number.isInteger(s.chapter_number) ? s.chapter_number : null;
    const mismatch = remoteCh !== localCh;
    recordScene(remoteCh, {
      id: s.id,
      title: s.title,
      topic: s.topic || local?.topic || null,
      source: 'supabase',
      local_chapter: localCh,
      remote_chapter: remoteCh,
      mismatch,
    });
    remoteIds.add(s.id);
  }
}
for (const s of localScenes) {
  if (remoteIds.has(s.id)) continue;
  const ch = Number.isInteger(s.chapter_number) ? s.chapter_number : null;
  recordScene(ch, {
    id: s.id,
    title: s.title,
    topic: s.topic || null,
    source: 'local-only',
    local_chapter: ch,
    remote_chapter: null,
    mismatch: false,
  });
}

// Build the row set: every chapter Supabase knows about, plus any
// "ghost" chapters (referenced by a scene but missing from public.chapters,
// which would have hit the composite FK during publish). Ghost detection
// only runs when we actually have a Supabase chapter list to compare
// against — otherwise every local chapter would falsely look like a ghost.
const rows = [];
if (chapters) {
  const knownChapterNums = new Set(chapters.map(c => c.chapter_number));
  for (const c of chapters) {
    const scenes = scenesByChapter.get(c.chapter_number) || [];
    rows.push({
      chapter_number: c.chapter_number,
      title: c.title || c.name || '(no title)',
      scene_count: scenes.length,
      scenes,
      ghost: false,
    });
  }
  const ghostChapters = [...scenesByChapter.keys()]
    .filter(k => k !== null && !knownChapterNums.has(k))
    .sort((a, b) => a - b);
  for (const n of ghostChapters) {
    const scenes = scenesByChapter.get(n) || [];
    rows.push({
      chapter_number: n,
      title: '(missing in public.chapters — FK will null out)',
      scene_count: scenes.length,
      scenes,
      ghost: true,
    });
  }
} else {
  // Supabase unavailable — synthesise rows from local scenes so the agent
  // still gets a coverage view. Without the canonical chapter list we
  // can't distinguish "missing chapter" from "valid chapter we don't
  // know the title of", so we don't mark anything as ghost.
  const nums = [...scenesByChapter.keys()]
    .filter(k => k !== null)
    .sort((a, b) => a - b);
  for (const n of nums) {
    const scenes = scenesByChapter.get(n) || [];
    rows.push({
      chapter_number: n,
      title: '(unknown — Supabase unavailable)',
      scene_count: scenes.length,
      scenes,
      ghost: false,
    });
  }
}

// Unattached scenes (chapter_number = null)
const unattached = scenesByChapter.get(null) || [];

// Pick the most under-served NON-ghost chapter — that's the agent's
// next-run focus. Ghost chapters are excluded because publishing into
// them will fail until kort-forklart seeds the chapter row.
const candidates = rows
  .filter(r => !r.ghost)
  .slice()
  .sort((a, b) => a.scene_count - b.scene_count || a.chapter_number - b.chapter_number);
const focus = candidates[0] || null;

// ─── Output ──────────────────────────────────────────────────────────────
if (flags.json) {
  console.log(JSON.stringify({
    subject_id: subjectId,
    supabase: supabaseOk && !supabaseError,
    supabase_error: supabaseError,
    chapters: rows,
    unattached_local_scenes: unattached,
    focus,
  }, null, 2));
  process.exit(0);
}

const head = `Chapter coverage — subject_id="${subjectId}"`;
console.log(head);
console.log('─'.repeat(Math.max(head.length, 60)));
if (!supabaseOk) {
  console.log('⚠ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — falling back to local manifest only.');
  console.log('  Chapter titles will be blank. Set the env vars to get the real chapter list.');
  console.log('');
} else if (supabaseError) {
  console.log(`⚠ Supabase query failed: ${supabaseError}`);
  console.log('  Falling back to local manifest. Re-run with env vars fixed to refresh.');
  console.log('');
}

if (rows.length === 0) {
  console.log('No chapters found.');
} else {
  const maxTitle = Math.min(48, Math.max(...rows.map(r => r.title.length), 8));
  console.log(`  ch  ${'title'.padEnd(maxTitle)}  scenes  ids`);
  for (const r of rows) {
    const ids = r.scenes.length === 0
      ? '—'
      : r.scenes.map(s => s.source === 'local-only' ? `${s.id}*` : s.id).join(', ');
    const marker = r.ghost ? '!' : ' ';
    console.log(`${marker} ${String(r.chapter_number).padStart(2)}  ${r.title.padEnd(maxTitle)}  ${String(r.scene_count).padStart(6)}  ${ids}`);
  }
}

if (unattached.length > 0) {
  console.log('');
  console.log('Unattached scenes (chapter_number is NULL) — these need a chapter assigned:');
  for (const s of unattached) {
    const from = s.source === 'supabase' ? 'supabase' : 'local';
    const hint = s.local_chapter !== null && s.source === 'supabase'
      ? `  — local manifest says ch.${s.local_chapter}; the FK probably null'd it out (seed the chapter row, then republish)`
      : '';
    console.log(`  · [${from}] ${s.id} — ${s.title}${hint}`);
    if (s.topic) console.log(`      topic: ${s.topic.slice(0, 100)}${s.topic.length > 100 ? '…' : ''}`);
  }
}

const mismatches = rows.flatMap(r => r.scenes.filter(s => s.mismatch));
if (mismatches.length > 0) {
  console.log('');
  console.log('Local/remote chapter mismatches — manifest and Supabase disagree:');
  for (const s of mismatches) {
    const l = s.local_chapter === null ? '∅' : `ch.${s.local_chapter}`;
    const r = s.remote_chapter === null ? '∅' : `ch.${s.remote_chapter}`;
    console.log(`  · ${s.id}: local=${l}, supabase=${r}`);
  }
  console.log('  Fix the spec.json + manifest (if needed) and re-run `npm run publish <id>` to reconcile.');
}

if (focus) {
  console.log('');
  console.log(`Most under-served chapter: ${focus.chapter_number} — ${focus.title} (${focus.scene_count} scenes)`);
  console.log('Use this as the focus for the next nightly run unless a different chapter is a better topic fit.');
} else {
  console.log('');
  console.log('No focus candidate — Supabase chapter list is empty for this subject. Seed public.chapters first.');
}

if (rows.some(r => r.ghost)) {
  console.log('');
  console.log('! = scene references a chapter_number missing from public.chapters. Seed the row before publishing.');
}
if (rows.some(r => r.scenes.some(s => s.source === 'local-only'))) {
  console.log('* = scene exists in motion/scene-manifest.json but has not been published to Supabase yet.');
}

// ─── Supabase REST helper ────────────────────────────────────────────────
async function sb(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}
