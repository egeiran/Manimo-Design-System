# Preview — design-system review cards

This folder contains one self-contained HTML page per token category. The
cards are how the team (and the LLM-driven studio mock) reviews the
visual design system in isolation — separate from the studio / watch
UI kits and from any scene content.

Each card pulls only from `/colors_and_type.css` and `/fonts/` — no
component code, no React. Open them via the dev server:

```
npm run dev
# → http://localhost:3000/preview/<name>.html
```

## Cards

| File                    | Shows                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| `colors-surfaces.html`  | Canvas / elevated / overlay background tokens                        |
| `colors-foreground.html`| Foreground / text-on-dark tokens                                     |
| `colors-accents.html`   | Amber, rose, teal, violet accent ramps                               |
| `type-display.html`     | Fraunces display/serif type scale                                    |
| `type-body.html`        | Inter body type + line-height variants                               |
| `type-mono.html`        | JetBrains Mono — code, numerics, italics                             |
| `spacing.html`          | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px spacing tokens           |
| `radii.html`            | `--radius-sm/md/lg/xl` corner-radius tokens + pills                  |
| `shadows.html`          | 4-step elevation system                                              |
| `buttons.html`          | Primary / secondary / ghost button states                            |
| `badges.html`           | Status chips, tags                                                   |
| `inputs.html`           | Text fields, focus rings                                             |
| `cards.html`            | Card surfaces with shadow + hover transitions                        |
| `chat.html`             | Chat-message bubbles (studio context)                                |
| `motion.html`           | Easing curve previews + the loading sine-stroke                      |
| `icons.html`            | Lucide icon grid (loaded via CDN, see `README.md` § Iconography)     |
| `logo.html`             | Brand mark + wordmark variants                                       |

## When to add a card

When you add a new token category to `colors_and_type.css` that needs
visual review — not for every individual token. The cards are for
categorical decisions ("does this elevation step read against the
canvas?"), not exhaustive enumerations.

If the upstream design ever moves into a Figma file or real production
codebase, these cards should be regenerated against that source rather
than kept in sync by hand.
