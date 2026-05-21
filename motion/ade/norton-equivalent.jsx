// Norton's Theorem: Any Linear Circuit Becomes One Current Source — Manimo lesson scene.
// Companion to Thévenin: I_N = V_th / R_th flowing in parallel with R_N = R_th.
// Genuine motion lives in Beat 3 (Transformation): a side-by-side morph from
// the Thévenin form to the Norton form, with locked-phase charge dots that
// keep the same I_L flowing through the load in both panels.
//
// Beats (timed to single-track narration in motion/ade/audio/norton-equivalent/):
//    0.00– 5.02  Manimo intro: same network, viewed as a current source
//    5.02–12.53  Short the terminals → I_N is the short-circuit current
//   12.53–26.00  Transformation: V_th + R_th  ↔  I_N || R_N
//   26.00–35.97  Norton driving R_L → current divider gives same I_L
//   35.97–42.00  Takeaway
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 2 animates charge dots looping through the shorting wire.
//   • Beat 3's transformation arrow is the conceptual hinge — both panels
//     have the same load and lock to a shared phase so the I_L is visually
//     identical between the two forms.

const SCENE_DURATION = 42;

const NARRATION = [
  /*  0.00– 5.02 */ "Thévenin gave us a voltage source. What if we want a current source instead?",
  /*  5.02–12.53 */ "Short the terminals together. The current that flows through that wire is I Norton — the short-circuit current of the network.",
  /* 12.53–26.00 */ "A Thévenin form on the left morphs into a Norton form on the right. The resistance is the same; the source flips from V Thevenin over R Thevenin volts to V Thevenin over R Thevenin amps in parallel.",
  /* 26.00–35.97 */ "Reconnect a load. The current source splits between R Norton and the load by the current-divider rule — and you get exactly the same I L as Thevenin predicted.",
  /* 35.97–42.00 */ "Pick whichever form makes the algebra easier — same load current either way.",
];

const NARRATION_AUDIO = 'audio/norton-equivalent/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit analysis"
      title="Norton's Theorem: Any Linear Circuit Becomes One Current Source"
      duration={SCENE_DURATION}
      introEnd={5.02}
      introCaption="Same network — viewed as a current source."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.02} end={12.53}>
        <ShortCircuitBeat />
      </Sprite>

      <Sprite start={12.53} end={26.00}>
        <TransformationBeat />
      </Sprite>

      <Sprite start={26.00} end={35.97}>
        <LoadCurrentBeat />
      </Sprite>

      <Sprite start={35.97} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared circuit helpers ──────────────────────────────────────────────
function zigzagH(cy, xLeft, xRight, amp = 12, n = 8) {
  const dx = (xRight - xLeft) / n;
  const pts = [`M ${xLeft} ${cy}`];
  for (let i = 1; i < n; i++) {
    const y = cy + (i % 2 === 1 ? amp : -amp);
    const x = xLeft + i * dx;
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${xRight} ${cy}`);
  return pts.join(' ');
}

function zigzagV(cx, yTop, yBot, amp = 12, n = 8) {
  const dy = (yBot - yTop) / n;
  const pts = [`M ${cx} ${yTop}`];
  for (let i = 1; i < n; i++) {
    const x = cx + (i % 2 === 1 ? amp : -amp);
    const y = yTop + i * dy;
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${cx} ${yBot}`);
  return pts.join(' ');
}

function BatterySymbolV({ cx, cy, color, shortFirst = false }) {
  const longLen = 18, shortLen = 10;
  const top = shortFirst ? { len: shortLen, y: cy - 10 } : { len: longLen, y: cy - 10 };
  const bot = shortFirst ? { len: longLen, y: cy + 10 } : { len: shortLen, y: cy + 10 };
  return (
    <g>
      <line x1={cx - top.len} y1={top.y} x2={cx + top.len} y2={top.y}
            stroke={color} strokeWidth={3}/>
      <line x1={cx - bot.len} y1={bot.y} x2={cx + bot.len} y2={bot.y}
            stroke={color} strokeWidth={3}/>
    </g>
  );
}

// Current source symbol — circle with an upward arrow inside.
function CurrentSourceSymbolV({ cx, cy, color, label }) {
  const r = 22;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2.4}/>
      <line x1={cx} y1={cy + 11} x2={cx} y2={cy - 8}
            stroke={color} strokeWidth={2.4}/>
      <polygon
        points={`${cx},${cy - 14} ${cx - 5},${cy - 6} ${cx + 5},${cy - 6}`}
        fill={color}/>
      {label && (
        <text x={cx + r + 8} y={cy + 6}
              fill={color} fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={18}>
          {label}
        </text>
      )}
    </g>
  );
}

// ─── Beat 2: Short the terminals — measure I_N ──────────────────────────
function ShortCircuitBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Geometry mirrors thevenin-equivalent so the two scenes feel paired.
  // Ammeter sits ON the shorting wire (amCx === termX) so the current path
  // visibly goes through it rather than floating next to it.
  const G = portrait
    ? { vbW: 600, vbH: 620,
        ltX: 90, midX: 240, rtX: 410, termX: 520,
        topY: 130, midY: 320, botY: 510,
        zig: 16, captionY: 600, fontMain: 18, fontLabel: 13,
        amCx: 520, amCy: 415 }
    : { vbW: 1040, vbH: 420,
        ltX: 130, midX: 360, rtX: 620, termX: 800,
        topY: 90, midY: 220, botY: 360,
        zig: 12, captionY: 405, fontMain: 18, fontLabel: 13,
        amCx: 800, amCy: 290 };

  // Charge dots flowing CW through the shorted loop: termX↓ → bottom rail back to ltX → up through V1 → across top.
  // For the demo, dots travel down the shorting wire (midY → botY) at termX.
  const period = 2.2;
  const NUM = 6;
  const flowT = Math.max(0, localTime - 2.4);
  const yTop = G.midY + 8;
  const yBot = G.botY - 8;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Top branch rails — drawn in three pieces so the R_1 and R_2
            zigzags don't have a straight wire visible through them. */}
        {/*   left vertical + stub up to R_1 */}
        <TraceIn d={`M ${G.ltX} ${G.botY} L ${G.ltX} ${G.topY} L ${G.ltX + 40} ${G.topY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.6} delay={0.2}/>
        {/*   stub between R_1 and R_2 (passes through the midX node) */}
        <TraceIn d={`M ${G.midX - 40} ${G.topY} L ${G.midX + 40} ${G.topY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.4} delay={0.4}/>
        {/*   stub after R_2 + descent to right midY rail */}
        <TraceIn d={`M ${G.rtX - 40} ${G.topY} L ${G.rtX} ${G.topY} L ${G.rtX} ${G.midY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.6} delay={0.4}/>

        <SvgFadeIn duration={0.4} delay={0.4}>
          <BatterySymbolV cx={G.ltX} cy={(G.topY + G.midY) / 2} color="var(--chalk-200)"/>
          <text x={G.ltX - 22} y={(G.topY + G.midY) / 2 + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>1</tspan>
          </text>
        </SvgFadeIn>
        <TraceIn d={zigzagH(G.topY, G.ltX + 40, G.midX - 40, G.zig)}
          stroke="var(--amber-400)" strokeWidth={2.4} duration={0.6} delay={1.0}/>
        <SvgFadeIn duration={0.35} delay={1.4}>
          <text x={(G.ltX + G.midX) / 2} y={G.topY - 18} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>1</tspan>
          </text>
        </SvgFadeIn>

        <TraceIn d={zigzagH(G.topY, G.midX + 40, G.rtX - 40, G.zig)}
          stroke="var(--amber-400)" strokeWidth={2.4} duration={0.6} delay={1.4}/>
        <SvgFadeIn duration={0.35} delay={1.8}>
          <text x={(G.midX + G.rtX) / 2} y={G.topY - 18} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>2</tspan>
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={1.2}>
          <BatterySymbolV cx={G.rtX} cy={(G.topY + G.midY) / 2 + 12} color="var(--chalk-200)" shortFirst={true}/>
          <text x={G.rtX + 22} y={(G.topY + G.midY) / 2 + 18}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>2</tspan>
          </text>
        </SvgFadeIn>

        {/* R_3 — vertical between midX/topY and midX/botY, with stubs */}
        <TraceIn d={`M ${G.midX} ${G.topY} L ${G.midX} ${G.topY + 14}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={1.6}/>
        <TraceIn d={`M ${G.midX} ${G.botY - 14} L ${G.midX} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={1.6}/>
        <TraceIn d={zigzagV(G.midX, G.topY + 14, G.botY - 14, G.zig)}
          stroke="var(--amber-400)" strokeWidth={2.4} duration={0.6} delay={1.8}/>
        <SvgFadeIn duration={0.35} delay={2.2}>
          <text x={G.midX + G.zig + 18} y={G.midY + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>3</tspan>
          </text>
        </SvgFadeIn>

        {/* Bottom rail — ltX/botY across to termX/botY */}
        <TraceIn d={`M ${G.ltX} ${G.botY} L ${G.termX} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.8} delay={0.2}/>

        {/* Top rail from rtX/midY to termX/midY */}
        <TraceIn d={`M ${G.rtX} ${G.midY} L ${G.termX} ${G.midY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.4} delay={2.4}/>

        {/* Terminal markers a and b */}
        <SvgFadeIn duration={0.35} delay={1.6}>
          <circle cx={G.termX} cy={G.midY} r={5}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.termX + 14} y={G.midY + 5}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">a</text>
          <circle cx={G.termX} cy={G.botY} r={5}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.termX + 14} y={G.botY + 5}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">b</text>
        </SvgFadeIn>

        {/* Shorting wire from a to b at termX, with ammeter inline */}
        <TraceIn d={`M ${G.termX} ${G.midY} L ${G.termX} ${G.botY}`}
          stroke="var(--rose-300)" strokeWidth={2.4} duration={0.5} delay={1.4}/>

        {/* Ammeter — circle with A glyph, drawn on the shorting wire */}
        <SvgFadeIn duration={0.5} delay={1.6}>
          <circle cx={G.amCx} cy={G.amCy} r={22}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.amCx} y={G.amCy + 7} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>A</text>
        </SvgFadeIn>

        {/* Charge dots flowing down the shorting wire */}
        {flowT > 0 && (
          <SvgFadeIn duration={0.3} delay={2.4}>
            {Array.from({ length: NUM }).map((_, i) => {
              const u = ((flowT / period + i / NUM) % 1);
              const y = yTop + (yBot - yTop) * u;
              // Skip dots that would overlap the ammeter glyph.
              if (Math.abs(y - G.amCy) < 26) return null;
              return (
                <circle key={i} cx={G.termX} cy={y} r={3.5}
                        fill="var(--rose-300)" opacity={0.95}/>
              );
            })}
          </SvgFadeIn>
        )}

        {/* I_N label next to ammeter */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.amCx + 36} y={G.amCy + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={22}>
            I<tspan baselineShift="sub" fontSize={13}>N</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            short-circuit current through the joined terminals
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Transformation — Thévenin ↔ Norton ─────────────────────────
// The hinge of the scene. Two mini panels — Thévenin form (left) and Norton
// form (right) — with locked-phase charge dots through their loads. A morph
// arrow between them carries the transformation identities.
function TransformationBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const L = portrait
    ? { vbW: 620, vbH: 720,
        thx: 60, thy: 70, thw: 500, thh: 260,
        nx: 60, ny: 410, nw: 500, nh: 260,
        formulaY: 698, fontMain: 18 }
    : { vbW: 1100, vbH: 480,
        thx: 30, thy: 30, thw: 440, thh: 380,
        nx: 630, ny: 30, nw: 440, nh: 380,
        formulaY: 458, fontMain: 18 };

  const period = 2.6;
  const NUM = 5;
  const phase = Math.max(0, localTime - 1.0) / period;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={L.vbW} height={L.vbH} viewBox={`0 0 ${L.vbW} ${L.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Panel A — Thévenin form (V_th + R_th in series feeding R_L) */}
        <SvgFadeIn duration={0.5} delay={0.3}>
          <MiniThevenin x={L.thx} y={L.thy} w={L.thw} h={L.thh}
                        phase={phase} numDots={NUM} fontMain={L.fontMain}/>
        </SvgFadeIn>

        {/* Panel B — Norton form (I_N parallel R_N feeding R_L) */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <MiniNorton x={L.nx} y={L.ny} w={L.nw} h={L.nh}
                      phase={phase} numDots={NUM} fontMain={L.fontMain}/>
        </SvgFadeIn>

        {/* Transformation arrow between the two panels */}
        <SvgFadeIn duration={0.5} delay={1.8}>
          {portrait ? (
            <g>
              <line x1={L.vbW / 2 - 70} y1={L.thy + L.thh + 18}
                    x2={L.vbW / 2 - 70} y2={L.ny - 18}
                    stroke="var(--amber-300)" strokeWidth={2}/>
              <line x1={L.vbW / 2 + 70} y1={L.thy + L.thh + 18}
                    x2={L.vbW / 2 + 70} y2={L.ny - 18}
                    stroke="var(--amber-300)" strokeWidth={2}/>
              <polygon
                points={`${L.vbW / 2 - 70},${L.ny - 12} ${L.vbW / 2 - 75},${L.ny - 20} ${L.vbW / 2 - 65},${L.ny - 20}`}
                fill="var(--amber-300)"/>
              <polygon
                points={`${L.vbW / 2 + 70},${L.thy + L.thh + 12} ${L.vbW / 2 + 75},${L.thy + L.thh + 20} ${L.vbW / 2 + 65},${L.thy + L.thh + 20}`}
                fill="var(--amber-300)"/>
              <text x={L.vbW / 2} y={(L.thy + L.thh + L.ny) / 2 + 4} textAnchor="middle"
                    fill="var(--amber-300)" fontFamily="var(--font-mono)"
                    fontSize={13} letterSpacing="0.1em">SOURCE TRANSFORM</text>
            </g>
          ) : (
            <g>
              <line x1={L.thx + L.thw + 20} y1={L.vbH / 2 - 30}
                    x2={L.nx - 20} y2={L.vbH / 2 - 30}
                    stroke="var(--amber-300)" strokeWidth={2}/>
              <line x1={L.thx + L.thw + 20} y1={L.vbH / 2 + 30}
                    x2={L.nx - 20} y2={L.vbH / 2 + 30}
                    stroke="var(--amber-300)" strokeWidth={2}/>
              <polygon
                points={`${L.nx - 12},${L.vbH / 2 - 30} ${L.nx - 22},${L.vbH / 2 - 35} ${L.nx - 22},${L.vbH / 2 - 25}`}
                fill="var(--amber-300)"/>
              <polygon
                points={`${L.thx + L.thw + 12},${L.vbH / 2 + 30} ${L.thx + L.thw + 22},${L.vbH / 2 + 25} ${L.thx + L.thw + 22},${L.vbH / 2 + 35}`}
                fill="var(--amber-300)"/>
              <text x={(L.thx + L.thw + L.nx) / 2} y={L.vbH / 2 + 4} textAnchor="middle"
                    fill="var(--amber-300)" fontFamily="var(--font-mono)"
                    fontSize={13} letterSpacing="0.1em">SOURCE TRANSFORM</text>
            </g>
          )}
        </SvgFadeIn>

        {/* Formula chain at the bottom */}
        <SvgFadeIn duration={0.5} delay={3.4}>
          <text x={L.vbW / 2} y={L.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 22 : 26}>
            I<tspan baselineShift="sub" fontSize={14}>N</tspan> = V<tspan baselineShift="sub" fontSize={14}>th</tspan> / R<tspan baselineShift="sub" fontSize={14}>th</tspan>{'   '}·{'   '}R<tspan baselineShift="sub" fontSize={14}>N</tspan> = R<tspan baselineShift="sub" fontSize={14}>th</tspan>
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

function MiniThevenin({ x, y, w, h, phase, numDots, fontMain }) {
  // Loop layout: V_th + R_th + R_L in a single series loop.
  const padL = 36, padR = 60;
  const innerLeft = x + padL;
  const innerRight = x + w - padR;
  const topY = y + 50;
  const botY = y + h - 30;
  const midY = (topY + botY) / 2;
  const loadX = innerRight;
  // R_L spans the full rail-to-rail height so the wires connect at its top
  // and bottom rather than leaving a gap above the resistor. Dots flow
  // through the body, slightly inset from the rails.
  const dotTop = topY + 12;
  const dotBot = botY - 12;

  return (
    <g>
      <text x={x + 6} y={y + 22}
            fill="var(--chalk-200)" fontFamily="var(--font-mono)"
            fontSize={12} letterSpacing="0.16em">
        THÉVENIN FORM
      </text>
      <rect x={x} y={y + 30} width={w - padR + 10} height={h - 50}
            fill="none" stroke="var(--chalk-300)" strokeWidth={1}
            strokeDasharray="3 4" opacity={0.4} rx={6}/>

      {/* Top rail in two pieces, leaving room for R_th to draw cleanly
          (otherwise a thin straight line shows through the zigzag). */}
      <line x1={innerLeft} y1={topY} x2={innerLeft + 50} y2={topY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={innerLeft + 140} y1={topY} x2={loadX} y2={topY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={innerLeft} y1={botY} x2={loadX} y2={botY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={innerLeft} y1={topY} x2={innerLeft} y2={midY - 10}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={innerLeft} y1={midY + 10} x2={innerLeft} y2={botY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>

      {/* V_th source */}
      <BatterySymbolV cx={innerLeft} cy={midY} color="var(--chalk-100)"/>
      <text x={innerLeft - 16} y={midY + 6} textAnchor="end"
            fill="var(--chalk-100)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={14}>
        V<tspan baselineShift="sub" fontSize={9}>th</tspan>
      </text>

      {/* R_th on top wire */}
      <path d={zigzagH(topY, innerLeft + 50, innerLeft + 140, 10)}
            stroke="var(--amber-400)" strokeWidth={1.8} fill="none"/>
      <text x={innerLeft + 95} y={topY - 14} textAnchor="middle"
            fill="var(--chalk-100)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={14}>
        R<tspan baselineShift="sub" fontSize={9}>th</tspan>
      </text>

      {/* R_L on right side — spans top rail to bottom rail */}
      <path d={zigzagV(loadX, topY, botY, 10)}
            stroke="var(--rose-400)" strokeWidth={2.2} fill="none"
            strokeLinecap="round" strokeLinejoin="round"/>
      <text x={loadX + 16} y={midY + 6}
            fill="var(--rose-300)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={fontMain}>
        R<tspan baselineShift="sub" fontSize={fontMain * 0.6}>L</tspan>
      </text>

      {/* Charge dots flowing down R_L */}
      {Array.from({ length: numDots }).map((_, i) => {
        const u = ((phase + i / numDots) % 1);
        const yy = dotTop + (dotBot - dotTop) * u;
        return (
          <circle key={i} cx={loadX} cy={yy} r={3.5}
                  fill="var(--rose-300)" opacity={0.95}/>
        );
      })}
    </g>
  );
}

function MiniNorton({ x, y, w, h, phase, numDots, fontMain }) {
  // Layout: I_N current source on the left between rails, R_N as a
  // mid-column vertical zigzag, R_L on the far right — both branches share
  // top + bottom rails.
  const padL = 36, padR = 60;
  const innerLeft = x + padL;
  const innerRight = x + w - padR;
  const sourceX = innerLeft;
  const rnX = (innerLeft + innerRight) / 2;
  const loadX = innerRight;
  const topY = y + 50;
  const botY = y + h - 30;
  const midY = (topY + botY) / 2;
  // R_L spans rail to rail; dots flow inside.
  const dotTop = topY + 12;
  const dotBot = botY - 12;

  return (
    <g>
      <text x={x + 6} y={y + 22}
            fill="var(--amber-300)" fontFamily="var(--font-mono)"
            fontSize={12} letterSpacing="0.16em">
        NORTON FORM
      </text>
      <rect x={x} y={y + 30} width={w - padR + 10} height={h - 50}
            fill="none" stroke="var(--chalk-300)" strokeWidth={1}
            strokeDasharray="3 4" opacity={0.4} rx={6}/>

      {/* Rails */}
      <line x1={sourceX} y1={topY} x2={loadX} y2={topY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={sourceX} y1={botY} x2={loadX} y2={botY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>

      {/* I_N current source — vertical, with the rails entering through it */}
      <line x1={sourceX} y1={topY} x2={sourceX} y2={midY - 22}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={sourceX} y1={midY + 22} x2={sourceX} y2={botY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <CurrentSourceSymbolV cx={sourceX} cy={midY} color="var(--chalk-100)" label={null}/>
      <text x={sourceX - 28} y={midY + 6} textAnchor="end"
            fill="var(--chalk-100)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={14}>
        I<tspan baselineShift="sub" fontSize={9}>N</tspan>
      </text>

      {/* R_N parallel branch — vertical zigzag in the middle column */}
      <path d={zigzagV(rnX, midY - 32, midY + 32, 8, 6)}
            stroke="var(--amber-400)" strokeWidth={1.8} fill="none"/>
      <line x1={rnX} y1={topY} x2={rnX} y2={midY - 32}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={rnX} y1={midY + 32} x2={rnX} y2={botY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <text x={rnX + 18} y={midY + 6}
            fill="var(--chalk-100)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={14}>
        R<tspan baselineShift="sub" fontSize={9}>N</tspan>
      </text>

      {/* R_L on the far right — spans top rail to bottom rail */}
      <path d={zigzagV(loadX, topY, botY, 10)}
            stroke="var(--rose-400)" strokeWidth={2.2} fill="none"
            strokeLinecap="round" strokeLinejoin="round"/>
      <text x={loadX + 16} y={midY + 6}
            fill="var(--rose-300)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={fontMain}>
        R<tspan baselineShift="sub" fontSize={fontMain * 0.6}>L</tspan>
      </text>

      {/* Charge dots flowing down R_L — locked phase with Thévenin panel */}
      {Array.from({ length: numDots }).map((_, i) => {
        const u = ((phase + i / numDots) % 1);
        const yy = dotTop + (dotBot - dotTop) * u;
        return (
          <circle key={i} cx={loadX} cy={yy} r={3.5}
                  fill="var(--rose-300)" opacity={0.95}/>
        );
      })}
    </g>
  );
}

// ─── Beat 4: Norton driving a load — current divider gives same I_L ─────
// Genuine motion: charge dots from the I_N source split at the node between
// R_N (branch 1) and R_L (branch 2). The split ratio is fixed (50/50 for
// equal Rs), so the dot streams visualise the current-divider rule.
function LoadCurrentBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 520,
        srcX: 110, rnX: 290, loadX: 470,
        topY: 130, botY: 410,
        captionY: 500, fontMain: 18 }
    : { vbW: 1040, vbH: 380,
        srcX: 180, rnX: 500, loadX: 820,
        topY: 90, botY: 320,
        captionY: 370, fontMain: 18 };

  const midY = (G.topY + G.botY) / 2;
  // R_L spans the full rail height; dots flow inside the resistor body.
  const rlDotTop = G.topY + 14;
  const rlDotBot = G.botY - 14;

  // Two streams: one through R_N, one through R_L. Equal R for a 50/50 split.
  const period = 2.6;
  const NUM = 4;
  const phase = Math.max(0, localTime - 1.2) / period;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Rails */}
        <TraceIn d={`M ${G.srcX} ${G.topY} L ${G.loadX} ${G.topY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.5} delay={0.0}/>
        <TraceIn d={`M ${G.srcX} ${G.botY} L ${G.loadX} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.5} delay={0.0}/>

        {/* I_N source on left — between rails */}
        <TraceIn d={`M ${G.srcX} ${G.topY} L ${G.srcX} ${midY - 22}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={0.4}/>
        <TraceIn d={`M ${G.srcX} ${midY + 22} L ${G.srcX} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={0.4}/>
        <SvgFadeIn duration={0.4} delay={0.6}>
          <CurrentSourceSymbolV cx={G.srcX} cy={midY} color="var(--amber-400)" label={null}/>
          <text x={G.srcX - 30} y={midY + 6} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>
            I<tspan baselineShift="sub" fontSize={12}>N</tspan>
          </text>
        </SvgFadeIn>

        {/* R_N middle branch */}
        <TraceIn d={`M ${G.rnX} ${G.topY} L ${G.rnX} ${midY - 32}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={0.6}/>
        <TraceIn d={`M ${G.rnX} ${midY + 32} L ${G.rnX} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={0.6}/>
        <TraceIn d={zigzagV(G.rnX, midY - 32, midY + 32, 10, 6)}
          stroke="var(--amber-400)" strokeWidth={2.4} duration={0.5} delay={0.8}/>
        <SvgFadeIn duration={0.35} delay={1.1}>
          <text x={G.rnX + 22} y={midY + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>N</tspan>
          </text>
        </SvgFadeIn>

        {/* R_L right branch — spans top rail to bottom rail */}
        <TraceIn d={zigzagV(G.loadX, G.topY, G.botY, 12)}
          stroke="var(--rose-400)" strokeWidth={2.4} duration={0.6} delay={1.0}/>
        <SvgFadeIn duration={0.35} delay={1.4}>
          <text x={G.loadX + 22} y={midY + 6}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>L</tspan>
          </text>
        </SvgFadeIn>

        {/* Charge dots — two streams, one down each branch (R_N and R_L) */}
        {phase > 0 && (
          <SvgFadeIn duration={0.3} delay={1.2}>
            {Array.from({ length: NUM }).map((_, i) => {
              const u = ((phase + i / NUM) % 1);
              const y = (midY - 30) + ((midY + 30) - (midY - 30)) * u;
              return (
                <circle key={`rn-${i}`} cx={G.rnX} cy={y} r={3.5}
                        fill="var(--amber-300)" opacity={0.95}/>
              );
            })}
            {Array.from({ length: NUM }).map((_, i) => {
              const u = ((phase + i / NUM) % 1);
              const y = rlDotTop + (rlDotBot - rlDotTop) * u;
              return (
                <circle key={`rl-${i}`} cx={G.loadX} cy={y} r={3.5}
                        fill="var(--amber-300)" opacity={0.95}/>
              );
            })}
          </SvgFadeIn>
        )}

        {/* Current-divider formula */}
        <SvgFadeIn duration={0.5} delay={3.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 22 : 26}>
            I<tspan baselineShift="sub" fontSize={14}>L</tspan> = I<tspan baselineShift="sub" fontSize={14}>N</tspan> · R<tspan baselineShift="sub" fontSize={14}>N</tspan> / (R<tspan baselineShift="sub" fontSize={14}>N</tspan> + R<tspan baselineShift="sub" fontSize={14}>L</tspan>)
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
          maxWidth: portrait ? '22ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Thévenin and Norton are two faces of the same network.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
        }}>
        (in series → in parallel, just divide V_th by R_th)
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
