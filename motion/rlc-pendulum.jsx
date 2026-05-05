// RLC and Pendulum: Same Math, Different Physics — Manimo lesson scene.
// Generated from motion/rlc-pendulum.spec.json.
//
// The pedagogical core: a damped pendulum and an RLC circuit obey the same
// second-order linear ODE. q↔x, I↔v, L↔m, 1/C↔k, R↔b. Once a student sees
// the structural mapping, the two systems become one.
//
// Beats (timed to single-track narration in motion/audio/rlc-pendulum/):
//    0.00– 4.90  Manimo enters; hook question
//    4.90–12.75  Side-by-side oscillation: pendulum + LC tank in same rhythm
//   12.75–21.40  Mapping table: x↔q, v↔I, m↔L, k↔1/C
//   21.40–34.13  The two equations side by side; ω₀ payoffs
//   34.13–41.69  Add R / friction; amplitude decays exponentially
//   41.69–48.00  Takeaway

const SCENE_DURATION = 48;
const NARRATION_AUDIO = 'audio/rlc-pendulum/scene.mp3';

// Source of truth for TTS / subtitles (mirrors spec narration). NARRATION.length
// must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /*  0.00– 4.90 */ 'A swinging weight and a flowing current — could they really obey the same rule?',
  /*  4.90–12.75 */ 'The pendulum swings back and forth, and the current in the circuit sloshes between coil and capacitor in exactly the same rhythm.',
  /* 12.75–21.40 */ 'Position becomes charge, velocity becomes current, mass becomes inductance, and spring stiffness becomes one over capacitance.',
  /* 21.40–34.13 */ 'Both systems obey the same second-order differential equation. The natural frequency for the pendulum is the square root of k over m, and for the circuit, one over the square root of L times C.',
  /* 34.13–41.69 */ 'Add resistance to the circuit or friction to the pendulum — both decay, and the amplitude falls exponentially toward zero.',
  /* 41.69–48.00 */ 'Same math, different physics. Once you understand one, you understand the other.',
];

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene 6 · analogy"
      title="RLC and Pendulum: Same Math, Different Physics"
      duration={SCENE_DURATION}
      // SceneChrome's JourneyManimo handles the intro.
      introEnd={4.9}
      introCaption="A swinging weight, a flowing current — same rule?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.9} end={12.75}>
        <SideBySide />
      </Sprite>

      <Sprite start={12.75} end={21.4}>
        <MappingTable />
      </Sprite>

      <Sprite start={21.4} end={34.13}>
        <EquationReveal />
      </Sprite>

      <Sprite start={34.13} end={41.69}>
        <DampingAdded />
      </Sprite>

      <Sprite start={41.69} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Side-by-side oscillation ─────────────────────────────────────
// Two systems, same period. The pendulum on the left swings via SHM. The
// LC tank on the right has charge q(t) = Q · cos(2π t/T) on its top plate
// and the matching opposite charge on the bottom. Plate "fill" intensity
// renders the instantaneous |q|, and arrows on the top/bottom wires
// indicate current direction (current = -dq/dt). Sharing one period makes
// the rhythmic equivalence visceral.
function SideBySide() {
  const portrait = usePortrait();
  const PERIOD = 2.4;
  const { localTime } = useSprite();
  // Phase aligned so both systems "release" near localTime ≈ 0.5.
  const phaseT = Math.max(0, localTime - 0.5);
  const cyc = Math.cos(2 * Math.PI * phaseT / PERIOD); // q(t) / Q, also θ/θmax
  // Current direction sign: I = -dq/dt ∝ sin(2π t/T)
  const cur = Math.sin(2 * Math.PI * phaseT / PERIOD);

  if (portrait) {
    // Stacked: pendulum on top, LC tank below, separator between.
    return (
      <div style={{
        position: 'absolute', left: '50%', top: '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={660} height={980} viewBox="0 0 660 980" style={{ overflow: 'visible' }}>
          {/* Top half: pendulum */}
          <SvgFadeIn duration={0.4} delay={0.3}>
            <text x={330} y={32} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize="12"
                  letterSpacing="0.16em">MECHANICAL</text>
          </SvgFadeIn>

          <SvgFadeIn duration={0.5} delay={0.5}>
            <SwingingPendulum
              pivX={330} pivY={70} L={210}
              maxAngle={22} period={PERIOD}
              bobR={22} color="var(--amber-400)"
              delay={0.5}
            />
          </SvgFadeIn>

          {/* Horizontal separator */}
          <SvgFadeIn duration={0.4} delay={0.5}>
            <line x1={80} y1={400} x2={580} y2={400}
                  stroke="var(--chalk-300)" strokeWidth={1}
                  strokeDasharray="3 6" opacity={0.4}/>
          </SvgFadeIn>

          {/* Bottom half: LC tank */}
          <SvgFadeIn duration={0.4} delay={0.3}>
            <text x={330} y={446} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize="12"
                  letterSpacing="0.16em">ELECTRICAL</text>
          </SvgFadeIn>

          <SvgFadeIn duration={0.5} delay={0.8}>
            <LCTankCircuit cx={330} cy={620} chargeFrac={cyc} currentDir={cur} animateCharge={true}/>
          </SvgFadeIn>

          {/* Caption beneath */}
          <SvgFadeIn duration={0.4} delay={4.5}>
            <text x={330} y={950} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                  fontSize="14" letterSpacing="0.02em">
              same rhythm, totally different systems
            </text>
          </SvgFadeIn>
        </svg>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={1100} height={420} viewBox="0 0 1100 420" style={{ overflow: 'visible' }}>
        {/* ── Left column: pendulum ─────────────────────────────────────── */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <text x={260} y={36} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize="12"
                letterSpacing="0.16em">MECHANICAL</text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={0.5}>
          <SwingingPendulum
            pivX={260} pivY={70} L={220}
            maxAngle={22} period={PERIOD}
            bobR={20} color="var(--amber-400)"
            delay={0.5}
          />
        </SvgFadeIn>

        {/* Vertical separator */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={550} y1={60} x2={550} y2={360}
                stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="3 6" opacity={0.4}/>
        </SvgFadeIn>

        {/* ── Right column: LC tank ─────────────────────────────────────── */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <text x={830} y={36} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize="12"
                letterSpacing="0.16em">ELECTRICAL</text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={0.8}>
          <LCTankCircuit cx={830} cy={210} chargeFrac={cyc} currentDir={cur} animateCharge={true}/>
        </SvgFadeIn>

        {/* Caption beneath */}
        <SvgFadeIn duration={0.4} delay={4.5}>
          <text x={550} y={400} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize="14" letterSpacing="0.02em">
            same rhythm, totally different systems
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// LC tank renderer — capacitor (top) wired to inductor coil (bottom) in a
// closed loop. `chargeFrac` ∈ [-1, 1]: +1 means top plate fully positive,
// -1 means bottom plate fully positive. `currentDir` ∈ [-1, 1]: sign of
// instantaneous current; arrow direction flips with sign.
function LCTankCircuit({ cx, cy, chargeFrac = 0, currentDir = 0, animateCharge = false }) {
  // Local geometry (centered on cx, cy)
  const W = 240, H = 280;
  const x0 = cx - W / 2, y0 = cy - H / 2;
  // Capacitor plates (top of loop)
  const plateY1 = y0 + 30, plateY2 = y0 + 60;
  const plateX1 = cx - 50, plateX2 = cx + 50;
  // Inductor coil (bottom of loop) — drawn as 4 humps
  const coilY = y0 + H - 40;
  const coilX1 = cx - 60, coilX2 = cx + 60;

  // Charge fill opacity per plate
  const topPos = clamp(chargeFrac, 0, 1);     // top plate +
  const topNeg = clamp(-chargeFrac, 0, 1);    // top plate -

  // Inductor coil path: one continuous Bezier with 4 humps
  const humpW = (coilX2 - coilX1) / 4;
  let coilD = `M ${coilX1} ${coilY}`;
  for (let i = 0; i < 4; i++) {
    const x1 = coilX1 + i * humpW;
    const x2 = x1 + humpW;
    coilD += ` C ${x1 + humpW * 0.2} ${coilY - 22}, ${x2 - humpW * 0.2} ${coilY - 22}, ${x2} ${coilY}`;
  }

  return (
    <g>
      {/* Loop wires — left vertical */}
      <path d={`M ${plateX1} ${plateY1} L ${cx - 100} ${plateY1} L ${cx - 100} ${coilY} L ${coilX1} ${coilY}`}
            fill="none" stroke="var(--amber-400)" strokeWidth={2.5}/>
      {/* Loop wires — right vertical */}
      <path d={`M ${plateX2} ${plateY1} L ${cx + 100} ${plateY1} L ${cx + 100} ${coilY} L ${coilX2} ${coilY}`}
            fill="none" stroke="var(--amber-400)" strokeWidth={2.5}/>

      {/* Capacitor plates */}
      <line x1={plateX1} y1={plateY1} x2={plateX2} y2={plateY1}
            stroke="var(--amber-400)" strokeWidth={3.5}/>
      <line x1={plateX1} y1={plateY2} x2={plateX2} y2={plateY2}
            stroke="var(--amber-400)" strokeWidth={3.5}/>

      {/* Charge fill — top plate (+ when chargeFrac > 0) */}
      {animateCharge && (
        <g>
          <rect x={plateX1 + 4} y={plateY1 - 10} width={plateX2 - plateX1 - 8} height={8}
                fill="var(--rose-400)" opacity={topPos * 0.8}/>
          <rect x={plateX1 + 4} y={plateY2 + 2} width={plateX2 - plateX1 - 8} height={8}
                fill="var(--rose-400)" opacity={topNeg * 0.8}/>
          {topPos > 0.05 && (
            <g opacity={topPos}>
              {[-30, -10, 10, 30].map((dx, i) => (
                <text key={i} x={cx + dx} y={plateY1 - 14} textAnchor="middle"
                      fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize="14">+</text>
              ))}
            </g>
          )}
          {topNeg > 0.05 && (
            <g opacity={topNeg}>
              {[-30, -10, 10, 30].map((dx, i) => (
                <text key={i} x={cx + dx} y={plateY2 + 22} textAnchor="middle"
                      fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize="14">+</text>
              ))}
            </g>
          )}
        </g>
      )}

      {/* Capacitor label */}
      <text x={plateX2 + 14} y={plateY1 + 22} fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize="22">C</text>

      {/* Inductor coil */}
      <path d={coilD} fill="none" stroke="var(--amber-400)" strokeWidth={2.5} strokeLinecap="round"/>
      <text x={coilX2 + 14} y={coilY - 4} fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize="22">L</text>

      {/* Current direction arrow on the right wire — sign tracks currentDir */}
      {animateCharge && Math.abs(currentDir) > 0.08 && (
        <g opacity={Math.min(1, Math.abs(currentDir) * 1.4)}>
          {(() => {
            const ay = (plateY1 + coilY) / 2;
            const ax = cx + 100;
            // currentDir > 0 → flow goes downward on right wire
            const dy = currentDir > 0 ? 1 : -1;
            return (
              <g>
                <line x1={ax} y1={ay - 12 * dy} x2={ax} y2={ay + 12 * dy}
                      stroke="var(--rose-400)" strokeWidth={2.5}/>
                <path d={`M ${ax} ${ay + 12 * dy}
                          L ${ax - 5} ${ay + 12 * dy - 8 * dy}
                          L ${ax + 5} ${ay + 12 * dy - 8 * dy} Z`}
                      fill="var(--rose-400)"/>
                <text x={ax + 12} y={ay + 4} fill="var(--rose-300)"
                      fontFamily="var(--font-serif)" fontStyle="italic" fontSize="18">I</text>
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
}

// ─── Beat 3: Mapping table ────────────────────────────────────────────────
// Two columns, four rows. Rows fade in as the narration mentions them, with
// timing aligned to spoken cues (~1.7s spacing).
function MappingTable() {
  const portrait = usePortrait();
  const ROW_GAP = portrait ? 90 : 80;
  const ROW_Y0 = 110;
  const rows = [
    { delay: 0.4, mech: 'x',  elec: 'q',    mechCap: 'position',  elecCap: 'charge',      accent: false },
    { delay: 1.7, mech: 'v',  elec: 'I',    mechCap: 'velocity',  elecCap: 'current',     accent: false },
    { delay: 3.4, mech: 'm',  elec: 'L',    mechCap: 'inertia',   elecCap: 'inductance',  accent: true  },
    { delay: 5.4, mech: 'k',  elec: '1/C',  mechCap: 'stiffness', elecCap: 'capacitance', accent: true  },
  ];

  // Portrait shrinks the column spacing so the table fits a 720-wide canvas.
  const COL_X_LEFT  = portrait ? 160 : 280;
  const COL_X_MID   = portrait ? 320 : 480;
  const COL_X_RIGHT = portrait ? 480 : 680;
  const VB_W = portrait ? 640 : 960;
  const VB_H = portrait ? 540 : 520;
  const headerLine = portrait ? { x1: 80, x2: 560 } : { x1: 140, x2: 820 };
  const symFont = portrait ? 38 : 42;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={VB_W} height={VB_H} viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ overflow: 'visible' }}>
        {/* Headers */}
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={COL_X_LEFT} y={50} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={portrait ? 12 : 13}
                letterSpacing="0.18em">MECHANICAL</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={COL_X_RIGHT} y={50} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={portrait ? 12 : 13}
                letterSpacing="0.18em">ELECTRICAL</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.1}>
          <line x1={headerLine.x1} y1={70} x2={headerLine.x2} y2={70}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.4}/>
        </SvgFadeIn>

        {/* Rows */}
        {rows.map((r, i) => {
          const y = ROW_Y0 + i * ROW_GAP;
          const symColor = r.accent ? 'var(--amber-300)' : 'var(--chalk-100)';
          return (
            <g key={i}>
              <SvgFadeIn duration={0.4} delay={r.delay}>
                <text x={COL_X_LEFT} y={y} textAnchor="middle"
                      fill={symColor} fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={symFont}>{r.mech}</text>
              </SvgFadeIn>
              <SvgFadeIn duration={0.4} delay={r.delay + 0.15}>
                <text x={COL_X_MID} y={y} textAnchor="middle"
                      fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                      fontSize={portrait ? 28 : 32}>↔</text>
              </SvgFadeIn>
              <SvgFadeIn duration={0.4} delay={r.delay + 0.3}>
                <text x={COL_X_RIGHT} y={y} textAnchor="middle"
                      fill={symColor} fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={symFont}>{r.elec}</text>
              </SvgFadeIn>
              {/* Captions below symbols */}
              <SvgFadeIn duration={0.4} delay={r.delay + 0.4}>
                <text x={COL_X_LEFT} y={y + 22} textAnchor="middle"
                      fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                      fontSize="13">{r.mechCap}</text>
              </SvgFadeIn>
              <SvgFadeIn duration={0.4} delay={r.delay + 0.4}>
                <text x={COL_X_RIGHT} y={y + 22} textAnchor="middle"
                      fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                      fontSize="13">{r.elecCap}</text>
              </SvgFadeIn>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Beat 4: Equation reveal ──────────────────────────────────────────────
// Two ODEs side by side, then a unified caption, then the two ω₀ payoffs.
function EquationReveal() {
  const portrait = usePortrait();
  // Portrait stacks the two ODEs (and the two ω₀ payoffs) vertically; each
  // gets a small "MECH" / "ELEC" label so the column identity isn't lost.
  if (portrait) {
    return (
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        width: 660, textAlign: 'center',
      }}>
        <FadeUp duration={0.4} delay={0.1} distance={6}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                   color: 'var(--chalk-300)', letterSpacing: '0.18em' }}>
          MECHANICAL
        </FadeUp>
        <FadeUp duration={0.5} delay={0.3} distance={12}
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                   fontSize: 26, color: 'var(--chalk-100)', letterSpacing: '0.02em' }}>
          m·d²x/dt² + b·dx/dt + k·x = 0
        </FadeUp>

        <FadeUp duration={0.4} delay={1.4} distance={6}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                   color: 'var(--chalk-300)', letterSpacing: '0.18em', marginTop: 8 }}>
          ELECTRICAL
        </FadeUp>
        <FadeUp duration={0.5} delay={1.6} distance={12}
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                   fontSize: 26, color: 'var(--chalk-100)', letterSpacing: '0.02em' }}>
          L·d²q/dt² + R·dq/dt + (1/C)·q = 0
        </FadeUp>

        <FadeUp duration={0.5} delay={3.4} distance={10}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                   color: 'var(--chalk-300)', letterSpacing: '0.02em',
                   marginTop: 6, maxWidth: '28ch' }}>
          same structure — only the letters differ
        </FadeUp>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 18, marginTop: 14 }}>
          <FadeUp duration={0.6} delay={5.6} distance={14}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 44, color: 'var(--amber-300)', letterSpacing: '0.02em' }}>
            ω₀ = √(k/m)
          </FadeUp>
          <FadeUp duration={0.6} delay={7.4} distance={14}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 44, color: 'var(--amber-300)', letterSpacing: '0.02em' }}>
            ω₀ = 1/√(LC)
          </FadeUp>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
      width: 1140,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        width: '100%', gap: 40,
      }}>
        <FadeUp duration={0.5} delay={0.3} distance={12}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 32, color: 'var(--chalk-100)', letterSpacing: '0.02em',
            textAlign: 'center',
          }}>
          m·d²x/dt² + b·dx/dt + k·x = 0
        </FadeUp>
        <FadeUp duration={0.5} delay={1.6} distance={12}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 32, color: 'var(--chalk-100)', letterSpacing: '0.02em',
            textAlign: 'center',
          }}>
          L·d²q/dt² + R·dq/dt + (1/C)·q = 0
        </FadeUp>
      </div>

      <FadeUp duration={0.5} delay={3.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--chalk-300)',
          letterSpacing: '0.02em',
        }}>
        same structure — only the letters differ
      </FadeUp>

      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        width: '100%', gap: 40, marginTop: 16,
      }}>
        <FadeUp duration={0.6} delay={5.6} distance={14}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 52, color: 'var(--amber-300)', letterSpacing: '0.02em',
            textAlign: 'center',
          }}>
          ω₀ = √(k/m)
        </FadeUp>
        <FadeUp duration={0.6} delay={7.4} distance={14}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 52, color: 'var(--amber-300)', letterSpacing: '0.02em',
            textAlign: 'center',
          }}>
          ω₀ = 1/√(LC)
        </FadeUp>
      </div>
    </div>
  );
}

// ─── Beat 5: Damping added ────────────────────────────────────────────────
// Mirror layout: damped pendulum on the left swings with exponentially
// shrinking amplitude; on the right, an oscilloscope-style trace shows
// q(t) = A·exp(-γt)·cos(2π t/T) drawing in across the time axis with a
// dashed rose envelope tracing the decay. The two visuals share period
// and decay so the eye sees the same shape in two domains.
function DampingAdded() {
  const portrait = usePortrait();
  const PERIOD = 2.0;
  const DECAY = 0.28;       // 1/s — moderate damping
  const PEND_AMP = 22;      // degrees
  const RELEASE = 0.4;
  const { localTime } = useSprite();
  const t = Math.max(0, localTime - RELEASE);
  const env = Math.exp(-DECAY * t);
  const angle = PEND_AMP * env * Math.cos(2 * Math.PI * t / PERIOD);

  if (portrait) {
    return (
      <div style={{
        position: 'absolute', left: '50%', top: '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={660} height={980} viewBox="0 0 660 980" style={{ overflow: 'visible' }}>
          {/* Top half: damped pendulum */}
          <SvgFadeIn duration={0.4} delay={0}>
            <text x={330} y={32} textAnchor="middle"
                  fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize="12"
                  letterSpacing="0.16em">+ FRICTION</text>
          </SvgFadeIn>

          <SvgFadeIn duration={0.5} delay={0.3}>
            <Pendulum
              pivX={330} pivY={70} L={210}
              angle={angle}
              bobR={22} color="var(--amber-400)"
            />
          </SvgFadeIn>

          {/* Friction tag — anchored to the right of the bob */}
          <SvgFadeIn duration={0.4} delay={1.0}>
            <g>
              <line x1={420} y1={250} x2={370} y2={282}
                    stroke="var(--rose-400)" strokeWidth={1.2}
                    strokeDasharray="3 3"/>
              <text x={428} y={254} fill="var(--rose-300)"
                    fontFamily="var(--font-mono)" fontSize="12"
                    letterSpacing="0.12em">−b·v</text>
            </g>
          </SvgFadeIn>

          {/* Horizontal separator */}
          <SvgFadeIn duration={0.4} delay={0.3}>
            <line x1={80} y1={420} x2={580} y2={420}
                  stroke="var(--chalk-300)" strokeWidth={1}
                  strokeDasharray="3 6" opacity={0.4}/>
          </SvgFadeIn>

          {/* Bottom half: decaying q(t) trace */}
          <SvgFadeIn duration={0.4} delay={0}>
            <text x={330} y={466} textAnchor="middle"
                  fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize="12"
                  letterSpacing="0.16em">+ RESISTANCE</text>
          </SvgFadeIn>

          <DampedTracePlot x={120} y={520} w={420} h={300}
                           period={PERIOD} decay={DECAY}
                           drawDelay={0.8} drawDur={3.6}
                           envelopeDelay={2.2}/>

          {/* Caption beneath */}
          <SvgFadeIn duration={0.4} delay={5.0}>
            <text x={330} y={950} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                  fontSize="14" letterSpacing="0.02em">
              amplitude decays exponentially
            </text>
          </SvgFadeIn>
        </svg>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={1100} height={420} viewBox="0 0 1100 420" style={{ overflow: 'visible' }}>
        {/* ── Left column: damped pendulum ──────────────────────────────── */}
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={260} y={36} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize="12"
                letterSpacing="0.16em">+ FRICTION</text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={0.3}>
          <Pendulum
            pivX={260} pivY={70} L={220}
            angle={angle}
            bobR={20} color="var(--amber-400)"
          />
        </SvgFadeIn>

        {/* Friction tag with leader line near pendulum bob */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <g>
            <line x1={356} y1={246} x2={300} y2={285}
                  stroke="var(--rose-400)" strokeWidth={1.2}
                  strokeDasharray="3 3"/>
            <text x={362} y={250} fill="var(--rose-300)"
                  fontFamily="var(--font-mono)" fontSize="12"
                  letterSpacing="0.12em">−b·v</text>
          </g>
        </SvgFadeIn>

        {/* Vertical separator */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <line x1={550} y1={60} x2={550} y2={360}
                stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="3 6" opacity={0.4}/>
        </SvgFadeIn>

        {/* ── Right column: decaying q(t) trace ─────────────────────────── */}
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={830} y={36} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize="12"
                letterSpacing="0.16em">+ RESISTANCE</text>
        </SvgFadeIn>

        <DampedTracePlot x={650} y={120} w={360} h={180}
                         period={PERIOD} decay={DECAY}
                         drawDelay={0.8} drawDur={3.6}
                         envelopeDelay={2.2}/>

        {/* Caption beneath */}
        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={550} y={400} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize="14" letterSpacing="0.02em">
            amplitude decays exponentially
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// Damped sinusoid plotted across [0, w] of the box (x, y) with height h.
// Trace draws in via TraceIn. Envelope ±A·exp(-γt) drawn dashed in rose.
function DampedTracePlot({ x, y, w, h, period, decay, drawDelay, drawDur, envelopeDelay }) {
  const ax = x;          // axis baseline x
  const ay = y + h / 2;  // axis baseline y (zero line)
  const TIME_END = 6;    // simulated seconds across width

  // Compute polyline for damped sinusoid sample
  const samples = 80;
  const yAmp = h * 0.45;
  const points = [];
  const envTop = [];
  const envBot = [];
  for (let i = 0; i <= samples; i++) {
    const tFrac = i / samples;
    const tSec = tFrac * TIME_END;
    const env = Math.exp(-decay * tSec);
    const v = env * Math.cos(2 * Math.PI * tSec / period);
    const px = ax + tFrac * w;
    points.push([px, ay - v * yAmp]);
    envTop.push([px, ay - env * yAmp]);
    envBot.push([px, ay + env * yAmp]);
  }
  const toD = (pts) => pts.reduce((acc, [px, py], i) =>
    acc + (i === 0 ? `M ${px.toFixed(2)} ${py.toFixed(2)}` : ` L ${px.toFixed(2)} ${py.toFixed(2)}`), '');

  return (
    <g>
      {/* Axes */}
      <SvgFadeIn duration={0.4} delay={drawDelay - 0.3}>
        <line x1={ax} y1={y} x2={ax} y2={y + h}
              stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}/>
        <line x1={ax} y1={ay} x2={ax + w} y2={ay}
              stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}/>
        <text x={ax - 12} y={y + 8} textAnchor="end"
              fill="var(--chalk-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize="13">q</text>
        <text x={ax + w + 8} y={ay + 4}
              fill="var(--chalk-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize="13">t</text>
      </SvgFadeIn>

      {/* Decaying-amplitude curve */}
      <TraceIn d={toD(points)}
               stroke="var(--amber-400)" strokeWidth={2.5}
               duration={drawDur} delay={drawDelay}/>

      {/* Exponential envelope (dashed rose) */}
      <SvgFadeIn duration={0.5} delay={envelopeDelay}>
        <path d={toD(envTop)} fill="none" stroke="var(--rose-400)"
              strokeWidth={1.2} strokeDasharray="4 4" opacity={0.7}/>
        <path d={toD(envBot)} fill="none" stroke="var(--rose-400)"
              strokeWidth={1.2} strokeDasharray="4 4" opacity={0.7}/>
      </SvgFadeIn>
    </g>
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
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 32 : 38,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '40ch',
          lineHeight: 1.2,
        }}>
        Same math, different physics.
      </FadeUp>
      <FadeUp duration={0.6} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26,
          color: 'var(--amber-300)',
          maxWidth: portrait ? '22ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Once you understand one, you understand the other.
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
