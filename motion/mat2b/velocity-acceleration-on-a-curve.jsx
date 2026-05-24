// Vector Functions: Velocity and Acceleration — Manimo lesson scene.
// Chapter 5 of mat2b (Funksjoner og derivasjon). A vector function
//   r(t) = (2.4 cos t, 1.4 sin t)
// traces an ellipse. The first derivative r'(t) is the velocity (tangent,
// length = speed); the second derivative r''(t) = -r(t) is the acceleration
// (always toward the centre). The moving particle with live tangent velocity
// + inward acceleration is the genuine-motion payload.
//
// Beats:
//    0– 5   Manimo hook
//    5–15   r(t) sweeps out the ellipse
//   15–27   Velocity r'(t): tangent, length = speed (live speed bar)
//   27–39   Acceleration r''(t): points inward, bends the path
//   39–end  Hero outro
//
// Colour discipline:
//   amber-400  the curve / position
//   teal-400   velocity r'(t)
//   rose-400   acceleration r''(t)
//   chalk-200  axes / body

const SCENE_DURATION = 41;

const NARRATION = [
  "A dot races around a track. How do we capture its motion at a single instant?",
  "A vector function r of t gives the position at each time t. As t runs forward, the tip sweeps out the whole curve.",
  "The derivative r prime of t is the velocity. It always points along the path, tangent to the curve, and its length is the speed, which rises and falls as the dot goes around.",
  "The second derivative is the acceleration. For this loop it always points inward, toward the centre — that inward pull is what bends the straight-line motion into a curve.",
  "Velocity points along the path; acceleration points inward and bends it.",
];

const NARRATION_AUDIO = 'audio/velocity-acceleration-on-a-curve/scene.mp3';

// ─── The curve r(t) ───────────────────────────────────────────────────────
const AX = 2.4, AY = 1.4;
function rOf(t)  { return { x: AX * Math.cos(t),  y: AY * Math.sin(t) }; }
function vOf(t)  { return { x: -AX * Math.sin(t), y: AY * Math.cos(t) }; }
function aOf(t)  { return { x: -AX * Math.cos(t), y: -AY * Math.sin(t) }; }
const SPEED_MAX = AX; // |r'| peaks at AX

// ─── Geometry helpers ─────────────────────────────────────────────────────
function planeGeom(portrait) {
  return portrait
    ? { ox: 360, oy: 540, unit: 80, W: 720, H: 1280 }
    : { ox: 440, oy: 372, unit: 92, W: 1280, H: 720 };
}
function panelProps(portrait, wL = 384, wP = 600) {
  return portrait
    ? { left: '50%', transform: 'translateX(-50%)', bottom: 196, width: wP }
    : { right: 56, top: 180, width: wL };
}

function ellipseD(P, samples = 110) {
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const p = P(rOf((i / samples) * 2 * Math.PI));
    d += `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)} `;
  }
  return d + 'Z';
}

function Arrow({ ax, ay, bx, by, color, strokeWidth = 3.2, headLen = 13, headHalf = 7.5, opacity = 1 }) {
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = bx - ux * headLen, baseY = by - uy * headLen;
  const px = -uy, py = ux;
  const lx = baseX + px * headHalf, ly = baseY + py * headHalf;
  const rx = baseX - px * headHalf, ry = baseY - py * headHalf;
  return (
    <g opacity={opacity}>
      <line x1={ax} y1={ay} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${bx} ${by} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
    </g>
  );
}

function SoftPanel({ children, right = 64, top = 196, width = 384, left, bottom, transform }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined, transform }
    : { right, top, transform };
  return (
    <div style={{
      position: 'absolute', width, ...positioning,
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
    }}>
      {children}
    </div>
  );
}

function PlaneSvg({ G, children }) {
  const xL = { sx: G.ox - 2.9 * G.unit, sy: G.oy };
  const xR = { sx: G.ox + 2.9 * G.unit, sy: G.oy };
  const yT = { sx: G.ox, sy: G.oy - 1.95 * G.unit };
  const yB = { sx: G.ox, sy: G.oy + 1.95 * G.unit };
  return (
    <svg width={G.W} height={G.H} viewBox={`0 0 ${G.W} ${G.H}`}
         style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <line x1={xL.sx} y1={xL.sy} x2={xR.sx} y2={xR.sy}
            stroke="var(--chalk-200)" strokeWidth={1.5} opacity={0.55} strokeLinecap="round"/>
      <line x1={yT.sx} y1={yT.sy} x2={yB.sx} y2={yB.sy}
            stroke="var(--chalk-200)" strokeWidth={1.5} opacity={0.55} strokeLinecap="round"/>
      <text x={xR.sx + 12} y={xR.sy + 5} fill="var(--chalk-300)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>x</text>
      <text x={yT.sx - 16} y={yT.sy - 6} fill="var(--chalk-300)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>y</text>
      {children}
    </svg>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="vector-valued functions"
      title="Velocity and Acceleration"
      duration={SCENE_DURATION}
      introEnd={4.89}
      introCaption="Position, velocity, acceleration — from one r(t)."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.89} end={13.46}>
        <TraceBeat/>
      </Sprite>

      <Sprite start={13.46} end={24.85}>
        <VelocityBeat/>
      </Sprite>

      <Sprite start={24.85} end={35.06}>
        <AccelerationBeat/>
      </Sprite>

      <Sprite start={35.06} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: r(t) sweeps the curve ────────────────────────────────────────
function TraceBeat() {
  const portrait = usePortrait();
  const { progress } = useSprite();
  const G = planeGeom(portrait);
  const P = ({ x, y }) => ({ sx: G.ox + x * G.unit, sy: G.oy - y * G.unit });

  // Partial trace: draw the ellipse up to the swept angle, dot at the lead.
  const sweep = clamp((progress - 0.12) / 0.7, 0, 1);
  const tLead = sweep * 2 * Math.PI;
  const samples = Math.max(1, Math.round(sweep * 110));
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const p = P(rOf((i / 110) * 2 * Math.PI));
    d += `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)} `;
  }
  const lead = P(rOf(tLead));
  const origin = P({ x: 0, y: 0 });
  const posVec = P(rOf(tLead));

  return (
    <>
      <PlaneSvg G={G}>
        {sweep > 0.01 && (
          <path d={d} fill="none" stroke="var(--amber-400)" strokeWidth={2.8}
                strokeLinecap="round" opacity={0.9}/>
        )}
        {/* Position vector from origin to the moving tip */}
        <Arrow ax={origin.sx} ay={origin.sy} bx={posVec.sx} by={posVec.sy}
               color="var(--amber-300)" strokeWidth={2.2} opacity={0.55}/>
        <circle cx={lead.sx} cy={lead.sy} r={7}
                fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
        <text x={lead.sx + 12} y={lead.sy - 10} fill="var(--amber-300)"
              fontFamily="var(--font-serif)" fontStyle="italic" fontSize={17}>r(t)</text>
      </PlaneSvg>

      <SoftPanel {...panelProps(portrait)}>
        <FadeUp duration={0.4} delay={0.2} distance={8}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                   letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          a vector function
        </FadeUp>
        <FadeUp duration={0.5} delay={1.2} distance={10}
          style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 17 : 19,
                   color: 'var(--chalk-100)' }}>
          r(t) = (2.4 cos t, 1.4 sin t)
        </FadeUp>
        <FadeUp duration={0.5} delay={3.0} distance={8}
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: portrait ? 16 : 18,
                   color: 'var(--chalk-300)', lineHeight: 1.4, maxWidth: '32ch' }}>
          The tip draws the curve as <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}>t</span> advances.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: velocity (tangent) + live speed ──────────────────────────────
function VelocityBeat() {
  const portrait = usePortrait();
  const { progress } = useSprite();
  const G = planeGeom(portrait);
  const P = ({ x, y }) => ({ sx: G.ox + x * G.unit, sy: G.oy - y * G.unit });

  const t = clamp((progress - 0.08) / 0.84, 0, 1) * 2 * Math.PI;
  const pos = rOf(t), vel = vOf(t);
  const speed = Math.hypot(vel.x, vel.y);
  const base = P(pos);
  const VSC = 0.62;
  const tip = P({ x: pos.x + vel.x * VSC, y: pos.y + vel.y * VSC });
  const barFrac = speed / SPEED_MAX;

  return (
    <>
      <PlaneSvg G={G}>
        <path d={ellipseD(P)} fill="none" stroke="var(--amber-400)" strokeWidth={2.4} opacity={0.7}/>
        <Arrow ax={base.sx} ay={base.sy} bx={tip.sx} by={tip.sy}
               color="var(--teal-400)" strokeWidth={3.4}/>
        <text x={tip.sx + 8} y={tip.sy - 6} fill="var(--teal-300)"
              fontFamily="var(--font-serif)" fontStyle="italic" fontSize={17}>r′(t)</text>
        <circle cx={base.sx} cy={base.sy} r={6.5}
                fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
      </PlaneSvg>

      <SoftPanel {...panelProps(portrait)}>
        <FadeUp duration={0.4} delay={0.2} distance={8}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                   letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          velocity = tangent
        </FadeUp>
        <FadeUp duration={0.5} delay={1.0} distance={10}
          style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 17,
                   color: 'var(--teal-400)' }}>
          r′(t) = (−2.4 sin t, 1.4 cos t)
        </FadeUp>

        {/* Live speed bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 2 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--chalk-200)' }}>
            speed |r′(t)| = {speed.toFixed(2)}
          </div>
          <div style={{ width: '86%', height: 10, background: 'rgba(232,220,193,0.10)', borderRadius: 6 }}>
            <div style={{ width: `${(barFrac * 100).toFixed(0)}%`, height: '100%',
                          background: 'var(--teal-400)', borderRadius: 6 }}/>
          </div>
        </div>

        <FadeUp duration={0.5} delay={2.2} distance={8}
          style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                   color: 'var(--chalk-300)', lineHeight: 1.4, maxWidth: '34ch' }}>
          Always tangent — its length is how fast the dot moves.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: acceleration points inward ───────────────────────────────────
function AccelerationBeat() {
  const portrait = usePortrait();
  const { progress } = useSprite();
  const G = planeGeom(portrait);
  const P = ({ x, y }) => ({ sx: G.ox + x * G.unit, sy: G.oy - y * G.unit });

  const t = clamp((progress - 0.08) / 0.84, 0, 1) * 2 * Math.PI;
  const pos = rOf(t), vel = vOf(t), acc = aOf(t);
  const base = P(pos);
  const VSC = 0.5, ASC = 0.5;
  const vtip = P({ x: pos.x + vel.x * VSC, y: pos.y + vel.y * VSC });
  const atip = P({ x: pos.x + acc.x * ASC, y: pos.y + acc.y * ASC });
  const origin = P({ x: 0, y: 0 });

  return (
    <>
      <PlaneSvg G={G}>
        <path d={ellipseD(P)} fill="none" stroke="var(--amber-400)" strokeWidth={2.4} opacity={0.7}/>
        {/* Centre marker + faint dashed line from particle toward centre */}
        <circle cx={origin.sx} cy={origin.sy} r={3.5} fill="var(--chalk-300)"/>
        <line x1={base.sx} y1={base.sy} x2={origin.sx} y2={origin.sy}
              stroke="var(--rose-300)" strokeWidth={1} strokeDasharray="4 5" opacity={0.4}/>
        {/* Faded velocity for reference */}
        <Arrow ax={base.sx} ay={base.sy} bx={vtip.sx} by={vtip.sy}
               color="var(--teal-400)" strokeWidth={2.6} opacity={0.4}/>
        {/* Acceleration, bold, inward */}
        <Arrow ax={base.sx} ay={base.sy} bx={atip.sx} by={atip.sy}
               color="var(--rose-400)" strokeWidth={3.6}/>
        <text x={atip.sx - 6} y={atip.sy + 18} fill="var(--rose-300)"
              fontFamily="var(--font-serif)" fontStyle="italic" fontSize={17}
              textAnchor="end">r″(t)</text>
        <circle cx={base.sx} cy={base.sy} r={6.5}
                fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
      </PlaneSvg>

      <SoftPanel {...panelProps(portrait)}>
        <FadeUp duration={0.4} delay={0.2} distance={8}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                   letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          acceleration = inward
        </FadeUp>
        <FadeUp duration={0.5} delay={1.0} distance={10}
          style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 17,
                   color: 'var(--rose-300)' }}>
          r″(t) = −r(t)
        </FadeUp>
        <FadeUp duration={0.5} delay={1.6} distance={8}
          style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                   color: 'var(--chalk-200)', lineHeight: 1.45, maxWidth: '34ch' }}>
          For this ellipse the acceleration is exactly the position reversed —
          it always points back to the <span style={{ color: 'var(--rose-300)' }}>centre</span>.
        </FadeUp>
        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                   color: 'var(--chalk-300)', lineHeight: 1.4, maxWidth: '34ch' }}>
          That inward pull is what bends the path.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 5: hero outro ───────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      maxWidth: portrait ? 560 : 980,
    }}>
      <FadeUp duration={0.45} delay={0} distance={6}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        vector functions
      </FadeUp>
      <FadeUp duration={0.8} delay={0.35} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 34 : 48, color: 'var(--chalk-100)', lineHeight: 1.2 }}>
        Velocity <span style={{ color: 'var(--teal-400)' }}>along</span>,
        acceleration <span style={{ color: 'var(--rose-300)' }}>inward.</span>
      </FadeUp>
      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 19 : 23, color: 'var(--chalk-200)', maxWidth: '42ch', lineHeight: 1.35 }}>
        Differentiate the position once for velocity, twice for acceleration.
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
