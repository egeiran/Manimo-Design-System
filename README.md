# Manimo Design System

> A calm, scholarly, mathematically-minded brand for a chat-driven AI video studio that helps students learn STEM by generating 3blue1brown-style explainers.

---

## Product context

**Manimo** is a web-based studio for creating short technical explainer videos using cheap AI text-to-speech and an AI orchestrator that composes scenes from a library of pre-built visual components (math, code, diagrams, data viz, characters).

The user's input is conversational — they describe the lesson they want, the AI proposes scenes, the user refines via chat, the system renders to **16:9 (YouTube)** or **9:16 (TikTok / Shorts)**. Inspiration is explicitly drawn from [3blue1brown](https://www.youtube.com/@3blue1brown) — the calm, paced, single-narrator-with-evolving-visuals style — but generalized to any STEM topic and made authorable in minutes by non-animators.

**Audience.** High-school and university students learning STEM, plus the educators / hobbyists who want to teach them. Primary surface language: **English**.

**Output platforms.** YouTube (16:9 long-form) and TikTok / Shorts (9:16 vertical), equally weighted. The editor previews both aspect ratios live.

**Component library** the AI assembles from:
- LaTeX equations, graphs, geometric proofs
- Syntax-highlighted code, terminals, diffs
- Flowcharts and system-architecture diagrams
- Charts, plots, animated data-viz transitions
- A small cast of custom characters / illustrations for narration framing

### Surfaces in this system
1. **Studio** — the chat-driven editor where you compose a video
2. **Watch** — the public video page where lessons are consumed and shared

---

## Sources

This design system was created without an existing codebase, Figma, or brand assets — Manimo is a new product. Direction was set from a brief and a short Q&A:

- Tone: calm, scholarly, precise (3b1b-like — quietly confident)
- Aesthetic: mathy + warm dark (warm amber and rose curves on a deep indigo/plum ground)
- Color preference: dark-first
- Logo: decided in this system — wordmark + a small geometric mark derived from a curve through dots (the gesture of "drawing a function")
- Editor metaphor: chat-driven (describe → AI composes → refine in chat)

If a real Figma file or production codebase later exists, it should replace this section as the source of truth and the cards in `preview/` should be regenerated against it.

### Exemplar content

The user attached **`tfy4125.pdf`** (`uploads/fysikk/tfy4125.pdf` and extracted text in `uploads/fysikk/tfy4125.txt`) — physics notes for *TFY4125 Fysikk* at NTNU by Åsmund Eldhuset, covering rotational mechanics, harmonic oscillations, and electromagnetism. **All example content in the studio and watch UI kits is drawn from this document** — the fake video being composed teaches *rotational kinetic energy and moment of inertia* from chapter 2; the watch page shows *RC circuits* from chapter 4. This grounds the design in the kind of dense, formula-rich technical material Manimo is built to teach, instead of generic Lorem-Ipsum lessons.

---

## Index

Top-level files:

| File                                  | What it is                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `README.md`                           | This document — brand context, content rules, visual foundations, iconography                   |
| `SKILL.md`                            | Front-matter wrapper so this folder works as a Claude Code skill                                |
| `colors_and_type.css`                 | All design tokens (color, type scale, spacing, radius, shadow, motion) as CSS custom properties |
| `assets/`                             | Logos, illustrations, brand imagery                                                             |
| `fonts/`                              | Web fonts (or notes on Google Fonts substitutions)                                              |
| `preview/`                            | Design-system cards rendered for the Design System tab                                          |
| `ui_kits/studio/`                     | Hi-fi recreation of the chat-driven video studio                                                |
| `ui_kits/watch/`                      | Hi-fi recreation of the public video watch page                                                 |
| `motion/`                             | Animation primitives + scene template + worked example (`rc-scene`)                             |
| `CLAUDE.md`                           | Project conventions for automated agents — read first when authoring new scenes                 |
| `uploads/fysikk/tfy4125.pdf` + `.txt` | Source PDF for the exemplar lesson content                                                      |

### Quick links

- **Studio kit** → `ui_kits/studio/index.html` — chat-driven video editor (3-column app)
- **Watch kit** → `ui_kits/watch/index.html` — public video page (player + chapters + comments)
- **Motion library** → `motion/manimo-motion.jsx` + `motion/README.md` — animation primitives and how to use them
- **Example scene** → `motion/rc-scene.html` — 20-second τ = RC explainer (the canonical reference)
- **Scene template** → `motion/_scene-template.jsx` + `.html` — copy this when starting a new scene
- **Tokens** → `colors_and_type.css` — every color, type, spacing, radius, shadow, and motion variable
- **Brand mark** → `assets/manimo-mark.svg`, `assets/manimo-wordmark.svg`

---

## CONTENT FUNDAMENTALS

How Manimo writes copy.

### Voice
**Calm, scholarly, precise.** Sentences are unhurried but never indulgent. The narrator (the brand) is a knowledgeable friend who has thought hard about how to introduce an idea and is excited — quietly — to share it. Never breathless, never huckstery, never cute.

### Person
- **Second person ("you") for the learner.** "You'll see why this matters in a moment."
- **First person plural ("we") for shared exploration.** "We'll start with the simplest case."
- **First person singular ("I") only sparingly**, for direct pedagogical asides. Reserve for narration, not UI.
- The product itself is not personified. Manimo doesn't say "I think" — it says "Manimo found three scenes that fit."

### Casing
- **Sentence case** for everything: page titles, buttons, menu items, headings.
  - ✅ "Render preview"
  - ❌ "Render Preview"
- Brand name **Manimo** is always capitalized, never all-caps, never stylized.
- Code, math, and proper nouns keep their canonical casing (LaTeX, NumPy, π).

### Punctuation & rhythm
- Em dashes are welcome — they let an aside breathe.
- Avoid exclamation points except in tutorial copy where genuine encouragement is warranted ("Nicely done!").
- Numbers under ten are spelled out in prose ("three scenes"), digits used in UI ("3 scenes").

### Emoji
**No emoji in product UI, marketing, or system messages.** They break the calm. The one exception: user-authored content (a comment, a chat message they typed) is rendered as-is.

### Examples — voice in product copy

| Surface         | ✅ On-brand                                                                               | ❌ Off-brand                                       |
| --------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Empty editor    | "Describe the lesson you want to teach. We'll sketch the first scene together."          | "🚀 Let's make some videos!!"                      |
| Render success  | "Your video is ready. 1 min 42 sec."                                                     | "Boom! 💥 Done!"                                   |
| Error           | "Something went wrong while rendering. We saved your work — try again, or ask for help." | "Oops! Looks like our gremlins are at it again 😅" |
| Marketing hero  | "Teach a topic in the time it takes to explain it."                                      | "Create stunning AI videos in seconds!"           |
| Onboarding step | "Pick a topic you've thought about for a long time. Familiarity is the best start."      | "Let's get you set up and ready to ROCK 🎸"        |

### Examples — voice in narration scripts (the videos themselves)

> ✅ "Imagine you're standing at the origin of a coordinate plane. The function we want to understand is simple: it takes a number and squares it. Let's see what that does to a few points."

> ❌ "OK so basically the function squares the input. Cool. Let's plot it!"

The narrator is patient, specific, and confident enough to slow down.

### Microcopy quirks
- **Prefer "lesson" or "scene"** over "video" or "slide" inside the studio. The unit of thought is the lesson; the unit of construction is the scene.
- **Render**, not "export" or "publish." Manimo *renders* a lesson. ("Publish" is the separate step of pushing to YouTube/TikTok.)
- **Manimo found / Manimo suggests / Manimo paused** — when surfacing AI behavior in UI, name the system explicitly so users feel oriented, not surprised.

---

## VISUAL FOUNDATIONS

The aesthetic in one line: **chalkboard meets observatory.** Deep indigo-plum grounds, warm amber/rose curves, generous breathing room, serif math typography, and motion that *eases* like a hand drawing on a board.

### Color
- **Dark-first.** The studio and watch page default to a deep indigo-plum ground (`--bg-canvas: #14102b`) with warm amber, rose, and teal accents. Light mode exists but is secondary.
- Backgrounds are never pure black — always a warm-tinted near-black so curves and chalk-tones sit comfortably.
- Accents are **warm and few**: amber (`#f4b860`) for primary action, rose (`#e87a90`) for emphasis, teal (`#7fd1c5`) for data/code, soft violet (`#9b8cff`) for AI/system tones. Reds are reserved for destructive states only.
- Color is used sparingly — large dark expanses, a single warm curve or chip drawing the eye. Never a rainbow of accents on one screen.
- See `colors_and_type.css` for the full token list.

### Typography
- **Display & headings — serif.** A warm contemporary serif (we use **Fraunces** as a substitute for an upcoming custom face — flag below). Used for hero text, section titles, in-video titles. Italic is welcome for math labels and pull-quotes.
- **Body & UI — humanist sans.** **Inter** — clean, generous letterspacing, comfortable at small sizes.
- **Mono — geometric mono.** **JetBrains Mono** for code, terminal output, equation source.
- **Math** rendered via KaTeX with the default Latin Modern face — italic by convention, never forced upright.
- Long-form copy is set at 17px / 1.6 line-height. UI labels at 13–14px / 1.4. Headings step on a 1.25 modular scale.

### Spacing & layout
- 8px base grid. Tokens at 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px.
- Generous padding inside cards (24–32px). The system errs toward more whitespace, fewer dividers — light, calm density.
- The studio uses a 3-column layout: chat (left, ~360px), preview canvas (center, fluid), scene list (right, ~280px). The watch page is centered, max-width 880px for prose, full-bleed for the video.
- Fixed elements: the top bar (56px) on every authenticated surface, never anywhere else. No sticky sidebars; the chat scrolls inside its own column.

### Backgrounds
- Solid color is the default. **No** stock photography, **no** glassy bluish-purple gradients, **no** mesh-gradient blob clouds.
- A subtle, optional **graph-paper grid** (1px lines at 4% opacity, 32px cell) is allowed on hero surfaces and the empty-state of the preview canvas — evoking a chalkboard ruled for math.
- Decorative imagery comes only from in-system illustrations (a hand-drawn-feel character, a curve through dots, a pi glyph) — used at most once per screen.

### Motion
- **Easing: smooth, mathematical.** Default curve is `cubic-bezier(0.32, 0.72, 0.0, 1.0)` — a long ease-out that feels like a curve being drawn.
- Default duration **240ms** for most state changes, **600–900ms** for "drawing" reveals (a line tracing across the canvas).
- **No bounces.** No spring overshoots. No comic-book pops.
- Page transitions: **opacity + 8px translate**, never slide-right horror shows.
- Loading: a **stroked path drawing itself** along a sine curve — slow, hypnotic. No spinners.
- Reduced-motion: all animation collapses to instant opacity fades.

### Hover & press
- **Hover = lighter, not bigger.** Buttons brighten their fill by ~6% lightness; cards lift by `--shadow-2`. No scale transforms on hover.
- **Press = subtle shrink + darken.** `transform: scale(0.985)` + 4% darker fill, 90ms. Just enough proprioceptive feedback.
- Focus rings are 2px **amber** (`--accent-warm`), offset 2px, on every interactive element. Always visible — never `outline: none` without replacement.

### Borders
- Borders are **rare and quiet**. A single 1px line at 8% white-on-dark separates major regions. Inside cards, separators come from spacing, not strokes.
- Inputs have a 1px border at 14% white that brightens to amber on focus.

### Shadows
A 4-step elevation system, all warm-tinted (a hint of magenta in the shadow color, never neutral grey):
- `--shadow-1` — resting cards (subtle, 1px y, 2px blur, 12% alpha)
- `--shadow-2` — hover state
- `--shadow-3` — popovers / menus
- `--shadow-4` — modals / focused dialogs

On dark surfaces, "shadow" is also achieved via a 1px top inner highlight (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.04)`) that gives cards a subtle "lit from above" feel.

### Corner radii
- `--radius-sm: 6px` — chips, tags, code
- `--radius-md: 10px` — buttons, inputs
- `--radius-lg: 16px` — cards, panels
- `--radius-xl: 24px` — hero/feature surfaces, the preview canvas frame
- Pills (full-round) are reserved for status badges and the chat avatar.

### Transparency & blur
- Used sparingly. The chat composer and the watch-page top bar use a backdrop-blur + 70% opacity ground. Modals dim the background to 60% with a 12px blur.
- Never on cards or buttons. A frosted card is a tell of a generic SaaS template; we don't do it.

### Imagery vibe
When real imagery is used (rare), it's **warm-toned, slightly desaturated, with a faint film grain.** Cool/blue photography is avoided — it clashes with the warm accents.

### Cards
- Background: `--bg-elevated` (one step lighter than canvas).
- Border: none, OR 1px at 6% white for low-contrast separation.
- Radius: `--radius-lg` (16px).
- Shadow: `--shadow-1` resting → `--shadow-2` hover, smoothly.
- Padding: 24px default, 32px for hero cards.

### Layout rules
- Top bar is the only fixed element.
- The preview canvas in the studio is always 16:9 OR 9:16 — never letterboxed inside a 4:3 frame, never stretched.
- Long pages have a max content width of 720px for prose, 1280px for app surfaces.

---

## ICONOGRAPHY

Manimo uses **[Lucide](https://lucide.dev)** as its icon system, loaded via CDN. Lucide's 1.5px-stroke geometric style matches the brand's quiet precision and doesn't compete with the warm serif typography.

### Why Lucide
- Open-source, comprehensive (~1500 icons), MIT licensed.
- 1.5px stroke weight — slim enough to feel calm, heavy enough to read at 16px.
- Geometric construction — straight lines, circular arcs, no flourishes — pairs well with the math motif.

### Sizes
- 16px in dense UI (input affordances, list-row trailing)
- 20px default (toolbar buttons, menu items)
- 24px for primary actions and the top bar

### Color
Icons inherit `currentColor`. Default tone is `--fg-2` (muted); they brighten to `--fg-1` on hover and to `--accent-warm` when in an active state.

### Loading
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
<i data-lucide="play"></i>
<script>lucide.createIcons();</script>
```

### Custom mark icons
Two glyphs are part of the brand and live in `assets/`:
- `manimo-mark.svg` — the geometric mark from the logo (a curve threaded through three dots)
- `manimo-wordmark.svg` — the full lockup

These are **never** treated as Lucide icons. They are brand assets, only used in the logo, the splash screen, and as a watermark in rendered videos.

### Emoji
**Not used in product UI.** Period. (See Content Fundamentals.)

### Unicode
A small set of mathematical Unicode characters is allowed in narration source and code samples — π, ∑, ∫, ∞, ≠, ≈, ∈, ℝ, ℕ, etc. — set in the serif display face. They are **not** used as decorative bullets or list markers.

### Substitution flag
Lucide is the canonical pick going forward. If a future custom icon set is commissioned (a Manimo-branded family with a chalk-stroke vibe), it should replace Lucide everywhere; Lucide is the off-the-shelf interim, not a permanent decision.

---

## Font substitution flag

The display face and body face here are **substitutions** for unspecified-yet-custom faces:

| Role            | Currently using    | Source       | Status               |
| --------------- | ------------------ | ------------ | -------------------- |
| Display / serif | **Fraunces**       | Google Fonts | Substitute — flagged |
| Body / sans     | **Inter**          | Google Fonts | Substitute — flagged |
| Mono            | **JetBrains Mono** | Google Fonts | Substitute — flagged |

Fraunces has a warm, slightly quirky personality that matches the "mathy + warm dark" direction well. Inter is a safe, neutral body face. JetBrains Mono is the mono pick because of its strong italics (good for variables in code).

If you (the user) commission custom fonts, drop the `.woff2` files in `fonts/` and update the `@font-face` block at the top of `colors_and_type.css`.
