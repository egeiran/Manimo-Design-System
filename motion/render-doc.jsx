// motion/render-doc.jsx — Generic data-driven scene renderer (Phase 2).
// =========================================================================
// Reads a "scene document" (see motion/scene-doc.schema.json) and renders
// every component instance from motion/registry.js into the live <Stage>
// tree. This is the runtime counterpart to a hand-authored scene .jsx: a
// scene becomes DATA (instances with x/y/start/end/props) instead of code,
// which is what makes the visual builder — search, drag, configure — possible.
//
// Usage (inside an HTML that already loaded animations.jsx + manimo-motion.jsx
// + registry.js):
//
//   <Stage width={1280} height={720} duration={doc.duration}>
//     <RenderDoc doc={doc} />
//   </Stage>
//
// Same React tree as the editor (no iframe), so the editor can attach click /
// drag handlers to each instance's box directly.

// Resolve an instance's final props: registry defaults overlaid with the
// instance's own overrides. (The inspector edits inst.props; everything
// unset falls back to the schema default.)
function docInstanceProps(entry, inst) {
  const out = {};
  const schema = (entry && entry.props) || {};
  Object.keys(schema).forEach((k) => { out[k] = schema[k].default; });
  return Object.assign(out, (inst && inst.props) || {});
}

// One placed component. Looks up its registry entry, resolves the global
// component, applies props, and wraps it in a positioned box + a <Sprite>
// so it only renders inside its [start, end] window.
function DocInstance({ inst, selected = false, onSelect }) {
  const { time } = useTimeline();
  const registry = window.ManimoRegistry || {};
  const entry = registry[inst.component];
  if (!entry) {
    console.warn('[render-doc] unknown component:', inst.component);
    return null;
  }
  const Comp = window[entry.componentName];
  if (typeof Comp !== 'function') {
    console.warn('[render-doc] component not on window:', entry.componentName);
    return null;
  }

  // Gate the whole instance — box included — on its time window. This keeps
  // the (otherwise invisible) selectable box from existing, and being
  // clickable, when the element isn't actually on screen.
  const startT = inst.start != null ? inst.start : 0;
  const endT = inst.end != null ? inst.end : Infinity;
  if (time < startT || time > endT) return null;

  const props = docInstanceProps(entry, inst);

  // A string prop can map to the component's children (WriteOn/FadeUp text).
  let children = null;
  if (entry.childrenProp && props[entry.childrenProp] != null) {
    children = props[entry.childrenProp];
    delete props[entry.childrenProp];
  }

  const start = inst.start != null ? inst.start : 0;
  const end = inst.end != null ? inst.end : Infinity;
  const box = entry.defaultBox || { w: 200, h: 200 };
  const x = inst.x || 0;
  const y = inst.y || 0;
  const scale = inst.scale != null ? inst.scale : 1;
  const rotation = inst.rotation || 0;

  // The instance box IS the element's bounds: an SVG instance's viewBox matches
  // its w/h, so content is authored in [0,w]×[0,h] and the selection overlay
  // wraps it correctly. (Authoring with a full-stage box + absolute coords put
  // the selection box in the top-left corner — instead give each element a tight
  // box at its location.) `scale`/`rotation` apply as a CSS transform about the
  // centre, identical for SVG and DOM.
  const w = inst.w != null ? inst.w : box.w;
  const h = inst.h != null ? inst.h : box.h;
  const viewBox = `0 0 ${w} ${h}`;

  // Editor affordance: a selectable outline. In pure playback (onSelect
  // absent) the box is fully transparent and ignores pointer events.
  const boxStyle = {
    position: 'absolute',
    left: x,
    top: y,
    width: w,
    height: entry.container === 'svg' ? h : undefined,
    transform: (scale !== 1 || rotation) ? `rotate(${rotation}deg) scale(${scale})` : undefined,
    transformOrigin: 'center center',
    outline: selected ? '1.5px solid var(--accent-violet)' : 'none',
    outlineOffset: 2,
    cursor: onSelect ? 'move' : 'default',
    pointerEvents: onSelect ? 'auto' : 'none',
  };

  const handleDown = onSelect ? (e) => { e.stopPropagation(); onSelect(inst.id, e); } : undefined;

  if (entry.container === 'svg') {
    return (
      <svg
        width={w}
        height={h}
        viewBox={viewBox}
        style={{ ...boxStyle, overflow: 'visible' }}
        onMouseDown={handleDown}
      >
        <Sprite start={start} end={end}>
          <Comp {...props}>{children}</Comp>
        </Sprite>
      </svg>
    );
  }

  return (
    <div style={boxStyle} onMouseDown={handleDown}>
      <Sprite start={start} end={end}>
        <Comp {...props}>{children}</Comp>
      </Sprite>
    </div>
  );
}

// Canva-style transform overlay for the single selected instance: corner
// handles resize (uniform `scale`, from the centre), a knob above rotates.
// Rendered inside the Stage (canvas coord space) so it tracks the scene's
// auto-scale. Only the handles capture pointer events — the element body
// underneath stays grabbable for moving.
function SelectionOverlay({ inst, onTransform }) {
  const { time } = useTimeline();
  const drag = React.useRef(null);

  React.useEffect(() => {
    const toStage = (e) => {
      const el = window.__manimoStage && window.__manimoStage.getCanvasEl && window.__manimoStage.getCanvasEl();
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const sw = (window.__manimoStage && window.__manimoStage.width) || 1280;
      const sc = rect.width / sw || 1;
      return { mx: (e.clientX - rect.left) / sc, my: (e.clientY - rect.top) / sc };
    };
    const move = (e) => {
      const d = drag.current;
      if (!d) return;
      const m = toStage(e);
      if (!m) return;
      if (d.mode === 'resize') {
        const dist = Math.hypot(m.mx - d.cx, m.my - d.cy);
        let ns = d.scale0 * (dist / d.dist0);
        ns = Math.max(0.2, Math.min(5, Math.round(ns * 100) / 100));
        onTransform(d.id, { scale: ns });
      } else if (d.mode === 'rotate') {
        let deg = Math.atan2(m.my - d.cy, m.mx - d.cx) * 180 / Math.PI + 90;
        if (e.shiftKey) deg = Math.round(deg / 15) * 15;
        onTransform(d.id, { rotation: Math.round(deg) });
      }
    };
    const up = () => { drag.current = null; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [onTransform]);

  const registry = window.ManimoRegistry || {};
  const entry = registry[inst.component];
  if (!entry) return null;
  const start = inst.start != null ? inst.start : 0;
  const end = inst.end != null ? inst.end : Infinity;
  if (time < start || time > end) return null;

  const box = entry.defaultBox || { w: 200, h: 200 };
  const baseW = inst.w != null ? inst.w : box.w;
  const baseH = inst.h != null ? inst.h : box.h;
  const scale = inst.scale != null ? inst.scale : 1;
  const rot = inst.rotation || 0;
  const cx = (inst.x || 0) + baseW / 2;
  const cy = (inst.y || 0) + baseH / 2;
  const visW = baseW * scale;
  const visH = baseH * scale;

  const startResize = (e) => {
    e.stopPropagation();
    drag.current = { mode: 'resize', id: inst.id, cx, cy, scale0: scale, dist0: Math.max(1, Math.hypot(visW / 2, visH / 2)) };
  };
  const startRotate = (e) => {
    e.stopPropagation();
    drag.current = { mode: 'rotate', id: inst.id, cx, cy };
  };

  const handle = (left, top, cursor, onDown) => (
    <div className="b-tf-handle" onMouseDown={onDown} style={{
      position: 'absolute', left: left - 5, top: top - 5, width: 10, height: 10,
      background: 'var(--chalk-50)', border: '1px solid var(--accent-violet)',
      borderRadius: 2, cursor, pointerEvents: 'auto',
    }} />
  );

  return (
    <div style={{ position: 'absolute', left: cx, top: cy, width: 0, height: 0, pointerEvents: 'none', zIndex: 50 }}>
      <div style={{
        position: 'absolute', left: -visW / 2, top: -visH / 2, width: visW, height: visH,
        transform: `rotate(${rot}deg)`, transformOrigin: 'center center',
        border: '1px solid var(--accent-violet)', boxSizing: 'border-box', pointerEvents: 'none',
      }}>
        {handle(0, 0, 'nwse-resize', startResize)}
        {handle(visW, 0, 'nesw-resize', startResize)}
        {handle(0, visH, 'nesw-resize', startResize)}
        {handle(visW, visH, 'nwse-resize', startResize)}
        {/* rotation arm + knob, above top-centre */}
        <div style={{ position: 'absolute', left: visW / 2 - 1, top: -26, width: 2, height: 26, background: 'var(--accent-violet)', pointerEvents: 'none' }} />
        <div className="b-tf-rotate" onMouseDown={startRotate} title="Rotate (Shift = snap 15°)" style={{
          position: 'absolute', left: visW / 2 - 7, top: -40, width: 14, height: 14,
          background: 'var(--chalk-50)', border: '1px solid var(--accent-violet)',
          borderRadius: '50%', cursor: 'grab', pointerEvents: 'auto',
        }} />
      </div>
    </div>
  );
}

// Render a whole document. If doc.chrome is set, the instances are placed
// inside <SceneChrome> (grid + watermark + title + corner mascot), matching
// how hand-authored scenes look. Otherwise they sit on a plain canvas.
//
// Editor props (all optional — omit for pure playback):
//   selectedIds  string[]   currently selected instance ids (multi-select)
//   onSelect     fn(id, e)  called when an instance box is pressed
//   guides       array      editor-only drag-time alignment guide lines

// Editor-only alignment guides drawn in stage coordinates so they ride the
// Stage's auto-scale. `guides` is an array of { axis:'v'|'h', pos } in stage
// px, supplied by the editor's drag path only — playback/export never pass it.
function BuilderGuideLines({ guides }) {
  if (!guides || !guides.length) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 60 }}>
      {guides.map((g, i) => (
        g.axis === 'v'
          ? <div key={i} style={{ position: 'absolute', left: g.pos, top: 0, bottom: 0, width: 1, background: 'var(--accent-violet)', opacity: 0.85 }} />
          : <div key={i} style={{ position: 'absolute', top: g.pos, left: 0, right: 0, height: 1, background: 'var(--accent-violet)', opacity: 0.85 }} />
      ))}
    </div>
  );
}

// A dashed bounding box around a multi-selection (and thus around a selected
// group), so several instances read as one object. Editor-only. Unions the
// visual bounds of the selected instances that are on screen right now.
function GroupOutline({ doc, ids }) {
  const { time } = useTimeline();
  const registry = window.ManimoRegistry || {};
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, count = 0;
  (ids || []).forEach((id) => {
    const inst = (doc.instances || []).find((i) => i.id === id);
    if (!inst) return;
    const entry = registry[inst.component];
    if (!entry) return;
    const s = inst.start != null ? inst.start : 0;
    const e = inst.end != null ? inst.end : Infinity;
    if (time < s || time > e) return;
    const box = entry.defaultBox || { w: 200, h: 200 };
    const bw = inst.w != null ? inst.w : box.w;
    const bh = inst.h != null ? inst.h : box.h;
    const sc = inst.scale != null ? inst.scale : 1;
    const cx = (inst.x || 0) + bw / 2;
    const cy = (inst.y || 0) + bh / 2;
    const vw = bw * sc, vh = bh * sc;
    minX = Math.min(minX, cx - vw / 2); maxX = Math.max(maxX, cx + vw / 2);
    minY = Math.min(minY, cy - vh / 2); maxY = Math.max(maxY, cy + vh / 2);
    count++;
  });
  if (count < 2) return null;
  const pad = 6;
  return (
    <div style={{
      position: 'absolute', left: minX - pad, top: minY - pad,
      width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2,
      border: '1.5px dashed var(--accent-violet)', borderRadius: 6,
      pointerEvents: 'none', zIndex: 40,
    }} />
  );
}

function RenderDoc({ doc, selectedIds = [], onSelect, onTransform, guides }) {
  if (!doc) return null;
  const instances = doc.instances || [];
  const sel = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
  const body = instances.map((inst) => (
    <DocInstance
      key={inst.id}
      inst={inst}
      selected={sel.indexOf(inst.id) !== -1}
      onSelect={onSelect}
    />
  ));
  // Transform handles for exactly one selected instance (editor mode only).
  const overlayInst = (onTransform && sel.length === 1)
    ? instances.find((i) => i.id === sel[0])
    : null;
  if (overlayInst) {
    body.push(<SelectionOverlay key="__overlay" inst={overlayInst} onTransform={onTransform} />);
  }
  // Multi-selection (incl. a selected group): dashed union outline.
  if (onTransform && sel.length > 1) {
    body.push(<GroupOutline key="__group" doc={doc} ids={sel} />);
  }
  if (guides && guides.length) {
    body.push(<BuilderGuideLines key="__guides" guides={guides} />);
  }

  if (doc.chrome) {
    return (
      <SceneChrome
        eyebrow={doc.chrome.eyebrow}
        title={doc.chrome.title}
        duration={doc.duration}
        introEnd={doc.chrome.introEnd}
        introCaption={doc.chrome.introCaption}
      >
        {doc.narrationSrc && <SceneNarration src={doc.narrationSrc} />}
        {body}
      </SceneChrome>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-canvas)' }}>
      {doc.narrationSrc && <SceneNarration src={doc.narrationSrc} />}
      {body}
    </div>
  );
}

Object.assign(window, { RenderDoc, DocInstance, docInstanceProps, BuilderGuideLines });
