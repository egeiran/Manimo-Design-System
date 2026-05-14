// Same Vector, Two Grids — Manimo lesson scene.
// Chapter 1 (Vektorrom). The coordinates of a vector depend on the basis
// you measure with. Standard grid reads our arrow as (1, 3); a tilted
// basis B = {b₁, b₂} reads the very same arrow as (2, 1).
//
// Visual conventions inherited from the calibration scene:
//   chalk-300 / chalk-200  standard reference grid + axes
//   amber-400              the arrow itself (the object, not its label)
//   violet-400             b₁ and the new lattice lines along b₁
//   teal-400               b₂ and the new lattice lines along b₂
//   amber-300              the payoff coordinates, hero accent

const SCENE_DURATION = 35;

const NARRATION = [
  "A vector is just an arrow. The numbers we attach to it depend on the grid we measure with.",
  "Set down the standard grid. Our arrow lives at coordinates one, three — one step right, three steps up.",
  "Now overlay a tilted basis — b one going up and right, b two going up and left. Same arrow, but a brand new grid to measure against.",
  "Solve the match up: the arrow equals two of b one plus one of b two. In the B basis, the same arrow is the column two, one.",
  "Same arrow. New basis. New coordinates.",
];

const NARRATION_AUDIO = 'audio/basis-change-grid/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
const ORIGIN_X = 540;
const ORIGIN_Y = 420;
const UNIT = 72;
const GRID_X_MIN = -5, GRID_X_MAX = 8;
const GRID_Y_MIN = -3, GRID_Y_MAX = 4;

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

// Vectors used throughout.
const V  = [1, 3];          // the arrow we keep re-measuring
const B1 = [1, 1];          // basis vector 1
const B2 = [-1, 1];         // basis vector 2
// v = c₁·b₁ + c₂·b₂ with c₁ = 2, c₂ = 1.
const C1 = 2;
const C2 = 1;

// ─── Grid mask helper ────────────────────────────────────────────────────
function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="48%" cy="56%" r="60%">
          <stop offset="55%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="1280" height="720" fill={`url(#${gradId})`}/>
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        {children}
      </g>
    </svg>
  );
}

// Standard chalk grid (axis-aligned integer lines).
function StandardGrid({ opacity = 0.4 }) {
  const lines = [];
  for (let k = GRID_X_MIN; k <= GRID_X_MAX; k++) {
    const a = toSvg(k, GRID_Y_MIN);
    const b = toSvg(k, GRID_Y_MAX);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = GRID_Y_MIN; k <= GRID_Y_MAX; k++) {
    const a = toSvg(GRID_X_MIN, k);
    const b = toSvg(GRID_X_MAX, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

// B-basis lattice: integer translates of the b₁ and b₂ directions, drawn
// as long line segments through the visible math window. `progress` in
// [0, 1] grows the lines outward from origin (rather than fading) so the
// new lattice feels like it's being laid down.
function BasisLattice({ progress = 1, opacityFactor = 1 }) {
  const T = 6;                          // half-extent in basis units
  const T0 = -T, T1 = T;
  const lines = [];
  const farFactor = T * Math.max(0.001, progress);
  for (let k = -4; k <= 4; k++) {
    // Lines parallel to b₁ at offset k·b₂
    const ax = k * B2[0] + (-farFactor) * B1[0];
    const ay = k * B2[1] + (-farFactor) * B1[1];
    const bx = k * B2[0] + ( farFactor) * B1[0];
    const by = k * B2[1] + ( farFactor) * B1[1];
    const a = toSvg(ax, ay);
    const b = toSvg(bx, by);
    lines.push(<line key={`B1_${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--violet-400)" strokeWidth={1.2}
                     opacity={0.35 * opacityFactor} strokeLinecap="round"/>);
    // Lines parallel to b₂ at offset k·b₁
    const cx = k * B1[0] + (-farFactor) * B2[0];
    const cy = k * B1[1] + (-farFactor) * B2[1];
    const dx = k * B1[0] + ( farFactor) * B2[0];
    const dy = k * B1[1] + ( farFactor) * B2[1];
    const c = toSvg(cx, cy);
    const d = toSvg(dx, dy);
    lines.push(<line key={`B2_${k}`} x1={c.sx} y1={c.sy} x2={d.sx} y2={d.sy}
                     stroke="var(--teal-400)" strokeWidth={1.2}
                     opacity={0.35 * opacityFactor} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

function Axes() {
  const left = toSvg(GRID_X_MIN, 0), right = toSvg(GRID_X_MAX, 0);
  const bot = toSvg(0, GRID_Y_MIN), top = toSvg(0, GRID_Y_MAX);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
    </g>
  );
}

// Vector arrow from (fromX, fromY) to (x, y). Optional dashed stroke.
function Vector({
  x, y, color, label = null, labelDX = 0, labelDY = 0,
  strokeWidth = 3.6, headLen = 13, headHalf = 7,
  fromX = 0, fromY = 0,
  opacity = 1, dashed = false,
}) {
  const a = toSvg(fromX, fromY);
  const b = toSvg(x, y);
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
    <g style={{ opacity }}>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={dashed ? '6 5' : undefined}/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

function SoftPanel({ children, right = 60, top = 200, width = 360 }) {
  return (
    <div style={{
      position: 'absolute', right, top, width,
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

// Bracketed column vector: a 2x1 column of stacked strings on chalk
// brackets. Used to show [v]_std and [v]_B side by side in panels.
function ColumnBracketed({ entries, eyebrow, colors, fontSize = 32 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        color: 'var(--chalk-300)', letterSpacing: '0.06em',
      }}>
        {eyebrow}
      </span>
      <div style={{
        position: 'relative', padding: '12px 18px',
        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        fontSize, color: 'var(--chalk-100)', lineHeight: 1.2,
      }}>
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 11,
          borderLeft: '2px solid var(--chalk-200)',
          borderTop: '2px solid var(--chalk-200)',
          borderBottom: '2px solid var(--chalk-200)',
        }}/>
        <span style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 11,
          borderRight: '2px solid var(--chalk-200)',
          borderTop: '2px solid var(--chalk-200)',
          borderBottom: '2px solid var(--chalk-200)',
        }}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', minWidth: 36 }}>
          <span style={{ color: colors[0] }}>{entries[0]}</span>
          <span style={{ color: colors[1] }}>{entries[1]}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="basis and coordinates"
      title="Same Vector, Two Grids"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={5.46}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={5.46} end={12.84}>
        <StandardCoordsBeat/>
      </Sprite>

      <Sprite start={12.84} end={22.21}>
        <OverlayBasisBeat/>
      </Sprite>

      <Sprite start={22.21} end={31.25}>
        <NewCoordsBeat/>
      </Sprite>

      <Sprite start={31.25} end={SCENE_DURATION}>
        <HeroOutro/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 1: intro ────────────────────────────────────────────────────────
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
          fontFamily: 'var(--font-serif)', fontSize: 28, fontStyle: 'italic',
          color: 'var(--chalk-100)', maxWidth: '24ch', lineHeight: 1.3,
        }}>
        Same arrow. Different numbers — depending on the grid.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: v in standard coordinates ───────────────────────────────────
function StandardCoordsBeat() {
  return (
    <>
      <GridMaskedSvg maskId="bcg-std-mask">
        <SvgFadeIn duration={0.4} delay={0.0}><StandardGrid opacity={0.4}/></SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}><Axes/></SvgFadeIn>

        {/* Projection guides: vertical from (1, 3) down to (1, 0), horizontal across to (0, 3) */}
        <SvgFadeIn duration={0.5} delay={2.6}>
          {(() => {
            const top = toSvg(V[0], V[1]);
            const bot = toSvg(V[0], 0);
            const lft = toSvg(0, V[1]);
            return (
              <g stroke="var(--chalk-300)" strokeWidth={1.4}
                 strokeDasharray="5 5" opacity={0.7}>
                <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}/>
                <line x1={top.sx} y1={top.sy} x2={lft.sx} y2={lft.sy}/>
              </g>
            );
          })()}
        </SvgFadeIn>

        {/* Tick labels at (1, 0) and (0, 3) */}
        <SvgFadeIn duration={0.4} delay={2.9}>
          {(() => {
            const tx = toSvg(V[0], 0);
            const ty = toSvg(0, V[1]);
            return (
              <g fontFamily="var(--font-mono)" fontSize={14} fill="var(--chalk-200)">
                <text x={tx.sx} y={tx.sy + 22} textAnchor="middle">1</text>
                <text x={ty.sx - 16} y={ty.sy + 5} textAnchor="middle">3</text>
              </g>
            );
          })()}
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={1.0}>
          <Vector x={V[0]} y={V[1]} color="var(--amber-400)"
                  label="v" labelDX={20} labelDY={-2}
                  strokeWidth={4}/>
        </SvgFadeIn>

        <circle cx={toSvg(0,0).sx} cy={toSvg(0,0).sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={60} top={210}>
        <FadeUp duration={0.4} delay={3.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          standard coordinates
        </FadeUp>
        <FadeUp duration={0.55} delay={3.7} distance={10}>
          <ColumnBracketed
            entries={['1', '3']}
            eyebrow="[v]ₛₜₐₙ ="
            colors={['var(--chalk-100)', 'var(--chalk-100)']}
            fontSize={34}
          />
        </FadeUp>
        <FadeUp duration={0.5} delay={5.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)',
            maxWidth: '32ch', lineHeight: 1.4, marginTop: 4,
          }}>
          One step along x, three along y. That's what the standard grid records.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: overlay the tilted basis ────────────────────────────────────
function OverlayBasisBeat() {
  const { localTime } = useSprite();
  const latticeT = clamp((localTime - 0.4) / 1.8, 0, 1);
  const latticeProgress = Easing.easeOutCubic(latticeT);
  return (
    <>
      <GridMaskedSvg maskId="bcg-overlay-mask">
        <SvgFadeIn duration={0.4} delay={0.0}><StandardGrid opacity={0.22}/></SvgFadeIn>
        <BasisLattice progress={latticeProgress} opacityFactor={latticeProgress}/>
        <SvgFadeIn duration={0.4} delay={0.0}><Axes/></SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={1.0}>
          <Vector x={B1[0]} y={B1[1]} color="var(--violet-400)"
                  label="b₁" labelDX={20} labelDY={-2} strokeWidth={3.6}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={1.8}>
          <Vector x={B2[0]} y={B2[1]} color="var(--teal-400)"
                  label="b₂" labelDX={-22} labelDY={-2} strokeWidth={3.6}/>
        </SvgFadeIn>

        <Vector x={V[0]} y={V[1]} color="var(--amber-400)"
                label="v" labelDX={22} labelDY={-2}
                strokeWidth={4}/>

        <circle cx={toSvg(0,0).sx} cy={toSvg(0,0).sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={60} top={210}>
        <FadeUp duration={0.4} delay={3.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          a new basis B
        </FadeUp>
        <FadeUp duration={0.55} delay={3.4} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 24, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 2,
          }}>
            B = (<span style={{ color: 'var(--violet-400)' }}>b₁</span>,&nbsp;<span style={{ color: 'var(--teal-400)' }}>b₂</span>)
        </FadeUp>
        <FadeUp duration={0.5} delay={5.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)',
            maxWidth: '34ch', lineHeight: 1.4, marginTop: 4,
          }}>
          Two new directions to measure with. The arrow has not moved.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: solve for B-coordinates ─────────────────────────────────────
function NewCoordsBeat() {
  const { localTime } = useSprite();

  // Step 1 (0.6–1.5s): glide along 2·b₁ — dashed violet from origin.
  // Step 2 (1.6–2.5s): glide along 1·b₂ from (2,2) to v=(1,3) — dashed teal.
  const step1T = clamp((localTime - 0.6) / 1.0, 0, 1);
  const step1 = Easing.easeOutCubic(step1T);
  const step2T = clamp((localTime - 1.8) / 1.0, 0, 1);
  const step2 = Easing.easeOutCubic(step2T);

  const mid = [C1 * B1[0], C1 * B1[1]];         // (2, 2)
  const end = [mid[0] + C2 * B2[0], mid[1] + C2 * B2[1]];  // should equal V

  // Animated intermediate tips
  const tip1 = [mid[0] * step1, mid[1] * step1];
  const tip2 = [mid[0] + (end[0] - mid[0]) * step2,
                mid[1] + (end[1] - mid[1]) * step2];

  return (
    <>
      <GridMaskedSvg maskId="bcg-new-mask">
        <SvgFadeIn duration={0.4} delay={0.0}><StandardGrid opacity={0.18}/></SvgFadeIn>
        <BasisLattice progress={1} opacityFactor={0.7}/>
        <SvgFadeIn duration={0.4} delay={0.0}><Axes/></SvgFadeIn>

        {/* The two basis arrows (low-key, persistent) */}
        <Vector x={B1[0]} y={B1[1]} color="var(--violet-400)" strokeWidth={2.6} opacity={0.55}/>
        <Vector x={B2[0]} y={B2[1]} color="var(--teal-400)"   strokeWidth={2.6} opacity={0.55}/>

        {/* Step 1: 2·b₁ tip-to-tail */}
        {step1T > 0 && (
          <Vector fromX={0} fromY={0} x={tip1[0]} y={tip1[1]}
                  color="var(--violet-400)" strokeWidth={3.4} dashed/>
        )}
        {step1T > 0.6 && (
          (() => {
            const m = toSvg((tip1[0]) / 2, (tip1[1]) / 2);
            return (
              <text x={m.sx + 16} y={m.sy + 22}
                    fill="var(--violet-400)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={18} textAnchor="middle">
                2 b₁
              </text>
            );
          })()
        )}

        {/* Step 2: 1·b₂ from mid */}
        {step2T > 0 && (
          <Vector fromX={mid[0]} fromY={mid[1]} x={tip2[0]} y={tip2[1]}
                  color="var(--teal-400)" strokeWidth={3.4} dashed/>
        )}
        {step2T > 0.6 && (
          (() => {
            const m = toSvg(
              mid[0] + (tip2[0] - mid[0]) / 2,
              mid[1] + (tip2[1] - mid[1]) / 2
            );
            return (
              <text x={m.sx - 18} y={m.sy + 6}
                    fill="var(--teal-400)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={18} textAnchor="middle">
                1 b₂
              </text>
            );
          })()
        )}

        {/* The vector itself, full intensity */}
        <Vector x={V[0]} y={V[1]} color="var(--amber-400)"
                label="v" labelDX={22} labelDY={-2} strokeWidth={4}/>

        <circle cx={toSvg(0,0).sx} cy={toSvg(0,0).sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={60} top={210}>
        <FadeUp duration={0.4} delay={2.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          B-coordinates
        </FadeUp>
        <FadeUp duration={0.55} delay={2.7} distance={10}>
          <ColumnBracketed
            entries={['2', '1']}
            eyebrow="[v]ᴮ ="
            colors={['var(--violet-400)', 'var(--teal-400)']}
            fontSize={34}
          />
        </FadeUp>
        <FadeUp duration={0.5} delay={4.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            <span style={{ color: 'var(--amber-400)' }}>v</span> = 2&nbsp;<span style={{ color: 'var(--violet-400)' }}>b₁</span> + 1&nbsp;<span style={{ color: 'var(--teal-400)' }}>b₂</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={5.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)',
            maxWidth: '32ch', lineHeight: 1.4,
          }}>
          Same arrow. New basis. New numbers.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Hero outro ──────────────────────────────────────────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', maxWidth: 900, pointerEvents: 'none',
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
      <FadeUp duration={0.7} delay={0.3} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 56, color: 'var(--chalk-100)',
          lineHeight: 1.15,
        }}>
        Coordinates need <span style={{ color: 'var(--amber-300)' }}>a basis</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 25, color: 'var(--chalk-200)',
          maxWidth: '36ch', lineHeight: 1.3,
        }}>
          The arrow doesn't move; only its address changes.
      </FadeUp>
      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        [v]ₛₜₐₙ = (1, 3)&nbsp;&nbsp;·&nbsp;&nbsp;[v]ᴮ = (<span style={{ color: 'var(--violet-400)' }}>2</span>, <span style={{ color: 'var(--teal-400)' }}>1</span>)
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
