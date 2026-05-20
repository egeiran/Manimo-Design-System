# Audio pipeline

Every published Manimo scene has narration MP3 + per-beat timings in
`motion/<subject_id>/audio/<scene-id>/`. The video must always outlast
the audio by **≥ 1.0 s** — this is enforced by `rewire-scene.js`, which
is the canonical way to sync the four files that hold duration numbers.

## Engines

`scripts/generate-audio.js` supports several TTS engines, ordered by
quality:

| Engine        | When to use                                          | Languages                | Auth                           |
| ------------- | ---------------------------------------------------- | ------------------------ | ------------------------------ |
| `elevenlabs`  | **Mandatory** for every scene that will be published | English + multilingual   | `ELEVENLABS_API_KEY`           |
| `mistral`     | Deprecated. Worst-case auto-chain fallback only.     | English-family only      | `MISTRAL_API_KEY`              |
| `say`         | Local dev preview (macOS)                            | Whatever `say` supports  | None                           |
| `espeak`      | Local dev preview (Linux)                            | Whatever `espeak-ng` has | None                           |
| `local`       | Auto-pick `say` on macOS, `espeak-ng` on Linux       | "                        | None                           |
| (no audio)    | `estimated-timings` — final no-audio fallback        | n/a                      | None                           |

**Voxtral / `--engine mistral` is deprecated** as a worst-case fallback
in the auto-chain. Any scene that will be published must be regenerated
with `--engine elevenlabs` first. The auto-chain will fall through to
mistral only when ElevenLabs fails, and the reviewer should reject any
PR whose `audio/<id>/manifest.json` records `engine: "mistral"`.

The ElevenLabs voice and model are pinned project-wide:

- Voice: `JBFqnCBsd6RMkjVDRZzb` ("George")
- Model: `eleven_multilingual_v2`

Override per-run with `--voice <id>` if needed. `--legacy` reverts to
per-beat MP3 + ffmpeg concat instead of the single-track
`/with-timestamps` endpoint; only use as an escape hatch.

## Cost model

- **ElevenLabs free tier**: 10 000 characters / month. A typical 30 s
  scene narration is ~400–600 characters, so a few dozen runs fit
  monthly. Paid tier kicks in above the cap.
- **Voxtral**: $0.016 / 1 000 chars, no free tier. Avoid.
- **Local engines**: no quota, mediocre quality.

## Standard pipeline

```bash
# 1. Generate audio with ElevenLabs explicitly
node scripts/generate-audio.js <scene-id> --engine elevenlabs

# 2. Sync the four files that hold duration numbers
node scripts/rewire-scene.js <scene-id>
```

`rewire-scene.js` reads `motion/<subject_id>/audio/<scene-id>/manifest.json`
(the source of truth for `durationSec`) and writes back into:

1. `motion/<subject_id>/<scene-id>.jsx` — `SCENE_DURATION`, `introEnd`,
   every `<Sprite start end>`
2. `motion/<subject_id>/<scene-id>.spec.json` — `duration`,
   `beats[].start`, `beats[].end`
3. `motion/scene-manifest.json` — this scene's `duration` entry
4. `ui_kits/studio/app.jsx` — the `initialScenes` row for `live-<id>`

The default tail buffer is 1.0 s; pass `--tail 1.5` (or `--tail 2.0`)
when the last beat needs visual breathing room. The buffer is a floor,
not a target.

Beat ordering is enforced: `spec.beats[i].id` must match
`audio.tracks[i].id`. The script sanity-checks this and aborts if they
diverge — if it does, your spec and audio drifted apart and you need
to regenerate audio.

## Hard Rule 10 — why this is fragile

The same time numbers live in four files. Hand-editing one in
isolation will silently desync the others, causing the video to end
mid-narration (audio is cut), Sprite timings to drift (animation
overshoots its window), or studio scrubber to show wrong totals.

Always use `rewire-scene.js`. Never adjust `SCENE_DURATION` by hand.

## Narration writing rules

The `narration` field in the spec and the matching `NARRATION` array in
JSX is read **verbatim** by TTS. Symbol-heavy phrasing sounds robotic
or fails outright. The pre-flight check in `generate-audio.js` refuses
to call the API when narration contains math symbols (`√`, `²`, `½`,
`π`, `ω`, `=`, `%`, …).

Rewrite math into spoken prose:

| Symbol form                | Spoken form                                                  |
| -------------------------- | ------------------------------------------------------------ |
| `F = ma`                   | "force equals mass times acceleration"                       |
| `ω₀ = √(k/m)`              | "omega zero equals the square root of k over m"              |
| `T = 2π√(m/k)`             | "T equals two pi times the square root of m over k"          |
| `½Mv²`                     | "one half m v squared"                                       |
| `v = √(4gh/3)`             | "v equals the square root of four g h divided by three"      |
| `15%`                      | "fifteen percent"                                            |
| `omega-zero` (hyphenated)  | "omega zero" — TTS pronounces the hyphen as "dash"           |

The visual `text-formula` elements in the JSX still use the symbolic
form; this rule applies only to the spoken / narration strings.

## Manifest format

`motion/<subject_id>/audio/<scene-id>/manifest.json` records:

- `engine` — which engine produced the audio (`elevenlabs`, `mistral`,
  `say`, `espeak`, `estimated`). Reviewer rejects any `mistral` for
  published scenes.
- `durationSec` — total audio length. Source of truth for
  `SCENE_DURATION` calculation.
- `tracks[]` — one entry per beat: `id`, `audioStart` (seconds from
  scene start), optionally `text` (the narration that was spoken).

The MP3 itself sits next to the manifest as `scene.mp3`.

## Regenerating audio for an existing scene

```bash
# Regenerate (overwrites scene.mp3 + manifest.json)
node scripts/generate-audio.js <scene-id> --engine elevenlabs --force

# Rewire all four files
node scripts/rewire-scene.js <scene-id>

# Preview in browser
npm run dev
# → open http://localhost:3000/motion/<subject_id>/<scene-id>.html
```

If the narration text changed in the spec, also regenerate — the audio
on disk is stale and the timings won't match the words.
