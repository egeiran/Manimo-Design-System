// Finite State Machines: A Circuit That Remembers Where It Was — Manimo scene.
// A Moore-style "saw 11" detector with three states. Genuine animation lives
// in Beat 3 (Walk): a cursor advances bit by bit across an 8-bit input
// stream while the active state bubble glows and the just-fired transition
// arrow pulses. Beat 4 traces the output Z synchronously with the walked
// state — high only when the FSM is parked in S2.
//
// Beats (timed to single-track narration in motion/ade/audio/finite-state-machine/):
//    0.00– 5.14  Manimo intro: a circuit with memory — what is it remembering?
//    5.14–13.39  State graph: three bubbles (S0/S1/S2) wired with labelled arrows
//   13.39–22.57  Walk: bitstream advances; current state lights up each tick
//   22.57–30.30  Output trace Z — high only in S2
//   30.30–39.00  Takeaway: states + transitions + outputs = sequential logic
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • The FSM transition function is defined at module scope so Beat 3
//     and Beat 4 walk the same input and produce identical state/output
//     traces.

const SCENE_DURATION = 38;

const NARRATION = [
  /*  0.00– 5.14 */ "A digital circuit that remembers what just happened — how do we describe it?",
  /*  5.14–13.39 */ "Draw a state graph. Three bubbles for three memory states, arrows labelled with the input bit that triggers each transition.",
  /* 13.39–22.57 */ "Feed a bitstream in, one bit per clock tick. The current state bubble lights up; the transition arrow pulses as the next bit decides where to go next.",
  /* 22.57–30.30 */ "The output is high only when the machine is parked in S two — that means it has just seen two ones in a row.",
  /* 30.30–39.00 */ "States, transitions, outputs — that is every controller, every protocol, every counter you will ever build.",
];

const NARRATION_AUDIO = 'audio/finite-state-machine/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="sequential logic"
      title="Finite State Machines: A Circuit That Remembers Where It Was"
      duration={SCENE_DURATION}
      introEnd={4.71}
      introCaption="A circuit with memory — what is it remembering?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.71} end={12.59}>
        <GraphBeat />
      </Sprite>

      <Sprite start={12.59} end={22.35}>
        <WalkBeat />
      </Sprite>

      <Sprite start={22.35} end={29.22}>
        <OutputBeat />
      </Sprite>

      <Sprite start={29.22} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── FSM definition (module scope so all beats see the same machine) ─────
// Moore-style 11-detector. Three states; output Z = 1 iff state == 'S2'.
const TRANSITIONS = {
  S0: { 0: 'S0', 1: 'S1' },
  S1: { 0: 'S0', 1: 'S2' },
  S2: { 0: 'S0', 1: 'S2' },
};
function nextState(s, bit) { return TRANSITIONS[s][bit]; }
function outputOf(s) { return s === 'S2' ? 1 : 0; }

// Input bitstream — 8 bits chosen so the FSM visits all three states and
// the output toggles legibly. Sequence: 0 1 1 0 1 1 1 0 → states walk
// S0 → S0 → S1 → S2 → S0 → S1 → S2 → S2 → S0, output 0 0 0 1 0 0 1 1 0.
const INPUT_BITS = [0, 1, 1, 0, 1, 1, 1, 0];
function statesAfter(bits) {
  const seq = ['S0'];
  for (const b of bits) seq.push(nextState(seq[seq.length - 1], b));
  return seq;
}
const STATE_TRAJ = statesAfter(INPUT_BITS); // length = bits.length + 1

// Layout for the state graph: triangle with S0 left, S1 top, S2 right.
function stateLayout(cx, cy, r) {
  return {
    S0: { x: cx - r, y: cy + r * 0.5 },
    S1: { x: cx,     y: cy - r * 0.85 },
    S2: { x: cx + r, y: cy + r * 0.5 },
  };
}

// ─── Beat 2: State graph ──────────────────────────────────────────────────
function GraphBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 720, cx: 300, cy: 280, r: 200, bubbleR: 44,
        captionY: 640, fontMain: 22, fontLabel: 14 }
    : { vbW: 920, vbH: 460, cx: 460, cy: 220, r: 200, bubbleR: 44,
        captionY: 420, fontMain: 22, fontLabel: 14 };

  const L = stateLayout(G.cx, G.cy, G.r);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Edges first, then bubbles on top */}
        <SvgFadeIn duration={0.5} delay={1.4}>
          <ArrowEdge from={L.S0} to={L.S1} label="1" r={G.bubbleR} curve={-30}
                     color="var(--amber-400)"/>
          <ArrowEdge from={L.S1} to={L.S2} label="1" r={G.bubbleR} curve={-30}
                     color="var(--amber-400)"/>
          <ArrowEdge from={L.S2} to={L.S0} label="0" r={G.bubbleR} curve={-70}
                     color="var(--chalk-200)"/>
          <ArrowEdge from={L.S1} to={L.S0} label="0" r={G.bubbleR} curve={30}
                     color="var(--chalk-200)"/>
          <SelfLoop at={L.S0} side="left"  label="0" r={G.bubbleR}
                    color="var(--chalk-200)"/>
          <SelfLoop at={L.S2} side="right" label="1" r={G.bubbleR}
                    color="var(--amber-400)"/>
        </SvgFadeIn>

        {/* Bubbles */}
        {['S0', 'S1', 'S2'].map((s, i) => (
          <SvgFadeIn key={s} duration={0.4} delay={0.2 + i * 0.3}>
            <g>
              <circle cx={L[s].x} cy={L[s].y} r={G.bubbleR}
                      fill="var(--bg-canvas)"
                      stroke={s === 'S2' ? 'var(--amber-300)' : 'var(--chalk-100)'}
                      strokeWidth={2.4}/>
              {/* Moore output indicator: S2 has a small inner ring */}
              {s === 'S2' && (
                <circle cx={L[s].x} cy={L[s].y} r={G.bubbleR - 6}
                        fill="none" stroke="var(--amber-300)" strokeWidth={1.2}
                        opacity={0.6}/>
              )}
              <text x={L[s].x} y={L[s].y + 8} textAnchor="middle"
                    fill={s === 'S2' ? 'var(--amber-300)' : 'var(--chalk-100)'}
                    fontFamily="var(--font-serif)" fontStyle="italic"
                    fontSize={G.fontMain}>
                {s[0]}<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>{s[1]}</tspan>
              </text>
            </g>
          </SvgFadeIn>
        ))}

        {/* Legend / state meaning */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={L.S0.x} y={L.S0.y + G.bubbleR + 28} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel}>idle</text>
          <text x={L.S1.x} y={L.S1.y - G.bubbleR - 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel}>saw 1</text>
          <text x={L.S2.x} y={L.S2.y + G.bubbleR + 28} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel}>saw 11 → Z=1</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            edges labelled by the input bit that fires them
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Edge primitives (used by Beat 2 & Beat 3) ───────────────────────────
function ArrowEdge({ from, to, label, r, curve = 0, color, highlight = false }) {
  // Curved edge between two bubble centres, stopping at bubble radius r.
  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  // Perpendicular unit
  const px = -uy, py = ux;
  const ax = from.x + ux * r;
  const ay = from.y + uy * r;
  const bx = to.x - ux * r;
  const by = to.y - uy * r;
  // Control point offset perpendicularly by `curve` px
  const cxp = (ax + bx) / 2 + px * curve;
  const cyp = (ay + by) / 2 + py * curve;
  // Arrowhead at b
  const arrowSize = 8;
  // Tangent at b is from (cxp,cyp) → (bx,by)
  const tdx = bx - cxp, tdy = by - cyp;
  const tdist = Math.hypot(tdx, tdy) || 1;
  const tx = tdx / tdist, ty = tdy / tdist;
  const ahx1 = bx - tx * arrowSize - ty * arrowSize * 0.6;
  const ahy1 = by - ty * arrowSize + tx * arrowSize * 0.6;
  const ahx2 = bx - tx * arrowSize + ty * arrowSize * 0.6;
  const ahy2 = by - ty * arrowSize - tx * arrowSize * 0.6;

  const stroke = highlight ? 'var(--amber-300)' : color;
  const sw = highlight ? 3.2 : 2;

  return (
    <g opacity={highlight ? 1 : 0.85}>
      <path d={`M ${ax} ${ay} Q ${cxp} ${cyp} ${bx} ${by}`}
            fill="none" stroke={stroke} strokeWidth={sw}/>
      <polygon points={`${bx},${by} ${ahx1},${ahy1} ${ahx2},${ahy2}`}
               fill={stroke}/>
      {label != null && (
        <g>
          <circle cx={cxp + px * 12} cy={cyp + py * 12} r={11}
                  fill="var(--bg-canvas)" stroke={stroke} strokeWidth={1.2}/>
          <text x={cxp + px * 12} y={cyp + py * 12 + 4} textAnchor="middle"
                fill={stroke} fontFamily="var(--font-mono)" fontSize={13}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

function SelfLoop({ at, side, label, r, color, highlight = false }) {
  // Small loop attached to one side of the bubble.
  const sign = side === 'right' ? 1 : -1;
  const cx = at.x + sign * (r + 18);
  const cy = at.y;
  const loopR = 18;
  const stroke = highlight ? 'var(--amber-300)' : color;
  const sw = highlight ? 3 : 2;
  // Attach points on bubble: top + bottom-ish
  const ax = at.x + sign * r * Math.cos(Math.PI / 6);
  const ay = at.y - r * Math.sin(Math.PI / 6);
  const bx = at.x + sign * r * Math.cos(Math.PI / 6);
  const by = at.y + r * Math.sin(Math.PI / 6);
  return (
    <g opacity={highlight ? 1 : 0.85}>
      <path d={`M ${ax} ${ay} C ${cx + sign * loopR} ${cy - loopR}, ${cx + sign * loopR} ${cy + loopR}, ${bx} ${by}`}
            fill="none" stroke={stroke} strokeWidth={sw}/>
      <polygon
        points={`${bx},${by} ${bx - sign * 8},${by - 5} ${bx - sign * 8},${by + 5}`}
        fill={stroke}/>
      <circle cx={cx + sign * (loopR + 4)} cy={cy} r={11}
              fill="var(--bg-canvas)" stroke={stroke} strokeWidth={1.2}/>
      <text x={cx + sign * (loopR + 4)} y={cy + 4} textAnchor="middle"
            fill={stroke} fontFamily="var(--font-mono)" fontSize={13}>
        {label}
      </text>
    </g>
  );
}

// ─── Beat 3: Walk — bitstream advances; states light up ──────────────────
function WalkBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 1100,
        stripX: 60, stripY: 80, stripW: 480, cellH: 56,
        cx: 300, cy: 600, r: 200, bubbleR: 44,
        captionY: 1000, fontMain: 22, fontBit: 28 }
    : { vbW: 1200, vbH: 620,
        stripX: 100, stripY: 80, stripW: 1000, cellH: 50,
        cx: 600, cy: 380, r: 170, bubbleR: 42,
        captionY: 580, fontMain: 22, fontBit: 26 };

  // Beat timing — one bit per "tick", first tick fires after HOLD seconds.
  const HOLD = 1.5;
  const PER_BIT = (spriteDur - HOLD - 1.0) / INPUT_BITS.length;
  const adv = Math.max(0, localTime - HOLD) / PER_BIT;
  const tickIdx = Math.min(Math.floor(adv), INPUT_BITS.length); // 0..N
  const tickFrac = clamp(adv - tickIdx, 0, 1);
  const currentState = STATE_TRAJ[tickIdx]; // before consuming bit[tickIdx]
  // The bit being "consumed" right now is INPUT_BITS[tickIdx] (if tickIdx < N).
  // The transition fires as that bit is consumed: from currentState → STATE_TRAJ[tickIdx+1].

  const stripCellW = G.stripW / INPUT_BITS.length;
  const cursorX = G.stripX + (tickIdx + tickFrac) * stripCellW;

  const L = stateLayout(G.cx, G.cy, G.r);

  // Which transition just fired (for highlight)? Active during the latter
  // half of each tick — i.e. tickFrac > 0.2 and tickIdx < N.
  const transitionActive = tickIdx < INPUT_BITS.length && tickFrac > 0.05;
  const firedFrom = transitionActive ? STATE_TRAJ[tickIdx] : null;
  const firedTo = transitionActive ? STATE_TRAJ[tickIdx + 1] : null;
  const firedBit = transitionActive ? INPUT_BITS[tickIdx] : null;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Bitstream label */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.stripX} y={G.stripY - 12}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.16em">INPUT BITS</text>
        </SvgFadeIn>

        {/* Bitstream cells */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {INPUT_BITS.map((bit, i) => {
            const x = G.stripX + i * stripCellW;
            const past = i < tickIdx;
            const current = i === tickIdx;
            return (
              <g key={i}>
                <rect x={x + 4} y={G.stripY}
                      width={stripCellW - 8} height={G.cellH}
                      fill={past ? 'var(--bg-canvas)'
                                 : current ? 'var(--bg-canvas)' : 'var(--bg-canvas)'}
                      stroke={current ? 'var(--amber-300)'
                                      : past ? 'var(--chalk-300)'
                                             : 'var(--chalk-300)'}
                      strokeWidth={current ? 2.4 : 1}
                      opacity={past ? 0.45 : 1}
                      rx={4}/>
                <text x={x + stripCellW / 2} y={G.stripY + G.cellH / 2 + 10}
                      textAnchor="middle"
                      fill={current ? 'var(--amber-300)'
                                    : past ? 'var(--chalk-300)' : 'var(--chalk-100)'}
                      fontFamily="var(--font-mono)" fontSize={G.fontBit}>
                  {bit}
                </text>
              </g>
            );
          })}
        </SvgFadeIn>

        {/* Cursor under the strip */}
        {tickIdx < INPUT_BITS.length && (
          <g>
            <line x1={cursorX + stripCellW / 2} y1={G.stripY - 6}
                  x2={cursorX + stripCellW / 2} y2={G.stripY + G.cellH + 6}
                  stroke="var(--amber-300)" strokeWidth={1.2}
                  strokeDasharray="2 4" opacity={0.6}/>
          </g>
        )}

        {/* Edges */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <ArrowEdge from={L.S0} to={L.S1} label="1" r={G.bubbleR} curve={-30}
                     color="var(--chalk-300)"
                     highlight={firedFrom === 'S0' && firedTo === 'S1'}/>
          <ArrowEdge from={L.S1} to={L.S2} label="1" r={G.bubbleR} curve={-30}
                     color="var(--chalk-300)"
                     highlight={firedFrom === 'S1' && firedTo === 'S2'}/>
          <ArrowEdge from={L.S2} to={L.S0} label="0" r={G.bubbleR} curve={-70}
                     color="var(--chalk-300)"
                     highlight={firedFrom === 'S2' && firedTo === 'S0'}/>
          <ArrowEdge from={L.S1} to={L.S0} label="0" r={G.bubbleR} curve={30}
                     color="var(--chalk-300)"
                     highlight={firedFrom === 'S1' && firedTo === 'S0'}/>
          <SelfLoop at={L.S0} side="left"  label="0" r={G.bubbleR}
                    color="var(--chalk-300)"
                    highlight={firedFrom === 'S0' && firedTo === 'S0'}/>
          <SelfLoop at={L.S2} side="right" label="1" r={G.bubbleR}
                    color="var(--chalk-300)"
                    highlight={firedFrom === 'S2' && firedTo === 'S2'}/>
        </SvgFadeIn>

        {/* Bubbles — active one glows */}
        {['S0', 'S1', 'S2'].map((s) => {
          const active = s === currentState;
          return (
            <SvgFadeIn key={s} duration={0.3} delay={0.6}>
              <g>
                {active && (
                  <circle cx={L[s].x} cy={L[s].y} r={G.bubbleR + 10}
                          fill="var(--amber-400)" opacity={0.22}/>
                )}
                <circle cx={L[s].x} cy={L[s].y} r={G.bubbleR}
                        fill={active ? 'var(--amber-400)' : 'var(--bg-canvas)'}
                        stroke={active ? 'var(--amber-300)' : 'var(--chalk-200)'}
                        strokeWidth={active ? 3 : 1.8}
                        opacity={active ? 0.95 : 1}/>
                <text x={L[s].x} y={L[s].y + 8} textAnchor="middle"
                      fill={active ? 'var(--bg-canvas)' : 'var(--chalk-100)'}
                      fontFamily="var(--font-serif)" fontStyle="italic"
                      fontSize={G.fontMain}>
                  {s[0]}<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>{s[1]}</tspan>
                </text>
              </g>
            </SvgFadeIn>
          );
        })}

        {/* Status line: just-fired bit and resulting state */}
        <SvgFadeIn duration={0.3} delay={0.4}>
          <text x={G.vbW / 2} y={G.stripY + G.cellH + 36} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={14} letterSpacing="0.08em">
            {firedFrom != null
              ? `READ ${firedBit} • ${firedFrom} → ${firedTo}`
              : tickIdx >= INPUT_BITS.length
                ? `DONE • STATE = ${currentState}`
                : `READY • STATE = ${currentState}`}
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            one bit per clock — the state walks the graph
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Output trace Z ──────────────────────────────────────────────
function OutputBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 720,
        stripX: 60, stripY: 80, stripW: 480, cellH: 56,
        zY: 280, zH: 130,
        sLabelY: 470, captionY: 600,
        fontBit: 28, fontMain: 18 }
    : { vbW: 1080, vbH: 460,
        stripX: 100, stripY: 70, stripW: 880, cellH: 56,
        zY: 220, zH: 130,
        sLabelY: 410, captionY: 420,
        fontBit: 28, fontMain: 18 };

  const cellW = G.stripW / INPUT_BITS.length;

  // Build Z as a step signal. Z[i] = 1 iff state AFTER consuming bit i is S2.
  const zHigh = G.zY + 14;
  const zLow = G.zY + G.zH - 14;
  function zPath() {
    const pts = [];
    for (let i = 0; i < INPUT_BITS.length; i++) {
      const x0 = G.stripX + i * cellW;
      const x1 = G.stripX + (i + 1) * cellW;
      const y = outputOf(STATE_TRAJ[i + 1]) ? zHigh : zLow;
      if (i === 0) pts.push(`M ${x0} ${y}`);
      else {
        // vertical edge at transition
        const prevY = outputOf(STATE_TRAJ[i]) ? zHigh : zLow;
        if (prevY !== y) pts.push(`L ${x0} ${y}`);
      }
      pts.push(`L ${x1} ${y}`);
    }
    return pts.join(' ');
  }
  const zD = zPath();

  // Trace progressively across the beat: 1.0s hold, then sweep to end-1.0s.
  const HOLD = 1.0;
  const SWEEP = Math.max(spriteDur - HOLD - 1.5, 1);
  const sFrac = clamp((localTime - HOLD) / SWEEP, 0, 1);
  const traceX = G.stripX + sFrac * G.stripW;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <defs>
          <clipPath id="fsmZClip">
            <rect x={G.stripX} y={G.zY - 8}
                  width={Math.max(0, traceX - G.stripX)} height={G.zH + 16}/>
          </clipPath>
        </defs>

        {/* Bitstream strip (static) */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.stripX} y={G.stripY - 12}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.16em">INPUT</text>
          {INPUT_BITS.map((bit, i) => (
            <g key={i}>
              <rect x={G.stripX + i * cellW + 4} y={G.stripY}
                    width={cellW - 8} height={G.cellH}
                    fill="var(--bg-canvas)"
                    stroke="var(--chalk-300)" strokeWidth={1} rx={4}/>
              <text x={G.stripX + i * cellW + cellW / 2}
                    y={G.stripY + G.cellH / 2 + 10}
                    textAnchor="middle"
                    fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                    fontSize={G.fontBit}>{bit}</text>
            </g>
          ))}
        </SvgFadeIn>

        {/* State label row beneath strip */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          {STATE_TRAJ.slice(1).map((s, i) => (
            <text key={i}
                  x={G.stripX + i * cellW + cellW / 2}
                  y={G.stripY + G.cellH + 26}
                  textAnchor="middle"
                  fill={s === 'S2' ? 'var(--amber-300)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={13}>
              {s}
            </text>
          ))}
        </SvgFadeIn>

        {/* Z trace box */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.stripX} y={G.zY - 12}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.16em">OUTPUT Z</text>
          {/* Baseline */}
          <line x1={G.stripX} y1={zLow}
                x2={G.stripX + G.stripW} y2={zLow}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}
                strokeDasharray="3 4"/>
          {/* High reference */}
          <line x1={G.stripX} y1={zHigh}
                x2={G.stripX + G.stripW} y2={zHigh}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.2}
                strokeDasharray="2 5"/>
        </SvgFadeIn>

        {/* Cell-aligned faint backgrounds for S2 cells */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          {STATE_TRAJ.slice(1).map((s, i) => (
            s === 'S2' ? (
              <rect key={i} x={G.stripX + i * cellW + 4} y={G.zY}
                    width={cellW - 8} height={G.zH}
                    fill="var(--amber-400)" opacity={0.08}/>
            ) : null
          ))}
        </SvgFadeIn>

        {/* Z trace — clipped */}
        <g clipPath="url(#fsmZClip)">
          <path d={zD} fill="none" stroke="var(--amber-300)"
                strokeWidth={2.8} strokeLinecap="square" strokeLinejoin="miter"/>
        </g>

        {/* Trace cursor */}
        {sFrac > 0.01 && sFrac < 0.99 && (
          <line x1={traceX} y1={G.zY - 8}
                x2={traceX} y2={G.zY + G.zH + 8}
                stroke="var(--amber-300)" strokeWidth={1.2}
                strokeDasharray="2 4" opacity={0.6}/>
        )}

        {/* Formula */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 20 : 22}>
            Z = 1 iff state == S<tspan baselineShift="sub" fontSize={14}>2</tspan>
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
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 36, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          maxWidth: portrait ? '20ch' : '32ch', lineHeight: 1.25,
        }}>
        states + transitions + outputs = sequential logic
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)',
          maxWidth: portrait ? '28ch' : '48ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 6,
        }}>
        a register holds the state — combinational logic computes the next one
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
