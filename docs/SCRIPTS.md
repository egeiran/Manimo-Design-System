# Scripts reference

Eleven production scripts live in `scripts/`. Most are wrapped as
`npm run` shortcuts in `package.json`. This file is a quick-reference;
for full flag lists, read the header comment at the top of each script.

## At a glance

| Script                  | Wrapper            | What it does                                                |
| ----------------------- | ------------------ | ----------------------------------------------------------- |
| `dev-server.js`         | `npm run dev`      | Static file server + notes API for the Studio kit           |
| `lint-tokens.js`        | `npm run lint`     | Enforce design-token usage (no raw hex / rgba)              |
| `vendor.js`             | `npm run vendor`   | Mirror React + Babel into `motion/vendor/` for offline runs |
| `snapshot-scene.js`     | `npm run snapshot` | Render scene PNG frames at chosen timestamps                |
| `generate-audio.js`     | `npm run audio`    | Synthesize narration with ElevenLabs (or fallback engines)  |
| `rewire-scene.js`       | —                  | After audio regen, push timings into all four files         |
| `render-scene.js`       | `npm run render`   | Render scene to MP4 (16:9 + 9:16 by default)                |
| `publish-scene.js`      | `npm run publish`  | Upsert scene metadata into kort-forklart Supabase           |
| `chapter-coverage.js`   | `npm run coverage` | Show chapter coverage per subject (live from Supabase)      |
| `generate-scene.js`     | —                  | Turn a spec JSON into JSX + HTML via the `claude` CLI       |
| `ensure-browsers.js`    | —                  | (Helper) make cached chromium discoverable to Playwright    |

## `dev-server.js` — local dev server

Drop-in replacement for `npx serve .` that also exposes a small notes
API the Studio uses to save screenshot + comment pairs back into the
repo. Notes land in `motion/<subject>/<scene-id>.notes/` as
`notes.md` + numbered PNGs.

```
npm run dev                  # http://localhost:3000
PORT=4000 npm run dev        # custom port
```

## `lint-tokens.js` — design-token lint

Scans `.jsx` files under `motion/` and `ui_kits/` for hardcoded hex
literals and bare `rgb()`/`rgba()` calls. Exits non-zero on violations
(CI-safe).

```
npm run lint                                      # full scan
node scripts/lint-tokens.js motion/foo.jsx        # single file
```

## `vendor.js` — mirror UMD deps for offline runs

Downloads React, ReactDOM, and Babel-standalone into `motion/vendor/`.
Used by snapshot/render scripts when the sandbox blocks unpkg.com at
the firewall. The committed `motion/*.html` files keep their unpkg
`<script>` tags + integrity hashes; vendor is only the offline
fallback. Re-run with `--force` after bumping a version.

```
node scripts/vendor.js               # skip already-fetched files
node scripts/vendor.js --force       # re-fetch all
```

## `snapshot-scene.js` — visual review PNGs

Loads a scene in headless Chromium (1280×720), seeks the Stage timeline
to N timestamps via the `window.__manimoStage` handle, and saves PNGs
to `.tmp/snapshots/<id>/`. Output paths are printed to stdout so an
agent can pipe them into `Read` for vision-based review.

```
npm run snapshot motion/<subject>/<id>.html
node scripts/snapshot-scene.js motion/<subject>/<id>.html --times 1.5,5,12
node scripts/snapshot-scene.js motion/<subject>/<id>.html --frames 5
node scripts/snapshot-scene.js motion/<subject>/<id>.html --out custom/dir
```

Needs Playwright + chromium (auto-installed by `postinstall`).

## `generate-audio.js` — TTS narration

Full reference in [`AUDIO.md`](AUDIO.md). Quick form:

```
node scripts/generate-audio.js <id> --engine elevenlabs   # mandated for publish
node scripts/generate-audio.js <id> --dry-run             # preview without API call
node scripts/generate-audio.js <id> --force               # overwrite existing audio
```

Reads narration from `motion/<subject>/<id>.spec.json`. Aborts when
narration contains math symbols (see Hard Rule 9 in `CLAUDE.md`).

## `rewire-scene.js` — sync timings across four files

After every audio regen, run:

```
node scripts/rewire-scene.js <id>
node scripts/rewire-scene.js <id> --tail 1.5     # bigger tail buffer
node scripts/rewire-scene.js <id> --dry-run
```

Reads `motion/<subject>/audio/<id>/manifest.json` (source of truth for
`durationSec`) and writes back into:

1. `motion/<subject>/<id>.jsx` — `SCENE_DURATION`, `introEnd`,
   `<Sprite start end>` blocks
2. `motion/<subject>/<id>.spec.json` — `duration`, `beats[].start/end`
3. `motion/scene-manifest.json` — this scene's `duration`
4. `ui_kits/studio/app.jsx` — `initialScenes` row for `live-<id>`

Sanity-checks that `spec.beats[i].id` matches
`audio.tracks[i].id` and aborts if they diverge.

## `render-scene.js` — MP4 / WebM render

Default output: both 16:9 (1280×720) and 9:16 (720×1280) MP4 in one
invocation. Walks `window.__manimoStage` frame by frame, captures PNGs,
muxes them through ffmpeg with the scene's audio.

```
npm run render motion/<subject>/<id>.html
node scripts/render-scene.js motion/<subject>/<id>.html --landscape-only
node scripts/render-scene.js motion/<subject>/<id>.html --portrait-only
node scripts/render-scene.js motion/<subject>/<id>.html --format webm
node scripts/render-scene.js motion/<subject>/<id>.html --fps 60
node scripts/render-scene.js motion/<subject>/<id>.html --no-audio
```

Outputs land in `renders/`. **Not part of the publish flow** —
kort-forklart embeds the live HTML directly. Use this for social cuts
or downloads.

Needs ffmpeg + ffprobe on PATH.

## `publish-scene.js` — Supabase upsert

Full reference in [`PUBLISHING.md`](PUBLISHING.md). Quick form:

```
npm run publish <id>          # single scene
npm run publish all           # whole manifest
node scripts/publish-scene.js <id> --dry-run
```

Needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
Metadata-only — never uploads files, never touches Storage.

## `chapter-coverage.js` — what's missing in Supabase

```
npm run coverage <subject>           # default subject is ade
npm run coverage <subject> --json    # machine-readable
```

Reads kort-forklart's `public.chapters` and `public.scenes` and prints:

- Chapter rows for `<subject>` with scene counts (both published rows
  and local-only manifest entries)
- The most under-served chapter (the nightly author's target)
- Unattached scenes (`chapter_number IS NULL`)
- Mismatches between local manifest and Supabase

Falls back to local-only counts (no chapter titles) when Supabase env
vars are missing — flagged in the header.

## `generate-scene.js` — spec → JSX/HTML

Uses the `claude` CLI in print mode (routes through Claude Code + your
Claude Max subscription — no `ANTHROPIC_API_KEY` needed).

```
node scripts/generate-scene.js <path-to-spec>.json
node scripts/generate-scene.js <path-to-spec>.json --dry-run
node scripts/generate-scene.js <path-to-spec>.json --force
```

Reads `subject_id` + `chapter_number` from the spec's top level and
writes the JSX/HTML next to the spec under
`motion/<subject_id>/`, then upserts the manifest entry. Falls back to
`motion/` (no subject folder) when `subject_id` is missing.

Requires `claude` CLI on PATH and Node 18+.

## `ensure-browsers.js` — Playwright cache shim

Helper imported by snapshot/render scripts. Sandboxed CI hosts often
pre-cache one chromium revision under `/opt/pw-browsers/` while the
locally-installed Playwright pins a newer revision. This script lays
down a symlink under `/tmp/pw-browsers/` so Playwright finds a
compatible binary. Idempotent — safe to call before every run. Not
exposed as a `npm run` shortcut.
