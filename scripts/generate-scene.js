#!/usr/bin/env node
// generate-scene.js — turn a scene spec JSON into a Manimo scene file.
//
// Uses the `claude` CLI in print mode, which routes through your Claude Code
// session and your Claude Max subscription. NO ANTHROPIC_API_KEY REQUIRED.
//
// Usage:
//   node scripts/generate-scene.js motion/<id>.spec.json
//   node scripts/generate-scene.js motion/<id>.spec.json --dry-run
//   node scripts/generate-scene.js motion/<id>.spec.json --force
//
// Requires:
//   • Node 18+
//   • `claude` CLI on PATH (Claude Code installed + signed in)

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = 'claude-sonnet-4-6';

// ─── CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const positional = args.filter(a => !a.startsWith('--'));

if (positional.length !== 1) {
  console.error('Usage: node scripts/generate-scene.js <spec.json> [--dry-run] [--force]');
  process.exit(1);
}

const specPath = resolve(positional[0]);
const dryRun = flags.has('--dry-run');
const force = flags.has('--force');

// ─── Read inputs and validate ────────────────────────────────────────────
function read(rel) { return readFileSync(join(ROOT, rel), 'utf8'); }

let spec;
try { spec = JSON.parse(readFileSync(specPath, 'utf8')); }
catch (e) {
  console.error(`Failed to read spec at ${specPath}: ${e.message}`);
  process.exit(1);
}

if (!spec.id || !spec.beats) {
  console.error('Spec is missing required fields (id, beats). See motion/scene-spec.schema.json.');
  process.exit(1);
}

const outJsx  = join(ROOT, 'motion', `${spec.id}.jsx`);
const outHtml = join(ROOT, 'motion', `${spec.id}.html`);

if (!dryRun && !force && (existsSync(outJsx) || existsSync(outHtml))) {
  console.error(`Refusing to overwrite existing ${spec.id}.jsx/.html — pass --force to allow.`);
  process.exit(1);
}

// ─── Build the prompt ────────────────────────────────────────────────────
// Single self-contained prompt: rules + schema + few-shot example + new spec.
// No prompt caching (the CLI doesn't expose breakpoints), but Max subscription
// covers the cost.
const claudeMd     = read('CLAUDE.md');
const motionReadme = read('motion/README.md');
const schemaJson   = read('motion/scene-spec.schema.json');
const exampleSpec  = read('motion/rc-scene.spec.json');
const exampleJsx   = read('motion/rc-scene.jsx');

const prompt = `Generate a single React/JSX file for a Manimo lesson scene.

# Project conventions (CLAUDE.md)

${claudeMd}

# Motion library reference (motion/README.md)

${motionReadme}

# Scene spec schema (motion/scene-spec.schema.json)

\`\`\`json
${schemaJson}
\`\`\`

# Example — input spec (motion/rc-scene.spec.json)

\`\`\`json
${exampleSpec}
\`\`\`

# Example — matching output JSX (motion/rc-scene.jsx produced from the spec above)

\`\`\`jsx
${exampleJsx}
\`\`\`

# Now: generate the .jsx for this new spec

\`\`\`json
${JSON.stringify(spec, null, 2)}
\`\`\`

# Output rules — read carefully

- Output ONLY the .jsx file content. No code fences, no commentary, no preamble,
  no trailing explanation. The first line of your output should be the file's
  leading \`//\` comment header. The last line should be
  \`ReactDOM.createRoot(document.getElementById('root')).render(<App/>);\`.

# Critical reminders

- Use SceneChrome — never re-implement Background/Watermark/SceneTitle/ManimoCorner.
- One <Sprite> per beat, no nested Sprites inside beat components. Stagger via delay.
- delay is relative to the parent Sprite's localTime — NOT absolute stage time.
- SvgFadeIn (not FadeUp) for elements inside <svg>.
- Use design tokens — no raw hex.
- Set \`window.sceneNarration = NARRATION;\` near the bottom (before the App component).`;

if (dryRun) {
  console.log('=== Dry run ===');
  console.log(`Model: ${MODEL}`);
  console.log(`Prompt size: ${prompt.length} chars (~${Math.round(prompt.length / 4)} tokens)`);
  console.log(`Output:  ${outJsx}`);
  console.log(`         ${outHtml}`);
  console.log(`\nWill invoke: claude -p --model ${MODEL} <prompt-via-argv>`);
  process.exit(0);
}

// ─── Verify the claude CLI is available ──────────────────────────────────
try { execSync('command -v claude', { stdio: 'ignore' }); }
catch {
  console.error('`claude` CLI not found on PATH.');
  console.error('Install Claude Code (https://claude.ai/code) and sign in, then retry.');
  process.exit(1);
}

console.log(`→ Generating ${spec.id}.jsx via \`claude -p\` (Max subscription)…`);

// ─── Invoke claude -p ────────────────────────────────────────────────────
const result = spawnSync('claude', ['-p', prompt, '--model', MODEL], {
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});

if (result.error) {
  console.error(`Failed to spawn claude: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`claude exited with status ${result.status}`);
  if (result.stderr) console.error(result.stderr);
  process.exit(1);
}

const jsxText = (result.stdout || '').trim();
if (!jsxText) {
  console.error('Empty response from claude.');
  if (result.stderr) console.error(result.stderr);
  process.exit(1);
}

// ─── Clean up and write ──────────────────────────────────────────────────
const cleaned = stripCodeFence(jsxText);
writeFileSync(outJsx, cleaned.endsWith('\n') ? cleaned : cleaned + '\n');
writeFileSync(outHtml, htmlForScene(spec));

console.log(`✓ Wrote ${outJsx}`);
console.log(`✓ Wrote ${outHtml}`);

// ─── Verify with linter (only the new file) ──────────────────────────────
try {
  execSync(`node scripts/lint-tokens.js "${outJsx}"`, { cwd: ROOT, stdio: 'inherit' });
} catch {
  console.warn('⚠ Token linter found violations in the generated scene. Review manually.');
}

console.log(`\nOpen file://${outHtml} in a browser to preview.`);

// ─── Helpers ─────────────────────────────────────────────────────────────
function stripCodeFence(s) {
  const fenced = s.match(/^\s*```(?:jsx|javascript|js)?\n([\s\S]*?)\n```\s*$/);
  return fenced ? fenced[1].trim() : s;
}

function htmlForScene(spec) {
  const lang = spec.language === 'no' ? 'no' : 'en';
  const title = spec.title || spec.id;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — Manimo</title>
<link rel="stylesheet" href="../colors_and_type.css"/>
<style>
  body { margin: 0; background: var(--bg-canvas); overflow: hidden; }
</style>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-presets="react" src="animations.jsx"></script>
<script type="text/babel" data-presets="react" src="manimo-motion.jsx"></script>
<script type="text/babel" data-presets="react" src="${spec.id}.jsx"></script>
</body>
</html>
`;
}
