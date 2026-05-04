# Fonts

This system ships with **Google Fonts substitutions**, loaded via `@import` in `colors_and_type.css`. To self-host, drop `.woff2` files here and replace the `@import` with `@font-face` declarations.

| Role | Family | Weights used | License | Source |
|---|---|---|---|---|
| Display / serif | Fraunces | 400, 500, 600, 700 + italic | OFL 1.1 | https://fonts.google.com/specimen/Fraunces |
| Body / sans | Inter | 400, 500, 600, 700 | OFL 1.1 | https://fonts.google.com/specimen/Inter |
| Mono | JetBrains Mono | 400, 500 + italic | OFL 1.1 | https://fonts.google.com/specimen/JetBrains+Mono |

⚠️ All three are **substitutes** for an unspecified-yet-custom typographic system. If/when custom faces are commissioned, drop them here and update `colors_and_type.css`.
