#!/usr/bin/env node
// ensure-browsers.js — make a cached chromium-headless-shell discoverable
// by the Playwright version in this repo.
//
// Sandboxed CI hosts often pre-cache one chromium revision under
// /opt/pw-browsers/, but the locally-installed Playwright pins a newer
// revision and refuses to launch when it can't find that exact directory.
// Rather than re-downloading (network is usually blocked), we lay down
// /tmp/pw-browsers/chromium_headless_shell-<expected>/ as a symlink that
// points at the cached <other-revision> install. The binary itself is
// API-compatible across these tiny version bumps.
//
// Idempotent: safe to call before every snapshot/render run. Returns the
// path that callers should pass via PLAYWRIGHT_BROWSERS_PATH (or null if
// no fix-up was needed).
//
// Usage:
//   import { ensureBrowsers } from './ensure-browsers.js';
//   const path = ensureBrowsers();
//   if (path) process.env.PLAYWRIGHT_BROWSERS_PATH = path;

import { resolve, dirname, join } from 'path';
import { existsSync, readFileSync, readdirSync, mkdirSync, symlinkSync, unlinkSync, lstatSync } from 'fs';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BROWSERS_JSON = join(ROOT, 'node_modules', 'playwright-core', 'browsers.json');
const CACHE_ROOTS = ['/opt/pw-browsers', join(process.env.HOME || '/root', '.cache', 'ms-playwright')];
const SHIM_ROOT = '/tmp/pw-browsers';

function readExpectedRevision() {
  if (!existsSync(BROWSERS_JSON)) return null;
  try {
    const data = JSON.parse(readFileSync(BROWSERS_JSON, 'utf8'));
    const entry = (data.browsers || []).find(b => b.name === 'chromium-headless-shell');
    return entry ? String(entry.revision) : null;
  } catch {
    return null;
  }
}

function findCachedHeadlessShell() {
  for (const root of CACHE_ROOTS) {
    if (!existsSync(root)) continue;
    let entries;
    try { entries = readdirSync(root); } catch { continue; }
    for (const name of entries) {
      const m = name.match(/^chromium_headless_shell-(\d+)$/);
      if (!m) continue;
      const dir = join(root, name);
      const inner = join(dir, 'chrome-linux');
      if (existsSync(inner)) return { revision: m[1], dir, inner };
    }
  }
  return null;
}

function symlinkForce(target, link) {
  try {
    if (existsSync(link) || lstatSync(link).isSymbolicLink?.()) {
      try { unlinkSync(link); } catch {}
    }
  } catch {}
  symlinkSync(target, link);
}

export function ensureBrowsers() {
  const expected = readExpectedRevision();
  if (!expected) return null;

  // If the expected revision is already discoverable in either cache root,
  // playwright will find it on its own — nothing to do.
  for (const root of CACHE_ROOTS) {
    if (existsSync(join(root, `chromium_headless_shell-${expected}`, 'chrome-headless-shell-linux64'))) {
      return null;
    }
  }

  const cached = findCachedHeadlessShell();
  if (!cached) return null;
  if (cached.revision === expected) return null;

  // Lay down a /tmp shim that maps <expected> -> cached <other revision>.
  const shimDir = join(SHIM_ROOT, `chromium_headless_shell-${expected}`);
  const shimBinDir = join(shimDir, 'chrome-headless-shell-linux64');
  mkdirSync(shimDir, { recursive: true });
  if (!existsSync(shimBinDir)) {
    symlinkForce(cached.inner, shimBinDir);
  }

  // The cached install ships the binary as `headless_shell`; playwright
  // expects `chrome-headless-shell`. Add the alias inside the cached dir
  // so it's reachable through the shim.
  const expectedBin = join(cached.inner, 'chrome-headless-shell');
  if (!existsSync(expectedBin)) {
    try { symlinkForce('headless_shell', expectedBin); } catch {}
  }

  return SHIM_ROOT;
}

// CLI passthrough: `node scripts/ensure-browsers.js` prints the path so it
// can be used from shell:  PLAYWRIGHT_BROWSERS_PATH=$(node scripts/ensure-browsers.js)
if (import.meta.url === `file://${process.argv[1]}`) {
  const p = ensureBrowsers();
  if (p) process.stdout.write(p + '\n');
}
