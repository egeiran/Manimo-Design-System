// Separable Variables: The Circle Family — Manimo lesson scene.
// Chapter 4 of mat2b (Differensialligninger). The canonical first-order
// separable ODE worked geometrically and algebraically side by side:
//
//   dy/dx = −x/y       →    y dy = −x dx    →    x² + y² = C
//
// The slope field has tangent direction (1, −x/y) at each (x, y) — which is
// exactly the tangent to a circle centred at the origin. So the solution
// curves are concentric circles. Sweeping the constant C traces out the
// whole family; every visible tangent in the field agrees with the circle
// passing through that grid point.
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//   0– 4.5   Manimo hook + intro caption
//   4.5–13.5 The ODE + slope field
//  13.5–22   Separate variables — y to the left, x to the right
//  22–31     Integrate both sides — y²/2 = −x²/2 + C
//  31–41     Reveal: family of circles. GENUINE MOTION — sweep C.
//  41–46     Takeaway — when the equation factors, integrate side by side
//
// Colour discipline:
//   chalk-200  axes
//   chalk-300  slope-field strokes, off-active circles, body captions
//   amber-400  active circle, primary stroke
//   amber-300  payoff formulas
//   rose-400   active point P (tangent agreement marker)
//   violet-400 the ODE label

const SCENE_DURATION = 71;

const NARRATION = [
  /*  0.00– 4.50 */ "Sometimes the x's and the y's want to live on different sides of an equation. When they do, integration is easy.",
  /*  4.50–13.50 */ 'Take the equation d y by d x equals minus x over y. At every point, the slope is minus x over y — a tangent that turns with the position. What family of curves matches that slope everywhere?',
  /* 13.50–22.00 */ 'Cross-multiply: y d y equals minus x d x. Every y has crossed to the left side, every x to the right. The variables are separated.',
  /* 22.00–31.00 */ 'Now integrate both sides. The integral of y d y is y squared over two; the integral of minus x d x is minus x squared over two. Bundle the constants: x squared plus y squared equals C.',
  /* 31.00–41.00 */ 'And the family is circles, centred at the origin. Pick a value for C; that picks one circle. Slide C, and the whole family materialises — each curve riding its own slope field tangent at every point.',
  /* 41.00–46.00 */ 'If you can factor the equation so x is with d x and y is with d y, you can integrate side by side. That is the separable trick.',
];

const NARRATION_AUDIO = 'audio/separable-variables-circles/scene.mp3';

// ─── Plane coordinates ────────────────────────────────────────────────────
function planeGeom(portrait) {
  return portrait
    // Portrait: panel sits to the right of the bottom-left Manimo mascot.
    ? { ox: 360, oy: 580, u: 88, xMax: 2.4, yMax: 2.4,
        panelW: 500, panelLeft: 140, panelBottom: 96 }
    : { ox: 440, oy: 380, u: 100, xMax: 2.4, yMax: 2.0,
        panelW: 400, panelRight: 60, panelTop: 180 };
}

function toSvg(x, y, ox, oy, u) {
  return { sx: ox + x * u, sy: oy - y * u };
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function SoftPanel({ children, right, top, width = 380, left, bottom }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined }
    : { right, top };
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
    }}>{children}</div>
  );
}

function PlaneAxes({ ox, oy, u, xMax, yMax }) {
  const left = toSvg(-xMax, 0, ox, oy, u), right = toSvg(xMax, 0, ox, oy, u);
  const bot = toSvg(0, -yMax, ox, oy, u), top = toSvg(0, yMax, ox, oy, u);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}/>
      <text x={right.sx + 14} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>x</text>
      <text x={top.sx - 18} y={top.sy - 8}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>y</text>
    </g>
  );
}

// Slope field for dy/dx = -x/y. At each grid point, draw a short stroke
// along (1, -x/y) — normalised so all strokes have equal length. We skip
// y = 0 (vertical tangent, infinite slope).
function SlopeField({ ox, oy, u, xMax, yMax, step = 0.5, strokeLen = 22, opacity = 0.55 }) {
  const strokes = [];
  for (let x = -xMax + step / 2; x < xMax; x += step) {
    for (let y = -yMax + step / 2; y < yMax; y += step) {
      // Tangent direction (perpendicular to the radial direction).
      // Use (1, -x/y) normalised, except when y ≈ 0 — then tangent is (0, 1).
      let tx, ty;
      if (Math.abs(y) < 1e-3) {
        tx = 0; ty = 1;
      } else {
        const dx = 1, dy = -x / y;
        const norm = Math.hypot(dx, dy);
        tx = dx / norm; ty = dy / norm;
      }
      const c = toSvg(x, y, ox, oy, u);
      const sxh = (strokeLen / 2) * tx;
      const syh = -(strokeLen / 2) * ty;  // svg y inverted
      strokes.push(
        <line key={`${x.toFixed(2)}-${y.toFixed(2)}`}
              x1={c.sx - sxh} y1={c.sy - syh}
              x2={c.sx + sxh} y2={c.sy + syh}
              stroke="var(--chalk-300)" strokeWidth={1.3}
              strokeLinecap="round" opacity={opacity}/>
      );
    }
  }
  return <g>{strokes}</g>;
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="first-order ODEs"
      title="Separable Variables: The Circle Family"
      duration={SCENE_DURATION}
      introEnd={7}
      introCaption="Separate, then integrate."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7} end={21.36}>
        <OdeBeat/>
      </Sprite>

      <Sprite start={21.36} end={31.89}>
        <SeparateBeat/>
      </Sprite>

      <Sprite start={31.89} end={46.61}>
        <IntegrateBeat/>
      </Sprite>

      <Sprite start={46.61} end={60.27}>
        <CircleFamilyBeat/>
      </Sprite>

      <Sprite start={60.27} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: the ODE + slope field ────────────────────────────────────────
function OdeBeat() {
  const portrait = usePortrait();
  const G = planeGeom(portrait);
  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={1280} height={720} viewBox="0 0 1280 720">
        <SvgFadeIn duration={0.4} delay={0.2}>
          <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.7} delay={0.6}>
          <SlopeField ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        </SvgFadeIn>
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}>
          <FadeUp duration={0.45} delay={1.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            the ode
          </FadeUp>
          <FadeUp duration={0.55} delay={1.6} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--violet-400)' }}>
            dy/dx = −x/y
          </FadeUp>
          <FadeUp duration={0.5} delay={2.6} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4 }}>
            What curves have this slope everywhere?
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={1.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            the ode
          </FadeUp>
          <FadeUp duration={0.6} delay={1.6} distance={12}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 36, color: 'var(--violet-400)', marginTop: 4 }}>
            dy/dx = −x/y
          </FadeUp>
          <FadeUp duration={0.5} delay={2.6} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-200)', maxWidth: '32ch', lineHeight: 1.4,
                     marginTop: 6 }}>
            Slope spins with the position.
          </FadeUp>
          <FadeUp duration={0.5} delay={3.6} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4 }}>
            What curves have this slope everywhere?
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 3: Separate the variables (algebra animation) ───────────────────
// GENUINE MOTION: a "× y dx" badge slides up from below and lands between
// the two equation lines, then the second line — y dy = -x dx — writes in.
// The badge fades after landing so it doesn't compete with the takeaway form.
function SeparateBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  // Badge motion: rises from off-screen-below to its mid-row position between
  // t=1.0 and t=2.0 (eased), then lingers and fades by t=3.4.
  const rise = clamp((localTime - 1.0) / 1.0, 0, 1);
  const eased = Easing.easeInOutCubic(rise);
  const badgeOpacity = localTime < 3.0
    ? clamp(rise, 0, 1)
    : clamp(1 - (localTime - 3.0) / 0.6, 0, 1);
  // Badge slides from +60 px below its rest position to 0 px.
  const badgeOffsetY = (1 - eased) * 60;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 22, maxWidth: portrait ? 620 : 'none',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        separate the variables
      </FadeUp>

      {/* Step 1: the original. */}
      <FadeUp duration={0.5} delay={0.2} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 50,
          color: 'var(--chalk-200)',
        }}>
        dy/dx = −x/y
      </FadeUp>

      {/* The "× y dx" badge — slides in between the two lines. */}
      <div style={{
        height: portrait ? 30 : 36,
        opacity: badgeOpacity,
        transform: `translateY(${badgeOffsetY}px)`,
        fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 16,
        color: 'var(--amber-300)', letterSpacing: '0.08em',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 28, height: 1, background: 'rgba(244,184,96,0.5)' }}/>
        × y dx (both sides)
        <span style={{ width: 28, height: 1, background: 'rgba(244,184,96,0.5)' }}/>
      </div>

      {/* Step 2: rearranged form. Appears after the badge has landed. */}
      {localTime > 2.0 && (
        <FadeUp duration={0.55} delay={0} distance={14}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 44 : 58, color: 'var(--amber-300)',
            letterSpacing: '0.02em',
          }}>
          y dy = −x dx
        </FadeUp>
      )}

      <FadeUp duration={0.5} delay={3.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '28ch' : '42ch', lineHeight: 1.4,
          marginTop: portrait ? 4 : 10,
        }}>
        every y is on the left; every x is on the right
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Integrate both sides ─────────────────────────────────────────
function IntegrateBeat() {
  const portrait = usePortrait();
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 30 : 38, letterSpacing: '0.02em',
    textAlign: 'center',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28, maxWidth: portrait ? 620 : 'none',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        integrate both sides
      </FadeUp>

      <FadeUp duration={0.5} delay={0.2} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        ∫ y dy = ∫ −x dx
      </FadeUp>

      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-100)' }}>
        y²⁄2 = −x²⁄2 + C₁
      </FadeUp>

      <FadeUp duration={0.4} delay={2.4} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 18,
          color: 'var(--chalk-300)',
        }}>
        ⇓ (multiply by 2, rename 2C₁ → C)
      </FadeUp>

      <FadeUp duration={0.7} delay={3.0} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 50 : 64, color: 'var(--amber-300)',
          letterSpacing: '0.02em', marginTop: portrait ? 2 : 6,
        }}>
        x² + y² = C
      </FadeUp>

      <FadeUp duration={0.5} delay={4.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '30ch' : '42ch', lineHeight: 1.4,
        }}>
        one constant — one parameter family
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Circle family — GENUINE MOTION ───────────────────────────────
// The constant C sweeps from 0.4 to ~4.4 (radius √C from ~0.63 to ~2.1).
// At each instant: draw the active circle in amber, plus a few "ghost" arcs
// of previously-visited C values, plus a moving point P on the circle with
// a rose tangent vector that always agrees with the underlying slope field.
function CircleFamilyBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = planeGeom(portrait);

  // Sweep parameter: 0 → 1 over the first 7.5 s, then hold.
  const sweepDur = 7.5;
  const sweepDelay = 0.5;
  const s = clamp((localTime - sweepDelay) / sweepDur, 0, 1);
  const eased = Easing.easeInOutCubic(s);
  const cMin = 0.4, cMax = 4.4;
  const C = cMin + (cMax - cMin) * eased;
  const r = Math.sqrt(C);   // circle radius

  // Ghost circles: fixed at well-spaced C values so the family is legible.
  const ghosts = [0.6, 1.6, 3.0];

  // Active point P on the circle: parametrise by an angle that sweeps too.
  // Start near top-left (φ ≈ 2π/3) so the tangent is clearly visible against
  // a bright stretch of the active circle.
  const phi = (Math.PI * 2 * 0.30) * eased + Math.PI * 0.55;
  const px = r * Math.cos(phi);
  const py = r * Math.sin(phi);
  const P = toSvg(px, py, G.ox, G.oy, G.u);

  // Tangent direction at P on the circle (perpendicular to radial), pointing CCW.
  // Tangent = (−sin φ, cos φ).
  const tx = -Math.sin(phi);
  const ty = Math.cos(phi);
  const tlen = 0.75;                         // length in math coords
  const Tend = toSvg(px + tx * tlen, py + ty * tlen, G.ox, G.oy, G.u);

  // Origin marker.
  const Ocoord = toSvg(0, 0, G.ox, G.oy, G.u);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={1280} height={720} viewBox="0 0 1280 720">
        <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        <SlopeField ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}
                    opacity={0.22}/>

        {/* Ghost circles for visited C values */}
        {ghosts.map((cg, i) => {
          const visible = C >= cg - 0.05;
          if (!visible) return null;
          const opacity = clamp((C - cg) / 0.4, 0.0, 1.0) * 0.32;
          return (
            <circle key={i}
                    cx={Ocoord.sx} cy={Ocoord.sy} r={Math.sqrt(cg) * G.u}
                    fill="none" stroke="var(--amber-400)"
                    strokeWidth={1.4} opacity={opacity}/>
          );
        })}

        {/* Active circle */}
        <circle cx={Ocoord.sx} cy={Ocoord.sy} r={r * G.u}
                fill="none" stroke="var(--amber-400)"
                strokeWidth={3.2} opacity={0.95}/>

        {/* Tangent vector at P — bright rose */}
        <line x1={P.sx} y1={P.sy} x2={Tend.sx} y2={Tend.sy}
              stroke="var(--rose-400)" strokeWidth={3.0} strokeLinecap="round"/>
        {/* Arrow head */}
        {(() => {
          const dx = Tend.sx - P.sx, dy = Tend.sy - P.sy;
          const len = Math.hypot(dx, dy);
          if (len < 0.5) return null;
          const ux = dx / len, uy = dy / len;
          const headLen = 11, headHalf = 6;
          const baseX = Tend.sx - ux * headLen, baseY = Tend.sy - uy * headLen;
          const perpX = -uy, perpY = ux;
          return (
            <path d={`M ${Tend.sx} ${Tend.sy} L ${baseX + perpX * headHalf} ${baseY + perpY * headHalf} L ${baseX - perpX * headHalf} ${baseY - perpY * headHalf} Z`}
                  fill="var(--rose-400)"/>
          );
        })()}

        {/* Point P */}
        <circle cx={P.sx} cy={P.sy} r={5.5}
                fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={1.2}/>

        {/* Origin tiny dot */}
        <circle cx={Ocoord.sx} cy={Ocoord.sy} r={2.5}
                fill="var(--chalk-200)" opacity={0.7}/>
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            family of solutions
          </FadeUp>
          <FadeUp duration={0.5} delay={0.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 24, color: 'var(--amber-300)' }}>
            x² + y² = C
          </FadeUp>
          <FadeUp duration={0.5} delay={1.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 14,
                     color: 'var(--chalk-200)', letterSpacing: '0.04em' }}>
            C = {C.toFixed(2)}   r = {r.toFixed(2)}
          </FadeUp>
          <FadeUp duration={0.5} delay={2.6} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4 }}>
            Tangent at P always matches the slope field.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            family of solutions
          </FadeUp>
          <FadeUp duration={0.55} delay={0.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 30, color: 'var(--amber-300)', marginTop: 4 }}>
            x² + y² = C
          </FadeUp>
          <FadeUp duration={0.5} delay={1.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 16,
                     color: 'var(--chalk-200)', letterSpacing: '0.05em',
                     marginTop: 8 }}>
            C = {C.toFixed(2)}    r = √C = {r.toFixed(2)}
          </FadeUp>
          <FadeUp duration={0.5} delay={2.6} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-300)', maxWidth: '32ch', lineHeight: 1.4 }}>
            The rose tangent at P always agrees with the slope field —
            because the circle <span style={{ fontStyle: 'italic', color: 'var(--chalk-100)' }}>is</span> the solution.
          </FadeUp>
        </SoftPanel>
      )}
    </>
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
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the separable trick
      </FadeUp>

      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 34 : 50, color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '40ch', lineHeight: 1.25,
        }}>
        f(y) dy = g(x) dx<br/>
        <span style={{ color: 'var(--amber-300)' }}>→ integrate both sides</span>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
          maxWidth: portrait ? '30ch' : '46ch', textAlign: 'center',
          lineHeight: 1.4, marginTop: 6,
        }}>
        (works whenever the ODE factors into a y-piece and an x-piece)
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
