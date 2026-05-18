// Manimo Studio — App entry
const { useState, useEffect, useMemo } = React;

const LS_TITLE = 'manimo.studio.title';
const LS_INDEX = 'manimo.studio.selectedIdx';
const LS_CHAT = 'manimo.studio.chat';
const LS_ASPECT = 'manimo.studio.aspect';

// Demo conversation. Persists once the user starts editing it; until then we
// reseed on every load so the empty studio still has something to look at.
const seedMessages = [
  {
    from: 'user',
    time: '2:14 PM',
    body: 'Make a 90-second lesson on moment of inertia, focused on a hoop vs a solid disk rolling down a ramp. Audience: physics 1 students.'
  },
  {
    from: 'ai',
    time: '2:14 PM',
    body: 'Sketched four scenes — an opening question, the formula I = ∫ r² dm, a side-by-side animation, and a recap. Want to adjust the pace or swap the recap for a worked example?',
    suggestions: ['Slow down scene 2', 'Add a worked example', 'Make scene 3 longer']
  },
  {
    from: 'user',
    time: '2:16 PM',
    body: 'The opening feels flat. Lead with a question that nudges the viewer to predict the answer.'
  },
  {
    from: 'ai',
    time: '2:16 PM',
    body: 'Rewriting scene 1. New lede: "Two shapes start at the same height — same mass, same radius. Which reaches the bottom first?"',
    suggestions: ['Use this', 'Try another angle']
  }
];

// All scenes are live — each entry renders the real motion/*.html in an
// iframe via PreviewCanvas. duration is seconds (matches scene-manifest.json).
const initialScenes = [
  { id: 'live-rc', kind: 'live', kindLabel: 'Live', cardTitle: 'Charging a Capacitor', duration: 34, html: '../../motion/fysikk/rc-scene.html' },
  { id: 'live-derivation', kind: 'live', kindLabel: 'Live', cardTitle: 'Moment of Inertia', duration: 43, html: '../../motion/fysikk/derivation-scene.html' },
  { id: 'live-hoop-disk', kind: 'live', kindLabel: 'Live', cardTitle: 'Hoop vs Disk', duration: 48, html: '../../motion/fysikk/hoop-disk.html' },
  { id: 'live-spring', kind: 'live', kindLabel: 'Live', cardTitle: "Hooke's Law: Spring Bobs", duration: 41, html: '../../motion/fysikk/spring-oscillation.html' },
  { id: 'live-pendulum', kind: 'live', kindLabel: 'Live', cardTitle: 'The Simple Pendulum', duration: 51, html: '../../motion/fysikk/pendulum.html' },
  { id: 'live-rlc-pendulum', kind: 'live', kindLabel: 'Live', cardTitle: 'RLC ↔ Pendulum Analogy', duration: 48, html: '../../motion/fysikk/rlc-pendulum.html' },
  { id: 'live-centripetal', kind: 'live', kindLabel: 'Live', cardTitle: 'Centripetal Acceleration', duration: 42, html: '../../motion/fysikk/centripetal-acceleration.html' },
  { id: 'live-steiners', kind: 'live', kindLabel: 'Live', cardTitle: "Steiner's Theorem", duration: 55, html: '../../motion/fysikk/steiners-theorem.html' },
  { id: 'live-damping', kind: 'live', kindLabel: 'Live', cardTitle: 'Damped Oscillation', duration: 46, html: '../../motion/fysikk/damped-oscillation.html' },
  { id: 'live-coulomb', kind: 'live', kindLabel: 'Live', cardTitle: "Coulomb's Law", duration: 46, html: '../../motion/fysikk/coulombs-law.html' },
  { id: 'live-torque', kind: 'live', kindLabel: 'Live', cardTitle: 'Torque: Leverage Beats Force', duration: 45, html: '../../motion/fysikk/torque.html' },
  { id: 'live-round-robin', kind: 'live', kindLabel: 'Live', cardTitle: 'Round-Robin Scheduling', duration: 53, html: '../../motion/operativsystemer/round-robin-scheduling.html' },
  { id: 'live-addr-trans', kind: 'live', kindLabel: 'Live', cardTitle: 'Address Translation', duration: 51, html: '../../motion/operativsystemer/address-translation.html' },
  { id: 'live-race', kind: 'live', kindLabel: 'Live', cardTitle: 'Race Condition', duration: 53, html: '../../motion/operativsystemer/race-condition.html' },
  { id: 'live-tas-lock', kind: 'live', kindLabel: 'Live', cardTitle: 'Test-and-Set Lock', duration: 54, html: '../../motion/operativsystemer/test-and-set-lock.html' },
  { id: 'live-addr-space', kind: 'live', kindLabel: 'Live', cardTitle: 'Address Space Layout', duration: 42, html: '../../motion/operativsystemer/address-space-layout.html' },
  { id: 'live-inode', kind: 'live', kindLabel: 'Live', cardTitle: 'The Inode', duration: 43, html: '../../motion/operativsystemer/inode-block-pointers.html' },
  { id: 'live-sjf', kind: 'live', kindLabel: 'Live', cardTitle: 'Shortest Job First', duration: 46, html: '../../motion/operativsystemer/sjf-scheduling.html' },
  { id: 'live-prod-cons', kind: 'live', kindLabel: 'Live', cardTitle: 'Producer–Consumer', duration: 44, html: '../../motion/operativsystemer/producer-consumer.html' },
  { id: 'live-tlb', kind: 'live', kindLabel: 'Live', cardTitle: 'TLB Hits and Misses', duration: 48, html: '../../motion/operativsystemer/tlb-hit-miss.html' },
  { id: 'live-semaphore', kind: 'live', kindLabel: 'Live', cardTitle: 'Semaphores: A Counter Threads Wait On', duration: 45, html: '../../motion/operativsystemer/semaphore-counter.html' },
  { id: 'live-proc-states', kind: 'live', kindLabel: 'Live', cardTitle: 'Process States: Running, Ready, Blocked', duration: 59, html: '../../motion/operativsystemer/process-states.html' },
  { id: 'live-poll-irq', kind: 'live', kindLabel: 'Live', cardTitle: 'Polling vs Interrupts', duration: 42, html: '../../motion/operativsystemer/polling-vs-interrupt.html' },
  { id: 'live-mlfq', kind: 'live', kindLabel: 'Live', cardTitle: 'Multi-Level Feedback Queue', duration: 44, html: '../../motion/operativsystemer/mlfq-scheduling.html' },
  { id: 'live-philosophers', kind: 'live', kindLabel: 'Live', cardTitle: 'Dining Philosophers', duration: 53, html: '../../motion/operativsystemer/dining-philosophers.html' },
  { id: 'live-demand-paging', kind: 'live', kindLabel: 'Live', cardTitle: 'Demand Paging', duration: 55, html: '../../motion/operativsystemer/demand-paging.html' },
  { id: 'live-journaling', kind: 'live', kindLabel: 'Live', cardTitle: 'Journaling', duration: 62, html: '../../motion/operativsystemer/journaling-fs.html' },
  { id: 'live-raid', kind: 'live', kindLabel: 'Live', cardTitle: 'RAID', duration: 53, html: '../../motion/operativsystemer/raid.html' },
  { id: 'live-voltage-divider', kind: 'live', kindLabel: 'Live', cardTitle: 'Voltage Divider', duration: 36, html: '../../motion/ade/voltage-divider.html' },
  { id: 'live-half-wave', kind: 'live', kindLabel: 'Live', cardTitle: 'Half-Wave Rectifier', duration: 41, html: '../../motion/ade/half-wave-rectifier.html' },
  { id: 'live-d-flip-flop', kind: 'live', kindLabel: 'Live', cardTitle: 'D Flip-Flop', duration: 35, html: '../../motion/ade/d-flip-flop.html' },
  { id: 'live-kvl', kind: 'live', kindLabel: 'Live', cardTitle: "Kirchhoff's Voltage Law", duration: 40, html: '../../motion/ade/kirchhoff-voltage-law.html' },
  { id: 'live-phasor', kind: 'live', kindLabel: 'Live', cardTitle: 'Phasors: Rotating Arrows', duration: 40, html: '../../motion/ade/phasor-rotation.html' },
  { id: 'live-kmap', kind: 'live', kindLabel: 'Live', cardTitle: 'Karnaugh Maps', duration: 39, html: '../../motion/ade/karnaugh-map.html' },
  { id: 'live-thevenin', kind: 'live', kindLabel: 'Live', cardTitle: "Thévenin's Theorem", duration: 44, html: '../../motion/ade/thevenin-equivalent.html' },
  { id: 'live-low-pass-bode', kind: 'live', kindLabel: 'Live', cardTitle: 'RC Low-Pass Filter', duration: 46, html: '../../motion/ade/low-pass-bode.html' },
  { id: 'live-fsm', kind: 'live', kindLabel: 'Live', cardTitle: 'Finite State Machines', duration: 39, html: '../../motion/ade/finite-state-machine.html' },
  { id: 'live-cap-energy', kind: 'live', kindLabel: 'Live', cardTitle: 'Energy in a Capacitor', duration: 48, html: '../../motion/ade/capacitor-energy.html' },
  { id: 'live-nand-universal', kind: 'live', kindLabel: 'Live', cardTitle: 'NAND is Universal', duration: 42, html: '../../motion/ade/nand-universality.html' },
  { id: 'live-inv-opamp', kind: 'live', kindLabel: 'Live', cardTitle: 'Inverting Op-Amp', duration: 56, html: '../../motion/ade/inverting-op-amp.html' },
  { id: 'live-lin-transform', kind: 'live', kindLabel: 'Live', cardTitle: 'Linear Transformations', duration: 62, html: '../../motion/mat2b/linear-transformation-grid.html' },
  { id: 'live-span-dep', kind: 'live', kindLabel: 'Live', cardTitle: 'Span and Linear Dependence', duration: 39, html: '../../motion/mat2b/span-and-dependence.html' },
  { id: 'live-basis-grid', kind: 'live', kindLabel: 'Live', cardTitle: 'Same Vector, Two Grids', duration: 35, html: '../../motion/mat2b/basis-change-grid.html' },
  { id: 'live-matrix-fn', kind: 'live', kindLabel: 'Live', cardTitle: 'A Matrix Is a Function', duration: 37, html: '../../motion/mat2b/matrix-as-function.html' },
  { id: 'live-projection', kind: 'live', kindLabel: 'Live', cardTitle: 'Projection onto a Line', duration: 31, html: '../../motion/mat2b/projection-onto-line.html' },
  { id: 'live-diagonal', kind: 'live', kindLabel: 'Live', cardTitle: 'Diagonalisation: Eigenaxes', duration: 39, html: '../../motion/mat2b/diagonalisation-eigenaxes.html' },
  { id: 'live-mosfet-switch', kind: 'live', kindLabel: 'Live', cardTitle: 'The MOSFET as a Switch', duration: '0:53', html: '../../motion/ade/mosfet-switch.html' },
  { id: 'live-bjt-load-line', kind: 'live', kindLabel: 'Live', cardTitle: 'BJT Load Line', duration: '1:00', html: '../../motion/ade/bjt-load-line.html' },
  { id: 'live-twos-complement', kind: 'live', kindLabel: 'Live', cardTitle: "Two's Complement", duration: '0:50', html: '../../motion/ade/twos-complement.html' },
  { id: 'live-kcl', kind: 'live', kindLabel: 'Live', cardTitle: "Kirchhoff's Current Law", duration: '0:37', html: '../../motion/ade/kirchhoff-current-law.html' },
  { id: 'live-bridge-rectifier', kind: 'live', kindLabel: 'Live', cardTitle: 'Full-Wave Bridge Rectifier', duration: '0:46', html: '../../motion/ade/full-wave-bridge-rectifier.html' },
  { id: 'live-mux-4to1', kind: 'live', kindLabel: 'Live', cardTitle: '4-to-1 Multiplexer', duration: '0:36', html: '../../motion/ade/multiplexer-4-to-1.html' },
  { id: 'live-norton', kind: 'live', kindLabel: 'Live', cardTitle: "Norton's Theorem", duration: '0:41', html: '../../motion/ade/norton-equivalent.html' },
  { id: 'live-non-inv-opamp', kind: 'live', kindLabel: 'Live', cardTitle: 'Non-Inverting Op-Amp', duration: '0:46', html: '../../motion/ade/non-inverting-op-amp.html' },
  { id: 'live-shift-register', kind: 'live', kindLabel: 'Live', cardTitle: 'Shift Register', duration: '0:52', html: '../../motion/ade/shift-register.html' },
  { id: 'live-inductor-energy', kind: 'live', kindLabel: 'Live', cardTitle: 'Energy in an Inductor', duration: 49, html: '../../motion/ade/inductor-energy.html' },
  { id: 'live-max-power-transfer', kind: 'live', kindLabel: 'Live', cardTitle: 'Maximum Power Transfer', duration: 61, html: '../../motion/ade/max-power-transfer.html' },
  { id: 'live-joule-heating', kind: 'live', kindLabel: 'Live', cardTitle: 'Joule Heating', duration: 47, html: '../../motion/ade/joule-heating.html' },
  { id: 'live-superposition', kind: 'live', kindLabel: 'Live', cardTitle: 'Superposition: One Source at a Time', duration: 51, html: '../../motion/ade/superposition.html' },
  { id: 'live-summing-amp', kind: 'live', kindLabel: 'Live', cardTitle: 'Summing Amplifier', duration: 53, html: '../../motion/ade/summing-amplifier.html' },
  { id: 'live-sr-latch', kind: 'live', kindLabel: 'Live', cardTitle: 'SR Latch: Two NOR Gates', duration: 57, html: '../../motion/ade/sr-latch.html' },
  { id: 'live-ohms-law', kind: 'live', kindLabel: 'Live', cardTitle: "Ohm's Law", duration: 35, html: '../../motion/ade/ohms-law.html' },
  { id: 'live-zener-clipper', kind: 'live', kindLabel: 'Live', cardTitle: 'Zener Clipper', duration: 39, html: '../../motion/ade/zener-clipper.html' },
  { id: 'live-two-to-four-decoder', kind: 'live', kindLabel: 'Live', cardTitle: '2-to-4 Decoder', duration: 37, html: '../../motion/ade/two-to-four-decoder.html' },
  { id: 'live-rc-charging', kind: 'live', kindLabel: 'Live', cardTitle: 'RC Charging', duration: '0:41', html: '../../motion/ade/rc-charging.html' },
  { id: 'live-cmos-inverter', kind: 'live', kindLabel: 'Live', cardTitle: 'The CMOS Inverter', duration: '0:54', html: '../../motion/ade/cmos-inverter.html' },
  { id: 'live-hexadecimal-counting', kind: 'live', kindLabel: 'Live', cardTitle: 'Counting in Hexadecimal', duration: '0:38', html: '../../motion/ade/hexadecimal-counting.html' },
  { id: 'live-rl-transient', kind: 'live', kindLabel: 'Live', cardTitle: 'RL Transient', duration: 46, html: '../../motion/ade/rl-transient.html' },
  { id: 'live-integrator-op-amp', kind: 'live', kindLabel: 'Live', cardTitle: 'Op-Amp Integrator', duration: 58, html: '../../motion/ade/integrator-op-amp.html' },
  { id: 'live-jk-flip-flop', kind: 'live', kindLabel: 'Live', cardTitle: 'JK Flip-Flop', duration: 53, html: '../../motion/ade/jk-flip-flop.html' },
];

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
}

// Fake-but-believable Manimo reply. Only used in this preview kit.
function demoReply(userText) {
  const lower = userText.toLowerCase();
  if (/slow|pace|rhythm/.test(lower)) return 'Slowing scene 2 to give the integral room to breathe — the substitution beat now lands at 14s.';
  if (/add|insert|include/.test(lower)) return "Drafted a new scene. It slots in after the comparison and runs about twelve seconds — want me to mount it?";
  if (/shorten|trim|cut/.test(lower)) return 'Tightened the scene by trimming the lead-in chalk strokes; total is six seconds shorter.';
  if (/change|swap|replace/.test(lower)) return 'Swapping in a fresh take. Reload the preview when the new build mounts.';
  return 'Working through it — a couple of options on the way. Connect a real Manimo backend to see them stream in.';
}

function App() {
  const [title, setTitle] = useState(() => loadJSON(LS_TITLE, 'Manimo · scene library'));
  const [aspect, setAspect] = useState(() => loadJSON(LS_ASPECT, '16:9'));
  const [messages, setMessages] = useState(() => loadJSON(LS_CHAT, seedMessages));
  const [scenes] = useState(initialScenes);
  const [selectedIdx, setSelectedIdx] = useState(() => {
    const v = loadJSON(LS_INDEX, 0);
    return Number.isInteger(v) && v >= 0 && v < initialScenes.length ? v : 0;
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => { saveJSON(LS_TITLE, title); setSavedAt(Date.now()); }, [title]);
  useEffect(() => { saveJSON(LS_INDEX, selectedIdx); }, [selectedIdx]);
  useEffect(() => { saveJSON(LS_CHAT, messages); }, [messages]);
  useEffect(() => { saveJSON(LS_ASPECT, aspect); }, [aspect]);

  const handleSend = (text) => {
    const stamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setMessages(m => [...m, { from: 'user', time: stamp, body: text }]);
    setTimeout(() => {
      setMessages(m => [...m, {
        from: 'ai',
        time: stamp,
        body: demoReply(text),
        demo: true,
      }]);
    }, 600);
  };

  const handlePickSuggest = (text) => handleSend(text);

  const handleResetChat = () => {
    setMessages(seedMessages);
  };

  const handleRender = () => {
    setRendering(true);
    setTimeout(() => setRendering(false), 1800);
  };

  const totalSec = useMemo(() => scenes.reduce((s, x) => s + (x.duration || 0), 0), [scenes]);

  return (
    <div className={`app ${chatOpen ? 'chat-open' : 'chat-closed'}`}>
      <TopBar
        title={title} setTitle={setTitle}
        aspect={aspect} setAspect={setAspect}
        onRender={handleRender} rendering={rendering}
        savedAt={savedAt}
        chatOpen={chatOpen} onToggleChat={() => setChatOpen(o => !o)}
        unread={messages.length}
      />
      <div className="workspace">
        <PreviewCanvas
          aspect={aspect}
          scenes={scenes}
          sceneIndex={selectedIdx}
          onSelectScene={setSelectedIdx}
        />
        <SceneList
          scenes={scenes}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
          totalSeconds={totalSec}
        />
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          onPickSuggest={handlePickSuggest}
          onClose={() => setChatOpen(false)}
          onReset={handleResetChat}
          open={chatOpen}
        />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
