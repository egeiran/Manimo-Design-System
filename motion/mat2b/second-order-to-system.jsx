// Second-Order ODE as a First-Order System — Manimo lesson scene.
// Chapter 4 / week 9 of mat2b. Walks the universal trick:
//   y'' + p y' + q y = 0   →   (y, v)' = A (y, v),  with A = [[0,1],[-q,-p]]
// closing with a small phase-plane glimpse to motivate why the system form
// matters: every numerical method and every eigen-analysis is built for
// first-order systems.
//
// Concrete example used:
//   damped oscillator   y'' + 0.4 y' + 1.0 y = 0
//   so p = 0.4, q = 1.0, companion A = [[0, 1], [-1, -0.4]]
//
// Beats:
//    0– 4.6   Manimo hook
//   4.6–12    The second-order equation appears
//   12–20     Introduce v = y' — derive v' = -p v - q y
//   20–28     Stack to matrix form, glimpse the phase-plane spiral
//   28–end    Hero outro
//
// Colour discipline:
//   chalk-100  primary text
//   chalk-300  the secondary derivation lines
//   violet-400 y column / state position
//   teal-400   v column / state velocity
//   amber-400  the matrix machine A
//   amber-300  takeaway accent

const SCENE_DURATION = 60;

const NARRATION = [
  "Why do we keep rewriting second-order equations as first-order systems? Because every numerical method, every matrix tool, is built for first order.",
  "Start with a linear second-order equation. y double prime plus p times y prime plus q times y equals zero. One unknown function, two derivatives in play.",
  "Introduce a second unknown — call it v, and define it to be y prime. Then v prime is y double prime, which the equation tells us equals minus p v minus q y.",
  "Stack y and v into a state vector. Its time derivative is a two by two matrix times itself. A second-order scalar equation has become a first-order vector equation — ready for Euler, R K four, or eigenvector analysis.",
  "One scalar second-order equation becomes a first-order system in twice as many unknowns. Same dynamics — friendlier toolbox.",
];

const NARRATION_AUDIO = 'audio/second-order-to-system/scene.mp3';

// Example: y'' + 0.4 y' + 1.0 y = 0 (mildly damped oscillator).
const P_COEF = 0.4;
const Q_COEF = 1.0;

// ─── Helpers ──────────────────────────────────────────────────────────────
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

// Generic "math card" used in the derivation. Renders a labelled
// translucent panel with an italic formula inside.
function Card({ children, color = 'var(--chalk-100)', size = 36, delay = 0,
                width = 520, align = 'center' }) {
  return (
    <FadeUp duration={0.55} delay={delay} distance={14}
      style={{
        position: 'absolute',
        left: '50%', transform: 'translateX(-50%)',
        width,
        padding: '20px 26px',
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(232,220,193,0.07)',
        borderRadius: 16,
        boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
        textAlign: align,
        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        fontSize: size, color, lineHeight: 1.3,
      }}>
      {children}
    </FadeUp>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="ODE systems"
      title="Second Order → First Order System"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={9.66}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={9.66} end={21.83}>
        <SecondOrderBeat/>
      </Sprite>

      <Sprite start={21.83} end={33.91}>
        <IntroduceVBeat/>
      </Sprite>

      <Sprite start={33.91} end={50.09}>
        <MatrixFormBeat/>
      </Sprite>

      <Sprite start={50.09} end={SCENE_DURATION}>
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
        One trick. Every tool opens up.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: The second-order ODE ─────────────────────────────────────────
function SecondOrderBeat() {
  return (
    <>
      <div style={{
        position: 'absolute', left: 0, top: 220, width: 1280,
        textAlign: 'center',
      }}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          one scalar equation
        </FadeUp>
      </div>

      <Card delay={0.6} size={56} width={600}>
        <span style={{ color: 'var(--chalk-100)' }}>y</span>
        <sup style={{ fontSize: 30 }}>′′</sup>
        <span style={{ margin: '0 12px' }}>+</span>
        <span style={{ color: 'var(--violet-400)' }}>p</span>
        <span style={{ margin: '0 6px' }}> </span>
        <span style={{ color: 'var(--chalk-100)' }}>y</span>
        <sup style={{ fontSize: 30 }}>′</sup>
        <span style={{ margin: '0 12px' }}>+</span>
        <span style={{ color: 'var(--teal-400)' }}>q</span>
        <span style={{ margin: '0 6px' }}> </span>
        <span style={{ color: 'var(--chalk-100)' }}>y</span>
        <span style={{ margin: '0 12px' }}>= 0</span>
      </Card>

      <div style={{
        position: 'absolute', left: 0, top: 396, width: 1280,
        textAlign: 'center',
      }}>
        <FadeUp duration={0.5} delay={2.0} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-300)',
            maxWidth: 720, margin: '0 auto', lineHeight: 1.4,
          }}>
          Linear, homogeneous, constant coefficients. <br/>
          Two derivatives in play.
        </FadeUp>
      </div>

      <div style={{
        position: 'absolute', left: 0, top: 488, width: 1280,
        textAlign: 'center',
      }}>
        <FadeUp duration={0.5} delay={4.0} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--chalk-200)', letterSpacing: '0.06em',
          }}>
          example: <span style={{ color: 'var(--violet-400)' }}>p = 0.4</span>,&nbsp;
          <span style={{ color: 'var(--teal-400)' }}>q = 1.0</span>&nbsp;
          (mildly damped oscillator)
        </FadeUp>
      </div>
    </>
  );
}

// ─── Beat 3: Introduce v = y' and derive v' ───────────────────────────────
function IntroduceVBeat() {
  const { localTime } = useSprite();
  const stepTwoReveal = clamp((localTime - 2.6) / 0.6, 0, 1);
  const stepThreeReveal = clamp((localTime - 4.4) / 0.6, 0, 1);

  return (
    <>
      <div style={{
        position: 'absolute', left: 0, top: 150, width: 1280,
        textAlign: 'center',
      }}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          add a second unknown
        </FadeUp>
      </div>

      {/* Step 1: define v */}
      <Card delay={0.6} size={42} width={560}>
        <span style={{ color: 'var(--teal-400)' }}>v</span>
        <span style={{ margin: '0 10px' }}>:=</span>
        <span style={{ color: 'var(--chalk-100)' }}>y</span>
        <sup style={{ fontSize: 24 }}>′</sup>
      </Card>

      {/* Step 2: v' = y'' */}
      <div style={{
        opacity: stepTwoReveal,
        position: 'absolute', left: 0, top: 312, width: 1280,
        transform: `translateY(${(1 - stepTwoReveal) * 14}px)`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', padding: '18px 28px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(232,220,193,0.07)',
            borderRadius: 14,
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 38, color: 'var(--chalk-100)', lineHeight: 1.3,
          }}>
            <span style={{ color: 'var(--teal-400)' }}>v</span>
            <sup style={{ fontSize: 24 }}>′</sup>
            <span style={{ margin: '0 10px' }}>=</span>
            <span style={{ color: 'var(--chalk-100)' }}>y</span>
            <sup style={{ fontSize: 24 }}>′′</sup>
          </span>
        </div>
      </div>

      {/* Step 3: substitute */}
      <div style={{
        opacity: stepThreeReveal,
        position: 'absolute', left: 0, top: 430, width: 1280,
        transform: `translateY(${(1 - stepThreeReveal) * 14}px)`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', padding: '18px 28px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(232,220,193,0.07)',
            borderRadius: 14,
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 38, color: 'var(--chalk-100)', lineHeight: 1.3,
          }}>
            <span style={{ color: 'var(--teal-400)' }}>v</span>
            <sup style={{ fontSize: 24 }}>′</sup>
            <span style={{ margin: '0 10px' }}>=</span>
            <span>−</span>
            <span style={{ color: 'var(--violet-400)' }}>p</span>
            <span style={{ color: 'var(--teal-400)', margin: '0 4px' }}>v</span>
            <span style={{ margin: '0 4px' }}>−</span>
            <span style={{ color: 'var(--amber-400)' }}>q</span>
            <span style={{ color: 'var(--chalk-100)', margin: '0 2px' }}>y</span>
          </span>
        </div>
      </div>

      <div style={{
        position: 'absolute', left: 0, top: 562, width: 1280,
        textAlign: 'center',
      }}>
        <FadeUp duration={0.5} delay={6.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 19, color: 'var(--chalk-300)',
            maxWidth: 720, margin: '0 auto', lineHeight: 1.4,
          }}>
          y′ becomes v. y″ becomes v′. The original equation is now a rule for v′.
        </FadeUp>
      </div>
    </>
  );
}

// ─── Beat 4: Matrix form + phase-plane glimpse ────────────────────────────
function MatrixFormBeat() {
  const { localTime } = useSprite();

  // Phase plane trace: integrate (y, v)' = A (y, v) with y(0)=1, v(0)=0.
  // Mild damping → inward spiral toward origin.
  const tracePts = (() => {
    const pts = [];
    let y = 1.2, v = 0;
    const dt = 0.05;
    const N = 280;
    // Centre of small phase panel on stage at (760, 380), 60 px per unit.
    const PX = 880, PY = 400, U = 80;
    pts.push({ sx: PX + y * U, sy: PY - v * U });
    for (let i = 0; i < N; i++) {
      const dy = v;
      const dv = -Q_COEF * y - P_COEF * v;
      y = y + dt * dy;
      v = v + dt * dv;
      pts.push({ sx: PX + y * U, sy: PY - v * U });
    }
    return pts;
  })();

  const traceReveal = clamp((localTime - 3.0) / 4.0, 0, 1);
  const visTraceCount = Math.floor(tracePts.length * traceReveal);
  const tracePath = tracePts.slice(0, Math.max(2, visTraceCount))
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');

  return (
    <>
      <div style={{
        position: 'absolute', left: 80, top: 150, width: 720,
      }}>
        <FadeUp duration={0.45} delay={0.0} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
          stack into a system
        </FadeUp>

        <FadeUp duration={0.6} delay={0.5} distance={14}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 32, color: 'var(--chalk-100)', lineHeight: 1.4,
            marginTop: 8,
          }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
            {/* State vector */}
            <BracketMatrix
              rows={[
                [<span style={{ color: 'var(--violet-400)' }}>y</span>],
                [<span style={{ color: 'var(--teal-400)' }}>v</span>],
              ]}
              size={28}
            />
            <span>′ &nbsp;=&nbsp;</span>
            <BracketMatrix
              rows={[
                ['0', '1'],
                [<span style={{ color: 'var(--amber-400)' }}>−q</span>,
                 <span style={{ color: 'var(--violet-400)' }}>−p</span>],
              ]}
              size={26}
            />
            <BracketMatrix
              rows={[
                [<span style={{ color: 'var(--violet-400)' }}>y</span>],
                [<span style={{ color: 'var(--teal-400)' }}>v</span>],
              ]}
              size={28}
            />
          </span>
        </FadeUp>

        <FadeUp duration={0.5} delay={2.4} distance={10}
          style={{
            marginTop: 24,
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-200)', lineHeight: 1.45,
          }}>
          A first-order vector equation. <br/>
          <span style={{ color: 'var(--amber-400)' }}>A</span> is the companion matrix.
        </FadeUp>

        <FadeUp duration={0.5} delay={4.6} distance={10}
          style={{
            marginTop: 18,
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--chalk-300)', letterSpacing: '0.06em',
          }}>
          eigen-analysis of A → solution structure
        </FadeUp>
      </div>

      {/* Phase-plane glimpse on the right */}
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={1280} height={720} viewBox="0 0 1280 720">
        {/* Mini phase axes */}
        <line x1={720} y1={400} x2={1040} y2={400}
              stroke="var(--chalk-200)" strokeWidth={1.5} strokeLinecap="round" opacity={0.6}/>
        <line x1={880} y1={240} x2={880} y2={560}
              stroke="var(--chalk-200)" strokeWidth={1.5} strokeLinecap="round" opacity={0.6}/>
        <text x={1048} y={406} fill="var(--violet-400)"
              fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>y</text>
        <text x={874} y={234} fill="var(--teal-400)"
              fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>v</text>

        {/* Spiral trace */}
        {visTraceCount > 1 && (
          <path d={tracePath} fill="none" stroke="var(--amber-400)"
                strokeWidth={2.4} strokeLinecap="round" opacity={0.95}/>
        )}
        {visTraceCount > 1 && (() => {
          const last = tracePts[Math.min(visTraceCount, tracePts.length - 1)];
          return (
            <circle cx={last.sx} cy={last.sy} r={5}
                    fill="var(--amber-400)" stroke="var(--chalk-100)" strokeWidth={0.8}/>
          );
        })()}

        {/* Label */}
        <text x={880} y={210} fill="var(--chalk-200)"
              fontFamily="var(--font-mono)" fontSize={12}
              letterSpacing="0.16em" textAnchor="middle"
              style={{ textTransform: 'uppercase' }}>
          phase plane (y, v)
        </text>
      </svg>
    </>
  );
}

// Bracketed matrix component for inline display.
function BracketMatrix({ rows, size = 22 }) {
  const cols = rows[0].length;
  const isColumnVec = cols === 1;
  return (
    <span style={{
      position: 'relative', display: 'inline-block',
      padding: `${isColumnVec ? 6 : 8}px ${isColumnVec ? 14 : 18}px`,
      fontFamily: 'var(--font-serif)', fontStyle: 'italic',
      fontSize: size, color: 'var(--chalk-100)', lineHeight: 1.25,
    }}>
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 8,
        borderLeft: '2px solid var(--chalk-200)',
        borderTop: '2px solid var(--chalk-200)',
        borderBottom: '2px solid var(--chalk-200)',
      }}/>
      <span style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 8,
        borderRight: '2px solid var(--chalk-200)',
        borderTop: '2px solid var(--chalk-200)',
        borderBottom: '2px solid var(--chalk-200)',
      }}/>
      <span style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(${isColumnVec ? 28 : 36}px, auto))`,
        columnGap: isColumnVec ? 0 : 18, rowGap: 4,
        textAlign: 'center',
      }}>
        {rows.flatMap((r, ri) => r.map((cell, ci) => (
          <span key={`${ri}-${ci}`}>{cell}</span>
        )))}
      </span>
    </span>
  );
}

// ─── Beat 5: Hero outro ───────────────────────────────────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      maxWidth: 1040, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>companion form</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 50, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        An order-<span style={{ color: 'var(--amber-300)' }}>n</span> scalar equation <br/>
        becomes an order-one system in <span style={{ color: 'var(--amber-300)' }}>n</span> unknowns.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--chalk-200)',
          maxWidth: '40ch', lineHeight: 1.3,
        }}>
        Same dynamics — friendlier toolbox.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        euler · rk4 · eigenvectors · phase plane — all unlocked
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
