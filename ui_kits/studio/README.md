# Studio — Manimo's chat-driven video editor

The studio is a 3-column layout:

- **Left (360px) — Chat.** The user describes a lesson; Manimo responds with proposed scenes and refinements. Conversational, not form-based.
- **Center — Preview canvas.** A 16:9 (or 9:16) live preview of the currently-selected scene. Includes a transport (play, scrub, time).
- **Right (280px) — Scene list.** An ordered list of scenes Manimo composed. Drag to reorder, click to focus.

Above all three: a **top bar** with the wordmark, lesson title, aspect-ratio toggle, and a primary "Render lesson" action.

### Components in this kit

- `TopBar.jsx` — wordmark, lesson title (inline-editable), aspect toggle, render button
- `ChatPanel.jsx` + `ChatMessage.jsx` + `ChatComposer.jsx` — the conversation column
- `PreviewCanvas.jsx` — the 16:9/9:16 viewport, with drawn-on-paper graph background and a transport
- `SceneList.jsx` + `SceneCard.jsx` — the right column
- `ComponentLibrary.jsx` — the optional pop-out showing the pre-built blocks Manimo can compose (math, code, diagrams, data viz, characters)

### Exemplar content

The fake lesson being authored is **"Why a hoop rolls slower than a disk"** — moment of inertia from chapter 2 of *TFY4125 Fysikk*. Real formulas, real narration script.
