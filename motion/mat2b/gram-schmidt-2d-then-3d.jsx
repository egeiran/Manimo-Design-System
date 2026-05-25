// Gram-Schmidt: Subtract the Projection — Manimo lesson scene.
// Chapter 3 / week 6 of mat2b. Visualises orthogonalisation as
//   u₁ = v₁
//   u₂ = v₂ − proj_{u₁}(v₂)
//   êₖ = uₖ / ‖uₖ‖
// and extends the recipe to 3D with the formula
//   u₃ = v₃ − proj_{u₁}(v₃) − proj_{u₂}(v₃)
// shown symbolically (no 3D rendering — the 2D drop-the-shadow image
// already carries the intuition).
//
// Beats:
//   0– 4    Manimo hook
//   4–11    Setup — v₁, v₂ non-orthogonal
//  11–17    Keep u₁ = v₁
//  17–29    Subtract the projection — drop shadow, right-angle reveal
//  29–36    Normalise — unit-length pair
//  36–43    Extend to 3D — formula card
//  43–end   Hero outro
//
// Sprite ranges are placeholders until `npm run audio` rewires them.
//
// Colour discipline:
//   chalk-200/300  axes + reference
//   violet-400     v₁ / u₁ / ê₁ (the "kept" direction)
//   teal-400       v₂ (the original, before correction)
//   rose-400       u₂ = v₂ − proj (what's left after subtraction)
//   emerald-400    right-angle confirmation
//   amber-300      takeaway accent

const SCENE_DURATION = 50;

const NARRATION = [
  "Two vectors that aren't perpendicular. Can we straighten them out?",
  "Start with two vectors, v one and v two. They span a plane, but they aren't at right angles. Gram-Schmidt fixes that.",
  "Keep the first one as the new direction u one. We will measure everything else against it.",
  "Project v two onto u one. Subtract that shadow from v two. What's left points exactly perpendicular to u one — call it u two.",
  "Now scale each one to unit length. The result is an orthonormal pair — perpendicular and length one.",
  "Same recipe in three dimensions. Take a third vector, subtract its projection onto each of the first two, normalise, and you have an orthonormal triple.",
  "Gram-Schmidt in one line: keep what's new, subtract what's already there.",
];

const NARRATION_AUDIO = 'audio/gram-schmidt-2d-then-3d/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
const ORIGIN_X = 480;
const ORIGIN_Y = 420;
const UNIT = 80;
const GRID_X_MIN = -5, GRID_X_MAX = 7;
const GRID_Y_MIN = -3, GRID_Y_MAX = 4;
const IDENTITY = [[1, 0], [0, 1]];

// The two starting vectors. Chosen so projection geometry reads cleanly.
const V1 = [3, 0.6];
const V2 = [1.5, 2.3];

// Math helpers.
function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}
function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
function scale(v, s) { return [v[0] * s, v[1] * s]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function norm(v) { return Math.hypot(v[0], v[1]); }
function projection(v, onto) {
  const k = dot(v, onto) / dot(onto, onto);
  return scale(onto, k);
}

function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="48%" cy="56%" r="58%">
          <stop offset="55%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="1280" height="720" fill={`url(#${gradId})`}/>
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>{children}</g>
    </svg>
  );
}

function FaintGrid({ opacity = 0.25 }) {
  const lines = [];
  for (let k = GRID_X_MIN; k <= GRID_X_MAX; k++) {
    const a = toSvg(k, GRID_Y_MIN), b = toSvg(k, GRID_Y_MAX);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
      stroke="var(--chalk-300)" strokeWidth={1.1} opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = GRID_Y_MIN; k <= GRID_Y_MAX; k++) {
    const a = toSvg(GRID_X_MIN, k), b = toSvg(GRID_X_MAX, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
      stroke="var(--chalk-300)" strokeWidth={1.1} opacity={opacity} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

function Axes() {
  const left = toSvg(GRID_X_MIN, 0);
  const right = toSvg(GRID_X_MAX, 0);
  const bottom = toSvg(0, GRID_Y_MIN);
  const top = toSvg(0, GRID_Y_MAX);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bottom.sx} y2={bottom.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
    </g>
  );
}

function ArrowFrom({ from, to, color, strokeWidth = 3.6, headLen = 13, headHalf = 7,
                     dashed = false, glow = 0, label = null, labelDX = 0, labelDY = 0 }) {
  const o = toSvg(from[0], from[1]);
  const tip = toSvg(to[0], to[1]);
  const dx = tip.sx - o.sx, dy = tip.sy - o.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = tip.sx - ux * headLen;
  const baseY = tip.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      {glow > 0 && (
        <line x1={o.sx} y1={o.sy} x2={tip.sx} y2={tip.sy}
              stroke={color} strokeWidth={strokeWidth + 6}
              strokeLinecap="round" opacity={0.2 * glow}/>
      )}
      <line x1={o.sx} y1={o.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={dashed ? '7 7' : undefined}/>
      <path d={`M ${tip.sx} ${tip.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={tip.sx + labelDX} y={tip.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

function Vector(props) {
  // NB: no object-rest destructuring here. Babel-standalone hoists `...rest`
  // to a top-level `const _excluded`, which collides with the identical helper
  // emitted by manimo-motion.jsx (ManimoEnter) since the Babel <script>s share
  // global scope — and the whole scene fails to mount. Spread props instead.
  return <ArrowFrom {...props} from={[0, 0]} to={[props.x, props.y]}/>;
}

function SoftPanel({ children, right = 64, top = 196, width = 380, left, bottom, transform }) {
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
      gap: 14,
    }}>
      {children}
    </div>
  );
}

function RightAngleMark({ along, perp, size = 16, color = 'var(--emerald-400)' }) {
  // Draw a small right-angle square at origin where `along` and `perp` meet.
  const a = norm(along), p = norm(perp);
  const aU = [along[0] / a, along[1] / a];
  const pU = [perp[0] / p, perp[1] / p];
  const sizeUnits = size / UNIT;
  const p1 = toSvg(aU[0] * sizeUnits, aU[1] * sizeUnits);
  const p2 = toSvg(aU[0] * sizeUnits + pU[0] * sizeUnits, aU[1] * sizeUnits + pU[1] * sizeUnits);
  const p3 = toSvg(pU[0] * sizeUnits, pU[1] * sizeUnits);
  const origin = toSvg(0, 0);
  return (
    <path d={`M ${p1.sx} ${p1.sy} L ${p2.sx} ${p2.sy} L ${p3.sx} ${p3.sy}`}
          fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="orthonormal bases"
      title="Gram-Schmidt: Subtract the Projection"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={3.8}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={3.8} end={12.13}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={12.13} end={17.46}>
        <KeepFirstBeat/>
      </Sprite>

      <Sprite start={17.46} end={27.25}>
        <SubtractProjectionBeat/>
      </Sprite>

      <Sprite start={27.25} end={34.27}>
        <NormaliseBeat/>
      </Sprite>

      <Sprite start={34.27} end={44.57}>
        <Extend3DBeat/>
      </Sprite>

      <Sprite start={44.57} end={SCENE_DURATION}>
        <HeroOutro/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 1: Manimo intro ─────────────────────────────────────────────────
function ManimoBubbleIntro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '42%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', alignItems: 'center', gap: 22,
    }}>
      <svg width={170} height={170} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <ManimoEnter duration={0.7} bob={true}/>
      </svg>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28, fontStyle: 'italic',
          color: 'var(--chalk-100)',
          maxWidth: '24ch', lineHeight: 1.3,
        }}>
        Two arrows. Not perpendicular.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Setup ────────────────────────────────────────────────────────
function SetupBeat() {
  return (
    <>
      <GridMaskedSvg maskId="gs-setup-mask">
        <SvgFadeIn duration={0.5} delay={0.0}><FaintGrid/></SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.0}><Axes/></SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={0.4}>
          <Vector x={V1[0]} y={V1[1]} color="var(--violet-400)"
                  label="v₁" labelDX={22} labelDY={-10}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.0}>
          <Vector x={V2[0]} y={V2[1]} color="var(--teal-400)"
                  label="v₂" labelDX={-10} labelDY={-14}/>
        </SvgFadeIn>

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>step 0 — what we have</FadeUp>
        <FadeUp duration={0.6} delay={0.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          Two vectors. Not perpendicular.
        </FadeUp>
        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '32ch',
          }}>
          They span a plane, but their angle isn't 90 degrees.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Keep u₁ = v₁ ─────────────────────────────────────────────────
function KeepFirstBeat() {
  return (
    <>
      <GridMaskedSvg maskId="gs-keep-mask">
        <FaintGrid/>
        <Axes/>

        <SvgFadeIn duration={0.4} delay={0.0}>
          <Vector x={V1[0]} y={V1[1]} color="var(--violet-400)"
                  label="u₁ = v₁" labelDX={42} labelDY={-8}
                  strokeWidth={4.4} glow={0.7}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <Vector x={V2[0]} y={V2[1]} color="var(--teal-400)"
                  label="v₂" labelDX={-10} labelDY={-14}
                  strokeWidth={3.0}/>
        </SvgFadeIn>

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>step 1 — keep the first</FadeUp>
        <FadeUp duration={0.6} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 36, color: 'var(--chalk-100)', lineHeight: 1.25,
            marginTop: 4,
          }}>
          <span style={{ color: 'var(--violet-400)' }}>u₁</span>
          &nbsp;=&nbsp;
          <span style={{ color: 'var(--violet-400)' }}>v₁</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={2.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '32ch',
          }}>
          The first direction is free. Measure everything else against it.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Subtract the projection ──────────────────────────────────────
function SubtractProjectionBeat() {
  const { localTime } = useSprite();

  const u1 = V1;
  const v2 = V2;
  const proj = projection(v2, u1);           // shadow vector along u1
  const u2 = sub(v2, proj);                  // perpendicular remainder

  // Animation phases (within the 12 s sprite):
  //   0.0 – 1.5 s   show v₁/u₁ + v₂
  //   1.5 – 4.0 s   project: dashed arrow grows along u1; dashed perpendicular drop
  //   4.0 – 6.5 s   subtract: u₂ slides out of v₂ and attaches at origin
  //   6.5 – 8.0 s   right-angle mark
  //   8.0+         hold
  const projGrow = Easing.easeInOutCubic(clamp((localTime - 1.5) / 2.0, 0, 1));
  const subtractT = Easing.easeInOutCubic(clamp((localTime - 4.0) / 2.0, 0, 1));
  const rightAngleT = clamp((localTime - 6.5) / 1.2, 0, 1);

  // u₂ during subtraction interpolates from tip-of-v₂ → origin attachment.
  // We draw it as ArrowFrom(start, end). Start at projection tip, end at v₂ tip,
  // then slide to origin → u₂_tip (= v₂ − proj).
  const u2Start = [
    proj[0] * (1 - subtractT) + 0 * subtractT,
    proj[1] * (1 - subtractT) + 0 * subtractT,
  ];
  const u2End = [
    v2[0] * (1 - subtractT) + u2[0] * subtractT,
    v2[1] * (1 - subtractT) + u2[1] * subtractT,
  ];

  return (
    <>
      <GridMaskedSvg maskId="gs-subtract-mask">
        <FaintGrid/>
        <Axes/>

        {/* u₁ stays prominent. */}
        <Vector x={u1[0]} y={u1[1]} color="var(--violet-400)"
                label="u₁" labelDX={22} labelDY={-10}
                strokeWidth={4.0} glow={0.4}/>

        {/* v₂ — fades as u₂ is born. */}
        <g opacity={1 - 0.4 * subtractT}>
          <Vector x={v2[0]} y={v2[1]} color="var(--teal-400)"
                  label="v₂" labelDX={-10} labelDY={-14}
                  strokeWidth={3.0}/>
        </g>

        {/* Projection — dashed teal along u₁, grows in over phase 2. */}
        {projGrow > 0.02 && (
          <g opacity={projGrow}>
            <ArrowFrom from={[0, 0]} to={scale(proj, projGrow)}
                       color="var(--teal-400)" dashed
                       strokeWidth={2.6} headLen={11} headHalf={6}/>
          </g>
        )}

        {/* Perpendicular drop from v₂ tip down to the projection tip. */}
        {projGrow > 0.4 && (
          <line
            x1={toSvg(v2[0], v2[1]).sx} y1={toSvg(v2[0], v2[1]).sy}
            x2={toSvg(proj[0], proj[1]).sx} y2={toSvg(proj[0], proj[1]).sy}
            stroke="var(--chalk-300)" strokeWidth={1.6}
            strokeDasharray="4 5" opacity={0.85}/>
        )}

        {/* u₂ — animated from tip-of-v₂ slide. */}
        {subtractT > 0.05 && (
          <ArrowFrom from={u2Start} to={u2End}
                     color="var(--rose-400)" strokeWidth={4.0}
                     label={subtractT > 0.9 ? "u₂" : null}
                     labelDX={-16} labelDY={-14}
                     glow={0.4 + 0.6 * subtractT}/>
        )}

        {/* Right-angle marker once u₂ has fully landed at origin. */}
        {rightAngleT > 0.1 && (
          <g opacity={rightAngleT}>
            <RightAngleMark along={u1} perp={u2}/>
          </g>
        )}

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={196} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>step 2 — subtract the shadow</FadeUp>

        <FadeUp duration={0.55} delay={0.8} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.4,
            marginTop: 4,
          }}>
          <span style={{ color: 'var(--rose-400)' }}>u₂</span>
          &nbsp;=&nbsp;
          <span style={{ color: 'var(--teal-400)' }}>v₂</span>
          &nbsp;−&nbsp;
          <span style={{ color: 'var(--teal-400)' }}>proj<sub style={{ color: 'var(--violet-400)' }}>u₁</sub>(v₂)</span>
        </FadeUp>

        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          The shadow tells you what's "already covered". <br/>What's left is perpendicular.
        </FadeUp>

        <FadeUp duration={0.5} delay={6.8} distance={8}
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--emerald-400)', letterSpacing: '0.08em',
          }}>
          u₁ ⟂ u₂&nbsp;&nbsp;✓
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 5: Normalise ────────────────────────────────────────────────────
function NormaliseBeat() {
  const u1 = V1;
  const u2 = sub(V2, projection(V2, V1));
  const u1Hat = scale(u1, 1 / norm(u1));
  const u2Hat = scale(u2, 1 / norm(u2));

  return (
    <>
      <GridMaskedSvg maskId="gs-norm-mask">
        <FaintGrid/>
        <Axes/>

        {/* Faded "raw" u₁, u₂ for context. */}
        <g opacity={0.32}>
          <Vector x={u1[0]} y={u1[1]} color="var(--violet-400)" strokeWidth={2.4}/>
          <Vector x={u2[0]} y={u2[1]} color="var(--rose-400)" strokeWidth={2.4}/>
        </g>

        {/* Unit vectors, prominent. */}
        <SvgFadeIn duration={0.5} delay={0.3}>
          <Vector x={u1Hat[0]} y={u1Hat[1]} color="var(--violet-400)"
                  label="ê₁" labelDX={20} labelDY={-10}
                  strokeWidth={4.4} glow={0.5}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.6}>
          <Vector x={u2Hat[0]} y={u2Hat[1]} color="var(--rose-400)"
                  label="ê₂" labelDX={-18} labelDY={-10}
                  strokeWidth={4.4} glow={0.5}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={1.6}>
          <RightAngleMark along={u1Hat} perp={u2Hat}/>
        </SvgFadeIn>

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>step 3 — normalise</FadeUp>
        <FadeUp duration={0.55} delay={0.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          ê<sub>k</sub> = u<sub>k</sub> / ‖u<sub>k</sub>‖
        </FadeUp>
        <FadeUp duration={0.5} delay={2.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Now both arrows have length one — orthonormal.
        </FadeUp>
        <FadeUp duration={0.5} delay={3.4} distance={8}
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--emerald-400)', letterSpacing: '0.08em',
          }}>
          ‖ê₁‖ = ‖ê₂‖ = 1 · ê₁ ⟂ ê₂
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 6: Extend to 3D — symbolic ──────────────────────────────────────
function Extend3DBeat() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 22, maxWidth: 900, textAlign: 'center',
      }}>
        <FadeUp duration={0.45} delay={0.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>step 4 — same recipe in 3D</FadeUp>

        <FadeUp duration={0.7} delay={0.3} distance={14}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 40, color: 'var(--chalk-100)', lineHeight: 1.3,
          }}>
          <span style={{ color: 'var(--emerald-400)' }}>u₃</span>
          &nbsp;=&nbsp;
          <span style={{ color: 'var(--chalk-200)' }}>v₃</span>
          &nbsp;−&nbsp;
          proj<sub style={{ color: 'var(--violet-400)' }}>u₁</sub>(v₃)
          &nbsp;−&nbsp;
          proj<sub style={{ color: 'var(--rose-400)' }}>u₂</sub>(v₃)
        </FadeUp>

        <FadeUp duration={0.55} delay={1.4} distance={10}
          style={{
            marginTop: 8,
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-200)', lineHeight: 1.4,
            maxWidth: '40ch',
          }}>
          Subtract every shadow you already know about. <br/>
          What's left is perpendicular to all of them.
        </FadeUp>

        <FadeUp duration={0.5} delay={3.0} distance={8}
          style={{
            marginTop: 14,
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--chalk-300)', letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
          two arrows → three arrows → n arrows
        </FadeUp>
      </div>
    </div>
  );
}

// ─── Beat 7: Hero outro ───────────────────────────────────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      maxWidth: 920, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>gram-schmidt</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 60, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        Subtract the <span style={{ color: 'var(--amber-300)' }}>projection</span>.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '40ch', lineHeight: 1.3,
        }}>
          Keep what's new. <br/>Strip away what's already there.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        <span style={{ color: 'var(--violet-400)' }}>ê₁</span>
        &nbsp;⟂&nbsp;
        <span style={{ color: 'var(--rose-400)' }}>ê₂</span>
        &nbsp;⟂&nbsp;
        <span style={{ color: 'var(--emerald-400)' }}>ê₃</span>
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
