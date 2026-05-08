// Coulomb's Law: The Inverse-Square Tug — Manimo lesson scene.
// Generated from motion/coulombs-law.spec.json. Standalone — opens the
// electromagnetism arc; sits adjacent to rc-circuit and rlc-pendulum.
//
// Beats (timed to estimated narration durations — re-run `npm run audio
// coulombs-law` when ELEVENLABS_API_KEY can reach the API to replace these
// with real audio-aligned offsets):
//    0.00– 5.16  Manimo enters; hook question
//    5.16–16.89  Two charges on a line: r between them, like-repels arrows
//   16.89–28.26  Coulomb's law payoff: F = k · q₁q₂ / r²
//   28.26–39.99  Genuine animation — sweep r, force shrinks as 1/r², graph
//                traces in sync with the moving charge
//   39.99–49.00  Takeaway — same shape as gravity but stronger and signed
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background, watermark, title block, corner Manimo.
//   • Sweep math: r(t) = lerp(rMin, rMax, ease(τ)) where τ ∈ [0,1] across the
//     visible part of beat 4. Force magnitude is derived from r in the same
//     frame, so the diagram arrow and the graph marker stay in lockstep —
//     this is the genuine value-driven motion this scene is built around.

const SCENE_DURATION = 49;

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /*  0.00– 5.16 */ 'Two charges in empty space — what does each one feel from the other?',
  /*  5.16–16.89 */ 'Place a positive charge here and another positive charge there. The line between them is the line of force. Like signs push apart; opposite signs pull together.',
  /* 16.89–28.26 */ "The strength of that push or pull follows Coulomb's law: F equals k times q one q two divided by r squared. Three knobs — the two charges and the distance.",
  /* 28.26–39.99 */ 'Watch what the inverse square does. As we slide the second charge away, the force does not just fall — it falls fast. Twice the distance, one quarter the force.',
  /* 39.99–49.00 */ "Same shape as Newton's gravity, but stronger by far — and signed. Charges can pull or push; mass only ever pulls.",
];

// HTML subscript helper. Unicode has no neat subscript-1/2 in serif italic
// at every weight, so we render via `<sub>` and tweak font size to match.
function Sub({ children }) {
  return (
    <sub style={{
      fontSize: '0.55em', verticalAlign: 'baseline',
      position: 'relative', top: '0.18em',
    }}>{children}</sub>
  );
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene 10 · electromagnetism"
      title="Coulomb's Law: The Inverse-Square Tug"
      duration={SCENE_DURATION}
    >
      <Sprite start={0} end={5.16}>
        <ManimoBubbleIntro />
      </Sprite>

      <Sprite start={5.16} end={16.89}>
        <ChargesAndLine />
      </Sprite>

      <Sprite start={16.89} end={28.26}>
        <FormulaPayoff />
      </Sprite>

      <Sprite start={28.26} end={39.99}>
        <InverseSquareSweep />
      </Sprite>

      <Sprite start={39.99} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 1: Manimo intro ─────────────────────────────────────────────────
function ManimoBubbleIntro() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '46%' : '42%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: portrait ? 'column' : 'row',
      alignItems: 'center',
      gap: portrait ? 28 : 20,
    }}>
      <svg width={portrait ? 200 : 160} height={portrait ? 200 : 160}
           viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <ManimoEnter duration={0.7} bob={true} />
      </svg>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: portrait ? 26 : 26,
          fontStyle: 'italic',
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '34ch',
          textAlign: portrait ? 'center' : 'left',
          lineHeight: 1.3,
        }}>
        Two charges, nothing else — what tugs them?
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Two charges on a line, repulsive arrows ──────────────────────
// Landscape: 880×360 viewBox, charges centred horizontally, r-bracket above,
// repulsion arrows along the line.
// Portrait: same horizontal arrangement but tighter — stacking vertically
// would lose the "line of force" metaphor that makes this beat read.
function ChargesAndLine() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 640, vbH: 380, q1Cx: 180, q2Cx: 460, cy: 170, qR: 30,
        bracketY: 120, bracketTickTop: 114, bracketTickBot: 126,
        rLabelY: 108, fLen: 60, fY: 180, fLabelOffset: 22,
        fontCharge: 18, fontR: 22, fontF: 20, fontCaption: 14,
        captionY: 320 }
    : { vbW: 880, vbH: 360, q1Cx: 320, q2Cx: 600, cy: 180, qR: 32,
        bracketY: 130, bracketTickTop: 124, bracketTickBot: 136,
        rLabelY: 116, fLen: 76, fY: 188, fLabelOffset: 26,
        fontCharge: 20, fontR: 24, fontF: 22, fontCaption: 14,
        captionY: 310 };

  const f1Tip = G.q1Cx - G.qR - G.fLen;       // left charge — arrow points left
  const f2Tip = G.q2Cx + G.qR + G.fLen;       // right charge — arrow points right

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Dashed line of force between charges */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <line x1={G.q1Cx + G.qR} y1={G.cy} x2={G.q2Cx - G.qR} y2={G.cy}
                stroke="var(--chalk-300)" strokeWidth={1.5}
                strokeDasharray="5 5"/>
        </SvgFadeIn>

        {/* r-bracket above the line */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <line x1={G.q1Cx} y1={G.bracketY} x2={G.q2Cx} y2={G.bracketY}
                stroke="var(--chalk-200)" strokeWidth={1.2}/>
          <line x1={G.q1Cx} y1={G.bracketTickTop} x2={G.q1Cx} y2={G.bracketTickBot}
                stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <line x1={G.q2Cx} y1={G.bracketTickTop} x2={G.q2Cx} y2={G.bracketTickBot}
                stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <text x={(G.q1Cx + G.q2Cx) / 2} y={G.rLabelY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontR}>r</text>
        </SvgFadeIn>

        {/* Left charge */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <circle cx={G.q1Cx} cy={G.cy} r={G.qR}
                  fill="var(--amber-400)" opacity={0.95}
                  stroke="var(--amber-300)" strokeWidth={1.5}/>
          <text x={G.q1Cx} y={G.cy + 6} textAnchor="middle"
                fill="var(--bg-canvas)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontCharge}>+q<tspan dy="3" fontSize={G.fontCharge * 0.65}>1</tspan></text>
        </SvgFadeIn>

        {/* Right charge */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <circle cx={G.q2Cx} cy={G.cy} r={G.qR}
                  fill="var(--amber-400)" opacity={0.95}
                  stroke="var(--amber-300)" strokeWidth={1.5}/>
          <text x={G.q2Cx} y={G.cy + 6} textAnchor="middle"
                fill="var(--bg-canvas)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontCharge}>+q<tspan dy="3" fontSize={G.fontCharge * 0.65}>2</tspan></text>
        </SvgFadeIn>

        {/* Repulsive force on left charge — arrow points LEFT */}
        <SvgFadeIn duration={0.45} delay={1.8}>
          <line x1={G.q1Cx - G.qR} y1={G.fY} x2={f1Tip} y2={G.fY}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          <path d={`M ${f1Tip} ${G.fY} L ${f1Tip + 10} ${G.fY - 6} L ${f1Tip + 10} ${G.fY + 6} Z`}
                fill="var(--rose-400)"/>
          <text x={f1Tip + G.fLen / 2} y={G.fY + G.fLabelOffset} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontF}>F</text>
        </SvgFadeIn>

        {/* Repulsive force on right charge — arrow points RIGHT */}
        <SvgFadeIn duration={0.45} delay={1.8}>
          <line x1={G.q2Cx + G.qR} y1={G.fY} x2={f2Tip} y2={G.fY}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          <path d={`M ${f2Tip} ${G.fY} L ${f2Tip - 10} ${G.fY - 6} L ${f2Tip - 10} ${G.fY + 6} Z`}
                fill="var(--rose-400)"/>
          <text x={f2Tip - G.fLen / 2} y={G.fY + G.fLabelOffset} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontF}>F</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            like signs repel — opposite signs would attract
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Coulomb's law payoff ─────────────────────────────────────────
function FormulaPayoff() {
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
        Coulomb's law
      </FadeUp>

      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 50 : 62, color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        F = k · q<Sub>1</Sub>q<Sub>2</Sub> / r²
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
          lineHeight: 1.45,
        }}>
        k ≈ 8.99 × 10⁹ N·m²/C²&nbsp;&nbsp;·&nbsp;&nbsp;Coulomb's constant
      </FadeUp>

      <FadeUp duration={0.5} delay={3.4} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 20, color: 'var(--chalk-200)',
          textAlign: 'center', maxWidth: portrait ? '24ch' : '46ch',
          lineHeight: 1.35, marginTop: 6,
        }}>
        double a charge → force doubles.<br/>
        double the distance → force quarters.
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Inverse-square sweep (genuine animation) ─────────────────────
// The animation budget for this scene lives here. r is swept smoothly from
// rMin to rMax across the visible part of the beat. The right charge moves
// with r, the on-charge force arrow shrinks as 1/r², and a marker on the
// F vs r graph below tracks the same (r, F) so the moving charge and the
// curve grow together in lockstep. Everything is derived from a single
// time-dependent r in this frame — no parallel state to drift.
function InverseSquareSweep() {
  const portrait = usePortrait();
  const G = portrait
    ? {
        // Diagram (top half)
        vbW: 660, vbH: 760,
        diagY: 180, q1Cx: 130, qR: 22,
        rMinPx: 100, rMaxPx: 360,
        fAtRMinPx: 90,                    // visual length when r is at minimum
        // Graph (bottom half)
        graphX0: 100, graphY0: 700, graphX1: 600, graphY1: 440,
        axisLabelFont: 13, captionY: 740, captionFont: 14,
        chargeLabelFont: 14, fontR: 18, fontF: 16,
      }
    : {
        vbW: 1100, vbH: 540,
        diagY: 130, q1Cx: 180, qR: 24,
        rMinPx: 120, rMaxPx: 700,
        fAtRMinPx: 110,
        graphX0: 180, graphY0: 470, graphX1: 1000, graphY1: 270,
        axisLabelFont: 13, captionY: 510, captionFont: 14,
        chargeLabelFont: 16, fontR: 20, fontF: 18,
      };

  const { localTime, duration: spriteDur } = useSprite();
  // Sweep envelope: 0.6s settle in, sweep across the middle ~75% of the beat,
  // hold the final value for the last beat-end so the takeaway transitions
  // cleanly. Eased so the early-fast / late-slow rate feels deliberate.
  const sweepStart = 0.8;
  const sweepEnd = spriteDur - 1.4;
  const tFrac = clamp((localTime - sweepStart) / Math.max(0.001, sweepEnd - sweepStart), 0, 1);
  const eased = Easing.easeInOutCubic(tFrac);
  const rPx = G.rMinPx + (G.rMaxPx - G.rMinPx) * eased;

  // Inverse-square force, normalised so |F| at rMinPx is fAtRMinPx pixels.
  const fLen = G.fAtRMinPx * (G.rMinPx * G.rMinPx) / (rPx * rPx);

  const q2Cx = G.q1Cx + rPx;
  const fStart = q2Cx + G.qR;
  const fTip = fStart + fLen;

  // Graph: x-axis from rMinPx to rMaxPx maps onto graphX0..graphX1.
  // y-axis: F at rMinPx (= fAtRMinPx scaled) sits at graphY0 (origin/baseline);
  // F shrinks to ≈1/16 of that at r=4·rMin → leave headroom above origin.
  const graphW = G.graphX1 - G.graphX0;
  const graphH = G.graphY0 - G.graphY1;          // positive — y grows downward
  const fMax = G.fAtRMinPx;                      // at rPx = rMinPx
  const rToGx = r => G.graphX0 + ((r - G.rMinPx) / (G.rMaxPx - G.rMinPx)) * graphW;
  const fToGy = f => G.graphY0 - (f / fMax) * graphH;

  // Pre-compute the full F(r) curve path so we can mask it by current r.
  const curveSamples = 60;
  const curvePts = [];
  for (let i = 0; i <= curveSamples; i++) {
    const r = G.rMinPx + (G.rMaxPx - G.rMinPx) * (i / curveSamples);
    const f = G.fAtRMinPx * (G.rMinPx * G.rMinPx) / (r * r);
    curvePts.push(`${i === 0 ? 'M' : 'L'} ${rToGx(r).toFixed(2)} ${fToGy(f).toFixed(2)}`);
  }
  const fullCurveD = curvePts.join(' ');

  // Marker on the curve at current (r, F)
  const markerX = rToGx(rPx);
  const markerY = fToGy(fLen);

  // Reveal the curve only up to the current r — clip with a rectangle that
  // grows with the swept charge.
  const clipW = Math.max(0, markerX - G.graphX0);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* ── Top: diagram ────────────────────────────────────────────── */}
        {/* Anchored left charge */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <circle cx={G.q1Cx} cy={G.diagY} r={G.qR}
                  fill="var(--amber-400)" opacity={0.95}
                  stroke="var(--amber-300)" strokeWidth={1.5}/>
          <text x={G.q1Cx} y={G.diagY + 5} textAnchor="middle"
                fill="var(--bg-canvas)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.chargeLabelFont}>+q<tspan dy="3" fontSize={G.chargeLabelFont * 0.65}>1</tspan></text>
        </SvgFadeIn>

        {/* Dashed reference line spanning the full sweep range */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.q1Cx + G.qR} y1={G.diagY}
                x2={G.q1Cx + G.rMaxPx + G.qR} y2={G.diagY}
                stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="4 6" opacity={0.7}/>
        </SvgFadeIn>

        {/* Sweeping right charge */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <circle cx={q2Cx} cy={G.diagY} r={G.qR}
                  fill="var(--amber-400)" opacity={0.95}
                  stroke="var(--amber-300)" strokeWidth={1.5}/>
          <text x={q2Cx} y={G.diagY + 5} textAnchor="middle"
                fill="var(--bg-canvas)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.chargeLabelFont}>+q<tspan dy="3" fontSize={G.chargeLabelFont * 0.65}>2</tspan></text>
        </SvgFadeIn>

        {/* r bracket — tracks the sweeping charge */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={G.q1Cx} y1={G.diagY - 50} x2={q2Cx} y2={G.diagY - 50}
                stroke="var(--chalk-200)" strokeWidth={1.2}/>
          <line x1={G.q1Cx} y1={G.diagY - 56} x2={G.q1Cx} y2={G.diagY - 44}
                stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <line x1={q2Cx} y1={G.diagY - 56} x2={q2Cx} y2={G.diagY - 44}
                stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <text x={(G.q1Cx + q2Cx) / 2} y={G.diagY - 60} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontR}>r</text>
        </SvgFadeIn>

        {/* Force arrow on the right charge — length = fLen, pointing right */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={fStart} y1={G.diagY} x2={fTip} y2={G.diagY}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          <path d={`M ${fTip} ${G.diagY} L ${fTip - 10} ${G.diagY - 6} L ${fTip - 10} ${G.diagY + 6} Z`}
                fill="var(--rose-400)"/>
          <text x={fStart + Math.max(fLen / 2, G.qR)} y={G.diagY - 12} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontF}>F</text>
        </SvgFadeIn>

        {/* ── Bottom: F vs r graph ───────────────────────────────────── */}
        {/* Axes */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <line x1={G.graphX0} y1={G.graphY0} x2={G.graphX1} y2={G.graphY0}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <line x1={G.graphX0} y1={G.graphY0} x2={G.graphX0} y2={G.graphY1}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={G.graphX1 + 6} y={G.graphY0 + 4}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.axisLabelFont + 2}>r</text>
          <text x={G.graphX0 - 8} y={G.graphY1 - 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.axisLabelFont + 2}>F</text>
        </SvgFadeIn>

        {/* Curve, masked to the swept range */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <defs>
            <clipPath id="coulombSweepMask">
              <rect x={G.graphX0} y={G.graphY1 - 8}
                    width={clipW} height={graphH + 16}/>
            </clipPath>
          </defs>
          <path d={fullCurveD}
                fill="none" stroke="var(--rose-400)" strokeWidth={2.4}
                clipPath="url(#coulombSweepMask)"/>
        </SvgFadeIn>

        {/* Marker dot on the curve at current (r, F) */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <circle cx={markerX} cy={markerY} r={5} fill="var(--rose-300)"/>
        </SvgFadeIn>

        {/* Caption beneath the graph */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.captionFont} letterSpacing="0.02em">
            twice the distance → one quarter the force
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
function Takeaway() {
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
          fontSize: portrait ? 26 : 28,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Same shape as gravity — but stronger, and signed.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 21 : 22,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Charges push or pull. Mass only ever pulls.
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          maxWidth: portrait ? '32ch' : 'none',
        }}>
        (electricity is gravity's louder, two-faced cousin)
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f">
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
