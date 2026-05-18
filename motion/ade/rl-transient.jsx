// RL Transient: Why an Inductor Slows the Current — Manimo lesson scene.
//
// Series RL transient. Flip the switch and the current refuses to jump —
// instead it rises along i(t) = (V/R)·(1 − e^{−t/τ}) with τ = L/R, while
// the voltage across the inductor decays from V down to zero. Genuine
// animation lives in Beat 3: a time cursor sweeps left-to-right and
// BOTH curves (current rising amber, voltage decaying rose) trace in
// synchronously — the mirror image is the visual punchline.
//
// Beats (placeholder timings — overwritten by scripts/rewire-scene.js
// once audio is generated):
//    0.00– 5.00  Manimo enters; hook caption
//    5.00–14.00  Series RL circuit, switch closes, back-emf opposes current
//   14.00–26.00  Twin curves: i rises, V_L decays, cursor sweep ties them
//   26.00–35.00  τ = L/R; markers at t=τ (63%) and t=5τ (~99%)
//   35.00–42.00  Takeaway
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM.
//   • Beat 2's back-emf arrow grows then shrinks tied to dI/dt — at switch
//     close it's tallest, decaying with the current's settle.

const SCENE_DURATION = 46;

const NARRATION = [
  /*  0.00– 5.62 */ "Flip a switch onto an inductor — and the current refuses to jump. What's stopping it?",
  /*  5.62–14.57 */ 'Battery V in series with a resistor R and an inductor L. Close the switch — current starts to rise, but the inductor pushes back.',
  /* 14.57–25.02 */ 'The current rises along an exponential curve toward V over R, while the voltage across the inductor decays from V down to zero — perfect mirror images.',
  /* 25.02–35.12 */ 'Tau equals L over R is the time constant. After one tau the current has reached sixty three percent of its final value. After five tau it is essentially full.',
  /* 35.12–46.00 */ 'Bigger L slows the rise; bigger R hurries it. The time constant L over R sets the rhythm — the exact opposite trade-off from R C.',
];

const NARRATION_AUDIO = 'audio/rl-transient/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="reactive elements"
      title="RL Transient: Why an Inductor Slows the Current"
      duration={SCENE_DURATION}
      introEnd={5.62}
      introCaption="Switch closes — but the current eases in. Why?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.62} end={14.57}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={14.57} end={25.02}>
        <TwinCurvesBeat />
      </Sprite>

      <Sprite start={25.02} end={35.12}>
        <TimeConstantBeat />
      </Sprite>

      <Sprite start={35.12} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Series RL circuit + switch + back-emf opposing current ──────
// Loop: battery on left vertical, switch on top wire, resistor R on right
// vertical (upper segment), inductor L (coil) on right vertical (lower
// segment), wire on bottom returns to battery. The dynamic element is a
// rose arrow on the inductor whose length tracks dI/dt — tall at the
// instant the switch closes, shrinks as the current settles.
function CircuitBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 720, left: 130, right: 470, top: 110, bot: 580,
        battH: 72, resW: 56, switchLen: 64, coilR: 34, coilN: 4,
        fontLabel: 20, fontCap: 14, captionY: 660 }
    : { vbW: 820, vbH: 400, left: 200, right: 620, top: 70, bot: 340,
        battH: 70, resW: 56, switchLen: 64, coilR: 32, coilN: 4,
        fontLabel: 20, fontCap: 14, captionY: 380 };

  const midY = (G.top + G.bot) / 2;
  const switchMidX = (G.left + G.right) / 2;
  const switchLeftX = switchMidX - G.switchLen / 2;
  const switchRightX = switchMidX + G.switchLen / 2;
  const battTop = midY - G.battH / 2;
  const battBot = midY + G.battH / 2;
  const resTop = G.top + 30;
  const resBot = midY - 24;
  const coilTop = midY + 30;
  const coilBot = G.bot - 30;
  const coilSpan = coilBot - coilTop;
  const coilStep = coilSpan / G.coilN;

  // Switch animation: open until t=3.0, then rotates closed over 0.4s.
  const switchT = clamp((localTime - 3.0) / 0.4, 0, 1);
  const openAngle = 32;
  const angle = openAngle * (1 - switchT);
  const angRad = (angle * Math.PI) / 180;
  const closed = switchT >= 1;

  // di/dt (and hence back-emf magnitude) is proportional to e^{-t/τ_vis}.
  // It peaks at the switch-close instant and decays — so the rose arrow
  // shrinks as the system settles.
  const sinceClose = Math.max(0, localTime - 3.4);
  const tauVis = 3.5;
  const emfFrac = Math.exp(-sinceClose / tauVis);
  // Current dots: integrated travel grows along (1 − e^{−t/τ}).
  const peakSpeed = 180;
  const travelAtCloseToNow = peakSpeed * tauVis * (1 - emfFrac);

  // Loop perimeter (clockwise from top-left corner):
  // 1. top wire L→R, 2. right wire T→B, 3. bottom wire R→L, 4. left wire B→T.
  const segs = [
    { x1: G.left, y1: G.top, x2: G.right, y2: G.top, len: G.right - G.left },
    { x1: G.right, y1: G.top, x2: G.right, y2: G.bot, len: G.bot - G.top },
    { x1: G.right, y1: G.bot, x2: G.left, y2: G.bot, len: G.right - G.left },
    { x1: G.left, y1: G.bot, x2: G.left, y2: G.top, len: G.bot - G.top },
  ];
  const perimeter = segs.reduce((s, x) => s + x.len, 0);
  function dotAt(distance) {
    let d = ((distance % perimeter) + perimeter) % perimeter;
    for (const s of segs) {
      if (d <= s.len) {
        const f = d / s.len;
        return [s.x1 + (s.x2 - s.x1) * f, s.y1 + (s.y2 - s.y1) * f];
      }
      d -= s.len;
    }
    return [0, 0];
  }
  const dotCount = 6;
  const dotAlpha = clamp(1 - emfFrac * 0.4, 0.3, 1);
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const base = (i / dotCount) * perimeter;
    return dotAt(base + travelAtCloseToNow);
  });

  // Inductor coil as a sequence of cubic-Bezier humps bulging right off
  // the wire. Each hump from (right, yA) to (right, yB) has control points
  // pulled right by coilR — bulge is unmistakable at chalkboard scale.
  const coilD = (() => {
    const parts = [`M ${G.right} ${coilTop}`];
    for (let i = 0; i < G.coilN; i++) {
      const yA = coilTop + i * coilStep;
      const yB = coilTop + (i + 1) * coilStep;
      const cx = G.right + G.coilR;
      const cy1 = yA + coilStep * 0.15;
      const cy2 = yB - coilStep * 0.15;
      parts.push(`C ${cx} ${cy1.toFixed(2)} ${cx} ${cy2.toFixed(2)} ${G.right} ${yB.toFixed(2)}`);
    }
    return parts.join(' ');
  })();

  // Back-emf indicator on the inductor: arrow whose length scales with emfFrac.
  // It points UPWARD (opposing the assumed downward current on the right
  // wire). Arrow tail rises from coil centre; length max 50, decays to ~0.
  const emfX = G.right + G.coilR + 30;
  const emfCenterY = (coilTop + coilBot) / 2;
  const emfLen = 18 + 32 * emfFrac;
  const emfTailY = emfCenterY + emfLen / 2;
  const emfTipY = emfCenterY - emfLen / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Left vertical wire — split around the battery */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.left} y1={G.top} x2={G.left} y2={battTop} stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.left} y1={battBot} x2={G.left} y2={G.bot} stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Battery: long/short plate pairs */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <line x1={G.left - 22} y1={battTop} x2={G.left + 22} y2={battTop}
                stroke="var(--amber-300)" strokeWidth={3}/>
          <line x1={G.left - 12} y1={battTop + 14} x2={G.left + 12} y2={battTop + 14}
                stroke="var(--amber-300)" strokeWidth={2.5}/>
          <line x1={G.left - 22} y1={battBot - 14} x2={G.left + 22} y2={battBot - 14}
                stroke="var(--amber-300)" strokeWidth={3}/>
          <line x1={G.left - 12} y1={battBot} x2={G.left + 12} y2={battBot}
                stroke="var(--amber-300)" strokeWidth={2.5}/>
          <text x={G.left - 36} y={midY + 6} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>V</text>
        </SvgFadeIn>

        {/* Top wire broken around the switch */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={G.left} y1={G.top} x2={switchLeftX} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={switchRightX} y1={G.top} x2={G.right} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <circle cx={switchLeftX} cy={G.top} r={3.5} fill="var(--chalk-200)"/>
          <circle cx={switchRightX} cy={G.top} r={3.5} fill="var(--chalk-200)"/>
        </SvgFadeIn>

        {/* Switch lever — rotates closed at delay=3.0 */}
        <SvgFadeIn duration={0.3} delay={1.0}>
          <line x1={switchLeftX} y1={G.top}
                x2={switchLeftX + G.switchLen * Math.cos(angRad)}
                y2={G.top - G.switchLen * Math.sin(angRad)}
                stroke={closed ? 'var(--amber-400)' : 'var(--rose-400)'}
                strokeWidth={2.5} strokeLinecap="round"/>
        </SvgFadeIn>

        {/* Right vertical wire — split around resistor + inductor */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <line x1={G.right} y1={G.top} x2={G.right} y2={resTop} stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.right} y1={resBot} x2={G.right} y2={coilTop} stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.right} y1={coilBot} x2={G.right} y2={G.bot} stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Resistor zigzag */}
        <SvgFadeIn duration={0.5} delay={0.7}>
          {(() => {
            const N = 6;
            const dy = (resBot - resTop) / N;
            const pts = [`M ${G.right} ${resTop}`];
            for (let i = 1; i < N; i++) {
              const x = G.right + (i % 2 === 1 ? G.resW / 2 : -G.resW / 2);
              const y = resTop + i * dy;
              pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
            }
            pts.push(`L ${G.right} ${resBot}`);
            return <path d={pts.join(' ')} fill="none" stroke="var(--amber-400)" strokeWidth={2.2}/>;
          })()}
          <text x={G.right + G.resW / 2 + 10} y={(resTop + resBot) / 2 + 4}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontLabel}>R</text>
        </SvgFadeIn>

        {/* Inductor coil */}
        <SvgFadeIn duration={0.5} delay={0.8}>
          <path d={coilD} fill="none" stroke="var(--amber-400)" strokeWidth={2.8}/>
          <text x={G.right - G.coilR - 12} y={(coilTop + coilBot) / 2 + 5} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontLabel}>L</text>
        </SvgFadeIn>

        {/* Bottom wire */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={G.left} y1={G.bot} x2={G.right} y2={G.bot} stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Current dots — flow only after switch closes */}
        {closed && (
          <g opacity={dotAlpha}>
            {dots.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={4.5}
                      fill="var(--amber-300)"/>
            ))}
          </g>
        )}

        {/* Back-emf arrow on the inductor — only after switch closes,
            length proportional to dI/dt. Up-pointing arrow + label. */}
        {closed && emfFrac > 0.05 && (
          <SvgFadeIn duration={0.35} delay={0}>
            <g opacity={Math.min(1, emfFrac * 1.6 + 0.15)}>
              <line x1={emfX} y1={emfTailY} x2={emfX} y2={emfTipY}
                    stroke="var(--rose-400)" strokeWidth={2.5}/>
              <path d={`M ${emfX} ${emfTipY} L ${emfX - 6} ${emfTipY + 10} L ${emfX + 6} ${emfTipY + 10} Z`}
                    fill="var(--rose-400)"/>
              <text x={emfX + 14} y={emfCenterY + 5}
                    fill="var(--rose-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.fontLabel - 2}>
                V<tspan baselineShift="sub" fontSize={(G.fontLabel - 2) * 0.65}>L</tspan>
              </text>
            </g>
          </SvgFadeIn>
        )}

        {/* Caption beneath */}
        <SvgFadeIn duration={0.4} delay={7.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCap} letterSpacing="0.02em">
            the inductor opposes any change in current
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Twin curves — i rises while V_L decays, cursor sweeps ──────
// Two value-driven curves on the same chart. As the cursor sweeps, the
// amber curve traces from 0 up toward V/R while the rose curve traces
// from V down toward 0 — same time axis, the visual mirror is the point.
function TwinCurvesBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const sweepStart = 1.0;
  const sweepEnd = 9.0;
  const sweepFrac = clamp((localTime - sweepStart) / (sweepEnd - sweepStart), 0, 1);
  const tNormalised = sweepFrac * 5; // 0..5τ
  const iFrac = 1 - Math.exp(-tNormalised);
  const vFrac = Math.exp(-tNormalised);

  const G = portrait
    ? { vbW: 600, vbH: 920,
        gx0: 90, gx1: 540, gy0: 130, gy1: 720,
        fontAxis: 14, fontTick: 11, fontFormula: 22, fontLegend: 13,
        formulaY: 880 }
    : { vbW: 1100, vbH: 460,
        gx0: 160, gx1: 940, gy0: 80, gy1: 360,
        fontAxis: 14, fontTick: 12, fontFormula: 26, fontLegend: 14,
        formulaY: 430 };

  const gw = G.gx1 - G.gx0;
  const gh = G.gy1 - G.gy0;

  // Curve samples up to sweepFrac for live trace.
  const samples = 80;
  const iPts = [];
  const vPts = [];
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    if (f > sweepFrac) break;
    const tn = f * 5;
    const v = Math.exp(-tn);
    const ii = 1 - v;
    iPts.push(`${G.gx0 + f * gw},${G.gy1 - ii * gh}`);
    vPts.push(`${G.gx0 + f * gw},${G.gy1 - v * gh}`);
  }

  const cursorX = G.gx0 + sweepFrac * gw;
  const iCursorY = G.gy1 - iFrac * gh;
  const vCursorY = G.gy1 - vFrac * gh;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Axes */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.gx0} y1={G.gy1} x2={G.gx1} y2={G.gy1} stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <line x1={G.gx0} y1={G.gy0} x2={G.gx0} y2={G.gy1} stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={G.gx1 + 14} y={G.gy1 + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontAxis}>t</text>
          {/* Top tick: V/R for current, V for voltage — share the row */}
          <line x1={G.gx0 - 5} y1={G.gy0} x2={G.gx0 + 4} y2={G.gy0}
                stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.gx0 - 10} y={G.gy0 + 4} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>V/R</text>
          <text x={G.gx0 - 10} y={G.gy0 + 4 + G.fontTick + 3} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>V</text>
          <text x={G.gx0 - 8} y={G.gy1 + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>0</text>
          {/* τ tick on x */}
          <line x1={G.gx0 + gw / 5} y1={G.gy1 - 4} x2={G.gx0 + gw / 5} y2={G.gy1 + 4}
                stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.gx0 + gw / 5} y={G.gy1 + 18} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontAxis}>τ</text>
        </SvgFadeIn>

        {/* Asymptote dashed lines */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <line x1={G.gx0} y1={G.gy0} x2={G.gx1} y2={G.gy0}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="5 5" opacity={0.4}/>
        </SvgFadeIn>

        {/* Live current curve (amber, rising) */}
        {iPts.length > 1 && (
          <polyline points={iPts.join(' ')} fill="none"
                    stroke="var(--amber-400)" strokeWidth={2.6}
                    strokeLinecap="round" strokeLinejoin="round"/>
        )}
        {/* Live inductor-voltage curve (rose, decaying) */}
        {vPts.length > 1 && (
          <polyline points={vPts.join(' ')} fill="none"
                    stroke="var(--rose-400)" strokeWidth={2.6}
                    strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Time cursor + value dots on both curves */}
        {localTime >= sweepStart && (
          <g>
            <line x1={cursorX} y1={G.gy0} x2={cursorX} y2={G.gy1}
                  stroke="var(--chalk-200)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5}/>
            <circle cx={cursorX} cy={iCursorY} r={5}
                    fill="var(--amber-400)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
            <circle cx={cursorX} cy={vCursorY} r={5}
                    fill="var(--rose-400)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
          </g>
        )}

        {/* Legend — top-right of the chart, two coloured chips */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <g transform={`translate(${G.gx1 - (portrait ? 150 : 200)}, ${G.gy0 + 18})`}>
            <line x1={0} y1={0} x2={22} y2={0}
                  stroke="var(--amber-400)" strokeWidth={2.6}/>
            <text x={28} y={4}
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={G.fontLegend}>
              i(t) — current
            </text>
            <line x1={0} y1={22} x2={22} y2={22}
                  stroke="var(--rose-400)" strokeWidth={2.6}/>
            <text x={28} y={26}
                  fill="var(--rose-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={G.fontLegend}>
              V<tspan baselineShift="sub" fontSize={G.fontLegend * 0.7}>L</tspan>(t) — coil voltage
            </text>
          </g>
        </SvgFadeIn>

        {/* Formula appears late once the curves have shape */}
        <SvgFadeIn duration={0.5} delay={9.5}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontFormula}>
            i(t) = (V/R)(1 − e<tspan baselineShift="super" fontSize={G.fontFormula * 0.6}>−t/τ</tspan>)
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Time constant τ = L/R with markers at 63% and 99% ──────────
function TimeConstantBeat() {
  const portrait = usePortrait();

  const G = portrait
    ? { vbW: 600, vbH: 680, gx0: 90, gx1: 540, gy0: 150, gy1: 560,
        fontFormula: 38, fontTick: 13, fontMarker: 14 }
    : { vbW: 900, vbH: 460, gx0: 130, gx1: 800, gy0: 90, gy1: 360,
        fontFormula: 40, fontTick: 13, fontMarker: 14 };

  const gw = G.gx1 - G.gx0;
  const gh = G.gy1 - G.gy0;

  // Full i(t) curve 0..5τ
  const N = 100;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    const tn = f * 5;
    const v = 1 - Math.exp(-tn);
    pts.push(`${G.gx0 + f * gw},${G.gy1 - v * gh}`);
  }
  const tauX = G.gx0 + gw / 5;
  const tauY = G.gy1 - (1 - Math.exp(-1)) * gh;
  const fiveTauX = G.gx0 + gw;
  const fiveTauY = G.gy1 - (1 - Math.exp(-5)) * gh;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 14 : 20,
    }}>
      <FadeUp duration={0.5} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: G.fontFormula, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        τ = L/R
      </FadeUp>

      <svg width={G.vbW} height={G.vbH - (portrait ? 80 : 60)}
           viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Axes */}
        <line x1={G.gx0} y1={G.gy1} x2={G.gx1} y2={G.gy1} stroke="var(--chalk-300)" strokeWidth={1.5}/>
        <line x1={G.gx0} y1={G.gy0} x2={G.gx0} y2={G.gy1} stroke="var(--chalk-300)" strokeWidth={1.5}/>

        {/* Asymptote at V/R */}
        <line x1={G.gx0} y1={G.gy0} x2={G.gx1} y2={G.gy0}
              stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="5 5" opacity={0.5}/>

        <text x={G.gx0 - 10} y={G.gy0 + 4} textAnchor="end"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>V/R</text>
        <text x={G.gx1 + 14} y={G.gy1 + 5}
              fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={G.fontTick + 2}>t</text>

        {/* Curve */}
        <SvgFadeIn duration={0.6} delay={0.6}>
          <polyline points={pts.join(' ')} fill="none"
                    stroke="var(--amber-400)" strokeWidth={2.6}
                    strokeLinecap="round" strokeLinejoin="round"/>
        </SvgFadeIn>

        {/* τ marker — vertical and horizontal dashed lines + dot */}
        <SvgFadeIn duration={0.4} delay={1.3}>
          <line x1={tauX} y1={tauY} x2={tauX} y2={G.gy1}
                stroke="var(--rose-400)" strokeWidth={1.2} strokeDasharray="4 4"/>
          <line x1={G.gx0} y1={tauY} x2={tauX} y2={tauY}
                stroke="var(--rose-400)" strokeWidth={1.2} strokeDasharray="4 4"/>
          <circle cx={tauX} cy={tauY} r={5}
                  fill="var(--rose-400)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
          <text x={tauX} y={G.gy1 + 18} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontMarker}>τ</text>
          <text x={G.gx0 - 8} y={tauY + 4} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={G.fontMarker - 1}>
            0.63·V/R
          </text>
        </SvgFadeIn>

        {/* 5τ marker */}
        <SvgFadeIn duration={0.4} delay={2.8}>
          <line x1={fiveTauX} y1={fiveTauY} x2={fiveTauX} y2={G.gy1}
                stroke="var(--rose-400)" strokeWidth={1.2} strokeDasharray="4 4"/>
          <circle cx={fiveTauX} cy={fiveTauY} r={5}
                  fill="var(--rose-400)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
          <text x={fiveTauX} y={G.gy1 + 18} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontMarker}>5τ</text>
          <text x={fiveTauX - 6} y={fiveTauY - 12} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={G.fontMarker - 1}>
            ≈ V/R
          </text>
        </SvgFadeIn>
      </svg>

      <FadeUp duration={0.5} delay={4.5} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-200)', textAlign: 'center',
          maxWidth: portrait ? '30ch' : 'none', letterSpacing: '0.02em',
        }}>
        one τ → 63%   ·   five τ → essentially full
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
          fontSize: portrait ? 26 : 32,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '40ch',
          lineHeight: 1.3,
        }}>
        Bigger L → slower rise.  Bigger R → faster rise.
      </FadeUp>

      <FadeUp duration={0.6} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26,
          color: 'var(--amber-300)',
          maxWidth: portrait ? '20ch' : '36ch',
          lineHeight: 1.3,
        }}>
        τ = L/R sets the rhythm.
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 6, maxWidth: portrait ? '34ch' : 'none',
          textAlign: 'center', textTransform: 'uppercase',
        }}>
        opposite trade-off from R · C
      </FadeUp>
    </div>
  );
}

// Expose narration for TTS / subtitle export.
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
