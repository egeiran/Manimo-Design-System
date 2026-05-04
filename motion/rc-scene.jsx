// RC-circuit lesson — example Manimo scene.
// 20-second teaching sequence that introduces τ = RC.
//
// Beats:
//   0.0– 3.0   Manimo enters, scene title writes on
//   3.2– 6.5   Circuit diagram traces in
//   6.5–10.5   Question appears below circuit
//  10.8–11.4   Circuit wipes off (chalk wipe, last 0.6s of its sprite)
//  11.5–20.0   Charging curve traces, axis labels, τ marker, formula reveal at 16.5

const { useState, useEffect } = React;

const SCENE_DURATION = 20;

function Scene() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'radial-gradient(ellipse at 50% 60%, rgba(244,184,96,0.05), transparent 60%), #0c0a1f',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      <Background/>
      <Watermark/>

      {/* Beat 1: Manimo enters with greeting */}
      <Sprite start={0.2} end={3.2}>
        <ManimoBubbleIntro/>
      </Sprite>

      {/* Beat 1.5: Title */}
      <Sprite start={1.0} end={20}>
        <SceneTitle/>
      </Sprite>

      {/* Beat 2: Circuit diagram (3.2–11.4) — wipes off in the last 0.6s, fully clear before graph appears */}
      <Sprite start={3.2} end={11.4}>
        <CircuitChalkWipeWrapper>
          <CircuitDiagram/>
        </CircuitChalkWipeWrapper>
      </Sprite>

      {/* Beat 3: Question (6.5–10.5) — also wipes off */}
      <Sprite start={6.5} end={10.5}>
        <Question/>
      </Sprite>

      {/* Beat 4: Graph + curve — starts after the circuit has fully wiped */}
      <Sprite start={11.5} end={20}>
        <ChargingGraph/>
      </Sprite>

      {/* Beat 5: τ = RC formula */}
      <Sprite start={16.5} end={20}>
        <FormulaReveal/>
      </Sprite>

      {/* Persistent Manimo, lower-left */}
      <Sprite start={2.2} end={20}>
        <ManimoCorner/>
      </Sprite>
    </div>
  );
}

// ─── Background grid ──────────────────────────────────────────────────────
function Background() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(232,220,193,0.04)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)"/>
    </svg>
  );
}

function Watermark() {
  return (
    <div style={{
      position: 'absolute', top: 24, right: 32,
      fontFamily: 'var(--font-serif)', fontSize: 18, fontStyle: 'italic',
      color: 'rgba(232,220,193,0.4)',
    }}>
      Manimo
    </div>
  );
}

// ─── Beat 1: Manimo entrance with speech bubble ──────────────────────────
function ManimoBubbleIntro() {
  const { localTime, duration } = useSprite();

  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '38%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <svg width="180" height="180" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <ManimoEnter duration={0.7} bob={true}/>
      </svg>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 26,
          fontStyle: 'italic',
          color: 'var(--chalk-100)',
        }}>
        La oss tegne en krets.
      </FadeUp>
    </div>
  );
}

// ─── Persistent Manimo in corner ──────────────────────────────────────────
function ManimoCorner() {
  return (
    <div style={{ position: 'absolute', left: 24, bottom: 16, width: 110, height: 110 }}>
      <svg width="110" height="110" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <Manimo bob={true} bobAmplitude={3} bobSpeed={2.2}/>
      </svg>
    </div>
  );
}

// ─── Scene title ──────────────────────────────────────────────────────────
function SceneTitle() {
  return (
    <div style={{
      position: 'absolute', top: 32, left: 32,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
          textTransform: 'uppercase', letterSpacing: '0.16em',
        }}>
        Scene 1 · introduksjon
      </FadeUp>
      <FadeUp duration={0.5} delay={0.2} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--chalk-100)',
          fontWeight: 500,
        }}>
        Lading av en kondensator
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Circuit diagram ──────────────────────────────────────────────
// The wrapper handles the chalk-wipe out at the end of its sprite life.
function CircuitChalkWipeWrapper({ children }) {
  const { localTime, duration } = useSprite();
  // Wipe over the last 0.6s of the sprite
  const wipeStart = duration - 0.6;
  const t = clamp((localTime - wipeStart) / 0.6, 0, 1);
  const eased = Easing.easeInQuad(t);
  return (
    <div style={{
      width: '100%', height: '100%',
      clipPath: `inset(0 0 0 ${eased * 100}%)`,
      WebkitClipPath: `inset(0 0 0 ${eased * 100}%)`,
    }}>
      {children}
    </div>
  );
}
// Layout (in 600×260 local SVG coords):
//   battery on the left (vertical, two parallel lines)
//   wire goes up, right across the top, down through R, then C, back to battery
function CircuitDiagram() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width="600" height="280" viewBox="0 0 600 280" style={{ overflow: 'visible' }}>
        {/* Battery (left) — labels appear with the symbol */}
        <Sprite start={0} end={20} keepMounted>
          <TraceIn d="M 80 100 L 80 60 L 80 60" stroke="var(--amber-400)" strokeWidth={2.5} duration={0.4} delay={0}/>
          <TraceIn d="M 60 60 L 100 60" stroke="var(--amber-400)" strokeWidth={4} duration={0.25} delay={0.4}/>
          <TraceIn d="M 70 50 L 90 50" stroke="var(--amber-400)" strokeWidth={2.5} duration={0.2} delay={0.55}/>
          <TraceIn d="M 80 50 L 80 30" stroke="var(--amber-400)" strokeWidth={2.5} duration={0.25} delay={0.7}/>
        </Sprite>

        {/* Top wire */}
        <Sprite start={0} end={20} keepMounted>
          <TraceIn d="M 80 30 L 360 30" stroke="var(--amber-400)" strokeWidth={2.5} duration={0.7} delay={1.0}/>
        </Sprite>

        {/* Switch (open at first, closes later) */}
        <Sprite start={0} end={20} keepMounted>
          <SwitchSymbol/>
        </Sprite>

        {/* Wire continues right and down to resistor */}
        <Sprite start={0} end={20} keepMounted>
          <TraceIn d="M 410 30 L 480 30 L 480 80" stroke="var(--amber-400)" strokeWidth={2.5} duration={0.5} delay={2.0}/>
        </Sprite>

        {/* Resistor (zigzag) */}
        <Sprite start={0} end={20} keepMounted>
          <TraceIn
            d="M 480 80 L 470 88 L 490 100 L 470 112 L 490 124 L 470 136 L 490 148 L 480 156"
            stroke="var(--amber-400)" strokeWidth={2.5} duration={0.6} delay={2.5}/>
          <SvgFadeIn duration={0.3} delay={3.0}>
            <text x="510" y="120" fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize="22">R</text>
          </SvgFadeIn>
        </Sprite>

        {/* Down to capacitor */}
        <Sprite start={0} end={20} keepMounted>
          <TraceIn d="M 480 156 L 480 200" stroke="var(--amber-400)" strokeWidth={2.5} duration={0.3} delay={3.1}/>
        </Sprite>

        {/* Capacitor (two parallel plates) */}
        <Sprite start={0} end={20} keepMounted>
          <TraceIn d="M 460 200 L 500 200" stroke="var(--amber-400)" strokeWidth={3} duration={0.25} delay={3.4}/>
          <TraceIn d="M 460 215 L 500 215" stroke="var(--amber-400)" strokeWidth={3} duration={0.25} delay={3.55}/>
          <SvgFadeIn duration={0.3} delay={3.8}>
            <text x="510" y="212" fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize="22">C</text>
          </SvgFadeIn>
        </Sprite>

        {/* Bottom wire back to battery */}
        <Sprite start={0} end={20} keepMounted>
          <TraceIn d="M 480 215 L 480 250 L 80 250 L 80 100"
                   stroke="var(--amber-400)" strokeWidth={2.5} duration={0.9} delay={3.9}/>
        </Sprite>

        {/* Battery label */}
        <Sprite start={0} end={20} keepMounted>
          <SvgFadeIn duration={0.3} delay={1.0}>
            <text x="30" y="60" fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize="22">V₀</text>
          </SvgFadeIn>
        </Sprite>
      </svg>
    </div>
  );
}

// Switch symbol that closes at sprite-local 4.0s
function SwitchSymbol() {
  const { localTime } = useSprite();

  // Trace in the closed-state pivot dot first, then the lever in open position.
  const drewIn = clamp((localTime - 1.4) / 0.5, 0, 1);

  // Closing animation begins at localTime = 4.0
  const closeT = clamp((localTime - 4.0) / 0.6, 0, 1);
  const closeEased = Easing.easeOutBack(closeT);
  // Lever rotates from -28deg (open) to 0deg (closed) around the pivot at (360, 30)
  const angle = -28 * (1 - closeEased);

  return (
    <g style={{ opacity: drewIn }}>
      {/* Pivot dot */}
      <circle cx="360" cy="30" r="3" fill="var(--amber-400)"/>
      {/* Contact dot at the right */}
      <circle cx="410" cy="30" r="3" fill="var(--amber-400)"/>
      {/* Lever */}
      <line
        x1="360" y1="30"
        x2={360 + 50 * Math.cos(angle * Math.PI / 180)}
        y2={30 + 50 * Math.sin(angle * Math.PI / 180)}
        stroke="var(--amber-400)" strokeWidth="2.5" strokeLinecap="round"
      />
    </g>
  );
}

// ─── Beat 3: The question ────────────────────────────────────────────────
function Question() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', bottom: 64,
      transform: 'translateX(-50%)',
      textAlign: 'center',
    }}>
      <FadeUp duration={0.5} delay={0.2} distance={10}
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28, fontStyle: 'italic',
          color: 'var(--chalk-100)',
          textWrap: 'pretty',
          maxWidth: '60ch',
        }}>
        Når du lukker bryteren — hvor raskt fylles kondensatoren?
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Charging curve ──────────────────────────────────────────────
function ChargingGraph() {
  // Graph bounds (in screen px relative to a 520×320 box)
  const W = 520, H = 320;
  const padL = 60, padR = 30, padT = 30, padB = 50;
  const ax = padL, ay = H - padB;
  const aw = W - padL - padR, ah = H - padT - padB;

  // V0 line (dashed) at top
  const v0Y = padT + 20;
  // 63% line — matches the (1 - 1/e) point of the curve
  const sixtyThreeY = v0Y + (ay - v0Y) * (1 - 0.632);
  // Time constant τ position along x.
  // The curve uses v = 1 - exp(-t * 4) over t ∈ [0,1], so it reaches 63% at t = 0.25.
  // → τ sits at exactly 25% of the graph width, where the curve crosses sixtyThreeY.
  const tauX = ax + aw * 0.25;

  // RC charging curve sample
  const points = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const x = ax + t * aw;
    const v = 1 - Math.exp(-t * 4); // 4 time-constants across the graph
    const y = ay - v * (ay - v0Y);
    points.push([x, y]);
  }
  const curveD = points.reduce((acc, [x, y], i) =>
    acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`), '');

  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        {/* Axes */}
        <Sprite start={0} end={10} keepMounted>
          <TraceIn d={`M ${ax} ${padT} L ${ax} ${ay} L ${W - padR} ${ay}`}
                   stroke="rgba(232,220,193,0.4)" strokeWidth={1.5} duration={0.6} delay={0}/>
        </Sprite>

        {/* Axis labels */}
        <Sprite start={0} end={10} keepMounted>
          <SvgFadeIn duration={0.4} delay={0.6}>
            <text x={ax - 16} y={padT + 6} fill="var(--chalk-300)"
                  fontFamily="var(--font-serif)" fontStyle="italic" fontSize="16">V</text>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.6}>
            <text x={W - padR + 4} y={ay + 4} fill="var(--chalk-300)"
                  fontFamily="var(--font-serif)" fontStyle="italic" fontSize="16">t</text>
          </SvgFadeIn>
        </Sprite>

        {/* V0 dashed line */}
        <Sprite start={0} end={10} keepMounted>
          <TraceIn d={`M ${ax} ${v0Y} L ${W - padR} ${v0Y}`}
                   stroke="rgba(232,220,193,0.3)" strokeWidth={1} duration={0.5} delay={0.9}
                   strokeDasharray="4 4"/>
          <SvgFadeIn duration={0.3} delay={1.2}>
            <text x={ax - 30} y={v0Y + 5} fill="var(--chalk-200)"
                  fontFamily="var(--font-serif)" fontStyle="italic" fontSize="16">V₀</text>
          </SvgFadeIn>
        </Sprite>

        {/* The curve — main draw */}
        <Sprite start={0} end={10} keepMounted>
          <TraceIn d={curveD}
                   stroke="var(--amber-400)" strokeWidth={3.5}
                   duration={2.4} delay={1.5} ease={Easing.easeOutCubic}
                   pathLength={1000}/>
        </Sprite>

        {/* 63% horizontal indicator */}
        <Sprite start={0} end={10} keepMounted>
          <TraceIn d={`M ${ax} ${sixtyThreeY} L ${tauX} ${sixtyThreeY}`}
                   stroke="var(--rose-400)" strokeWidth={1.2} duration={0.4} delay={4.2}
                   strokeDasharray="3 3"/>
          <TraceIn d={`M ${tauX} ${sixtyThreeY} L ${tauX} ${ay}`}
                   stroke="var(--rose-400)" strokeWidth={1.2} duration={0.4} delay={4.5}
                   strokeDasharray="3 3"/>
          <SvgFadeIn duration={0.3} delay={4.8}>
            <text x={ax - 36} y={sixtyThreeY + 5} fill="var(--rose-300)"
                  fontFamily="var(--font-mono)" fontSize="13">.63</text>
          </SvgFadeIn>
          <SvgFadeIn duration={0.3} delay={4.9}>
            <text x={tauX - 4} y={ay + 22} fill="var(--rose-300)"
                  fontFamily="var(--font-serif)" fontStyle="italic" fontSize="18">τ</text>
          </SvgFadeIn>
          <PulseMark cx={tauX} cy={sixtyThreeY} color="var(--rose-400)"
                     radius={4} pulseRadius={22} duration={1.0} delay={4.6}/>
        </Sprite>
      </svg>
    </div>
  );
}

// ─── Beat 5: Formula reveal ──────────────────────────────────────────────
function FormulaReveal() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: 90,
      transform: 'translateX(-50%)',
      textAlign: 'center',
    }}>
      <FadeUp duration={0.5} delay={0} distance={14}
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 56,
          color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        τ = RC
      </FadeUp>
      <FadeUp duration={0.5} delay={0.6} distance={8}
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--chalk-300)',
          letterSpacing: '0.02em',
        }}>
        tidskonstanten — produktet av motstand og kapasitans
      </FadeUp>
    </div>
  );
}

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f">
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
