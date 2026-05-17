// SR Latch: Two NOR Gates Remember a Bit — Manimo lesson scene.
// Two NOR gates with their outputs cross-wired into the other gate's
// second input form a bistable element. S=1, R=0 → Q latches to 1.
// S=0, R=1 → Q latches to 0. S=R=0 → Q holds. (S=R=1 is the forbidden
// state — we acknowledge it in the timing diagram caption but do not
// dwell on it.) Genuine motion lives in Beat 3 (a propagation pulse
// travels from S into the top NOR, then along the feedback wire to the
// bottom NOR, settling Q), Beat 4 (mirror for reset), and Beat 5 (a
// time cursor sweeps a timing diagram with S, R, Q rows).
//
// Beats (timed to single-track narration in motion/ade/audio/sr-latch/):
//    0.00– 5.00  Manimo intro + hook caption
//    5.00–14.00  Structure — two cross-coupled NOR gates with S, R, Q, Q̄
//   14.00–23.00  Set: S=1 → Q̄=0 → bottom NOR sees 0,0 → Q=1
//   23.00–32.00  Reset: R=1 → Q=0 → top NOR sees 0,0 → Q̄=1
//   32.00–44.00  Timing diagram — S, R, Q rows with Q latching
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • A NOR gate uses the standard OR-shape with a bubble. NORShape()
//     exposes the input pin and output pin coordinates so wires snap
//     cleanly across beats.
//   • Beat 3 / Beat 4 use useSprite() localTime to time a "pulse" that
//     travels along three legs: input wire → gate body glow → output
//     wire → feedback to the second gate.

const SCENE_DURATION = 57;

const NARRATION = [
  /*  0.00– 5.00 */ "Two gates with their outputs wired into each other's inputs. That's a memory cell — but how?",
  /*  5.00–14.00 */ "Here's the SR latch: two NOR gates cross-coupled. S sets the latch, R resets it, and Q and Q-bar are the outputs — wired back into each other's inputs.",
  /* 14.00–23.00 */ "Raise S to one and the top NOR sees a one — its output Q-bar goes to zero. That zero feeds the bottom NOR with R also zero — bottom output Q swings to one. Q is set.",
  /* 23.00–32.00 */ "Now drop S and raise R to one. The bottom NOR sees a one, so Q goes to zero. That zero feeds the top NOR with S also zero — Q-bar swings to one. Q is reset.",
  /* 32.00–44.00 */ "And when both S and R are zero, the loop holds whatever Q already was. Pulse S, pulse R, and you can see Q latch high and stay there until R clears it.",
];

const NARRATION_AUDIO = 'audio/sr-latch/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="memory cells"
      title="SR Latch: Two NOR Gates Remember a Bit"
      duration={SCENE_DURATION}
      introEnd={6.44}
      introCaption="Two NOR gates, cross-coupled — that's one bit of memory."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.44} end={17.84}>
        <StructureBeat />
      </Sprite>

      <Sprite start={17.84} end={32.29}>
        <SetBeat />
      </Sprite>

      <Sprite start={32.29} end={45.16}>
        <ResetBeat />
      </Sprite>

      <Sprite start={45.16} end={SCENE_DURATION}>
        <TimingBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── NOR gate symbol ─────────────────────────────────────────────────────
// Standard OR-gate body (back curve + two angled flanks meeting at the
// tip) followed by a small bubble on the output. Drawn inside a local
// frame centred at (cx, cy), with body width w. Returns nothing visible
// for input/output pins — the caller wires them by reading the helper
// pinCoords() values.
function NORShape({ cx, cy, w = 100, color = 'var(--amber-400)' }) {
  const h = w * 0.78;
  const left = cx - w / 2;
  const right = cx + w / 2 - 8;   // body tip, before the bubble
  const top = cy - h / 2;
  const bot = cy + h / 2;
  // OR-gate body: back curve (control point pulls slightly inward) +
  // two flanks meeting at the tip just to the left of the bubble.
  const bodyD =
    `M ${left} ${top}` +
    ` Q ${left + 22} ${cy} ${left} ${bot}` +
    ` Q ${cx - 10} ${bot} ${right} ${cy}` +
    ` Q ${cx - 10} ${top} ${left} ${top} Z`;
  return (
    <g>
      <path d={bodyD} fill="none" stroke={color} strokeWidth={2.4}/>
      {/* output bubble (the "N" in NOR) */}
      <circle cx={right + 6} cy={cy} r={5} fill="none" stroke={color} strokeWidth={2}/>
    </g>
  );
}

function pinCoords(cx, cy, w = 100) {
  const h = w * 0.78;
  return {
    in1x: cx - w / 2 + 6, in1y: cy - h * 0.25,
    in2x: cx - w / 2 + 6, in2y: cy + h * 0.25,
    outx: cx + w / 2 + 4, outy: cy,
  };
}

// ─── Shared latch geometry ──────────────────────────────────────────────
function latchGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 600,
        topCx: 320, topCy: 200, botCx: 320, botCy: 400, gateW: 110,
        sStubX: 130, rStubX: 130,
        outStubX: 540,
        captionY: 560, fontFormula: 22 }
    : { vbW: 1100, vbH: 480,
        topCx: 560, topCy: 170, botCx: 560, botCy: 320, gateW: 120,
        sStubX: 320, rStubX: 320,
        outStubX: 820,
        captionY: 450, fontFormula: 24 };
}

// Render the cross-coupled NOR latch. `highlight` is one of `null`,
// `'top'` (top NOR active), `'bot'` (bottom NOR active) — used in the
// set/reset beats to colour the propagation path.
function LatchDiagram({ G, beatDelay = 0, highlight = null }) {
  const tp = pinCoords(G.topCx, G.topCy, G.gateW);
  const bp = pinCoords(G.botCx, G.botCy, G.gateW);
  const topActive = highlight === 'top';
  const botActive = highlight === 'bot';

  // Feedback wire path coordinates (top output → bottom in1, bottom
  // output → top in2). The two output pins drop a stub down/up and the
  // feedback runs along the right edge.
  const feedbackRightX = G.outStubX - 30;

  return (
    <g>
      {/* Top gate */}
      <SvgFadeIn duration={0.5} delay={beatDelay + 0.0}>
        <NORShape cx={G.topCx} cy={G.topCy} w={G.gateW}
                  color={topActive ? 'var(--amber-300)' : 'var(--amber-400)'}/>
      </SvgFadeIn>
      {/* Bottom gate */}
      <SvgFadeIn duration={0.5} delay={beatDelay + 0.4}>
        <NORShape cx={G.botCx} cy={G.botCy} w={G.gateW}
                  color={botActive ? 'var(--rose-300)' : 'var(--amber-400)'}/>
      </SvgFadeIn>

      {/* S input wire → top in1 */}
      <TraceIn d={`M ${G.sStubX} ${tp.in1y} L ${tp.in1x} ${tp.in1y}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 0.8}/>
      <SvgFadeIn duration={0.35} delay={beatDelay + 1.2}>
        <text x={G.sStubX - 8} y={tp.in1y + 6} textAnchor="end"
              fill="var(--amber-300)" fontFamily="var(--font-mono)"
              fontSize={16} letterSpacing="0.1em">S</text>
      </SvgFadeIn>

      {/* R input wire → bottom in2 */}
      <TraceIn d={`M ${G.rStubX} ${bp.in2y} L ${bp.in2x} ${bp.in2y}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 1.0}/>
      <SvgFadeIn duration={0.35} delay={beatDelay + 1.4}>
        <text x={G.rStubX - 8} y={bp.in2y + 6} textAnchor="end"
              fill="var(--rose-300)" fontFamily="var(--font-mono)"
              fontSize={16} letterSpacing="0.1em">R</text>
      </SvgFadeIn>

      {/* Top output → Q̄ + feedback path to bottom in1 */}
      <TraceIn d={`M ${tp.outx + 6} ${tp.outy} L ${G.outStubX} ${tp.outy}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 1.4}/>
      <SvgFadeIn duration={0.4} delay={beatDelay + 1.8}>
        <text x={G.outStubX + 14} y={tp.outy + 6}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={22}>Q</text>
        {/* Overline above the Q to indicate complement */}
        <line x1={G.outStubX + 14} y1={tp.outy - 12}
              x2={G.outStubX + 30} y2={tp.outy - 12}
              stroke="var(--chalk-100)" strokeWidth={1.6}/>
      </SvgFadeIn>
      {/* Feedback Q̄ → bottom in1 (down + left + into in1) */}
      <TraceIn d={`M ${G.outStubX - 30} ${tp.outy} L ${G.outStubX - 30} ${(tp.outy + bp.in1y) / 2 - 8} L ${G.topCx - G.gateW / 2 - 50} ${(tp.outy + bp.in1y) / 2 - 8} L ${G.topCx - G.gateW / 2 - 50} ${bp.in1y} L ${bp.in1x} ${bp.in1y}`}
               stroke={botActive ? 'var(--rose-300)' : 'var(--violet-400)'}
               strokeWidth={2}
               duration={0.7} delay={beatDelay + 2.0}/>

      {/* Bottom output → Q + feedback path to top in2 */}
      <TraceIn d={`M ${bp.outx + 6} ${bp.outy} L ${G.outStubX} ${bp.outy}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 1.6}/>
      <SvgFadeIn duration={0.4} delay={beatDelay + 2.0}>
        <text x={G.outStubX + 14} y={bp.outy + 6}
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={22}>Q</text>
      </SvgFadeIn>
      {/* Feedback Q → top in2 (up + left + into in2) */}
      <TraceIn d={`M ${G.outStubX - 30} ${bp.outy} L ${G.outStubX - 30} ${(tp.outy + bp.in1y) / 2 + 8} L ${G.topCx - G.gateW / 2 - 35} ${(tp.outy + bp.in1y) / 2 + 8} L ${G.topCx - G.gateW / 2 - 35} ${tp.in2y} L ${tp.in2x} ${tp.in2y}`}
               stroke={topActive ? 'var(--amber-300)' : 'var(--violet-400)'}
               strokeWidth={2}
               duration={0.7} delay={beatDelay + 2.2}/>
    </g>
  );
}

// Compute coordinates for a moving "pulse dot" along a 3-leg path. Each
// leg is a list of (x, y) waypoints; the dot's position is sampleAt(u).
function legPath(...waypoints) {
  return waypoints;
}
function pathTotal(waypoints) {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += Math.hypot(waypoints[i].x - waypoints[i - 1].x,
                        waypoints[i].y - waypoints[i - 1].y);
  }
  return total;
}
function sampleAt(waypoints, u) {
  const tot = pathTotal(waypoints);
  let target = u * tot;
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i].x - waypoints[i - 1].x;
    const dy = waypoints[i].y - waypoints[i - 1].y;
    const seg = Math.hypot(dx, dy);
    if (target <= seg) {
      const f = seg > 0 ? target / seg : 0;
      return { x: waypoints[i - 1].x + dx * f, y: waypoints[i - 1].y + dy * f };
    }
    target -= seg;
  }
  return waypoints[waypoints.length - 1];
}

// ─── Beat 2: Structure — both NORs, all wires labelled ───────────────────
function StructureBeat() {
  const portrait = usePortrait();
  const G = latchGeometry(portrait);
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <LatchDiagram G={G}/>

        {/* NOR label on each gate body */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          <text x={G.topCx} y={G.topCy + 4} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.16em">NOR</text>
          <text x={G.botCx} y={G.botCy + 4} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.16em">NOR</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the outputs hold each other in place
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Set — S=1 → Q̄=0 → bottom NOR sees 0,0 → Q=1 ─────────────
function SetBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = latchGeometry(portrait);
  const tp = pinCoords(G.topCx, G.topCy, G.gateW);
  const bp = pinCoords(G.botCx, G.botCy, G.gateW);

  // Pulse leg 1: S input wire → top in1 → top output → right stub.
  const leg1 = legPath(
    { x: G.sStubX, y: tp.in1y },
    { x: tp.in1x, y: tp.in1y },
    { x: tp.outx + 6, y: tp.outy },
    { x: G.outStubX - 30, y: tp.outy },
  );
  // Pulse leg 2: feedback Q̄ → bottom in1 → bottom output → right stub.
  const leg2 = legPath(
    { x: G.outStubX - 30, y: (tp.outy + bp.in1y) / 2 - 8 },
    { x: G.topCx - G.gateW / 2 - 50, y: (tp.outy + bp.in1y) / 2 - 8 },
    { x: G.topCx - G.gateW / 2 - 50, y: bp.in1y },
    { x: bp.in1x, y: bp.in1y },
    { x: bp.outx + 6, y: bp.outy },
    { x: G.outStubX - 30, y: bp.outy },
  );

  // Time the pulse: 0.8s for leg1, 0.5s pause, 1.4s for leg2, hold.
  const PULSE_START = 1.2;
  const LEG1_DUR = 1.4;
  const PAUSE = 0.4;
  const LEG2_DUR = 1.8;
  const t = localTime - PULSE_START;
  let pulseLeg = 0;
  let pulseU = 0;
  let pulseShown = false;
  if (t > 0 && t <= LEG1_DUR) {
    pulseLeg = 1; pulseU = t / LEG1_DUR; pulseShown = true;
  } else if (t > LEG1_DUR + PAUSE && t <= LEG1_DUR + PAUSE + LEG2_DUR) {
    pulseLeg = 2; pulseU = (t - LEG1_DUR - PAUSE) / LEG2_DUR; pulseShown = true;
  }
  const dot = pulseShown
    ? sampleAt(pulseLeg === 1 ? leg1 : leg2, clamp(pulseU, 0, 1))
    : null;

  // After leg 2, Q has latched — show Q=1 label
  const qShown = t > LEG1_DUR + PAUSE + LEG2_DUR;
  // After leg 1, Q̄ has settled to 0
  const qBarShown = t > LEG1_DUR;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <LatchDiagram G={G} highlight={pulseLeg === 1 ? 'top' : (pulseLeg === 2 ? 'bot' : null)}/>

        {/* S = 1 label glow on the input */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <circle cx={G.sStubX - 24} cy={tp.in1y} r={11}
                  fill="var(--amber-400)" opacity={0.85}/>
          <text x={G.sStubX - 24} y={tp.in1y + 5} textAnchor="middle"
                fill="var(--bg-canvas)" fontFamily="var(--font-mono)"
                fontSize={13} fontWeight="bold">1</text>
        </SvgFadeIn>
        {/* R = 0 label on the bottom */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <circle cx={G.rStubX - 24} cy={bp.in2y} r={11}
                  fill="none" stroke="var(--chalk-300)" strokeWidth={1.4}/>
          <text x={G.rStubX - 24} y={bp.in2y + 5} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={13}>0</text>
        </SvgFadeIn>

        {/* Travelling pulse dot */}
        {dot && (
          <g>
            <circle cx={dot.x} cy={dot.y} r={6}
                    fill="var(--amber-300)" opacity={0.95}/>
            <circle cx={dot.x} cy={dot.y} r={12}
                    fill="none" stroke="var(--amber-300)" strokeWidth={1.4}
                    opacity={0.5}/>
          </g>
        )}

        {/* Q̄ = 0 settled label */}
        {qBarShown && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <circle cx={G.outStubX + 50} cy={tp.outy} r={11}
                    fill="none" stroke="var(--chalk-300)" strokeWidth={1.4}/>
            <text x={G.outStubX + 50} y={tp.outy + 5} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={13}>0</text>
          </SvgFadeIn>
        )}
        {/* Q = 1 settled label */}
        {qShown && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <circle cx={G.outStubX + 50} cy={bp.outy} r={11}
                    fill="var(--amber-400)" opacity={0.85}/>
            <text x={G.outStubX + 50} y={bp.outy + 5} textAnchor="middle"
                  fill="var(--bg-canvas)" fontFamily="var(--font-mono)"
                  fontSize={13} fontWeight="bold">1</text>
          </SvgFadeIn>
        )}

        {/* Result line */}
        <SvgFadeIn duration={0.4} delay={5.6}>
          <text x={G.vbW / 2} y={G.captionY - 28} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            S = 1, R = 0  →  Q = 1
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={7.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            S sets Q̄ low, the loop catches it, Q swings high
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Reset — R=1 → Q=0 → top NOR sees 0,0 → Q̄=1 ──────────────
function ResetBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = latchGeometry(portrait);
  const tp = pinCoords(G.topCx, G.topCy, G.gateW);
  const bp = pinCoords(G.botCx, G.botCy, G.gateW);

  // Pulse leg 1: R input → bottom in2 → bottom output → right stub.
  const leg1 = legPath(
    { x: G.rStubX, y: bp.in2y },
    { x: bp.in2x, y: bp.in2y },
    { x: bp.outx + 6, y: bp.outy },
    { x: G.outStubX - 30, y: bp.outy },
  );
  // Pulse leg 2: feedback Q → top in2 → top output → right stub.
  const leg2 = legPath(
    { x: G.outStubX - 30, y: (tp.outy + bp.in1y) / 2 + 8 },
    { x: G.topCx - G.gateW / 2 - 35, y: (tp.outy + bp.in1y) / 2 + 8 },
    { x: G.topCx - G.gateW / 2 - 35, y: tp.in2y },
    { x: tp.in2x, y: tp.in2y },
    { x: tp.outx + 6, y: tp.outy },
    { x: G.outStubX - 30, y: tp.outy },
  );

  const PULSE_START = 1.2;
  const LEG1_DUR = 1.4;
  const PAUSE = 0.4;
  const LEG2_DUR = 1.8;
  const t = localTime - PULSE_START;
  let pulseLeg = 0;
  let pulseU = 0;
  let pulseShown = false;
  if (t > 0 && t <= LEG1_DUR) {
    pulseLeg = 1; pulseU = t / LEG1_DUR; pulseShown = true;
  } else if (t > LEG1_DUR + PAUSE && t <= LEG1_DUR + PAUSE + LEG2_DUR) {
    pulseLeg = 2; pulseU = (t - LEG1_DUR - PAUSE) / LEG2_DUR; pulseShown = true;
  }
  const dot = pulseShown
    ? sampleAt(pulseLeg === 1 ? leg1 : leg2, clamp(pulseU, 0, 1))
    : null;

  const qShown = t > LEG1_DUR;
  const qBarShown = t > LEG1_DUR + PAUSE + LEG2_DUR;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <LatchDiagram G={G} highlight={pulseLeg === 1 ? 'bot' : (pulseLeg === 2 ? 'top' : null)}/>

        {/* S = 0 label */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <circle cx={G.sStubX - 24} cy={tp.in1y} r={11}
                  fill="none" stroke="var(--chalk-300)" strokeWidth={1.4}/>
          <text x={G.sStubX - 24} y={tp.in1y + 5} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={13}>0</text>
        </SvgFadeIn>
        {/* R = 1 label glow */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <circle cx={G.rStubX - 24} cy={bp.in2y} r={11}
                  fill="var(--rose-400)" opacity={0.85}/>
          <text x={G.rStubX - 24} y={bp.in2y + 5} textAnchor="middle"
                fill="var(--bg-canvas)" fontFamily="var(--font-mono)"
                fontSize={13} fontWeight="bold">1</text>
        </SvgFadeIn>

        {dot && (
          <g>
            <circle cx={dot.x} cy={dot.y} r={6}
                    fill="var(--rose-300)" opacity={0.95}/>
            <circle cx={dot.x} cy={dot.y} r={12}
                    fill="none" stroke="var(--rose-300)" strokeWidth={1.4}
                    opacity={0.5}/>
          </g>
        )}

        {qShown && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <circle cx={G.outStubX + 50} cy={bp.outy} r={11}
                    fill="none" stroke="var(--chalk-300)" strokeWidth={1.4}/>
            <text x={G.outStubX + 50} y={bp.outy + 5} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={13}>0</text>
          </SvgFadeIn>
        )}
        {qBarShown && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <circle cx={G.outStubX + 50} cy={tp.outy} r={11}
                    fill="var(--amber-400)" opacity={0.85}/>
            <text x={G.outStubX + 50} y={tp.outy + 5} textAnchor="middle"
                  fill="var(--bg-canvas)" fontFamily="var(--font-mono)"
                  fontSize={13} fontWeight="bold">1</text>
          </SvgFadeIn>
        )}

        <SvgFadeIn duration={0.4} delay={5.6}>
          <text x={G.vbW / 2} y={G.captionY - 28} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            S = 0, R = 1  →  Q = 0
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={7.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            R pulls Q low, the loop catches it, Q̄ swings high
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Timing diagram — S, R, Q with cursor sweep ─────────────────
// Genuine value-driven motion: a left-to-right cursor sweeps three rows
// (S, R, Q) and Q's trace reflects the latched state — high after the S
// pulse, holding through the no-input zone, returning to 0 after the R
// pulse. Q stays at its latched value when both inputs are 0.
function TimingBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 700, panelX: 80, panelW: 460,
        sY: 130, rY: 280, qY: 430, rowH: 80,
        captionY: 640, fontEyebrow: 10 }
    : { vbW: 1100, vbH: 460, panelX: 130, panelW: 820,
        sY: 70, rY: 180, qY: 290, rowH: 80,
        captionY: 430, fontEyebrow: 11 };

  // Time scale: 6 logical seconds across the panel (S pulse 1..2, R pulse 4..5).
  const TOTAL_T = 6;
  // Drives:
  //   S = 1 for t in [1, 2]
  //   R = 1 for t in [4, 5]
  // Q latches: starts at 0, → 1 at t=1, stays 1 until t=4, → 0 at t=4, stays 0.
  const sAt = (t) => (t >= 1 && t < 2) ? 1 : 0;
  const rAt = (t) => (t >= 4 && t < 5) ? 1 : 0;
  const qAtFn = (t) => {
    if (t < 1) return 0;
    if (t < 4) return 1;
    return 0;
  };

  function rowD(fn, y) {
    const hi = y + 10, lo = y + G.rowH - 10;
    const dxPer = G.panelW / TOTAL_T;
    const samples = 360;
    let prev = fn(0);
    const pts = [`M ${G.panelX} ${prev ? hi : lo}`];
    for (let i = 1; i <= samples; i++) {
      const t = (i / samples) * TOTAL_T;
      const v = fn(t);
      if (v !== prev) {
        const x = G.panelX + t * dxPer;
        pts.push(`L ${x.toFixed(2)} ${prev ? hi : lo}`);
        pts.push(`L ${x.toFixed(2)} ${v ? hi : lo}`);
        prev = v;
      }
    }
    pts.push(`L ${G.panelX + G.panelW} ${prev ? hi : lo}`);
    return pts.join(' ');
  }

  const sD = rowD(sAt, G.sY);
  const rD = rowD(rAt, G.rY);
  const qD = rowD(qAtFn, G.qY);

  // Cursor sweep.
  const HOLD = 1.0;
  const TRACE_DUR = Math.max(spriteDur - HOLD - 1.5, 1);
  const traceFrac = clamp((localTime - HOLD) / TRACE_DUR, 0, 1);
  const cursorX = G.panelX + traceFrac * G.panelW;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Row labels */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.panelX} y={G.sY - 12}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">S</text>
          <text x={G.panelX} y={G.rY - 12}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">R</text>
          <text x={G.panelX} y={G.qY - 12}
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">Q</text>
        </SvgFadeIn>

        {/* Row baselines */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {[G.sY, G.rY, G.qY].map((y, i) => (
            <line key={i} x1={G.panelX} y1={y + G.rowH - 10}
                  x2={G.panelX + G.panelW} y2={y + G.rowH - 10}
                  stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}
                  strokeDasharray="3 3"/>
          ))}
        </SvgFadeIn>

        {/* Traces */}
        <TraceIn d={sD}
          stroke="var(--amber-300)" strokeWidth={2.4}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}
          ease={Easing.linear}/>
        <TraceIn d={rD}
          stroke="var(--rose-300)" strokeWidth={2.4}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}
          ease={Easing.linear}/>
        <TraceIn d={qD}
          stroke="var(--chalk-100)" strokeWidth={2.8}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}
          ease={Easing.linear}/>

        {/* "Hold" annotation between the S pulse and R pulse */}
        <SvgFadeIn duration={0.4} delay={4.6}>
          <line x1={G.panelX + (2.2 / TOTAL_T) * G.panelW} y1={G.qY + G.rowH + 8}
                x2={G.panelX + (3.8 / TOTAL_T) * G.panelW} y2={G.qY + G.rowH + 8}
                stroke="var(--amber-300)" strokeWidth={1.4}/>
          <text x={G.panelX + (3.0 / TOTAL_T) * G.panelW}
                y={G.qY + G.rowH + 24} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.14em">HOLD</text>
        </SvgFadeIn>

        {/* Time cursor */}
        {traceFrac > 0.01 && traceFrac < 0.99 && (
          <line x1={cursorX} y1={G.sY - 8}
                x2={cursorX} y2={G.qY + G.rowH + 8}
                stroke="var(--amber-300)" strokeWidth={1.2}
                strokeDasharray="2 4" opacity={0.55}/>
        )}

        <SvgFadeIn duration={0.4} delay={8.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            S = R = 0 → Q stays. That's the one bit of memory.
          </text>
        </SvgFadeIn>
      </svg>
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
