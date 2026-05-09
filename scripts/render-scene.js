#!/usr/bin/env node
// render-scene.js — render a Manimo scene to .mp4 (or .webm) video files.
//
// Default: produces BOTH 16:9 (1280×720) and 9:16 (720×1280) outputs in one
// invocation, since Manimo's distribution flow is dual-aspect (lecture + reels).
// Pass --landscape-only or --portrait-only to skip an aspect.
//
// Loads motion/<id>.html in headless Chromium at the stage's native resolution,
// walks the Stage timeline frame-by-frame via window.__manimoStage.setTime,
// captures each frame as a PNG, then invokes ffmpeg to encode the frames into
// a video file. If a single-track narration audio (motion/audio/<id>/scene.mp3)
// is present and aligned via manifest.json, it's muxed in.
//
// Usage:
//   node scripts/render-scene.js motion/spring-oscillation.html
//     → renders/spring-oscillation.mp4 + renders/spring-oscillation.portrait.mp4
//
//   node scripts/render-scene.js motion/spring-oscillation.html --format webm
//     → both aspects as VP9 + Opus webm (slower encode, smaller file)
//
//   node scripts/render-scene.js motion/spring-oscillation.html --landscape-only
//     → only 16:9
//
//   node scripts/render-scene.js motion/spring-oscillation.html --portrait-only
//     → only 9:16
//
//   node scripts/render-scene.js motion/spring-oscillation.html --fps 60
//     → smoother motion, ~2× the frame-capture time
//
//   node scripts/render-scene.js motion/spring-oscillation.html --no-audio
//     → silent video even if scene.mp3 exists
//
//   node scripts/render-scene.js motion/spring-oscillation.html --duration 12
//     → override duration (otherwise read from <id>.spec.json)
//
//   node scripts/render-scene.js motion/spring-oscillation.html --landscape-only --out path.mp4
//     → custom output path (requires single-aspect mode)
//
// Requires:
//   • playwright (already a devDependency — installed via npm install)
//   • ffmpeg on PATH (brew install ffmpeg)

import { resolve, dirname, basename, join, relative } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync, rmSync, unlinkSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { spawn, spawnSync } from 'child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ─── CLI parsing ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FLAGS_WITH_VALUE = new Set(['fps', 'format', 'out', 'duration']);
const positional = [];
const flags = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    if (FLAGS_WITH_VALUE.has(key)) {
      flags[key] = args[++i];
    } else {
      flags[key] = true;
    }
  } else {
    positional.push(a);
  }
}

if (positional.length !== 1) {
  console.error('Usage: node scripts/render-scene.js <scene.html> [--fps 30] [--format mp4|webm] [--landscape-only|--portrait-only] [--no-audio] [--duration N] [--out path]');
  process.exit(1);
}

const htmlPath = resolve(positional[0]);
if (!existsSync(htmlPath)) {
  console.error(`File not found: ${htmlPath}`);
  process.exit(1);
}

const sceneId = basename(htmlPath, '.html');
const fps = Math.max(1, parseInt(flags.fps || '30', 10));
const format = (flags.format || 'mp4').toLowerCase();
if (format !== 'mp4' && format !== 'webm') {
  console.error(`--format must be mp4 or webm, got: ${format}`);
  process.exit(1);
}
const includeAudio = !flags['no-audio'];

// Decide which aspects to render.
const renderLandscape = !flags['portrait-only'];
const renderPortrait = !flags['landscape-only'];
if (!renderLandscape && !renderPortrait) {
  console.error('Cannot pass both --landscape-only and --portrait-only.');
  process.exit(1);
}
const aspects = [];
if (renderLandscape) aspects.push({ id: 'landscape', portrait: false, suffix: '' });
if (renderPortrait)  aspects.push({ id: 'portrait',  portrait: true,  suffix: '.portrait' });

if (flags.out && aspects.length > 1) {
  console.error('--out only works with a single aspect. Add --landscape-only or --portrait-only.');
  process.exit(1);
}

// ─── ffmpeg presence ────────────────────────────────────────────────────
const ffmpegProbe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
if (ffmpegProbe.status !== 0) {
  console.error('ffmpeg not found on PATH.');
  console.error('Install it first:  brew install ffmpeg');
  process.exit(1);
}

// ─── Resolve duration + audio from spec/manifest ────────────────────────
// Sibling layout: spec.json + audio/<sceneId>/ live next to the html file.
// Works for both legacy flat motion/<id>.html and per-subject motion/<sub>/<id>.html.
const sceneDir = dirname(htmlPath);
const specPath = join(sceneDir, `${sceneId}.spec.json`);
const audioManifestPath = join(sceneDir, 'audio', sceneId, 'manifest.json');
const audioMp3Path = join(sceneDir, 'audio', sceneId, 'scene.mp3');

let duration;
if (flags.duration) {
  duration = parseFloat(flags.duration);
} else if (existsSync(specPath)) {
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  duration = spec.duration;
}
if (!isFinite(duration) || duration <= 0) {
  console.error('Could not determine scene duration. Pass --duration <seconds>.');
  process.exit(1);
}

let audioForMux = null;
if (includeAudio && existsSync(audioMp3Path)) {
  // Prefer manifest's durationSec if present — it's the authoritative
  // narration length (slightly under the spec's rounded-up duration).
  let audioDur = null;
  if (existsSync(audioManifestPath)) {
    try {
      const m = JSON.parse(readFileSync(audioManifestPath, 'utf8'));
      if (m.mode === 'fallback-estimated') {
        console.log('⚠ audio/manifest.json is fallback-estimated — no real MP3 was generated. Skipping audio mux.');
      } else {
        audioDur = typeof m.durationSec === 'number' ? m.durationSec : null;
        audioForMux = audioMp3Path;
      }
    } catch {
      audioForMux = audioMp3Path;
    }
  } else {
    audioForMux = audioMp3Path;
  }
  if (audioForMux && audioDur && audioDur > duration + 0.5) {
    console.log(`⚠ audio is ${audioDur.toFixed(2)}s but scene duration is ${duration}s — audio will be cut at ${duration}s. Consider raising the spec's duration.`);
  }
}

const totalFrames = Math.ceil(duration * fps);
const padWidth = String(totalFrames).length;
const pad = (n) => String(n).padStart(padWidth, '0');

const aspectsLabel = aspects.map(a => a.id).join(' + ');
console.log(`Scene:    ${sceneId}`);
console.log(`Aspects:  ${aspectsLabel}`);
console.log(`Duration: ${duration}s @ ${fps} fps  →  ${totalFrames} frames`);
console.log(`Format:   ${format}${audioForMux ? ' + audio' : ' (no audio)'}`);
console.log('');

// ─── Playwright + vendor rewrite (shared across aspects) ────────────────
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('playwright is not installed. Run: npm install');
  process.exit(1);
}

// Same vendor-rewrite trick snapshot-scene.js uses, so this works in
// firewalled environments where unpkg is blocked.
const VENDOR_DIR = join(ROOT, 'motion', 'vendor');
const VENDOR_FILES = {
  'react@18.3.1/umd/react.development.js':         'react.development.js',
  'react-dom@18.3.1/umd/react-dom.development.js': 'react-dom.development.js',
  '@babel/standalone@7.29.0/babel.min.js':         'babel.min.js',
};
const vendorReady = Object.values(VENDOR_FILES).every(f => existsSync(join(VENDOR_DIR, f)));

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
      return local ? `<script src="${vendorRel}/${local}"></script>` : full;
    },
  );
  tempHtmlPath = join(dirname(htmlPath), `.${sceneId}.render.html`);
  writeFileSync(tempHtmlPath, rewritten);
  loadPath = tempHtmlPath;
}

const browser = await chromium.launch({
  headless: true,
  args: ['--allow-file-access-from-files', '--disable-web-security'],
});

const overallStart = Date.now();
const written = [];

try {
  for (const aspect of aspects) {
    const outPath = resolve(flags.out || join(ROOT, 'renders', `${sceneId}${aspect.suffix}.${format}`));
    mkdirSync(dirname(outPath), { recursive: true });

    const dims = aspect.portrait ? '720×1280 (9:16)' : '1280×720 (16:9)';
    console.log(`── ${aspect.id}  (${dims})  →  ${relativeToRoot(outPath)}`);

    await renderAspect({ aspect, outPath });
    written.push(outPath);
  }
} finally {
  await cleanup(browser, tempHtmlPath);
}

const totalSec = ((Date.now() - overallStart) / 1000).toFixed(1);
console.log('');
for (const p of written) {
  const sizeMB = (statSizeBytes(p) / (1024 * 1024)).toFixed(1);
  console.log(`✓ ${relativeToRoot(p)}  (${sizeMB} MB)`);
}
console.log(`Done in ${totalSec}s.`);

// ─── Per-aspect render ──────────────────────────────────────────────────
async function renderAspect({ aspect, outPath }) {
  const framesDir = join(ROOT, '.tmp', 'render', sceneId, aspect.id);
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  const context = await browser.newContext({
    viewport: aspect.portrait ? { width: 720, height: 1280 } : { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  page.on('pageerror', err => console.error(`  [scene error] ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`  [console] ${msg.text()}`);
  });

  // freeze=0 pins time and disables autoplay; embed=1 hides the playback bar.
  const url = `file://${loadPath}?freeze=0&embed=1${aspect.portrait ? '&aspect=9:16' : ''}`;
  await page.goto(url, { waitUntil: 'load' });

  try {
    await page.waitForFunction(() => typeof window.__manimoStage === 'object' && window.__manimoStage !== null, {
      timeout: 15000,
    });
  } catch {
    await context.close();
    throw new Error(`Timed out waiting for window.__manimoStage in ${sceneId} (${aspect.id}). Likely Babel parse error or Stage failed to mount.`);
  }

  // Capture frames
  const startMs = Date.now();
  let lastLog = startMs;
  for (let i = 0; i < totalFrames; i++) {
    const t = Math.min(duration, i / fps);
    await page.evaluate(target => window.__manimoStage.setTime(target), t);
    // Two RAFs: apply time, then commit dependent renders.
    await page.evaluate(() => new Promise(r =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    ));
    const framePath = join(framesDir, `frame_${pad(i)}.png`);
    await page.screenshot({ path: framePath, fullPage: false });

    const now = Date.now();
    if (now - lastLog > 1000 || i === totalFrames - 1) {
      const pct = ((i + 1) / totalFrames * 100).toFixed(0);
      const elapsed = (now - startMs) / 1000;
      const eta = elapsed / (i + 1) * (totalFrames - i - 1);
      process.stdout.write(`\r  capturing  ${i + 1}/${totalFrames}  (${pct}%)  elapsed ${elapsed.toFixed(0)}s  eta ${eta.toFixed(0)}s   `);
      lastLog = now;
    }
  }
  process.stdout.write('\n');

  await context.close();

  // Encode
  await encodeWithFfmpeg({ framesDir, outPath });

  // Clean up frames once encoding succeeded.
  rmSync(framesDir, { recursive: true, force: true });
}

async function encodeWithFfmpeg({ framesDir, outPath }) {
  const inputPattern = join(framesDir, `frame_%0${padWidth}d.png`);
  const ffmpegArgs = [
    '-y',
    '-framerate', String(fps),
    '-i', inputPattern,
  ];
  if (audioForMux) {
    ffmpegArgs.push('-i', audioForMux);
  }

  if (format === 'mp4') {
    // H.264 + AAC. yuv420p ensures playback in Quicktime / iOS / browsers.
    // CRF 18 is visually lossless for chalk-style flat-color content.
    ffmpegArgs.push(
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
    );
    if (audioForMux) {
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
    }
  } else {
    // VP9 + Opus.
    ffmpegArgs.push(
      '-c:v', 'libvpx-vp9',
      '-crf', '30',
      '-b:v', '0',
      '-pix_fmt', 'yuv420p',
    );
    if (audioForMux) {
      ffmpegArgs.push('-c:a', 'libopus', '-b:a', '128k', '-shortest');
    }
  }
  ffmpegArgs.push(outPath);

  console.log(`  encoding   ffmpeg ${format}…`);
  const ff = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', chunk => { ffErr += chunk.toString(); });
  const ffCode = await new Promise(r => ff.on('close', r));

  if (ffCode !== 0) {
    console.error('  ffmpeg failed:');
    console.error(ffErr.split('\n').slice(-20).join('\n'));
    throw new Error('ffmpeg encode failed');
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────
async function cleanup(browser, tempHtmlPath) {
  try { await browser.close(); } catch {}
  if (tempHtmlPath && existsSync(tempHtmlPath)) {
    try { unlinkSync(tempHtmlPath); } catch {}
  }
}

function relativeToRoot(p) {
  return p.startsWith(ROOT + '/') ? p.slice(ROOT.length + 1) : p;
}

function statSizeBytes(p) {
  try {
    return statSync(p).size;
  } catch {
    return 0;
  }
}
