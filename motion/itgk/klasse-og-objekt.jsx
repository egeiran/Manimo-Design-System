// Klassen som mal, objektet som tegning — Manimo lesson scene.
// Chapter 14 of itgk (Objektorientering). The mental model: a class is the
// blueprint, an object is one stamped copy with its own slots. The scene runs
// a live memory diagram next to the code: a dashed "Hund (mal)" card holds the
// labels but no values; when Hund("Rex", 4) is called, two argument chips fly
// from the call site into a freshly-drawn rex object frame and land in its
// navn/alder slots. The same thing happens for luna right next to rex. Then a
// self arrow swings from the bjeff method body — first pointing at rex,
// reading its navn — then over to luna, reading hers.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10   Manimo hook
//   10–22   Malen — code reveals + blueprint card with empty slots
//   22–36   Stempler rex — two chips fly into rex's slots (GENUINE MOTION)
//   36–48   Stempler luna — second frame appears, chips land (GENUINE MOTION)
//   48–58   self peker — arrow swings rex → luna; print payoff (GENUINE MOTION)
//   58–64   Takeaway
//
// Colour discipline:
//   chalk-100   code text, values
//   chalk-200   labels, name tags
//   chalk-300   dimmed text, hints
//   amber-400   execution highlight, rex frame, primary stamp
//   amber-300   payoff / readouts
//   teal-400    luna frame (second instance — visually distinct)
//
// Milestones inside motion beats are fractions of the sprite's actual duration
// so audio rewires keep the choreography aligned.

const SCENE_DURATION = 75;

const NARRATION = [
  /*  0–10  */ 'Du vil ha to ulike hunder med ulike navn og aldre — uten å skrive samme kode to ganger. En klasse hjelper oss her: én mal, mange objekter.',
  /* 10–22  */ 'Klassen Hund er som en mal. Den sier hvilke felter hver hund skal ha — et navn og en alder — og hvilke metoder den kan svare på, som bjeff. Selve malen lagrer ingen verdier ennå.',
  /* 22–36  */ 'Når vi skriver rex er lik Hund med Rex og fire, stempler malen ut et nytt objekt. Argumentene reiser inn i init og lander i selvets felter: navnet blir Rex, alderen blir fire.',
  /* 36–48  */ 'Vi gjør det samme én gang til. Luna og to lander i et helt nytt objekt med sine egne felter. Nå finnes to hunder side om side, hver med sin egen navnelapp og sin egen alder.',
  /* 48–58  */ 'Når vi sier rex punkt bjeff, kjører metoden — men selv peker på rex sitt objekt, og leser Rex fra rex sitt navnefelt. For luna punkt bjeff svinger selv over til Luna. Samme metode, ulike svar.',
  /* 58–64  */ 'Klassen er malen, objektet er en utgave som lever sitt eget liv, og selv peker alltid på dette objektet her.',
];

const NARRATION_AUDIO = 'audio/klasse-og-objekt/scene.mp3';

// ─── The program ───────────────────────────────────────────────────────────
const CODE = [
  'class Hund:',                            // 1
  '    def __init__(self, navn, alder):',   // 2
  '        self.navn = navn',               // 3
  '        self.alder = alder',             // 4
  '',                                       // 5
  '    def bjeff(self):',                   // 6
  '        return f"{self.navn} sier voff"',// 7
  '',                                       // 8
  'rex = Hund("Rex", 4)',                   // 9
  'luna = Hund("Luna", 2)',                 // 10
  'print(rex.bjeff(), luna.bjeff())',       // 11
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
// Object frames are anchored absolutely so the flying chips can lerp into
// exact slot centres. mal sits at the top of the right column, then rex and
// luna stack below it (landscape: rex right of mal, luna right of rex in a
// tighter horizontal layout would clip — so we keep mal top, rex left, luna
// right of rex).
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 60, codeTop: 200, codeFont: 16,
      // mal card (blueprint)
      malX: 70, malY: 660, malW: 580, malH: 130,
      malNavnY: 700, malAlderY: 740,
      // rex object frame
      rexX: 70, rexY: 820, rexW: 280, rexH: 200,
      rexNavnSlot: { x: 96, y: 880 },
      rexAlderSlot: { x: 96, y: 950 },
      // luna object frame
      lunaX: 370, lunaY: 820, lunaW: 280, lunaH: 200,
      lunaNavnSlot: { x: 396, y: 880 },
      lunaAlderSlot: { x: 396, y: 950 },
      // chip launch point (just below mal card centre)
      launchPoint: { x: 290, y: 800 },
      // output panel
      outX: 70, outY: 1060, outW: 580, outFont: 18,
      slotW: 230, slotH: 50,
      svgW: 720, svgH: 1280,
      // self arrow base (from "bjeff" line in mal card)
      selfBase: { x: 360, y: 770 },
    };
  }
  return {
    codeLeft: 64, codeTop: 160, codeFont: 18,
    // mal card sits top right
    malX: 640, malY: 150, malW: 580, malH: 130,
    malNavnY: 200, malAlderY: 240,
    // rex object frame bottom-left of right column
    rexX: 640, rexY: 320, rexW: 280, rexH: 200,
    rexNavnSlot: { x: 666, y: 380 },
    rexAlderSlot: { x: 666, y: 450 },
    // luna object frame bottom-right of right column
    lunaX: 940, lunaY: 320, lunaW: 280, lunaH: 200,
    lunaNavnSlot: { x: 966, y: 380 },
    lunaAlderSlot: { x: 966, y: 450 },
    // chip launch — just below mal card centre
    launchPoint: { x: 930, y: 300 },
    // output panel bottom of right column
    outX: 640, outY: 555, outW: 580, outFont: 22,
    slotW: 228, slotH: 50,
    svgW: 1280, svgH: 720,
    // self arrow base (from bjeff in mal)
    selfBase: { x: 930, y: 270 },
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none', maxWidth: G.codeLeft === 60 ? 600 : 560 };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Memory-stage pieces (DOM, absolutely positioned) ─────────────────────

// The blueprint card — dashed border, label-only slots, method tag at bottom.
function MalCard({ G, opacity = 1 }) {
  return (
    <div style={{
      position: 'absolute', left: G.malX, top: G.malY, width: G.malW, height: G.malH,
      border: '1.5px dashed var(--amber-400)', borderRadius: 14,
      background: 'rgba(244,184,96,0.06)', opacity,
      transition: 'opacity 0.4s linear',
    }}>
      <div style={{
        position: 'absolute', left: 18, top: 10,
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>
        Hund (mal)
      </div>
      <div style={{
        position: 'absolute', left: 22, top: 38,
        fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16,
        color: 'var(--chalk-200)',
      }}>
        navn: <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal', color: 'var(--chalk-300)' }}>—</span>
        <span style={{ marginLeft: 26 }}>alder: <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal', color: 'var(--chalk-300)' }}>—</span></span>
      </div>
      <div style={{
        position: 'absolute', left: 22, top: 76,
        fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--chalk-200)',
      }}>
        bjeff() <span style={{ color: 'var(--chalk-300)', fontFamily: 'var(--font-sans)', marginLeft: 10 }}>metode</span>
      </div>
    </div>
  );
}

// An object frame — solid border (in `accent`), shows two filled slots.
function ObjectFrame({ x, y, w, h, accent, title, navn, alder, navnFlash, alderFlash, opacity = 1 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      border: `1.5px solid ${accent}`, borderRadius: 14,
      background: 'rgba(0,0,0,0.45)', boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      opacity, transition: 'opacity 0.4s linear',
    }}>
      <div style={{
        position: 'absolute', left: 18, top: 12,
        fontFamily: 'var(--font-mono)', fontSize: 11, color: accent,
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>
        {title}
      </div>
    </div>
  );
}

// A single labelled slot inside an object frame. (Outside the frame so it
// can flash independently and the chip can target exact coords.)
function ObjectSlot({ x, y, w, h, label, value, flash, opacity = 1 }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y - 24, opacity, transition: 'opacity 0.4s linear' }}>
      <div style={{
        fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15,
        color: 'var(--chalk-300)', marginBottom: 4, paddingLeft: 4,
      }}>
        self.{label}
      </div>
      <div style={{
        width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, boxSizing: 'border-box',
        border: `2px solid ${flash ? 'var(--amber-400)' : 'rgba(232,220,193,0.25)'}`,
        fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--chalk-100)',
        background: flash ? 'rgba(244,184,96,0.18)' : 'rgba(0,0,0,0.35)',
        transition: 'background 0.25s linear, border-color 0.25s linear',
      }}>
        {value}
      </div>
    </div>
  );
}

// The travelling chip: lerps from the launch point into the target slot
// centre, on an eased arc, only visible mid-flight.
function FlyingChip({ from, to, t, value, slotW, slotH, accent }) {
  if (t <= 0 || t >= 1) return null;
  const e = easeInOutCubic(t);
  const cx = from.x + (to.x + slotW / 2 - from.x) * e;
  const cy = from.y + (to.y + slotH / 2 - from.y) * e - Math.sin(Math.PI * e) * 36;
  return (
    <div style={{
      position: 'absolute', left: cx - 32, top: cy - 18, width: 64, height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 9, border: `2px solid ${accent}`,
      background: 'rgba(244,184,96,0.18)', boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
      fontFamily: 'var(--font-mono)', fontSize: 20, color: accent,
    }}>
      {value}
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

function Caption({ G, children, show, dy = 0 }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.outX + 4, top: G.outY + 64 + dy,
      fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--chalk-300)',
      maxWidth: '46ch', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

// SVG overlay covering the full stage, for drawing the self arrow into the
// active object's name slot.
function ArrowOverlay({ G, children }) {
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
         width={G.svgW} height={G.svgH} viewBox={`0 0 ${G.svgW} ${G.svgH}`}>
      {children}
    </svg>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="objektorientering"
      title="Klassen som mal, objektet som tegning"
      duration={SCENE_DURATION}
      introEnd={10.75}
      introCaption="Én mal, mange objekter."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.75} end={24.04}>
        <MalenBeat/>
      </Sprite>

      <Sprite start={24.04} end={37.19}>
        <StempleRexBeat/>
      </Sprite>

      <Sprite start={37.19} end={50.33}>
        <StempleLunaBeat/>
      </Sprite>

      <Sprite start={50.33} end={66.06}>
        <SelvPekerBeat/>
      </Sprite>

      <Sprite start={66.06} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Malen ─────────────────────────────────────────────────────────
function MalenBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  return (
    <>
      <CodeBlock
        code={CODE}
        title="hund.py"
        reveal="lines"
        fontSize={G.codeFont}
        duration={4.6}
        delay={0.3}
        style={codePos(G)}
      />
      <FadeUp duration={0.5} delay={5.2} distance={10}>
        <MalCard G={G}/>
      </FadeUp>
      <FadeUp duration={0.5} delay={7.0} distance={8}
        style={{ position: 'absolute', left: G.malX + 4, top: G.malY + G.malH + 12,
                 fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                 color: 'var(--chalk-300)', maxWidth: portrait ? '40ch' : '42ch', lineHeight: 1.5 }}>
        En mal — labels, ingen verdier ennå.
      </FadeUp>
    </>
  );
}

// ─── Beat 3: Stempler rex (GENUINE MOTION) ────────────────────────────────
function StempleRexBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const frameIn = at(0.10);
  const navnLaunch = at(0.30);
  const navnLand = at(0.50);
  const alderLaunch = at(0.55);
  const alderLand = at(0.72);
  const captionAt = at(0.84);

  const navnT = (localTime - navnLaunch) / (navnLand - navnLaunch);
  const alderT = (localTime - alderLaunch) / (alderLand - alderLaunch);

  const navnFilled = navnT >= 1;
  const alderFilled = alderT >= 1;
  const navnFlash = navnFilled && localTime < navnLand + 1.2;
  const alderFlash = alderFilled && localTime < alderLand + 1.2;

  // Highlight line 9 (rex creation) then lines 2-4 (__init__) once the chips
  // start flying — same pattern as funksjonskall-og-scope.
  const line = localTime >= navnLaunch ? '2,3,4' : '9';

  return (
    <>
      <CodeBlock
        code={CODE}
        title="hund.py"
        reveal="all"
        highlight={line}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      {/* Mal card stays visible at the top */}
      <MalCard G={G} opacity={0.6}/>

      {/* rex object frame draws in */}
      {localTime >= frameIn && (
        <>
          <ObjectFrame x={G.rexX} y={G.rexY} w={G.rexW} h={G.rexH}
                       accent="var(--amber-400)" title="rex (objekt)"/>
          <ObjectSlot x={G.rexNavnSlot.x} y={G.rexNavnSlot.y} w={G.slotW} h={G.slotH}
                      label="navn" value={navnFilled ? '"Rex"' : '—'} flash={navnFlash}/>
          <ObjectSlot x={G.rexAlderSlot.x} y={G.rexAlderSlot.y} w={G.slotW} h={G.slotH}
                      label="alder" value={alderFilled ? '4' : '—'} flash={alderFlash}/>
        </>
      )}

      <FlyingChip from={G.launchPoint} to={G.rexNavnSlot} t={navnT}
                  value={'"Rex"'} slotW={G.slotW} slotH={G.slotH}
                  accent="var(--amber-400)"/>
      <FlyingChip from={G.launchPoint} to={G.rexAlderSlot} t={alderT}
                  value="4" slotW={G.slotW} slotH={G.slotH}
                  accent="var(--amber-400)"/>

      {localTime >= captionAt && (
        <div style={{
          position: 'absolute', left: G.rexX + 4, top: G.rexY + G.rexH + 14,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', maxWidth: '36ch', lineHeight: 1.5 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}>rex</span> er stemplet ut.
        </div>
      )}
    </>
  );
}

// ─── Beat 4: Stempler luna (GENUINE MOTION) ───────────────────────────────
function StempleLunaBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const frameIn = at(0.12);
  const navnLaunch = at(0.32);
  const navnLand = at(0.52);
  const alderLaunch = at(0.58);
  const alderLand = at(0.74);
  const captionAt = at(0.86);

  const navnT = (localTime - navnLaunch) / (navnLand - navnLaunch);
  const alderT = (localTime - alderLaunch) / (alderLand - alderLaunch);

  const navnFilled = navnT >= 1;
  const alderFilled = alderT >= 1;
  const navnFlash = navnFilled && localTime < navnLand + 1.2;
  const alderFlash = alderFilled && localTime < alderLand + 1.2;

  const line = localTime >= navnLaunch ? '2,3,4' : '10';

  return (
    <>
      <CodeBlock
        code={CODE}
        title="hund.py"
        reveal="all"
        highlight={line}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      {/* Mal card stays at the top, slightly dimmed */}
      <MalCard G={G} opacity={0.45}/>

      {/* rex object frame from the previous beat, settled and full */}
      <ObjectFrame x={G.rexX} y={G.rexY} w={G.rexW} h={G.rexH}
                   accent="var(--amber-400)" title="rex (objekt)"/>
      <ObjectSlot x={G.rexNavnSlot.x} y={G.rexNavnSlot.y} w={G.slotW} h={G.slotH}
                  label="navn" value={'"Rex"'} flash={false}/>
      <ObjectSlot x={G.rexAlderSlot.x} y={G.rexAlderSlot.y} w={G.slotW} h={G.slotH}
                  label="alder" value="4" flash={false}/>

      {/* luna object frame draws in */}
      {localTime >= frameIn && (
        <>
          <ObjectFrame x={G.lunaX} y={G.lunaY} w={G.lunaW} h={G.lunaH}
                       accent="var(--teal-400)" title="luna (objekt)"/>
          <ObjectSlot x={G.lunaNavnSlot.x} y={G.lunaNavnSlot.y} w={G.slotW} h={G.slotH}
                      label="navn" value={navnFilled ? '"Luna"' : '—'} flash={navnFlash}/>
          <ObjectSlot x={G.lunaAlderSlot.x} y={G.lunaAlderSlot.y} w={G.slotW} h={G.slotH}
                      label="alder" value={alderFilled ? '2' : '—'} flash={alderFlash}/>
        </>
      )}

      <FlyingChip from={G.launchPoint} to={G.lunaNavnSlot} t={navnT}
                  value={'"Luna"'} slotW={G.slotW} slotH={G.slotH}
                  accent="var(--teal-400)"/>
      <FlyingChip from={G.launchPoint} to={G.lunaAlderSlot} t={alderT}
                  value="2" slotW={G.slotW} slotH={G.slotH}
                  accent="var(--teal-400)"/>

      {localTime >= captionAt && (
        <div style={{
          position: 'absolute', left: G.rexX + 4, top: G.rexY + G.rexH + 14,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', maxWidth: '48ch', lineHeight: 1.5 }}>
          To utgaver — <span style={{ color: 'var(--teal-400)' }}>uavhengige</span> liv.
        </div>
      )}
    </>
  );
}

// ─── Beat 5: Selv peker (GENUINE MOTION) ──────────────────────────────────
function SelvPekerBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const swingTo = at(0.42);  // arrow swings from rex to luna
  const outputAt = at(0.72);

  // The self arrow target lerps from rex's navn slot to luna's navn slot.
  const swingT = clamp((localTime - swingTo) / 0.7, 0, 1);
  const tgtRex = { x: G.rexNavnSlot.x + G.slotW / 2, y: G.rexNavnSlot.y + G.slotH / 2 };
  const tgtLuna = { x: G.lunaNavnSlot.x + G.slotW / 2, y: G.lunaNavnSlot.y + G.slotH / 2 };
  const e = easeInOutCubic(swingT);
  const tx = tgtRex.x + (tgtLuna.x - tgtRex.x) * e;
  const ty = tgtRex.y + (tgtLuna.y - tgtRex.y) * e;

  const lookingAtLuna = swingT >= 0.5;

  return (
    <>
      <CodeBlock
        code={CODE}
        title="hund.py"
        reveal="all"
        highlight="11"
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      <MalCard G={G} opacity={0.45}/>

      <ObjectFrame x={G.rexX} y={G.rexY} w={G.rexW} h={G.rexH}
                   accent="var(--amber-400)" title="rex (objekt)"
                   opacity={lookingAtLuna ? 0.55 : 1}/>
      <ObjectSlot x={G.rexNavnSlot.x} y={G.rexNavnSlot.y} w={G.slotW} h={G.slotH}
                  label="navn" value={'"Rex"'}
                  flash={!lookingAtLuna && localTime > swingTo - 1.5}
                  opacity={lookingAtLuna ? 0.55 : 1}/>
      <ObjectSlot x={G.rexAlderSlot.x} y={G.rexAlderSlot.y} w={G.slotW} h={G.slotH}
                  label="alder" value="4" flash={false}
                  opacity={lookingAtLuna ? 0.55 : 1}/>

      <ObjectFrame x={G.lunaX} y={G.lunaY} w={G.lunaW} h={G.lunaH}
                   accent="var(--teal-400)" title="luna (objekt)"
                   opacity={lookingAtLuna ? 1 : 0.55}/>
      <ObjectSlot x={G.lunaNavnSlot.x} y={G.lunaNavnSlot.y} w={G.slotW} h={G.slotH}
                  label="navn" value={'"Luna"'}
                  flash={lookingAtLuna && localTime < swingTo + 2.5}
                  opacity={lookingAtLuna ? 1 : 0.55}/>
      <ObjectSlot x={G.lunaAlderSlot.x} y={G.lunaAlderSlot.y} w={G.slotW} h={G.slotH}
                  label="alder" value="2" flash={false}
                  opacity={lookingAtLuna ? 1 : 0.55}/>

      {/* self arrow swings between targets */}
      <ArrowOverlay G={G}>
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={G.selfBase.x} y1={G.selfBase.y} x2={tx} y2={ty}
                stroke="var(--amber-400)" strokeWidth={2.5}/>
          <polygon points={`${tx-8},${ty-6} ${tx},${ty} ${tx-8},${ty+6}`}
                   fill="var(--amber-400)"/>
          <text x={G.selfBase.x - 6} y={G.selfBase.y - 8}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18} textAnchor="end">
            self
          </text>
        </SvgFadeIn>
      </ArrowOverlay>

      <OutputRow G={G} text='Rex sier voff Luna sier voff' show={localTime >= outputAt}/>

      {localTime >= outputAt + 0.8 && (
        <div style={{
          position: 'absolute', left: G.outX + 4, top: G.outY + 70,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', maxWidth: '50ch', lineHeight: 1.5 }}>
          Samme metode — <span style={{ color: 'var(--chalk-200)' }}>ulike svar.</span>
        </div>
      )}
    </>
  );
}

// ─── Beat 6: Takeaway ──────────────────────────────────────────────────────
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
        class · self
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '30ch', lineHeight: 1.25 }}>
        Klassen er <span style={{ color: 'var(--amber-300)' }}>malen</span> — objektet er utgaven.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 18,
                 color: 'var(--amber-300)', fontVariantLigatures: 'none' }}>
        self peker på dette objektet her
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
