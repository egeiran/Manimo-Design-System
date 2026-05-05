#!/usr/bin/env node
// dev-server.js — local dev server for the Manimo studio.
//
// Serves the repo as static files (drop-in replacement for `npx serve .`)
// and adds a small notes API the Studio uses to save screenshot+comment
// pairs back into the repo. Notes land in motion/<sceneId>.notes/ as a
// human + AI-readable notes.md plus numbered PNGs.
//
// Usage:
//   npm run dev          → http://localhost:3000
//   PORT=4000 npm run dev

import { createServer } from 'http';
import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname, join, extname, normalize, sep } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MOTION_DIR = join(ROOT, 'motion');
const PORT = parseInt(process.env.PORT || '3000', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.jsx':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.pdf':  'application/pdf',
  '.txt':  'text/plain; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function safeJoin(root, urlPath) {
  // Strip query string, decode, normalize, and reject anything that escapes root.
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const joined = normalize(join(root, decoded));
  if (!joined.startsWith(root + sep) && joined !== root) return null;
  return joined;
}

function jsonResponse(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req, limitBytes = 25 * 1024 * 1024) {
  const chunks = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > limitBytes) throw new Error('payload too large');
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

// ─── Notes API ───────────────────────────────────────────────────────────

// Map sceneId → notes directory and ensure it exists.
async function notesDirFor(sceneId) {
  if (!/^[a-z0-9][a-z0-9_-]{0,80}$/i.test(sceneId)) {
    throw new Error('invalid sceneId');
  }
  const dir = join(MOTION_DIR, `${sceneId}.notes`);
  await mkdir(dir, { recursive: true });
  return dir;
}

function fmtDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fmtSceneTime(t) {
  // 12.4 → "12.4s"; 0.05 → "0.1s"; round to 1dp
  const n = Math.max(0, Number(t) || 0);
  return `${(Math.round(n * 10) / 10).toFixed(1)}s`;
}

async function nextNoteIndex(dir) {
  const entries = await readdir(dir).catch(() => []);
  let max = 0;
  for (const e of entries) {
    const m = e.match(/^(\d{3,})-/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

async function listNotes(sceneId) {
  const dir = await notesDirFor(sceneId);
  const entries = await readdir(dir).catch(() => []);
  const byIdx = new Map();
  for (const name of entries) {
    const m = name.match(/^(\d{3,})-t([\d.]+)s\.(png|json)$/);
    if (!m) continue;
    const idx = parseInt(m[1], 10);
    const rec = byIdx.get(idx) || { id: m[1], timeSec: parseFloat(m[2]) };
    if (m[3] === 'png') rec.image = name;
    if (m[3] === 'json') {
      const meta = JSON.parse(await readFile(join(dir, name), 'utf8'));
      Object.assign(rec, meta);
    }
    byIdx.set(idx, rec);
  }
  return [...byIdx.values()].sort((a, b) => a.timeSec - b.timeSec);
}

async function rebuildNotesMd(sceneId) {
  const dir = await notesDirFor(sceneId);
  const notes = await listNotes(sceneId);
  const lines = [`# Notes — ${sceneId}`, ''];
  if (!notes.length) {
    lines.push('_No notes yet._', '');
  } else {
    for (const n of notes) {
      lines.push(`## ${n.id} — t=${fmtSceneTime(n.timeSec)} — ${n.createdAt || ''}`);
      lines.push('');
      if (n.image) lines.push(`![](${n.image})`);
      lines.push('');
      lines.push((n.text || '').trim() || '_(no comment)_');
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }
  await writeFile(join(dir, 'notes.md'), lines.join('\n'));
}

async function createNote({ sceneId, timeSec, imageDataUrl, text }) {
  const dir = await notesDirFor(sceneId);
  const idx = await nextNoteIndex(dir);
  const id = String(idx).padStart(3, '0');
  const stem = `${id}-t${fmtSceneTime(timeSec).replace('s', '')}s`;

  // Decode data: URL → buffer
  const m = String(imageDataUrl || '').match(/^data:image\/png;base64,(.+)$/);
  if (!m) throw new Error('imageDataUrl must be a base64 PNG data URL');
  const png = Buffer.from(m[1], 'base64');
  await writeFile(join(dir, `${stem}.png`), png);

  const meta = {
    id,
    timeSec: Number(timeSec) || 0,
    text: String(text || ''),
    createdAt: fmtDate(),
  };
  await writeFile(join(dir, `${stem}.json`), JSON.stringify(meta, null, 2));
  await rebuildNotesMd(sceneId);
  return { ...meta, image: `${stem}.png` };
}

// ─── Static file serving ─────────────────────────────────────────────────

async function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = safeJoin(ROOT, urlPath);
  if (!filePath) { res.writeHead(403); res.end('forbidden'); return; }

  try {
    const st = await stat(filePath);
    if (st.isDirectory()) {
      const idx = join(filePath, 'index.html');
      if (existsSync(idx)) return serveStaticFile(idx, res);
      res.writeHead(404); res.end('not found'); return;
    }
    return serveStaticFile(filePath, res);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}

async function serveStaticFile(filePath, res) {
  const ext = extname(filePath).toLowerCase();
  const buf = await readFile(filePath);
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'cache-control': 'no-cache',
  });
  res.end(buf);
}

// ─── Router ──────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/api/notes') {
      if (req.method === 'GET') {
        const sceneId = url.searchParams.get('sceneId') || '';
        const notes = await listNotes(sceneId);
        return jsonResponse(res, 200, { notes });
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const note = await createNote(body);
        return jsonResponse(res, 201, { note });
      }
      res.writeHead(405); res.end('method not allowed'); return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405); res.end('method not allowed'); return;
    }
    return serveStatic(req, res);
  } catch (err) {
    console.error('[dev-server]', err);
    if (!res.headersSent) jsonResponse(res, 400, { error: err.message });
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Manimo dev server: http://localhost:${PORT}/`);
  console.log(`  Studio:   http://localhost:${PORT}/ui_kits/studio/`);
  console.log(`  Watch:    http://localhost:${PORT}/ui_kits/watch/`);
  console.log(`  Preview:  http://localhost:${PORT}/preview/`);
});
