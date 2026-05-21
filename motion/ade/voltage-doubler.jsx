// Voltage Doubler — Manimo lesson scene.
// Greinacher half-wave doubler. On the negative half-cycle D1 conducts
// and C1 charges to V_p. On the positive half-cycle the source + C1 sit
// in series at 2V_p, D2 conducts, and C2 charges to ≈ 2V_p. Genuine
// motion: charge-dot pumping through D1 into C1 (Beat 3) and through D2
// into C2 (Beat 4), with live V_C1 and V_out readouts.
//
// Beats:
//    0.00– 5.00  Manimo intro + hook caption
//    5.00–15.00  Static schematic with element labels
//   15.00–27.00  Negative half-cycle: D1 on, C1 charges to V_p (motion)
//   27.00–40.00  Positive half-cycle: D2 on, C2 charges toward 2V_p (motion)
//   40.00–50.00  Takeaway formula + Cockcroft–Walton note
//
// Authoring notes:
//   • Beats 2/3/4 share circuitGeometry() so the schematic, the
//     highlighted loops, and the charge-dot paths all line up.
//   • Use SvgFadeIn for SVG children; FadeUp only for HTML/DOM.

const SCENE_DURATION = 68;

// Single continuous narration track — generated with
// `npm run audio voltage-doubler --engine elevenlabs`. Beat Sprite-start
// values below match audioStart offsets in
// motion/ade/audio/voltage-doubler/manifest.json.
const NARRATION_AUDIO = 'audio/voltage-doubler/scene.mp3';

const NARRATION = [
  /*  0.00– 5.00 */ 'Two diodes, two capacitors, one A C source — and the output sits at almost twice the input peak. How does it pull that off?',
  /*  5.00–15.00 */ 'Here is the Greinacher half-wave doubler. The A C source feeds the junction between C1 and D1. D2 sits between that junction and the output, where C2 holds the doubled D C.',
  /* 15.00–27.00 */ 'Start with the negative half-cycle. The source pulls its junction low. D1 conducts, D2 is reverse-biased. Current flows from ground through D1, charging C1 up to the peak voltage V p with the polarity shown.',
  /* 27.00–40.00 */ 'Now flip to the positive half-cycle. The source swings up to plus V p. C1 still holds its V p across it, in series with the source — so the junction sits at two V p. D2 turns on, D1 turns off, and that two V p charges C2 through D2.',
  /* 40.00–50.00 */ 'After a few cycles the output settles. C2 holds two V p minus two diode drops. Cascade more stages and you multiply by three, four, however many — that is the Cockcroft Walton multiplier.',
];

const VP = 5.0; // V — peak input

// Shared circuit geometry. The schematic looks like this in landscape:
//
//   srcL ── C1 ── (J) ── D2 ── (Vout)
//                  │              │
//                  D1            C2
//                  │              │
//                ─gnd──────────gnd
//
// 'J' is the junction between C1, D1, D2.
function circuitGeometry(portrait) {
  if (portrait) {
    return {
      vbW: 640, vbH: 720,
      srcX: 110, srcY: 220, srcR: 30,
      topY: 220, gndY: 540,
      jX: 320, c1X: 200,             // C1 sits on the top wire between src and J
      voutX: 510, outY: 220,
      d1X: 320,                       // D1 between J and gnd
      d2X: 420,                       // D2 between J and Vout (horizontal)
      c2X: 510,                       // C2 between Vout and gnd
      readoutY: 640, captionY: 686,
      readoutLeftX: 110, readoutRightX: 530,
    };
  }
  return {
    vbW: 1180, vbH: 460,
    srcX: 180, srcY: 200, srcR: 36,
    topY: 200, gndY: 360,
    jX: 540, c1X: 360,
    voutX: 840, outY: 200,
    d1X: 540,
    d2X: 700,
    c2X: 840,
    readoutY: 410, captionY: 442,
    readoutLeftX: 200, readoutRightX: 840,
  };
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="diodes"
      title="Voltage Doubler: Two Diodes Pump V Twice"
      duration={SCENE_DURATION}
      introEnd={8.48}
      introCaption="Two half-cycles, one charge pump, double the voltage."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={8.48} end={20.9}>
        <SchematicBeat />
      </Sprite>

      <Sprite start={20.9} end={36.12}>
        <NegativeHalfBeat />
      </Sprite>

      <Sprite start={36.12} end={53.72}>
        <PositiveHalfBeat />
      </Sprite>

      <Sprite start={53.72} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared drawables ─────────────────────────────────────────────────────
// Capacitor symbol — two parallel plates at (cx, cy), horizontal in-line on
// a horizontal wire (so plates are vertical).
function CapHoriz({ cx, cy, gap = 8, plateH = 22, color = 'var(--amber-400)', label, labelOffset = -16 }) {
  return (
    <g>
      <line x1={cx - gap} y1={cy - plateH / 2} x2={cx - gap} y2={cy + plateH / 2}
            stroke={color} strokeWidth={2.4}/>
      <line x1={cx + gap} y1={cy - plateH / 2} x2={cx + gap} y2={cy + plateH / 2}
            stroke={color} strokeWidth={2.4}/>
      {label && (
        <text x={cx} y={cy + labelOffset} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={15}>{label}</text>
      )}
    </g>
  );
}

// Capacitor symbol — vertical wire, plates horizontal at (cx, cy).
function CapVert({ cx, cy, gap = 8, plateW = 22, color = 'var(--amber-400)', label, labelOffset = 18 }) {
  return (
    <g>
      <line x1={cx - plateW / 2} y1={cy - gap} x2={cx + plateW / 2} y2={cy - gap}
            stroke={color} strokeWidth={2.4}/>
      <line x1={cx - plateW / 2} y1={cy + gap} x2={cx + plateW / 2} y2={cy + gap}
            stroke={color} strokeWidth={2.4}/>
      {label && (
        <text x={cx + labelOffset} y={cy + 4}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={15}>{label}</text>
      )}
    </g>
  );
}

// Diode symbol on a horizontal wire pointing in the +x direction (anode→cathode).
// dirX = +1 means anode on left, cathode on right. Triangle + bar.
function DiodeHoriz({ cx, cy, size = 11, dirX = 1, color = 'var(--amber-400)', highlight = false, label, labelOffset = -16 }) {
  const tipX = cx + dirX * size;
  const baseX = cx - dirX * size;
  const fillColor = highlight ? 'var(--amber-400)' : 'rgba(244,184,96,0.15)';
  return (
    <g>
      <path d={`M ${baseX} ${cy - size} L ${baseX} ${cy + size} L ${tipX} ${cy} Z`}
            stroke={color} strokeWidth={1.8} fill={fillColor}/>
      <line x1={tipX} y1={cy - size} x2={tipX} y2={cy + size}
            stroke={color} strokeWidth={2}/>
      {label && (
        <text x={cx} y={cy + labelOffset} textAnchor="middle"
              fill={highlight ? 'var(--amber-300)' : 'var(--chalk-200)'}
              fontFamily="var(--font-serif)" fontStyle="italic" fontSize={15}>{label}</text>
      )}
    </g>
  );
}

// Diode on a vertical wire. dirY = +1 means anode at top, cathode at bottom.
function DiodeVert({ cx, cy, size = 11, dirY = 1, color = 'var(--amber-400)', highlight = false, label, labelOffset = 18 }) {
  const tipY = cy + dirY * size;
  const baseY = cy - dirY * size;
  const fillColor = highlight ? 'var(--amber-400)' : 'rgba(244,184,96,0.15)';
  return (
    <g>
      <path d={`M ${cx - size} ${baseY} L ${cx + size} ${baseY} L ${cx} ${tipY} Z`}
            stroke={color} strokeWidth={1.8} fill={fillColor}/>
      <line x1={cx - size} y1={tipY} x2={cx + size} y2={tipY}
            stroke={color} strokeWidth={2}/>
      {label && (
        <text x={cx + labelOffset} y={cy + 4}
              fill={highlight ? 'var(--amber-300)' : 'var(--chalk-200)'}
              fontFamily="var(--font-serif)" fontStyle="italic" fontSize={15}>{label}</text>
      )}
    </g>
  );
}

// AC source symbol — circle with a sine glyph inside.
function AcSource({ cx, cy, r, polarity = 0, color = 'var(--chalk-100)' }) {
  // polarity ∈ {-1, 0, +1} — controls which sign is drawn next to top terminal.
  const sym = polarity === 0 ? '~' : (polarity > 0 ? '+' : '−');
  const symColor = polarity === 0 ? color : (polarity > 0 ? 'var(--rose-300)' : 'var(--rose-400)');
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}
              fill="rgba(232,220,193,0.04)"
              stroke={color} strokeWidth={1.6}/>
      <path d={`M ${cx - r * 0.55} ${cy} Q ${cx - r * 0.27} ${cy - r * 0.55}, ${cx} ${cy} T ${cx + r * 0.55} ${cy}`}
            fill="none" stroke={color} strokeWidth={1.6}/>
      <text x={cx} y={cy - r - 10} textAnchor="middle"
            fill={symColor} fontFamily="var(--font-serif)"
            fontSize={20} fontStyle="italic">{sym}</text>
    </g>
  );
}

// ─── Static schematic (Beat 2) ────────────────────────────────────────────
function SchematicBeat() {
  const portrait = usePortrait();
  const G = circuitGeometry(portrait);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Source */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <AcSource cx={G.srcX} cy={G.srcY} r={G.srcR}/>
          <text x={G.srcX - G.srcR - 10} y={G.srcY + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>V_in</text>
        </SvgFadeIn>

        {/* Top wire: source → C1 → J → D2 → Vout */}
        <TraceIn d={`M ${G.srcX + G.srcR} ${G.srcY} L ${G.c1X - 10} ${G.topY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={0.4}/>
        <SvgFadeIn duration={0.35} delay={0.7}>
          <CapHoriz cx={G.c1X} cy={G.topY} label="C₁" labelOffset={-18}/>
        </SvgFadeIn>
        <TraceIn d={`M ${G.c1X + 10} ${G.topY} L ${G.d2X - 14} ${G.topY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={0.9}/>
        <SvgFadeIn duration={0.35} delay={1.2}>
          <DiodeHoriz cx={G.d2X} cy={G.topY} dirX={1} label="D₂" labelOffset={-18}/>
        </SvgFadeIn>
        <TraceIn d={`M ${G.d2X + 14} ${G.topY} L ${G.voutX} ${G.topY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={1.4}/>

        {/* V_out tap dot + label */}
        <SvgFadeIn duration={0.35} delay={1.7}>
          <circle cx={G.voutX} cy={G.topY} r={3.5} fill="var(--amber-300)"/>
          <text x={G.voutX + 18} y={G.topY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>V_out</text>
        </SvgFadeIn>

        {/* D1 — vertical between J and gnd (anode on top, cathode on bottom is
            backwards for our current direction; here current flows from gnd
            UP through D1 to J during the negative half-cycle, so D1's anode
            is at gnd and cathode at J → dirY = -1). */}
        <TraceIn d={`M ${G.jX} ${G.topY} L ${G.jX} ${G.d1X !== undefined ? G.gndY : G.gndY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={1.0}/>
        <SvgFadeIn duration={0.35} delay={1.3}>
          <DiodeVert cx={G.jX} cy={(G.topY + G.gndY) / 2} dirY={-1} label="D₁" labelOffset={18}/>
        </SvgFadeIn>

        {/* C2 — vertical between Vout and gnd */}
        <TraceIn d={`M ${G.voutX} ${G.topY} L ${G.voutX} ${G.gndY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={1.4}/>
        <SvgFadeIn duration={0.35} delay={1.7}>
          <CapVert cx={G.voutX} cy={(G.topY + G.gndY) / 2} label="C₂" labelOffset={16}/>
        </SvgFadeIn>

        {/* Source bottom wire to ground rail */}
        <TraceIn d={`M ${G.srcX} ${G.srcY + G.srcR} L ${G.srcX} ${G.gndY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={0.4}/>

        {/* Ground rail */}
        <TraceIn d={`M ${G.srcX} ${G.gndY} L ${G.voutX} ${G.gndY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.7} delay={0.6}/>

        {/* Ground symbol */}
        <SvgFadeIn duration={0.3} delay={2.0}>
          <line x1={G.srcX - 14} y1={G.gndY + 10} x2={G.srcX + 14} y2={G.gndY + 10}
                stroke="var(--chalk-200)" strokeWidth={2.2}/>
          <line x1={G.srcX - 9} y1={G.gndY + 16} x2={G.srcX + 9} y2={G.gndY + 16}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.srcX - 5} y1={G.gndY + 22} x2={G.srcX + 5} y2={G.gndY + 22}
                stroke="var(--chalk-200)" strokeWidth={1.8}/>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={Math.max(0, 7.4)}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            two diodes, two caps — the charge-pump topology
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Shared schematic painter ────────────────────────────────────────────
// Draws the schematic with selectable "active" loop highlight + diode
// activations. Used by Beats 3 and 4 so the geometry matches the static
// schematic in Beat 2.
function FullSchematic({ G, activeLoop, d1On, d2On, polarity }) {
  // activeLoop ∈ {'neg', 'pos', null}; highlights wires in that loop in rose.
  const wireColor = (loop) => activeLoop === loop ? 'var(--rose-400)' : 'var(--chalk-200)';
  const wireWidth = (loop) => activeLoop === loop ? 2.8 : 2;

  return (
    <g>
      {/* Source */}
      <AcSource cx={G.srcX} cy={G.srcY} r={G.srcR} polarity={polarity}/>

      {/* Top wire pieces: src→C1, C1→D2, D2→Vout */}
      <line x1={G.srcX + G.srcR} y1={G.srcY} x2={G.c1X - 10} y2={G.topY}
            stroke={wireColor('neg')} strokeWidth={wireWidth('neg')}/>
      <CapHoriz cx={G.c1X} cy={G.topY} label="C₁" labelOffset={-18}/>
      {/* C1 → J segment is shared between both loops */}
      <line x1={G.c1X + 10} y1={G.topY} x2={G.jX} y2={G.topY}
            stroke={activeLoop ? 'var(--rose-400)' : 'var(--chalk-200)'}
            strokeWidth={activeLoop ? 2.8 : 2}/>
      <line x1={G.jX} y1={G.topY} x2={G.d2X - 14} y2={G.topY}
            stroke={wireColor('pos')} strokeWidth={wireWidth('pos')}/>
      <DiodeHoriz cx={G.d2X} cy={G.topY} dirX={1} label="D₂" labelOffset={-18}
                  highlight={d2On}/>
      <line x1={G.d2X + 14} y1={G.topY} x2={G.voutX} y2={G.topY}
            stroke={wireColor('pos')} strokeWidth={wireWidth('pos')}/>

      {/* V_out tap */}
      <circle cx={G.voutX} cy={G.topY} r={3.5} fill="var(--amber-300)"/>
      <text x={G.voutX + 18} y={G.topY + 6}
            fill="var(--amber-300)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={16}>V_out</text>

      {/* D1 vertical between J and gnd */}
      <line x1={G.jX} y1={G.topY} x2={G.jX} y2={G.gndY}
            stroke={wireColor('neg')} strokeWidth={wireWidth('neg')}/>
      <DiodeVert cx={G.jX} cy={(G.topY + G.gndY) / 2} dirY={-1} label="D₁" labelOffset={18}
                 highlight={d1On}/>

      {/* C2 vertical between Vout and gnd */}
      <line x1={G.voutX} y1={G.topY} x2={G.voutX} y2={G.gndY}
            stroke={wireColor('pos')} strokeWidth={wireWidth('pos')}/>
      <CapVert cx={G.voutX} cy={(G.topY + G.gndY) / 2} label="C₂" labelOffset={16}/>

      {/* Source bottom wire to ground */}
      <line x1={G.srcX} y1={G.srcY + G.srcR} x2={G.srcX} y2={G.gndY}
            stroke={wireColor('neg')} strokeWidth={wireWidth('neg')}/>

      {/* Ground rail */}
      <line x1={G.srcX} y1={G.gndY} x2={G.voutX} y2={G.gndY}
            stroke={activeLoop ? 'var(--rose-400)' : 'var(--chalk-200)'}
            strokeWidth={activeLoop ? 2.8 : 2}/>

      {/* Ground symbol */}
      <line x1={G.srcX - 14} y1={G.gndY + 10} x2={G.srcX + 14} y2={G.gndY + 10}
            stroke="var(--chalk-200)" strokeWidth={2.2}/>
      <line x1={G.srcX - 9} y1={G.gndY + 16} x2={G.srcX + 9} y2={G.gndY + 16}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={G.srcX - 5} y1={G.gndY + 22} x2={G.srcX + 5} y2={G.gndY + 22}
            stroke="var(--chalk-200)" strokeWidth={1.8}/>
    </g>
  );
}

// ─── Beat 3: Negative half-cycle — D1 conducts, C1 charges ───────────────
function NegativeHalfBeat() {
  const portrait = usePortrait();
  const G = circuitGeometry(portrait);
  const { localTime, duration: spriteDur } = useSprite();

  // Schedule:
  //   0.0 – 1.0  setup: schematic re-mounted in muted state
  //   1.0 – end  charge dots loop along src→C1→D1→gnd, C1 voltage ramps
  const SETUP = 1.0;
  const t = Math.max(0, localTime - SETUP);
  const chargeDur = Math.max(spriteDur - SETUP - 1.0, 6);
  // V_C1 charges exponential-like to V_p over chargeDur. Use 1 - exp(-3t/dur)
  // so the ramp is fast then asymptotic — visually richer than linear.
  const vC1 = VP * (1 - Math.exp(-3 * t / chargeDur));

  // Charge-dot loop animation. The dot cycles every CYCLE seconds along the
  // path src(bottom) → ground → up through D1 → J → through C1 (top wire) →
  // back to source. We render 3 staggered dots for visual richness.
  const CYCLE = 2.2;
  function dotPos(phase) {
    // Phase 0..1 along the closed loop.
    // Segment lengths (rough, for even visual speed):
    // 1: src.bottom → gnd.below.src (vertical short)
    // 2: gnd.below.src → gnd.under.J (horizontal)
    // 3: gnd → J (vertical, up through D1)
    // 4: J → C1.right (horizontal left)
    // 5: through C1 (jump)
    // 6: C1.left → src.top (horizontal left)
    const segs = [
      { len: G.gndY - (G.srcY + G.srcR), kind: 'v', x0: G.srcX, y0: G.srcY + G.srcR, x1: G.srcX, y1: G.gndY },
      { len: G.jX - G.srcX,               kind: 'h', x0: G.srcX, y0: G.gndY,         x1: G.jX,    y1: G.gndY },
      { len: G.gndY - G.topY,             kind: 'v', x0: G.jX,   y0: G.gndY,         x1: G.jX,    y1: G.topY },
      { len: G.jX - (G.c1X + 10),         kind: 'h', x0: G.jX,   y0: G.topY,         x1: G.c1X + 10, y1: G.topY },
      { len: 20,                          kind: 'jump', x0: G.c1X + 10, y0: G.topY,  x1: G.c1X - 10, y1: G.topY },
      { len: G.c1X - 10 - (G.srcX + G.srcR), kind: 'h', x0: G.c1X - 10, y0: G.topY,  x1: G.srcX + G.srcR, y1: G.topY },
    ];
    const total = segs.reduce((s, x) => s + x.len, 0);
    let dist = (phase % 1) * total;
    for (const s of segs) {
      if (dist <= s.len) {
        const f = dist / s.len;
        return {
          x: s.x0 + (s.x1 - s.x0) * f,
          y: s.y0 + (s.y1 - s.y0) * f,
          jumping: s.kind === 'jump',
        };
      }
      dist -= s.len;
    }
    return { x: G.srcX, y: G.srcY, jumping: false };
  }
  const phase0 = (t / CYCLE) % 1;
  const dots = [
    dotPos(phase0),
    dotPos(phase0 + 0.33),
    dotPos(phase0 + 0.66),
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <FullSchematic G={G} activeLoop="neg" d1On d2On={false} polarity={-1}/>
        </SvgFadeIn>

        {/* C1 plate polarity glyphs — top plate gets +, bottom gets − */}
        {t > 0 && (
          <g>
            <text x={G.c1X - 14} y={G.topY - 14}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={14} fontWeight={600}>−</text>
            <text x={G.c1X + 14} y={G.topY - 14}
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={14} fontWeight={600}>+</text>
          </g>
        )}

        {/* Charge dots */}
        {t > 0 && dots.map((p, i) => (
          !p.jumping && (
            <circle key={i} cx={p.x} cy={p.y} r={3.6}
                    fill="var(--amber-400)" opacity={0.9}/>
          )
        ))}

        {/* V_C1 live readout */}
        {t > 0 && (
          <g>
            <text x={G.readoutLeftX} y={G.readoutY}
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.12em">V_C1</text>
            <text x={G.readoutLeftX} y={G.readoutY + 22}
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={20}>{vC1.toFixed(2)} V</text>
            {/* Small bar that fills 0 → V_p */}
            <rect x={G.readoutLeftX} y={G.readoutY + 30}
                  width={120} height={6}
                  fill="rgba(232,220,193,0.12)"/>
            <rect x={G.readoutLeftX} y={G.readoutY + 30}
                  width={120 * (vC1 / VP)} height={6}
                  fill="var(--amber-400)"/>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={Math.max(0, spriteDur - 3.0)}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            C₁ charges to V_p through D₁ — D₂ is off
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Positive half-cycle — D2 conducts, C2 charges to 2V_p ──────
function PositiveHalfBeat() {
  const portrait = usePortrait();
  const G = circuitGeometry(portrait);
  const { localTime, duration: spriteDur } = useSprite();

  const SETUP = 1.0;
  const t = Math.max(0, localTime - SETUP);
  const chargeDur = Math.max(spriteDur - SETUP - 1.0, 6);
  // V_out (across C2) climbs toward 2V_p.
  const vOut = 2 * VP * (1 - Math.exp(-3 * t / chargeDur));

  // Charge-dot loop: src.top → C1 → J → D2 → Vout (C2 top) → gnd → back to src.bottom.
  const CYCLE = 2.2;
  function dotPos(phase) {
    const segs = [
      { len: G.c1X - 10 - (G.srcX + G.srcR), kind: 'h', x0: G.srcX + G.srcR, y0: G.topY, x1: G.c1X - 10, y1: G.topY },
      { len: 20,                              kind: 'jump', x0: G.c1X - 10, y0: G.topY, x1: G.c1X + 10, y1: G.topY },
      { len: G.d2X - 14 - (G.c1X + 10),       kind: 'h', x0: G.c1X + 10, y0: G.topY, x1: G.d2X - 14, y1: G.topY },
      { len: 28,                              kind: 'h', x0: G.d2X - 14, y0: G.topY, x1: G.d2X + 14, y1: G.topY },
      { len: G.voutX - (G.d2X + 14),          kind: 'h', x0: G.d2X + 14, y0: G.topY, x1: G.voutX,    y1: G.topY },
      { len: G.gndY - G.topY,                 kind: 'v', x0: G.voutX, y0: G.topY, x1: G.voutX, y1: G.gndY },
      { len: G.voutX - G.srcX,                kind: 'h', x0: G.voutX, y0: G.gndY, x1: G.srcX,  y1: G.gndY },
      { len: G.gndY - (G.srcY + G.srcR),      kind: 'v', x0: G.srcX,  y0: G.gndY, x1: G.srcX,  y1: G.srcY + G.srcR },
    ];
    const total = segs.reduce((s, x) => s + x.len, 0);
    let dist = (phase % 1) * total;
    for (const s of segs) {
      if (dist <= s.len) {
        const f = dist / s.len;
        return {
          x: s.x0 + (s.x1 - s.x0) * f,
          y: s.y0 + (s.y1 - s.y0) * f,
          jumping: s.kind === 'jump',
        };
      }
      dist -= s.len;
    }
    return { x: G.srcX, y: G.srcY, jumping: false };
  }
  const phase0 = (t / CYCLE) % 1;
  const dots = [
    dotPos(phase0),
    dotPos(phase0 + 0.33),
    dotPos(phase0 + 0.66),
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <FullSchematic G={G} activeLoop="pos" d1On={false} d2On polarity={+1}/>
        </SvgFadeIn>

        {/* C1 polarity is kept from previous half-cycle (top + bottom −).
            The source on its positive swing adds to that, so the junction
            J sits at V_in + V_C1 ≈ 2V_p. */}
        {t > 0 && (
          <g>
            <text x={G.c1X - 14} y={G.topY - 14}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={14} fontWeight={600}>−</text>
            <text x={G.c1X + 14} y={G.topY - 14}
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={14} fontWeight={600}>+</text>
            <text x={G.voutX + 12} y={(G.topY + G.gndY) / 2 - 14}
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={14} fontWeight={600}>+</text>
            <text x={G.voutX + 12} y={(G.topY + G.gndY) / 2 + 22}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={14} fontWeight={600}>−</text>
          </g>
        )}

        {/* Charge dots */}
        {t > 0 && dots.map((p, i) => (
          !p.jumping && (
            <circle key={i} cx={p.x} cy={p.y} r={3.6}
                    fill="var(--amber-400)" opacity={0.9}/>
          )
        ))}

        {/* V_out live readout */}
        {t > 0 && (
          <g>
            <text x={G.readoutRightX} y={G.readoutY}
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.12em">V_out (≈ V_C2)</text>
            <text x={G.readoutRightX} y={G.readoutY + 22}
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={20}>{vOut.toFixed(2)} V</text>
            <rect x={G.readoutRightX} y={G.readoutY + 30}
                  width={120} height={6}
                  fill="rgba(232,220,193,0.12)"/>
            <rect x={G.readoutRightX} y={G.readoutY + 30}
                  width={120 * (vOut / (2 * VP))} height={6}
                  fill="var(--amber-400)"/>
            <text x={G.readoutRightX} y={G.readoutY + 50}
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={11}>target: 2V_p = {(2 * VP).toFixed(1)} V</text>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={Math.max(0, spriteDur - 3.0)}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            source + C₁ in series → 2V_p across C₂
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Takeaway formula ────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        After a few cycles
      </FadeUp>

      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 42 : 54, color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        V<sub style={{ fontSize: '0.6em' }}>out</sub> ≈ 2·V<sub style={{ fontSize: '0.6em' }}>p</sub> − 2·V<sub style={{ fontSize: '0.6em' }}>D</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-200)', letterSpacing: '0.02em',
          textAlign: 'center', maxWidth: portrait ? '26ch' : '52ch', lineHeight: 1.4,
        }}>
        two diode drops cost a little — cascade more pairs for ×3, ×4, …
      </FadeUp>

      <FadeUp duration={0.4} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
        }}>
        (Cockcroft–Walton multiplier)
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
