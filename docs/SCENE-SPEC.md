# Scene spec reference

A *scene spec* is a JSON file that sits between a natural-language topic
request and the final JSX. An LLM (or you) fills the spec; a human
reviews it; a second LLM pass turns it into JSX via
`scripts/generate-scene.js`. The spec is dramatically cheaper to
iterate than going straight to code.

The authoritative schema is `motion/scene-spec.schema.json` (JSON
Schema draft-07). This document is a human walkthrough. When the schema
and this doc disagree, the schema wins.

## File location & naming

```
motion/<subject_id>/<scene-id>.spec.json
```

- `<scene-id>` is kebab-case and matches the spec's `id` field exactly.
- The matching JSX and HTML files sit next to it as `<scene-id>.jsx` and
  `<scene-id>.html`.

## Top-level fields

| Field             | Required | Type     | Notes                                                                                  |
| ----------------- | :------: | -------- | -------------------------------------------------------------------------------------- |
| `id`              |    ✓     | string   | Kebab-case, matches the filename. Stable forever.                                      |
| `title`           |    ✓     | string   | Display title in the scene's language.                                                 |
| `eyebrow`         |          | string   | Mono eyebrow line (e.g. "introduksjon").                                               |
| `language`        |    ✓     | enum     | `"no"` (Norwegian bokmål) or `"en"` (English). Source of truth for TTS voice + subs.   |
| `duration`        |    ✓     | number   | Total scene length in seconds. Kept in sync by `rewire-scene.js`.                      |
| `topic`           |          | string   | One-line topic summary for the manifest.                                               |
| `subject_id`      |          | string   | Subject this scene attaches to. See [`SUBJECTS.md`](SUBJECTS.md).                      |
| `chapter_number`  |          | integer  | Chapter within `subject_id`. Requires `subject_id` to be set.                          |
| `prerequisites`   |          | string[] | Scene IDs that should be understood first.                                             |
| `beats`           |    ✓     | array    | Ordered list of animation beats. Each maps to one `<Sprite>` in the JSX.               |

`additionalProperties: false` — unknown top-level fields are rejected
by the schema. **`concepts` is not a spec field** — it lives on the
manifest entry instead.

## Beats

Each beat is one `<Sprite start end>` block in the JSX. Beats are
ordered; their `start` / `end` ranges typically tile end-to-end
(possibly with small overlaps for crossfades).

| Beat field    | Required | Type     | Notes                                                              |
| ------------- | :------: | -------- | ------------------------------------------------------------------ |
| `id`          |    ✓     | string   | Short camelCase (`manimoIntro`, `circuitDiagram`).                 |
| `start`       |    ✓     | number   | Sprite start time in seconds.                                      |
| `end`         |    ✓     | number   | Sprite end time in seconds.                                        |
| `narration`   |    ✓     | string   | One sentence spoken by TTS. See narration rules in `AUDIO.md`.     |
| `visuals`     |    ✓     | object   | What should appear during this beat.                               |

`spec.beats[i].id` must match `audio.tracks[i].id` in
`motion/<subject>/audio/<id>/manifest.json`. `rewire-scene.js` enforces
this.

### `visuals`

| Field      | Type                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| `layout`   | enum: `"center"`, `"left-right"`, `"top-bottom"`, `"full"`. High-level spatial arrangement. |
| `elements` | array of visual elements, in the order they should appear.                                 |

### `visuals.elements`

Each element is one shape, label, or formula. Required fields per
element: `type` and `content`.

| Field      | Type    | Notes                                                                  |
| ---------- | ------- | ---------------------------------------------------------------------- |
| `type`     | enum    | See element type table below.                                          |
| `content`  | string  | Text, formula (Unicode or LaTeX), or path description.                 |
| `delay`    | number  | Seconds after beat start before this element appears.                  |
| `color`    | string  | CSS token (`"var(--amber-400)"`). **Never raw hex.**                   |
| `position` | string  | Freeform layout hint ("center", "below arm midpoint", "upper-left"…).  |
| `note`     | string  | Optional authoring note for the JSX-generation pass.                   |

Element `type` values (closed enum):

| Type             | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `text-title`     | Beat title (Fraunces, large).                            |
| `text-caption`   | Caption / explanatory line (Inter).                      |
| `text-formula`   | Formula (Fraunces italic or JetBrains Mono for numbers). |
| `svg-path`       | Hand-drawn-feel stroke path.                             |
| `svg-circle`     | Circle (filled or stroked).                              |
| `svg-arc`        | Arc segment.                                             |
| `svg-label`      | Label anchored to an SVG point.                          |
| `manimo-enter`   | Manimo brand-mark entrance.                              |
| `manimo-corner`  | Persistent corner watermark.                             |
| `graph-axes`     | Axes for a plot.                                         |
| `graph-curve`    | Plot curve.                                              |
| `graph-marker`   | Marker / point on a plot.                                |

## Minimal example

```json
{
  "id": "ohms-law",
  "title": "Ohm's Law",
  "eyebrow": "circuit theory",
  "language": "en",
  "duration": 22,
  "topic": "Voltage equals current times resistance.",
  "subject_id": "ade",
  "chapter_number": 1,
  "beats": [
    {
      "id": "title",
      "start": 0,
      "end": 3,
      "narration": "Ohm's Law — the simplest relationship between voltage, current, and resistance.",
      "visuals": {
        "layout": "center",
        "elements": [
          { "type": "text-title",   "content": "Ohm's Law", "delay": 0.2 },
          { "type": "text-caption", "content": "V = I R",   "delay": 0.8, "color": "var(--chalk-200)" }
        ]
      }
    },
    {
      "id": "intuition",
      "start": 3,
      "end": 22,
      "narration": "Push more voltage, more current flows. Add resistance, less flows.",
      "visuals": {
        "layout": "left-right",
        "elements": [
          { "type": "svg-path", "content": "battery + resistor + ammeter loop", "delay": 0.3 },
          { "type": "text-formula", "content": "V = I R", "delay": 1.0, "position": "center" }
        ]
      }
    }
  ]
}
```

## Generation flow

1. **Write the spec.** Either by hand or via an LLM authoring prompt
   (see the trigger prompts referenced in `PLAN.md`).
2. **Validate.** `scripts/generate-scene.js` checks the spec against
   `motion/scene-spec.schema.json` before generating.
3. **Generate JSX + HTML**:
   ```
   node scripts/generate-scene.js <path-to-spec>.json
   ```
   Outputs `<scene-id>.jsx` and `<scene-id>.html` under
   `motion/<subject_id>/`, and upserts the manifest entry.
4. **Audio + wiring**: see [`AUDIO.md`](AUDIO.md).
5. **Visual review**: `npm run snapshot motion/<subject>/<id>.html`.
6. **Publish**: see [`PUBLISHING.md`](PUBLISHING.md).

## Manifest vs spec

The spec describes **how to render a single scene**. The manifest
(`motion/scene-manifest.json`) describes **what scenes exist** and how
they relate. Registry-level metadata such as `concepts` (the list of
pedagogical concepts a scene teaches, used for cross-scene search and
lesson assembly) lives in the manifest, not the spec. `subject_id` and
`chapter_number` live in both — set them in the spec; the manifest is
written by `generate-scene.js` and kept in sync.
