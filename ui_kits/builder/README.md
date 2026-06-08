# Manimo Builder (work in progress)

A visual, drag-and-drop scene editor: search the component library, drop
components onto a 1280×720 canvas, move them around, and tune their props —
all rendered live with the same motion primitives the hand-authored scenes
use. Lives alongside `studio/` (the review tool); it does not replace it.

## The core idea

A scene stops being **code** and becomes **data**: a *scene document* — a flat
list of component instances, each with a position, a time window, and prop
overrides. A generic renderer turns that document into the live React tree.
This is what makes search / drag / configure possible without code generation.

```
motion/registry.js          Catalog of placeable components + their prop schemas
motion/scene-doc.schema.json The scene-document format (instances w/ x,y,start,end,props)
motion/render-doc.jsx        Generic renderer: document → live <Stage> tree
ui_kits/builder/             This kit
  index.html                 Bootstrap (loads the motion lib + registry + renderer)
  builder.css                Editor chrome (palette · canvas · inspector)
  editor.jsx                 The editor app (search/add, drag, inspect)
  poc.jsx                    Original proof-of-concept document (kept for reference)
```

Open it at `http://localhost:3000/ui_kits/builder/` (trailing slash required —
the scripts load via relative paths).

## Status

- [x] **Phase 1 — Registry.** `motion/registry.js` describes ~10 components
      (Text, Geometry, Annotation, Physics, Character) with container kind,
      default box, and a typed prop schema (the inspector will auto-generate
      fields from this).
- [x] **Phase 2 — Generic renderer.** `motion/render-doc.jsx` renders a scene
      document into the same React tree as the editor (no iframe), wrapping
      each instance in a positioned box + a `<Sprite>` time window. Optional
      `selectedId` / `onSelect` props are the hooks the canvas will use for
      selection and drag. Proven: `poc.jsx` recreates the pendulum scene from
      data — verify with
      `node scripts/snapshot-scene.js ui_kits/builder/index.html --times 2,5,8,11`.
- [x] **Phase 3 — Canvas + drag + inspector.** Click a box to select, drag to
      move (x/y written back to the document). The inspector auto-generates a
      field per prop from the registry schema, plus position/timing fields and
      a layer list with delete. State persists to localStorage.
- [x] **Phase 4 — Palette + search.** Search the registry by name/keyword/
      category; click a card to add an instance at canvas centre (auto-selected
      so you can immediately drag/tune it).
- [x] **Phase 5 — Timeline + export.**
      - A per-instance timeline strip (bottom): one track per component; drag
        the bar to shift its `[start, end]`, drag the edges to resize, click
        the ruler to seek. A playhead tracks the Stage clock.
      - **Multi-select:** Cmd/Ctrl-click components (on the canvas or in the
        layer list) to select several; dragging any one moves the group.
      - **Export:** "Export document" downloads `<id>.doc.json`. Feed it to
        `node scripts/export-doc.js <doc.json> --subject <id>` to emit a
        standalone, publishable scene (`motion/<subject>/<id>.{html,jsx}`)
        that renders the document via RenderDoc — the same runtime as the
        editor — and upserts the manifest. Then publish as usual
        (`git push` → `npm run publish <id>`).

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Click / Cmd-click | Select / add-to-selection |
| Drag | Move selected (group moves together) |
| Arrow keys | Nudge selected 1px (Shift = 10px) |
| Backspace / Delete | Delete selected |
| Cmd/Ctrl+Z | Undo (coalesces rapid edits into one step) |
| Cmd/Ctrl+Shift+Z, Cmd/Ctrl+Y | Redo |
| Cmd/Ctrl+D | Duplicate selected |
| Esc | Deselect |
| Space | Play / pause (handled by the Stage) |

Selecting a single component pauses the Stage and seeks the playhead into its
`[start, end]` window, so property edits are immediately visible.

## Transform handles (single selection)

When exactly one component is selected, a Canva-style box appears around it:
drag a **corner** to resize (uniform `scale`, from the centre) and the **knob**
above to rotate (Shift snaps to 15°). Dragging the element body still moves it.
Scale and rotation are also editable as fields in the inspector, and apply in
playback/export too (CSS transform on the instance box). Tall elements can push
the rotate knob above the canvas top — rotate via the inspector field in that
case.

## Sizing note

SVG components (pendulum, paths, marks…) render with `overflow: visible`, so a
raw box width/height does nothing — their size lives in component props (length,
radius, the path, font size). The inspector therefore exposes a single **Scale**
for SVG instances (it scales the whole drawing via the viewBox) and a literal
**Width** for text/DOM instances (it controls wrapping).

## Known limitations (next polish pass)

- You can only select/drag an instance on the canvas while the playhead is
  inside its `[start, end]` window (outside it, `<Sprite>` unmounts the box).
  Use the layer list or the timeline to select any instance, or scrub first.
- Add-from-palette drops at canvas centre; drag-from-palette onto a point is
  a later nicety.
- The color/token fields are plain text inputs — a token picker comes later.
- Audio: a document can carry `narrationSrc`, but generating narration is
  still the existing `npm run audio` + `rewire-scene.js` flow, not yet wired
  into the builder.

## Coordinate model

An instance has stage-space `x`/`y` (top-left of its box). SVG components
address their own internal coords (`pivX`, `cx`, `d`…) **relative to that
box's viewBox**, so dragging the box moves the whole drawing while the
component's internal geometry stays stable.
