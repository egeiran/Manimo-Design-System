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

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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

if (!spec.subject_id) {
  console.error('Spec is missing top-level `subject_id` (required for per-subject layout — set e.g. "fysikk").');
  process.exit(1);
}

const sceneDir = join(ROOT, 'motion', spec.subject_id);
const outJsx  = join(sceneDir, `${spec.id}.jsx`);
const outHtml = join(sceneDir, `${spec.id}.html`);

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
const exampleSpec  = read('motion/fysikk/rc-scene.spec.json');
const exampleJsx   = read('motion/fysikk/rc-scene.jsx');

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
- Set \`window.sceneNarration = NARRATION;\` near the bottom (before the App component).

# Quality bar — non-negotiables

The default failure mode is shipping a static deck of fade-ins. Don't.

## Dual aspect (HARD)

The scene MUST render correctly at BOTH 16:9 (1280×720, default) and
9:16 portrait (720×1280, query param \`?aspect=9:16\`).

- Call \`usePortrait()\` from manimo-motion.jsx in any component whose
  layout, geometry, or font sizing breaks when the canvas rotates.
- Reference implementation: motion/spring-oscillation.jsx — geometry,
  font sizes, hatch pitch, gaps, max-width all branch on \`portrait\`.
- For diagrams that don't fit horizontally, provide a stacked
  portrait branch. Tighten gaps and shrink fonts ~85% in portrait.
- A scene that only looks right in landscape is incomplete output.

## Genuine animation (HARD)

A Manimo scene exists to show something *moving* that you cannot show
on a static chalkboard. Output where every beat's animation budget is
exhausted by FadeUp + TraceIn + WriteOn is rejected — those build text,
they don't demonstrate physics.

At least one beat must include one of:
- Physics-driven motion (oscillation, projectile, charging curve, swing)
- A value-driven graph that grows synchronously with a moving diagram
  element (the dot moves, the curve traces from the same parameter)
- A morphing diagram (vector rotates with angle, area fills with
  integral, shape transitions between states)
- A swept parameter visualised through its range (damping, k, mass…)

Ask "what would *bevegelse* mean here?" before reaching for another
fade. If the topic genuinely admits no motion, leave a comment in the
JSX flagging the static beat for human review.

## Polish

- Plan beats as a comment block at the top with explicit start/end
  ranges before writing JSX. Beats < 2 s or > 8 s should be revised.
- Every motion uses easing — no linear ramps unless physically motivated.
- Every formula appears via TraceIn or WriteOn. Jump cuts are a failure.`;

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
mkdirSync(sceneDir, { recursive: true });
writeFileSync(outJsx, cleaned.endsWith('\n') ? cleaned : cleaned + '\n');
writeFileSync(outHtml, htmlForScene(spec));

console.log(`✓ Wrote ${outJsx}`);
console.log(`✓ Wrote ${outHtml}`);

// ─── Upsert manifest entry ───────────────────────────────────────────────
upsertManifestEntry(spec, specPath);

// ─── Verify with linter (only the new file) ──────────────────────────────
try {
  execSync(`node scripts/lint-tokens.js "${outJsx}"`, { cwd: ROOT, stdio: 'inherit' });
} catch {
  console.warn('⚠ Token linter found violations in the generated scene. Review manually.');
}

console.log(`\nOpen file://${outHtml} in a browser to preview.`);

// ─── Helpers ─────────────────────────────────────────────────────────────
function upsertManifestEntry(spec, specPath) {
  const manifestPath = join(ROOT, 'motion', 'scene-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const existing = manifest.scenes.find(s => s.id === spec.id);

  // Field order matches the existing entry shape so diffs stay clean.
  const next = {
    id: spec.id,
    file: existing?.file ?? `${spec.id}.jsx`,
    html: existing?.html ?? `${spec.id}.html`,
    spec: existing?.spec ?? specPath.split('/').pop(),
    title: spec.title,
    eyebrow: spec.eyebrow ?? existing?.eyebrow ?? '',
    topic: spec.topic ?? existing?.topic ?? '',
    duration: spec.duration,
    language: spec.language,
    prerequisites: spec.prerequisites ?? existing?.prerequisites ?? [],
    concepts: existing?.concepts ?? [],
  };
  if (spec.subject_id !== undefined) next.subject_id = spec.subject_id;
  else if (existing?.subject_id !== undefined) next.subject_id = existing.subject_id;
  if (Number.isInteger(spec.chapter_number)) next.chapter_number = spec.chapter_number;
  else if (Number.isInteger(existing?.chapter_number)) next.chapter_number = existing.chapter_number;

  if (existing) {
    const idx = manifest.scenes.indexOf(existing);
    manifest.scenes[idx] = next;
    console.log(`✓ Updated manifest entry for ${spec.id}`);
  } else {
    manifest.scenes.push(next);
    console.log(`✓ Appended manifest entry for ${spec.id} (concepts: [] — fill in by hand)`);
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

function stripCodeFence(s) {
  const fenced = s.match(/^\s*```(?:jsx|javascript|js)?\n([\s\S]*?)\n```\s*$/);
  return fenced ? fenced[1].trim() : s;
}

function htmlForScene(spec) {
  const lang = spec.language === 'no' ? 'no' : 'en';
  const title = spec.title || spec.id;
  const template = readFileSync(join(ROOT, 'motion', '_scene-template.html'), 'utf8');
  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${title} — Manimo</title>`)
    .replace(/<!-- TODO: rename the src below to match your scene's \.jsx file -->\s*\n/, '')
    .replace(/src="_scene-template\.jsx"/, `src="${spec.id}.jsx"`);
}

