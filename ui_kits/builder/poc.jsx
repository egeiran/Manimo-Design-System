// ui_kits/builder/poc.jsx — Proof-of-concept for the data-driven scene model.
// ===========================================================================
// This is NOT the editor yet. It exists to prove Phase 1 + Phase 2: a scene
// described as a JSON DOCUMENT (instances + props + timing) renders to a real,
// animated Manimo scene using the exact same library primitives that the
// hand-authored scenes use — no per-scene code.
//
// The document below recreates the shape of motion/fysikk/pendulum.jsx
// (chrome + journey Manimo, a swinging pendulum, a pivot line, a caption, a
// pulse mark on the pivot) entirely from data. Open ui_kits/builder/index.html
// and scrub the timeline: the pendulum swings, the caption writes on, the
// mark pulses — all driven by render-doc.jsx reading this object.

const POC_DOC = {
  id: 'poc-pendulum',
  title: 'The Simple Pendulum',
  language: 'en',
  duration: 14,
  chrome: {
    eyebrow: 'pendulum motion',
    title: 'The Simple Pendulum',
    introEnd: 4.5,
    introCaption: 'Pull a weight on a string — what sets the rhythm?',
  },
  instances: [
    // Pivot support line (geometry, draws itself in).
    {
      id: 'pivot-line',
      component: 'trace-path',
      x: 470, y: 150, w: 340, h: 30,
      start: 4.5, end: 14,
      props: { d: 'M 0 15 L 340 15', stroke: 'var(--chalk-300)', strokeWidth: 3, duration: 0.8 },
    },
    // The pendulum itself — pivot at the box's top-centre, sitting on the line.
    {
      id: 'pendulum',
      component: 'swinging-pendulum',
      x: 480, y: 150, w: 320, h: 440,
      start: 4.5, end: 14,
      props: { pivX: 160, pivY: 16, L: 300, maxAngle: 24, period: 2.4, bobLabel: 'm', color: 'var(--amber-400)' },
    },
    // Pulse mark on the pivot point (same box origin as the pendulum).
    {
      id: 'pivot-mark',
      component: 'pulse-mark',
      x: 480, y: 150, w: 320, h: 60,
      start: 5.4, end: 14,
      props: { cx: 160, cy: 16, color: 'var(--amber-300)', radius: 4, pulseRadius: 22, delay: 0.2 },
    },
    // Spoken caption, lower third.
    {
      id: 'caption',
      component: 'caption',
      x: 340, y: 612, w: 600,
      start: 6.0, end: 14,
      props: {
        text: 'The period depends on length and gravity — not the mass.',
        fontSize: 26, italic: true, color: 'var(--chalk-100)', duration: 1.0,
      },
    },
  ],
};

function PocApp() {
  return (
    <Stage width={1280} height={720} duration={POC_DOC.duration} background="var(--bg-canvas)">
      <RenderDoc doc={POC_DOC} />
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PocApp />);
