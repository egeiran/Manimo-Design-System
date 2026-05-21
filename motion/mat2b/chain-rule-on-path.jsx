// Chain Rule on a Path — Manimo lesson scene.
// Chapter 5 of mat2b (Funksjoner og derivasjon). Visualises the
// multivariable chain rule
//   d/dt f(γ(t)) = ∇f(γ(t)) · γ'(t)
// using a concrete example whose algebra is one-line clean:
//   f(x, y) = x² + y²
//   γ(t) = (cos t + 1, sin t)            — unit circle centred at (1, 0)
//   ∇f = (2x, 2y),  γ'(t) = (−sin t, cos t)
//   ∇f · γ'(t) = 2(cos t + 1)(−sin t) + 2(sin t)(cos t) = −2 sin t
//   z(t) = f(γ(t)) = (cos t + 1)² + sin²t = 2 + 2 cos t,  z'(t) = −2 sin t  ✓
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//    0– 5     Manimo hook
//    5–14     Setup — contours of f, path γ, formulas
//   14–28     Particle sweeps along γ (GENUINE MOTION); ∇f and γ' arrows live
//   28–42     Altitude trace z(t) drawn in sync with the particle (GENUINE MOTION)
//   42–50     Rule line — dz/dt = ∇f · γ'(t)
//   50–52     Takeaway
//
// Colour discipline:
//   chalk-200  axes
//   chalk-300  level circles of f (the map)
//   teal-400   the path γ(t)
//   amber-400  ∇f (radial gradient)
//   violet-400 γ'(t) (tangent velocity)
//   amber-300  payoff line / z(t) trace
//   rose-400   tick on the z(t) marker

const SCENE_DURATION = 55;

const NARRATION = [
  /*  0– 5  */ 'Walking a winding path across a hill — how fast does your altitude change?',
  /*  5–14  */ 'Take f equals x squared plus y squared. The level curves are concentric circles. Walk the path gamma of t equals cos t plus one, sin t — a unit circle offset to the right.',
  /* 14–28  */ 'As the particle moves, the gradient of f points outward from the origin, and the velocity gamma prime of t is tangent to the path. Their dot product is the rate of change of altitude.',
  /* 28–42  */ 'Below the diagram, plot the altitude z of t against time. Its slope at every instant exactly matches the gradient dotted with velocity.',
  /* 42–50  */ 'The multivariable chain rule is this: take the gradient at the point, dot it with the velocity along the path.',
  /* 50–52  */ 'Gradient dot velocity. Slope along any path.',
];

const NARRATION_AUDIO = 'audio/chain-rule-on-path/scene.mp3';

// ─── Geometry ─────────────────────────────────────────────────────────────
// Landscape: contour diagram on the left, altitude graph on the right.
// Portrait: contour diagram up top, altitude graph below.
function diagramGeom(portrait) {
  return portrait
    ? {
        ox: 360, oy: 460, u: 110, xMax: 2.4, yMax: 1.6,
        // Altitude graph below
        gxL: 90, gxR: 630, gyT: 820, gyB: 1100,
        gTopVal: 4.4, gBotVal: -0.4,
        gTMin: 0, gTMax: 2 * Math.PI,
      }
    : {
        ox: 360, oy: 360, u: 110, xMax: 2.4, yMax: 1.6,
        // Altitude graph on the right
        gxL: 760, gxR: 1200, gyT: 220, gyB: 540,
        gTopVal: 4.4, gBotVal: -0.4,
        gTMin: 0, gTMax: 2 * Math.PI,
      };
}

function toSvg(x, y, ox, oy, u) {
  return { sx: ox + x * u, sy: oy - y * u };
}

// f and gradient for the example.
function fOf(x, y) { return x * x + y * y; }
function gradF(x, y) { return [2 * x, 2 * y]; }
function gamma(t) { return [Math.cos(t) + 1, Math.sin(t)]; }
function gammaDot(t) { return [-Math.sin(t), Math.cos(t)]; }
function zOf(t) { return 2 + 2 * Math.cos(t); }

// ─── Helpers ──────────────────────────────────────────────────────────────
function SoftPanel({ children, right = 64, top = 170, width = 380, left, bottom, transform }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined, transform }
    : { right, top, transform };
  return (
    <div style={{
      position: 'absolute', width,
      ...positioning,
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      gap: 12,
    }}>
      {children}
    </div>
  );
}

function PlaneAxes({ ox, oy, u, xMax, yMax }) {
  const left = toSvg(-xMax + 0.1, 0, ox, oy, u), right = toSvg(xMax, 0, ox, oy, u);
  const bot = toSvg(0, -yMax, ox, oy, u), top = toSvg(0, yMax, ox, oy, u);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} opacity={0.7} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} opacity={0.7} strokeLinecap="round"/>
      <text x={right.sx + 12} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>x</text>
      <text x={top.sx - 16} y={top.sy - 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>y</text>
    </g>
  );
}

// Concentric level circles of f(x,y) = x²+y² (radii at f = c → r = √c).
function LevelCircles({ ox, oy, u }) {
  const levels = [0.5, 1.5, 2.5, 3.5, 4.5];
  const cx = toSvg(0, 0, ox, oy, u).sx;
  const cy = toSvg(0, 0, ox, oy, u).sy;
  return (
    <g>
      {levels.map((c, i) => (
        <circle key={i} cx={cx} cy={cy} r={Math.sqrt(c) * u}
                fill="none" stroke="var(--chalk-300)"
                strokeWidth={1.2} opacity={0.45} strokeDasharray="5 5"/>
      ))}
    </g>
  );
}

// The path γ as a full closed loop.
function PathCurve({ ox, oy, u, strokeOpacity = 1 }) {
  const samples = 80;
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * 2 * Math.PI;
    const [x, y] = gamma(t);
    pts.push(toSvg(x, y, ox, oy, u));
  }
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');
  return (
    <path d={d} fill="none" stroke="var(--teal-400)"
          strokeWidth={2.4} opacity={strokeOpacity}/>
  );
}

// Generic arrow.
function Arrow({ bx, by, tx, ty, color, label, labelDX = 14, labelDY = -8,
                 strokeWidth = 2.8, headLen = 11, headHalf = 6,
                 ox, oy, u }) {
  const a = toSvg(bx, by, ox, oy, u);
  const b = toSvg(tx, ty, ox, oy, u);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = b.sx - ux * headLen;
  const baseY = b.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={16}>{label}</text>
      )}
    </g>
  );
}

// Altitude graph (z vs t).
function AltitudeGraph({ G, tCurrent, traceUpToT }) {
  // Map t ∈ [tMin, tMax] → x ∈ [gxL, gxR]
  // Map z ∈ [gBotVal, gTopVal] → y ∈ [gyB, gyT]
  const tx = (t) => G.gxL + ((t - G.gTMin) / (G.gTMax - G.gTMin)) * (G.gxR - G.gxL);
  const zy = (z) => G.gyB + ((z - G.gBotVal) / (G.gTopVal - G.gBotVal)) * (G.gyT - G.gyB);

  // Build the partial trace of z(t).
  const SAMPLES = 100;
  const tHi = Math.min(traceUpToT, G.gTMax);
  const pts = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * tHi;
    pts.push({ x: tx(t), y: zy(zOf(t)) });
  }
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Axes
  const ax0 = tx(G.gTMin), ax1 = tx(G.gTMax);
  const ay0 = zy(0), ayHi = zy(4);
  const ayMid = zy(2);

  // Marker
  const mx = tx(tCurrent);
  const my = zy(zOf(tCurrent));

  return (
    <g>
      {/* Axes */}
      <line x1={ax0} y1={ay0} x2={ax1} y2={ay0}
            stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.7}/>
      <line x1={ax0} y1={ayHi - 8} x2={ax0} y2={zy(G.gBotVal)}
            stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.7}/>
      {/* Tick marks for z = 0, 2, 4 */}
      <line x1={ax0 - 6} y1={ay0} x2={ax0} y2={ay0} stroke="var(--chalk-200)" strokeWidth={1}/>
      <text x={ax0 - 12} y={ay0 + 5} textAnchor="end"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>0</text>
      <line x1={ax0 - 6} y1={ayMid} x2={ax0} y2={ayMid} stroke="var(--chalk-200)" strokeWidth={1}/>
      <text x={ax0 - 12} y={ayMid + 5} textAnchor="end"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>2</text>
      <line x1={ax0 - 6} y1={ayHi} x2={ax0} y2={ayHi} stroke="var(--chalk-200)" strokeWidth={1}/>
      <text x={ax0 - 12} y={ayHi + 5} textAnchor="end"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>4</text>
      <text x={ax1 + 8} y={ay0 + 5}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={16}>t</text>
      <text x={ax0 - 24} y={ayHi - 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={16}>z</text>

      {/* z(t) trace */}
      <path d={d} fill="none" stroke="var(--amber-400)" strokeWidth={2.6} strokeLinecap="round"/>

      {/* Marker */}
      <circle cx={mx} cy={my} r={5}
              fill="var(--chalk-100)" stroke="var(--rose-400)" strokeWidth={2}/>
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="multivariable chain rule"
      title="Chain Rule on a Path: Gradient · Velocity"
      duration={SCENE_DURATION}
      introEnd={5.89}
      introCaption="A path across a hill — how fast does z change?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.89} end={20.67}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={20.67} end={32.67}>
        <ParticleBeat/>
      </Sprite>

      <Sprite start={32.67} end={42.23}>
        <MatchBeat/>
      </Sprite>

      <Sprite start={42.23} end={49.34}>
        <RuleBeat/>
      </Sprite>

      <Sprite start={49.34} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Setup ────────────────────────────────────────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = diagramGeom(portrait);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <SvgFadeIn duration={0.4} delay={0.2}>
          <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.6} delay={0.6}>
          <LevelCircles ox={G.ox} oy={G.oy} u={G.u}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.6} delay={1.6}>
          <PathCurve ox={G.ox} oy={G.oy} u={G.u}/>
        </SvgFadeIn>
      </svg>

      {portrait ? (
        <SoftPanel left={60} bottom={130} width={600} top={null}>
          <FadeUp duration={0.45} delay={1.8} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            map and path
          </FadeUp>
          <FadeUp duration={0.55} delay={2.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            f(x, y) = x² + y²
          </FadeUp>
          <FadeUp duration={0.55} delay={3.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--teal-400)' }}>
            γ(t) = (cos t + 1, sin t)
          </FadeUp>
          <FadeUp duration={0.5} delay={4.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '40ch', lineHeight: 1.4 }}>
            The particle will sweep around this loop.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={64} top={170} width={400}>
          <FadeUp duration={0.45} delay={1.8} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            map and path
          </FadeUp>
          <FadeUp duration={0.55} delay={2.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--chalk-100)', marginTop: 4 }}>
            f(x, y) = x² + y²
          </FadeUp>
          <FadeUp duration={0.55} delay={3.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--teal-400)' }}>
            γ(t) = (cos t + 1, sin t)
          </FadeUp>
          <FadeUp duration={0.5} delay={4.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-300)', maxWidth: '32ch', lineHeight: 1.45, marginTop: 6 }}>
            The particle will sweep around this loop.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 3: Particle sweeps along γ — gradient & velocity arrows live ────
function ParticleBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = diagramGeom(portrait);

  // Sweep t from 0 to 2π over ~10s of the beat (after a 1s lead-in).
  const sweepDelay = 1.0;
  const sweepDur = 10.0;
  const s = clamp((localTime - sweepDelay) / sweepDur, 0, 1);
  const t = s * 2 * Math.PI;
  const [px, py] = gamma(t);
  const [vx, vy] = gammaDot(t);
  const [gx, gy] = gradF(px, py);

  // Visual lengths in math coordinates.
  const VSCALE = 0.55;       // velocity is unit-length, scale it up
  const GSCALE = 0.22;       // gradient magnitude up to ~4

  const dot = gx * vx + gy * vy;     // = −2 sin t (analytic)

  const P_svg = toSvg(px, py, G.ox, G.oy, G.u);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        <LevelCircles ox={G.ox} oy={G.oy} u={G.u}/>
        <PathCurve ox={G.ox} oy={G.oy} u={G.u} strokeOpacity={0.75}/>

        {/* ∇f arrow (amber) — radial */}
        <Arrow bx={px} by={py}
               tx={px + gx * GSCALE} ty={py + gy * GSCALE}
               color="var(--amber-400)" label="∇f" labelDX={10} labelDY={-6}
               ox={G.ox} oy={G.oy} u={G.u}/>

        {/* γ'(t) arrow (violet) — tangent */}
        <Arrow bx={px} by={py}
               tx={px + vx * VSCALE} ty={py + vy * VSCALE}
               color="var(--violet-400)" label="γ'(t)" labelDX={10} labelDY={14}
               ox={G.ox} oy={G.oy} u={G.u}/>

        {/* The particle */}
        <circle cx={P_svg.sx} cy={P_svg.sy} r={5.5}
                fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1.2}/>
      </svg>

      {portrait ? (
        <SoftPanel left={60} bottom={130} width={600} top={null}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            gradient and velocity
          </FadeUp>
          <FadeUp duration={0.5} delay={1.0} distance={8}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--amber-400)' }}>
            ∇f = (2x, 2y)
          </FadeUp>
          <FadeUp duration={0.5} delay={1.6} distance={8}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--violet-400)' }}>
            γ'(t) = (−sin t, cos t)
          </FadeUp>
          <FadeUp duration={0.5} delay={2.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 14,
                     color: 'var(--chalk-200)', letterSpacing: '0.05em' }}>
            ∇f · γ' = {dot.toFixed(2)}
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={64} top={170} width={420}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            gradient and velocity
          </FadeUp>
          <FadeUp duration={0.55} delay={1.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--amber-400)' }}>
            ∇f = (2x, 2y)
          </FadeUp>
          <FadeUp duration={0.55} delay={1.6} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--violet-400)' }}>
            γ'(t) = (−sin t, cos t)
          </FadeUp>
          <FadeUp duration={0.5} delay={2.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 18,
                     color: 'var(--chalk-100)', letterSpacing: '0.04em',
                     marginTop: 6 }}>
            ∇f · γ' = {dot.toFixed(2)}
          </FadeUp>
          <FadeUp duration={0.5} delay={3.4} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4 }}>
            Their dot product is the rate of altitude change.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 4: Altitude graph drawn in sync ─────────────────────────────────
function MatchBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = diagramGeom(portrait);

  // Sweep t through one full period synced with the trace.
  const sweepDelay = 0.3;
  const sweepDur = 9.0;
  const s = clamp((localTime - sweepDelay) / sweepDur, 0, 1);
  const t = s * 2 * Math.PI;
  const [px, py] = gamma(t);
  const [vx, vy] = gammaDot(t);
  const [gx, gy] = gradF(px, py);

  const VSCALE = 0.55;
  const GSCALE = 0.22;
  const P_svg = toSvg(px, py, G.ox, G.oy, G.u);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        <LevelCircles ox={G.ox} oy={G.oy} u={G.u}/>
        <PathCurve ox={G.ox} oy={G.oy} u={G.u} strokeOpacity={0.6}/>

        {/* Particle and live arrows */}
        <Arrow bx={px} by={py}
               tx={px + gx * GSCALE} ty={py + gy * GSCALE}
               color="var(--amber-400)"
               ox={G.ox} oy={G.oy} u={G.u}/>
        <Arrow bx={px} by={py}
               tx={px + vx * VSCALE} ty={py + vy * VSCALE}
               color="var(--violet-400)"
               ox={G.ox} oy={G.oy} u={G.u}/>
        <circle cx={P_svg.sx} cy={P_svg.sy} r={5.5}
                fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1.2}/>

        {/* Altitude graph */}
        <AltitudeGraph G={G} tCurrent={t} traceUpToT={t}/>
      </svg>

      {/* Formula label — placed above the altitude graph in portrait to
          clear the corner mascot, and below the graph in landscape. */}
      <FadeUp duration={0.5} delay={3.0} distance={10}
        style={{
          position: 'absolute',
          ...(portrait
            ? { left: 60, top: 720, width: 600 }
            : { left: 740, top: 580, width: 460 }),
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        dz/dt = ∇f · γ'(t) = −2 sin t
      </FadeUp>

      <FadeUp duration={0.45} delay={4.2} distance={8}
        style={{
          position: 'absolute',
          ...(portrait
            ? { left: 60, top: 760, width: 600 }
            : { left: 740, top: 624, width: 460 }),
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', lineHeight: 1.4,
        }}>
        The slope of z(t) matches the dot product, point for point.
      </FadeUp>
    </>
  );
}

// ─── Beat 5: Rule line ────────────────────────────────────────────────────
function RuleBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28, maxWidth: portrait ? 620 : 'none',
      textAlign: 'center',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        the chain rule
      </FadeUp>

      <FadeUp duration={0.5} delay={0.2} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 36, color: 'var(--chalk-200)',
        }}>
        z(t) = f(γ(t))
      </FadeUp>

      <FadeUp duration={0.7} delay={1.2} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 36 : 52, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        dz/dt = ∇f(γ(t)) · γ'(t)
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 17,
          color: 'var(--chalk-300)', maxWidth: portrait ? '28ch' : '46ch',
          lineHeight: 1.4, marginTop: 6,
        }}>
        Gradient times velocity. That is the whole chain rule.
      </FadeUp>
    </div>
  );
}

// ─── Beat 6: Takeaway ─────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.6} delay={0.1} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '38ch', lineHeight: 1.25,
        }}>
        Gradient · velocity = <br/>
        <span style={{ color: 'var(--amber-300)' }}>slope along the path.</span>
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
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
