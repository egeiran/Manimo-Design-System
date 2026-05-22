// Coordinates in a Basis Are Unique — Manimo lesson scene.
// Chapter 1 (Vektorrom). Given a basis {b₁, b₂} and a target vector v,
// exactly one pair (a, b) satisfies v = a·b₁ + b·b₂. Beat 3 sweeps the
// trial point a·b₁ + b·b₂ across the plane and lets it snap to v at the
// unique correct (a*, b*). Beat 4 swaps in a different basis and shows
// the same v gets new coordinates.
//
// Beats:
//    0– 4   Manimo intro
//    4–12   Setup — basis arrows b₁, b₂ + target v
//   12–24   Sweep trial (a, b); parallelogram construction; snap to v
//   24–33   Different basis, same v — new coordinates
//   33–40   Takeaway
//
// Genuine animation: beat 3's trial point and the parallelogram legs
// are driven by useSprite localTime, not by FadeUp/TraceIn.

const SCENE_DURATION = 52;

const NARRATION = [
  /*  0– 4 */ 'Two basis arrows, one target vector — how many recipes mix to that target?',
  /*  4–12 */ 'Here is a basis b one and b two, and here is a vector v we want to build. We are searching for two scalars a and b so that a b one plus b b two equals v.',
  /* 12–24 */ 'Try guessing. As we sweep a and b, the trial point a b one plus b b two wanders the plane. Almost every guess misses. Exactly one pair lands the trial point on v — those are the coordinates of v in this basis.',
  /* 24–33 */ 'Same v, brand new basis c one and c two. Now the unique coordinates are different numbers — same vector, two different addresses, one in each basis.',
  /* 33–40 */ 'Fix a basis, and every vector has exactly one coordinate tuple. The basis is the language — the coordinates are the word.',
];

const NARRATION_AUDIO = 'audio/basis-uniqueness/scene.mp3';

// Geometry per aspect.
function geom(portrait) {
  return portrait
    ? { vbW: 620, vbH: 660, ox: 310, oy: 360, unit: 50,
        gridXMin: -5, gridXMax: 5, gridYMin: -5, gridYMax: 5 }
    : { vbW: 740, vbH: 560, ox: 370, oy: 300, unit: 56,
        gridXMin: -6, gridXMax: 6, gridYMin: -4, gridYMax: 4 };
}

function toSvgF(G, x, y) {
  return { sx: G.ox + x * G.unit, sy: G.oy - y * G.unit };
}

function ReferenceGridSvg({ G, opacity = 0.22 }) {
  const lines = [];
  for (let k = G.gridXMin; k <= G.gridXMax; k++) {
    const a = toSvgF(G, k, G.gridYMin);
    const b = toSvgF(G, k, G.gridYMax);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = G.gridYMin; k <= G.gridYMax; k++) {
    const a = toSvgF(G, G.gridXMin, k);
    const b = toSvgF(G, G.gridXMax, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

function Axes2DSvg({ G }) {
  const l = toSvgF(G, G.gridXMin, 0), r = toSvgF(G, G.gridXMax, 0);
  const b = toSvgF(G, 0, G.gridYMin), t = toSvgF(G, 0, G.gridYMax);
  return (
    <g>
      <line x1={l.sx} y1={l.sy} x2={r.sx} y2={r.sy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <line x1={t.sx} y1={t.sy} x2={b.sx} y2={b.sy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
    </g>
  );
}

function ArrowFromOrigin({ G, x, y, color, label = null, labelDX = 0, labelDY = 0,
                          strokeWidth = 3.4, progress = 1, opacity = 1,
                          fromX = 0, fromY = 0, dashed = false }) {
  const a = toSvgF(G, fromX, fromY);
  const tipX = fromX + (x - fromX) * progress;
  const tipY = fromY + (y - fromY) * progress;
  const b = toSvgF(G, tipX, tipY);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const headLen = 12, headHalf = 6.5;
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
      {label != null && progress > 0.85 && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

function SoftPanel({ portrait, children }) {
  return (
    <div style={{
      position: 'absolute',
      ...(portrait
        ? { left: 48, right: 48, top: 940, bottom: 100 }
        : { right: 56, top: 240, width: 360 }),
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column',
      alignItems: portrait ? 'center' : 'flex-start',
      textAlign: portrait ? 'center' : 'left',
      gap: 12,
    }}>
      {children}
    </div>
  );
}

// Chosen basis arrows (non-parallel) and the target vector v.
const B1 = [2.0, 0.6];
const B2 = [-0.4, 1.8];
// Target v with exact coordinates a* = 1.6, b* = 1.0 in basis B = {B1, B2}.
// → v = 1.6·B1 + 1.0·B2 = (1.6·2.0 + 1.0·(-0.4), 1.6·0.6 + 1.0·1.8)
//     = (3.2 - 0.4, 0.96 + 1.8) = (2.8, 2.76).
const V_VEC = [2.8, 2.76];
const A_STAR = 1.6;
const B_STAR = 1.0;

// Alternative basis for beat 4 (different vectors, chosen so the
// parallelogram-completion legs both stay inside the visible grid).
const C1 = [1.4, -0.6];
const C2 = [0.4, 1.6];
// Solve v = a' C1 + b' C2 for v = (2.8, 2.76).
// |1.4 0.4| |a'|   |2.80|
// |-0.6 1.6| |b'| = |2.76|
// det = 1.4·1.6 - 0.4·(-0.6) = 2.24 + 0.24 = 2.48
// a' = (2.80·1.6 - 0.4·2.76) / 2.48 = (4.48 - 1.104) / 2.48 = 3.376/2.48 ≈ 1.361
// b' = (1.4·2.76 - (-0.6)·2.80) / 2.48 = (3.864 + 1.68) / 2.48 = 5.544/2.48 ≈ 2.236
// a'·C1 ≈ (1.905, -0.817); b'·C2 ≈ (0.895, 3.577); sum ≈ (2.8, 2.76) ✓
const A_PRIME = 1.361;
const B_PRIME = 2.236;

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="vector spaces"
      title="Coordinates in a Basis"
      duration={SCENE_DURATION}
      introEnd={5.39}
      introCaption="Two basis arrows. One target v. How many recipes hit it?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.39} end={16.59}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={16.59} end={31.77}>
        <SweepBeat/>
      </Sprite>

      <Sprite start={31.77} end={42.43}>
        <DifferentBasisBeat/>
      </Sprite>

      <Sprite start={42.43} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Setup — basis arrows + target v ──────────────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}><ReferenceGridSvg G={G}/></SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.2}><Axes2DSvg G={G}/></SvgFadeIn>
          <SvgFadeIn duration={0.5} delay={0.4}>
            <ArrowFromOrigin G={G} x={B1[0]} y={B1[1]}
              color="var(--violet-400)" label="b₁" labelDX={22} labelDY={16}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.5} delay={0.8}>
            <ArrowFromOrigin G={G} x={B2[0]} y={B2[1]}
              color="var(--teal-400)" label="b₂" labelDX={-22} labelDY={-2}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.5} delay={1.4}>
            <ArrowFromOrigin G={G} x={V_VEC[0]} y={V_VEC[1]}
              color="var(--amber-400)" label="v" labelDX={18} labelDY={-4}/>
          </SvgFadeIn>
          <circle cx={toSvgF(G, 0, 0).sx} cy={toSvgF(G, 0, 0).sy} r={4}
                  fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={2.2} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          the question
        </FadeUp>
        <FadeUp duration={0.6} delay={2.6} distance={12}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 28 : 34, color: 'var(--chalk-100)',
            lineHeight: 1.2,
          }}>
            v = a&nbsp;<span style={{ color: 'var(--violet-400)' }}>b₁</span>&nbsp;+&nbsp;
            b&nbsp;<span style={{ color: 'var(--teal-400)' }}>b₂</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          find the scalars a and b.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Sweep trial (a, b); snap to v at the unique (a*, b*) ─────────
function SweepBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  // Three phases:
  //   0.0 – 1.0  fade in stage; trial starts at (0, 0)
  //   1.0 – 8.5  sweep trial through five keyframes, ending at (a*, b*)
  //   8.5 – 12.0 hold at (a*, b*); reveal "unique" caption
  const sweepStart = 1.0;
  const sweepEnd = 8.5;
  const phase = clamp((localTime - sweepStart) / (sweepEnd - sweepStart), 0, 1);

  // Keyframe sequence for (a, b). End on exact (A_STAR, B_STAR).
  const KFS = [
    [0.0, 0.0],
    [-1.0, 1.5],
    [2.0, -0.7],
    [0.4, 2.1],
    [2.3, 0.5],
    [A_STAR, B_STAR],
  ];
  function abAt(p) {
    if (p <= 0) return KFS[0];
    if (p >= 1) return KFS[KFS.length - 1];
    const seg = p * (KFS.length - 1);
    const i = Math.floor(seg);
    const u = seg - i;
    const e = Easing.easeInOutCubic(u);
    const k0 = KFS[i], k1 = KFS[i + 1];
    return [k0[0] + (k1[0] - k0[0]) * e, k0[1] + (k1[1] - k0[1]) * e];
  }

  const [aVal, bVal] = (localTime < sweepStart) ? [0, 0] : abAt(phase);
  const snapped = phase >= 0.999;

  // Trial point P = a·b₁ + b·b₂.
  const px = aVal * B1[0] + bVal * B2[0];
  const py = aVal * B1[1] + bVal * B2[1];
  const trialPt = toSvgF(G, px, py);
  // Parallelogram corner A = a·b₁ (the first leg's tip).
  const aLegTip = toSvgF(G, aVal * B1[0], aVal * B1[1]);
  const origin = toSvgF(G, 0, 0);

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}><ReferenceGridSvg G={G}/></SvgFadeIn>
          <Axes2DSvg G={G}/>

          {/* Basis arrows kept faded so the eye stays on the trial point */}
          <ArrowFromOrigin G={G} x={B1[0]} y={B1[1]}
            color="var(--violet-400)" opacity={0.55} strokeWidth={2.6}
            label="b₁" labelDX={22} labelDY={16}/>
          <ArrowFromOrigin G={G} x={B2[0]} y={B2[1]}
            color="var(--teal-400)" opacity={0.55} strokeWidth={2.6}
            label="b₂" labelDX={-22} labelDY={-2}/>

          {/* Target v in full amber */}
          <ArrowFromOrigin G={G} x={V_VEC[0]} y={V_VEC[1]}
            color="var(--amber-400)" label="v" labelDX={18} labelDY={-4}/>

          {/* Parallelogram construction: leg 1 (a·b₁) then leg 2 (b·b₂) */}
          {localTime >= sweepStart && (
            <g opacity={0.85}>
              <line x1={origin.sx} y1={origin.sy} x2={aLegTip.sx} y2={aLegTip.sy}
                    stroke="var(--violet-400)" strokeWidth={2.2}
                    strokeDasharray="6 4" opacity={0.85}/>
              <line x1={aLegTip.sx} y1={aLegTip.sy} x2={trialPt.sx} y2={trialPt.sy}
                    stroke="var(--teal-400)" strokeWidth={2.2}
                    strokeDasharray="6 4" opacity={0.85}/>
            </g>
          )}

          {/* Trial point — rose when searching, amber once snapped */}
          {localTime >= sweepStart && (
            <g>
              <circle cx={trialPt.sx} cy={trialPt.sy}
                      r={snapped ? 11 : 9}
                      fill={snapped ? 'var(--amber-300)' : 'var(--rose-300)'}
                      stroke="var(--chalk-100)" strokeWidth={1.8}/>
              {snapped && (
                <circle cx={trialPt.sx} cy={trialPt.sy} r={18}
                        fill="none" stroke="var(--amber-300)" strokeWidth={1.5}
                        opacity={0.55}/>
              )}
            </g>
          )}

          <circle cx={origin.sx} cy={origin.sy} r={4} fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          search for (a, b)
        </FadeUp>
        <FadeUp duration={0.5} delay={0.8} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            P = a&nbsp;<span style={{ color: 'var(--violet-400)' }}>b₁</span>&nbsp;+&nbsp;
            b&nbsp;<span style={{ color: 'var(--teal-400)' }}>b₂</span>
        </FadeUp>
        {/* Live (a, b) readout — colour shifts to amber when snapped */}
        <FadeUp duration={0.4} delay={1.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 18,
            color: snapped ? 'var(--amber-300)' : 'var(--rose-300)',
            marginTop: 6,
          }}>
            a = {aVal.toFixed(2)},&nbsp; b = {bVal.toFixed(2)}
        </FadeUp>
        <FadeUp duration={0.5} delay={9.5} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-100)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          One pair (a*, b*) lands on v. Coordinates are unique.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Different basis, same v ──────────────────────────────────────
function DifferentBasisBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  // Animate the parallelogram construction in the new basis filling in
  // from origin → a'·C1 → v, over 1.5s starting at delay 2.0.
  const buildStart = 2.0, buildEnd = 4.5;
  const t = clamp((localTime - buildStart) / (buildEnd - buildStart), 0, 1);
  const eased = Easing.easeInOutCubic(t);
  // Phase 1 (0..0.5): leg 1 from origin to a'·C1.
  // Phase 2 (0.5..1.0): leg 2 from a'·C1 to v.
  const p1 = clamp(eased / 0.5, 0, 1);
  const p2 = clamp((eased - 0.5) / 0.5, 0, 1);
  const legA = { x: A_PRIME * C1[0] * p1, y: A_PRIME * C1[1] * p1 };
  const aTip = { x: A_PRIME * C1[0], y: A_PRIME * C1[1] };
  const legBEnd = {
    x: aTip.x + (V_VEC[0] - aTip.x) * p2,
    y: aTip.y + (V_VEC[1] - aTip.y) * p2,
  };
  const origin = toSvgF(G, 0, 0);
  const legAEnd = toSvgF(G, legA.x, legA.y);
  const aTipS = toSvgF(G, aTip.x, aTip.y);
  const legBEndS = toSvgF(G, legBEnd.x, legBEnd.y);

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}><ReferenceGridSvg G={G}/></SvgFadeIn>
          <Axes2DSvg G={G}/>

          {/* New basis arrows */}
          <SvgFadeIn duration={0.5} delay={0.3}>
            <ArrowFromOrigin G={G} x={C1[0]} y={C1[1]}
              color="var(--rose-400)" label="c₁" labelDX={20} labelDY={16}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.5} delay={0.8}>
            <ArrowFromOrigin G={G} x={C2[0]} y={C2[1]}
              color="var(--amber-300)" label="c₂" labelDX={-18} labelDY={-2}/>
          </SvgFadeIn>

          {/* Target v (unchanged across bases) */}
          <SvgFadeIn duration={0.4} delay={0.1}>
            <ArrowFromOrigin G={G} x={V_VEC[0]} y={V_VEC[1]}
              color="var(--amber-400)" label="v" labelDX={18} labelDY={-4}/>
          </SvgFadeIn>

          {/* Parallelogram construction in the new basis */}
          {t > 0 && (
            <g>
              <line x1={origin.sx} y1={origin.sy} x2={legAEnd.sx} y2={legAEnd.sy}
                    stroke="var(--rose-400)" strokeWidth={2.4}
                    strokeDasharray="6 4" opacity={0.9}/>
              {p2 > 0 && (
                <line x1={aTipS.sx} y1={aTipS.sy} x2={legBEndS.sx} y2={legBEndS.sy}
                      stroke="var(--amber-300)" strokeWidth={2.4}
                      strokeDasharray="6 4" opacity={0.9}/>
              )}
            </g>
          )}

          {/* Final landing dot once both legs complete */}
          {t >= 1 && (
            <g>
              <circle cx={toSvgF(G, V_VEC[0], V_VEC[1]).sx}
                      cy={toSvgF(G, V_VEC[0], V_VEC[1]).sy}
                      r={10} fill="var(--amber-300)"
                      stroke="var(--chalk-100)" strokeWidth={1.8}/>
            </g>
          )}

          <circle cx={origin.sx} cy={origin.sy} r={4} fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.3} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          same v, new basis
        </FadeUp>
        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            v = a'&nbsp;<span style={{ color: 'var(--rose-400)' }}>c₁</span>&nbsp;+&nbsp;
            b'&nbsp;<span style={{ color: 'var(--amber-300)' }}>c₂</span>
        </FadeUp>
        <FadeUp duration={0.4} delay={4.7} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 18,
            color: 'var(--amber-300)', marginTop: 6,
          }}>
            a' = {A_PRIME.toFixed(2)},&nbsp; b' = {B_PRIME.toFixed(2)}
        </FadeUp>
        <FadeUp duration={0.5} delay={5.5} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          one vector, two coordinate addresses — one per basis.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', maxWidth: portrait ? 600 : 900,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.8} delay={0.3} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 50, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        One basis, one&nbsp;<span style={{ color: 'var(--amber-300)' }}>address</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '26ch' : '44ch', lineHeight: 1.4,
        }}>
        The basis is the language. The coordinates are the word.
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION}
           background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
