#!/usr/bin/env node
// lint-tokens.js — enforce "use design tokens, never raw color values"
//
// Scans all .jsx files under motion/ and ui_kits/ for:
//   • Hardcoded hex literals  (#fff, #1a2b3c, #aabbcc)
//   • Bare rgb() / rgba() calls that aren't token-based
//
// Exits 0 if clean, 1 if violations found (CI-safe).
//
// Usage:
//   node scripts/lint-tokens.js                          # scan motion/ + ui_kits/
//   node scripts/lint-tokens.js motion/hoop-disk.jsx     # scan a single file
//   node scripts/lint-tokens.js motion/*.jsx             # scan a glob

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['motion', 'ui_kits'];

// Matches #rgb, #rrggbb, #rrggbbaa (case-insensitive).
// The (?<!&) avoids matching HTML numeric entities like &#8239; (narrow no-break space).
const HEX_RE = /(?<!&)#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

// Matches rgb(...) or rgba(...) that aren't inside a CSS var() or token comment
// Allow-listed patterns that are intentional (e.g. radial-gradient internals):
const RGBA_RE = /\brgba?\s*\(/g;

// Lines containing these strings are intentionally raw and should be skipped.
// Add entries here for known-good exceptions (e.g. the background gradient).
const ALLOWLIST_SUBSTRINGS = [
  'radial-gradient',     // scene background gradient uses rgba() intentionally
  'rgba(232,220,193,',   // chalk grid lines — derived from --chalk-100 token value
  'rgba(244,184,96,',    // amber glow — derived from --amber-400 token value
  'rgba(232,122,144,',   // rose fills — derived from --rose-400 token value
  'rgba(155,140,255,',   // violet glow — derived from --violet-400 token value
  'rgba(246,244,239,',   // chalk-50 with alpha — used for dimmed labels in PlaybackBar
  'rgba(255,255,255,',   // white-on-dark UI overlay (PlaybackBar hovers, scrub track)
  'rgba(0,0,0,',         // generic black with alpha (shadows)
  '#0c0a1f',             // bg-canvas raw value (token not yet wired to CSS var in JSX)
  'lint-tokens',         // this file itself
];

function isAllowlisted(line) {
  return ALLOWLIST_SUBSTRINGS.some(s => line.includes(s));
}

function collectFiles(dir, exts = ['.jsx']) {
  const results = [];
  function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (exts.some(e => entry.endsWith(e))) results.push(full);
    }
  }
  walk(dir);
  return results;
}

let totalViolations = 0;

// Decide what to scan: explicit file args from CLI, or the default SCAN_DIRS.
const cliFiles = process.argv.slice(2).filter(a => !a.startsWith('--'));
const filesToScan = cliFiles.length > 0
  ? cliFiles.map(f => resolve(f))
  : SCAN_DIRS.flatMap(dir => {
      try { return collectFiles(join(ROOT, dir)); } catch { return []; }
    });

for (const file of filesToScan) {
  let lines;
  try { lines = readFileSync(file, 'utf8').split('\n'); } catch { continue; }
  const rel = relative(ROOT, file);
  const fileViolations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isAllowlisted(line)) continue;

    for (const match of line.matchAll(HEX_RE)) {
      fileViolations.push({ line: i + 1, col: match.index + 1, text: match[0], rule: 'hardcoded-hex' });
    }
    for (const match of line.matchAll(RGBA_RE)) {
      fileViolations.push({ line: i + 1, col: match.index + 1, text: match[0] + '…)', rule: 'raw-rgb' });
    }
  }

  if (fileViolations.length > 0) {
    console.error(`\n${rel}`);
    for (const v of fileViolations) {
      console.error(`  ${v.line}:${v.col}  [${v.rule}]  ${v.text}`);
    }
    totalViolations += fileViolations.length;
  }
}

if (totalViolations === 0) {
  console.log('✓ No raw color values found — all good.');
  process.exit(0);
} else {
  console.error(`\n${totalViolations} violation(s). Replace with var(--token-name) from colors_and_type.css.`);
  process.exit(1);
}
