// The Dot Product: Length, Length, Cosine — Manimo lesson scene.
// Chapter 3 (Indreproduktrom). Builds the geometric meaning of the dot
// product: u·v = ‖u‖ ‖v‖ cos θ. Beat 3 holds u fixed and spins v while
// the dot-product readout sweeps in sync — that is the genuine motion.
//
// Beats:
//    0.00– 4.40  Manimo intro
//    4.40–13.00  Component-form computation on a small grid
//   13.00–27.50  Angle scrub: v rotates from ~10° to ~170°, readouts live
//   27.50–36.20  Sign reads off acute / right / obtuse
//   36.20–42.00  Takeaway

const SCENE_DURATION = 35;

const NARRATION = [
  /*  0.00– 4.40 */ 'How do you measure the angle between two arrows?',
  /*  4.40–13.00 */ 'Multiply the matching components and add them up. That single number is u dot v.',
  /* 13.00–27.50 */ 'Geometrically the same number equals the length of u, times the length of v, times the cosine of the angle between them. Hold one arrow fixed, spin the other, and watch the dot product rise and fall with the cosine.',
  /* 27.50–36.20 */ 'Positive means acute, zero means perpendicular, negative means obtuse. The sign reads off the corner.',
  /* 36.20–42.00 */ 'One number tells you the angle. That is why the dot product shows up everywhere.',
];

const NARRATION_AUDIO = 'audio/inner-product-geometry/scene.mp3';

// ─── Geometry helpers (per-aspect) ────────────────────────────────────────
function geom(portrait) {
  return portrait
    ? { vbW: 640, vbH: 640, ox: 320, oy: 360, unit: 64,
        gridXMin: -4, gridXMax: 4, gridYMin: -3, gridYMax: 4 }
    : { vbW: 720, vbH: 560, ox: 360, oy: 310, unit: 72,
        gridXMin: -4, gridXMax: 4, gridYMin: -3, gridYMax: 3 };
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

// Arrow from origin to (x, y) (math coords). Optional progress fade-in.
function Arrow({ G, x, y, color, label = null, labelDX = 0, labelDY = 0,
                 strokeWidth = 3.4, fromX = 0, fromY = 0, opacity = 1,
                 dashed = false }) {
  const a = toSvgF(G, fromX, fromY);
  const b = toSvgF(G, x, y);
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
      {label != null && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

function SoftPanel({ portrait, children }) {
  return (
    <div style={{
      position: 'absolute',
      ...(portrait
        ? { left: 48, right: 48, top: 880, bottom: 100 }
        : { right: 60, top: 220, width: 360 }),
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

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="inner product spaces"
      title="The Dot Product: Length, Length, Cosine"
      duration={SCENE_DURATION}
      introEnd={2.93}
      introCaption="How do you measure the angle between two arrows?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={2.93} end={8.23}>
        <ComponentFormBeat/>
      </Sprite>

      <Sprite start={8.23} end={21.4}>
        <AngleScrubBeat/>
      </Sprite>

      <Sprite start={21.4} end={28.9}>
        <SignFromAngleBeat/>
      </Sprite>

      <Sprite start={28.9} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Component-form computation ──────────────────────────────────
function ComponentFormBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  // u = (3, 1), v = (1, 2)  → u·v = 3·1 + 1·2 = 5
  const ux = 3, uy = 1;
  const vx = 1, vy = 2;

  return (
    <>
      <div style={{
        position: 'absolute',
        left: portrait ? '50%' : '34%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <Axes2DSvg G={G}/>
          </SvgFadeIn>

          <SvgFadeIn duration={0.4} delay={0.4}>
            <Arrow G={G} x={ux} y={uy} color="var(--amber-400)"
                   label="u" labelDX={22} labelDY={-2}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.9}>
            <Arrow G={G} x={vx} y={vy} color="var(--teal-400)"
                   label="v" labelDX={-22} labelDY={-4}/>
          </SvgFadeIn>

          {/* Origin dot */}
          <circle cx={toSvgF(G, 0, 0).sx} cy={toSvgF(G, 0, 0).sy} r={4}
                  fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.2}/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={1.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          component form
        </FadeUp>
        <FadeUp duration={0.55} delay={1.4} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 24 : 28, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 2,
          }}>
            <span style={{ color: 'var(--amber-400)' }}>u</span>&nbsp;·&nbsp;<span style={{ color: 'var(--teal-400)' }}>v</span>&nbsp;=&nbsp;u<sub style={{ fontSize: 14 }}>1</sub>v<sub style={{ fontSize: 14 }}>1</sub>&nbsp;+&nbsp;u<sub style={{ fontSize: 14 }}>2</sub>v<sub style={{ fontSize: 14 }}>2</sub>
        </FadeUp>
        <FadeUp duration={0.55} delay={2.4} distance={10}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 20,
            color: 'var(--amber-300)', letterSpacing: '0.02em',
            lineHeight: 1.3, marginTop: 4,
          }}>
            = 3·1 + 1·2 = 5
        </FadeUp>
        <FadeUp duration={0.5} delay={4.0} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          Easy to compute — but what does that number mean?
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Angle scrub ─────────────────────────────────────────────────
// Hold u fixed at (2.5, 0). Spin v of length 2 from θ ≈ 12° around to 168°
// over ~10 seconds. Display ‖u‖, ‖v‖, cos θ, and u·v live as they update.
function AngleScrubBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  // u fixed along +x with magnitude 2.5
  const uLen = 2.5;
  const ux = uLen, uy = 0;
  // v: rotating around origin with fixed length 2
  const vLen = 2.0;

  // Sweep θ from 12° to 168° over [2.0, 12.5] s.
  const SWEEP_START = 2.0;
  const SWEEP_DUR = 10.5;
  const sweepT = clamp((localTime - SWEEP_START) / SWEEP_DUR, 0, 1);
  const sweepEased = Easing.easeInOutCubic(sweepT);
  const thetaDeg = 12 + (168 - 12) * sweepEased;
  const theta = thetaDeg * Math.PI / 180;
  const vx = vLen * Math.cos(theta);
  const vy = vLen * Math.sin(theta);

  const dot = uLen * vLen * Math.cos(theta);
  const cosT = Math.cos(theta);

  // Arc from u-direction (angle 0) to v-direction (angle θ).
  const arcR = portrait ? 64 : 72;
  const origin = toSvgF(G, 0, 0);
  const arcEndX = origin.sx + arcR * Math.cos(theta);
  const arcEndY = origin.sy - arcR * Math.sin(theta);
  const arcD = `M ${origin.sx + arcR} ${origin.sy} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`;

  // Bar gauge: visualise dot product magnitude with a small horizontal bar
  // beneath the readout panel. Range: [-uLen·vLen, +uLen·vLen] = [-5, +5].
  const dotMax = uLen * vLen;
  const barNorm = clamp(dot / dotMax, -1, 1);

  return (
    <>
      <div style={{
        position: 'absolute',
        left: portrait ? '50%' : '34%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <Axes2DSvg G={G}/>
          </SvgFadeIn>

          {/* u fixed */}
          <SvgFadeIn duration={0.4} delay={0.4}>
            <Arrow G={G} x={ux} y={uy} color="var(--amber-400)"
                   label="u" labelDX={20} labelDY={-12} strokeWidth={3.8}/>
          </SvgFadeIn>

          {/* Arc showing θ — appears once v is in play */}
          {sweepT > 0.02 && (
            <g opacity={Math.min(1, sweepT * 8)}>
              <path d={arcD} stroke="var(--chalk-300)" strokeWidth={1.6}
                    fill="none" strokeDasharray="3 4" opacity={0.85}/>
              {/* θ label inside the arc */}
              <text
                x={origin.sx + (arcR + 14) * Math.cos(theta / 2)}
                y={origin.sy - (arcR + 14) * Math.sin(theta / 2) + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18} textAnchor="middle">θ</text>
            </g>
          )}

          {/* v rotating */}
          <SvgFadeIn duration={0.4} delay={1.0}>
            <Arrow G={G} x={vx} y={vy} color="var(--teal-400)"
                   label="v"
                   labelDX={vx >= 0 ? 18 : -18}
                   labelDY={vy >= 0 ? -10 : 18}
                   strokeWidth={3.8}/>
          </SvgFadeIn>

          {/* Origin */}
          <circle cx={origin.sx} cy={origin.sy} r={4}
                  fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.2}/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          the geometric form
        </FadeUp>
        <FadeUp duration={0.6} delay={0.8} distance={12}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 24 : 26, color: 'var(--amber-300)',
            lineHeight: 1.3, marginTop: 2,
          }}>
            <span style={{ color: 'var(--amber-400)' }}>u</span>·<span style={{ color: 'var(--teal-400)' }}>v</span> = ‖u‖ ‖v‖ cos θ
        </FadeUp>

        {/* Live readouts: visible after sweep begins */}
        {sweepT > 0 && (
          <FadeUp duration={0.4} delay={1.8} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 16,
              color: 'var(--chalk-200)', lineHeight: 1.55, marginTop: 6,
            }}>
            <div>‖u‖ = {uLen.toFixed(1)}    ‖v‖ = {vLen.toFixed(1)}</div>
            <div>θ = {thetaDeg.toFixed(0)}°    cos θ = {cosT.toFixed(2)}</div>
            <div style={{ color: dot >= 0 ? 'var(--teal-300)' : 'var(--rose-300)',
                          marginTop: 6, fontSize: portrait ? 18 : 20 }}>
              u·v = {dot.toFixed(2)}
            </div>
          </FadeUp>
        )}

        {/* Bar gauge: −max ◄ 0 ► +max */}
        {sweepT > 0 && (
          <FadeUp duration={0.4} delay={2.2} distance={6}
            style={{
              width: portrait ? 280 : 300, marginTop: 6,
            }}>
            <div style={{
              position: 'relative', height: 10,
              background: 'rgba(232,220,193,0.10)', borderRadius: 5,
            }}>
              {/* centre tick */}
              <div style={{
                position: 'absolute', left: '50%', top: -4, bottom: -4,
                width: 1, background: 'rgba(232,220,193,0.35)',
              }}/>
              {/* fill from centre */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: barNorm >= 0 ? '50%' : `${50 + barNorm * 50}%`,
                width: `${Math.abs(barNorm) * 50}%`,
                background: dot >= 0 ? 'var(--teal-400)' : 'var(--rose-400)',
                borderRadius: 5, opacity: 0.85,
              }}/>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--chalk-300)', marginTop: 4, letterSpacing: '0.08em',
            }}>
              <span>−5</span><span>0</span><span>+5</span>
            </div>
          </FadeUp>
        )}
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Sign reads off the corner ───────────────────────────────────
// Three small tiles side by side. Each shows a u along +x and a v at a
// representative angle (45°, 90°, 135°) with a coloured arc.
function SignFromAngleBeat() {
  const portrait = usePortrait();

  const tiles = [
    { id: 'acute',  thetaDeg: 45,  accent: 'var(--amber-300)',
      arcColor: 'var(--amber-400)',
      label1: 'θ < 90°', label2: 'u·v > 0', kind: 'acute' },
    { id: 'right',  thetaDeg: 90,  accent: 'var(--chalk-100)',
      arcColor: 'var(--chalk-200)',
      label1: 'θ = 90°', label2: 'u·v = 0', kind: 'right' },
    { id: 'obtuse', thetaDeg: 135, accent: 'var(--rose-300)',
      arcColor: 'var(--rose-400)',
      label1: 'θ > 90°', label2: 'u·v < 0', kind: 'obtuse' },
  ];

  // Per-tile mini-SVG sizes (separate from the angle-scrub grid).
  const tileW = portrait ? 220 : 220;
  const tileH = portrait ? 220 : 220;
  const tileO = { sx: tileW / 2 - 28, sy: tileH / 2 + 10 };
  const armLen = 78;

  function Tile({ tile, delay }) {
    const theta = tile.thetaDeg * Math.PI / 180;
    const ux = tileO.sx + armLen, uy = tileO.sy;
    const vx = tileO.sx + armLen * Math.cos(theta);
    const vy = tileO.sy - armLen * Math.sin(theta);
    // Small arc from u-direction to v-direction.
    const arcR = 26;
    const arcEndX = tileO.sx + arcR * Math.cos(theta);
    const arcEndY = tileO.sy - arcR * Math.sin(theta);
    const arcD = `M ${tileO.sx + arcR} ${tileO.sy} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`;

    // Right-angle marker for the perpendicular tile (a small square).
    const sqr = 12;
    return (
      <div style={{
        width: tileW,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <FadeUp duration={0.5} delay={delay} distance={10}>
          <svg width={tileW} height={tileH} viewBox={`0 0 ${tileW} ${tileH}`}
               style={{ overflow: 'visible' }}>
            {/* u along +x */}
            <line x1={tileO.sx} y1={tileO.sy} x2={ux} y2={uy}
                  stroke="var(--amber-400)" strokeWidth={3} strokeLinecap="round"/>
            <path d={`M ${ux} ${uy} L ${ux - 9} ${uy - 5} L ${ux - 9} ${uy + 5} Z`}
                  fill="var(--amber-400)"/>
            {/* v */}
            <line x1={tileO.sx} y1={tileO.sy} x2={vx} y2={vy}
                  stroke="var(--teal-400)" strokeWidth={3} strokeLinecap="round"/>
            {(() => {
              const dx = vx - tileO.sx, dy = vy - tileO.sy;
              const L = Math.hypot(dx, dy);
              const upx = dx / L, upy = dy / L;
              const baseX = vx - upx * 10, baseY = vy - upy * 10;
              const px = -upy, py = upx;
              return (
                <path d={`M ${vx} ${vy} L ${baseX + px * 5} ${baseY + py * 5} L ${baseX - px * 5} ${baseY - py * 5} Z`}
                      fill="var(--teal-400)"/>
              );
            })()}
            {/* Arc or right-angle square */}
            {tile.kind === 'right' ? (
              <path d={`M ${tileO.sx + sqr} ${tileO.sy} L ${tileO.sx + sqr} ${tileO.sy - sqr} L ${tileO.sx} ${tileO.sy - sqr}`}
                    stroke={tile.arcColor} strokeWidth={1.5} fill="none"/>
            ) : (
              <path d={arcD} stroke={tile.arcColor} strokeWidth={1.6} fill="none"/>
            )}
            {/* θ label inside the arc */}
            {tile.kind !== 'right' && (
              <text x={tileO.sx + (arcR + 12) * Math.cos(theta / 2)}
                    y={tileO.sy - (arcR + 12) * Math.sin(theta / 2) + 5}
                    fill={tile.accent} fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={16} textAnchor="middle">θ</text>
            )}
            {/* Origin */}
            <circle cx={tileO.sx} cy={tileO.sy} r={3}
                    fill="var(--chalk-100)"/>
          </svg>
        </FadeUp>
        <FadeUp duration={0.5} delay={delay + 0.2} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--chalk-300)', letterSpacing: '0.10em',
            textAlign: 'center',
          }}>
          {tile.label1}
        </FadeUp>
        <FadeUp duration={0.5} delay={delay + 0.4} distance={6}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 20, color: tile.accent,
          }}>
          {tile.label2}
        </FadeUp>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: portrait ? 'column' : 'row',
      gap: portrait ? 18 : 56,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {tiles.map((tile, i) => (
        <Tile key={tile.id} tile={tile} delay={0.3 + i * 0.6}/>
      ))}
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
          fontSize: portrait ? 36 : 46, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        One number — the <span style={{ color: 'var(--amber-300)' }}>angle</span>, encoded.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '28ch' : '46ch', lineHeight: 1.4,
        }}>
        Length × length × cosine —<br/>and the cosine carries the geometry.
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
