// Phasors: A Rotating Arrow Becomes a Sinusoid — Manimo lesson scene.
// Genuine animation lives in Beat 3: a phasor arrow rotates CCW on a
// complex plane; its real-axis projection feeds a synchronously-traced
// cosine on the right scope. Every frame, the projection drop-line and
// the time cursor are derived from the same `phaseAt(t)` so they cannot
// drift out of sync.
//
// Beats (timing aligned to single-track narration in motion/ade/audio/phasor-rotation/):
//    0.00– 7.97  Manimo intro: rotating arrow as a tool for AC
//    7.97–14.66  Complex plane setup: V_m, φ, magnitude vs angle
//   14.66–22.96  Rotate + trace: arrow turns, projection traces cosine
//   22.96–30.26  Two phasors 90° apart → cosine + sine in lock-step
//   30.26–40.00  Takeaway: vectors instead of integrals
//
// Authoring notes:
//   • All animation in beats 3 + 4 is parametric — every visible
//     element reads localTime and recomputes from a single phase value,
//     so the on-screen story is impossible to desync.
//   • Portrait branch stacks the complex plane above the scope (it would
//     be unreadably narrow side-by-side in 720 px wide).

const SCENE_DURATION = 40;

const NARRATION = [
  /*  0.00– 7.97 */ "An AC voltage swings sinusoidally — but there's a clearer way to picture it: a rotating arrow.",
  /*  7.97–14.66 */ "Set up the complex plane. The voltage is an arrow of length V m, sitting at angle phi to the real axis.",
  /* 14.66–22.96 */ "Now spin it. As the arrow rotates at omega, its projection on the real axis traces the cosine wave you see on the right.",
  /* 22.96–30.26 */ "Add a second phasor lagging by ninety degrees. Both rotate together — and their two waves stay locked in phase difference.",
  /* 30.26–40.00 */ "Each AC voltage becomes one number — magnitude and angle — that you can add like a vector. No more integrating sines.",
];

const NARRATION_AUDIO = 'audio/phasor-rotation/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="AC analysis"
      title="Phasors: A Rotating Arrow Becomes a Sinusoid"
      duration={SCENE_DURATION}
      introEnd={7.97}
      introCaption="How do you draw an AC voltage that's always changing?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.97} end={14.66}>
        <ComplexPlaneBeat />
      </Sprite>

      <Sprite start={14.66} end={22.96}>
        <RotateAndTraceBeat />
      </Sprite>

      <Sprite start={22.96} end={30.26}>
        <PhaseDifferenceBeat />
      </Sprite>

      <Sprite start={30.26} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ─────────────────────────────────────────────────────
// Tiny axis pair centred at (cx, cy), width w, height h.
function Axes({ cx, cy, w, h, labels = ['Re', 'Im'], color = 'var(--chalk-300)' }) {
  return (
    <g>
      <line x1={cx - w / 2} y1={cy} x2={cx + w / 2} y2={cy}
            stroke={color} strokeWidth={1} opacity={0.7}/>
      <line x1={cx} y1={cy - h / 2} x2={cx} y2={cy + h / 2}
            stroke={color} strokeWidth={1} opacity={0.7}/>
      {labels[0] && (
        <text x={cx + w / 2 + 6} y={cy + 4}
              fill={color} fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={13}>{labels[0]}</text>
      )}
      {labels[1] && (
        <text x={cx + 6} y={cy - h / 2 - 4}
              fill={color} fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={13}>{labels[1]}</text>
      )}
    </g>
  );
}

// Arrow from (x0, y0) to (x1, y1). Arrowhead size proportional to length.
function Arrow({ x0, y0, x1, y1, color = 'var(--amber-400)', width = 2.4 }) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-3) return null;
  const ux = dx / len, uy = dy / len;
  const head = Math.min(12, len * 0.18);
  const tipLen = Math.max(6, head);
  // Shorten line so the head sits flush at (x1, y1)
  const xLineEnd = x1 - ux * tipLen * 0.6;
  const yLineEnd = y1 - uy * tipLen * 0.6;
  // Perpendicular for the head wings
  const px = -uy, py = ux;
  const baseX = x1 - ux * tipLen, baseY = y1 - uy * tipLen;
  const wingHalf = tipLen * 0.55;
  return (
    <g>
      <line x1={x0} y1={y0} x2={xLineEnd} y2={yLineEnd}
            stroke={color} strokeWidth={width} strokeLinecap="round"/>
      <polygon points={`${x1} ${y1},
                        ${baseX + px * wingHalf} ${baseY + py * wingHalf},
                        ${baseX - px * wingHalf} ${baseY - py * wingHalf}`}
               fill={color}/>
    </g>
  );
}

// ─── Beat 2: Complex plane setup (static phasor at angle φ) ──────────────
function ComplexPlaneBeat() {
  const portrait = usePortrait();
  // Centre of the plane on canvas. Portrait centres higher.
  const G = portrait
    ? { cx: 360, cy: 480, axW: 480, axH: 480, R: 170, phi: -45 }
    : { cx: 640, cy: 410, axW: 460, axH: 380, R: 150, phi: -45 };

  const phiRad = (G.phi * Math.PI) / 180;
  const tipX = G.cx + G.R * Math.cos(phiRad);
  const tipY = G.cy + G.R * Math.sin(phiRad);  // SVG y down; angle uses standard math convention with y inverted

  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
    }}>
      <svg width="100%" height="100%" viewBox={portrait ? "0 0 720 1280" : "0 0 1280 720"}
           preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <Axes cx={G.cx} cy={G.cy} w={G.axW} h={G.axH}/>
        </SvgFadeIn>

        {/* Reference circle of radius R = V_m */}
        <SvgFadeIn duration={0.4} delay={0.7}>
          <circle cx={G.cx} cy={G.cy} r={G.R}
                  fill="none" stroke="var(--chalk-300)"
                  strokeWidth={1} strokeDasharray="4 5" opacity={0.45}/>
        </SvgFadeIn>

        {/* Phasor arrow at static angle φ */}
        <SvgFadeIn duration={0.5} delay={1.4}>
          <Arrow x0={G.cx} y0={G.cy} x1={tipX} y1={tipY}
                 color="var(--amber-400)" width={3}/>
        </SvgFadeIn>

        {/* V_m magnitude label, parallel to arrow, midway */}
        <SvgFadeIn duration={0.4} delay={2.0}>
          <text x={(G.cx + tipX) / 2 + 12}
                y={(G.cy + tipY) / 2 - 14}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={22}>
            V<tspan baselineShift="sub" fontSize={14}>m</tspan>
          </text>
        </SvgFadeIn>

        {/* φ angle: small arc from positive x-axis to phasor */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          {/* Arc from 0° down to φ (negative in SVG y-down means rotating
              clockwise, but mathematically that's a positive-rotation arrow
              into the lower-right quadrant since we render Im upward). */}
          <path d={`M ${G.cx + 56} ${G.cy}
                    A 56 56 0 0 1 ${G.cx + 56 * Math.cos(phiRad)} ${G.cy + 56 * Math.sin(phiRad)}`}
                fill="none" stroke="var(--rose-400)" strokeWidth={1.6}/>
          <text x={G.cx + 36} y={G.cy - 14}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>φ</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          <text x={G.cx} y={G.cy + G.axH / 2 + 36} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            magnitude is the amplitude — angle is the phase
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Rotating phasor + synchronous cosine trace (genuine motion) ──
function RotateAndTraceBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // Layout — landscape: side-by-side; portrait: plane above, scope below.
  const L = portrait
    ? {
        // complex plane
        pcx: 360, pcy: 380, R: 150,
        // scope
        scopeX0: 70, scopeXW: 580, scopeY0: 720, scopeYH: 220,
      }
    : {
        pcx: 360, pcy: 410, R: 145,
        scopeX0: 690, scopeXW: 520, scopeY0: 290, scopeYH: 240,
      };

  // Rotation: hold briefly, then 1.5 full revolutions over the rest of
  // the beat. ω is chosen so the cosine fills the scope width exactly
  // by the end (CYCLES = 1.5 cycles == 1.5 × 2π).
  const HOLD = 1.0;
  const TAIL = 0.4;
  const ROT_T = Math.max(spriteDur - HOLD - TAIL, 4);
  const CYCLES = 1.5;
  const rotProg = clamp((localTime - HOLD) / ROT_T, 0, 1);
  // Phase angle (CCW positive, math convention). At rotProg=0 the arrow
  // starts at the +Re axis (angle 0) so the cosine begins at +1.
  const theta = rotProg * 2 * Math.PI * CYCLES;

  // Arrow tip in SVG coords — Im is up in the math plane, so y is
  // negated: y = pcy − R sin θ.
  const tipX = L.pcx + L.R * Math.cos(theta);
  const tipY = L.pcy - L.R * Math.sin(theta);

  // Real-axis projection of the tip
  const projY = L.pcy;
  const projX = tipX;

  // Cosine baseline + amplitude on the scope
  const sBaseY = L.scopeY0 + L.scopeYH / 2;
  const sAmp = (L.scopeYH / 2) * 0.85;

  // Build the cosine path drawn so far (from rotProg=0 to rotProg=now)
  const SAMPLES = 140;
  const drawn = Math.max(2, Math.round(SAMPLES * rotProg));
  const pts = [];
  for (let i = 0; i <= drawn; i++) {
    const f = (i / SAMPLES);                       // 0..rotProg
    const ang = f * 2 * Math.PI * CYCLES;
    const x = L.scopeX0 + (i / SAMPLES) * L.scopeXW;
    const y = sBaseY - sAmp * Math.cos(ang);
    pts.push((i === 0 ? 'M ' : 'L ') + x.toFixed(2) + ' ' + y.toFixed(2));
  }
  const traceD = pts.join(' ');

  // Scope cursor (vertical line at the current x-position) and the live
  // value dot.
  const cursorX = L.scopeX0 + L.scopeXW * rotProg;
  const cursorY = sBaseY - sAmp * Math.cos(theta);

  // Reference background grid lines on the scope (zero axis + 4 v-ticks)
  const tickXs = [0.25, 0.5, 0.75].map(f => L.scopeX0 + L.scopeXW * f);

  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
    }}>
      <svg width="100%" height="100%"
           viewBox={portrait ? "0 0 720 1280" : "0 0 1280 720"}
           preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
        {/* ── Complex plane (left / top) ────────────────────────────── */}
        <Axes cx={L.pcx} cy={L.pcy} w={L.R * 2 + 80} h={L.R * 2 + 80}/>

        {/* Reference circle */}
        <circle cx={L.pcx} cy={L.pcy} r={L.R}
                fill="none" stroke="var(--chalk-300)"
                strokeWidth={1} strokeDasharray="4 5" opacity={0.4}/>

        {/* Trail — faint copies of where the tip has been (last quarter of the rotation) */}
        {(() => {
          const TRAIL = 18;
          const trail = [];
          for (let i = 1; i <= TRAIL; i++) {
            const back = i * 0.012;     // step size in rotProg
            const t = Math.max(0, rotProg - back);
            if (t <= 0) break;
            const a = t * 2 * Math.PI * CYCLES;
            const tx = L.pcx + L.R * Math.cos(a);
            const ty = L.pcy - L.R * Math.sin(a);
            trail.push(<circle key={i} cx={tx} cy={ty} r={2.4}
                               fill="var(--amber-300)"
                               opacity={(1 - i / TRAIL) * 0.45}/>);
          }
          return <g>{trail}</g>;
        })()}

        {/* Projection drop-line: vertical from arrow tip to real axis */}
        <line x1={tipX} y1={tipY} x2={projX} y2={projY}
              stroke="var(--rose-300)" strokeWidth={1.4}
              strokeDasharray="3 4" opacity={0.85}/>
        <circle cx={projX} cy={projY} r={4}
                fill="var(--rose-400)" stroke="var(--chalk-100)"
                strokeWidth={1}/>

        {/* The phasor arrow itself */}
        <Arrow x0={L.pcx} y0={L.pcy} x1={tipX} y1={tipY}
               color="var(--amber-400)" width={3}/>

        {/* ω label */}
        <SvgFadeIn duration={0.3} delay={0.4}>
          <text x={L.pcx - L.R - 10} y={L.pcy - L.R - 12}
                textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.14em">ω</text>
          {/* tiny CCW indicator arc */}
          <path d={`M ${L.pcx - L.R + 18} ${L.pcy - L.R + 18}
                    A 14 14 0 0 1 ${L.pcx - L.R + 32} ${L.pcy - L.R + 4}`}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <polygon points={`${L.pcx - L.R + 32} ${L.pcy - L.R + 4},
                            ${L.pcx - L.R + 26} ${L.pcy - L.R + 0},
                            ${L.pcx - L.R + 30} ${L.pcy - L.R + 12}`}
                   fill="var(--chalk-300)"/>
        </SvgFadeIn>

        {/* ── Scope (right / bottom) ────────────────────────────────── */}
        {/* Frame */}
        <rect x={L.scopeX0} y={L.scopeY0} width={L.scopeXW} height={L.scopeYH}
              fill="none" stroke="var(--chalk-300)" strokeWidth={1}
              strokeDasharray="3 3" opacity={0.4}/>
        {/* Zero baseline */}
        <line x1={L.scopeX0} y1={sBaseY} x2={L.scopeX0 + L.scopeXW} y2={sBaseY}
              stroke="var(--chalk-300)" strokeWidth={1} opacity={0.7}/>
        {/* Light vertical guide ticks */}
        {tickXs.map((x, i) => (
          <line key={i} x1={x} y1={L.scopeY0} x2={x} y2={L.scopeY0 + L.scopeYH}
                stroke="var(--chalk-300)" strokeWidth={0.8}
                strokeDasharray="2 4" opacity={0.25}/>
        ))}

        {/* Cosine trace as drawn so far */}
        <path d={traceD} fill="none" stroke="var(--amber-300)"
              strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"/>

        {/* Live cursor + value dot on scope */}
        <line x1={cursorX} y1={L.scopeY0} x2={cursorX} y2={L.scopeY0 + L.scopeYH}
              stroke="var(--rose-300)" strokeWidth={1.2}
              strokeDasharray="3 3" opacity={0.6}/>
        <circle cx={cursorX} cy={cursorY} r={5}
                fill="var(--rose-400)" stroke="var(--chalk-100)"
                strokeWidth={1.2}/>

        {/* Linker — horizontal line from projection to scope cursor (only
            in landscape; portrait stacks them so the link is vertical
            and visually busier than helpful). */}
        {!portrait && (
          <line x1={projX} y1={projY} x2={cursorX} y2={cursorY}
                stroke="var(--rose-300)" strokeWidth={1}
                strokeDasharray="2 5" opacity={0.4}/>
        )}

        {/* Equation label above the scope */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <text x={L.scopeX0} y={L.scopeY0 - 14}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            v(t) = V<tspan baselineShift="sub" fontSize={12}>m</tspan> cos(ωt + φ)
          </text>
        </SvgFadeIn>

        {/* Time-axis label */}
        <text x={L.scopeX0 + L.scopeXW + 8} y={sBaseY + 4}
              fill="var(--chalk-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={13}>t</text>

        {/* Persistent label on the rotating phasor: "V" */}
        <SvgFadeIn duration={0.3} delay={0.0}>
          <text x={tipX + 12 * Math.cos(theta)}
                y={tipY - 12 * Math.sin(theta)}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>V</text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Two phasors at 90° — cosine + sine ──────────────────────────
function PhaseDifferenceBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const L = portrait
    ? {
        pcx: 360, pcy: 380, R: 140,
        scopeX0: 70, scopeXW: 580, scopeY0: 720, scopeYH: 240,
      }
    : {
        pcx: 360, pcy: 410, R: 140,
        scopeX0: 690, scopeXW: 520, scopeY0: 290, scopeYH: 240,
      };

  const HOLD = 0.6;
  const TAIL = 0.6;
  const ROT_T = Math.max(spriteDur - HOLD - TAIL, 3);
  const CYCLES = 1.0;
  const rotProg = clamp((localTime - HOLD) / ROT_T, 0, 1);
  const theta = rotProg * 2 * Math.PI * CYCLES;
  const PHASE_LAG = Math.PI / 2;   // V₂ trails V₁ by 90°
  const theta2 = theta - PHASE_LAG;

  // Tip 1 (V₁) — leading
  const tip1X = L.pcx + L.R * Math.cos(theta);
  const tip1Y = L.pcy - L.R * Math.sin(theta);
  // Tip 2 (V₂) — lagging by 90°
  const tip2X = L.pcx + L.R * Math.cos(theta2);
  const tip2Y = L.pcy - L.R * Math.sin(theta2);

  const sBaseY = L.scopeY0 + L.scopeYH / 2;
  const sAmp = (L.scopeYH / 2) * 0.78;

  // Build paths drawn so far
  const SAMPLES = 120;
  const drawn = Math.max(2, Math.round(SAMPLES * rotProg));
  function buildPath(phaseShift) {
    const pts = [];
    for (let i = 0; i <= drawn; i++) {
      const f = (i / SAMPLES);
      const ang = f * 2 * Math.PI * CYCLES - phaseShift;
      const x = L.scopeX0 + (i / SAMPLES) * L.scopeXW;
      const y = sBaseY - sAmp * Math.cos(ang);
      pts.push((i === 0 ? 'M ' : 'L ') + x.toFixed(2) + ' ' + y.toFixed(2));
    }
    return pts.join(' ');
  }
  const trace1D = buildPath(0);
  const trace2D = buildPath(PHASE_LAG);

  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
    }}>
      <svg width="100%" height="100%"
           viewBox={portrait ? "0 0 720 1280" : "0 0 1280 720"}
           preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
        {/* Complex plane */}
        <Axes cx={L.pcx} cy={L.pcy} w={L.R * 2 + 80} h={L.R * 2 + 80}/>
        <circle cx={L.pcx} cy={L.pcy} r={L.R}
                fill="none" stroke="var(--chalk-300)"
                strokeWidth={1} strokeDasharray="4 5" opacity={0.4}/>

        {/* V₁ arrow + label */}
        <Arrow x0={L.pcx} y0={L.pcy} x1={tip1X} y1={tip1Y}
               color="var(--amber-400)" width={3}/>
        <SvgFadeIn duration={0.3} delay={0.4}>
          <text x={tip1X + 14 * Math.cos(theta)}
                y={tip1Y - 14 * Math.sin(theta)}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>V₁</text>
        </SvgFadeIn>

        {/* V₂ arrow + label */}
        <Arrow x0={L.pcx} y0={L.pcy} x1={tip2X} y1={tip2Y}
               color="var(--rose-400)" width={2.6}/>
        <SvgFadeIn duration={0.3} delay={0.4}>
          <text x={tip2X + 14 * Math.cos(theta2)}
                y={tip2Y - 14 * Math.sin(theta2)}
                textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>V₂</text>
        </SvgFadeIn>

        {/* 90° fixed-angle indicator at origin (small arc) */}
        <path d={`M ${L.pcx + 26 * Math.cos(theta)}
                    ${L.pcy - 26 * Math.sin(theta)}
                  A 26 26 0 0 1 ${L.pcx + 26 * Math.cos(theta2)}
                                  ${L.pcy - 26 * Math.sin(theta2)}`}
              fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}/>
        <text x={L.pcx + 32 * Math.cos((theta + theta2) / 2)}
              y={L.pcy - 32 * Math.sin((theta + theta2) / 2) + 4}
              textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={11}>90°</text>

        {/* Scope */}
        <rect x={L.scopeX0} y={L.scopeY0} width={L.scopeXW} height={L.scopeYH}
              fill="none" stroke="var(--chalk-300)" strokeWidth={1}
              strokeDasharray="3 3" opacity={0.4}/>
        <line x1={L.scopeX0} y1={sBaseY} x2={L.scopeX0 + L.scopeXW} y2={sBaseY}
              stroke="var(--chalk-300)" strokeWidth={1} opacity={0.7}/>

        {/* Two traces */}
        <path d={trace1D} fill="none" stroke="var(--amber-300)"
              strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"/>
        <path d={trace2D} fill="none" stroke="var(--rose-300)"
              strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"/>

        {/* Scope legend */}
        <SvgFadeIn duration={0.3} delay={0.5}>
          <g>
            <line x1={L.scopeX0 + 12} y1={L.scopeY0 - 22}
                  x2={L.scopeX0 + 36} y2={L.scopeY0 - 22}
                  stroke="var(--amber-300)" strokeWidth={2.4}/>
            <text x={L.scopeX0 + 42} y={L.scopeY0 - 18}
                  fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={14}>V₁ — cos ωt</text>
            <line x1={L.scopeX0 + 168} y1={L.scopeY0 - 22}
                  x2={L.scopeX0 + 192} y2={L.scopeY0 - 22}
                  stroke="var(--rose-300)" strokeWidth={2.4}/>
            <text x={L.scopeX0 + 198} y={L.scopeY0 - 18}
                  fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={14}>V₂ — sin ωt (lags 90°)</text>
          </g>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={L.scopeX0 + L.scopeXW / 2}
                y={L.scopeY0 + L.scopeYH + 28} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            phase difference stays constant — algebra replaces calculus
          </text>
        </SvgFadeIn>
      </svg>
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
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 36,
          color: 'var(--amber-300)', letterSpacing: '0.02em',
          maxWidth: portrait ? '20ch' : '40ch', lineHeight: 1.25,
        }}>
        magnitude · angle  →  add like vectors
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '46ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 4,
        }}>
        the trick that makes AC analysis tractable
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '32ch' : 'none',
          textAlign: 'center',
        }}>
        impedance comes next — phasors meet R, L, C
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
