// Centripetal Acceleration: Steering, Not Speeding — Manimo lesson scene.
// Generated from motion/centripetal-acceleration.spec.json. Standalone — sits
// alongside the other rotational mechanics scenes (moment-of-inertia, hoop-disk).
//
// Beats (timed to single-track narration in motion/audio/centripetal-acceleration/):
//    0.00– 7.52  Manimo enters; hook question
//    7.52–17.42  Uniform circular motion: ball orbits, velocity vector keeps turning
//   17.42–25.62  Acceleration points inward; reveal a_c = v²/r
//   25.62–31.92  Substitute v = rω → a_c = rω²
//   31.92–42.00  Takeaway — perpendicular to motion, does no work, just steers
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background, watermark, title block, corner Manimo.
//   • Orbit math: angle(t) = -π/2 + 2π·t/T (starts at top, sweeps clockwise on
//     screen because SVG y grows downward). Ball position, tangent v, and
//     inward a_c are derived from that single angle.

const SCENE_DURATION = 43;

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /*  0.00– 7.52 */ 'Whirl a ball around at constant speed — same speed, curved path, and it is still accelerating. How?',
  /*  7.52–17.42 */ 'A ball moving in a circle keeps turning. Even at constant speed, the velocity vector keeps changing direction — and a change in velocity is acceleration.',
  /* 17.42–25.62 */ 'That acceleration always points inward, toward the centre of the circle. Its size is the speed squared divided by the radius.',
  /* 25.62–31.92 */ 'Substitute v equals r omega, and the same acceleration becomes r omega squared.',
  /* 31.92–42.00 */ 'Centripetal acceleration sits perpendicular to the motion at every instant — so it does no work. It does not speed the ball up. It just steers.',
];

// Single continuous narration track — one ElevenLabs render covering the
// whole scene. Beat <Sprite start> values below match the audioStart
// offsets in motion/audio/centripetal-acceleration/manifest.json so visuals
// land on the corresponding sentence in the audio.
const NARRATION_AUDIO = 'audio/centripetal-acceleration/scene.mp3';

// HTML subscript helper. Unicode has no subscript-c, so we render it via
// `<sub>` and tweak its font size to match the formulae's serif weight.
function Sub({ children }) {
  return (
    <sub style={{
      fontSize: '0.55em', verticalAlign: 'baseline',
      position: 'relative', top: '0.18em',
    }}>{children}</sub>
  );
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="circular motion"
      title="Centripetal Acceleration: Steering, Not Speeding"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={7.52}>
        <ManimoBubbleIntro />
      </Sprite>

      <Sprite start={7.52} end={17.42}>
        <CircularMotion />
      </Sprite>

      <Sprite start={17.42} end={25.62}>
        <CentripetalReveal />
      </Sprite>

      <Sprite start={25.62} end={31.92}>
        <AngularForm />
      </Sprite>

      <Sprite start={31.92} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 1: Manimo intro ─────────────────────────────────────────────────
function ManimoBubbleIntro() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '46%' : '42%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: portrait ? 'column' : 'row',
      alignItems: 'center',
      gap: portrait ? 28 : 20,
    }}>
      <svg width={portrait ? 200 : 160} height={portrait ? 200 : 160}
           viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <ManimoEnter duration={0.7} bob={true} />
      </svg>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: portrait ? 26 : 26,
          fontStyle: 'italic',
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '34ch',
          textAlign: portrait ? 'center' : 'left',
          lineHeight: 1.3,
        }}>
        Constant speed, curved path — yet it's accelerating.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Uniform circular motion + tangent velocity ───────────────────
// Landscape geometry: 880×420 viewBox, centre (440,200), R=130.
// Portrait geometry: tighter horizontal extent, taller vertical room — the
// circle sits in the upper third with the caption below; viewBox is 660×680.
function CircularMotion() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 660, vbH: 680, cx: 330, cy: 280, R: 200, ballR: 16, V_LEN: 90,
        labelFont: 12, vFont: 26, captionY: 620, captionFont: 18,
        captionText: 'same speed — but the velocity vector keeps turning' }
    : { vbW: 880, vbH: 420, cx: 440, cy: 200, R: 130, ballR: 14, V_LEN: 70,
        labelFont: 11, vFont: 22, captionY: 400, captionFont: 14,
        captionText: 'same speed — but the velocity vector keeps turning' };
  const PERIOD = 4;          // seconds per revolution

  const { localTime } = useSprite();
  const angle = -Math.PI / 2 + (2 * Math.PI * localTime) / PERIOD;
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const ballX = G.cx + G.R * ca;
  const ballY = G.cy + G.R * sa;
  // Tangent direction (counterclockwise sense for SVG y-down: as angle
  // increases, position sweeps clockwise on screen, so tangent = (-sin, cos))
  const tDx = -sa, tDy = ca;
  const vStartX = ballX + G.ballR * tDx;
  const vStartY = ballY + G.ballR * tDy;
  const vEndX = vStartX + G.V_LEN * tDx;
  const vEndY = vStartY + G.V_LEN * tDy;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Dashed orbit circle */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <circle cx={G.cx} cy={G.cy} r={G.R}
                  fill="none" stroke="var(--chalk-300)" strokeWidth={1.5}
                  strokeDasharray="5 5"/>
        </SvgFadeIn>

        {/* Centre dot */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <circle cx={G.cx} cy={G.cy} r={3} fill="var(--chalk-300)"/>
          <text x={G.cx + 8} y={G.cy + 4}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.labelFont} letterSpacing="0.12em">CENTRE</text>
        </SvgFadeIn>

        {/* Orbiting ball */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <circle cx={ballX} cy={ballY} r={G.ballR}
                  fill="var(--amber-400)" opacity={0.95}
                  stroke="var(--amber-300)" strokeWidth={1.5}/>
        </SvgFadeIn>

        {/* Velocity vector — tangent to circle, rotates with the ball */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <line x1={vStartX} y1={vStartY} x2={vEndX} y2={vEndY}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          {/* Arrowhead */}
          <path d={`M ${vEndX.toFixed(2)} ${vEndY.toFixed(2)}
                    L ${(vEndX - 10 * tDx + 5 * tDy).toFixed(2)} ${(vEndY - 10 * tDy - 5 * tDx).toFixed(2)}
                    L ${(vEndX - 10 * tDx - 5 * tDy).toFixed(2)} ${(vEndY - 10 * tDy + 5 * tDx).toFixed(2)} Z`}
                fill="var(--rose-400)"/>
        </SvgFadeIn>

        {/* v label — pinned just past the arrow tip, offset along tangent */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <text x={vEndX + 6 * tDx + 6 * tDy} y={vEndY + 6 * tDy - 6 * tDx + 6}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.vFont}>v</text>
        </SvgFadeIn>

        {/* Caption beneath the diagram */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.captionFont} letterSpacing="0.02em">
            {G.captionText}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Inward acceleration + formula reveal ─────────────────────────
// Smaller orbit sits in the upper portion; the formula a_c = v²/r is
// revealed as a large amber payoff below. Portrait pulls the orbit a touch
// tighter and shrinks the formula so it fits the 720-wide canvas.
function CentripetalReveal() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 660, vbH: 320, svgW: 600, svgH: 291,
        cx: 330, cy: 150, R: 110, ballR: 13, V_LEN: 64, A_LEN: 58,
        formulaSize: 46, captionSize: 13, gap: 14 }
    : { vbW: 880, vbH: 280, svgW: 720, svgH: 229,
        cx: 440, cy: 130, R: 92, ballR: 12, V_LEN: 56, A_LEN: 50,
        formulaSize: 54, captionSize: 14, gap: 18 };
  const PERIOD = 4;

  const { localTime } = useSprite();
  const angle = -Math.PI / 2 + (2 * Math.PI * localTime) / PERIOD;
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const ballX = G.cx + G.R * ca;
  const ballY = G.cy + G.R * sa;
  const tDx = -sa, tDy = ca;
  const vStartX = ballX + G.ballR * tDx;
  const vStartY = ballY + G.ballR * tDy;
  const vEndX = vStartX + G.V_LEN * tDx;
  const vEndY = vStartY + G.V_LEN * tDy;
  // Inward unit direction (from ball toward centre)
  const aDx = -ca, aDy = -sa;
  const aStartX = ballX + G.ballR * aDx;
  const aStartY = ballY + G.ballR * aDy;
  const aEndX = aStartX + G.A_LEN * aDx;
  const aEndY = aStartY + G.A_LEN * aDy;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: G.gap,
    }}>
      <svg width={G.svgW} height={G.svgH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Dashed orbit + centre dot */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <circle cx={G.cx} cy={G.cy} r={G.R}
                  fill="none" stroke="var(--chalk-300)" strokeWidth={1.5}
                  strokeDasharray="5 5"/>
          <circle cx={G.cx} cy={G.cy} r={3} fill="var(--chalk-300)"/>
        </SvgFadeIn>

        {/* Orbiting ball */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <circle cx={ballX} cy={ballY} r={G.ballR}
                  fill="var(--amber-400)" opacity={0.95}
                  stroke="var(--amber-300)" strokeWidth={1.5}/>
        </SvgFadeIn>

        {/* Tangent velocity (kept dimmer — the focus is the inward arrow) */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={vStartX} y1={vStartY} x2={vEndX} y2={vEndY}
                stroke="var(--rose-400)" strokeWidth={2}
                opacity={0.7}/>
          <path d={`M ${vEndX.toFixed(2)} ${vEndY.toFixed(2)}
                    L ${(vEndX - 9 * tDx + 4.5 * tDy).toFixed(2)} ${(vEndY - 9 * tDy - 4.5 * tDx).toFixed(2)}
                    L ${(vEndX - 9 * tDx - 4.5 * tDy).toFixed(2)} ${(vEndY - 9 * tDy + 4.5 * tDx).toFixed(2)} Z`}
                fill="var(--rose-400)" opacity={0.7}/>
        </SvgFadeIn>

        {/* Inward centripetal acceleration arrow */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <line x1={aStartX} y1={aStartY} x2={aEndX} y2={aEndY}
                stroke="var(--amber-300)" strokeWidth={2.8}/>
          <path d={`M ${aEndX.toFixed(2)} ${aEndY.toFixed(2)}
                    L ${(aEndX - 10 * aDx + 5 * aDy).toFixed(2)} ${(aEndY - 10 * aDy - 5 * aDx).toFixed(2)}
                    L ${(aEndX - 10 * aDx - 5 * aDy).toFixed(2)} ${(aEndY - 10 * aDy + 5 * aDx).toFixed(2)} Z`}
                fill="var(--amber-300)"/>
        </SvgFadeIn>

        {/* a_c label — pinned to the moving acceleration tip. Subscript via
            tspan dy because there is no Unicode subscript "c" glyph. */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={aEndX + 8 * aDx} y={aEndY + 8 * aDy + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="18"
                textAnchor="middle">
            a<tspan dy="3" fontSize="13">c</tspan>
          </text>
        </SvgFadeIn>
      </svg>

      {/* Formula payoff */}
      <FadeUp duration={0.6} delay={3.0} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: G.formulaSize, color: 'var(--amber-300)', letterSpacing: '0.02em',
          marginTop: 4,
        }}>
        a<Sub>c</Sub> = v²/r
      </FadeUp>

      <FadeUp duration={0.5} delay={4.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: G.captionSize,
          color: 'var(--chalk-300)', letterSpacing: '0.02em',
          maxWidth: portrait ? '24ch' : 'none', textAlign: 'center',
        }}>
        always inward — toward the centre of the curve
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Angular form ─────────────────────────────────────────────────
// Landscape: chain on a single row (v=rω + a_c=v²/r ⇒ a_c=rω²).
// Portrait: stack each step on its own line so 720-wide canvas isn't crowded.
function AngularForm() {
  const portrait = usePortrait();
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 30 : 32, letterSpacing: '0.02em',
  };
  const arrowStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 18,
    color: 'var(--chalk-300)',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        substitute v = rω
      </FadeUp>

      {portrait ? (
        // Stacked chain in portrait — each row centred.
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <FadeUp duration={0.5} delay={0.3} distance={10}
            style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
            v = rω
          </FadeUp>
          <FadeUp duration={0.5} delay={1.0} distance={10}
            style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
            a<Sub>c</Sub> = v²/r
          </FadeUp>
          <FadeUp duration={0.4} delay={1.7} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--chalk-300)' }}>
            ⇓
          </FadeUp>
          <FadeUp duration={0.6} delay={2.0} distance={12}
            style={{ ...stepStyle, color: 'var(--amber-300)', fontSize: 38 }}>
            a<Sub>c</Sub> = rω²
          </FadeUp>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <FadeUp duration={0.5} delay={0.3} distance={10}
            style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
            v = rω
          </FadeUp>
          <FadeUp duration={0.4} delay={0.8} distance={6} style={arrowStyle}>
            +
          </FadeUp>
          <FadeUp duration={0.5} delay={1.0} distance={10}
            style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
            a<Sub>c</Sub> = v²/r
          </FadeUp>
          <FadeUp duration={0.4} delay={1.7} distance={6} style={arrowStyle}>
            ⇒
          </FadeUp>
          <FadeUp duration={0.6} delay={2.0} distance={12}
            style={{ ...stepStyle, color: 'var(--amber-300)', fontSize: 38 }}>
            a<Sub>c</Sub> = rω²
          </FadeUp>
        </div>
      )}

      <FadeUp duration={0.5} delay={3.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--chalk-300)',
          textAlign: 'center', maxWidth: portrait ? '28ch' : 'none',
        }}>
        two ways of saying the same thing
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
function Takeaway() {
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
          fontSize: portrait ? 26 : 28,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Always perpendicular to v — does no work.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 21 : 22,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch',
          lineHeight: 1.3,
        }}>
        It doesn't speed the ball up — it just steers.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          maxWidth: portrait ? '32ch' : 'none',
        }}>
        (no work, no energy spent — pure direction change)
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
