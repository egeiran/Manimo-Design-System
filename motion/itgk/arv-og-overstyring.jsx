// Arv: barnet låner foreldrenes triks — Manimo lesson scene.
// Chapter 14 of itgk (Objektorientering, TDT4109). The classic intro-OO confusion:
// "If Hund inherits from Dyr, where does presenter actually live, and when does
// my own version of lyd replace the inherited one?" The scene runs a live
// memory-style diagram next to the code: two class blocks (Dyr on top with
// presenter + lyd, Hund below with `pass`) connected by an inheritance arrow.
// When `rex.presenter()` is called, a lookup chip physically flies from the
// call site to the Hund block, scans (rose pulse — miss), then slides UP the
// arrow to Dyr and lands on `presenter` (amber pulse — hit). Then Hund grows
// its own `def lyd(self): return "voff"` row, and the same lookup for
// `rex.lyd()` stops dead at Hund — no walk up the chain. That's overriding.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–9      Manimo hook
//    9–22     Arven — class Dyr drawn, class Hund(Dyr) drawn, inheritance arrow
//   22–37     Oppslaget — lookup chip walks UP Hund → Dyr (GENUINE MOTION)
//   37–52     Overstyring — Hund grows its own lyd, lookup stops there (GENUINE MOTION)
//   52–62     Takeaway
//
// Colour discipline:
//   chalk-100  class headings, takeaway
//   chalk-200  body method text, names
//   chalk-300  dimmed text, hints
//   amber-400  Dyr block + execution highlight on inherited hit
//   amber-300  payoff readouts / output
//   teal-400   Hund block (the inheriting child)
//   rose-400   the override (Hund's own lyd) + "miss" pulse on first lookup
//
// Milestones inside the two motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 67;

const NARRATION = [
  /*  0–9   */ 'Du har en Hund-klasse og en Katt-klasse. Begge skal kunne presentere seg, men hund og katt har forskjellige lyder. Må vi skrive den samme presenter-koden to ganger?',
  /*  9–22  */ 'Vi lager en klasse Dyr som har det felles. Den kan både presentere seg selv og lage en lyd. Når vi sier at Hund arver fra Dyr, betyr det at hver hund automatisk får disse evnene gratis — uten å skrive dem på nytt.',
  /* 22–37  */ 'Vi kaller presenter på rex. Python ser først i Hund-klassen. Den finner ingen presenter der. Så går oppslaget oppover langs arvepilen til Dyr — der ligger presenter. Den kjøres, og Rex sier: hei, jeg er Rex.',
  /* 37–52  */ 'Nå legger vi inn en egen lyd-metode i Hund. Når vi kaller lyd på rex, finner Python den med en gang i Hund og stopper. Den går aldri videre opp i kjeden. Hundens voff vinner over den generelle lyden. Det er overstyring.',
  /* 52–62  */ 'Arv lar barnet låne foreldrenes evner. Overstyring lar barnet si: dette gjør jeg selv.',
];

const NARRATION_AUDIO = 'audio/arv-og-overstyring/scene.mp3';

// ─── The two programs ──────────────────────────────────────────────────────
// Before override: Hund inherits everything from Dyr; pass body. Used in
// beats 2 and 3 to motivate the lookup walking UP from Hund into Dyr.
const CODE_PRE = [
  'class Dyr:',                                   // 1
  '    def __init__(self, navn):',                // 2
  '        self.navn = navn',                     // 3
  '    def presenter(self):',                     // 4
  '        return f"Hei, jeg er {self.navn}"',    // 5
  '    def lyd(self):',                           // 6
  '        return "et generelt dyrelyd"',         // 7
  '',                                             // 8
  'class Hund(Dyr):',                             // 9
  '    pass',                                     // 10
  '',                                             // 11
  'rex = Hund("Rex")',                            // 12
  'print(rex.presenter())',                       // 13
].join('\n');

// After override: Hund grows its own lyd. Used in beat 4 to show the lookup
// stopping at Hund instead of climbing into Dyr.
const CODE_POST = [
  'class Dyr:',                                   // 1
  '    def __init__(self, navn):',                // 2
  '        self.navn = navn',                     // 3
  '    def presenter(self):',                     // 4
  '        return f"Hei, jeg er {self.navn}"',    // 5
  '    def lyd(self):',                           // 6
  '        return "et generelt dyrelyd"',         // 7
  '',                                             // 8
  'class Hund(Dyr):',                             // 9
  '    def lyd(self):',                           // 10
  '        return "voff"',                        // 11
  '',                                             // 12
  'rex = Hund("Rex")',                            // 13
  'print(rex.lyd())',                             // 14
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
// The lookup chip lerps between class blocks, so we anchor the geometry as
// absolute pixel coordinates and derive everything else from them.
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 56, codeTop: 200, codeFont: 15,
      dyrX: 70, dyrY: 580, dyrW: 580, dyrH: 200,
      hundX: 70, hundY: 810, hundW: 580, hundH: 140,
      callPt: { x: 200, y: 545 },
      // Output sits ABOVE the bottom-left corner Manimo (which occupies
      // y≈1106–1184 in portrait per SceneChrome's PORTRAIT_SAFE inset),
      // shifted right past Manimo's x range so the caption never collides.
      outX: 160, outY: 980, outW: 510, outFont: 20,
      svgW: 720, svgH: 1280,
      hdrFont: 18, methFont: 16, captionFont: 13,
    };
  }
  return {
    codeLeft: 56, codeTop: 175, codeFont: 18,
    dyrX: 700, dyrY: 130, dyrW: 510, dyrH: 250,
    hundX: 700, hundY: 410, hundW: 510, hundH: 180,
    callPt: { x: 380, y: 540 },
    outX: 700, outY: 610, outW: 510, outFont: 22,
    svgW: 1280, svgH: 720,
    hdrFont: 19, methFont: 18, captionFont: 14,
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Class block — header + method rows ───────────────────────────────────
// Renders as a DOM panel so we can pulse rows independently. `rows` is an
// array of {label, kind} where kind ∈ 'init' | 'method' | 'override' | 'pass'.
// `hitRow` (index) highlights a specific row amber; `missPulse` flashes the
// whole block border rose. `overrideRowDelay` lets the override row draw in
// during beat 4 instead of appearing instantly.
function ClassBlock({
  G, x, y, w, h, header, parent, accent, rows,
  hitRow = -1, missPulse = 0, overrideRowDelay = null,
  localTime = 0,
}) {
  const borderColor = missPulse > 0
    ? `rgba(232,122,144,${0.6 + 0.4 * missPulse})`
    : accent;
  const bg = missPulse > 0
    ? `rgba(232,122,144,${0.10 + 0.10 * missPulse})`
    : 'rgba(0,0,0,0.45)';
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      border: `2px solid ${borderColor}`, borderRadius: 14,
      background: bg, boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      transition: 'border-color 0.25s linear, background 0.25s linear',
      padding: '14px 18px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, color: accent,
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>
        klasse
      </div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        fontSize: G.hdrFont + 6, color: 'var(--chalk-100)', lineHeight: 1.1,
        marginBottom: 6,
      }}>
        {header}
        {parent && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontStyle: 'normal',
            fontSize: G.hdrFont - 1, color: 'var(--chalk-300)', marginLeft: 8,
          }}>
            ({parent})
          </span>
        )}
      </div>
      {rows.map((row, i) => {
        const isHit = i === hitRow;
        const isOverride = row.kind === 'override';
        // Override row pops in mid-beat instead of being there from the start.
        let opacity = 1;
        if (isOverride && overrideRowDelay !== null) {
          const t = (localTime - overrideRowDelay) / 0.5;
          opacity = Math.max(0, Math.min(1, t));
        }
        const rowColor = row.kind === 'pass'
          ? 'var(--chalk-300)'
          : isOverride
            ? 'var(--rose-300)'
            : (row.dimmed ? 'var(--chalk-300)' : 'var(--chalk-200)');
        const rowBg = isHit
          ? (isOverride ? 'rgba(244,90,90,0.18)' : 'rgba(244,184,96,0.18)')
          : 'transparent';
        const rowBorder = isHit
          ? (isOverride ? 'var(--rose-400)' : 'var(--amber-400)')
          : 'transparent';
        return (
          <div key={i} style={{
            opacity,
            transition: 'opacity 0.4s linear, background 0.25s linear',
            fontFamily: 'var(--font-mono)', fontSize: G.methFont,
            color: rowColor,
            padding: '3px 8px', borderRadius: 6,
            background: rowBg,
            border: `1.5px solid ${rowBorder}`,
            fontVariantLigatures: 'none',
            textDecoration: row.strike ? 'line-through' : 'none',
            textDecorationColor: 'rgba(232,220,193,0.4)',
            textDecorationThickness: 1.5,
          }}>
            {row.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Inheritance arrow — Hund up to Dyr ───────────────────────────────────
// Drawn into an SVG layer absolutely positioned on the stage so the lookup
// chip can land on the same coordinates.
function InheritanceArrow({ G, color, delay }) {
  const cx = G.hundX + G.hundW / 2;
  const y1 = G.hundY - 6;
  const y2 = G.dyrY + G.dyrH + 6;
  return (
    <Arrow
      x1={cx} y1={y1} x2={cx} y2={y2}
      color={color} strokeWidth={2.4} headSize={11}
      duration={0.7} delay={delay}
    />
  );
}

// ─── Lookup chip — a small "🔎 presenter" capsule that lerps along a path ─
// `from` and `to` are absolute stage coordinates. The chip is visible only
// when 0 < t < 1, eases with easeInOutCubic, and arcs slightly when moving
// vertically along the inheritance arrow so the eye can follow it.
function LookupChip({ from, to, t, label, color, arc = false }) {
  if (t <= 0 || t >= 1) return null;
  const e = easeInOutCubic(t);
  const cx = from.x + (to.x - from.x) * e;
  let cy = from.y + (to.y - from.y) * e;
  if (arc) {
    // Side-arc so the chip doesn't pass through the class blocks.
    cy = cy + Math.sin(Math.PI * e) * 0;
    const dx = -Math.sin(Math.PI * e) * 40;
    return chipAt(cx + dx, cy, label, color);
  }
  return chipAt(cx, cy, label, color);
}

function chipAt(cx, cy, label, color) {
  return (
    <div style={{
      position: 'absolute', left: cx - 80, top: cy - 18,
      minWidth: 160, height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '0 14px',
      borderRadius: 18, border: `2px solid ${color}`,
      background: 'rgba(0,0,0,0.7)', boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
      fontFamily: 'var(--font-mono)', fontSize: 15, color,
      whiteSpace: 'nowrap', boxSizing: 'border-box',
    }}>
      <span style={{ opacity: 0.8 }}>oppslag:</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function OutputRow({ G, text, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.outX, top: G.outY, width: G.outW, boxSizing: 'border-box',
      display: 'flex', alignItems: 'baseline', gap: 14, padding: '10px 18px',
      borderRadius: 10, border: '1.5px solid var(--amber-400)', background: 'rgba(244,184,96,0.10)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>utskrift</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: G.outFont,
                     color: 'var(--amber-300)', whiteSpace: 'pre' }}>{text}</span>
    </div>
  );
}

function Caption({ G, x, y, w, children, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w,
      fontFamily: 'var(--font-sans)', fontSize: G.captionFont,
      color: 'var(--chalk-300)', maxWidth: '46ch', lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="objektorientering"
      title="Arv: barnet låner foreldrenes triks"
      duration={SCENE_DURATION}
      introEnd={11.38}
      introCaption="Skal vi skrive det samme to ganger?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={11.38} end={26.74}>
        <ArvenBeat/>
      </Sprite>

      <Sprite start={26.74} end={43.55}>
        <OppslagBeat/>
      </Sprite>

      <Sprite start={43.55} end={58.94}>
        <OverstyringBeat/>
      </Sprite>

      <Sprite start={58.94} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Helpers — row sets for Dyr and Hund ──────────────────────────────────
function dyrRows({ lydDimmed = false, lydStrike = false } = {}) {
  return [
    { label: 'def __init__(self, navn)', kind: 'init' },
    { label: 'def presenter(self)', kind: 'method' },
    { label: 'def lyd(self)', kind: 'method', dimmed: lydDimmed, strike: lydStrike },
  ];
}

function hundRowsPass() {
  return [{ label: 'pass', kind: 'pass' }];
}

function hundRowsOverride() {
  return [{ label: 'def lyd(self):  return "voff"', kind: 'override' }];
}

// ─── Beat 2: Arven — draw the two class blocks and the inheritance arrow ──
function ArvenBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  return (
    <>
      <CodeBlock
        code={CODE_PRE}
        title="dyr.py"
        reveal="lines"
        fontSize={G.codeFont}
        duration={3.6}
        delay={0.3}
        style={codePos(G)}
      />

      {/* Dyr block draws in first (the parent) */}
      {localTime >= at(0.10) && (
        <FadeUp duration={0.5} delay={0} distance={10}>
          <ClassBlock
            G={G} x={G.dyrX} y={G.dyrY} w={G.dyrW} h={G.dyrH}
            header="Dyr" parent={null} accent="var(--amber-400)"
            rows={dyrRows()} localTime={localTime}
          />
        </FadeUp>
      )}

      {/* Hund block draws in second (the child) */}
      {localTime >= at(0.36) && (
        <FadeUp duration={0.5} delay={0} distance={10}>
          <ClassBlock
            G={G} x={G.hundX} y={G.hundY} w={G.hundW} h={G.hundH}
            header="Hund" parent="Dyr" accent="var(--teal-400)"
            rows={hundRowsPass()} localTime={localTime}
          />
        </FadeUp>
      )}

      {/* Inheritance arrow (Hund up to Dyr) — drawn last */}
      {localTime >= at(0.50) && (
        <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
             width={G.svgW} height={G.svgH} viewBox={`0 0 ${G.svgW} ${G.svgH}`}>
          <InheritanceArrow G={G} color="var(--teal-400)" delay={0}/>
        </svg>
      )}

      <Caption
        G={G}
        x={portrait ? G.hundX + 4 : G.hundX + 4}
        y={portrait ? G.hundY + G.hundH + 16 : G.hundY + G.hundH + 18}
        w={G.hundW}
        show={localTime >= at(0.78)}
      >
        Hund arver <span style={{ color: 'var(--chalk-200)' }}>presenter</span> og{' '}
        <span style={{ color: 'var(--chalk-200)' }}>lyd</span> gratis fra Dyr.
      </Caption>
    </>
  );
}

// ─── Beat 3: Oppslaget — lookup walks UP from Hund to Dyr ─────────────────
// GENUINE DATA-MODEL MOTION: a lookup chip moves from the call site to the
// Hund block (rose pulse, no match), then slides UP the arrow to Dyr where
// it finds `presenter` and lights it up amber. This IS Python's method
// resolution order, made visible.
function OppslagBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Animation milestones (fractions of T):
  //   0.00–0.10  highlight call line in code
  //   0.10–0.28  chip flies from call → Hund block top
  //   0.28–0.42  Hund border pulses rose (no presenter here)
  //   0.42–0.58  chip slides UP the arrow to Dyr block
  //   0.58–0.72  Dyr.presenter row pulses amber (hit)
  //   0.72–1.00  output appears and stays
  const flightDownStart = at(0.10);
  const flightDownEnd = at(0.28);
  const missStart = at(0.28);
  const missEnd = at(0.42);
  const flightUpStart = at(0.42);
  const flightUpEnd = at(0.58);
  const hitStart = at(0.58);
  const outputStart = at(0.72);

  // Anchor points
  const hundAnchor = {
    x: G.hundX + G.hundW / 2,
    y: G.hundY + 28,
  };
  const dyrAnchor = {
    x: G.dyrX + G.dyrW / 2,
    y: G.dyrY + G.dyrH - 60,
  };

  const flightDownT = (localTime - flightDownStart) / (flightDownEnd - flightDownStart);
  const flightUpT = (localTime - flightUpStart) / (flightUpEnd - flightUpStart);

  // Hund miss pulse 0 → 1 → 0 over the miss window.
  let missPulse = 0;
  if (localTime >= missStart && localTime < missEnd) {
    const m = (localTime - missStart) / (missEnd - missStart);
    missPulse = m < 0.5 ? m * 2 : (1 - m) * 2;
  }

  // Dyr hit: highlight the presenter row (index 1) after hitStart.
  const dyrHitRow = localTime >= hitStart ? 1 : -1;

  return (
    <>
      <CodeBlock
        code={CODE_PRE}
        title="dyr.py"
        reveal="all"
        highlight="13"
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      {/* Dyr block — amber accent, with optional hit highlight on presenter row */}
      <ClassBlock
        G={G} x={G.dyrX} y={G.dyrY} w={G.dyrW} h={G.dyrH}
        header="Dyr" parent={null} accent="var(--amber-400)"
        rows={dyrRows()} hitRow={dyrHitRow}
        localTime={localTime}
      />

      {/* Hund block — teal accent, pulses rose on miss */}
      <ClassBlock
        G={G} x={G.hundX} y={G.hundY} w={G.hundW} h={G.hundH}
        header="Hund" parent="Dyr" accent="var(--teal-400)"
        rows={hundRowsPass()}
        missPulse={missPulse}
        localTime={localTime}
      />

      {/* Inheritance arrow */}
      <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
           width={G.svgW} height={G.svgH} viewBox={`0 0 ${G.svgW} ${G.svgH}`}>
        <InheritanceArrow G={G} color="var(--teal-400)" delay={0}/>
        {/* Highlight the arrow during the upward walk */}
        {localTime >= flightUpStart && localTime < flightUpEnd + 0.5 && (
          <line
            x1={G.hundX + G.hundW / 2} y1={G.hundY - 6}
            x2={G.dyrX + G.dyrW / 2} y2={G.dyrY + G.dyrH + 6}
            stroke="var(--amber-400)" strokeWidth={3.5}
            strokeLinecap="round" opacity={0.7}
          />
        )}
      </svg>

      {/* Lookup chip — down then up */}
      <LookupChip
        from={G.callPt} to={hundAnchor}
        t={flightDownT} label="presenter" color="var(--rose-400)"
      />
      <LookupChip
        from={hundAnchor} to={dyrAnchor}
        t={flightUpT} label="presenter" color="var(--amber-400)"
        arc={true}
      />

      <OutputRow G={G} text="Hei, jeg er Rex" show={localTime >= outputStart}/>
      <Caption
        G={G} x={G.outX + 4} y={G.outY + 70} w={G.outW}
        show={localTime >= outputStart + 0.6}
      >
        Hund hadde ingen <span style={{ color: 'var(--chalk-200)' }}>presenter</span> — oppslaget gikk{' '}
        <span style={{ color: 'var(--amber-300)' }}>opp arvepilen</span> til Dyr.
      </Caption>
    </>
  );
}

// ─── Beat 4: Overstyring — Hund grows its own lyd, lookup stops there ─────
// GENUINE DATA-MODEL MOTION: a fresh row "def lyd(self): return 'voff'"
// fades into the Hund block, and the lookup chip for `rex.lyd()` flies to
// Hund and STOPS there — it does not walk up the arrow. Dyr.lyd is shown
// struck through and dimmed: present, but not consulted.
function OverstyringBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Milestones:
  //   0.00–0.18  override row draws into Hund
  //   0.18–0.30  highlight call line in code
  //   0.30–0.46  chip flies from call → Hund block, lands on lyd row
  //   0.46–0.62  Hund.lyd row pulses rose (hit, stops here)
  //   0.62–1.00  output "voff" appears
  const overrideAppear = at(0.05);
  const flightStart = at(0.28);
  const flightEnd = at(0.46);
  const hitStart = at(0.46);
  const outputStart = at(0.62);
  const dimDyrAt = at(0.55);

  const hundLydAnchor = {
    x: G.hundX + G.hundW / 2,
    y: G.hundY + G.hundH - 36,
  };
  const flightT = (localTime - flightStart) / (flightEnd - flightStart);

  // Hund's override row hits index 0 (the only method row).
  const hundHitRow = localTime >= hitStart ? 0 : -1;

  return (
    <>
      <CodeBlock
        code={CODE_POST}
        title="dyr.py"
        reveal="all"
        highlight="14"
        accent="var(--rose-400)"
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      {/* Dyr block — lyd row dims once Hund's override is in place */}
      <ClassBlock
        G={G} x={G.dyrX} y={G.dyrY} w={G.dyrW} h={G.dyrH}
        header="Dyr" parent={null} accent="var(--amber-400)"
        rows={dyrRows({
          lydDimmed: localTime >= dimDyrAt,
          lydStrike: localTime >= dimDyrAt,
        })}
        localTime={localTime}
      />

      {/* Hund block — teal, gains its own lyd row that pops in at overrideAppear */}
      <ClassBlock
        G={G} x={G.hundX} y={G.hundY} w={G.hundW} h={G.hundH}
        header="Hund" parent="Dyr" accent="var(--teal-400)"
        rows={hundRowsOverride()}
        overrideRowDelay={overrideAppear}
        hitRow={hundHitRow}
        localTime={localTime}
      />

      {/* Inheritance arrow — visually present but unused this beat */}
      <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
           width={G.svgW} height={G.svgH} viewBox={`0 0 ${G.svgW} ${G.svgH}`}>
        <InheritanceArrow G={G} color="var(--chalk-300)" delay={0}/>
      </svg>

      {/* Lookup chip — flies from call to Hund and STOPS (no second flight up) */}
      <LookupChip
        from={G.callPt} to={hundLydAnchor}
        t={flightT} label="lyd" color="var(--rose-400)"
      />

      <OutputRow G={G} text="voff" show={localTime >= outputStart}/>
      <Caption
        G={G} x={G.outX + 4} y={G.outY + 70} w={G.outW}
        show={localTime >= outputStart + 0.5}
      >
        Hund stopper oppslaget — <span style={{ color: 'var(--rose-300)' }}>voff</span>{' '}
        vinner over Dyr sin lyd.
      </Caption>
    </>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
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
        arv og overstyring
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 26 : 38, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '32ch', lineHeight: 1.25 }}>
        Arv <span style={{ color: 'var(--teal-300)' }}>låner</span> —
        overstyring sier: <span style={{ color: 'var(--rose-300)' }}>det gjør jeg selv</span>.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 18,
                 color: 'var(--amber-300)', fontVariantLigatures: 'none' }}>
        oppslag stopper på første treff
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
