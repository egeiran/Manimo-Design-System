// Joule Heating: How a Resistor Turns Current into Heat — Manimo lesson scene.
// Every charge crossing a resistor drops V volts, giving up V·q of potential
// energy that becomes lattice vibration — heat. Power P = V·I = I²R = V²/R is
// the rate; energy W = P·t is the running total. Genuine motion lives in
// Beat 2 (charge dots stream through the resistor while heat-glow accumulates)
// and Beat 4 (a (t, W) point slides up a linear ramp showing energy piling up).
//
// Beats (timed to single-track narration in motion/ade/audio/joule-heating/):
//    0.00– 5.00  Manimo enters; hook
//    5.00–16.00  Circuit with battery + resistor, charge dots flow, heat glow grows
//   16.00–28.00  Three forms: P = VI = I²R = V²/R with Ohm's-law substitution arrows
//   28.00–37.00  W = P·t ramp graph — heat piles up while current flows
//   37.00–42.00  Takeaway: not loss, transformation

const SCENE_DURATION = 47;

const NARRATION = [
  /*  0.00– 5.00 */ 'Current flows through a resistor — where does the energy actually go?',
  /*  5.00–16.00 */ "Each charge that crosses the resistor drops by V volts, so it gives up an amount of energy equal to V times q. That energy doesn't vanish — it jiggles the lattice and the resistor warms.",
  /* 16.00–28.00 */ "Multiply V times q over time — that's V times I, the power dissipated. Ohm's law gives two more forms: I squared R, and V squared over R. Same wattage, three faces.",
  /* 28.00–37.00 */ 'Power is the rate, not the total. Energy is power times time — keep the current flowing and the heat piles up, joule by joule, second by second.',
  /* 37.00–42.00 */ "It's not loss — it's transformation. A resistor's job is to convert electrical energy into heat.",
];

const NARRATION_AUDIO = 'audio/joule-heating/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="energy and power"
      title="Joule Heating: P = V · I"
      duration={SCENE_DURATION}
      introEnd={4.18}
      introCaption="Current through a resistor — where does the energy go?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.18} end={15.92}>
        <ChargesThroughResistorBeat />
      </Sprite>

      <Sprite start={15.92} end={29.11}>
        <ThreeFormsBeat />
      </Sprite>

      <Sprite start={29.11} end={38.86}>
        <GrowingHeatBeat />
      </Sprite>

      <Sprite start={38.86} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Charges streaming through a resistor + growing heat glow ─────
// Genuine motion: charge dots travel around the loop on a continuous path,
// dimming as they cross the resistor (energy given up). A heat-glow halo
// around the resistor brightens linearly with elapsed time, expressing the
// energy accumulating in the lattice.
function ChargesThroughResistorBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 620,
        srcX: 130, srcY: 280, srcGap: 22,
        loopTopY: 160, loopBotY: 440,
        resX: 240, resY: 160, resW: 220, resAmp: 22,
        formulaY: 310, fontFormula: 26,
        captionY: 540, fontCaption: 13 }
    : { vbW: 1000, vbH: 440,
        srcX: 180, srcY: 240, srcGap: 22,
        loopTopY: 130, loopBotY: 360,
        resX: 360, resY: 130, resW: 380, resAmp: 22,
        formulaY: 250, fontFormula: 28,
        captionY: 410, fontCaption: 14 };

  // Resistor zigzag: 6 humps along loopTopY.
  const Z = 6;
  const zigStartX = G.resX, zigEndX = G.resX + G.resW;
  const zigDx = (zigEndX - zigStartX) / (Z * 2);
  const zigPts = [`M ${zigStartX} ${G.loopTopY}`];
  for (let k = 1; k <= Z * 2; k++) {
    const x = zigStartX + k * zigDx;
    const y = G.loopTopY + (k % 2 === 1 ? -G.resAmp : G.resAmp);
    zigPts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  zigPts.push(`L ${zigEndX} ${G.loopTopY}`);
  const resD = zigPts.join(' ');

  // Wires:  src(+) → up → loopTopY → zigStartX  ;  zigEndX → right end → down → loopBotY → src(−)
  const wireTopLeftD = `M ${G.srcX + G.srcGap} ${G.srcY - 10} L ${G.srcX + G.srcGap} ${G.loopTopY} L ${zigStartX} ${G.loopTopY}`;
  const wireTopRightD = `M ${zigEndX} ${G.loopTopY} L ${zigEndX + 40} ${G.loopTopY} L ${zigEndX + 40} ${G.loopBotY}`;
  const wireBotD = `M ${zigEndX + 40} ${G.loopBotY} L ${G.srcX + G.srcGap} ${G.loopBotY} L ${G.srcX + G.srcGap} ${G.srcY + 10}`;

  // Build waypoint loop for charge-dot animation.
  const wp = [
    { x: G.srcX + G.srcGap, y: G.srcY - 10 },
    { x: G.srcX + G.srcGap, y: G.loopTopY },
    { x: zigStartX, y: G.loopTopY },
    { x: zigEndX, y: G.loopTopY },              // skip zigzag detail; dots travel along its mean line
    { x: zigEndX + 40, y: G.loopTopY },
    { x: zigEndX + 40, y: G.loopBotY },
    { x: G.srcX + G.srcGap, y: G.loopBotY },
    { x: G.srcX + G.srcGap, y: G.srcY + 10 },
  ];
  const segLens = [];
  let totalLen = 0;
  for (let k = 0; k < wp.length - 1; k++) {
    const dx = wp[k + 1].x - wp[k].x, dy = wp[k + 1].y - wp[k].y;
    const L = Math.hypot(dx, dy);
    segLens.push(L); totalLen += L;
  }
  function posAt(u) {
    const target = u * totalLen;
    let acc = 0;
    for (let k = 0; k < segLens.length; k++) {
      if (acc + segLens[k] >= target) {
        const f = (target - acc) / segLens[k];
        return {
          x: wp[k].x + (wp[k + 1].x - wp[k].x) * f,
          y: wp[k].y + (wp[k + 1].y - wp[k].y) * f,
        };
      }
      acc += segLens[k];
    }
    return wp[wp.length - 1];
  }

  // Charge dots: dim brightness while inside the resistor zone (x in zigStartX..zigEndX on top wire).
  const DOTS = 9;
  const dotSpeed = 0.10; // cycles/sec
  const tElapsed = Math.max(0, localTime - 0.8);

  // Heat-glow: ramps up over time, reaches ~85% at end of beat.
  const heatStart = 1.2;
  const heatFrac = clamp((localTime - heatStart) / (spriteDur - heatStart - 0.5), 0, 0.85);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Source — battery */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.srcX - 14} y1={G.srcY - 10} x2={G.srcX + 14} y2={G.srcY - 10}
                stroke="var(--chalk-100)" strokeWidth={3} strokeLinecap="round"/>
          <line x1={G.srcX - 7}  y1={G.srcY + 10} x2={G.srcX + 7}  y2={G.srcY + 10}
                stroke="var(--chalk-100)" strokeWidth={3} strokeLinecap="round"/>
          <text x={G.srcX - 26} y={G.srcY - 4} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>V<tspan baselineShift="sub" fontSize="0.7em">s</tspan></text>
        </SvgFadeIn>

        {/* Wires */}
        <TraceIn d={wireTopLeftD} stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={0.3}/>
        <TraceIn d={wireTopRightD} stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={0.5}/>
        <TraceIn d={wireBotD} stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={0.7}/>

        {/* Heat-glow halo behind resistor */}
        <g style={{ opacity: heatFrac }}>
          {[1.0, 1.6, 2.4].map((s, i) => (
            <ellipse key={`glow-${i}`}
                     cx={(zigStartX + zigEndX) / 2}
                     cy={G.loopTopY}
                     rx={(G.resW / 2 + 12) * s}
                     ry={(G.resAmp + 10) * s}
                     fill="var(--rose-400)"
                     opacity={0.18 * (1 - i * 0.28)}/>
          ))}
        </g>

        {/* Resistor zigzag */}
        <TraceIn d={resD} stroke="var(--amber-400)" strokeWidth={2.4}
                 fill="none"
                 duration={0.8} delay={0.5}/>

        {/* "R" label below zigzag */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <text x={(zigStartX + zigEndX) / 2} y={G.loopTopY + G.resAmp + 28}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={22}>R</text>
        </SvgFadeIn>

        {/* Voltage bracket above the resistor */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <line x1={zigStartX} y1={G.loopTopY - G.resAmp - 18}
                x2={zigEndX} y2={G.loopTopY - G.resAmp - 18}
                stroke="var(--chalk-200)" strokeWidth={1.2}/>
          <line x1={zigStartX} y1={G.loopTopY - G.resAmp - 18}
                x2={zigStartX} y2={G.loopTopY - G.resAmp - 10}
                stroke="var(--chalk-200)" strokeWidth={1.4}/>
          <line x1={zigEndX} y1={G.loopTopY - G.resAmp - 18}
                x2={zigEndX} y2={G.loopTopY - G.resAmp - 10}
                stroke="var(--chalk-200)" strokeWidth={1.4}/>
          <text x={(zigStartX + zigEndX) / 2} y={G.loopTopY - G.resAmp - 26}
                textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>V</text>
        </SvgFadeIn>

        {/* Energy-per-charge formula, top-of-canvas */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            ΔE = V · q
          </text>
        </SvgFadeIn>

        {/* Charge dots — only once the wires + resistor have appeared */}
        {tElapsed > 0 && Array.from({ length: DOTS }, (_, k) => {
          const u = ((k / DOTS) + tElapsed * dotSpeed) % 1;
          const p = posAt(u);
          // Dim each dot's brightness while it's inside the resistor span on
          // the top wire. Outside that zone the dot is full-bright.
          const inResistor = p.y === G.loopTopY && p.x >= zigStartX && p.x <= zigEndX;
          // Brightness drops smoothly across the resistor zone — entry to exit.
          let brightness = 1.0;
          if (inResistor) {
            const f = (p.x - zigStartX) / (zigEndX - zigStartX);
            brightness = 1.0 - 0.65 * f;
          } else if (p.y === G.loopBotY) {
            brightness = 0.35;  // returning to source, already cooled
          }
          return (
            <circle key={`dot-${k}`}
                    cx={p.x} cy={p.y} r={3.4}
                    fill="var(--rose-400)" opacity={brightness}/>
          );
        })}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            every charge that crosses leaves a little heat behind
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Three forms ─────────────────────────────────────────────────
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
      gap: portrait ? 26 : 32,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        three equivalent forms · power
      </FadeUp>

      {portrait ? (
        <div style={{ display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 22 }}>
          <Cell delay={0.3} color="var(--chalk-200)">P = V · I</Cell>
          <Cell delay={1.6} big color="var(--amber-300)">P = I² · R</Cell>
          <Cell delay={2.8} color="var(--chalk-200)">P = V² / R</Cell>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 70 }}>
          <Cell delay={0.3} color="var(--chalk-200)">P = V · I</Cell>
          <div style={{
            width: 1, height: 90,
            background: 'rgba(232,220,193,0.15)',
          }}/>
          <Cell delay={1.6} big color="var(--amber-300)">P = I² · R</Cell>
          <div style={{
            width: 1, height: 90,
            background: 'rgba(232,220,193,0.15)',
          }}/>
          <Cell delay={2.8} color="var(--chalk-200)">P = V² / R</Cell>
        </div>
      )}

      <FadeUp duration={0.5} delay={4.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.1em',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
        }}>
        substitute V = I R to step between the three
      </FadeUp>

      <FadeUp duration={0.5} delay={6.2} distance={10}
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

// ─── Beat 4: W = P·t ramp ────────────────────────────────────────────────
// Genuine motion: a (t, W) point slides up a linear ramp as time advances —
// the energy budget piling up, visibly. Value-driven.
function GrowingHeatBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 700, gx: 100, gy: 110, gw: 420, gh: 380,
        fontAxis: 22, fontFormula: 30 }
    : { vbW: 1100, vbH: 480, gx: 160, gy: 60, gw: 540, gh: 360,
        fontAxis: 22, fontFormula: 38 };

  const ax0 = G.gx, ay0 = G.gy + G.gh;
  const axEnd = G.gx + G.gw;
  const ayEnd = G.gy;

  // Sweep from 1.2 to 5.6 — point slides from origin to top-right.
  const SWEEP_START = 1.2;
  const SWEEP_END = 5.6;
  const sweep = clamp((localTime - SWEEP_START) / (SWEEP_END - SWEEP_START), 0, 1);

  const tFinalX = axEnd - 20;
  const wFinalY = ayEnd + 20;
  const pointX = ax0 + (tFinalX - ax0) * sweep;
  const pointY = ay0 + (wFinalY - ay0) * sweep;

  const formulaX = portrait ? G.vbW / 2 : axEnd + 130;
  const formulaY = portrait ? G.gy + G.gh + 80 : G.gy + G.gh / 2;

  // Tick marks along the time axis to make "piling up second by second" visible.
  const TICKS = 5;
  const tickXs = Array.from({ length: TICKS + 1 }, (_, k) =>
    ax0 + (tFinalX - ax0) * (k / TICKS));

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <TraceIn d={`M ${ax0} ${ayEnd} L ${ax0} ${ay0} L ${axEnd} ${ay0}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.8} delay={0.0}/>

        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={axEnd + 18} y={ay0 + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>t</text>
          <text x={ax0 - 14} y={ayEnd - 4} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>W</text>
          {tickXs.map((x, k) => (
            <line key={k} x1={x} y1={ay0} x2={x} y2={ay0 + 5}
                  stroke="var(--chalk-300)" strokeWidth={1}/>
          ))}
        </SvgFadeIn>

        {/* Ramp line traces first */}
        <TraceIn d={`M ${ax0} ${ay0} L ${tFinalX} ${wFinalY}`}
                 stroke="var(--amber-400)" strokeWidth={2.6}
                 duration={0.8} delay={0.6}/>

        {/* Slope label */}
        <SvgFadeIn duration={0.35} delay={1.4}>
          <text x={(ax0 + tFinalX) / 2 + 20} y={(ay0 + wFinalY) / 2 - 12}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            slope = P
          </text>
        </SvgFadeIn>

        {/* Moving (t, W) point + drop-line */}
        {sweep > 0.001 && (
          <g>
            <line x1={pointX} y1={pointY} x2={pointX} y2={ay0}
                  stroke="var(--rose-300)" strokeWidth={1.2}
                  strokeDasharray="3 4" opacity={0.7}/>
            <circle cx={pointX} cy={pointY} r={5}
                    fill="var(--rose-400)" stroke="var(--rose-300)" strokeWidth={1}/>
          </g>
        )}

        {/* "+1 joule" floating annotation each time the marker passes a tick */}
        {sweep > 0.1 && sweep < 0.95 && (
          <text x={pointX + 12} y={pointY - 12}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.06em"
                opacity={0.85}>
            + ΔW = P · Δt
          </text>
        )}

        {/* Final formula */}
        <SvgFadeIn duration={0.5} delay={4.4}>
          <text x={formulaX} y={formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            W = P · t
          </text>
        </SvgFadeIn>
      </svg>
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
        Electrical energy → heat. Not loss — transformation.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
        }}>
        (the same physics that boils a kettle and toasts your bread)
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
