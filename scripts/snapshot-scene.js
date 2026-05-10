#!/usr/bin/env node
// snapshot-scene.js — render a Manimo scene to PNG frames at chosen timestamps.
//
// Loads motion/<id>.html in headless Chromium (1280×720), seeks the Stage's
// timeline to N timestamps via the window.__manimoStage handle, and saves
// PNGs to .tmp/snapshots/<id>/. Output filenames are printed to stdout so an
// agent can pipe them straight into Read for vision-based review.
//
// Usage:
//   node scripts/snapshot-scene.js motion/hoop-disk.html
//     → auto: one PNG per beat (midpoint) using motion/hoop-disk.spec.json
//
//   node scripts/snapshot-scene.js motion/hoop-disk.html --times 1.5,5,12,20
//     → explicit timestamps
//
//   node scripts/snapshot-scene.js motion/hoop-disk.html --frames 5
//     → 5 evenly-spaced snapshots across the scene's duration
//
//   node scripts/snapshot-scene.js motion/hoop-disk.html --out custom/dir
//     → override output directory
//
// Requires: npm install (installs playwright). On first run after install,
// playwright's postinstall fetches chromium (~150 MB).

import { resolve, dirname, basename, join, relative } from 'path';
import { mkdirSync, existsSync, readFileSync, statSync, writeFileSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { ensureBrowsers } from './ensure-browsers.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// If the cached chromium-headless-shell revision doesn't match what this
// Playwright expects, lay down a /tmp shim and point Playwright at it.
// No-op when the caches already match.
const shimRoot = ensureBrowsers();
if (shimRoot && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = shimRoot;
}

// ─── CLI parsing ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
}
// Positional = anything that's neither a --flag nor the value immediately
// following one. Without this, `--times 9.0` makes "9.0" look positional.
const FLAGS_WITH_VALUE = new Set(['times', 'frames', 'out']);
const BOOLEAN_FLAGS = new Set(['portrait']);
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    if (FLAGS_WITH_VALUE.has(a.slice(2))) i++;
    continue;
  }
  positional.push(a);
}
const PORTRAIT = args.includes('--portrait');

if (positional.length !== 1) {
  console.error('Usage: node scripts/snapshot-scene.js <scene.html> [--times t1,t2,…] [--frames N] [--out dir]');
  process.exit(1);
}

const htmlPath = resolve(positional[0]);
if (!existsSync(htmlPath)) {
  console.error(`File not found: ${htmlPath}`);
  process.exit(1);
}

const sceneId = basename(htmlPath, '.html');
const explicitTimes = flag('times');
const frameCount = flag('frames');
const outDir = resolve(flag('out') || join(ROOT, '.tmp', 'snapshots', sceneId));

// ─── Determine timestamps ────────────────────────────────────────────────
function loadSpec(id) {
  // Spec lives next to the html file (motion/<subject>/<id>.spec.json or
  // legacy motion/<id>.spec.json).
  const specPath = join(dirname(htmlPath), `${id}.spec.json`);
  if (!existsSync(specPath)) return null;
  try { return JSON.parse(readFileSync(specPath, 'utf8')); }
  catch (e) { console.warn(`Spec exists but failed to parse: ${e.message}`); return null; }
}

let snapshots; // [{label, t}]
if (explicitTimes) {
  const ts = explicitTimes.split(',').map(s => parseFloat(s.trim())).filter(isFinite);
  snapshots = ts.map(t => ({ label: `t${t.toFixed(1).replace('.', '_')}`, t }));
} else {
  const spec = loadSpec(sceneId);
  if (spec && Array.isArray(spec.beats)) {
    snapshots = spec.beats
      .filter(b => typeof b.start === 'number' && typeof b.end === 'number' && b.end > b.start)
      .map(b => ({ label: b.id || `t${((b.start + b.end) / 2).toFixed(1)}`, t: (b.start + b.end) / 2 }));
  } else if (frameCount) {
    const n = Math.max(1, parseInt(frameCount, 10));
    // Need duration — pull from spec if any, else fall back to 20s
    const dur = (spec && spec.duration) || 20;
    snapshots = Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n * dur;
      return { label: `frame${i + 1}`, t };
    });
  } else {
    console.error('No spec found and no --times or --frames given. Provide one.');
    process.exit(1);
  }
}

if (snapshots.length === 0) {
  console.error('No timestamps to capture.');
  process.exit(1);
}

// ─── Playwright ──────────────────────────────────────────────────────────
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('playwright is not installed. Run: npm install');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

// --allow-file-access-from-files lets Babel-standalone XHR-load the
// <script type="text/babel" src="..."> jsx files from file:// without
// hitting CORS. --disable-web-security relaxes the same-origin check
// for the file:// document. Both are needed for snapshot runs only.
const browser = await chromium.launch({
  headless: true,
  args: ['--allow-file-access-from-files', '--disable-web-security'],
});
const context = await browser.newContext({
  viewport: PORTRAIT ? { width: 720, height: 1280 } : { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

// Surface scene-side errors so we don't silently produce a blank PNG.
page.on('pageerror', err => console.error(`[scene error] ${err.message}`));
page.on('console', msg => {
  if (msg.type() === 'error') console.error(`[console] ${msg.text()}`);
});

// If motion/vendor/ has been populated by `npm run vendor`, rewrite the
// scene's HTML to point its <script src=…unpkg.com…> tags at the local
// copies and load that rewritten copy instead. Lets the snapshot run in
// sandboxed environments where unpkg is firewalled. The committed HTML
// is never modified — the rewrite lives in a sibling temp file that's
// deleted before exit.
const VENDOR_DIR = join(ROOT, 'motion', 'vendor');
const VENDOR_FILES = {
  'react@18.3.1/umd/react.development.js':            'react.development.js',
  'react-dom@18.3.1/umd/react-dom.development.js':    'react-dom.development.js',
  '@babel/standalone@7.29.0/babel.min.js':            'babel.min.js',
};
const vendorReady = Object.values(VENDOR_FILES)
  .every(f => existsSync(join(VENDOR_DIR, f)));

let loadPath = htmlPath;
let tempHtmlPath = null;
if (vendorReady) {
  // Compute the relative path from the scene's directory to motion/vendor/.
  // Works whether the scene lives at motion/<id>.html (legacy) or
  // motion/<subject>/<id>.html (current per-subject layout).
  const vendorRel = relative(dirname(htmlPath), VENDOR_DIR).split(/[\\/]/).join('/') || '.';
  const original = readFileSync(htmlPath, 'utf8');
  const rewritten = original.replace(
    /<script\b[^>]*\bsrc="https:\/\/unpkg\.com\/([^"]+)"[^>]*><\/script>/g,
    (full, pkgPath) => {
      const local = VENDOR_FILES[pkgPath];
      return local
        ? `<script src="${vendorRel}/${local}"></script>`
        : full;
    },
  );
  // Write next to the original so relative paths (./animations.jsx,
  // ../../colors_and_type.css, ../vendor/...) resolve identically.
  tempHtmlPath = join(dirname(htmlPath), `.${sceneId}.snapshot.html`);
  writeFileSync(tempHtmlPath, rewritten);
  loadPath = tempHtmlPath;
}

const url = `file://${loadPath}?freeze=0${PORTRAIT ? '&aspect=9:16' : ''}`;
await page.goto(url, { waitUntil: 'load' });

// Wait for the Stage to mount and expose the global handle.
// Babel-standalone compiles JSX in-browser, which can take a beat.
try {
  await page.waitForFunction(() => typeof window.__manimoStage === 'object' && window.__manimoStage !== null, {
    timeout: 15000,
  });
} catch {
  console.error(`Timed out waiting for window.__manimoStage in ${sceneId}.`);
  console.error('Likely causes: Babel parse error, missing primitive, or Stage failed to mount.');
  await browser.close();
  if (tempHtmlPath && existsSync(tempHtmlPath)) {
    try { unlinkSync(tempHtmlPath); } catch { /* best-effort */ }
  }
  process.exit(1);
}

// Capture each requested timestamp.
const written = [];
for (const { label, t } of snapshots) {
  await page.evaluate(target => window.__manimoStage.setTime(target), t);
  // Two RAFs: one to apply the new time, one to commit any dependent renders.
  await page.evaluate(() => new Promise(r =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  ));
  const filename = `${sceneId}--${label}--t${t.toFixed(2)}.png`;
  const fullPath = join(outDir, filename);
  await page.screenshot({ path: fullPath, fullPage: false });
  written.push(fullPath);
}

await browser.close();

if (tempHtmlPath && existsSync(tempHtmlPath)) {
  try { unlinkSync(tempHtmlPath); } catch { /* best-effort */ }
}

// Print one path per line so callers can capture with mapfile / xargs / etc.
for (const p of written) console.log(p);
