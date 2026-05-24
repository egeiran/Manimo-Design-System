// Numerical Orbits: Why Euler Spirals Off — Manimo lesson scene.
// Chapter 4 of mat2b (Differensialligninger), numerical methods for systems
// (Uke 10). The undamped oscillator written as a system:
//
//   x' = v,  v' = -x        true orbit: a circle of constant energy x² + v²
//
// Forward Euler steps along the tangent, which points just outside the circle,
// so each step multiplies the radius by sqrt(1 + h²) > 1 → the orbit spirals
// out (energy injected). A fourth-order RK step at the same h stays on the
// circle. Local accuracy isn't the whole story — a method's geometry decides
// whether an invariant (energy) is preserved.
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//   0– 6   Manimo hook
//   6–18   The system + true circular orbit (orbiting dot — GENUINE MOTION)
//  18–32   Forward Euler spirals outward, energy climbs (GENUINE MOTION)
//  32–46   RK4 at the same h stays on the circle (GENUINE MOTION)
//  46–55   Why: radius × sqrt(1 + h²) each step
//  55–61   Takeaway
//
// Colour discipline:
//   violet-400  true circular orbit / reference
//   rose-400    forward Euler — the drifting spiral
//   teal-400    RK4 — stays on the circle
//   amber-*     payoff formula
//   chalk-*     axes, captions

const SCENE_DURATION = 67;

const NARRATION = [
  /*  0– 6 */ 'A frictionless oscillator should trace the very same loop forever. Step it carelessly, though, and the loop slowly inflates.',
  /*  6–18 */ 'Write the swing as a system. The rate of position is the velocity, and the rate of velocity is minus the position. In the phase plane of position against velocity, the true motion is a circle, and its radius, the energy, never changes.',
  /* 18–32 */ 'Step it with forward Euler. Each step darts along the tangent, which points a touch outside the circle, so the orbit creeps outward, lap after lap. The method is quietly pumping in energy.',
  /* 32–46 */ 'Switch to a fourth order step at the very same step size. It samples the field across the interval and lands back on the circle every lap. Same number of steps, almost no drift.',
  /* 46–55 */ 'Each forward Euler step multiplies the distance from the origin by the square root of one plus h squared. Just over one, so the radius grows a sliver every single step.',
  /* 55–61 */ 'Local accuracy is not the whole story. The geometry of a method decides whether energy is kept. Match the method to the structure of the problem.',
];

const NARRATION_AUDIO = 'audio/numerical-orbit-energy-drift/scene.mp3';

// ─── Model: x' = v, v' = -x ─────────────────────────────────────────────────
const H = 0.2, NSTEPS = 32;
const field = (x, v) => [v, -x];

function eulerSys() {
  const pts = [{ x: 1, v: 0 }];
  let x = 1, v = 0;
  for (let n = 0; n < NSTEPS; n++) {
    const [dx, dv] = field(x, v);
    x = x + H * dx; v = v + H * dv;
    pts.push({ x, v });
  }
  return pts;
}
function rk4Sys() {
  const pts = [{ x: 1, v: 0 }];
  let x = 1, v = 0;
  for (let n = 0; n < NSTEPS; n++) {
    const [a1, b1] = field(x, v);
    const [a2, b2] = field(x + H / 2 * a1, v + H / 2 * b1);
    const [a3, b3] = field(x + H / 2 * a2, v + H / 2 * b2);
    const [a4, b4] = field(x + H * a3, v + H * b3);
    x = x + H / 6 * (a1 + 2 * a2 + 2 * a3 + a4);
    v = v + H / 6 * (b1 + 2 * b2 + 2 * b3 + b4);
    pts.push({ x, v });
  }
  return pts;
}
const EULER = eulerSys();
const RK4 = rk4Sys();
const energy = (p) => p.x * p.x + p.v * p.v;

// ─── Geometry (square phase plane) ──────────────────────────────────────────
function geom(portrait) {
  return portrait
    ? { vw: 720, vh: 1280, cx: 360, cy: 545, unit: 120,
        panel: { left: 70, top: 905, width: 580 } }
    : { vw: 1280, vh: 720, cx: 432, cy: 372, unit: 132,
        panel: { right: 52, top: 150, width: 392 } };
}
const px = (x, G) => G.cx + x * G.unit;
const py = (v, G) => G.cy - v * G.unit;
const orbitPath = (pts, G, upto) =>
  (upto == null ? pts : pts.slice(0, upto + 1))
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x, G).toFixed(1)} ${py(p.v, G).toFixed(1)}`).join(' ');

// ─── Shared helpers ─────────────────────────────────────────────────────────
function SoftPanel({ children, right, top, left, bottom, width = 380 }) {
  const pos = (left != null || bottom != null)
    ? { left, top: bottom == null ? top : undefined, bottom }
    : { right, top };
  return (
    <div style={{
      position: 'absolute', width, ...pos, pointerEvents: 'none',
      padding: '18px 22px', background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)', borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
    }}>{children}</div>
  );
}

function PhaseAxes({ G }) {
  const r = G.unit, ext = G.unit * 2.05;
  return (
    <g>
      <line x1={G.cx - ext} y1={G.cy} x2={G.cx + ext} y2={G.cy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1={G.cx} y1={G.cy + ext} x2={G.cx} y2={G.cy - ext}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
      <text x={G.cx + ext + 12} y={G.cy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={20}>x</text>
      <text x={G.cx + 10} y={G.cy - ext - 8}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={20}>v</text>
      {/* unit-radius tick on the x axis */}
      <line x1={G.cx + r} y1={G.cy - 5} x2={G.cx + r} y2={G.cy + 5} stroke="var(--chalk-300)" strokeWidth={1.4}/>
      <text x={G.cx + r} y={G.cy + 22} textAnchor="middle" fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>1</text>
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="numerical ODEs · systems"
      title="Numerical Orbits: Why Euler Spirals Off"
      duration={SCENE_DURATION}
      introEnd={7.41}
      introCaption="The loop that won't stay put."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.41} end={21.9}>
        <SystemSetup/>
      </Sprite>

      <Sprite start={21.9} end={34.18}>
        <EulerOrbit/>
      </Sprite>

      <Sprite start={34.18} end={45.65}>
        <CompareRK4/>
      </Sprite>

      <Sprite start={45.65} end={56.48}>
        <WhyBeat/>
      </Sprite>

      <Sprite start={56.48} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: the system + true orbit (orbiting dot — GENUINE MOTION) ────────
function SystemSetup() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  // True solution x = cos t, v = -sin t. Dot orbits once the circle is drawn.
  const t = Math.max(0, localTime - 2.0) * 1.4;
  const dot = { x: Math.cos(t), v: -Math.sin(t) };

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vw} height={G.vh} viewBox={`0 0 ${G.vw} ${G.vh}`}>
        <PhaseAxes G={G}/>
        <TraceIn d={(() => { let d = ''; for (let i = 0; i <= 64; i++) { const a = i / 64 * 2 * Math.PI; d += `${i === 0 ? 'M' : 'L'} ${px(Math.cos(a), G).toFixed(1)} ${py(-Math.sin(a), G).toFixed(1)} `; } return d.trim(); })()}
                 stroke="var(--violet-400)" strokeWidth={3} duration={1.6} delay={0.6}/>
        {localTime > 2.0 && (
          <g>
            <line x1={G.cx} y1={G.cy} x2={px(dot.x, G)} y2={py(dot.v, G)}
                  stroke="var(--violet-400)" strokeWidth={1.4} opacity={0.5}/>
            <circle cx={px(dot.x, G)} cy={py(dot.v, G)} r={7}
                    fill="var(--violet-400)" stroke="var(--chalk-100)" strokeWidth={1.3}/>
          </g>
        )}
      </svg>
      {portrait
        ? <SoftPanel left={G.panel.left} top={G.panel.top} width={G.panel.width}>{setupPanel(true)}</SoftPanel>
        : <SoftPanel right={G.panel.right} top={G.panel.top} width={G.panel.width}>{setupPanel(false)}</SoftPanel>}
    </>
  );
}
function setupPanel(portrait) {
  return (
    <>
      <FadeUp duration={0.45} delay={0.3} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        oscillator as a system
      </FadeUp>
      <FadeUp duration={0.55} delay={0.7} distance={10}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 24 : 30, color: 'var(--chalk-100)' }}>
        x′ = v,  v′ = −x
      </FadeUp>
      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 20 : 24, color: 'var(--violet-400)' }}>
        E = x² + v²  (constant)
      </FadeUp>
      <FadeUp duration={0.5} delay={2.6} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
                 color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4 }}>
        The phase point circles forever — the radius is the energy.
      </FadeUp>
    </>
  );
}

// ─── Beat 3: forward Euler spirals out (GENUINE MOTION) ─────────────────────
function EulerOrbit() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  const frac = Easing.easeInOutCubic(clamp((localTime - 0.6) / 9.0, 0, 1));
  const shown = Math.max(1, Math.round(frac * NSTEPS));
  const tip = EULER[shown];
  const E = energy(tip);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vw} height={G.vh} viewBox={`0 0 ${G.vw} ${G.vh}`}>
        <PhaseAxes G={G}/>
        {/* reference unit circle (dashed) */}
        <circle cx={G.cx} cy={G.cy} r={G.unit} fill="none"
                stroke="var(--violet-400)" strokeWidth={2} strokeDasharray="5 6" opacity={0.55}/>
        {/* Euler spiral so far */}
        <path d={orbitPath(EULER, G, shown)} fill="none" stroke="var(--rose-400)"
              strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={px(EULER[0].x, G)} cy={py(EULER[0].v, G)} r={4.5} fill="var(--chalk-100)"/>
        <circle cx={px(tip.x, G)} cy={py(tip.v, G)} r={6.5}
                fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={1.3}/>
      </svg>
      {portrait
        ? <SoftPanel left={G.panel.left} top={G.panel.top} width={G.panel.width}>{eulerPanel(true, E)}</SoftPanel>
        : <SoftPanel right={G.panel.right} top={G.panel.top} width={G.panel.width}>{eulerPanel(false, E)}</SoftPanel>}
    </>
  );
}
function eulerPanel(portrait, E) {
  return (
    <>
      <FadeUp duration={0.45} delay={0.2} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        forward Euler on the system
      </FadeUp>
      <FadeUp duration={0.5} delay={0.5} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 18, color: 'var(--rose-300)' }}>
        energy = {E.toFixed(2)}
      </FadeUp>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 12 : 13, color: 'var(--chalk-300)' }}>
        (started at 1.00)
      </FadeUp>
      <FadeUp duration={0.5} delay={2.6} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
                 color: 'var(--chalk-200)', maxWidth: '34ch', lineHeight: 1.4 }}>
        The tangent points just outside the circle, so every step nudges the orbit outward.
      </FadeUp>
    </>
  );
}

// ─── Beat 4: RK4 stays on the circle (GENUINE MOTION) ───────────────────────
function CompareRK4() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  const frac = Easing.easeInOutCubic(clamp((localTime - 0.6) / 9.0, 0, 1));
  const shown = Math.max(1, Math.round(frac * NSTEPS));
  const rkTip = RK4[shown];
  const Erk = energy(rkTip);
  const Eeu = energy(EULER[NSTEPS]);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vw} height={G.vh} viewBox={`0 0 ${G.vw} ${G.vh}`}>
        <PhaseAxes G={G}/>
        {/* full Euler spiral, faded — the drift to beat */}
        <path d={orbitPath(EULER, G)} fill="none" stroke="var(--rose-400)"
              strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.4}/>
        {/* reference unit circle */}
        <circle cx={G.cx} cy={G.cy} r={G.unit} fill="none"
                stroke="var(--violet-400)" strokeWidth={2} strokeDasharray="5 6" opacity={0.55}/>
        {/* RK4 orbit so far — sits on the circle */}
        <path d={orbitPath(RK4, G, shown)} fill="none" stroke="var(--teal-400)"
              strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={px(rkTip.x, G)} cy={py(rkTip.v, G)} r={6.5}
                fill="var(--teal-400)" stroke="var(--chalk-100)" strokeWidth={1.3}/>
      </svg>
      {portrait
        ? <SoftPanel left={G.panel.left} top={G.panel.top} width={G.panel.width}>{rkPanel(true, Erk, Eeu)}</SoftPanel>
        : <SoftPanel right={G.panel.right} top={G.panel.top} width={G.panel.width}>{rkPanel(false, Erk, Eeu)}</SoftPanel>}
    </>
  );
}
function rkPanel(portrait, Erk, Eeu) {
  return (
    <>
      <FadeUp duration={0.45} delay={0.2} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        RK4, same step size
      </FadeUp>
      <FadeUp duration={0.5} delay={0.5} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 16, color: 'var(--teal-400)' }}>
        RK4 energy = {Erk.toFixed(2)}
      </FadeUp>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 15, color: 'var(--rose-300)' }}>
        Euler energy = {Eeu.toFixed(2)}
      </FadeUp>
      <FadeUp duration={0.5} delay={2.6} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
                 color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4 }}>
        RK4 lands back on the circle each lap — energy barely moves.
      </FadeUp>
    </>
  );
}

// ─── Beat 5: why — the growth factor ────────────────────────────────────────
function WhyBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: portrait ? 20 : 26,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        one forward Euler step
      </FadeUp>
      <FadeUp duration={0.6} delay={0.4} distance={12}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 26 : 38, color: 'var(--amber-300)',
                 textAlign: 'center', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
        {portrait ? (
          <>‖(xₙ₊₁, vₙ₊₁)‖<br/>= √(1 + h²) · ‖(xₙ, vₙ)‖</>
        ) : (
          <>‖(xₙ₊₁, vₙ₊₁)‖ = √(1 + h²) · ‖(xₙ, vₙ)‖</>
        )}
      </FadeUp>
      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 15 : 17, color: 'var(--chalk-200)',
                 textAlign: 'center', maxWidth: portrait ? '26ch' : '44ch', lineHeight: 1.4 }}>
        √(1 + h²) is just over 1 — so the radius grows a sliver every single step.
      </FadeUp>
    </div>
  );
}

// ─── Beat 6: takeaway ───────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        geometry, not just accuracy
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 30 : 44, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '42ch', lineHeight: 1.25 }}>
        A method can conserve — or quietly <span style={{ color: 'var(--rose-400)' }}>destroy</span>.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 16, color: 'var(--chalk-300)',
                 maxWidth: portrait ? '30ch' : '50ch', lineHeight: 1.4 }}>
        Match the method to the structure of the problem.
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
