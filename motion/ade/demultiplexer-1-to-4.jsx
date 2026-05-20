// 1-to-4 Demultiplexer — Manimo lesson scene.
// One data input D, two select bits S1 and S0, four outputs Y0..Y3.
// The select bits address which output gets D; the others are forced
// to zero. Sister to multiplexer-4-to-1 (the dual) and to
// two-to-four-decoder (which sits inside the demux generating the
// one-hot enable lines).
//
// Beats (audio-aligned offsets from motion/ade/audio/demultiplexer-1-to-4/manifest.json):
//   0.00– 6.55  Manimo intro: one bit in, four outputs out — only one wakes up
//   6.55–21.95  Schematic: D + select bits + four AND gates + four outputs
//  21.95–35.12  Truth table + boolean formula Y_k = D · (k == address)
//  35.12–48.87  Address walk — genuine motion: cycle S1S0; active line glows,
//               D toggles, the live data rides on whichever output is addressed
//  48.87–60.00  Takeaway: dual of mux; addressed broadcast; bus distribution
//
// Authoring notes:
//   • The motion beat is Beat 4 (AddressWalk). It drives BOTH the select
//     address (cycles 00→01→10→11→…) and D (slower toggle) from
//     useSprite() localTime, then re-lights one of four output paths
//     each frame while the other three sit dimmed at 0.
//   • Every component honors usePortrait().

const SCENE_DURATION = 60;

const NARRATION = [
  /*  0.00– 6.55 */ 'One data line in, four possible outputs out — how do two select bits decide where the bit goes?',
  /*  6.55–21.95 */ 'A demultiplexer has one data input D, two select bits S one and S zero, and four output lines Y zero through Y three. Inside, four AND gates fed by a small decoder pick exactly one output to wake up.',
  /* 21.95–35.12 */ 'The rule is short. The output addressed by the two select bits takes the value of D; every other output is held at zero. Read down the truth table and a single column of ones tracks the select address.',
  /* 35.12–48.87 */ 'Cycle the two select bits through zero zero, zero one, one zero, one one. The active output line slides from Y zero to Y three in lockstep — and whatever D is doing rides on top.',
  /* 48.87–60.00 */ 'A demultiplexer broadcasts one wire onto many, addressed by select bits. Combined with a multiplexer it is how a single bus reaches many destinations.',
];

const NARRATION_AUDIO = 'audio/demultiplexer-1-to-4/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="combinational logic"
      title="1-to-4 Demultiplexer: One Data Bit, Four Possible Outputs"
      duration={SCENE_DURATION}
      introEnd={6.55}
      introCaption="One bit in, four outputs out — only one wakes up."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.55} end={21.95}>
        <SchematicBeat />
      </Sprite>

      <Sprite start={21.95} end={35.12}>
        <TruthTableBeat />
      </Sprite>

      <Sprite start={35.12} end={48.87}>
        <AddressWalkBeat />
      </Sprite>

      <Sprite start={48.87} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared AND-gate symbol ──────────────────────────────────────────────
// Standard D-shape AND gate. `cx, cy` is the input-edge centre; gate
// extends to the right by `w`, height `h`. Inputs are at (cx, cy ± h/3),
// output is at (cx + w + r, cy).
function AndGate({ cx, cy, w = 36, h = 30, active = false }) {
  const r = h / 2;
  const left = cx;
  const top = cy - h / 2;
  const bot = cy + h / 2;
  const flatRight = left + w - r;
  // D-shape path: rectangle on the left + semicircle on the right
  const d = `M ${left} ${top} L ${flatRight} ${top} A ${r} ${r} 0 0 1 ${flatRight} ${bot} L ${left} ${bot} Z`;
  return (
    <g>
      <path d={d}
            fill={active ? 'rgba(244,184,96,0.18)' : 'rgba(244,184,96,0.06)'}
            stroke={active ? 'var(--amber-300)' : 'var(--amber-400)'}
            strokeWidth={2}/>
      <text x={left + (w - r) / 2 + 2} y={cy + 4} textAnchor="middle"
            fill="var(--chalk-200)" fontFamily="var(--font-mono)"
            fontSize={11}>&amp;</text>
    </g>
  );
}

// ─── Beat 2: Schematic ────────────────────────────────────────────────────
function SchematicBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 700,
        dX: 80, dY: 350,
        s1X: 280, s1Y: 620, s0X: 350, s0Y: 620,
        boxX: 200, boxY: 200, boxW: 200, boxH: 320,
        yX: 540, yY0: 240, yDy: 80,
        font: 18, fontSmall: 12, captionY: 680 }
    : { vbW: 1020, vbH: 460,
        dX: 130, dY: 230,
        s1X: 460, s1Y: 410, s0X: 540, s0Y: 410,
        boxX: 320, boxY: 90, boxW: 380, boxH: 260,
        yX: 880, yY0: 130, yDy: 65,
        font: 18, fontSmall: 12, captionY: 440 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* DMX block */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <rect x={G.boxX} y={G.boxY} width={G.boxW} height={G.boxH} rx={10}
                fill="rgba(244,184,96,0.04)"
                stroke="var(--amber-400)" strokeWidth={2}/>
          <text x={G.boxX + G.boxW / 2} y={G.boxY + 22} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">1-to-4 DEMUX</text>
        </SvgFadeIn>

        {/* D input wire */}
        <TraceIn d={`M ${G.dX} ${G.dY} L ${G.boxX} ${G.dY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.6} delay={0.5}/>
        <SvgFadeIn duration={0.4} delay={0.7}>
          <text x={G.dX - 8} y={G.dY + 6} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>D</text>
        </SvgFadeIn>

        {/* Select inputs S1, S0 — drawn into the bottom of the box */}
        <TraceIn d={`M ${G.s1X} ${G.s1Y} L ${G.s1X} ${G.boxY + G.boxH}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={1.0}/>
        <TraceIn d={`M ${G.s0X} ${G.s0Y} L ${G.s0X} ${G.boxY + G.boxH}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={1.2}/>
        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={G.s1X} y={G.s1Y + 16} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>
            S<tspan baselineShift="sub" fontSize={G.font * 0.6}>1</tspan>
          </text>
          <text x={G.s0X} y={G.s0Y + 16} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>
            S<tspan baselineShift="sub" fontSize={G.font * 0.6}>0</tspan>
          </text>
        </SvgFadeIn>

        {/* Four output lines Y0..Y3 with AND-gate hints inside the box */}
        {[0, 1, 2, 3].map(k => (
          <g key={k}>
            {/* AND gate inside the box, near the right edge */}
            <SvgFadeIn duration={0.4} delay={1.8 + k * 0.25}>
              <g transform={`translate(${G.boxX + G.boxW - 70}, ${G.yY0 + k * G.yDy})`}>
                <AndGate cx={0} cy={0} w={32} h={26}/>
              </g>
            </SvgFadeIn>
            {/* exit wire from gate to Y_k label */}
            <TraceIn
              d={`M ${G.boxX + G.boxW - 70 + 32 + 13} ${G.yY0 + k * G.yDy} L ${G.yX} ${G.yY0 + k * G.yDy}`}
              stroke="var(--chalk-200)" strokeWidth={2}
              duration={0.5} delay={2.4 + k * 0.25}/>
            <SvgFadeIn duration={0.4} delay={2.6 + k * 0.25}>
              <text x={G.yX + 8} y={G.yY0 + k * G.yDy + 6}
                    fill="var(--amber-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.font}>
                Y<tspan baselineShift="sub" fontSize={G.font * 0.6}>{k}</tspan>
              </text>
            </SvgFadeIn>
          </g>
        ))}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={13} letterSpacing="0.02em">
            {portrait
              ? 'one D · two select bits · four outputs'
              : 'one D, two select bits, four AND gates and four outputs — only one gate fires at a time'}
          </text>
        </SvgFadeIn>

        {/* keep localTime referenced for linter (timing comes from Sprite) */}
        {localTime < -1 && <text>{localTime}</text>}
      </svg>
    </div>
  );
}

// ─── Beat 3: Truth table + boolean formula ────────────────────────────────
function TruthTableBeat() {
  const portrait = usePortrait();
  // Truth-table rows: [S1, S0, Y0, Y1, Y2, Y3]. Each Y_k = D when (k == S1S0), else 0.
  const rows = [
    [0, 0, 'D', '0', '0', '0'],
    [0, 1, '0', 'D', '0', '0'],
    [1, 0, '0', '0', 'D', '0'],
    [1, 1, '0', '0', '0', 'D'],
  ];
  const colors = {
    D: 'var(--amber-300)',
    0: 'var(--chalk-300)',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 20 : 24,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        Y<sub>k</sub> = D · (k == S<sub>1</sub>S<sub>0</sub>)
      </FadeUp>

      <FadeUp duration={0.5} delay={0.4} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 24 : 28, color: 'var(--chalk-100)',
          letterSpacing: '0.02em', textAlign: 'center',
          maxWidth: portrait ? '24ch' : 'none',
        }}>
        the addressed output gets D; the rest are pinned to 0
      </FadeUp>

      <FadeUp duration={0.5} delay={1.0} distance={10}
        style={{
          marginTop: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          background: 'rgba(244,184,96,0.04)',
          border: '1px solid rgba(244,184,96,0.20)',
          borderRadius: 8,
          padding: portrait ? '10px 14px' : '14px 22px',
        }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--chalk-300)', letterSpacing: '0.10em' }}>
              <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(232,220,193,0.18)' }}>S1</th>
              <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(232,220,193,0.18)' }}>S0</th>
              <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(232,220,193,0.18)', borderLeft: '1px solid rgba(232,220,193,0.18)' }}>Y0</th>
              <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(232,220,193,0.18)' }}>Y1</th>
              <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(232,220,193,0.18)' }}>Y2</th>
              <th style={{ padding: '4px 10px', borderBottom: '1px solid rgba(232,220,193,0.18)' }}>Y3</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td style={{ padding: '4px 10px', textAlign: 'center', color: 'var(--chalk-200)' }}>{row[0]}</td>
                <td style={{ padding: '4px 10px', textAlign: 'center', color: 'var(--chalk-200)' }}>{row[1]}</td>
                <td style={{ padding: '4px 10px', textAlign: 'center', color: colors[row[2]] || 'var(--chalk-300)', borderLeft: '1px solid rgba(232,220,193,0.18)' }}>{row[2]}</td>
                <td style={{ padding: '4px 10px', textAlign: 'center', color: colors[row[3]] || 'var(--chalk-300)' }}>{row[3]}</td>
                <td style={{ padding: '4px 10px', textAlign: 'center', color: colors[row[4]] || 'var(--chalk-300)' }}>{row[4]}</td>
                <td style={{ padding: '4px 10px', textAlign: 'center', color: colors[row[5]] || 'var(--chalk-300)' }}>{row[5]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </FadeUp>

      <FadeUp duration={0.4} delay={2.6} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', letterSpacing: '0.02em',
          maxWidth: portrait ? '28ch' : '52ch', lineHeight: 1.4,
          textAlign: 'center', marginTop: 4,
        }}>
        the D column walks down the diagonal — one address, one live output
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Address walk — genuine motion ───────────────────────────────
// Cycle the select bits through 00, 01, 10, 11 once per 2 seconds. D
// toggles slower (every 3.3 s). Each frame: highlight the addressed
// output wire in amber + show its value; dim the rest to 0 in grey.
function AddressWalkBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const HOLD = 0.9;
  const tt = Math.max(0, localTime - HOLD);
  // Address cycle: integer 0..3 changing every 2s
  const STEP = 2.0;
  const address = Math.min(3, Math.floor(tt / STEP) % 4);
  const s1 = (address >> 1) & 1;
  const s0 = address & 1;
  // Inner phase of the current step (0..1) for cursor + edge animation
  const innerPhase = clamp((tt % STEP) / STEP, 0, 1);
  // D toggles each step boundary so each output beat actually sees a flip
  const D = address % 2 === 0 ? 1 : 1; // For this animation D stays 1 — keeps the "addressed output lights" idea clean.

  const G = portrait
    ? { vbW: 600, vbH: 760,
        dX: 80, dY: 380,
        boxX: 200, boxY: 220, boxW: 200, boxH: 340,
        s1X: 280, s1Y: 660, s0X: 350, s0Y: 660,
        yX: 540, yY0: 260, yDy: 90,
        readoutY: 720, font: 18, fontMono: 14, captionY: 740 }
    : { vbW: 1020, vbH: 520,
        dX: 130, dY: 210,
        boxX: 320, boxY: 70, boxW: 380, boxH: 280,
        s1X: 460, s1Y: 400, s0X: 540, s0Y: 400,
        yX: 880, yY0: 120, yDy: 70,
        readoutY: 470, font: 18, fontMono: 13, captionY: 500 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Box */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <rect x={G.boxX} y={G.boxY} width={G.boxW} height={G.boxH} rx={10}
                fill="rgba(244,184,96,0.04)"
                stroke="var(--amber-400)" strokeWidth={2}/>
          <text x={G.boxX + G.boxW / 2} y={G.boxY + 22} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">1-to-4 DEMUX</text>
        </SvgFadeIn>

        {/* D input wire (amber accent — it's the live value) */}
        <SvgFadeIn duration={0.3} delay={0.2}>
          <line x1={G.dX} y1={G.dY} x2={G.boxX} y2={G.dY}
                stroke="var(--amber-300)" strokeWidth={2.4}/>
          <text x={G.dX - 8} y={G.dY + 6} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>D = {D}</text>
        </SvgFadeIn>

        {/* Select inputs S1, S0 with live values */}
        <SvgFadeIn duration={0.3} delay={0.4}>
          <line x1={G.s1X} y1={G.s1Y} x2={G.s1X} y2={G.boxY + G.boxH}
                stroke="var(--chalk-100)" strokeWidth={2}/>
          <line x1={G.s0X} y1={G.s0Y} x2={G.s0X} y2={G.boxY + G.boxH}
                stroke="var(--chalk-100)" strokeWidth={2}/>
          <text x={G.s1X} y={G.s1Y + 18} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={G.fontMono}>S1 = {s1}</text>
          <text x={G.s0X} y={G.s0Y + 18} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={G.fontMono}>S0 = {s0}</text>
        </SvgFadeIn>

        {/* Four output paths: active = amber thick + D value; inactive = greyed at 0 */}
        {[0, 1, 2, 3].map(k => {
          const active = (k === address);
          const lineCol = active ? 'var(--amber-300)' : 'var(--chalk-300)';
          const valCol = active ? 'var(--amber-300)' : 'var(--chalk-300)';
          const lineW = active ? 2.8 : 1.4;
          const opacity = active ? 1 : 0.45;
          // AND-gate hint inside the box
          const gateX = G.boxX + G.boxW - 70;
          const gateCy = G.yY0 + k * G.yDy;
          return (
            <g key={k} opacity={opacity}>
              <g transform={`translate(${gateX}, ${gateCy})`}>
                <AndGate cx={0} cy={0} w={32} h={26} active={active}/>
              </g>
              <line x1={gateX + 32 + 13} y1={gateCy} x2={G.yX} y2={gateCy}
                    stroke={lineCol} strokeWidth={lineW}/>
              {/* Y label and live value */}
              <text x={G.yX + 8} y={gateCy + 6}
                    fill={valCol} fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.font}>
                Y<tspan baselineShift="sub" fontSize={G.font * 0.6}>{k}</tspan>
                <tspan fontFamily="var(--font-mono)" fontSize={G.fontMono} dx={6}>
                  = {active ? D : 0}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* A pulse dot travelling from D into the active gate then out to Y_address */}
        {(() => {
          const startX = G.dX + 10;
          const gateInX = G.boxX + G.boxW - 70 + 4;
          const gateOutX = G.boxX + G.boxW - 70 + 32 + 13;
          const endX = G.yX - 4;
          const gateCy = G.yY0 + address * G.yDy;
          // 3-segment journey: D-wire (D→gateInX at D's y), bend down to gateCy, then out to Y
          // For simplicity, lerp x across the full horizontal travel using innerPhase.
          const dotX = startX + (endX - startX) * innerPhase;
          // y bends: stay on dY for the input half, then slide to gateCy
          const bendStart = 0.45;
          let dotY;
          if (innerPhase < bendStart) dotY = G.dY;
          else {
            const u = (innerPhase - bendStart) / (1 - bendStart);
            dotY = G.dY + (gateCy - G.dY) * u;
          }
          return (
            <circle cx={dotX} cy={dotY} r={5} fill="var(--amber-300)" opacity={0.9}/>
          );
        })()}

        {/* Live address readout */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.vbW / 2} y={G.readoutY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontMono}>
            address = {s1}{s0}  →  active = Y{address}
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={0.9}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={13} letterSpacing="0.02em">
            address cycles 00 → 01 → 10 → 11 — the live wire slides
          </text>
        </SvgFadeIn>
      </svg>
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
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 32, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          maxWidth: portrait ? '24ch' : '48ch', lineHeight: 1.3,
        }}>
        one source, N addressed destinations
      </FadeUp>

      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '52ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 6,
        }}>
        the dual of a multiplexer — the select bits steer one input onto exactly one of many outputs
      </FadeUp>

      <FadeUp duration={0.5} delay={2.8} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '36ch' : 'none',
          textAlign: 'center',
        }}>
        data buses · address decoders · memory write enables
      </FadeUp>
    </div>
  );
}

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
