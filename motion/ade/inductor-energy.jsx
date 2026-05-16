// Energy in an Inductor: Why It's One Half L I Squared — Manimo lesson scene.
// Dual of capacitor-energy. Ramping current through a coil builds a magnetic
// field; the work integral ∫v·i dt collapses to ½LI² because Φ = L·i is a
// straight line in the (i, Φ) plane. Genuine motion lives in Beat 2 (current
// ramps, expanding field rings) and Beat 3 (value-driven triangle area filling
// under the Φ = L·i line).
//
// Beats (timed to single-track narration in motion/ade/audio/inductor-energy/):
//    0.00– 5.00  Manimo enters; hook question
//    5.00–15.00  Coil + switch; current ramps, field rings expand, v = L·di/dt
//   15.00–26.00  Φ–i graph: line traces, triangle area sweeps in with point
//   26.00–37.00  Three equivalent forms: ½LI², ½ΦI, Φ²/(2L)
//   37.00–44.00  Takeaway: energy lives in the magnetic field

const SCENE_DURATION = 49;

const NARRATION = [
  /*  0.00– 5.00 */ 'Push current through an inductor — where does the energy go?',
  /*  5.00–15.00 */ 'Close the switch and the current ramps from zero up to I. A magnetic field grows around the coil, and the inductor pushes back with a voltage v equal to L times the rate of change of current.',
  /* 15.00–26.00 */ 'Plot flux against current. Φ equals L times i — a straight line. The work to push the current from zero up to I is the area under that line, a triangle with area one half L I squared.',
  /* 26.00–37.00 */ 'Three faces of the same energy: one half L I squared, one half Φ I, and Φ squared over two L. Use whichever two quantities you know.',
  /* 37.00–44.00 */ 'The energy lives in the magnetic field around the coil. Open the switch and the field collapses — releasing every joule back into the circuit.',
];

const NARRATION_AUDIO = 'audio/inductor-energy/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="energy and power"
      title="Energy in an Inductor: ½ L I²"
      duration={SCENE_DURATION}
      introEnd={3.69}
      introCaption="Ramp current through a coil — where does the energy go?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={3.69} end={15.69}>
        <RampingCurrentBeat />
      </Sprite>

      <Sprite start={15.69} end={29.58}>
        <FluxIntegralBeat />
      </Sprite>

      <Sprite start={29.58} end={39.28}>
        <ThreeFormsBeat />
      </Sprite>

      <Sprite start={39.28} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Ramping current, growing field ──────────────────────────────
// Genuine motion: a current pulse travels around the loop with density scaling
// as i ramps from 0 to 1, while three concentric field-line ovals scale up
// around the coil core to make B-field growth visible.
function RampingCurrentBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const RAMP_START = 1.0;
  const RAMP_END = 7.0;
  const i = clamp((localTime - RAMP_START) / (RAMP_END - RAMP_START), 0, 1);

  const G = portrait
    ? { vbW: 600, vbH: 620,
        srcX: 100, srcY: 200, coilCx: 380, coilCy: 360, coilR: 70,
        wireTopY: 200, wireBotY: 460,
        formulaX: 300, formulaY: 540, fontFormula: 26,
        captionY: 600, fontCaption: 13 }
    : { vbW: 1000, vbH: 440,
        srcX: 140, srcY: 220, coilCx: 600, coilCy: 220, coilR: 70,
        wireTopY: 130, wireBotY: 310,
        formulaX: 820, formulaY: 220, fontFormula: 28,
        captionY: 410, fontCaption: 14 };

  // Coil glyph: six bumps in a stacked column.
  const bumps = 6;
  const bumpSpacing = (G.coilR * 2 - 16) / bumps;
  const coilTop = G.coilCy - G.coilR + 8;
  const coilBot = G.coilCy + G.coilR - 8;

  // Build the coil "loops" as a single sinuous path (six humps to the right).
  const coilD = (() => {
    const pts = [`M ${G.coilCx} ${coilTop}`];
    for (let b = 0; b < bumps; b++) {
      const y0 = coilTop + b * bumpSpacing;
      const y1 = y0 + bumpSpacing;
      const cy = y0 + bumpSpacing / 2;
      // Half-circle bump to the right.
      pts.push(`Q ${G.coilCx + 24} ${cy}, ${G.coilCx} ${y1}`);
    }
    return pts.join(' ');
  })();

  // Wire route: source(+) → top wire → coil top, coil bottom → bot wire → source(−).
  const topWireD = `M ${G.srcX + 22} ${G.srcY - 10} L ${G.srcX + 22} ${G.wireTopY} L ${G.coilCx} ${G.wireTopY} L ${G.coilCx} ${coilTop}`;
  const botWireD = `M ${G.coilCx} ${coilBot} L ${G.coilCx} ${G.wireBotY} L ${G.srcX + 22} ${G.wireBotY} L ${G.srcX + 22} ${G.srcY + 10}`;

  // Current dots flow around the loop. Build evenly-spaced positions along
  // a parameterised path: source-top → top wire → coil column → bottom wire →
  // source-bottom. For simplicity, we sample positions on the top + coil +
  // bottom segments and animate them by sliding indices.
  const DOTS = 8;
  // Each dot's base phase (0..1), phase rolls with time.
  const speed = 0.18; // cycles per second at full current
  const phase = (t) => (t * speed * i) % 1;

  // Build a polyline of waypoint positions to interpolate along.
  // Waypoints (clockwise, starting at source top terminal):
  const wp = [
    { x: G.srcX + 22, y: G.srcY - 10 },
    { x: G.srcX + 22, y: G.wireTopY },
    { x: G.coilCx, y: G.wireTopY },
    { x: G.coilCx, y: coilTop },
    { x: G.coilCx, y: coilBot },
    { x: G.coilCx, y: G.wireBotY },
    { x: G.srcX + 22, y: G.wireBotY },
    { x: G.srcX + 22, y: G.srcY + 10 },
  ];
  // Cumulative lengths for parameterisation.
  const segLens = [];
  let totalLen = 0;
  for (let k = 0; k < wp.length - 1; k++) {
    const dx = wp[k + 1].x - wp[k].x, dy = wp[k + 1].y - wp[k].y;
    const L = Math.hypot(dx, dy);
    segLens.push(L); totalLen += L;
  }
  function posAt(u) {
    // u in [0, 1) maps to position along total path
    const target = u * totalLen;
    let acc = 0;
    for (let k = 0; k < segLens.length; k++) {
      if (acc + segLens[k] >= target) {
        const localFrac = (target - acc) / segLens[k];
        return {
          x: wp[k].x + (wp[k + 1].x - wp[k].x) * localFrac,
          y: wp[k].y + (wp[k + 1].y - wp[k].y) * localFrac,
        };
      }
      acc += segLens[k];
    }
    return wp[wp.length - 1];
  }

  // Field-line ovals around the coil — three concentric ellipses scaling with i.
  const fieldOpacity = 0.55 * i + 0.05;
  const fieldRings = [1.0, 1.45, 1.9];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Source — battery glyph */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.srcX - 14} y1={G.srcY - 10} x2={G.srcX + 14} y2={G.srcY - 10}
                stroke="var(--chalk-100)" strokeWidth={3} strokeLinecap="round"/>
          <line x1={G.srcX - 7}  y1={G.srcY + 10} x2={G.srcX + 7}  y2={G.srcY + 10}
                stroke="var(--chalk-100)" strokeWidth={3} strokeLinecap="round"/>
          <line x1={G.srcX + 14} y1={G.srcY - 10} x2={G.srcX + 22} y2={G.srcY - 10}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.srcX + 7}  y1={G.srcY + 10} x2={G.srcX + 22} y2={G.srcY + 10}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <text x={G.srcX - 26} y={G.srcY - 6} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.08em">V</text>
        </SvgFadeIn>

        {/* Top and bottom wires */}
        <TraceIn d={topWireD}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.6} delay={0.3}/>
        <TraceIn d={botWireD}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.6} delay={0.45}/>

        {/* Field-line ovals — appear before coil and scale with current */}
        {fieldRings.map((rs, idx) => (
          <SvgFadeIn key={`ring-${idx}`} duration={0.6} delay={1.0 + idx * 0.15}>
            <ellipse cx={G.coilCx + 16} cy={G.coilCy}
                     rx={(G.coilR + 8) * (0.55 + 0.55 * i) * rs}
                     ry={(G.coilR + 22) * (0.55 + 0.55 * i) * rs}
                     fill="none"
                     stroke="var(--violet-400)" strokeWidth={1.2}
                     strokeDasharray="4 5"
                     opacity={fieldOpacity * (1 - idx * 0.22)}/>
          </SvgFadeIn>
        ))}

        {/* Coil glyph */}
        <TraceIn d={coilD}
                 stroke="var(--amber-400)" strokeWidth={3}
                 fill="none"
                 duration={0.9} delay={0.6}/>
        {/* Coil label "L" */}
        <SvgFadeIn duration={0.4} delay={1.5}>
          <text x={G.coilCx + 56} y={G.coilCy + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={26}>L</text>
        </SvgFadeIn>

        {/* Current dots — flow once i > 0 */}
        {i > 0.05 && Array.from({ length: DOTS }, (_, k) => {
          const u = (k / DOTS + phase(localTime)) % 1;
          const p = posAt(u);
          // Fade brightness with current magnitude so it visibly ramps up.
          return (
            <circle key={`dot-${k}`}
                    cx={p.x} cy={p.y} r={3.2}
                    fill="var(--rose-400)" opacity={0.4 + 0.55 * i}/>
          );
        })}

        {/* Current i(t) value readout — small mono tag */}
        <SvgFadeIn duration={0.4} delay={1.8}>
          <text x={G.srcX} y={G.srcY + 56} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.1em">
            i = {(i * 1).toFixed(2)}·I
          </text>
        </SvgFadeIn>

        {/* v = L · di/dt label */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <text x={G.formulaX} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            v = L · di/dt
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            ramping current → growing field → induced voltage
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Φ–i graph with sweeping triangle ────────────────────────────
// Genuine motion: an (i, Φ) point slides up the Φ = L·i line and the triangle
// area beneath fills synchronously. This is the integral becoming visible.
function FluxIntegralBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 700, gx: 100, gy: 90, gw: 420, gh: 380,
        fontAxis: 22, fontFormula: 30, captionY: 660 }
    : { vbW: 1100, vbH: 480, gx: 160, gy: 60, gw: 540, gh: 360,
        fontAxis: 22, fontFormula: 38, captionY: 460 };

  const ax0 = G.gx, ay0 = G.gy + G.gh;
  const axEnd = G.gx + G.gw;
  const ayEnd = G.gy;

  // Triangle sweep: from delay 1.8 (after line traces) to delay 6.0.
  const SWEEP_START = 1.8;
  const SWEEP_END = 6.0;
  const sweep = clamp((localTime - SWEEP_START) / (SWEEP_END - SWEEP_START), 0, 1);

  const ixFinal = axEnd - 20;
  const phyFinal = ayEnd + 20;
  const pointX = ax0 + (ixFinal - ax0) * sweep;
  const pointY = ay0 + (phyFinal - ay0) * sweep;

  const formulaX = portrait ? G.vbW / 2 : axEnd + 130;
  const formulaY = portrait ? G.gy + G.gh + 80 : G.gy + G.gh / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Axes */}
        <TraceIn d={`M ${ax0} ${ayEnd} L ${ax0} ${ay0} L ${axEnd} ${ay0}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.8} delay={0.0}/>

        {/* Axis labels */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={axEnd + 18} y={ay0 + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>i</text>
          <text x={ax0 - 18} y={ayEnd - 6}
                textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>Φ</text>
          <text x={ixFinal} y={ay0 + 22} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">I</text>
          <text x={ax0 - 12} y={phyFinal + 5}
                textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">L·I</text>
        </SvgFadeIn>

        {/* Φ = L·i line traces */}
        <TraceIn d={`M ${ax0} ${ay0} L ${ixFinal} ${phyFinal}`}
                 stroke="var(--amber-400)" strokeWidth={2.6}
                 duration={1.0} delay={0.9}/>

        {/* Slope label */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          <text x={(ax0 + ixFinal) / 2 + 20} y={(ay0 + phyFinal) / 2 - 12}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            Φ = L · i
          </text>
        </SvgFadeIn>

        {/* Triangle area filling as sweep advances */}
        {sweep > 0.001 && (
          <g>
            <path d={`M ${ax0} ${ay0} L ${pointX} ${ay0} L ${pointX} ${pointY} Z`}
                  fill="var(--amber-400)" opacity={0.18}
                  stroke="none"/>
            <line x1={pointX} y1={pointY} x2={pointX} y2={ay0}
                  stroke="var(--rose-300)" strokeWidth={1.2}
                  strokeDasharray="3 4" opacity={0.7}/>
            <circle cx={pointX} cy={pointY} r={5}
                    fill="var(--rose-400)" stroke="var(--rose-300)" strokeWidth={1}/>
          </g>
        )}

        {/* dW = i · dΦ annotation */}
        {sweep > 0.15 && sweep < 0.85 && (
          <text x={pointX + 10} y={pointY - 12}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.06em"
                opacity={0.85}>
            dW = i · dΦ
          </text>
        )}

        {/* Final formula */}
        <SvgFadeIn duration={0.5} delay={6.2}>
          <text x={formulaX} y={formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            W = ½ L I²
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={7.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the area under Φ(i) is the energy stored
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Three equivalent forms ──────────────────────────────────────
function ThreeFormsBeat() {
  const portrait = usePortrait();

  const formulaStyle = (color, big) => ({
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: big ? (portrait ? 44 : 56) : (portrait ? 30 : 38),
    color, letterSpacing: '0.02em',
  });

  const Cell = ({ delay, big, color, children }) => (
    <FadeUp duration={0.5} delay={delay} distance={12}
      style={{
        whiteSpace: 'nowrap', flexShrink: 0,
        ...formulaStyle(color, big),
      }}>
      {children}
    </FadeUp>
  );

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 30 : 36,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        three equivalent forms
      </FadeUp>

      {portrait ? (
        <div style={{ display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 22 }}>
          <Cell delay={0.2} big color="var(--amber-300)">W = ½ L I²</Cell>
          <Cell delay={1.4} color="var(--chalk-200)">W = ½ Φ I</Cell>
          <Cell delay={2.6} color="var(--chalk-200)">W = Φ² / (2L)</Cell>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
          <Cell delay={1.4} color="var(--chalk-200)">W = ½ Φ I</Cell>
          <div style={{
            width: 1, height: 90,
            background: 'rgba(232,220,193,0.15)',
          }}/>
          <Cell delay={0.2} big color="var(--amber-300)">W = ½ L I²</Cell>
          <div style={{
            width: 1, height: 90,
            background: 'rgba(232,220,193,0.15)',
          }}/>
          <Cell delay={2.6} color="var(--chalk-200)">W = Φ² / (2L)</Cell>
        </div>
      )}

      <FadeUp duration={0.5} delay={5.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)',
          textAlign: 'center', maxWidth: portrait ? '26ch' : 'none',
          letterSpacing: '0.02em',
        }}>
        use whichever two quantities you know
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Energy lives in the magnetic field around the coil.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
        }}>
        (open the switch and the field collapses — every joule released)
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage
      width={1280} height={720}
      duration={SCENE_DURATION}
      background="#0c0a1f"
      loop={false}
    >
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
