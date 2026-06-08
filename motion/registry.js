// motion/registry.js — Component registry (the builder's component catalog).
// =========================================================================
// A machine-readable catalog of the reusable motion components. This is the
// single source of truth that BOTH the component palette/search AND the
// props inspector read from. It is pure data on purpose — no JSX, no React —
// so it can be loaded as a plain script and consumed by any tool.
//
// Each entry describes ONE placeable component:
//   componentName  string  the global (window.<name>) the renderer mounts.
//   label          string  human name shown in the palette.
//   category       string  palette grouping ("Text", "Physics", …).
//   icon           string  palette glyph key (see PaletteIcon in editor.jsx).
//   keywords       array   extra search terms for the palette search box.
//   description    string  one-line summary shown on hover.
//   container      string  'svg' → renderer wraps it in an <svg> box (which it
//                          scales via `scale`); 'dom' → a positioned <div>.
//   defaultBox     {w,h}   intrinsic size / coordinate space, in stage px.
//   childrenProp   string? if set, that prop's string value is passed as the
//                          component's children (e.g. WriteOn/FadeUp text).
//   props          map     editable props (type, default, control, label, …).
//
// Coordinate model: an instance has stage-space x/y (top-left of its box).
// SVG components address their own internal coords (pivX, cx, d…) RELATIVE to
// that box's viewBox, and `scale` resizes the whole drawing. See render-doc.jsx.

window.ManimoRegistry = {

  // ─── Text ────────────────────────────────────────────────────────────
  'caption': {
    componentName: 'WriteOn',
    label: 'Caption (write-on)',
    category: 'Text', icon: 'text',
    keywords: ['text', 'caption', 'subtitle', 'handwritten', 'writeon'],
    description: 'Handwritten-style text that wipes in left-to-right.',
    container: 'dom',
    defaultBox: { w: 520, h: 60 },
    childrenProp: 'text',
    props: {
      text:     { type: 'string',  default: 'Your caption here', control: 'text',  label: 'Text' },
      fontSize: { type: 'number',  default: 28,  control: 'number', label: 'Font size', min: 10, max: 96, step: 1 },
      color:    { type: 'color',   default: 'var(--chalk-100)', control: 'token', label: 'Color' },
      italic:   { type: 'boolean', default: true, control: 'toggle', label: 'Italic' },
      duration: { type: 'number',  default: 0.7, control: 'number', label: 'Reveal (s)', min: 0, max: 4, step: 0.1 },
      delay:    { type: 'number',  default: 0,   control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  'text-block': {
    componentName: 'FadeUp',
    label: 'Text block (fade-up)',
    category: 'Text', icon: 'text',
    keywords: ['text', 'label', 'fade', 'title', 'fadeup'],
    description: 'A line of text that fades in while sliding up.',
    container: 'dom',
    defaultBox: { w: 460, h: 48 },
    childrenProp: 'text',
    props: {
      text:     { type: 'string', default: 'Text', control: 'text', label: 'Text' },
      duration: { type: 'number', default: 0.5, control: 'number', label: 'Fade (s)', min: 0, max: 4, step: 0.1 },
      delay:    { type: 'number', default: 0,   control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
      distance: { type: 'number', default: 12,  control: 'number', label: 'Rise (px)', min: 0, max: 80, step: 1 },
    },
  },

  'label': {
    componentName: 'Label',
    label: 'SVG label',
    category: 'Text', icon: 'label',
    keywords: ['text', 'label', 'symbol', 'math', 'annotation', 'svg'],
    description: 'A line of SVG text at a precise point (for math symbols).',
    container: 'svg',
    defaultBox: { w: 160, h: 48 },
    props: {
      x:        { type: 'number', default: 8,  control: 'number', label: 'X' },
      y:        { type: 'number', default: 30, control: 'number', label: 'Y' },
      text:     { type: 'string', default: 'v', control: 'text', label: 'Text' },
      color:    { type: 'color',  default: 'var(--chalk-100)', control: 'token', label: 'Color' },
      fontSize: { type: 'number', default: 22, control: 'number', label: 'Font size', min: 8, max: 80, step: 1 },
      italic:   { type: 'boolean', default: true, control: 'toggle', label: 'Italic' },
      anchor:   { type: 'string', default: 'start', control: 'text', label: 'Anchor' },
      duration: { type: 'number', default: 0.4, control: 'number', label: 'Fade (s)', min: 0, max: 4, step: 0.1 },
      delay:    { type: 'number', default: 0,   control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  // ─── Geometry ────────────────────────────────────────────────────────
  'trace-path': {
    componentName: 'TraceIn',
    label: 'Trace path',
    category: 'Geometry', icon: 'path',
    keywords: ['path', 'line', 'curve', 'draw', 'axis', 'stroke', 'tracein'],
    description: 'An SVG path that draws itself in.',
    container: 'svg',
    defaultBox: { w: 400, h: 200 },
    props: {
      d:           { type: 'string', default: 'M 0 100 L 400 100', control: 'path', label: 'Path (d)' },
      stroke:      { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Stroke' },
      strokeWidth: { type: 'number', default: 3, control: 'number', label: 'Width', min: 1, max: 20, step: 0.5 },
      duration:    { type: 'number', default: 0.8, control: 'number', label: 'Draw (s)', min: 0, max: 6, step: 0.1 },
      delay:       { type: 'number', default: 0, control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  'arrow': {
    componentName: 'Arrow',
    label: 'Arrow / vector',
    category: 'Geometry', icon: 'arrow',
    keywords: ['arrow', 'vector', 'force', 'velocity', 'pointer', 'direction'],
    description: 'A vector arrow that draws toward its tip, with optional label.',
    container: 'svg',
    defaultBox: { w: 220, h: 140 },
    props: {
      x1:          { type: 'number', default: 20,  control: 'number', label: 'From X' },
      y1:          { type: 'number', default: 120, control: 'number', label: 'From Y' },
      x2:          { type: 'number', default: 200, control: 'number', label: 'To X' },
      y2:          { type: 'number', default: 20,  control: 'number', label: 'To Y' },
      color:       { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Color' },
      strokeWidth: { type: 'number', default: 3,  control: 'number', label: 'Width', min: 1, max: 16, step: 0.5 },
      headSize:    { type: 'number', default: 12, control: 'number', label: 'Head size', min: 4, max: 40, step: 1 },
      label:       { type: 'string', default: '', control: 'text', label: 'Label' },
      labelDx:     { type: 'number', default: 10,  control: 'number', label: 'Label dx' },
      labelDy:     { type: 'number', default: -10, control: 'number', label: 'Label dy' },
      labelSize:   { type: 'number', default: 20,  control: 'number', label: 'Label size', min: 8, max: 60, step: 1 },
      duration:    { type: 'number', default: 0.8, control: 'number', label: 'Draw (s)', min: 0, max: 6, step: 0.1 },
      delay:       { type: 'number', default: 0,   control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  'axes': {
    componentName: 'Axes',
    label: '2D axes',
    category: 'Geometry', icon: 'axes',
    keywords: ['axes', 'axis', 'graph', 'plot', 'coordinate', 'grid'],
    description: 'x/y coordinate axes that draw in, with arrowheads + labels.',
    container: 'svg',
    defaultBox: { w: 280, h: 240 },
    props: {
      ox:          { type: 'number', default: 24,  control: 'number', label: 'Origin X' },
      oy:          { type: 'number', default: 210, control: 'number', label: 'Origin Y' },
      xLen:        { type: 'number', default: 230, control: 'number', label: 'X length', min: 20, max: 1000, step: 5 },
      yLen:        { type: 'number', default: 180, control: 'number', label: 'Y length', min: 20, max: 1000, step: 5 },
      color:       { type: 'color',  default: 'var(--chalk-300)', control: 'token', label: 'Color' },
      xLabel:      { type: 'string', default: 't', control: 'text', label: 'X label' },
      yLabel:      { type: 'string', default: 'y', control: 'text', label: 'Y label' },
      duration:    { type: 'number', default: 0.8, control: 'number', label: 'Draw (s)', min: 0, max: 6, step: 0.1 },
      delay:       { type: 'number', default: 0,   control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  'dot': {
    componentName: 'Dot',
    label: 'Point / dot',
    category: 'Geometry', icon: 'dot',
    keywords: ['dot', 'point', 'vertex', 'node', 'marker'],
    description: 'A labeled point that pops in (persistent marker).',
    container: 'svg',
    defaultBox: { w: 80, h: 60 },
    props: {
      cx:       { type: 'number', default: 16, control: 'number', label: 'Center X' },
      cy:       { type: 'number', default: 30, control: 'number', label: 'Center Y' },
      r:        { type: 'number', default: 6,  control: 'number', label: 'Radius', min: 1, max: 40, step: 0.5 },
      color:    { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Color' },
      label:    { type: 'string', default: 'P', control: 'text', label: 'Label' },
      labelDx:  { type: 'number', default: 12, control: 'number', label: 'Label dx' },
      labelDy:  { type: 'number', default: 5,  control: 'number', label: 'Label dy' },
      duration: { type: 'number', default: 0.4, control: 'number', label: 'Pop (s)', min: 0, max: 3, step: 0.1 },
      delay:    { type: 'number', default: 0,   control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  'rect': {
    componentName: 'Rect',
    label: 'Rectangle',
    category: 'Geometry', icon: 'rect',
    keywords: ['rect', 'rectangle', 'box', 'panel', 'frame', 'bar', 'square'],
    description: 'A rectangle that fades in or draws its outline (rounded corners optional).',
    container: 'svg',
    defaultBox: { w: 200, h: 140 },
    props: {
      x:           { type: 'number', default: 10, control: 'number', label: 'X' },
      y:           { type: 'number', default: 10, control: 'number', label: 'Y' },
      w:           { type: 'number', default: 180, control: 'number', label: 'Width', min: 2, max: 1280, step: 1 },
      h:           { type: 'number', default: 120, control: 'number', label: 'Height', min: 2, max: 720, step: 1 },
      fill:        { type: 'color',  default: 'none', control: 'token', label: 'Fill' },
      stroke:      { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Stroke' },
      strokeWidth: { type: 'number', default: 3, control: 'number', label: 'Width', min: 0, max: 20, step: 0.5 },
      rounded:     { type: 'number', default: 0, control: 'number', label: 'Corner r', min: 0, max: 120, step: 1 },
      mode:        { type: 'string', default: 'fade', control: 'text', label: 'Mode (fade/draw)' },
      duration:    { type: 'number', default: 0.8, control: 'number', label: 'Reveal (s)', min: 0, max: 6, step: 0.1 },
      delay:       { type: 'number', default: 0, control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  'number-line': {
    componentName: 'NumberLine',
    label: 'Number line',
    category: 'Geometry', icon: 'numberline',
    keywords: ['number', 'line', 'axis', 'ticks', 'scale', 'ruler', 'numberline'],
    description: 'A horizontal line with evenly spaced ticks and numeric labels.',
    container: 'svg',
    defaultBox: { w: 420, h: 80 },
    props: {
      ox:       { type: 'number', default: 20,  control: 'number', label: 'Origin X' },
      oy:       { type: 'number', default: 40,  control: 'number', label: 'Origin Y' },
      length:   { type: 'number', default: 360, control: 'number', label: 'Length', min: 20, max: 1200, step: 5 },
      min:      { type: 'number', default: 0,   control: 'number', label: 'Min' },
      max:      { type: 'number', default: 10,  control: 'number', label: 'Max' },
      step:     { type: 'number', default: 1,   control: 'number', label: 'Step', min: 0.01, max: 100, step: 0.1 },
      color:    { type: 'color',  default: 'var(--chalk-300)', control: 'token', label: 'Color' },
      label:    { type: 'string', default: 'x', control: 'text', label: 'Label' },
      duration: { type: 'number', default: 0.6, control: 'number', label: 'Fade (s)', min: 0, max: 4, step: 0.1 },
      delay:    { type: 'number', default: 0,   control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  'function-curve': {
    componentName: 'FunctionCurve',
    label: 'Function curve',
    category: 'Geometry', icon: 'curve',
    keywords: ['function', 'curve', 'plot', 'graph', 'parabola', 'sine', 'cubic', 'line', 'fn'],
    description: 'Plots y=f(x) (line/parabola/sine/cubic) and draws itself in.',
    container: 'svg',
    defaultBox: { w: 280, h: 240 },
    props: {
      ox:          { type: 'number', default: 24,  control: 'number', label: 'Origin X' },
      oy:          { type: 'number', default: 210, control: 'number', label: 'Origin Y' },
      xLen:        { type: 'number', default: 230, control: 'number', label: 'X length', min: 20, max: 1000, step: 5 },
      yLen:        { type: 'number', default: 180, control: 'number', label: 'Y length', min: 20, max: 1000, step: 5 },
      fn:          { type: 'string', default: 'parabola', control: 'text', label: 'Fn (line/parabola/sine/cubic)' },
      a:           { type: 'number', default: 1, control: 'number', label: 'a', step: 0.1 },
      b:           { type: 'number', default: 0, control: 'number', label: 'b', step: 0.1 },
      c:           { type: 'number', default: 0, control: 'number', label: 'c', step: 0.1 },
      xMin:        { type: 'number', default: -3, control: 'number', label: 'x min', step: 0.5 },
      xMax:        { type: 'number', default: 3,  control: 'number', label: 'x max', step: 0.5 },
      color:       { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Color' },
      strokeWidth: { type: 'number', default: 3, control: 'number', label: 'Width', min: 1, max: 16, step: 0.5 },
      duration:    { type: 'number', default: 1.0, control: 'number', label: 'Draw (s)', min: 0, max: 6, step: 0.1 },
      delay:       { type: 'number', default: 0, control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  // ─── Annotation ──────────────────────────────────────────────────────
  'pulse-mark': {
    componentName: 'PulseMark',
    label: 'Pulse mark',
    category: 'Annotation', icon: 'pulse',
    keywords: ['dot', 'point', 'highlight', 'pulse', 'marker', 'callout'],
    description: 'A dot that appears and pulses outward once.',
    container: 'svg',
    defaultBox: { w: 60, h: 60 },
    props: {
      cx:          { type: 'number', default: 30, control: 'number', label: 'Center X' },
      cy:          { type: 'number', default: 30, control: 'number', label: 'Center Y' },
      color:       { type: 'color',  default: 'var(--amber-300)', control: 'token', label: 'Color' },
      radius:      { type: 'number', default: 4,  control: 'number', label: 'Dot radius', min: 1, max: 30, step: 0.5 },
      pulseRadius: { type: 'number', default: 18, control: 'number', label: 'Pulse radius', min: 4, max: 80, step: 1 },
      delay:       { type: 'number', default: 0,  control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  'bracket': {
    componentName: 'Bracket',
    label: 'Annotation bracket',
    category: 'Annotation', icon: 'bracket',
    keywords: ['bracket', 'label', 'dimension', 'measure', 'span'],
    description: 'A square bracket that traces in to label a span.',
    container: 'svg',
    defaultBox: { w: 240, h: 60 },
    props: {
      x1:          { type: 'number', default: 10,  control: 'number', label: 'X1' },
      y1:          { type: 'number', default: 20,  control: 'number', label: 'Y1' },
      x2:          { type: 'number', default: 230, control: 'number', label: 'X2' },
      y2:          { type: 'number', default: 20,  control: 'number', label: 'Y2' },
      side:        { type: 'string', default: 'bottom', control: 'text', label: 'Side' },
      depth:       { type: 'number', default: 12,  control: 'number', label: 'Depth', min: 2, max: 60, step: 1 },
      color:       { type: 'color',  default: 'var(--chalk-300)', control: 'token', label: 'Color' },
      duration:    { type: 'number', default: 0.5, control: 'number', label: 'Draw (s)', min: 0, max: 4, step: 0.1 },
      delay:       { type: 'number', default: 0,   control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  // ─── Physics ─────────────────────────────────────────────────────────
  'swinging-pendulum': {
    componentName: 'SwingingPendulum',
    label: 'Swinging pendulum',
    category: 'Physics', icon: 'pendulum',
    keywords: ['pendulum', 'swing', 'oscillation', 'shm', 'harmonic'],
    description: 'A pendulum swinging in simple harmonic motion.',
    container: 'svg',
    defaultBox: { w: 320, h: 420 },
    props: {
      pivX:     { type: 'number', default: 160, control: 'number', label: 'Pivot X' },
      pivY:     { type: 'number', default: 20,  control: 'number', label: 'Pivot Y' },
      L:        { type: 'number', default: 300, control: 'number', label: 'Length', min: 40, max: 600, step: 5 },
      maxAngle: { type: 'number', default: 22,  control: 'slider', label: 'Max angle', min: 0, max: 80, step: 1 },
      period:   { type: 'number', default: 2.2, control: 'number', label: 'Period (s)', min: 0.4, max: 8, step: 0.1 },
      color:    { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Color' },
      bobLabel: { type: 'string', default: 'm', control: 'text', label: 'Bob label' },
    },
  },

  'pendulum': {
    componentName: 'Pendulum',
    label: 'Pendulum (static)',
    category: 'Physics', icon: 'pendulum',
    keywords: ['pendulum', 'static', 'angle', 'string', 'bob'],
    description: 'A pendulum drawn at a fixed angle (no motion).',
    container: 'svg',
    defaultBox: { w: 320, h: 420 },
    props: {
      pivX:     { type: 'number', default: 160, control: 'number', label: 'Pivot X' },
      pivY:     { type: 'number', default: 20,  control: 'number', label: 'Pivot Y' },
      L:        { type: 'number', default: 300, control: 'number', label: 'Length', min: 40, max: 600, step: 5 },
      angle:    { type: 'number', default: 20,  control: 'slider', label: 'Angle', min: -80, max: 80, step: 1 },
      color:    { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Color' },
      bobLabel: { type: 'string', default: 'm', control: 'text', label: 'Bob label' },
    },
  },

  'rolling-wheel': {
    componentName: 'RollingWheel',
    label: 'Rolling wheel',
    category: 'Physics', icon: 'wheel',
    keywords: ['wheel', 'hoop', 'disk', 'roll', 'rotation', 'ramp'],
    description: 'A hoop or disk that rolls without slipping.',
    container: 'svg',
    defaultBox: { w: 420, h: 120 },
    props: {
      cx:       { type: 'number', default: 30,  control: 'number', label: 'Start X' },
      cy:       { type: 'number', default: 60,  control: 'number', label: 'Start Y' },
      dirX:     { type: 'number', default: 1,   control: 'number', label: 'Dir X', min: -1, max: 1, step: 0.05 },
      dirY:     { type: 'number', default: 0,   control: 'number', label: 'Dir Y', min: -1, max: 1, step: 0.05 },
      distance: { type: 'number', default: 360, control: 'number', label: 'Distance', min: 0, max: 1200, step: 10 },
      R:        { type: 'number', default: 28,  control: 'number', label: 'Radius', min: 6, max: 120, step: 1 },
      type:     { type: 'string', default: 'hoop', control: 'text', label: 'Type (hoop/disk)' },
      color:    { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Color' },
      duration: { type: 'number', default: 2, control: 'number', label: 'Roll (s)', min: 0.2, max: 8, step: 0.1 },
    },
  },

  // ─── Circuit ─────────────────────────────────────────────────────────
  'resistor': {
    componentName: 'Resistor',
    label: 'Resistor',
    category: 'Circuit', icon: 'resistor',
    keywords: ['resistor', 'circuit', 'zigzag', 'ohm', 'component', 'R'],
    description: 'A zigzag resistor with two leads and an optional label.',
    container: 'svg',
    defaultBox: { w: 160, h: 80 },
    props: {
      x:        { type: 'number', default: 10,  control: 'number', label: 'X' },
      y:        { type: 'number', default: 40,  control: 'number', label: 'Y' },
      length:   { type: 'number', default: 140, control: 'number', label: 'Length', min: 20, max: 800, step: 5 },
      color:    { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Color' },
      label:    { type: 'string', default: 'R', control: 'text', label: 'Label' },
      duration: { type: 'number', default: 0.5, control: 'number', label: 'Fade (s)', min: 0, max: 4, step: 0.1 },
      delay:    { type: 'number', default: 0,   control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  'capacitor': {
    componentName: 'Capacitor',
    label: 'Capacitor',
    category: 'Circuit', icon: 'capacitor',
    keywords: ['capacitor', 'circuit', 'plates', 'farad', 'component', 'C'],
    description: 'Two parallel plates with leads and an optional label.',
    container: 'svg',
    defaultBox: { w: 140, h: 80 },
    props: {
      x:        { type: 'number', default: 10, control: 'number', label: 'X' },
      y:        { type: 'number', default: 40, control: 'number', label: 'Y' },
      gap:      { type: 'number', default: 12, control: 'number', label: 'Plate gap', min: 2, max: 80, step: 1 },
      color:    { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Color' },
      label:    { type: 'string', default: 'C', control: 'text', label: 'Label' },
      duration: { type: 'number', default: 0.5, control: 'number', label: 'Fade (s)', min: 0, max: 4, step: 0.1 },
      delay:    { type: 'number', default: 0,   control: 'number', label: 'Delay (s)', min: 0, max: 10, step: 0.1 },
    },
  },

  // ─── Character ───────────────────────────────────────────────────────
  'mascot-enter': {
    componentName: 'ManimoEnter',
    label: 'Manimo (enter)',
    category: 'Character', icon: 'mascot',
    keywords: ['manimo', 'mascot', 'character', 'enter'],
    description: 'The Manimo mascot bobbing in from below.',
    container: 'svg',
    defaultBox: { w: 200, h: 200 },
    props: {
      size:  { type: 'number', default: 120, control: 'number', label: 'Size', min: 40, max: 300, step: 5 },
      color: { type: 'color',  default: 'var(--amber-400)', control: 'token', label: 'Color' },
    },
  },

  'mascot': {
    componentName: 'Manimo',
    label: 'Manimo (idle)',
    category: 'Character', icon: 'mascot',
    keywords: ['manimo', 'mascot', 'character', 'idle', 'bob'],
    description: 'The Manimo mascot idling (gentle bob + blink).',
    container: 'svg',
    defaultBox: { w: 200, h: 200 },
    props: {
      color:    { type: 'color',   default: 'var(--amber-400)', control: 'token', label: 'Color' },
      bob:      { type: 'boolean', default: true, control: 'toggle', label: 'Bob' },
      blink:    { type: 'boolean', default: true, control: 'toggle', label: 'Blink' },
    },
  },

};

// Category order for the palette (anything not listed falls to the end).
window.ManimoRegistryCategories = ['Text', 'Geometry', 'Annotation', 'Physics', 'Circuit', 'Character'];
