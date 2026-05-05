#!/usr/bin/env node
// vendor.js — mirror React, ReactDOM, and Babel-standalone into motion/vendor/
// so headless snapshots work in network-restricted sandboxes (where the
// nightly agent's container blocks unpkg.com at the firewall).
//
// Run once from a host with internet access, then commit motion/vendor/ so
// later agent runs can snapshot offline. The committed motion/*.html files
// are NOT changed — they keep the unpkg URLs + integrity hashes for normal
// browser previews. snapshot-scene.js reads from motion/vendor/ when it
// exists and rewrites the unpkg <script> tags on the fly into a temp HTML.
//
// Usage:
//   node scripts/vendor.js          (skip already-fetched files)
//   node scripts/vendor.js --force  (re-fetch all)

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR_DIR = join(ROOT, 'motion', 'vendor');

// Versions must stay in lockstep with the script tags in motion/*.html.
// If you bump a version here, also bump it (and re-pin the integrity hash)
// in every motion/<scene>.html.
const ASSETS = [
  { url: 'https://unpkg.com/react@18.3.1/umd/react.development.js',
    file: 'react.development.js' },
  { url: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
    file: 'react-dom.development.js' },
  { url: 'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
    file: 'babel.min.js' },
];

const force = process.argv.includes('--force');

mkdirSync(VENDOR_DIR, { recursive: true });

for (const { url, file } of ASSETS) {
  const dest = join(VENDOR_DIR, file);
  if (existsSync(dest) && !force) {
    console.log(`✓ ${file} (already vendored — pass --force to re-fetch)`);
    continue;
  }
  process.stdout.write(`↓ ${url} `);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`\nfailed: HTTP ${res.status}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  console.log(`(${(buf.length / 1024).toFixed(0)} KB)`);
}

console.log(`\nVendored to ${VENDOR_DIR}.`);
console.log('snapshot-scene.js will pick these up automatically when motion/vendor/ exists.');
