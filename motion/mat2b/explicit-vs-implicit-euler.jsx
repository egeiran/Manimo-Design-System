// Explicit vs Implicit: Why Backward Euler Stays Stable — Manimo lesson scene.
// Chapter 4 of mat2b (Differensialligninger), numerical methods (Uke 9).
// Forward (explicit) Euler reads the slope at the CURRENT point; backward
// (implicit) Euler reads it at the NEXT point, so the unknown sits on both
// sides and must be solved for. On the decay test y' = -λy:
//
//   forward:  y_{n+1} = (1 - hλ) y_n     blows up once |1 - hλ| > 1  (h > 2/λ)
//   backward: y_{n+1} = y_n / (1 + hλ)    shrinks for every h > 0
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//   0– 6   Manimo hook
//   6–17   Forward Euler: slope at the current point (small h, tracks fine)
//  17–31   Backward Euler: slope at the unknown endpoint → SOLVE (GENUINE MOTION)
//  31–46   Stability sweep: raise h; forward oscillates & grows (GENUINE MOTION)
//  46–55   The two amplification factors side by side
//  55–61   Takeaway
//
// Colour discipline:
//   violet-400  true decay
//   rose-400    forward (explicit) Euler — the one that blows up
//   teal-400    backward (implicit) Euler — the stable one
//   amber-400   the "solve for the endpoint" highlight
//   chalk-*     axes, captions

const SCENE_DURATION = 75;

const NARRATION = [
  /*  0– 6 */ 'A solution that decays fast should fade quietly to zero. Push the step size, though, and one method blows up while the other stays calm.',
  /*  6–17 */ 'Forward Euler reads the slope where you are right now, then steps. It is explicit and cheap, and for a small step it tracks the decay nicely.',
  /* 17–31 */ 'Backward Euler instead uses the slope at the point you are stepping to. Now the unknown appears on both sides, so you must solve for the landing point, slide it until the slope there is consistent. For this decay the answer is simply the old value divided by one plus h lambda.',
  /* 31–46 */ "Now raise the step size. Past the stability limit, forward Euler's growth factor is bigger than one in size, so it overshoots, flips sign, and the swing grows. Backward Euler divides by something larger than one every step, so it can only shrink.",
  /* 46–55 */ 'Each forward step multiplies by one minus h lambda. Each backward step divides by one plus h lambda. The first can exceed one in size; the second never can, so backward Euler is stable for any step.',
  /* 55–61 */ 'Implicit methods cost a solve each step, but they buy stability with no limit on the step. That is why they exist for stiff problems.',
];

const NARRATION_AUDIO = 'audio/explicit-vs-implicit-euler/scene.mp3';

// ─── Model ──────────────────────────────────────────────────────────────────
const LAM = 4;                       // y' = -λ y
const trueDecay = (t) => Math.exp(-LAM * t);
const T1 = 2.0;                      // plot t in [0, 2]
const YMAX = 2.0;                    // symmetric y range [-2, 2]
const HSTABLE = 2 / LAM;             // forward Euler stability limit = 0.5

function forwardSeq(h) {
  const pts = [{ t: 0, y: 1 }];
  let y = 1;
  for (let t = h; t <= T1 + 1e-9; t += h) { y = (1 - LAM * h) * y; pts.push({ t, y }); }
  return pts;
}
function backwardSeq(h) {
  const pts = [{ t: 0, y: 1 }];
  let y = 1;
  for (let t = h; t <= T1 + 1e-9; t += h) { y = y / (1 + LAM * h); pts.push({ t, y }); }
  return pts;
}

// ─── Geometry (y = 0 axis sits in the middle) ───────────────────────────────
function geom(portrait) {
  return portrait
    ? { vw: 720, vh: 1280, ox: 120, top: 270, w: 500, h: 540,
        panel: { left: 70, top: 900, width: 580 } }
    : { vw: 1280, vh: 720, ox: 200, top: 150, w: 620, h: 440,
        panel: { right: 56, top: 150, width: 392 } };
}
const gBottom = (G) => G.top + G.h;
const mapX = (t, G) => G.ox + t / T1 * G.w;
const mapY = (y, G) => (G.top + G.h / 2) - (y / YMAX) * (G.h / 2);

function decayPath(G, samples = 80) {
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const t = T1 * (i / samples);
    d += `${i === 0 ? 'M' : 'L'} ${mapX(t, G).toFixed(1)} ${mapY(trueDecay(t), G).toFixed(1)} `;
  }
  return d.trim();
}
const seqPath = (pts, G) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.t, G).toFixed(1)} ${mapY(p.y, G).toFixed(1)}`).join(' ');

// ─── Shared helpers ─────────────────────────────────────────────────────────
function SoftPanel({ children, right, top, left, bottom, width = 380 }) {
  const pos = (left != null || bottom != null)
    ? { left, top: bottom == null ? top : undefined, bottom }
    : { right, top };
  return (
    <div style={{
      position: 'absolute', width, ...pos, pointerEvents: 'none',
      padding: '18px 22px', background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)', borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
    }}>{children}</div>
  );
}

function Axes({ G }) {
  const yZero = mapY(0, G);
  return (
    <g>
      {/* vertical axis */}
      <line x1={G.ox} y1={G.top} x2={G.ox} y2={gBottom(G)}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      {/* horizontal axis at y = 0 */}
      <line x1={G.ox} y1={yZero} x2={G.ox + G.w} y2={yZero}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <text x={G.ox + G.w + 12} y={yZero + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={20}>t</text>
      <text x={G.ox - 12} y={G.top + 4} textAnchor="end"
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={20}>y</text>
      <text x={G.ox - 12} y={yZero + 16} textAnchor="end"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={12}>0</text>
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="numerical ODEs"
      title="Explicit vs Implicit: Backward Euler Stays Stable"
      duration={SCENE_DURATION}
      introEnd={9.39}
      introCaption="Same equation, two fates."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.39} end={18.51}>
        <ForwardSlope/>
      </Sprite>

      <Sprite start={18.51} end={34.9}>
        <ImplicitIdea/>
      </Sprite>

      <Sprite start={34.9} end={50.65}>
        <StabilitySweep/>
      </Sprite>

      <Sprite start={50.65} end={64.96}>
        <Factors/>
      </Sprite>

      <Sprite start={64.96} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: forward Euler (explicit), small step ───────────────────────────
function ForwardSlope() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const h = 0.1;
  const fwd = forwardSeq(h);
  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vw} height={G.vh} viewBox={`0 0 ${G.vw} ${G.vh}`}>
        <Axes G={G}/>
        <TraceIn d={decayPath(G)} stroke="var(--violet-400)" strokeWidth={3} duration={1.2} delay={0.3}/>
        <SvgFadeIn delay={1.6} duration={0.4}>
          <text x={mapX(0.55, G)} y={mapY(trueDecay(0.55), G) - 12}
                fill="var(--violet-400)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={20}>y = e⁻λᵗ</text>
        </SvgFadeIn>
        <TraceIn d={seqPath(fwd, G)} stroke="var(--rose-400)" strokeWidth={2.6} duration={1.6} delay={1.0}/>
        <SvgFadeIn delay={2.4} duration={0.4}>
          {fwd.filter((_, i) => i % 2 === 0).map((p, i) => (
            <circle key={i} cx={mapX(p.t, G)} cy={mapY(p.y, G)} r={3.6}
                    fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={0.8}/>
          ))}
        </SvgFadeIn>
      </svg>
      {portrait
        ? <SoftPanel left={G.panel.left} top={G.panel.top} width={G.panel.width}>{fwdPanel(true)}</SoftPanel>
        : <SoftPanel right={G.panel.right} top={G.panel.top} width={G.panel.width}>{fwdPanel(false)}</SoftPanel>}
    </>
  );
}
function fwdPanel(portrait) {
  return (
    <>
      <FadeUp duration={0.45} delay={0.3} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        forward (explicit) Euler
      </FadeUp>
      <FadeUp duration={0.55} delay={0.7} distance={10}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 24 : 28, color: 'var(--rose-300)' }}>
        yₙ₊₁ = yₙ + h·f(tₙ, yₙ)
      </FadeUp>
      <FadeUp duration={0.5} delay={2.2} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
                 color: 'var(--chalk-200)', maxWidth: '34ch', lineHeight: 1.4 }}>
        Slope at the point you already know. With a small step, it follows the decay.
      </FadeUp>
    </>
  );
}

// ─── Beat 3: backward Euler — solve for the endpoint (GENUINE MOTION) ────────
// Zoom on the first step. The forward step uses the slope at the start; the
// backward step's landing point Q slides until the chord P→Q has the same
// slope as the field at Q (the implicit solve). h = 0.2 here for legibility.
function ImplicitIdea() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  const h = 0.2;
  const TZ0 = -0.04, TZ1 = 0.30, YZ0 = -0.05, YZ1 = 1.12;
  const mx = (t) => G.ox + (t - TZ0) / (TZ1 - TZ0) * G.w;
  const my = (y) => gBottom(G) - (y - YZ0) / (YZ1 - YZ0) * G.h;
  const pxPerT = G.w / (TZ1 - TZ0), pxPerY = G.h / (YZ1 - YZ0);

  const yP = 1, tP = 0, tQ = h;
  const yFwd = (1 - LAM * h) * yP;        // 0.2  — forward landing
  const yBwd = yP / (1 + LAM * h);        // 0.556 — backward (consistent) landing
  const P = { x: mx(tP), y: my(yP) };
  const Qx = mx(tQ);

  // The candidate landing point slides from the forward value up to the
  // consistent backward value (the implicit solve, animated).
  const slideT = Easing.easeInOutCubic(clamp((localTime - 3.0) / 4.0, 0, 1));
  const yQ = yFwd + (yBwd - yFwd) * slideT;
  const Q = { x: Qx, y: my(yQ) };

  // slope tick at Q showing the field slope there (-λ yQ)
  function tick(px, py, k, len = 64) {
    const dx = pxPerT, dy = -k * pxPerY, n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, half = len / 2;
    return { x1: px - ux * half, y1: py - uy * half, x2: px + ux * half, y2: py + uy * half };
  }
  const qTick = tick(Q.x, Q.y, -LAM * yQ);
  const consistent = slideT > 0.985;

  // forward ghost step (tangent at the start)
  const fwdGhost = { x: Qx, y: my(yFwd) };

  let trueD = '';
  for (let i = 0; i <= 50; i++) { const t = TZ0 + (TZ1 - TZ0) * (i / 50); trueD += `${i === 0 ? 'M' : 'L'} ${mx(t).toFixed(1)} ${my(trueDecay(t)).toFixed(1)} `; }

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vw} height={G.vh} viewBox={`0 0 ${G.vw} ${G.vh}`}>
        {/* axes for the zoom */}
        <line x1={G.ox} y1={G.top} x2={G.ox} y2={gBottom(G)} stroke="var(--chalk-200)" strokeWidth={1.6}/>
        <line x1={G.ox} y1={my(0)} x2={G.ox + G.w} y2={my(0)} stroke="var(--chalk-200)" strokeWidth={1.6}/>
        <path d={trueD.trim()} fill="none" stroke="var(--violet-400)" strokeWidth={2.4} opacity={0.5}/>

        {/* interval ticks */}
        <line x1={P.x} y1={my(0)} x2={P.x} y2={my(0) + 7} stroke="var(--chalk-300)" strokeWidth={1.4}/>
        <line x1={Qx} y1={my(0)} x2={Qx} y2={my(0) + 7} stroke="var(--chalk-300)" strokeWidth={1.4}/>
        <text x={P.x} y={my(0) + 24} textAnchor="middle" fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={12}>tₙ</text>
        <text x={Qx} y={my(0) + 24} textAnchor="middle" fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={12}>tₙ+h</text>

        {/* start point */}
        <circle cx={P.x} cy={P.y} r={6} fill="var(--chalk-100)"/>
        <text x={P.x - 12} y={P.y + 4} textAnchor="end" fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>yₙ</text>

        {/* forward ghost step (slope at start) */}
        <SvgFadeIn delay={0.4} duration={0.5}>
          <line x1={P.x} y1={P.y} x2={fwdGhost.x} y2={fwdGhost.y}
                stroke="var(--rose-400)" strokeWidth={2.4} strokeDasharray="6 6" opacity={0.85}/>
          <circle cx={fwdGhost.x} cy={fwdGhost.y} r={5} fill="none" stroke="var(--rose-400)" strokeWidth={2}/>
          <text x={fwdGhost.x + 12} y={fwdGhost.y + 16} fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={12}>forward</text>
        </SvgFadeIn>

        {/* backward solve: sliding candidate + field-slope tick + chord */}
        <line x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} stroke="var(--teal-400)" strokeWidth={3} strokeLinecap="round"/>
        <line x1={qTick.x1} y1={qTick.y1} x2={qTick.x2} y2={qTick.y2}
              stroke={consistent ? 'var(--amber-400)' : 'var(--chalk-300)'} strokeWidth={2.6} strokeLinecap="round"/>
        <circle cx={Q.x} cy={Q.y} r={7} fill="var(--teal-400)" stroke="var(--chalk-100)" strokeWidth={1.3}/>
        <text x={Q.x + 14} y={Q.y - 8} fill="var(--teal-400)" fontFamily="var(--font-mono)" fontSize={13}>
          {consistent ? 'backward ✓' : 'solving…'}
        </text>
      </svg>
      {portrait
        ? <SoftPanel left={G.panel.left} top={G.panel.top} width={G.panel.width}>{implicitPanel(true)}</SoftPanel>
        : <SoftPanel right={G.panel.right} top={G.panel.top} width={G.panel.width}>{implicitPanel(false)}</SoftPanel>}
    </>
  );
}
function implicitPanel(portrait) {
  return (
    <>
      <FadeUp duration={0.45} delay={0.2} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        backward (implicit) Euler
      </FadeUp>
      <FadeUp duration={0.55} delay={0.6} distance={10}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 22 : 26, color: 'var(--teal-400)' }}>
        yₙ₊₁ = yₙ + h·f(tₙ₊₁, yₙ₊₁)
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
                 color: 'var(--chalk-200)', maxWidth: '34ch', lineHeight: 1.4 }}>
        The unknown is on both sides. Solve for the landing point.
      </FadeUp>
      <FadeUp duration={0.5} delay={5.5} distance={8}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 22 : 26, color: 'var(--amber-300)' }}>
        ⇒  yₙ₊₁ = yₙ / (1 + hλ)
      </FadeUp>
    </>
  );
}

// ─── Beat 4: stability sweep (GENUINE MOTION) ───────────────────────────────
// Sweep h from 0.1 up to 0.55 and redraw both iterate sequences. Forward
// Euler's amplitude grows once h passes 2/λ; backward Euler always decays.
function StabilitySweep() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  const sweepStart = 0.6, sweepDur = 6.0;
  const frac = Easing.easeInOutCubic(clamp((localTime - sweepStart) / sweepDur, 0, 1));
  const h = 0.1 + (0.55 - 0.1) * frac;
  const factor = 1 - LAM * h;
  const unstable = Math.abs(factor) > 1;

  const fwd = forwardSeq(h);
  const bwd = backwardSeq(h);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vw} height={G.vh} viewBox={`0 0 ${G.vw} ${G.vh}`}>
        <Axes G={G}/>
        <path d={decayPath(G)} fill="none" stroke="var(--violet-400)" strokeWidth={2.6} opacity={0.6}/>

        <path d={seqPath(bwd, G)} fill="none" stroke="var(--teal-400)" strokeWidth={3}
              strokeLinecap="round" strokeLinejoin="round"/>
        {bwd.map((p, i) => (
          <circle key={`b${i}`} cx={mapX(p.t, G)} cy={mapY(p.y, G)} r={3.6} fill="var(--teal-400)"/>
        ))}

        <path d={seqPath(fwd, G)} fill="none" stroke="var(--rose-400)" strokeWidth={3}
              strokeLinecap="round" strokeLinejoin="round"/>
        {fwd.map((p, i) => (
          <circle key={`f${i}`} cx={mapX(p.t, G)} cy={mapY(p.y, G)} r={4} fill="var(--rose-400)"
                  stroke="var(--chalk-100)" strokeWidth={0.8}/>
        ))}
      </svg>
      {portrait
        ? <SoftPanel left={G.panel.left} top={G.panel.top} width={G.panel.width}>{sweepPanel(true, h, factor, unstable)}</SoftPanel>
        : <SoftPanel right={G.panel.right} top={G.panel.top} width={G.panel.width}>{sweepPanel(false, h, factor, unstable)}</SoftPanel>}
    </>
  );
}
function sweepPanel(portrait, h, factor, unstable) {
  return (
    <>
      <FadeUp duration={0.45} delay={0.2} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        sweep the step size
      </FadeUp>
      <FadeUp duration={0.5} delay={0.5} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 16, color: 'var(--chalk-100)' }}>
        h = {h.toFixed(2)}   (limit 0.50)
      </FadeUp>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 15, color: 'var(--rose-300)' }}>
        forward factor 1 − hλ = {factor.toFixed(2)}
      </FadeUp>
      <FadeUp duration={0.4} delay={0.9} distance={6}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 15, fontWeight: 700,
                 letterSpacing: '0.06em',
                 color: unstable ? 'var(--rose-400)' : 'var(--teal-400)' }}>
        {unstable ? 'forward: UNSTABLE' : 'forward: stable'}
      </FadeUp>
      <FadeUp duration={0.5} delay={2.8} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15, color: 'var(--chalk-300)',
                 maxWidth: '34ch', lineHeight: 1.4 }}>
        Backward Euler (teal) decays for every step size.
      </FadeUp>
    </>
  );
}

// ─── Beat 5: the two amplification factors ──────────────────────────────────
function Factors() {
  const portrait = usePortrait();
  const Card = ({ delay, tone, label, formula, note }) => (
    <FadeUp duration={0.55} delay={delay} distance={12}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
        padding: '22px 26px', borderRadius: 16,
        background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(232,220,193,0.08)',
        minWidth: portrait ? 'auto' : 360,
      }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: tone,
                    letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                    fontSize: portrait ? 26 : 30, color: 'var(--chalk-100)' }}>{formula}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--chalk-300)',
                    textAlign: 'center', maxWidth: '26ch', lineHeight: 1.35 }}>{note}</div>
    </FadeUp>
  );
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: portrait ? 'column' : 'row',
      alignItems: 'center', justifyContent: 'center', gap: portrait ? 22 : 40,
    }}>
      <Card delay={0.4} tone="var(--rose-300)" label="forward (explicit)"
            formula="yₙ₊₁ = (1 − hλ) yₙ"
            note="multiplier can exceed 1 in size → can blow up"/>
      <Card delay={1.2} tone="var(--teal-400)" label="backward (implicit)"
            formula="yₙ₊₁ = yₙ / (1 + hλ)"
            note="divisor always above 1 → always shrinks"/>
    </div>
  );
}

// ─── Beat 6: takeaway ───────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        stability, not just accuracy
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 30 : 44, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '42ch', lineHeight: 1.25 }}>
        Implicit costs a solve — and buys <span style={{ color: 'var(--teal-400)' }}>any step size</span>.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 16, color: 'var(--chalk-300)',
                 maxWidth: portrait ? '30ch' : '50ch', lineHeight: 1.4 }}>
        The reason backward methods exist for stiff problems.
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
