// Energy in a Capacitor: Why It's One Half C V Squared — Manimo lesson scene.
// Pushing charge onto a capacitor: V rises linearly with q, so the work to add
// the next dq is V·dq. The total energy is the triangle under V(q), area ½QV.
// Genuine motion lives in Beat 3: a moving (q, V) point slides up the V = q/C
// line while a value-driven triangle fills beneath it — the integral becoming
// visible as an area.
//
// Beats (timed to single-track narration in motion/ade/audio/capacitor-energy/):
//    0.00– 6.86  Manimo enters; hook question
//    6.86–13.54  Plates fill with dots; V = q/C label and V-meter
//   13.54–23.44  V(q) graph: line traces, triangle area sweeps in with point
//   23.44–38.37  Three equivalent forms: ½QV, ½CV², Q²/(2C)
//   38.37–48.00  Takeaway: energy lives in the field
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • usePortrait() drives layout in every beat that has geometry.
//   • Beat 3's triangle uses useSprite().localTime so the fill rate matches
//     the line's TraceIn — value-driven, not a fade.

const SCENE_DURATION = 48;

const NARRATION = [
  /*  0.00– 6.86 */ "You push charge onto a capacitor — where does the energy actually go?",
  /*  6.86–13.54 */ "Adding charge raises the voltage. The next little bit of charge has to be pushed against an already higher voltage — so the work piles up.",
  /* 13.54–23.44 */ "Plot voltage against charge — a straight line from zero up to V. The total work is the area under that line, a triangle with area one half Q V.",
  /* 23.44–38.37 */ "Substitute Q equals C V and you get one half C V squared. Substitute V equals Q over C and you get Q squared over two C. Same energy, three shapes.",
  /* 38.37–48.00 */ "The energy lives in the electric field between the plates — it stays there until something gives it somewhere to go.",
];

const NARRATION_AUDIO = 'audio/capacitor-energy/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="energy and power"
      title="Energy in a Capacitor: Why It's One Half C V Squared"
      duration={SCENE_DURATION}
      introEnd={6.86}
      introCaption="Charge a capacitor — where does the energy go?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.86} end={13.54}>
        <PushingChargeBeat />
      </Sprite>

      <Sprite start={13.54} end={23.44}>
        <TriangleIntegralBeat />
      </Sprite>

      <Sprite start={23.44} end={38.37}>
        <ThreeFormsBeat />
      </Sprite>

      <Sprite start={38.37} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Charges accumulate on the plates ────────────────────────────
// Genuine motion: dots appear on the top + bottom plates over time, and a
// V-meter needle climbs alongside, locking the visual to V = q/C.
function PushingChargeBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // Charging happens during the body of the beat — from delay=1.0 to 7.0.
  const CHARGE_START = 1.0;
  const CHARGE_END = 7.0;
  const tFrac = clamp((localTime - CHARGE_START) / (CHARGE_END - CHARGE_START), 0, 1);

  const G = portrait
    ? { vbW: 600, vbH: 600, plateCx: 220, plateY: 220, plateW: 180, plateGap: 80,
        meterX: 470, meterY: 200, meterH: 200,
        fontMain: 26, fontMeter: 14, captionY: 540 }
    : { vbW: 1000, vbH: 420, plateCx: 320, plateY: 150, plateW: 220, plateGap: 90,
        meterX: 700, meterY: 110, meterH: 220,
        fontMain: 32, fontMeter: 16, captionY: 380 };

  const platesTopY = G.plateY;
  const platesBotY = G.plateY + G.plateGap;
  const platesLeft = G.plateCx - G.plateW / 2;
  const platesRight = G.plateCx + G.plateW / 2;

  // Charge dots — distributed across each plate. Number visible scales with tFrac.
  const TOTAL_DOTS = 10;
  const visibleDots = Math.floor(tFrac * TOTAL_DOTS + 0.0001);
  const dotXs = Array.from({ length: TOTAL_DOTS },
    (_, i) => platesLeft + 16 + i * ((G.plateW - 32) / (TOTAL_DOTS - 1)));

  // V-meter: vertical scale, needle rises with tFrac.
  const meterTop = G.meterY;
  const meterBot = G.meterY + G.meterH;
  const needleY = meterBot - tFrac * G.meterH;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Top plate */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={platesLeft} y1={platesTopY} x2={platesRight} y2={platesTopY}
                stroke="var(--amber-400)" strokeWidth={3.5}
                strokeLinecap="round"/>
          {/* Lead going up */}
          <line x1={G.plateCx} y1={platesTopY - 30} x2={G.plateCx} y2={platesTopY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Bottom plate */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={platesLeft} y1={platesBotY} x2={platesRight} y2={platesBotY}
                stroke="var(--amber-400)" strokeWidth={3.5}
                strokeLinecap="round"/>
          {/* Lead going down */}
          <line x1={G.plateCx} y1={platesBotY} x2={G.plateCx} y2={platesBotY + 30}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Plus charges accumulating on top plate */}
        {dotXs.slice(0, visibleDots).map((cx, i) => (
          <g key={`p${i}`}>
            <circle cx={cx} cy={platesTopY - 10} r={5}
                    fill="var(--rose-400)" opacity={0.95}/>
            <text x={cx} y={platesTopY - 7} textAnchor="middle"
                  fill="var(--bg-canvas)" fontFamily="var(--font-mono)"
                  fontSize={9} fontWeight="bold">+</text>
          </g>
        ))}
        {/* Minus charges accumulating on bottom plate */}
        {dotXs.slice(0, visibleDots).map((cx, i) => (
          <g key={`n${i}`}>
            <circle cx={cx} cy={platesBotY + 10} r={5}
                    fill="var(--teal-400)" opacity={0.95}/>
            <text x={cx} y={platesBotY + 13} textAnchor="middle"
                  fill="var(--bg-canvas)" fontFamily="var(--font-mono)"
                  fontSize={11} fontWeight="bold">−</text>
          </g>
        ))}

        {/* V = q/C label, drawn off to the side */}
        <SvgFadeIn duration={0.4} delay={2.2}>
          <text x={G.plateCx} y={platesBotY + 60} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V = q / C
          </text>
        </SvgFadeIn>

        {/* V-meter scaffolding */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={G.meterX} y1={meterTop} x2={G.meterX} y2={meterBot}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          {[0, 0.25, 0.5, 0.75, 1].map((u, i) => (
            <g key={i}>
              <line x1={G.meterX - 6} y1={meterBot - u * G.meterH}
                    x2={G.meterX + 6} y2={meterBot - u * G.meterH}
                    stroke="var(--chalk-300)" strokeWidth={1}/>
            </g>
          ))}
          <text x={G.meterX - 10} y={meterTop - 6}
                textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontMeter} letterSpacing="0.1em">V</text>
        </SvgFadeIn>

        {/* V-meter needle: rises linearly with charge */}
        {tFrac > 0 && (
          <g>
            <line x1={G.meterX - 14} y1={needleY}
                  x2={G.meterX + 14} y2={needleY}
                  stroke="var(--rose-400)" strokeWidth={2.5}
                  strokeLinecap="round"/>
            <circle cx={G.meterX + 14} cy={needleY} r={4}
                    fill="var(--rose-400)"/>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            more charge → more voltage → harder to push the next charge
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: V(q) graph with sweeping triangle ───────────────────────────
// Genuine motion: a (q, V) point slides up the V = q/C line and the triangle
// area beneath fills synchronously. This is the integral becoming visible.
function TriangleIntegralBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 700, gx: 90, gy: 80, gw: 420, gh: 380,
        fontAxis: 22, fontFormula: 30, captionY: 660 }
    : { vbW: 1100, vbH: 480, gx: 140, gy: 60, gw: 540, gh: 360,
        fontAxis: 22, fontFormula: 38, captionY: 460 };

  const ax0 = G.gx, ay0 = G.gy + G.gh;       // origin
  const axEnd = G.gx + G.gw;                 // x-axis end
  const ayEnd = G.gy;                         // y-axis top

  // Triangle sweep: from delay 1.6 (after line traces) to delay 5.6.
  const SWEEP_START = 1.6;
  const SWEEP_END = 5.6;
  const sweep = clamp((localTime - SWEEP_START) / (SWEEP_END - SWEEP_START), 0, 1);

  // Moving point on the line.
  const qxFinal = axEnd - 20;
  const vyFinal = ayEnd + 20;
  const pointX = ax0 + (qxFinal - ax0) * sweep;
  const pointY = ay0 + (vyFinal - ay0) * sweep;

  // Formula panel position (right of graph in landscape, below in portrait).
  const formulaX = portrait ? G.vbW / 2 : axEnd + 120;
  const formulaY = portrait ? G.gy + G.gh + 80 : G.gy + G.gh / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Axes */}
        <TraceIn d={`M ${ax0} ${ayEnd} L ${ax0} ${ay0} L ${axEnd} ${ay0}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.8} delay={0.0}/>

        {/* Axis labels */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={axEnd + 18} y={ay0 + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>q</text>
          <text x={ax0 - 18} y={ayEnd - 6}
                textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>V</text>
          {/* Tick labels at Q and V */}
          <text x={qxFinal} y={ay0 + 22} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">Q</text>
          <text x={ax0 - 12} y={vyFinal + 5}
                textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">V</text>
        </SvgFadeIn>

        {/* V = q/C line, traces in first */}
        <TraceIn d={`M ${ax0} ${ay0} L ${qxFinal} ${vyFinal}`}
                 stroke="var(--amber-400)" strokeWidth={2.6}
                 duration={1.0} delay={0.8}/>

        {/* Slope label */}
        <SvgFadeIn duration={0.35} delay={1.8}>
          <text x={(ax0 + qxFinal) / 2 + 20} y={(ay0 + vyFinal) / 2 - 12}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            V = q/C
          </text>
        </SvgFadeIn>

        {/* Triangle area filling as sweep advances */}
        {sweep > 0.001 && (
          <g>
            <path d={`M ${ax0} ${ay0} L ${pointX} ${ay0} L ${pointX} ${pointY} Z`}
                  fill="var(--amber-400)" opacity={0.18}
                  stroke="none"/>
            {/* Drop-line from point to x-axis */}
            <line x1={pointX} y1={pointY} x2={pointX} y2={ay0}
                  stroke="var(--rose-300)" strokeWidth={1.2}
                  strokeDasharray="3 4" opacity={0.7}/>
            {/* Moving (q, V) marker */}
            <circle cx={pointX} cy={pointY} r={5}
                    fill="var(--rose-400)" stroke="var(--rose-300)" strokeWidth={1}/>
          </g>
        )}

        {/* dW = V dq annotation — appears briefly during sweep */}
        {sweep > 0.15 && sweep < 0.85 && (
          <text x={pointX + 10} y={pointY - 12}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.06em"
                opacity={0.85}>
            dW = V·dq
          </text>
        )}

        {/* Final formula — appears after the sweep finishes */}
        <SvgFadeIn duration={0.5} delay={6.0}>
          <text x={formulaX} y={formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            E = ½ Q V
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={7.2}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the area under V(q) is the energy stored
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Three equivalent forms ──────────────────────────────────────
function ThreeFormsBeat() {
  const portrait = usePortrait();

  const formulaStyle = (color, big) => ({
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: big ? (portrait ? 44 : 56) : (portrait ? 30 : 38),
    color, letterSpacing: '0.02em',
  });

  const Cell = ({ delay, big, color, children }) => (
    <FadeUp duration={0.5} delay={delay} distance={12}
      style={{
        whiteSpace: 'nowrap', flexShrink: 0,
        ...formulaStyle(color, big),
      }}>
      {children}
    </FadeUp>
  );

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 30 : 36,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        three equivalent forms
      </FadeUp>

      {portrait ? (
        <div style={{ display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 22 }}>
          <Cell delay={0.2} color="var(--chalk-200)">E = ½ Q V</Cell>
          <Cell delay={1.4} big color="var(--amber-300)">E = ½ C V²</Cell>
          <Cell delay={2.6} color="var(--chalk-200)">E = Q² / (2C)</Cell>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 70 }}>
          <Cell delay={0.2} color="var(--chalk-200)">E = ½ Q V</Cell>
          <div style={{
            width: 1, height: 90,
            background: 'rgba(232,220,193,0.15)',
          }}/>
          <Cell delay={1.4} big color="var(--amber-300)">E = ½ C V²</Cell>
          <div style={{
            width: 1, height: 90,
            background: 'rgba(232,220,193,0.15)',
          }}/>
          <Cell delay={2.6} color="var(--chalk-200)">E = Q² / (2C)</Cell>
        </div>
      )}

      <FadeUp duration={0.5} delay={5.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)',
          textAlign: 'center', maxWidth: portrait ? '26ch' : 'none',
          letterSpacing: '0.02em',
        }}>
        use whichever two quantities you know
      </FadeUp>
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
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Energy lives in the field between the plates.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
        }}>
        (release it through a load and it powers a current)
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
