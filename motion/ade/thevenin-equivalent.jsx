// Thévenin's Theorem: Any Linear Circuit Becomes One Source — Manimo lesson scene.
// Any linear two-terminal network collapses to V_th in series with R_th.
// Genuine animation lives in Beat 5 (Equivalent): charge dots flow through
// both the original network's load and the Thévenin equivalent's load at
// identical rates, locked to a shared phase — the visual proof that the
// load can't tell the two circuits apart.
//
// Beats (timed to single-track narration in motion/ade/audio/thevenin-equivalent/):
//    0.00– 6.95  Manimo intro: a black box drives a load — what does the load see?
//    6.95–16.11  Original circuit: two sources, three resistors, a load on the right
//   16.11–25.79  Open the terminals → V_th is the open-circuit voltage
//   25.79–35.36  Zero the sources → R_th is the looking-back resistance
//   35.36–44.00  Side-by-side: original vs Thévenin equivalent, same I_L
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 5's parallel charge dots are the genuine motion: a single
//     useSprite() phase drives both loops so their flow rate stays locked.

const SCENE_DURATION = 44;

const NARRATION = [
  /*  0.00– 6.95 */ "A messy box of sources and resistors drives a load — how can we treat the whole thing as one battery?",
  /*  6.95–16.11 */ "Here is the network — two sources, three resistors, and a load on the right. The load sees a voltage at its terminals and a current through it.",
  /* 16.11–25.79 */ "Disconnect the load. The voltage that appears across the open terminals is V Thevenin — the open-circuit voltage of the network.",
  /* 25.79–35.36 */ "Now zero the independent sources — every voltage source becomes a wire. The resistance you see looking back into the terminals is R Thevenin.",
  /* 35.36–44.00 */ "Put V Thevenin in series with R Thevenin, reconnect the load, and the current is identical. The load can't tell the difference.",
];

const NARRATION_AUDIO = 'audio/thevenin-equivalent/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit analysis"
      title="Thévenin's Theorem: Any Linear Circuit Becomes One Source"
      duration={SCENE_DURATION}
      introEnd={6.95}
      introCaption="A two-terminal black box — what does the load really see?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.95} end={16.11}>
        <OriginalCircuitBeat />
      </Sprite>

      <Sprite start={16.11} end={25.79}>
        <OpenCircuitBeat />
      </Sprite>

      <Sprite start={25.79} end={35.36}>
        <ZeroSourcesBeat />
      </Sprite>

      <Sprite start={35.36} end={SCENE_DURATION}>
        <EquivalentBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared circuit helpers ──────────────────────────────────────────────
function zigzag(cx, yTop, yBot, amp = 12, n = 8) {
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

function BatterySymbolV({ cx, cy, color, shortFirst = false }) {
  // Vertical battery. Long plate (positive) above, short plate below by default.
  const longLen = 18, shortLen = 10;
  const top = shortFirst
    ? { len: shortLen, y: cy - 10 }
    : { len: longLen, y: cy - 10 };
  const bot = shortFirst
    ? { len: longLen, y: cy + 10 }
    : { len: shortLen, y: cy + 10 };
  return (
    <g>
      <line x1={cx - top.len} y1={top.y} x2={cx + top.len} y2={top.y}
            stroke={color} strokeWidth={3}/>
      <line x1={cx - bot.len} y1={bot.y} x2={cx + bot.len} y2={bot.y}
            stroke={color} strokeWidth={3}/>
    </g>
  );
}

// ─── Beat 2: Original circuit — two sources, three resistors, load ───────
function OriginalCircuitBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Geometry: a 4-node network. Two source-resistor branches meet at the
  // upper terminal; the lower rail returns to ground/lower terminal; R3
  // bridges between the upper terminal and the lower rail; the load R_L
  // sits to the right between terminals a (top) and b (bottom).
  const G = portrait
    ? { vbW: 600, vbH: 640,
        ltX: 90, midX: 240, rtX: 410, loadX: 530,
        topY: 130, midY: 320, botY: 510,
        zig: 16, captionY: 615, fontMain: 18, fontLabel: 13 }
    : { vbW: 1040, vbH: 420,
        ltX: 120, midX: 360, rtX: 620, loadX: 820,
        topY: 90, midY: 220, botY: 360,
        zig: 12, captionY: 405, fontMain: 18, fontLabel: 13 };

  // Charge dots flow through the load — one full loop period 3.0s.
  const NUM = 4;
  const period = 3.0;
  const flowT = Math.max(0, localTime - 3.6);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Two source branches join at midX/topY (node a). Bottom rail at botY (node b). */}
        {/* Top branch: V1 + R1 from ltX → midX along top rail */}
        <TraceIn d={`M ${G.ltX} ${G.botY} L ${G.ltX} ${G.topY} L ${G.midX} ${G.topY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.6} delay={0.2}/>
        <SvgFadeIn duration={0.4} delay={0.4}>
          <BatterySymbolV cx={G.ltX} cy={(G.topY + G.midY) / 2} color="var(--chalk-200)"/>
          <text x={G.ltX - 22} y={(G.topY + G.midY) / 2 + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>1</tspan>
          </text>
        </SvgFadeIn>
        {/* R1 — zigzag along the top wire between (ltX+40, topY) and (midX-40, topY) */}
        <TraceIn d={zigzagH(G.topY, G.ltX + 40, G.midX - 40, G.zig)}
          stroke="var(--amber-400)" strokeWidth={2.4} duration={0.6} delay={1.0}/>
        <SvgFadeIn duration={0.35} delay={1.4}>
          <text x={(G.ltX + G.midX) / 2} y={G.topY - 18} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>1</tspan>
          </text>
        </SvgFadeIn>

        {/* Bottom branch: V2 + R2 from rtX → midX along bottom-of-top route. */}
        {/* Connect midX/topY → rtX/topY → rtX/midY (where R3 bottom sits). */}
        <TraceIn d={`M ${G.midX} ${G.topY} L ${G.rtX} ${G.topY} L ${G.rtX} ${G.midY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.6} delay={0.4}/>
        <TraceIn d={zigzagH(G.topY, G.midX + 40, G.rtX - 40, G.zig)}
          stroke="var(--amber-400)" strokeWidth={2.4} duration={0.6} delay={1.4}/>
        <SvgFadeIn duration={0.35} delay={1.8}>
          <text x={(G.midX + G.rtX) / 2} y={G.topY - 18} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>2</tspan>
          </text>
        </SvgFadeIn>

        {/* R3 — vertical between midX/topY and midX/botY */}
        <TraceIn d={zigzag(G.midX, G.topY + 14, G.botY - 14, G.zig)}
          stroke="var(--amber-400)" strokeWidth={2.4} duration={0.6} delay={1.8}/>
        <SvgFadeIn duration={0.35} delay={2.2}>
          <text x={G.midX + G.zig + 18} y={G.midY + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>3</tspan>
          </text>
        </SvgFadeIn>

        {/* V2 in the right branch — vertical battery on the right between top and midY */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <BatterySymbolV cx={G.rtX} cy={(G.topY + G.midY) / 2 + 12} color="var(--chalk-200)" shortFirst={true}/>
          <text x={G.rtX + 22} y={(G.topY + G.midY) / 2 + 18}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>2</tspan>
          </text>
        </SvgFadeIn>

        {/* Bottom rail — from ltX/botY across to loadX/botY */}
        <TraceIn d={`M ${G.ltX} ${G.botY} L ${G.loadX + 30} ${G.botY} L ${G.loadX + 30} ${G.midY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.8} delay={0.2}/>

        {/* Connecting wire from midX/botY → bottom rail (already on it) — just join */}
        <TraceIn d={`M ${G.midX} ${G.botY} L ${G.midX} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.1} delay={0.3}/>

        {/* Wire from rtX/midY across to loadX (terminal a) and load to bottom rail (terminal b) */}
        <TraceIn d={`M ${G.rtX} ${G.midY} L ${G.loadX - 30} ${G.midY} L ${G.loadX - 30} ${G.midY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.4} delay={2.4}/>

        {/* Load R_L — vertical between (loadX/midY) and (loadX/botY-ish), connecting to top rail at midY */}
        <TraceIn d={`M ${G.loadX - 30} ${G.midY} L ${G.loadX} ${G.midY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={2.8}/>
        <TraceIn d={zigzag(G.loadX, G.midY + 8, G.botY - 8, G.zig)}
          stroke="var(--rose-400)" strokeWidth={2.4} duration={0.6} delay={3.0}/>
        <SvgFadeIn duration={0.35} delay={3.4}>
          <text x={G.loadX + G.zig + 18} y={(G.midY + G.botY) / 2 + 6}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>L</tspan>
          </text>
        </SvgFadeIn>

        {/* Terminal markers a and b */}
        <SvgFadeIn duration={0.35} delay={2.8}>
          <circle cx={G.loadX - 30} cy={G.midY} r={4}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.loadX - 16} y={G.midY - 8}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">a</text>
          <circle cx={G.loadX - 30} cy={G.botY} r={4}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.loadX - 16} y={G.botY + 16}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">b</text>
        </SvgFadeIn>

        {/* I_L current arrow — small chevron above the load resistor body */}
        <SvgFadeIn duration={0.4} delay={3.2}>
          <path d={`M ${G.loadX - 14} ${G.midY + 28} L ${G.loadX - 14} ${G.midY + 52}`}
                stroke="var(--rose-400)" strokeWidth={2}/>
          <path d={`M ${G.loadX - 14} ${G.midY + 52} L ${G.loadX - 19} ${G.midY + 44} L ${G.loadX - 9} ${G.midY + 44} Z`}
                fill="var(--rose-400)"/>
          <text x={G.loadX - 28} y={G.midY + 44} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            I<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>L</tspan>
          </text>
        </SvgFadeIn>

        {/* Charge dots flowing through the load — genuine motion. */}
        {flowT > 0 && (
          <SvgFadeIn duration={0.3} delay={3.6}>
            {Array.from({ length: NUM }).map((_, i) => {
              const u = ((flowT / period + i / NUM) % 1);
              // Travel down R_L from midY → botY
              const y = G.midY + 8 + (G.botY - 8 - G.midY - 8) * u;
              return (
                <circle key={i} cx={G.loadX} cy={y} r={3.5}
                        fill="var(--rose-300)" opacity={0.95}/>
              );
            })}
          </SvgFadeIn>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            from the load's perspective, the rest is a black box
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Open the terminals → measure V_th ───────────────────────────
function OpenCircuitBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = portrait
    ? { vbW: 600, vbH: 640,
        ltX: 90, midX: 240, rtX: 410, loadX: 530,
        topY: 130, midY: 320, botY: 510,
        zig: 16, captionY: 615, fontMain: 18, fontLabel: 13,
        vmCx: 545, vmCy: 415 }
    : { vbW: 1040, vbH: 420,
        ltX: 120, midX: 360, rtX: 620, loadX: 820,
        topY: 90, midY: 220, botY: 360,
        zig: 12, captionY: 405, fontMain: 18, fontLabel: 13,
        vmCx: 880, vmCy: 290 };

  // Load slides off to the right after 0.8s — translate by 80px
  const slideT = clamp((localTime - 0.4) / 0.8, 0, 1);
  const slideDx = 80 * Easing.easeOutCubic(slideT);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Static network — drawn pre-built (no Trace) */}
        <SvgFadeIn duration={0.3} delay={0}>
          {/* Top branch */}
          <path d={`M ${G.ltX} ${G.botY} L ${G.ltX} ${G.topY} L ${G.midX} ${G.topY}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          <BatterySymbolV cx={G.ltX} cy={(G.topY + G.midY) / 2} color="var(--chalk-200)"/>
          <path d={zigzagH(G.topY, G.ltX + 40, G.midX - 40, G.zig)}
                stroke="var(--amber-400)" strokeWidth={2.4} fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
          {/* Second branch (top wire to rtX, R2 zig) */}
          <path d={`M ${G.midX} ${G.topY} L ${G.rtX} ${G.topY} L ${G.rtX} ${G.midY}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          <path d={zigzagH(G.topY, G.midX + 40, G.rtX - 40, G.zig)}
                stroke="var(--amber-400)" strokeWidth={2.4} fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
          <BatterySymbolV cx={G.rtX} cy={(G.topY + G.midY) / 2 + 12} color="var(--chalk-200)" shortFirst={true}/>
          {/* R3 vertical */}
          <path d={zigzag(G.midX, G.topY + 14, G.botY - 14, G.zig)}
                stroke="var(--amber-400)" strokeWidth={2.4} fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
          {/* Bottom rail */}
          <path d={`M ${G.ltX} ${G.botY} L ${G.midX} ${G.botY} L ${G.loadX - 30} ${G.botY}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          {/* Open terminal stub (top + bot to a/b dots) */}
          <path d={`M ${G.rtX} ${G.midY} L ${G.loadX - 30} ${G.midY}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
        </SvgFadeIn>

        {/* Terminal dots and labels */}
        <SvgFadeIn duration={0.3} delay={0.1}>
          <circle cx={G.loadX - 30} cy={G.midY} r={5}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <circle cx={G.loadX - 30} cy={G.botY} r={5}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.loadX - 30} y={G.midY - 14} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">a</text>
          <text x={G.loadX - 30} y={G.botY + 22} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">b</text>
        </SvgFadeIn>

        {/* Load (R_L) — translated away as it disconnects, then fully fades
            so the rose zigzag doesn't bleed over the voltmeter symbol. */}
        <g style={{ transform: `translateX(${slideDx}px)`, opacity: 1 - slideT }}>
          <path d={zigzag(G.loadX, G.midY + 8, G.botY - 8, G.zig)}
                stroke="var(--rose-400)" strokeWidth={2.2} fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
        </g>

        {/* Voltmeter across the terminals — fades in once the load has gone */}
        <SvgFadeIn duration={0.5} delay={1.4}>
          <circle cx={G.vmCx} cy={G.vmCy} r={26}
                  fill="none" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.vmCx} y={G.vmCy + 6} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>V</text>
          {/* Leads to a and b */}
          <path d={`M ${G.loadX - 30} ${G.midY} L ${G.vmCx - 18} ${G.midY} L ${G.vmCx - 18} ${G.vmCy - 18}`}
                stroke="var(--amber-300)" strokeWidth={1.6} fill="none"
                strokeDasharray="4 4"/>
          <path d={`M ${G.loadX - 30} ${G.botY} L ${G.vmCx + 18} ${G.botY} L ${G.vmCx + 18} ${G.vmCy + 18}`}
                stroke="var(--amber-300)" strokeWidth={1.6} fill="none"
                strokeDasharray="4 4"/>
        </SvgFadeIn>

        {/* V_th formula label */}
        <SvgFadeIn duration={0.5} delay={3.0}>
          <text x={G.vmCx} y={G.vmCy + 56} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>
            V<tspan baselineShift="sub" fontSize={12}>th</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            open-circuit voltage at the terminals
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Zero the sources → measure R_th ─────────────────────────────
function ZeroSourcesBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 640,
        ltX: 90, midX: 240, rtX: 410, loadX: 530,
        topY: 130, midY: 320, botY: 510,
        zig: 16, captionY: 615, fontMain: 18, fontLabel: 13,
        ohmCx: 545, ohmCy: 415 }
    : { vbW: 1040, vbH: 420,
        ltX: 120, midX: 360, rtX: 620, loadX: 820,
        topY: 90, midY: 220, botY: 360,
        zig: 12, captionY: 405, fontMain: 18, fontLabel: 13,
        ohmCx: 880, ohmCy: 290 };

  // Batteries fade out from t=0.4 → t=1.4 and short wires fade in
  const swap = clamp((localTime - 0.4) / 1.0, 0, 1);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Static rails */}
        <SvgFadeIn duration={0.3} delay={0}>
          <path d={`M ${G.ltX} ${G.botY} L ${G.ltX} ${G.topY} L ${G.midX} ${G.topY}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          <path d={zigzagH(G.topY, G.ltX + 40, G.midX - 40, G.zig)}
                stroke="var(--amber-400)" strokeWidth={2.4} fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
          <path d={`M ${G.midX} ${G.topY} L ${G.rtX} ${G.topY} L ${G.rtX} ${G.midY}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          <path d={zigzagH(G.topY, G.midX + 40, G.rtX - 40, G.zig)}
                stroke="var(--amber-400)" strokeWidth={2.4} fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
          <path d={zigzag(G.midX, G.topY + 14, G.botY - 14, G.zig)}
                stroke="var(--amber-400)" strokeWidth={2.4} fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
          <path d={`M ${G.ltX} ${G.botY} L ${G.midX} ${G.botY} L ${G.loadX - 30} ${G.botY}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          <path d={`M ${G.rtX} ${G.midY} L ${G.loadX - 30} ${G.midY}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
        </SvgFadeIn>

        {/* Batteries fade out, replaced by a short wire stroke fading in */}
        <g opacity={1 - swap}>
          <BatterySymbolV cx={G.ltX} cy={(G.topY + G.midY) / 2} color="var(--chalk-300)"/>
          <BatterySymbolV cx={G.rtX} cy={(G.topY + G.midY) / 2 + 12} color="var(--chalk-300)" shortFirst={true}/>
        </g>
        <g opacity={swap}>
          {/* Replacement wires where the batteries used to be — straight lines through the same nodes */}
          <line x1={G.ltX} y1={(G.topY + G.midY) / 2 - 14}
                x2={G.ltX} y2={(G.topY + G.midY) / 2 + 14}
                stroke="var(--chalk-100)" strokeWidth={2.4}/>
          <line x1={G.rtX} y1={(G.topY + G.midY) / 2 - 2}
                x2={G.rtX} y2={(G.topY + G.midY) / 2 + 26}
                stroke="var(--chalk-100)" strokeWidth={2.4}/>
          {/* "shorted" hint labels */}
          <text x={G.ltX - 22} y={(G.topY + G.midY) / 2 + 6} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.1em">0V</text>
          <text x={G.rtX + 22} y={(G.topY + G.midY) / 2 + 18}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.1em">0V</text>
        </g>

        {/* Terminal dots */}
        <SvgFadeIn duration={0.3} delay={0.1}>
          <circle cx={G.loadX - 30} cy={G.midY} r={5}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <circle cx={G.loadX - 30} cy={G.botY} r={5}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.loadX - 30} y={G.midY - 14} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">a</text>
          <text x={G.loadX - 30} y={G.botY + 22} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">b</text>
        </SvgFadeIn>

        {/* Ohmmeter symbol — circle with Ω inside */}
        <SvgFadeIn duration={0.5} delay={2.0}>
          <circle cx={G.ohmCx} cy={G.ohmCy} r={26}
                  fill="none" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.ohmCx} y={G.ohmCy + 7} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={22}>Ω</text>
          <path d={`M ${G.loadX - 30} ${G.midY} L ${G.ohmCx - 18} ${G.midY} L ${G.ohmCx - 18} ${G.ohmCy - 18}`}
                stroke="var(--amber-300)" strokeWidth={1.6} fill="none"
                strokeDasharray="4 4"/>
          <path d={`M ${G.loadX - 30} ${G.botY} L ${G.ohmCx + 18} ${G.botY} L ${G.ohmCx + 18} ${G.ohmCy + 18}`}
                stroke="var(--amber-300)" strokeWidth={1.6} fill="none"
                strokeDasharray="4 4"/>
        </SvgFadeIn>

        {/* R_th label */}
        <SvgFadeIn duration={0.5} delay={3.4}>
          <text x={G.ohmCx} y={G.ohmCy + 56} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>
            R<tspan baselineShift="sub" fontSize={12}>th</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            zero the sources, look back into the terminals
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Equivalent — original vs Thévenin, same I_L ─────────────────
// Both circuits get charge dots in lock-step. A single useSprite() phase
// drives both loops so the viewer sees identical flow rates.
function EquivalentBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Two stacked panels — original (top), equivalent (bottom). The geometry
  // is identical between aspects except the panel height per row.
  const L = portrait
    ? { vbW: 620, vbH: 800,
        ox: 60, oy: 60, ow: 500, oh: 320,
        ex: 60, ey: 420, ew: 500, eh: 320,
        fontMain: 18 }
    : { vbW: 1100, vbH: 480,
        ox: 50, oy: 30, ow: 480, oh: 420,
        ex: 580, ey: 30, ew: 480, eh: 420,
        fontMain: 18 };

  // Shared phase for both loops — locked I_L animation.
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
        {/* Panel 1 — original (compact thumbnail of the messy network) */}
        <SvgFadeIn duration={0.5} delay={0.3}>
          <MiniNetwork x={L.ox} y={L.oy} w={L.ow} h={L.oh} variant="original"
                       phase={phase} numDots={NUM} fontMain={L.fontMain}/>
        </SvgFadeIn>

        {/* Panel 2 — Thévenin equivalent */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <MiniNetwork x={L.ex} y={L.ey} w={L.ew} h={L.eh} variant="thevenin"
                       phase={phase} numDots={NUM} fontMain={L.fontMain}/>
        </SvgFadeIn>

        {/* "= same I_L" connector between panels */}
        <SvgFadeIn duration={0.5} delay={2.2}>
          {portrait ? (
            <g>
              <line x1={L.vbW / 2 - 40} y1={L.oy + L.oh + 20}
                    x2={L.vbW / 2 + 40} y2={L.oy + L.oh + 20}
                    stroke="var(--rose-300)" strokeWidth={2}/>
              <text x={L.vbW / 2} y={L.oy + L.oh + 12} textAnchor="middle"
                    fill="var(--rose-300)" fontFamily="var(--font-mono)"
                    fontSize={13} letterSpacing="0.1em">SAME I_L</text>
            </g>
          ) : (
            <g>
              <line x1={L.ox + L.ow + 8} y1={L.vbH / 2}
                    x2={L.ex - 8} y2={L.vbH / 2}
                    stroke="var(--rose-300)" strokeWidth={2}/>
              <text x={(L.ox + L.ow + L.ex) / 2} y={L.vbH / 2 - 8} textAnchor="middle"
                    fill="var(--rose-300)" fontFamily="var(--font-mono)"
                    fontSize={13} letterSpacing="0.1em">SAME I_L</text>
            </g>
          )}
        </SvgFadeIn>

        {/* Bottom takeaway formula */}
        <SvgFadeIn duration={0.5} delay={3.4}>
          <text x={L.vbW / 2} y={L.vbH - 16} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 24 : 28}>
            I<tspan baselineShift="sub" fontSize={14}>L</tspan> = V<tspan baselineShift="sub" fontSize={14}>th</tspan> / (R<tspan baselineShift="sub" fontSize={14}>th</tspan> + R<tspan baselineShift="sub" fontSize={14}>L</tspan>)
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

function MiniNetwork({ x, y, w, h, variant, phase, numDots, fontMain }) {
  // Each panel is a small box with R_L on the right and either a messy
  // network (variant === 'original') or a Thévenin source (variant ===
  // 'thevenin') on the left. Charge dots travel the right column down
  // R_L using a phase that's shared between both panels.
  const padL = 30;
  const padR = 60;
  const innerW = w - padL - padR;
  const loadX = x + w - padR + 8;
  const topY = y + 50;
  const botY = y + h - 60;
  const midY = (topY + botY) / 2;

  // Charge dots travel down R_L (y from midY+6 to botY-6).
  const yTop = midY + 8;
  const yBot = botY - 8;

  return (
    <g>
      {/* Panel label */}
      <text x={x + 6} y={y + 22}
            fill={variant === 'original' ? 'var(--chalk-200)' : 'var(--amber-300)'}
            fontFamily="var(--font-mono)" fontSize={12}
            letterSpacing="0.16em">
        {(variant === 'original' ? 'ORIGINAL NETWORK' : 'THÉVENIN EQUIVALENT')}
      </text>

      {/* Box outline */}
      <rect x={x} y={y + 30} width={w - padR} height={h - 50}
            fill="none" stroke="var(--chalk-300)" strokeWidth={1}
            strokeDasharray="3 4" opacity={0.4} rx={6}/>

      {/* Inside of the box: variant-specific content */}
      {variant === 'original' ? (
        <g>
          {/* A small "messy" network — 2 batteries, a couple of zigzags */}
          <line x1={x + 20} y1={topY} x2={x + padL + innerW - 30} y2={topY}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <path d={zigzagH(topY, x + 50, x + 110, 8)}
                stroke="var(--amber-400)" strokeWidth={1.8} fill="none"/>
          <path d={zigzagH(topY, x + 130, x + 190, 8)}
                stroke="var(--amber-400)" strokeWidth={1.8} fill="none"/>
          <path d={zigzag(x + 215, topY + 10, botY - 10, 10)}
                stroke="var(--amber-400)" strokeWidth={1.8} fill="none"/>
          <BatterySymbolV cx={x + 20} cy={(topY + midY) / 2}
                          color="var(--chalk-200)"/>
          <line x1={x + 20} y1={botY} x2={x + padL + innerW - 30} y2={botY}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <line x1={x + 20} y1={topY} x2={x + 20} y2={(topY + midY) / 2 - 10}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <line x1={x + 20} y1={(topY + midY) / 2 + 10} x2={x + 20} y2={botY}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
        </g>
      ) : (
        <g>
          {/* V_th symbol on left, R_th zigzag on top wire */}
          <line x1={x + 20} y1={topY} x2={loadX - 20} y2={topY}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <BatterySymbolV cx={x + 20} cy={midY} color="var(--chalk-100)"/>
          <line x1={x + 20} y1={topY} x2={x + 20} y2={midY - 10}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <line x1={x + 20} y1={midY + 10} x2={x + 20} y2={botY}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <line x1={x + 20} y1={botY} x2={loadX - 20} y2={botY}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <path d={zigzagH(topY, x + 80, x + 160, 10)}
                stroke="var(--amber-400)" strokeWidth={1.8} fill="none"/>
          <text x={x + 120} y={topY - 14} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>
            R<tspan baselineShift="sub" fontSize={9}>th</tspan>
          </text>
          <text x={x + 38} y={midY + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>
            V<tspan baselineShift="sub" fontSize={9}>th</tspan>
          </text>
        </g>
      )}

      {/* Right-side terminal stubs + load (R_L) */}
      <line x1={x + padL + innerW - 30} y1={topY}
            x2={loadX - 10} y2={topY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={x + padL + innerW - 30} y1={botY}
            x2={loadX - 10} y2={botY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={loadX - 10} y1={topY} x2={loadX + 10} y2={topY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={loadX - 10} y1={botY} x2={loadX + 10} y2={botY}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <path d={zigzag(loadX, yTop, yBot, 10)}
            stroke="var(--rose-400)" strokeWidth={2.2} fill="none"
            strokeLinecap="round" strokeLinejoin="round"/>
      <text x={loadX + 16} y={midY + 6}
            fill="var(--rose-300)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={fontMain}>
        R<tspan baselineShift="sub" fontSize={fontMain * 0.6}>L</tspan>
      </text>

      {/* Charge dots flowing down R_L — phase shared across both panels */}
      {Array.from({ length: numDots }).map((_, i) => {
        const u = ((phase + i / numDots) % 1);
        const yy = yTop + (yBot - yTop) * u;
        return (
          <circle key={i} cx={loadX} cy={yy} r={3.5}
                  fill="var(--rose-300)" opacity={0.95}/>
        );
      })}
    </g>
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
