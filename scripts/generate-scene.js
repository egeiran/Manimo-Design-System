#!/usr/bin/env node
// generate-scene.js — turn a scene spec JSON into a working Manimo scene file.
//
// Usage:
//   node scripts/generate-scene.js motion/hoop-disk.spec.json
//   node scripts/generate-scene.js motion/<id>.spec.json --dry-run
//   node scripts/generate-scene.js motion/<id>.spec.json --force
//
// Requires:
//   • Node 18+ (uses built-in fetch — no npm install needed)
//   • ANTHROPIC_API_KEY env var
//
// Pipeline:
//   1. Read spec JSON (must validate against motion/scene-spec.schema.json)
//   2. Build a 2-message prompt: rc-scene as the few-shot example,
//      then the new spec. System prompt caches authoring rules.
//   3. Call claude-sonnet-4-6 with two cache breakpoints (system + few-shot).
//   4. Write motion/<id>.jsx + motion/<id>.html.
//   5. Run scripts/lint-tokens.js to verify no raw color slipped in.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 8192;
const ANTHROPIC_VERSION = '2023-06-01';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';

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

// ─── Read inputs ─────────────────────────────────────────────────────────
function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

let spec;
try {
  spec = JSON.parse(readFileSync(specPath, 'utf8'));
} catch (e) {
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

// ─── Reference materials (cached portion of the prompt) ──────────────────
const claudeMd     = read('CLAUDE.md');
const motionReadme = read('motion/README.md');
const schemaJson   = read('motion/scene-spec.schema.json');
const exampleSpec  = read('motion/rc-scene.spec.json');
const exampleJsx   = read('motion/rc-scene.jsx');

const systemPrompt = `You are generating a single React/JSX file for a Manimo lesson scene.

Manimo scenes are rendered via @babel/standalone in the browser. Each scene is
one .jsx file plus one .html bootstrap file. Animations are composed from a
small library of primitives (TraceIn, FadeUp, SvgFadeIn, WriteOn, …) on top of
a Sprite/Stage timeline system.

# Project conventions (CLAUDE.md)

${claudeMd}

# Motion library reference (motion/README.md)

${motionReadme}

# Scene spec schema (motion/scene-spec.schema.json)

The user will give you a filled spec object. Treat it as a structured description
of beats, narration, and visual elements. Translate it into JSX. Use the spec's
\`narration\` array to populate the NARRATION constant at the top of the file.

\`\`\`json
${schemaJson}
\`\`\`

# Output format

Output ONLY the contents of the .jsx file. No code fences, no commentary, no
preamble, no trailing explanation. Start with the file's leading comment block;
end with \`ReactDOM.createRoot(document.getElementById('root')).render(<App/>);\`.

# Critical reminders

- Use SceneChrome — never re-implement Background/Watermark/SceneTitle/ManimoCorner.
- One <Sprite> per beat, no nested Sprites inside beat components. Stagger via delay.
- delay is relative to the parent Sprite's localTime — NOT absolute stage time.
- SvgFadeIn (not FadeUp) for elements inside <svg>.
- Use design tokens — no raw hex, no bare rgb()/rgba() except in the existing
  background gradient pattern (radial-gradient is allow-listed by the linter).
- Set window.sceneNarration = NARRATION near the bottom (before App).
`;

const exampleUserMsg = `Generate the .jsx scene file for this spec:

\`\`\`json
${exampleSpec}
\`\`\``;

const exampleAssistantMsg = exampleJsx;

const userMsg = `Generate the .jsx scene file for this spec:

\`\`\`json
${JSON.stringify(spec, null, 2)}
\`\`\``;

// ─── Build request ───────────────────────────────────────────────────────
const requestBody = {
  model: MODEL,
  max_tokens: MAX_TOKENS,
  system: [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [
    {
      role: 'user',
      content: [{ type: 'text', text: exampleUserMsg }],
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: exampleAssistantMsg,
          cache_control: { type: 'ephemeral' },
        },
      ],
    },
    {
      role: 'user',
      content: [{ type: 'text', text: userMsg }],
    },
  ],
};

if (dryRun) {
  console.log('=== Dry run ===');
  console.log(`Model: ${MODEL}`);
  console.log(`System prompt: ${systemPrompt.length} chars`);
  console.log(`Few-shot user: ${exampleUserMsg.length} chars`);
  console.log(`Few-shot assistant: ${exampleAssistantMsg.length} chars`);
  console.log(`New user message: ${userMsg.length} chars`);
  console.log(`Cache breakpoints: 2 (system + few-shot assistant)`);
  console.log(`Output: ${outJsx} + ${outHtml}`);
  process.exit(0);
}

// ─── Call API ────────────────────────────────────────────────────────────
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY is not set. Export it and retry.');
  process.exit(1);
}

console.log(`→ Generating ${spec.id}.jsx via ${MODEL} …`);

let response;
try {
  response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
} catch (e) {
  console.error(`Network error: ${e.message}`);
  process.exit(1);
}

if (!response.ok) {
  const errBody = await response.text();
  console.error(`API error ${response.status}: ${errBody}`);
  process.exit(1);
}

const result = await response.json();

const usage = result.usage || {};
console.log(`  input: ${usage.input_tokens ?? '?'} tokens` +
  (usage.cache_read_input_tokens ? ` (cache read: ${usage.cache_read_input_tokens})` : '') +
  (usage.cache_creation_input_tokens ? ` (cache write: ${usage.cache_creation_input_tokens})` : ''));
console.log(`  output: ${usage.output_tokens ?? '?'} tokens`);

const jsxText = (result.content || [])
  .filter(b => b.type === 'text')
  .map(b => b.text)
  .join('');

if (!jsxText.trim()) {
  console.error('Empty response from API.');
  process.exit(1);
}

// Sometimes models still wrap output in a code fence — strip if present.
const cleaned = stripCodeFence(jsxText);

writeFileSync(outJsx, cleaned);
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
  return fenced ? fenced[1] : s;
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
