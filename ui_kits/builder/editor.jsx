// ui_kits/builder/editor.jsx — Visual scene builder (Phase 3 + 4 + 5).
// ===========================================================================
// A four-region editor over the data-driven scene model:
//   • Palette (left)     — searchable component registry; click to add.
//   • Canvas (center)    — live <Stage>; click to select, drag to move.
//                          Cmd/Ctrl-click adds to the selection (multi-select);
//                          dragging any selected box moves the whole group.
//   • Inspector (right)  — props auto-generated from the registry schema,
//                          plus position/timing fields and a layer list.
//   • Timeline (bottom)  — one track per instance; drag the bar to shift its
//                          [start, end], drag the edges to resize. A playhead
//                          tracks the Stage clock; click the ruler to seek.
//
// The scene is a document (motion/scene-doc.schema.json) held in React state
// and persisted to localStorage. RenderDoc renders it into the same React
// tree as the editor, which is what makes selection and drag work.

const { useState, useEffect, useRef } = React;

const LS_DOC = 'manimo.builder.doc';
const LS_LIBRARY = 'manimo.builder.library';

// A scene document is well-formed enough to load if it carries a numeric
// `duration` and an `instances` array. Used by both Import and the library.
function bValidateDoc(obj) {
  if (!obj || typeof obj !== 'object') return 'Not a JSON object.';
  if (typeof obj.duration !== 'number' || !isFinite(obj.duration)) return 'Missing a numeric "duration".';
  if (!Array.isArray(obj.instances)) return 'Missing an "instances" array.';
  return null;
}

// Extract a scene document from pasted/loaded text. Accepts either a raw
// scene-document JSON, OR a builder-exported scene .jsx (which embeds the
// document as `const SCENE_DOC = { … };` — written by scripts/export-doc.js).
// Returns { doc } on success or { error } with a message.
// NOTE: this does NOT understand hand-authored scenes (bespoke JSX without a
// SCENE_DOC literal) — those have no data model to import.
function bExtractDoc(raw) {
  const text = String(raw || '');
  try { return { doc: JSON.parse(text) }; } catch { /* not plain JSON — try SCENE_DOC */ }

  const marker = text.indexOf('SCENE_DOC');
  if (marker === -1) {
    return { error: 'Not JSON, and no SCENE_DOC found. Paste a scene-document JSON, or a builder-exported .jsx.' };
  }
  const eq = text.indexOf('=', marker);
  const start = text.indexOf('{', eq);
  if (eq === -1 || start === -1) return { error: 'Found SCENE_DOC but no object literal after it.' };

  // Balance braces, skipping over string contents (the export is JSON, but a
  // caption/path string could contain a stray brace).
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try { return { doc: JSON.parse(text.slice(start, i + 1)) }; }
        catch (e) { return { error: 'Found SCENE_DOC but could not parse it: ' + (e && e.message ? e.message : 'parse error') }; }
      }
    }
  }
  return { error: 'Found SCENE_DOC but its object literal is unterminated.' };
}

// Named scene library persisted as { [name]: doc } under LS_LIBRARY.
function bLoadLibrary() {
  try {
    const v = localStorage.getItem(LS_LIBRARY);
    if (v) {
      const parsed = JSON.parse(v);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch { /* fall through */ }
  return {};
}
function bSaveLibrary(lib) {
  try { localStorage.setItem(LS_LIBRARY, JSON.stringify(lib)); } catch { /* ignore quota */ }
}

let _idSeq = 0;
function builderUid(prefix) {
  _idSeq += 1;
  return `${prefix}-${_idSeq}-${performance.now() | 0}`;
}

const clampNum = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round1 = (v) => Math.round(v * 10) / 10;

// Seed document: the pendulum scene, identical to poc.jsx but now editable.
const BUILDER_DEFAULT_DOC = {
  id: 'builder-scene',
  title: 'Untitled scene',
  language: 'en',
  duration: 14,
  chrome: {
    eyebrow: 'pendulum motion',
    title: 'The Simple Pendulum',
    introEnd: 4.5,
    introCaption: 'Pull a weight on a string — what sets the rhythm?',
  },
  instances: [
    { id: 'pivot-line', component: 'trace-path', x: 470, y: 150, w: 340, h: 30, start: 4.5, end: 14,
      props: { d: 'M 0 15 L 340 15', stroke: 'var(--chalk-300)', strokeWidth: 3, duration: 0.8 } },
    { id: 'pendulum', component: 'swinging-pendulum', x: 480, y: 150, w: 320, h: 440, start: 4.5, end: 14,
      props: { pivX: 160, pivY: 16, L: 300, maxAngle: 24, period: 2.4, bobLabel: 'm', color: 'var(--amber-400)' } },
    { id: 'pivot-mark', component: 'pulse-mark', x: 480, y: 150, w: 320, h: 60, start: 5.4, end: 14,
      props: { cx: 160, cy: 16, color: 'var(--amber-300)', radius: 4, pulseRadius: 22, delay: 0.2 } },
    { id: 'caption', component: 'caption', x: 340, y: 612, w: 600, start: 6.0, end: 14,
      props: { text: 'The period depends on length and gravity — not the mass.', fontSize: 26, italic: true, color: 'var(--chalk-100)', duration: 1.0 } },
  ],
};

function loadBuilderDoc() {
  try {
    const v = localStorage.getItem(LS_DOC);
    if (v) return JSON.parse(v);
  } catch { /* fall through */ }
  return JSON.parse(JSON.stringify(BUILDER_DEFAULT_DOC));
}

// Subscribe to the live Stage clock (set up by animations.jsx after mount).
function useStageTime() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let unsub = null, raf = null, cancelled = false;
    const attach = () => {
      if (cancelled) return;
      const s = window.__manimoStage;
      if (s && s.subscribe) unsub = s.subscribe(({ time }) => setT(time));
      else raf = requestAnimationFrame(attach);
    };
    attach();
    return () => { cancelled = true; if (unsub) unsub(); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return t;
}

// ── Palette ────────────────────────────────────────────────────────────
// A small monochrome glyph per component, so the list is scannable at a glance.
function PaletteIcon({ kind }) {
  const s = { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'text':     return <svg {...s}><path d="M3 6h14M3 10h10M3 14h12" /></svg>;
    case 'label':    return <svg {...s}><path d="M4 4h7l5 5-7 7-5-5z" /><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" /></svg>;
    case 'code':     return <svg {...s}><path d="M7 6l-4 4 4 4" /><path d="M13 6l4 4-4 4" /></svg>;
    case 'path':     return <svg {...s}><path d="M3 15 C 7 3, 13 3, 17 15" /></svg>;
    case 'arrow':    return <svg {...s}><path d="M4 16 L16 4" /><path d="M10 4h6v6" /></svg>;
    case 'axes':     return <svg {...s}><path d="M5 3v12h12" /><path d="M14 13l3 2-3 2" /><path d="M3 6l2-3 2 3" /></svg>;
    case 'dot':      return <svg {...s}><circle cx="10" cy="10" r="4" fill="currentColor" stroke="none" /></svg>;
    case 'pulse':    return <svg {...s}><circle cx="10" cy="10" r="2.4" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r="7" /></svg>;
    case 'bracket':  return <svg {...s}><path d="M13 3H6v14h7" /></svg>;
    case 'rect':       return <svg {...s}><rect x="3" y="5" width="14" height="10" rx="1.5" /></svg>;
    case 'numberline': return <svg {...s}><path d="M3 10h14" /><path d="M5 8v4M9 8v4M13 8v4M17 8v4" /></svg>;
    case 'curve':      return <svg {...s}><path d="M3 16 C 7 16, 8 4, 12 4 C 15 4, 16 12, 17 13" /></svg>;
    case 'resistor':   return <svg {...s}><path d="M2 10h3l1.5-4 3 8 3-8 1.5 4h3" /></svg>;
    case 'capacitor':  return <svg {...s}><path d="M2 10h6M12 10h6" /><path d="M8 5v10M12 5v10" /></svg>;
    case 'pendulum': return <svg {...s}><path d="M5 3h10" /><path d="M10 3v9" /><circle cx="10" cy="15" r="3" fill="currentColor" stroke="none" /></svg>;
    case 'wheel':    return <svg {...s}><circle cx="10" cy="10" r="6" /><path d="M10 10h5" /></svg>;
    case 'mascot':   return <svg {...s}><path d="M4 15 Q6 8 11 8 Q16 8 14 13" /><circle cx="10.5" cy="10" r="0.9" fill="currentColor" stroke="none" /></svg>;
    default:         return <svg {...s}><rect x="4" y="4" width="12" height="12" rx="2" /></svg>;
  }
}

function Palette({ onAdd }) {
  const [q, setQ] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const registry = window.ManimoRegistry || {};
  const cats = window.ManimoRegistryCategories || [];

  const entries = Object.keys(registry).map((key) => ({ key, ...registry[key] }));
  const needle = q.trim().toLowerCase();
  const searching = needle.length > 0;
  const matches = entries.filter((e) => {
    if (!searching) return true;
    const hay = [e.label, e.category, e.description, ...(e.keywords || [])].join(' ').toLowerCase();
    return hay.includes(needle);
  });

  const order = (c) => { const i = cats.indexOf(c); return i === -1 ? 999 : i; };
  const byCat = {};
  matches.forEach((e) => { (byCat[e.category] = byCat[e.category] || []).push(e); });
  const catNames = Object.keys(byCat).sort((a, b) => order(a) - order(b));
  const toggle = (c) => setCollapsed((m) => ({ ...m, [c]: !m[c] }));

  return (
    <div className="b-palette">
      <input
        className="b-search"
        placeholder="Search components…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="b-palette-scroll">
        {catNames.length === 0 && <div className="b-empty" style={{ padding: 8 }}>No matches.</div>}
        {catNames.map((cat) => {
          const open = searching || !collapsed[cat];
          return (
            <div key={cat}>
              <button className="b-cat-header" onClick={() => toggle(cat)}>
                <span className={`b-chev ${open ? 'open' : ''}`}>▸</span>
                <span className="b-cat-name">{cat}</span>
                <span className="b-cat-count">{byCat[cat].length}</span>
              </button>
              {open && byCat[cat].map((e) => (
                <button
                  key={e.key}
                  className="b-card"
                  onClick={() => onAdd(e.key)}
                  title={e.description}
                  draggable
                  onDragStart={(ev) => {
                    ev.dataTransfer.setData('application/x-manimo-component', e.key);
                    ev.dataTransfer.setData('text/plain', e.key);
                    ev.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <span className="b-card-icon"><PaletteIcon kind={e.icon} /></span>
                  <span className="b-card-text">
                    <span className="b-card-name">{e.label}</span>
                    <span className="b-card-desc">{e.description}</span>
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Canvas drag snapping ─────────────────────────────────────────────────
const BUILDER_STAGE_W = 1280;
const BUILDER_STAGE_H = 720;
const BUILDER_SNAP_TOL = 6; // stage px

// Visual bounding box of an instance (top-left + size), scale-aware. Mirrors
// the geometry render-doc.jsx uses for the selection overlay.
function bInstanceBox(inst) {
  const registry = window.ManimoRegistry || {};
  const entry = registry[inst.component] || {};
  const box = entry.defaultBox || { w: 200, h: 200 };
  const baseW = entry.container === 'svg' ? box.w : (inst.w != null ? inst.w : box.w);
  const baseH = entry.container === 'svg' ? box.h : (inst.h != null ? inst.h : box.h);
  const scale = inst.scale != null ? inst.scale : 1;
  const visW = baseW * scale;
  const visH = baseH * scale;
  const cx = (inst.x || 0) + baseW / 2;
  const cy = (inst.y || 0) + baseH / 2;
  return { left: cx - visW / 2, right: cx + visW / 2, cx, top: cy - visH / 2, bottom: cy + visH / 2, cy, w: visW, h: visH };
}

// Given the dragged group's proposed top-left positions, snap the group so its
// outer left/center/right (x) and top/middle/bottom (y) align to the canvas
// centre lines and to other instances' edges/centres. Returns the snap delta
// and the active guide lines (in stage coords) to draw.
function bComputeSnap(doc, dragIds, proposed) {
  const idSet = new Set(dragIds);
  // Outer visual bounds of the proposed group (use proposed x/y).
  let gl = Infinity, gr = -Infinity, gt = Infinity, gb = -Infinity;
  proposed.forEach((p) => {
    const inst = doc.instances.find((i) => i.id === p.id);
    if (!inst) return;
    const b = bInstanceBox({ ...inst, x: p.x, y: p.y });
    gl = Math.min(gl, b.left); gr = Math.max(gr, b.right);
    gt = Math.min(gt, b.top); gb = Math.max(gb, b.bottom);
  });
  if (!isFinite(gl)) return { dx: 0, dy: 0, guides: [] };
  const gcx = (gl + gr) / 2, gcy = (gt + gb) / 2;

  // Candidate target lines from the canvas centre and every other instance.
  const xTargets = [BUILDER_STAGE_W / 2];
  const yTargets = [BUILDER_STAGE_H / 2];
  doc.instances.forEach((inst) => {
    if (idSet.has(inst.id)) return;
    const b = bInstanceBox(inst);
    xTargets.push(b.left, b.cx, b.right);
    yTargets.push(b.top, b.cy, b.bottom);
  });

  // For each of the group's three x anchors, find the nearest target.
  const pickX = [gl, gcx, gr];
  const pickY = [gt, gcy, gb];
  let bestDx = 0, bestDxErr = BUILDER_SNAP_TOL + 1, guideX = null;
  pickX.forEach((src) => {
    xTargets.forEach((t) => {
      const err = Math.abs(t - src);
      if (err < bestDxErr) { bestDxErr = err; bestDx = t - src; guideX = t; }
    });
  });
  let bestDy = 0, bestDyErr = BUILDER_SNAP_TOL + 1, guideY = null;
  pickY.forEach((src) => {
    yTargets.forEach((t) => {
      const err = Math.abs(t - src);
      if (err < bestDyErr) { bestDyErr = err; bestDy = t - src; guideY = t; }
    });
  });

  const dx = bestDxErr <= BUILDER_SNAP_TOL ? bestDx : 0;
  const dy = bestDyErr <= BUILDER_SNAP_TOL ? bestDy : 0;
  const guides = [];
  if (bestDxErr <= BUILDER_SNAP_TOL && guideX != null) guides.push({ axis: 'v', pos: guideX });
  if (bestDyErr <= BUILDER_SNAP_TOL && guideY != null) guides.push({ axis: 'h', pos: guideY });
  return { dx, dy, guides };
}

// ── Canvas ─────────────────────────────────────────────────────────────
function EditorCanvas({ doc, selectedIds, onSelect, onMoveBatch, onTransform, onAddAt }) {
  const drag = useRef(null);
  const [guides, setGuides] = useState([]);
  const docRef = useRef(doc); docRef.current = doc;

  // Convert a screen-space drop point to stage coords using the same math the
  // instance drag path uses (canvas rect + stage width).
  const screenToStage = (clientX, clientY) => {
    const stage = window.__manimoStage;
    const el = stage && stage.getCanvasEl && stage.getCanvasEl();
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const sw = (stage && stage.width) || BUILDER_STAGE_W;
    const scale = rect.width / sw || 1;
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  };

  const onCanvasDragOver = (e) => {
    if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'application/x-manimo-component') !== -1) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };
  const onCanvasDrop = (e) => {
    const key = e.dataTransfer && e.dataTransfer.getData('application/x-manimo-component');
    if (!key) return;
    e.preventDefault();
    const p = screenToStage(e.clientX, e.clientY);
    if (p && onAddAt) onAddAt(key, p.x, p.y);
  };

  useEffect(() => {
    const onMoveEvt = (e) => {
      const d = drag.current;
      if (!d) return;
      const stage = window.__manimoStage;
      const el = stage && stage.getCanvasEl && stage.getCanvasEl();
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const sw = (stage && stage.width) || BUILDER_STAGE_W;
      const scale = rect.width / sw || 1;
      const dx = (e.clientX - d.mx) / scale;
      const dy = (e.clientY - d.my) / scale;
      const proposed = d.items.map((it) => ({ id: it.id, x: it.x0 + dx, y: it.y0 + dy }));
      const snap = bComputeSnap(docRef.current, d.items.map((it) => it.id), proposed);
      setGuides(snap.guides);
      onMoveBatch(proposed.map((p) => ({ id: p.id, x: Math.round(p.x + snap.dx), y: Math.round(p.y + snap.dy) })));
    };
    const onUp = () => { drag.current = null; setGuides([]); };
    window.addEventListener('mousemove', onMoveEvt);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMoveEvt);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onMoveBatch]);

  // Selection + drag-start on instance press.
  const handleSelect = (id, e) => {
    const meta = e.metaKey || e.ctrlKey;
    let next;
    if (meta) {
      // Toggle membership; no drag on a modifier-click.
      next = selectedIds.indexOf(id) !== -1 ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
      onSelect(next);
      return;
    }
    next = selectedIds.indexOf(id) !== -1 ? selectedIds : [id];
    onSelect(next);
    const items = next
      .map((sid) => { const ins = doc.instances.find((i) => i.id === sid); return ins ? { id: sid, x0: ins.x || 0, y0: ins.y || 0 } : null; })
      .filter(Boolean);
    drag.current = { items, mx: e.clientX, my: e.clientY };
  };

  return (
    <div className="b-canvas" onMouseDown={() => onSelect([])} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop}>
      <Stage width={1280} height={720} duration={doc.duration} background="var(--bg-canvas)">
        <RenderDoc doc={doc} selectedIds={selectedIds} onSelect={handleSelect} onTransform={onTransform} guides={guides} />
      </Stage>
    </div>
  );
}

// ── Timeline ───────────────────────────────────────────────────────────
function Timeline({ doc, selectedIds, onSelect, onPatchInstance }) {
  const time = useStageTime();
  const dur = doc.duration || 1;
  const ref = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    const move = (e) => {
      const d = drag.current;
      if (!d) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dSec = ((e.clientX - d.mx) / rect.width) * dur;
      let s = d.s0, en = d.e0;
      if (d.mode === 'move') {
        s = d.s0 + dSec; en = d.e0 + dSec;
        if (s < 0) { en -= s; s = 0; }
        if (en > dur) { s -= (en - dur); en = dur; }
      } else if (d.mode === 'start') {
        s = clampNum(d.s0 + dSec, 0, d.e0 - 0.1);
      } else {
        en = clampNum(d.e0 + dSec, d.s0 + 0.1, dur);
      }
      onPatchInstance(d.id, { start: round1(s), end: round1(en) });
    };
    const up = () => { drag.current = null; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dur, onPatchInstance]);

  const startDrag = (inst, mode, e) => {
    e.stopPropagation();
    onSelect([inst.id]);
    drag.current = { id: inst.id, mode, mx: e.clientX, s0: inst.start != null ? inst.start : 0, e0: inst.end != null ? inst.end : dur };
  };

  const seek = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const s = window.__manimoStage;
    if (s && s.setTime) s.setTime(clampNum(x * dur, 0, dur));
  };

  const registry = window.ManimoRegistry || {};

  return (
    <div className="b-timeline">
      <div className="b-timeline-head">timeline · {dur}s</div>
      <div className="b-tl-tracks" ref={ref} onMouseDown={seek}>
        <div className="b-tl-playhead" style={{ left: `${(time / dur) * 100}%` }} />
        {doc.instances.map((inst) => {
          const s = inst.start != null ? inst.start : 0;
          const en = inst.end != null ? inst.end : dur;
          const reg = registry[inst.component];
          const sel = selectedIds.indexOf(inst.id) !== -1;
          return (
            <div key={inst.id} className="b-tl-row">
              <div
                className={`b-tl-bar ${sel ? 'selected' : ''}`}
                style={{ left: `${(s / dur) * 100}%`, width: `${((en - s) / dur) * 100}%` }}
                onMouseDown={(e) => startDrag(inst, 'move', e)}
                title={(reg && reg.label) || inst.component}
              >
                <span className="b-tl-handle l" onMouseDown={(e) => startDrag(inst, 'start', e)} />
                <span className="b-tl-label">{(reg && reg.label) || inst.component}</span>
                <span className="b-tl-handle r" onMouseDown={(e) => startDrag(inst, 'end', e)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Inspector fields ───────────────────────────────────────────────────
function NumberField({ label, value, onChange, min, max, step }) {
  return (
    <div className="b-field">
      <label>{label}</label>
      <input type="number" value={value} min={min} max={max} step={step || 'any'}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
    </div>
  );
}
function SliderField({ label, value, onChange, min, max, step }) {
  return (
    <div className="b-field">
      <label>{label}</label>
      <input type="range" value={value} min={min} max={max} step={step || 1}
        onChange={(e) => onChange(Number(e.target.value))} />
      <span className="b-range-val">{value}</span>
    </div>
  );
}
function TextField({ label, value, onChange }) {
  return (
    <div className="b-field">
      <label>{label}</label>
      <input type="text" value={value == null ? '' : value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function ToggleField({ label, value, onChange }) {
  return (
    <div className="b-field">
      <label>{label}</label>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}
// A small brand palette offered as clickable swatches in the token picker.
// Each entry is a design-token string; the swatch's background is set to the
// token itself (no raw hex in this file — the var() resolves at paint time).
const BUILDER_TOKEN_SWATCHES = [
  'var(--amber-400)', 'var(--amber-300)', 'var(--rose-400)',
  'var(--teal-400)', 'var(--teal-300)', 'var(--violet-400)',
  'var(--chalk-100)', 'var(--chalk-300)', 'var(--chalk-50)', 'var(--bg-canvas)',
];

// Color/token control: a row of clickable swatches over the brand palette plus
// a free-text input so any custom token string can still be typed.
function BuilderTokenField({ label, value, onChange }) {
  const cur = value == null ? '' : value;
  return (
    <div className="b-field b-token-field">
      <label>{label}</label>
      <div className="b-token-body">
        <div className="b-swatches">
          {BUILDER_TOKEN_SWATCHES.map((tok) => (
            <button
              key={tok}
              type="button"
              className={`b-swatch ${cur === tok ? 'selected' : ''}`}
              style={{ background: tok }}
              title={tok}
              onClick={() => onChange(tok)}
            />
          ))}
        </div>
        <input
          type="text"
          className="b-token-input"
          value={cur}
          placeholder="var(--token)"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function PropField({ spec, value, onChange }) {
  const v = value == null ? spec.default : value;
  if (spec.control === 'slider') return <SliderField label={spec.label} value={v} onChange={onChange} min={spec.min} max={spec.max} step={spec.step} />;
  if (spec.control === 'toggle') return <ToggleField label={spec.label} value={v} onChange={onChange} />;
  if (spec.control === 'number') return <NumberField label={spec.label} value={v} onChange={onChange} min={spec.min} max={spec.max} step={spec.step} />;
  if (spec.control === 'token') return <BuilderTokenField label={spec.label} value={v} onChange={onChange} />;
  return <TextField label={spec.label} value={v} onChange={onChange} />;
}

// ── Inspector ──────────────────────────────────────────────────────────
function Inspector({ doc, selectedIds, onPatchInstance, onPatchProp, onPatchChrome, onPatchDoc, onDelete, onDeleteMany, onSelect }) {
  const registry = window.ManimoRegistry || {};
  const single = selectedIds.length === 1 ? doc.instances.find((i) => i.id === selectedIds[0]) : null;
  const entry = single ? registry[single.component] : null;
  const chrome = doc.chrome || {};

  return (
    <div className="b-inspector">
      {selectedIds.length === 0 && (
        <>
          <div className="b-section-label">Scene</div>
          <NumberField label="Duration (s)" value={doc.duration} min={1} step={0.5}
            onChange={(v) => onPatchDoc({ duration: v === '' ? 1 : v })} />
          <TextField label="Eyebrow" value={chrome.eyebrow} onChange={(v) => onPatchChrome({ eyebrow: v })} />
          <TextField label="Heading" value={chrome.title} onChange={(v) => onPatchChrome({ title: v })} />
          <TextField label="Intro text" value={chrome.introCaption} onChange={(v) => onPatchChrome({ introCaption: v })} />
          <NumberField label="Intro end (s)" value={chrome.introEnd != null ? chrome.introEnd : 0} min={0} step={0.1}
            onChange={(v) => onPatchChrome({ introEnd: v === '' ? 0 : v })} />
          <div className="b-empty" style={{ marginTop: 10 }}>
            Select a component on the canvas or in the layers below to edit it.
            Cmd/Ctrl-click to select several.
          </div>
        </>
      )}

      {selectedIds.length > 1 && (
        <>
          <div className="b-section-label">{selectedIds.length} components selected</div>
          <div className="b-empty">Drag any one on the canvas to move them all together.</div>
          <div className="b-divider" />
          <button className="b-btn danger" onClick={() => onDeleteMany(selectedIds)}>Delete selected</button>
        </>
      )}

      {single && entry && (
        <>
          <div className="b-section-label">{entry.label}</div>

          <div className="b-section-label" style={{ marginTop: 12 }}>Position &amp; size</div>
          <NumberField label="X" value={single.x || 0} onChange={(v) => onPatchInstance(single.id, { x: v })} />
          <NumberField label="Y" value={single.y || 0} onChange={(v) => onPatchInstance(single.id, { y: v })} />
          {entry.container !== 'svg' && (
            <NumberField label="Width" value={single.w != null ? single.w : (entry.defaultBox || {}).w}
              onChange={(v) => onPatchInstance(single.id, { w: v })} />
          )}
          <SliderField label="Scale" value={single.scale != null ? single.scale : 1} min={0.2} max={3} step={0.05}
            onChange={(v) => onPatchInstance(single.id, { scale: v })} />
          <NumberField label="Rotation°" value={single.rotation || 0} step={1}
            onChange={(v) => onPatchInstance(single.id, { rotation: v === '' ? 0 : v })} />

          <div className="b-section-label" style={{ marginTop: 12 }}>Timing</div>
          <NumberField label="Start" value={single.start != null ? single.start : 0} onChange={(v) => onPatchInstance(single.id, { start: v })} min={0} step={0.1} />
          <NumberField label="End" value={single.end != null ? single.end : doc.duration} onChange={(v) => onPatchInstance(single.id, { end: v })} min={0} step={0.1} />

          <div className="b-section-label" style={{ marginTop: 12 }}>Properties</div>
          {Object.keys(entry.props || {}).map((key) => (
            <PropField
              key={key}
              spec={entry.props[key]}
              value={single.props ? single.props[key] : undefined}
              onChange={(v) => onPatchProp(single.id, key, v)}
            />
          ))}

          <div className="b-divider" />
          <button className="b-btn danger" onClick={() => onDelete(single.id)}>Delete component</button>
        </>
      )}

      <div className="b-divider" />
      <div className="b-section-label">Layers</div>
      {doc.instances.length === 0 && <div className="b-empty">No components yet.</div>}
      {doc.instances.map((i) => {
        const e = registry[i.component];
        return (
          <div
            key={i.id}
            className={`b-layer ${selectedIds.indexOf(i.id) !== -1 ? 'selected' : ''}`}
            onClick={(ev) => {
              const meta = ev.metaKey || ev.ctrlKey;
              if (meta) onSelect(selectedIds.indexOf(i.id) !== -1 ? selectedIds.filter((x) => x !== i.id) : [...selectedIds, i.id]);
              else onSelect([i.id]);
            }}
          >
            <span className="b-layer-name">{(e && e.label) || i.component}</span>
            <button className="b-layer-del" title="Delete"
              onClick={(ev) => { ev.stopPropagation(); onDelete(i.id); }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

// ── Import modal ─────────────────────────────────────────────────────────
// Paste a scene-document JSON or pick a .doc.json file, then validate and
// hand the parsed doc to onConfirm. Validation errors stay inline.
function BuilderImportModal({ onConfirm, onClose }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const tryImport = (raw) => {
    const res = bExtractDoc(raw);
    if (res.error) { setError(res.error); return; }
    const problem = bValidateDoc(res.doc);
    if (problem) { setError(problem); return; }
    onConfirm(res.doc);
  };

  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      setText(content);
      tryImport(content);
    };
    reader.onerror = () => setError('Could not read the file.');
    reader.readAsText(file);
  };

  return (
    <div className="b-modal-backdrop" onMouseDown={onClose}>
      <div className="b-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="b-modal-head">
          <span className="b-modal-title">Import scene</span>
          <button className="b-modal-close" onClick={onClose} title="Close">×</button>
        </div>
        <div className="b-modal-body">
          <div className="b-section-label">Paste JSON or a builder-exported .jsx</div>
          <textarea
            className="b-modal-textarea"
            placeholder="Paste a scene-document JSON, or the contents of a builder-exported .jsx…"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(''); }}
          />
          <div className="b-section-label" style={{ marginTop: 12 }}>…or load a file</div>
          <input
            ref={fileRef}
            className="b-modal-file"
            type="file"
            accept="application/json,.json,.jsx,text/javascript"
            onChange={onFile}
          />
          {error && <div className="b-modal-error">{error}</div>}
        </div>
        <div className="b-modal-foot">
          <button className="b-btn" onClick={onClose}>Cancel</button>
          <button className="b-btn primary" onClick={() => tryImport(text)} disabled={!text.trim()}>Import</button>
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────
function BuilderApp() {
  const [doc, setDoc] = useState(loadBuilderDoc);
  const [selectedIds, setSelectedIds] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [library, setLibrary] = useState(bLoadLibrary);
  const [librarySel, setLibrarySel] = useState('');

  useEffect(() => {
    try { localStorage.setItem(LS_DOC, JSON.stringify(doc)); } catch { /* ignore quota */ }
  }, [doc]);

  // Refs mirror the latest state so the (once-registered) hotkey handler and
  // the ensure-visible effect always read current values without re-binding.
  const docRef = useRef(doc); docRef.current = doc;
  const selRef = useRef(selectedIds); selRef.current = selectedIds;

  // ── Undo / redo history ────────────────────────────────────────────────
  const past = useRef([]);
  const future = useRef([]);
  const lastCommit = useRef(0);

  // Apply a mutation through coalesced history: rapid edits (typing, dragging)
  // within 400ms collapse into a single undo step.
  const commit = (mutator) => {
    setDoc((prev) => {
      const now = performance.now();
      if (now - lastCommit.current > 400) {
        past.current.push(prev);
        if (past.current.length > 100) past.current.shift();
        future.current = [];
      }
      lastCommit.current = now;
      return mutator(prev);
    });
  };
  const undo = () => setDoc((prev) => {
    if (!past.current.length) return prev;
    future.current.push(prev);
    lastCommit.current = 0;
    return past.current.pop();
  });
  const redo = () => setDoc((prev) => {
    if (!future.current.length) return prev;
    past.current.push(prev);
    lastCommit.current = 0;
    return future.current.pop();
  });

  const patchInstance = (id, patch) =>
    commit((d) => ({ ...d, instances: d.instances.map((i) => i.id === id ? { ...i, ...patch } : i) }));

  const patchProp = (id, key, value) =>
    commit((d) => ({
      ...d,
      instances: d.instances.map((i) =>
        i.id === id ? { ...i, props: { ...(i.props || {}), [key]: value } } : i),
    }));

  const moveBatch = (updates) =>
    commit((d) => ({
      ...d,
      instances: d.instances.map((i) => {
        const u = updates.find((u2) => u2.id === i.id);
        return u ? { ...i, x: u.x, y: u.y } : i;
      }),
    }));

  const nudge = (dx, dy) => {
    const set = new Set(selRef.current);
    if (!set.size) return;
    commit((d) => ({
      ...d,
      instances: d.instances.map((i) => set.has(i.id) ? { ...i, x: (i.x || 0) + dx, y: (i.y || 0) + dy } : i),
    }));
  };

  const patchChrome = (patch) =>
    commit((d) => ({ ...d, chrome: { ...(d.chrome || {}), ...patch } }));

  const patchDoc = (patch) => commit((d) => ({ ...d, ...patch }));

  // Add a component with its box centred on (centerX, centerY) in stage coords.
  // Defaults to the canvas centre (click-to-add); drag-from-palette passes the
  // drop point.
  const addComponentAt = (componentKey, centerX, centerY) => {
    const entry = (window.ManimoRegistry || {})[componentKey];
    if (!entry) return;
    const box = entry.defaultBox || { w: 200, h: 200 };
    const cx = centerX == null ? 640 : centerX;
    const cy = centerY == null ? 360 : centerY;
    const id = builderUid(componentKey);
    const inst = {
      id, component: componentKey,
      x: Math.round(cx - box.w / 2),
      y: Math.round(cy - box.h / 2),
      w: box.w, h: box.h,
      start: 0, end: docRef.current.duration,
      props: {},
    };
    commit((d) => ({ ...d, instances: [...d.instances, inst] }));
    setSelectedIds([id]);
  };
  const addComponent = (componentKey) => addComponentAt(componentKey, null, null);

  const duplicateSelected = () => {
    const set = new Set(selRef.current);
    if (!set.size) return;
    const clones = [];
    const additions = [];
    docRef.current.instances.forEach((i) => {
      if (!set.has(i.id)) return;
      const id = builderUid(i.component);
      clones.push(id);
      additions.push({ ...i, id, x: (i.x || 0) + 20, y: (i.y || 0) + 20, props: { ...(i.props || {}) } });
    });
    if (!additions.length) return;
    commit((d) => ({ ...d, instances: [...d.instances, ...additions] }));
    setSelectedIds(clones);
  };

  const deleteInstance = (id) => {
    commit((d) => ({ ...d, instances: d.instances.filter((i) => i.id !== id) }));
    setSelectedIds((s) => s.filter((x) => x !== id));
  };
  const deleteMany = (ids) => {
    const set = new Set(ids);
    commit((d) => ({ ...d, instances: d.instances.filter((i) => !set.has(i.id)) }));
    setSelectedIds([]);
  };

  const resetDoc = () => {
    past.current = []; future.current = [];
    setDoc(JSON.parse(JSON.stringify(BUILDER_DEFAULT_DOC)));
    setSelectedIds([]);
  };

  // History-aware whole-document load (Import + library "load"). Pushes the
  // current doc onto the undo stack and clears redo, so Cmd+Z restores it.
  const loadDoc = (next) => {
    setDoc((prev) => {
      past.current.push(prev);
      if (past.current.length > 100) past.current.shift();
      future.current = [];
      lastCommit.current = 0;
      return JSON.parse(JSON.stringify(next));
    });
    setSelectedIds([]);
  };

  const confirmImport = (next) => {
    loadDoc(next);
    setImportOpen(false);
  };

  // Save the current doc into the named library under a prompted name.
  const saveToLibrary = () => {
    const name = window.prompt('Save scene as…', doc.title || 'Untitled scene');
    if (name == null) return;
    const key = name.trim();
    if (!key) return;
    const next = { ...library, [key]: JSON.parse(JSON.stringify(doc)) };
    setLibrary(next);
    bSaveLibrary(next);
    setLibrarySel(key);
  };

  const loadFromLibrary = (name) => {
    setLibrarySel(name);
    if (!name) return;
    const saved = library[name];
    if (saved) loadDoc(saved);
  };

  const deleteFromLibrary = () => {
    if (!librarySel || !library[librarySel]) return;
    if (!window.confirm(`Delete saved scene "${librarySel}"?`)) return;
    const next = { ...library };
    delete next[librarySel];
    setLibrary(next);
    bSaveLibrary(next);
    setLibrarySel('');
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  // Registered in the capture phase so we can stop the events we own from
  // reaching the Stage's own arrow-seek / handlers; Space is left for Stage.
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
      const meta = e.metaKey || e.ctrlKey;
      const block = () => { e.preventDefault(); e.stopPropagation(); };
      if (meta && (e.key === 'z' || e.key === 'Z')) { block(); if (e.shiftKey) redo(); else undo(); return; }
      if (meta && (e.key === 'y' || e.key === 'Y')) { block(); redo(); return; }
      if (meta && (e.key === 'd' || e.key === 'D')) { block(); duplicateSelected(); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selRef.current.length) { block(); deleteMany(selRef.current); }
        return;
      }
      if (e.key === 'Escape') { setSelectedIds([]); return; }
      if (selRef.current.length && e.key.indexOf('Arrow') === 0) {
        block();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') nudge(-step, 0);
        else if (e.key === 'ArrowRight') nudge(step, 0);
        else if (e.key === 'ArrowUp') nudge(0, -step);
        else if (e.key === 'ArrowDown') nudge(0, step);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  // When a single component is selected, pause and (if needed) seek the
  // playhead into its [start, end] window so edits are immediately visible.
  useEffect(() => {
    if (selectedIds.length !== 1) return;
    const inst = docRef.current.instances.find((i) => i.id === selectedIds[0]);
    const s = window.__manimoStage;
    if (!inst || !s) return;
    const start = inst.start != null ? inst.start : 0;
    const end = inst.end != null ? inst.end : docRef.current.duration;
    try {
      s.setPlaying(false);
      const now = s.getTime ? s.getTime() : 0;
      if (now < start || now > end) {
        s.setTime(Math.min(end, start + Math.min(0.8, Math.max(0.1, (end - start) / 2))));
      }
    } catch { /* stage not ready */ }
  }, [selectedIds]);

  // Export the live document as a .doc.json download (feed it to
  // scripts/export-doc.js to emit a runnable, publishable scene) and copy to
  // the clipboard for convenience.
  const exportDoc = () => {
    const json = JSON.stringify(doc, null, 2);
    try { navigator.clipboard.writeText(json); } catch { /* ignore */ }
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.id || 'scene'}.doc.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    console.log('[builder] scene document:\n' + json);
  };

  return (
    <div className="builder">
      <div className="b-topbar">
        <span className="b-mark">Manimo</span>
        <input
          className="b-doc-title"
          value={doc.title || ''}
          onChange={(e) => setDoc((d) => ({ ...d, title: e.target.value }))}
        />
        <span className="b-spacer" />
        <div className="b-library">
          <select
            className="b-lib-select"
            value={librarySel}
            onChange={(e) => loadFromLibrary(e.target.value)}
            disabled={Object.keys(library).length === 0}
            title={Object.keys(library).length === 0 ? 'No saved scenes yet — use “Save as…”' : 'Load a saved scene'}
          >
            <option value="">
              {Object.keys(library).length === 0 ? 'Library (empty)' : 'Library…'}
            </option>
            {Object.keys(library).sort().map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button className="b-btn" onClick={deleteFromLibrary} disabled={!librarySel} title="Delete the selected saved scene">Delete</button>
        </div>
        <button className="b-btn" onClick={saveToLibrary} title="Save the current scene into the library">Save as…</button>
        <button className="b-btn" onClick={() => setImportOpen(true)} title="Import a scene document from JSON or a file">Import</button>
        <button className="b-btn" onClick={exportDoc} title="Download the scene document JSON (and copy to clipboard)">Export document</button>
        <button className="b-btn" onClick={resetDoc}>Reset</button>
      </div>

      {importOpen && (
        <BuilderImportModal onConfirm={confirmImport} onClose={() => setImportOpen(false)} />
      )}

      <Palette onAdd={addComponent} />

      <EditorCanvas
        doc={doc}
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
        onMoveBatch={moveBatch}
        onTransform={patchInstance}
        onAddAt={addComponentAt}
      />

      <Inspector
        doc={doc}
        selectedIds={selectedIds}
        onPatchInstance={patchInstance}
        onPatchProp={patchProp}
        onPatchChrome={patchChrome}
        onPatchDoc={patchDoc}
        onDelete={deleteInstance}
        onDeleteMany={deleteMany}
        onSelect={setSelectedIds}
      />

      <Timeline
        doc={doc}
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
        onPatchInstance={patchInstance}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<BuilderApp />);
