// RC Charging: Why a Capacitor Fills on an Exponential Curve — Manimo lesson scene.
//
// Beats (placeholder timings — overwritten by scripts/rewire-scene.js once
// audio is generated):
//    0.00– 4.00  Manimo enters; hook caption
//    4.00–13.00  Series RC circuit, switch closes, current dots flow
//   13.00–26.00  V_C(t) curve traces in synchronously with charges piling on plates
//   26.00–35.00  τ = RC; markers at t=τ (63%) and t=5τ (~99%)
//   35.00–46.00  Takeaway
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background, grid, title block, corner Manimo.

const SCENE_DURATION = 42;

const NARRATION = [
  /*  0.00– 4.74 */ 'Close a switch and a capacitor starts filling — how fast does it get there?',
  /*  4.74–13.50 */ 'Battery V zero in series with a resistor R and capacitor C. Flip the switch, and current starts pushing charge onto the plates.',
  /* 13.50–23.81 */ 'The voltage across the capacitor climbs along an exponential curve — V of t equals V zero times one minus e to the minus t over tau.',
  /* 23.81–33.73 */ 'Tau equals R times C is the time constant. After one tau the voltage has reached sixty three percent. After five tau it is essentially full.',
  /* 33.73–42.00 */ 'Bigger R or bigger C means slower charging. The time constant R times C sets the entire rhythm.',
];

const NARRATION_AUDIO = 'audio/rc-charging/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="reactive elements"
      title="RC Charging"
      duration={SCENE_DURATION}
      introEnd={4.74}
      introCaption="Switch closes — how fast does the capacitor fill?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.74} end={13.5}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={13.5} end={23.81}>
        <ChargingCurveBeat />
      </Sprite>

      <Sprite start={23.81} end={33.73}>
        <TimeConstantBeat />
      </Sprite>

      <Sprite start={33.73} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Series RC circuit + switch + current dots ───────────────────
// Layout (in viewBox; mirrored for landscape vs portrait):
//   Loop is a rectangle. Battery (V0) on left vertical, switch on top,
//   resistor R on right vertical (upper segment), capacitor C on right
//   vertical (lower segment), wire on bottom returns to battery.
function CircuitBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 560, vbH: 460, left: 140, right: 440, top: 90, bot: 380,
        battH: 60, capGap: 14, resW: 48, switchLen: 56,
        fontLabel: 18, fontCap: 13, captionY: 430 }
    : { vbW: 820, vbH: 380, left: 200, right: 620, top: 70, bot: 320,
        battH: 70, capGap: 16, resW: 56, switchLen: 64,
        fontLabel: 20, fontCap: 14, captionY: 360 };

  const midY = (G.top + G.bot) / 2;
  // Switch sits on the top wire, centred.
  const switchMidX = (G.left + G.right) / 2;
  const switchLeftX = switchMidX - G.switchLen / 2;
  const switchRightX = switchMidX + G.switchLen / 2;
  // Battery: two parallel plates on the left vertical, centred at midY.
  const battTop = midY - G.battH / 2;
  const battBot = midY + G.battH / 2;
  // Resistor: zigzag on the right vertical, upper half.
  const resTop = G.top + 30;
  const resBot = midY - 24;
  // Capacitor: two horizontal plates on the right vertical, lower half.
  const capCy = midY + 50;
  const capPlateLen = 56;

  // Switch animation: open until t=3.0, then rotates closed over 0.4s.
  const switchT = clamp((localTime - 3.0) / 0.4, 0, 1);
  const openAngle = 32; // degrees above the wire when open
  const angle = openAngle * (1 - switchT);
  const angRad = (angle * Math.PI) / 180;
  const switchTipX = switchLeftX + G.switchLen * Math.cos(angRad);
  const switchTipY = midY - G.switchLen * Math.sin(angRad);
  const closed = switchT >= 1;

  // Current dots: only after switch closes; they travel clockwise around the
  // loop. Map localTime to position along total perimeter.
  const segs = (() => {
    // Path segments, clockwise from top-left corner:
    // 1. top wire (left → right), 2. right wire (top → bot), 3. bot wire
    // (right → left), 4. left wire (bot → top).
    const top = { x1: G.left, y1: G.top, x2: G.right, y2: G.top, len: G.right - G.left };
    const right = { x1: G.right, y1: G.top, x2: G.right, y2: G.bot, len: G.bot - G.top };
    const bot = { x1: G.right, y1: G.bot, x2: G.left, y2: G.bot, len: G.right - G.left };
    const left = { x1: G.left, y1: G.bot, x2: G.left, y2: G.top, len: G.bot - G.top };
    return [top, right, bot, left];
  })();
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

  // Current speed: starts fast, decays exponentially (mirrors I = (V0/R)e^{-t/τ}).
  // localTime relative to switch-closed instant.
  const sinceClose = Math.max(0, localTime - 3.4);
  const tauVis = 4.0;
  const decay = Math.exp(-sinceClose / tauVis);
  // Travel: integrate (peakSpeed * e^{-t/τ}) = peakSpeed * τ * (1 - e^{-t/τ})
  const peakSpeed = 220; // px/s
  const travel = peakSpeed * tauVis * (1 - decay);

  // Six dots, evenly spaced around the loop, offset by travel.
  const dotCount = 6;
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const base = (i / dotCount) * perimeter;
    return dotAt(base + travel);
  });

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

        {/* Battery: long plate (positive, top) + short plate (negative, bot) */}
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
                fontStyle="italic" fontSize={G.fontLabel}>
            V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>0</tspan>
          </text>
        </SvgFadeIn>

        {/* Top wire — left segment and right segment, broken around the switch */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={G.left} y1={G.top} x2={switchLeftX} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={switchRightX} y1={G.top} x2={G.right} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          {/* Switch terminal dots */}
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

        {/* Right vertical wire — split around resistor + capacitor */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <line x1={G.right} y1={G.top} x2={G.right} y2={resTop} stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.right} y1={resBot} x2={G.right} y2={capCy - G.capGap} stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.right} y1={capCy + G.capGap} x2={G.right} y2={G.bot} stroke="var(--chalk-200)" strokeWidth={2}/>
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

        {/* Capacitor: two horizontal plates */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <line x1={G.right - capPlateLen / 2} y1={capCy - G.capGap}
                x2={G.right + capPlateLen / 2} y2={capCy - G.capGap}
                stroke="var(--amber-400)" strokeWidth={3}/>
          <line x1={G.right - capPlateLen / 2} y1={capCy + G.capGap}
                x2={G.right + capPlateLen / 2} y2={capCy + G.capGap}
                stroke="var(--amber-400)" strokeWidth={3}/>
          <text x={G.right + capPlateLen / 2 + 12} y={capCy + 5}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontLabel}>C</text>
        </SvgFadeIn>

        {/* Bottom wire */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={G.left} y1={G.bot} x2={G.right} y2={G.bot} stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Current dots — only render after switch closes; fade out as decay → 0 */}
        {closed && decay > 0.04 && (
          <g opacity={Math.min(1, decay * 1.4)}>
            {dots.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={4.5}
                      fill="var(--amber-300)"/>
            ))}
          </g>
        )}

        {/* Caption beneath */}
        <SvgFadeIn duration={0.4} delay={6.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCap} letterSpacing="0.02em">
            current rushes in, then slows as the cap fills
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Value-driven charging curve + capacitor charges piling on ───
function ChargingCurveBeat() {
  const portrait = usePortrait();
  const { localTime, duration } = useSprite();

  // Time cursor sweeps from t=0 to t=5τ across the graph between beat
  // localTime 1.0 and 9.0 (8s sweep). After that, hold the final state.
  const sweepStart = 1.0;
  const sweepEnd = 9.0;
  const sweepFrac = clamp((localTime - sweepStart) / (sweepEnd - sweepStart), 0, 1);
  const tNormalised = sweepFrac * 5; // 0..5τ
  const vFrac = 1 - Math.exp(-tNormalised); // matches 1 - e^(-t/τ)

  const G = portrait
    ? { vbW: 600, vbH: 700,
        // Graph occupies the top half.
        gx0: 70, gx1: 530, gy0: 90, gy1: 340,
        // Capacitor sits below the graph, centred.
        capCx: 300, capCy: 460, plateLen: 200, plateGap: 64,
        chargeCols: 7, chargeRows: 3,
        fontAxis: 14, fontTick: 11, fontFormula: 24, formulaY: 660 }
    : { vbW: 1100, vbH: 380,
        // Graph on the left, capacitor on the right.
        gx0: 80, gx1: 600, gy0: 60, gy1: 320,
        capCx: 880, capCy: 200, plateLen: 200, plateGap: 64,
        chargeCols: 7, chargeRows: 3,
        fontAxis: 14, fontTick: 11, fontFormula: 26, formulaY: 360 };

  const gw = G.gx1 - G.gx0;
  const gh = G.gy1 - G.gy0;

  // Build the curve polyline up to the current sweep fraction.
  const curveSamples = 80;
  const curvePts = [];
  for (let i = 0; i <= curveSamples; i++) {
    const f = i / curveSamples;
    if (f > sweepFrac) break;
    const tn = f * 5;
    const v = 1 - Math.exp(-tn);
    curvePts.push(`${G.gx0 + f * gw},${G.gy1 - v * gh}`);
  }

  // Time cursor position.
  const cursorX = G.gx0 + sweepFrac * gw;
  const cursorY = G.gy1 - vFrac * gh;

  // Charges on the top plate: light up incrementally with vFrac.
  const totalCharges = G.chargeCols * G.chargeRows;
  const litCount = Math.floor(vFrac * totalCharges + 0.001);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Axes */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.gx0} y1={G.gy1} x2={G.gx1} y2={G.gy1} stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <line x1={G.gx0} y1={G.gy0} x2={G.gx0} y2={G.gy1} stroke="var(--chalk-300)" strokeWidth={1.5}/>
          {/* x label */}
          <text x={G.gx1 + 14} y={G.gy1 + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontAxis}>t</text>
          {/* y label */}
          <text x={G.gx0 - 14} y={G.gy0 - 8} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontAxis}>
            V<tspan baselineShift="sub" fontSize={G.fontAxis * 0.7}>C</tspan>
          </text>
          {/* V₀ tick (top) */}
          <line x1={G.gx0 - 5} y1={G.gy0} x2={G.gx0 + 4} y2={G.gy0}
                stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.gx0 - 10} y={G.gy0 + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>V₀</text>
          {/* 0 tick */}
          <text x={G.gx0 - 8} y={G.gy1 + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>0</text>
          {/* τ tick on x */}
          <line x1={G.gx0 + gw / 5} y1={G.gy1 - 4} x2={G.gx0 + gw / 5} y2={G.gy1 + 4}
                stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.gx0 + gw / 5} y={G.gy1 + 18} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontAxis}>τ</text>
        </SvgFadeIn>

        {/* Asymptote dashed line at V₀ */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <line x1={G.gx0} y1={G.gy0} x2={G.gx1} y2={G.gy0}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="5 5" opacity={0.5}/>
        </SvgFadeIn>

        {/* Live curve */}
        {curvePts.length > 1 && (
          <polyline points={curvePts.join(' ')} fill="none"
                    stroke="var(--amber-400)" strokeWidth={2.6}
                    strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Time cursor + value dot */}
        {localTime >= sweepStart && (
          <g>
            <line x1={cursorX} y1={G.gy0} x2={cursorX} y2={G.gy1}
                  stroke="var(--rose-400)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6}/>
            <circle cx={cursorX} cy={cursorY} r={5}
                    fill="var(--rose-400)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
          </g>
        )}

        {/* Capacitor symbol with charge dots accumulating on top plate (+),
            negative charges on bottom plate (−). */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          {/* Top plate */}
          <line x1={G.capCx - G.plateLen / 2} y1={G.capCy - G.plateGap / 2}
                x2={G.capCx + G.plateLen / 2} y2={G.capCy - G.plateGap / 2}
                stroke="var(--amber-400)" strokeWidth={3.5}/>
          {/* Bottom plate */}
          <line x1={G.capCx - G.plateLen / 2} y1={G.capCy + G.plateGap / 2}
                x2={G.capCx + G.plateLen / 2} y2={G.capCy + G.plateGap / 2}
                stroke="var(--amber-400)" strokeWidth={3.5}/>
          {/* Top wire stub */}
          <line x1={G.capCx} y1={G.capCy - G.plateGap / 2 - 32}
                x2={G.capCx} y2={G.capCy - G.plateGap / 2}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          {/* Bottom wire stub */}
          <line x1={G.capCx} y1={G.capCy + G.plateGap / 2}
                x2={G.capCx} y2={G.capCy + G.plateGap / 2 + 32}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
        </SvgFadeIn>

        {/* Charge dots — appear progressively as vFrac grows */}
        {(() => {
          const dots = [];
          const cellW = G.plateLen * 0.86 / G.chargeCols;
          const cellY = G.capCy - G.plateGap / 2 - 12;
          const negCellY = G.capCy + G.plateGap / 2 + 12;
          for (let r = 0; r < G.chargeRows; r++) {
            for (let c = 0; c < G.chargeCols; c++) {
              const idx = r * G.chargeCols + c;
              if (idx >= litCount) continue;
              const x = G.capCx - (G.plateLen * 0.86) / 2 + (c + 0.5) * cellW;
              dots.push(
                <g key={`p${idx}`}>
                  <circle cx={x} cy={cellY - r * 10} r={4} fill="var(--amber-300)"/>
                  <text x={x} y={cellY - r * 10 + 3} textAnchor="middle"
                        fill="var(--bg-canvas)" fontFamily="var(--font-mono)" fontSize={9}>+</text>
                  <circle cx={x} cy={negCellY + r * 10} r={4} fill="var(--rose-400)"/>
                  <text x={x} y={negCellY + r * 10 + 3} textAnchor="middle"
                        fill="var(--bg-canvas)" fontFamily="var(--font-mono)" fontSize={9}>−</text>
                </g>
              );
            }
          }
          return dots;
        })()}

        {/* V_C readout right next to the capacitor */}
        <SvgFadeIn duration={0.3} delay={0.8}>
          <text x={G.capCx + G.plateLen / 2 + 18} y={G.capCy + 6}
                fill="var(--amber-300)" fontFamily="var(--font-mono)" fontSize={14}>
            V<tspan baselineShift="sub" fontSize={11}>C</tspan> = {(vFrac).toFixed(2)}·V₀
          </text>
        </SvgFadeIn>

        {/* Formula appears late once the curve has shaped */}
        <SvgFadeIn duration={0.5} delay={8.5}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.fontFormula}>
            V(t) = V₀(1 − e<tspan baselineShift="super" fontSize={G.fontFormula * 0.6}>−t/τ</tspan>)
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Time constant τ = RC with markers at 63% and 99% ────────────
function TimeConstantBeat() {
  const portrait = usePortrait();

  const G = portrait
    ? { vbW: 600, vbH: 500, gx0: 70, gx1: 530, gy0: 130, gy1: 380,
        fontFormula: 36, fontTick: 12, fontMarker: 13 }
    : { vbW: 900, vbH: 460, gx0: 110, gx1: 780, gy0: 90, gy1: 360,
        fontFormula: 40, fontTick: 13, fontMarker: 14 };

  const gw = G.gx1 - G.gx0;
  const gh = G.gy1 - G.gy0;

  // Render full curve from 0..5τ at full opacity.
  const N = 100;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    const tn = f * 5;
    const v = 1 - Math.exp(-tn);
    pts.push(`${G.gx0 + f * gw},${G.gy1 - v * gh}`);
  }

  const tauX = G.gx0 + gw / 5;            // t = τ
  const tauY = G.gy1 - (1 - Math.exp(-1)) * gh; // 63.2%
  const fiveTauX = G.gx0 + gw;            // t = 5τ
  const fiveTauY = G.gy1 - (1 - Math.exp(-5)) * gh; // ~99.3%

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
        τ = RC
      </FadeUp>

      <svg width={G.vbW} height={G.vbH - (portrait ? 110 : 60)}
           viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Axes */}
        <line x1={G.gx0} y1={G.gy1} x2={G.gx1} y2={G.gy1} stroke="var(--chalk-300)" strokeWidth={1.5}/>
        <line x1={G.gx0} y1={G.gy0} x2={G.gx0} y2={G.gy1} stroke="var(--chalk-300)" strokeWidth={1.5}/>

        {/* Asymptote at V₀ */}
        <line x1={G.gx0} y1={G.gy0} x2={G.gx1} y2={G.gy0}
              stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="5 5" opacity={0.5}/>

        {/* V₀ label */}
        <text x={G.gx0 - 10} y={G.gy0 + 4} textAnchor="end"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={G.fontTick}>V₀</text>
        <text x={G.gx1 + 14} y={G.gy1 + 5}
              fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={G.fontTick + 2}>t</text>

        {/* Curve */}
        <SvgFadeIn duration={0.6} delay={0.6}>
          <polyline points={pts.join(' ')} fill="none"
                    stroke="var(--amber-400)" strokeWidth={2.6}
                    strokeLinecap="round" strokeLinejoin="round"/>
        </SvgFadeIn>

        {/* τ marker — vertical dashed line + dot + label */}
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
            0.63·V₀
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
            ≈ V₀
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
          fontSize: portrait ? 28 : 34,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '40ch',
          lineHeight: 1.3,
        }}>
        Bigger R or bigger C → slower charge.
      </FadeUp>

      <FadeUp duration={0.6} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26,
          color: 'var(--amber-300)',
          maxWidth: portrait ? '20ch' : '36ch',
          lineHeight: 1.3,
        }}>
        τ = RC sets the rhythm.
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
