// Clairaut's Theorem: Order Doesn't Matter — Manimo lesson scene.
// Chapter 5 of mat2b (Funksjoner og derivasjon). Symmetry of second-order
// mixed partials. For a smooth f, ∂²f/∂x∂y = ∂²f/∂y∂x.
//
// We make the symmetry visible two ways:
//   1. Compute the two paths side-by-side on a concrete function, watch
//      them land on the same expression.
//   2. Animate the geometric reading: a small rectangle of side h × k
//      around (a, b) and the corner-sum
//        Δ(h, k) = ( f(a+h, b+k) − f(a, b+k) − f(a+h, b) + f(a, b) ) / (h k)
//      converging to f_xy as h, k → 0. The same Δ is the limit of f_yx
//      whether you slice "rows then columns" or "columns then rows".
//
// Test function:  f(x, y) = x²y + sin(xy)
//   f_x = 2xy + y cos(xy)         f_y = x² + x cos(xy)
//   f_xy = 2x + cos(xy) − xy sin(xy)
//   f_yx = 2x + cos(xy) − xy sin(xy)   ← same
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//    0– 4.5   Manimo hook
//    4.5–22   Side-by-side computation, two paths land on same answer
//   22–38     Shrinking rectangle + live corner-sum → f_xy (GENUINE MOTION)
//   38–44     Smoothness condition (Clairaut requires continuity)
//   44–end    Takeaway: Hessian is symmetric
//
// Colour discipline:
//   chalk-200/300  axes, body text
//   amber-400      "∂/∂x first" path (left column)
//   teal-400       "∂/∂y first" path (right column)
//   rose-400       corner sum + the symmetric mixed-partial answer
//   amber-300      payoff accent

const SCENE_DURATION = 68;

const NARRATION = [
  /*  0.0– 4.5 */ 'Mixed partials: differentiate in x, then in y. Or do it the other way round. The order should not matter — and for smooth functions, it does not.',
  /*  4.5–22   */ 'Pick a function: f equals x squared y, plus sine of x y. Walk the left path: differentiate in x first, then in y. Walk the right path: differentiate in y first, then in x. Two different intermediate expressions, but the second derivative lands on the same place.',
  /* 22  –38   */ 'Why does this happen? Take a tiny rectangle of width h and height k anchored at the point. Add the corners of f with alternating signs and divide by h k. As the rectangle shrinks, the two ways to slice it — rows first or columns first — give the same limit. That limit is the mixed partial.',
  /* 38  –44   */ 'The theorem needs a continuity condition. If both mixed partials exist and are continuous, they agree. For polynomials, exponentials, sines, and almost everything you meet in this course, that holds.',
  /* 44  –end  */ 'Mixed partials commute. The Hessian matrix is symmetric.',
];

const NARRATION_AUDIO = 'audio/clairaut-mixed-partials/scene.mp3';

// ─── The function ─────────────────────────────────────────────────────────
function f(x, y) { return x * x * y + Math.sin(x * y); }
// True f_xy = 2x + cos(xy) − xy sin(xy).
function fxy(x, y) { return 2 * x + Math.cos(x * y) - x * y * Math.sin(x * y); }

// Sample anchor for the rectangle beat.
const X0 = 0.9, Y0 = 0.5;
const TRUE_FXY = fxy(X0, Y0);   // ≈ 1.80 + 0.901 − 0.45·sin(0.45) ≈ 2.49 (~ish)

// Corner-sum approximation to f_xy at (X0, Y0).
function cornerSum(h, k) {
  return (f(X0 + h, Y0 + k) - f(X0, Y0 + k) - f(X0 + h, Y0) + f(X0, Y0)) / (h * k);
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function SoftPanel({ children, right = 64, top = 196, width = 380, left, bottom }) {
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
    }}>
      {children}
    </div>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="mixed partials commute"
      title="Order Doesn't Matter"
      duration={SCENE_DURATION}
      introEnd={9.73}
      introCaption="x then y, or y then x — same answer."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.73} end={29.74}>
        <TwoPathsBeat/>
      </Sprite>

      <Sprite start={29.74} end={49.67}>
        <RectangleBeat/>
      </Sprite>

      <Sprite start={49.67} end={62.59}>
        <SmoothnessBeat/>
      </Sprite>

      <Sprite start={62.59} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Two computation paths ───────────────────────────────────────
function TwoPathsBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const colStyle = (color) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: portrait ? 12 : 16,
    padding: portrait ? '14px 18px' : '20px 24px',
    background: 'rgba(0,0,0,0.40)',
    border: '1px solid rgba(232,220,193,0.07)',
    borderTop: `3px solid ${color}`,
    borderRadius: 12,
    minWidth: portrait ? 280 : 340,
  });

  const lblStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 11,
    letterSpacing: '0.14em', textTransform: 'uppercase',
  };
  const exprStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 16 : 20,
    lineHeight: 1.35, textAlign: 'center',
  };

  // Step reveals: 0.4 path heading, 1.6 first derivative, 4.0 second
  // derivative, 6.5 convergence line. Two paths in parallel — same delays
  // on left and right.
  return (
    <>
      <div style={{
        position: 'absolute', left: '50%', top: portrait ? '46%' : '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: portrait ? 18 : 24, width: '100%',
      }}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 26 : 32, color: 'var(--chalk-100)',
          }}>
          f(x, y) = x²y + sin(xy)
        </FadeUp>

        <div style={{
          display: 'flex', flexDirection: portrait ? 'column' : 'row',
          gap: portrait ? 16 : 32, alignItems: 'stretch', justifyContent: 'center',
        }}>
          {/* Left path: ∂/∂x then ∂/∂y. */}
          <FadeUp duration={0.5} delay={1.0} distance={10} style={colStyle('var(--amber-400)')}>
            <div style={{ ...lblStyle, color: 'var(--amber-400)' }}>∂/∂x first, then ∂/∂y</div>
            <div style={{ ...exprStyle, color: 'var(--amber-300)' }}>
              f<sub>x</sub> = 2xy + y cos(xy)
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16,
                          color: 'var(--chalk-300)' }}>↓ &nbsp; ∂/∂y</div>
            <div style={{ ...exprStyle, color: 'var(--chalk-100)',
                          fontSize: portrait ? 17 : 22 }}>
              f<sub>xy</sub> = 2x + cos(xy) − xy sin(xy)
            </div>
          </FadeUp>

          {/* Right path: ∂/∂y then ∂/∂x. */}
          <FadeUp duration={0.5} delay={1.0} distance={10} style={colStyle('var(--teal-400)')}>
            <div style={{ ...lblStyle, color: 'var(--teal-400)' }}>∂/∂y first, then ∂/∂x</div>
            <div style={{ ...exprStyle, color: 'var(--teal-400)' }}>
              f<sub>y</sub> = x² + x cos(xy)
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16,
                          color: 'var(--chalk-300)' }}>↓ &nbsp; ∂/∂x</div>
            <div style={{ ...exprStyle, color: 'var(--chalk-100)',
                          fontSize: portrait ? 17 : 22 }}>
              f<sub>yx</sub> = 2x + cos(xy) − xy sin(xy)
            </div>
          </FadeUp>
        </div>

        {/* Convergence line: f_xy = f_yx. */}
        {localTime > 8.0 && (
          <FadeUp duration={0.6} delay={0.0} distance={14}
            style={{
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontSize: portrait ? 24 : 34, color: 'var(--amber-300)',
              letterSpacing: '0.02em', marginTop: 6,
            }}>
            f<sub>xy</sub> = f<sub>yx</sub>
            <span style={{ marginLeft: 14, color: 'var(--rose-400)',
                            fontFamily: 'var(--font-mono)' }}>✓</span>
          </FadeUp>
        )}
      </div>
    </>
  );
}

// ─── Beat 3: Shrinking rectangle + corner-sum readout ────────────────────
// The genuine animation. The rectangle of side h × k around (X0, Y0)
// shrinks over the beat; we draw it on an x–y grid and show its four
// corners with alternating signs. A live readout shows
//   Δ(h, k) = (f(x+h,y+k) − f(x,y+k) − f(x+h,y) + f(x,y))/(h k)
// converging to f_xy(X0, Y0). At the same time, a smaller "x then y" /
// "y then x" panel shows that both slicing orders produce the same Δ.
function RectangleBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // Plane geometry.
  const G = portrait
    ? { ox: 130, oy: 620, ux: 230, uy: 230, vbW: 720, vbH: 980,
        xMin: 0, xMax: 2.0, yMin: 0, yMax: 1.6,
        panelLeft: 50, panelBottom: 210, panelW: 620 }
    : { ox: 250, oy: 440, ux: 200, uy: 200, vbW: 1280, vbH: 720,
        xMin: 0, xMax: 2.0, yMin: 0, yMax: 1.6,
        panelRight: 64, panelTop: 130, panelW: 460 };

  function toSvg(x, y) { return { sx: G.ox + x * G.ux, sy: G.oy - y * G.uy }; }

  // Shrink schedule for h and k. Start big (h = 0.7, k = 0.5) and decay
  // exponentially to ~0.04 over the beat, with a small pre-roll.
  const preroll = 1.0;
  const sweepDur = Math.max(spriteDur - preroll - 1.2, 6);
  const t = clamp((localTime - preroll) / sweepDur, 0, 1);
  // Easing — fast at first, slow as it approaches zero, but never zero.
  const decay = Math.exp(-3.4 * Easing.easeInOutCubic(t));
  const h = 0.7 * decay + 0.04 * (1 - decay);
  const k = 0.5 * decay + 0.04 * (1 - decay);

  const cs = cornerSum(h, k);

  const A = toSvg(X0, Y0);
  const B = toSvg(X0 + h, Y0);
  const C = toSvg(X0 + h, Y0 + k);
  const D = toSvg(X0, Y0 + k);

  // Background grid.
  function grid() {
    const lines = [];
    for (let i = 0; i <= 4; i++) {
      const x = G.xMin + (G.xMax - G.xMin) * (i / 4);
      const yMin = toSvg(x, G.yMin), yMax = toSvg(x, G.yMax);
      lines.push(<line key={`v${i}`} x1={yMin.sx} y1={yMin.sy} x2={yMax.sx} y2={yMax.sy}
                       stroke="var(--chalk-300)" strokeWidth={0.7} opacity={0.25}/>);
    }
    for (let j = 0; j <= 4; j++) {
      const y = G.yMin + (G.yMax - G.yMin) * (j / 4);
      const xMin = toSvg(G.xMin, y), xMax = toSvg(G.xMax, y);
      lines.push(<line key={`h${j}`} x1={xMin.sx} y1={xMin.sy} x2={xMax.sx} y2={xMax.sy}
                       stroke="var(--chalk-300)" strokeWidth={0.7} opacity={0.25}/>);
    }
    return <g>{lines}</g>;
  }

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <SvgFadeIn duration={0.4} delay={0.2}>{grid()}</SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={0.2}>
          {/* Axes. */}
          <line x1={toSvg(G.xMin, G.yMin).sx} y1={toSvg(G.xMin, G.yMin).sy}
                x2={toSvg(G.xMax, G.yMin).sx} y2={toSvg(G.xMax, G.yMin).sy}
                stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.7}/>
          <line x1={toSvg(G.xMin, G.yMin).sx} y1={toSvg(G.xMin, G.yMin).sy}
                x2={toSvg(G.xMin, G.yMax).sx} y2={toSvg(G.xMin, G.yMax).sy}
                stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.7}/>
          <text x={toSvg(G.xMax, G.yMin).sx + 10} y={toSvg(G.xMax, G.yMin).sy + 6}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>x</text>
          <text x={toSvg(G.xMin, G.yMax).sx - 18} y={toSvg(G.xMin, G.yMax).sy - 4}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>y</text>
        </SvgFadeIn>

        {/* The rectangle. */}
        <path d={`M ${A.sx} ${A.sy} L ${B.sx} ${B.sy} L ${C.sx} ${C.sy} L ${D.sx} ${D.sy} Z`}
              fill="rgba(244,184,96,0.10)"
              stroke="var(--amber-400)" strokeWidth={1.8}/>

        {/* h and k brackets, only when h ≥ ~0.1 (otherwise labels overlap). */}
        {h > 0.12 && (
          <g>
            <line x1={A.sx} y1={A.sy + 14} x2={B.sx} y2={B.sy + 14}
                  stroke="var(--chalk-300)" strokeWidth={1}/>
            <text x={(A.sx + B.sx) / 2} y={A.sy + 28} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                  fontSize={15}>h</text>
            <line x1={A.sx - 14} y1={A.sy} x2={D.sx - 14} y2={D.sy}
                  stroke="var(--chalk-300)" strokeWidth={1}/>
            <text x={A.sx - 22} y={(A.sy + D.sy) / 2 + 5} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                  fontSize={15}>k</text>
          </g>
        )}

        {/* Corner markers with +/− signs. */}
        {[
          { P: A, sign: '+', col: 'var(--chalk-100)', dx: -10, dy: 18 },
          { P: B, sign: '−', col: 'var(--amber-400)', dx: 12,  dy: 18 },
          { P: C, sign: '+', col: 'var(--rose-400)', dx: 12,  dy: -10 },
          { P: D, sign: '−', col: 'var(--teal-400)', dx: -16, dy: -10 },
        ].map((c, i) => (
          <g key={i}>
            <circle cx={c.P.sx} cy={c.P.sy} r={4.5}
                    fill={c.col} stroke="var(--chalk-200)" strokeWidth={0.8}/>
            {h > 0.1 && (
              <text x={c.P.sx + c.dx} y={c.P.sy + c.dy}
                    fill={c.col} fontFamily="var(--font-mono)" fontSize={14}>
                {c.sign}
              </text>
            )}
          </g>
        ))}

        {/* Point (X0, Y0) label. */}
        <text x={A.sx - 8} y={A.sy + 40}
              fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}
              letterSpacing="0.06em">
          (x, y) = ({X0.toFixed(1)}, {Y0.toFixed(1)})
        </text>
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            corner-sum approximation
          </FadeUp>

          <FadeUp duration={0.5} delay={0.4} distance={8}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 15, color: 'var(--chalk-100)', lineHeight: 1.4, maxWidth: '44ch' }}>
            Δ(h, k) = <span style={{ color: 'var(--rose-400)' }}>
              (f<sub>++</sub> − f<sub>−+</sub> − f<sub>+−</sub> + f<sub>−−</sub>) / (h k)
            </span>
          </FadeUp>

          <div style={{ display: 'flex', gap: 22, fontFamily: 'var(--font-mono)',
                        alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--chalk-300)',
                            letterSpacing: '0.10em' }}>h · k</div>
              <div style={{ fontSize: 18, color: 'var(--amber-400)' }}>
                {h.toFixed(3)} · {k.toFixed(3)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--chalk-300)',
                            letterSpacing: '0.10em' }}>Δ(h, k)</div>
              <div style={{ fontSize: 24, color: 'var(--rose-400)' }}>
                {cs.toFixed(3)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--chalk-300)',
                            letterSpacing: '0.10em' }}>f<sub>xy</sub> exact</div>
              <div style={{ fontSize: 18, color: 'var(--amber-300)' }}>
                {TRUE_FXY.toFixed(3)}
              </div>
            </div>
          </div>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            corner-sum approximation
          </FadeUp>

          <FadeUp duration={0.5} delay={0.4} distance={8}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 17, color: 'var(--chalk-100)', lineHeight: 1.4,
                     maxWidth: '36ch', marginTop: 4 }}>
            Δ(h, k) = <span style={{ color: 'var(--rose-400)' }}>
              (f<sub>++</sub> − f<sub>−+</sub> − f<sub>+−</sub> + f<sub>−−</sub>) / (h k)
            </span>
          </FadeUp>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              <span style={{ color: 'var(--chalk-300)' }}>h · k</span>
              <span style={{ color: 'var(--amber-400)' }}>
                {h.toFixed(3)} · {k.toFixed(3)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              <span style={{ color: 'var(--chalk-300)' }}>Δ(h, k) ≈</span>
              <span style={{ color: 'var(--rose-400)', fontSize: 17 }}>
                {cs.toFixed(3)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              <span style={{ color: 'var(--chalk-300)' }}>f<sub>xy</sub> exact</span>
              <span style={{ color: 'var(--amber-300)', fontSize: 17 }}>
                {TRUE_FXY.toFixed(3)}
              </span>
            </div>
          </div>

          <FadeUp duration={0.5} delay={1.4} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '34ch',
                     lineHeight: 1.45, marginTop: 10 }}>
            Rows-first or columns-first — same Δ. In the limit, both <br/>
            paths give f<sub>xy</sub>.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 4: Smoothness note ─────────────────────────────────────────────
function SmoothnessBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', maxWidth: portrait ? 600 : 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        Clairaut's theorem
      </FadeUp>

      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 30, color: 'var(--chalk-100)',
          lineHeight: 1.4, maxWidth: portrait ? '24ch' : '46ch',
        }}>
          If f<sub>xy</sub> and f<sub>yx</sub> are <span style={{ color: 'var(--amber-300)' }}>continuous</span> near (a, b),
          {' '}then{' '}
          f<sub>xy</sub>(a, b) = f<sub>yx</sub>(a, b).
      </FadeUp>

      <FadeUp duration={0.5} delay={1.7} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', maxWidth: portrait ? '28ch' : '46ch',
          lineHeight: 1.4,
        }}>
        Holds for polynomials, sines, exponentials, and almost everything else you meet.
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>

      <FadeUp duration={0.8} delay={0.4} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 36 : 52, color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '34ch', lineHeight: 1.2,
        }}>
        Mixed partials <span style={{ color: 'var(--amber-300)' }}>commute</span>.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.5} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 28, color: 'var(--rose-400)',
          maxWidth: portrait ? '26ch' : '42ch', lineHeight: 1.3,
        }}>
        The Hessian is symmetric.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 6,
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 12 : 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        H = Hᵀ — the bowl's principal axes are orthogonal
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
