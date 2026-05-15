// Kirchhoff's Current Law: Why a Node Adds to Zero — Manimo lesson scene.
// T-junction node with one inflow (I_1 = 5 A from above) and two outflows
// (I_2 = 3 A to the right, I_3 = 2 A to the left). Genuine animation lives
// in Beat 3: charge dots stream along all three wires at rates proportional
// to the labelled currents, splitting at the node with a running balance
// readout that never strays from zero.
//
// Beats (timed to single-track narration in motion/ade/audio/kirchhoff-current-law/):
//    0.00– 4.26  Manimo intro: where does all the charge go?
//    4.26–12.37  Node setup: T-junction with current arrows and amperage tags
//   12.37–21.97  Charge-dot animation: dots flow in, split, leave; live balance = 0
//   21.97–30.70  Formula reveal: ∑ I_in = ∑ I_out; 5 = 3 + 2
//   30.70–38.00  Takeaway: a node is a wire, not a bucket
//
// Authoring notes:
//   • Beat 3 dots use useSprite()'s localTime: each branch spawns a fresh
//     dot every 1/rate seconds and walks it from its source to the node
//     (inflow) or from the node out (outflows). The number of dots in
//     flight is independent of the rate so the visual feel stays even.
//   • Portrait branch rotates labels and shrinks the diagram to fit a
//     720-wide canvas while keeping every reading legible.

const SCENE_DURATION = 38;

const NARRATION = [
  /*  0.00– 4.26 */ "Three wires meet at a single point — where does all the charge go?",
  /*  4.26–12.37 */ "Here's a node: one wire bringing five amps in, two wires carrying current out — three amps one way, two the other.",
  /* 12.37–21.97 */ "Watch the charge dots stream in from the top. Five dots arrive every second. Three peel off to the right, two go left. Nothing piles up.",
  /* 21.97–30.70 */ "Sum of currents in equals sum of currents out, at every node. Five equals three plus two. That's Kirchhoff's current law.",
  /* 30.70–38.00 */ "It's just charge conservation: a node is a wire, not a bucket — what arrives must leave.",
];

const NARRATION_AUDIO = 'audio/kirchhoff-current-law/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit analysis"
      title="Kirchhoff's Current Law: Why a Node Adds to Zero"
      duration={SCENE_DURATION}
      introEnd={4.26}
      introCaption="Three wires meet — where does the charge go?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.26} end={12.37}>
        <NodeSetupBeat />
      </Sprite>

      <Sprite start={12.37} end={21.97}>
        <ChargesBeat />
      </Sprite>

      <Sprite start={21.97} end={30.70}>
        <KclFormulaBeat />
      </Sprite>

      <Sprite start={30.70} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared geometry ────────────────────────────────────────────────────
// Returns the coordinates of the T-junction node, the three branch
// endpoints, and the directions/lengths needed for both visual passes.
function nodeGeometry(portrait) {
  if (portrait) {
    return {
      vbW: 600, vbH: 520,
      nodeX: 300, nodeY: 290,
      topX: 300, topY: 90,      // inflow source
      rightX: 540, rightY: 290, // right outflow sink
      leftX: 60, leftY: 290,    // left outflow sink
      arrowSize: 9, dotR: 5.5,
      labelFont: 18, valueFont: 16,
      readFont: 22, readLabelFont: 11,
      captionY: 480,
    };
  }
  return {
    vbW: 880, vbH: 400,
    nodeX: 440, nodeY: 230,
    topX: 440, topY: 50,
    rightX: 800, rightY: 230,
    leftX: 80, leftY: 230,
    arrowSize: 10, dotR: 6,
    labelFont: 20, valueFont: 16,
    readFont: 26, readLabelFont: 11,
    captionY: 372,
  };
}

// Arrow on a wire, drawn at (x, y) pointing in direction (dx, dy) — a unit
// vector. Triangle of half-width `s` sits on the centre point.
function WireArrow({ x, y, dx, dy, s = 10, color = 'var(--amber-400)' }) {
  // Perpendicular unit vector for the base of the triangle.
  const px = -dy, py = dx;
  const tipX = x + dx * s, tipY = y + dy * s;
  const baseX = x - dx * s, baseY = y - dy * s;
  const ax = baseX + px * s * 0.7, ay = baseY + py * s * 0.7;
  const bx = baseX - px * s * 0.7, by = baseY - py * s * 0.7;
  return (
    <polygon points={`${tipX},${tipY} ${ax},${ay} ${bx},${by}`}
             fill={color}/>
  );
}

// ─── Beat 2: Node setup ─────────────────────────────────────────────────
function NodeSetupBeat() {
  const portrait = usePortrait();
  const G = nodeGeometry(portrait);

  // Arrow placement: midway along each wire.
  const topMidY = (G.topY + G.nodeY) / 2;
  const rightMidX = (G.nodeX + G.rightX) / 2;
  const leftMidX = (G.nodeX + G.leftX) / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Wires */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          {/* Inflow: top */}
          <line x1={G.topX} y1={G.topY} x2={G.nodeX} y2={G.nodeY}
                stroke="var(--chalk-200)" strokeWidth={2.4}/>
          {/* Right outflow */}
          <line x1={G.nodeX} y1={G.nodeY} x2={G.rightX} y2={G.rightY}
                stroke="var(--chalk-200)" strokeWidth={2.4}/>
          {/* Left outflow */}
          <line x1={G.nodeX} y1={G.nodeY} x2={G.leftX} y2={G.leftY}
                stroke="var(--chalk-200)" strokeWidth={2.4}/>
        </SvgFadeIn>

        {/* Junction dot */}
        <SvgFadeIn duration={0.35} delay={0.3}>
          <circle cx={G.nodeX} cy={G.nodeY} r={8}
                  fill="var(--amber-400)"
                  stroke="var(--amber-300)" strokeWidth={1.6}/>
        </SvgFadeIn>

        {/* Direction arrows */}
        <SvgFadeIn duration={0.35} delay={0.6}>
          <WireArrow x={G.topX} y={topMidY} dx={0} dy={1}
                     s={G.arrowSize} color="var(--amber-400)"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={1.0}>
          <WireArrow x={rightMidX} y={G.rightY} dx={1} dy={0}
                     s={G.arrowSize} color="var(--rose-400)"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={1.4}>
          <WireArrow x={leftMidX} y={G.leftY} dx={-1} dy={0}
                     s={G.arrowSize} color="var(--rose-400)"/>
        </SvgFadeIn>

        {/* Amperage tags */}
        <SvgFadeIn duration={0.35} delay={1.8}>
          <text x={G.topX + 22} y={topMidY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.labelFont}>
            I<tspan baselineShift="sub" fontSize={G.labelFont * 0.65}>1</tspan>
          </text>
          <text x={G.topX + 22} y={topMidY + 6 + G.labelFont + 2}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={G.valueFont}>5 A</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={2.1}>
          <text x={rightMidX} y={G.rightY - 22} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.labelFont}>
            I<tspan baselineShift="sub" fontSize={G.labelFont * 0.65}>2</tspan>
          </text>
          <text x={rightMidX} y={G.rightY - 22 - (G.labelFont + 2)} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={G.valueFont}>3 A</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={2.4}>
          <text x={leftMidX} y={G.leftY - 22} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.labelFont}>
            I<tspan baselineShift="sub" fontSize={G.labelFont * 0.65}>3</tspan>
          </text>
          <text x={leftMidX} y={G.leftY - 22 - (G.labelFont + 2)} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={G.valueFont}>2 A</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            one arriving, two leaving
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Charge dots + running balance ──────────────────────────────
// Three streams of dots flow simultaneously:
//   stream A (inflow, 5 dots/s) walks from topY → nodeY along the top wire
//   stream B (outflow, 3 dots/s) walks from nodeY → rightY along right wire
//   stream C (outflow, 2 dots/s) walks from nodeY → leftY along left wire
// Each dot has a fixed travel time (perWireT) and is generated on a
// modular schedule, so the dot count in flight is constant. We don't try
// to model "dots split off the inflow" — visually three independent
// streams sourced at the node makes the conservation point cleaner.
function ChargesBeat() {
  const portrait = usePortrait();
  const G = nodeGeometry(portrait);
  const { localTime } = useSprite();

  // Hold before dots begin moving (lets the eye land on the diagram).
  const HOLD = 0.6;
  const t = Math.max(0, localTime - HOLD);

  // Travel time per wire — same on all three so visual speed reads the same.
  const perWireT = 1.6;

  // Rates: in dots/sec. Aspect ratio of rates matches the labelled currents.
  const rates = { in: 5, right: 3, left: 2 };

  // Build the dot list for one stream by sampling integer offsets.
  // Each offset k corresponds to a dot born at t = k/rate; if its phase
  // (within perWireT) is in [0,1], it's currently on the wire.
  function streamDots(rate, fromX, fromY, toX, toY) {
    const dots = [];
    const period = 1 / rate;
    // How many dots are in flight at once: ceil(perWireT / period) = perWireT * rate.
    const inFlight = Math.ceil(perWireT * rate) + 1;
    // The most recently born dot — index k such that k * period ≤ t.
    const kLatest = Math.floor(t / period);
    for (let i = 0; i < inFlight; i++) {
      const k = kLatest - i;
      if (k < 0) continue;
      const age = t - k * period;
      if (age < 0 || age > perWireT) continue;
      const f = age / perWireT;
      const x = fromX + (toX - fromX) * f;
      const y = fromY + (toY - fromY) * f;
      dots.push({ x, y, fade: 1 - Math.abs(0.5 - f) * 0.2 });
    }
    return dots;
  }

  const inflow = streamDots(rates.in, G.topX, G.topY, G.nodeX, G.nodeY);
  const right = streamDots(rates.right, G.nodeX, G.nodeY, G.rightX, G.rightY);
  const left = streamDots(rates.left, G.nodeX, G.nodeY, G.leftX, G.leftY);

  // Live count panels: simple integer rates so the numbers are stable.
  // After HOLD seconds the counts are at full value.
  const showCounts = localTime > HOLD + 0.5;

  // Balance readout fades in midway.
  const showBalance = localTime > HOLD + 5.5;

  const topMidY = (G.topY + G.nodeY) / 2;
  const rightMidX = (G.nodeX + G.rightX) / 2;
  const leftMidX = (G.nodeX + G.leftX) / 2;

  // Panel positions: top-right in landscape, top-corner stack in portrait.
  const panelX = portrait ? G.vbW - 110 : G.vbW - 130;
  const panelInY = portrait ? 28 : 30;
  const panelOutY = portrait ? 76 : 82;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Wires — re-drawn from Beat 2, no fade so they're already present */}
        <g opacity={0.9}>
          <line x1={G.topX} y1={G.topY} x2={G.nodeX} y2={G.nodeY}
                stroke="var(--chalk-200)" strokeWidth={2.4}/>
          <line x1={G.nodeX} y1={G.nodeY} x2={G.rightX} y2={G.rightY}
                stroke="var(--chalk-200)" strokeWidth={2.4}/>
          <line x1={G.nodeX} y1={G.nodeY} x2={G.leftX} y2={G.leftY}
                stroke="var(--chalk-200)" strokeWidth={2.4}/>
          <circle cx={G.nodeX} cy={G.nodeY} r={8}
                  fill="var(--amber-400)"
                  stroke="var(--amber-300)" strokeWidth={1.6}/>
          {/* Faint direction arrows kept visible from beat 2 */}
          <g opacity={0.5}>
            <WireArrow x={G.topX} y={topMidY} dx={0} dy={1}
                       s={G.arrowSize} color="var(--amber-400)"/>
            <WireArrow x={rightMidX} y={G.rightY} dx={1} dy={0}
                       s={G.arrowSize} color="var(--rose-400)"/>
            <WireArrow x={leftMidX} y={G.leftY} dx={-1} dy={0}
                       s={G.arrowSize} color="var(--rose-400)"/>
          </g>
        </g>

        {/* Charge dots — inflow is amber, outflows are rose */}
        {inflow.map((d, i) => (
          <circle key={`i${i}`} cx={d.x} cy={d.y} r={G.dotR}
                  fill="var(--amber-300)" opacity={d.fade}/>
        ))}
        {right.map((d, i) => (
          <circle key={`r${i}`} cx={d.x} cy={d.y} r={G.dotR}
                  fill="var(--rose-300)" opacity={d.fade}/>
        ))}
        {left.map((d, i) => (
          <circle key={`l${i}`} cx={d.x} cy={d.y} r={G.dotR}
                  fill="var(--rose-300)" opacity={d.fade}/>
        ))}

        {/* Live count panels */}
        {showCounts && (
          <g>
            <text x={panelX} y={panelInY}
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={G.readLabelFont} letterSpacing="0.16em">IN</text>
            <text x={panelX + 32} y={panelInY}
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={G.readFont * 0.72} fontWeight="bold">5 A</text>
            <text x={panelX} y={panelOutY}
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={G.readLabelFont} letterSpacing="0.16em">OUT</text>
            <text x={panelX + 32} y={panelOutY}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={G.readFont * 0.72} fontWeight="bold">5 A</text>
          </g>
        )}

        {/* Centre balance readout — fades in once the streams are established */}
        {showBalance && (
          <SvgFadeIn duration={0.6} delay={0}>
            <text x={G.nodeX} y={G.nodeY + (portrait ? 100 : 90)} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={G.readLabelFont} letterSpacing="0.16em">BALANCE</text>
            <text x={G.nodeX} y={G.nodeY + (portrait ? 100 : 90) + G.readFont}
                  textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={G.readFont} fontWeight="bold">
              5 − 3 − 2 = 0
            </text>
          </SvgFadeIn>
        )}

        {/* Caption — appears late */}
        {localTime > HOLD + 9 && (
          <SvgFadeIn duration={0.4} delay={0}>
            <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                  fontSize={14} letterSpacing="0.02em">
              the node has no room to store charge
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 4: KCL formula reveal ─────────────────────────────────────────
function KclFormulaBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        Kirchhoff's current law
      </FadeUp>

      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 44 : 56,
          color: 'var(--amber-300)', letterSpacing: '0.02em',
          lineHeight: 1.1, textAlign: 'center',
        }}>
        ∑ I<sub style={{ fontSize: '0.55em' }}>in</sub> = ∑ I<sub style={{ fontSize: '0.55em' }}>out</sub>
      </FadeUp>

      <FadeUp duration={0.4} delay={0.9} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
          marginTop: -8,
        }}>
        at every node
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 26,
          color: 'var(--chalk-100)', letterSpacing: '0.04em',
          marginTop: 4,
        }}>
        5 = 3 + 2
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '32ch' : '46ch', lineHeight: 1.45,
          marginTop: 4,
        }}>
        charge in equals charge out — no piling up, no leaking away
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ───────────────────────────────────────────────────
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
          fontSize: portrait ? 28 : 32,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch', lineHeight: 1.3,
        }}>
        A node is a wire, not a bucket.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
          textTransform: 'uppercase',
        }}>
        the foundation of nodal analysis
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
