// The CMOS Inverter: Two Transistors, Zero Static Power — Manimo lesson scene.
//
// Beats (placeholder timings — overwritten by scripts/rewire-scene.js once
// audio is generated):
//    0.00– 4.00  Manimo enters; hook caption
//    4.00–14.00  CMOS schematic: PMOS on top, NMOS on bottom, gates tied to V_in
//   14.00–30.00  V_in sweep — channels open/close, V_out flips, conducting path lights
//   30.00–41.00  Transfer curve traces in, midpoint marker, V_out = ¬V_in
//   41.00–50.00  Takeaway
//
// Authoring notes:
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background/title/corner Manimo.

const SCENE_DURATION = 55;

const NARRATION = [
  /*  0.00– 6.86 */ 'Stack an N type and a P type MOSFET — and you get a logic gate that wastes almost no power at rest.',
  /*  6.86–16.03 */ 'V D D on top, ground on the bottom. The P type sits up high, the N type down low, and both gates are wired to the same input.',
  /* 16.03–29.61 */ 'Drop V in to ground — the P type turns on, the N type turns off, and V out is pulled up to V D D. Push V in to V D D and the opposite happens; V out drops to ground.',
  /* 29.61–42.21 */ 'Plot V out against V in and you get the transfer curve — flat at V D D, a sharp drop at the midpoint, then flat at zero. That sharpness is what makes the gate a clean digital element.',
  /* 42.21–55.00 */ 'Only one transistor conducts at any settled input. No path from V D D to ground means almost no static current — that is why CMOS logic dominates.',
];

const NARRATION_AUDIO = 'audio/cmos-inverter/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="transistors"
      title="The CMOS Inverter"
      duration={SCENE_DURATION}
      introEnd={6.86}
      introCaption="One P-type on top, one N-type below — meet the CMOS inverter."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.86} end={16.03}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={16.03} end={29.61}>
        <SwitchActionBeat />
      </Sprite>

      <Sprite start={29.61} end={42.21}>
        <TransferCurveBeat />
      </Sprite>

      <Sprite start={42.21} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared geometry helper ───────────────────────────────────────────────
// Both CircuitBeat and SwitchActionBeat want the same schematic, so the
// coordinates live in one place. Returns the layout dictionary for the
// current aspect.
function inverterGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 640,
        // Vertical rails: VDD at top, GND at bottom; output node in middle.
        railLeftX: 220, vddY: 100, gndY: 540,
        // Transistor body: square outline with gate bar on the left.
        pCx: 360, pCy: 220, nCx: 360, nCy: 420, tBodyW: 56, tBodyH: 56,
        // Gate input lead extends to the left.
        gateLeadX: 160,
        // V_out tap extends to the right.
        outTapX: 460,
        fontLabel: 16, fontTick: 12 }
    : { vbW: 700, vbH: 460,
        railLeftX: 250, vddY: 70, gndY: 390,
        pCx: 400, pCy: 170, nCx: 400, nCy: 290, tBodyW: 64, tBodyH: 56,
        gateLeadX: 180,
        outTapX: 520,
        fontLabel: 18, fontTick: 13 };
}

// MOSFET symbol renderer. `on` controls channel fill opacity.
function Mosfet({ cx, cy, w, h, type, on = false, color = 'var(--chalk-200)' }) {
  // Body is a rectangle representing channel + drain/source pads.
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h / 2;
  const bot = cy + h / 2;
  // Gate bar sits a few px left of the body, with a short connector.
  const gateBarX = left - 12;
  const channelOpacity = on ? 0.85 : 0.18;
  const channelFill = type === 'p' ? 'var(--rose-400)' : 'var(--amber-300)';

  return (
    <g>
      {/* Drain rail stub (top) */}
      <line x1={cx} y1={top - 18} x2={cx} y2={top} stroke="var(--chalk-200)" strokeWidth={1.6}/>
      {/* Source rail stub (bottom) */}
      <line x1={cx} y1={bot} x2={cx} y2={bot + 18} stroke="var(--chalk-200)" strokeWidth={1.6}/>
      {/* Channel rectangle */}
      <rect x={left} y={top} width={w} height={h} rx={4}
            fill={channelFill} opacity={channelOpacity}
            stroke={color} strokeWidth={1.6}/>
      {/* Gate bar + connector */}
      <line x1={gateBarX} y1={top + 8} x2={gateBarX} y2={bot - 8}
            stroke={color} strokeWidth={2}/>
      <line x1={gateBarX} y1={cy} x2={left} y2={cy}
            stroke={color} strokeWidth={1.4}/>
      {/* P-type bubble at gate (small circle indicating inversion) */}
      {type === 'p' && (
        <circle cx={gateBarX - 5} cy={cy} r={3.5} fill="none"
                stroke={color} strokeWidth={1.4}/>
      )}
      {/* Source arrow indicator — small triangle on the source side */}
      {type === 'n' && (
        <path d={`M ${cx} ${bot - 2} L ${cx - 4} ${bot - 9} L ${cx + 4} ${bot - 9} Z`}
              fill={color}/>
      )}
      {type === 'p' && (
        <path d={`M ${cx} ${top + 2} L ${cx - 4} ${top + 9} L ${cx + 4} ${top + 9} Z`}
              fill={color}/>
      )}
    </g>
  );
}

// Render a complete CMOS schematic at a given (vIn, vOut) display state.
// `current` controls whether the conducting branch is highlighted.
function InverterSchematic({ G, vInLevel, vOutLevel, highlight = false, showValues = true }) {
  // vInLevel: 0..1. vOutLevel: 0..1 (the value to *show* — caller computes).
  // PMOS conducts when V_in is low; NMOS conducts when V_in is high.
  const pOn = vInLevel < 0.5;
  const nOn = vInLevel > 0.5;

  // Wire from output node to V_out tap.
  const outNodeY = (G.pCy + G.nCy) / 2;

  // Highlight stroke for conducting branch.
  const condColor = 'var(--amber-300)';
  const dimColor = 'var(--chalk-300)';
  const topBranchColor = highlight && pOn ? condColor : dimColor;
  const botBranchColor = highlight && nOn ? condColor : dimColor;

  return (
    <g>
      {/* VDD rail */}
      <line x1={G.railLeftX} y1={G.vddY} x2={G.outTapX + 40} y2={G.vddY}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      {/* GND rail */}
      <line x1={G.railLeftX} y1={G.gndY} x2={G.outTapX + 40} y2={G.gndY}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      {/* V_DD label */}
      <text x={G.outTapX + 48} y={G.vddY + 5}
            fill="var(--amber-300)" fontFamily="var(--font-mono)" fontSize={G.fontLabel}>
        V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.7}>DD</tspan>
      </text>
      <text x={G.outTapX + 48} y={G.gndY + 5}
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontLabel}>
        GND
      </text>

      {/* Wire from VDD to PMOS drain (above pCy - h/2 - 18) */}
      <line x1={G.pCx} y1={G.vddY} x2={G.pCx} y2={G.pCy - G.tBodyH / 2 - 18}
            stroke={topBranchColor} strokeWidth={highlight && pOn ? 2.6 : 1.8}/>
      {/* Wire from NMOS source to GND */}
      <line x1={G.nCx} y1={G.nCy + G.tBodyH / 2 + 18} x2={G.nCx} y2={G.gndY}
            stroke={botBranchColor} strokeWidth={highlight && nOn ? 2.6 : 1.8}/>
      {/* Wire between PMOS source (bottom) and NMOS drain (top) — the output node */}
      <line x1={G.pCx} y1={G.pCy + G.tBodyH / 2 + 18} x2={G.nCx} y2={G.nCy - G.tBodyH / 2 - 18}
            stroke="var(--amber-400)" strokeWidth={2.2}/>
      {/* V_out tap (horizontal lead) */}
      <line x1={G.pCx} y1={outNodeY} x2={G.outTapX} y2={outNodeY}
            stroke="var(--amber-400)" strokeWidth={2}/>
      {/* Output node dot */}
      <circle cx={G.pCx} cy={outNodeY} r={3.5} fill="var(--amber-400)"/>

      {/* MOSFETs */}
      <Mosfet cx={G.pCx} cy={G.pCy} w={G.tBodyW} h={G.tBodyH} type="p" on={pOn}
              color={topBranchColor}/>
      <Mosfet cx={G.nCx} cy={G.nCy} w={G.tBodyW} h={G.tBodyH} type="n" on={nOn}
              color={botBranchColor}/>

      {/* Labels: P-type, N-type next to bodies */}
      <text x={G.pCx + G.tBodyW / 2 + 14} y={G.pCy + 4}
            fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={G.fontLabel - 2}>
        P
      </text>
      <text x={G.nCx + G.tBodyW / 2 + 14} y={G.nCy + 4}
            fill="var(--amber-300)" fontFamily="var(--font-mono)" fontSize={G.fontLabel - 2}>
        N
      </text>

      {/* V_in incoming wire from outside, then vertical bus up to PMOS gate
          and down to NMOS gate, then short stubs to each transistor's gate bar. */}
      <line x1={40} y1={(G.pCy + G.nCy) / 2} x2={G.gateLeadX} y2={(G.pCy + G.nCy) / 2}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={G.gateLeadX} y1={G.pCy} x2={G.gateLeadX} y2={G.nCy}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      {/* Tie-dot at the input junction */}
      <circle cx={G.gateLeadX} cy={(G.pCy + G.nCy) / 2} r={3} fill="var(--chalk-200)"/>
      {/* Horizontal stubs from the bus to each MOSFET gate bar */}
      <line x1={G.gateLeadX} y1={G.pCy} x2={G.pCx - G.tBodyW / 2 - 12} y2={G.pCy}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={G.gateLeadX} y1={G.nCy} x2={G.nCx - G.tBodyW / 2 - 12} y2={G.nCy}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      {/* V_in label */}
      <text x={32} y={(G.pCy + G.nCy) / 2 - 8}
            fill="var(--amber-300)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={G.fontLabel}>
        V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.7}>in</tspan>
      </text>
      {/* V_out label */}
      <text x={G.outTapX + 6} y={outNodeY - 8}
            fill="var(--amber-300)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={G.fontLabel}>
        V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.7}>out</tspan>
      </text>

      {/* Live numeric readouts of V_in and V_out */}
      {showValues && (
        <g>
          <text x={32} y={(G.pCy + G.nCy) / 2 + 22}
                fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={G.fontTick + 1}>
            {(vInLevel).toFixed(2)}·V<tspan baselineShift="sub" fontSize={G.fontTick * 0.7}>DD</tspan>
          </text>
          <text x={G.outTapX + 6} y={outNodeY + 18}
                fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={G.fontTick + 1}>
            {(vOutLevel).toFixed(2)}·V<tspan baselineShift="sub" fontSize={G.fontTick * 0.7}>DD</tspan>
          </text>
        </g>
      )}
    </g>
  );
}

// ─── Beat 2: Static schematic introduction ────────────────────────────────
function CircuitBeat() {
  const portrait = usePortrait();
  const G = inverterGeometry(portrait);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.6} delay={0.3}>
          <InverterSchematic G={G} vInLevel={0.5} vOutLevel={0.5}
                              highlight={false} showValues={false}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={7.5}>
          <text x={G.vbW / 2} y={G.vbH - 16} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            gates tied — same V_in drives both transistors
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: V_in sweep — channels open/close, V_out flips ────────────────
function SwitchActionBeat() {
  const portrait = usePortrait();
  const G = inverterGeometry(portrait);
  const { localTime } = useSprite();

  // Sweep schedule (localTime):
  //   0.0..1.0  schematic fades in with V_in = 0  (V_out = 1)
  //   1.0..5.0  V_in ramps 0 → 1                  (V_out flips at ~0.5)
  //   5.0..7.0  hold at V_in = 1                  (V_out = 0)
  //   7.0..11.0 V_in ramps 1 → 0
  //   11.0..end hold at V_in = 0                  (V_out = 1)
  let vIn;
  if (localTime < 1.0) vIn = 0;
  else if (localTime < 5.0) vIn = (localTime - 1.0) / 4.0;
  else if (localTime < 7.0) vIn = 1;
  else if (localTime < 11.0) vIn = 1 - (localTime - 7.0) / 4.0;
  else vIn = 0;
  vIn = clamp(vIn, 0, 1);

  // V_out is a smooth-but-sharp inverse of V_in centred at V_DD/2.
  // Approximate the CMOS transfer curve with a steep logistic.
  const k = 14;
  const vOut = 1 - 1 / (1 + Math.exp(-k * (vIn - 0.5)));

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <InverterSchematic G={G} vInLevel={vIn} vOutLevel={vOut} highlight={true} showValues={true}/>
        </SvgFadeIn>

        {/* Big input/output indicator strip across the top */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <rect x={20} y={20} width={G.vbW - 40} height={36} rx={6}
                fill="rgba(232,220,193,0.04)" stroke="rgba(232,220,193,0.18)" strokeWidth={1}/>
          <text x={36} y={44} fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={14}>
            V<tspan baselineShift="sub" fontSize={10}>in</tspan> ={' '}
            <tspan fill={vIn > 0.5 ? 'var(--amber-300)' : 'var(--chalk-100)'}>
              {vIn > 0.5 ? '1' : '0'}
            </tspan>
          </text>
          <text x={G.vbW - 36} y={44} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={14}>
            V<tspan baselineShift="sub" fontSize={10}>out</tspan> ={' '}
            <tspan fill={vOut > 0.5 ? 'var(--amber-300)' : 'var(--chalk-100)'}>
              {vOut > 0.5 ? '1' : '0'}
            </tspan>
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={13}>
          <text x={G.vbW / 2} y={G.vbH - 16} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            V_in low → V_out high   ·   V_in high → V_out low
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Transfer curve traces in ─────────────────────────────────────
function TransferCurveBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 540, vbH: 580, gx0: 90, gx1: 470, gy0: 110, gy1: 470,
        fontAxis: 14, fontTick: 12, fontFormula: 28, formulaY: 540 }
    : { vbW: 760, vbH: 460, gx0: 120, gx1: 640, gy0: 70, gy1: 360,
        fontAxis: 14, fontTick: 12, fontFormula: 30, formulaY: 430 };

  const gw = G.gx1 - G.gx0;
  const gh = G.gy1 - G.gy0;

  // Sweep curve from 0 to 1 over localTime 0.8..5.5
  const sweepStart = 0.8;
  const sweepEnd = 5.5;
  const sweepFrac = clamp((localTime - sweepStart) / (sweepEnd - sweepStart), 0, 1);

  // Sample transfer curve y = 1 − sigmoid(k(x − 0.5))
  const k = 14;
  const N = 100;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    if (f > sweepFrac) break;
    const y = 1 - 1 / (1 + Math.exp(-k * (f - 0.5)));
    pts.push(`${G.gx0 + f * gw},${G.gy1 - y * gh}`);
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Axes */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <line x1={G.gx0} y1={G.gy1} x2={G.gx1} y2={G.gy1} stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <line x1={G.gx0} y1={G.gy0} x2={G.gx0} y2={G.gy1} stroke="var(--chalk-300)" strokeWidth={1.5}/>
          {/* x ticks: 0, V_DD/2, V_DD */}
          <text x={G.gx0} y={G.gy1 + 22} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>0</text>
          <text x={G.gx0 + gw / 2} y={G.gy1 + 22} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>V₍DD₎/2</text>
          <text x={G.gx1} y={G.gy1 + 22} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>V₍DD₎</text>
          {/* y ticks */}
          <text x={G.gx0 - 10} y={G.gy1 + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>0</text>
          <text x={G.gx0 - 10} y={G.gy0 + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>V₍DD₎</text>
          {/* Axis labels */}
          <text x={G.gx1 + 14} y={G.gy1 + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontAxis}>
            V<tspan baselineShift="sub" fontSize={G.fontAxis * 0.7}>in</tspan>
          </text>
          <text x={G.gx0 + 6} y={G.gy0 - 14}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontAxis}>
            V<tspan baselineShift="sub" fontSize={G.fontAxis * 0.7}>out</tspan>
          </text>
        </SvgFadeIn>

        {/* Curve */}
        {pts.length > 1 && (
          <polyline points={pts.join(' ')} fill="none"
                    stroke="var(--amber-400)" strokeWidth={2.8}
                    strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Midpoint marker — V_DD/2, V_DD/2 */}
        <SvgFadeIn duration={0.4} delay={6}>
          <circle cx={G.gx0 + gw / 2} cy={G.gy1 - gh / 2} r={6}
                  fill="var(--rose-400)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
          <line x1={G.gx0 + gw / 2} y1={G.gy1 - gh / 2} x2={G.gx0 + gw / 2} y2={G.gy1}
                stroke="var(--rose-400)" strokeWidth={1.2} strokeDasharray="4 4" opacity={0.55}/>
          <line x1={G.gx0 + gw / 2} y1={G.gy1 - gh / 2} x2={G.gx0} y2={G.gy1 - gh / 2}
                stroke="var(--rose-400)" strokeWidth={1.2} strokeDasharray="4 4" opacity={0.55}/>
          <text x={G.gx0 + gw / 2 + 14} y={G.gy1 - gh / 2 - 8}
                fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>
            switching point
          </text>
        </SvgFadeIn>

        {/* Formula */}
        <SvgFadeIn duration={0.4} delay={8}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontFormula}>
            V<tspan baselineShift="sub" fontSize={G.fontFormula * 0.6}>out</tspan>
            {' '}= ¬V<tspan baselineShift="sub" fontSize={G.fontFormula * 0.6}>in</tspan>
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
          fontSize: portrait ? 26 : 32,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '44ch',
          lineHeight: 1.3,
        }}>
        One conducts, one cuts off — no idle current path.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
        }}>
        (why CMOS won the battery-life war)
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

// ─── Mount ───────────────────────────────────────────────────────────────
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
