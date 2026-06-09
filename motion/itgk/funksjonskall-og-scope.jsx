// Funksjonskall: kopien og den lille verdenen — Manimo lesson scene.
// Chapter 6 of itgk (Funksjoner, moduler og scope). The classic confusion:
// "I changed it inside the function — why is my variable unchanged outside?"
// The scene runs a live memory stage next to the code: the value 5 physically
// flies from the global `n` box into the parameter `x` box of a freshly drawn
// "dobler's little world" frame, doubles to 10 in there while `n` sits calm,
// then 10 flies back into `svar` on return — and the frame evaporates, taking
// `x` with it.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10     Manimo hook
//   10–22     Kode — program reveals + global frame with n and svar
//   22–37     Kallet — frame draws, 5 flies n→x, x doubles (GENUINE MOTION)
//   37–52     Retur — 10 flies x→svar, frame dies, print shows 5 10 (GENUINE MOTION)
//   52–60     Takeaway
//
// Colour discipline:
//   chalk-100  code text, values
//   chalk-300  dimmed text, hints
//   amber-400  execution highlight, dobler frame, chip
//   amber-300  payoff / readouts
//   rose-400   (reserved — n-untouched emphasis uses calm chalk instead)
//
// Milestones inside the two motion beats are fractions of the sprite's actual
// duration, so audio rewires keep the choreography aligned.

const SCENE_DURATION = 67;

const NARRATION = [
  /*  0–10  */ 'Her er en felle nesten alle går i: du sender variabelen din inn i en funksjon, funksjonen endrer den — og etterpå er variabelen helt uendret. Hva skjedde?',
  /* 10–22  */ 'Funksjonen dobler tar imot et tall, ganger det med to, og returnerer resultatet. Under definisjonen setter vi n til fem, kaller funksjonen med n som argument, og skriver ut både n og svaret.',
  /* 22–37  */ 'Se på kallet. Funksjonen får sin egen lille verden, og verdien fem kopieres inn i parameteren x. Det er en kopi som reiser — ikke variabelen selv. Inne i verdenen dobles x til ti, mens n der ute ikke merker noen ting.',
  /* 37–52  */ 'Return sender verdien ti tilbake til den som kalte, og den lander i svar. Så er funksjonen ferdig — hele den lille verdenen forsvinner, med x i den. Utskriften viser fem og ti. n er urørt.',
  /* 52–60  */ 'Funksjonen får en kopi av verdien, ikke selve variabelen. Vil du ha noe ut av en funksjon, må du returnere det.',
];

const NARRATION_AUDIO = 'audio/funksjonskall-og-scope/scene.mp3';

// ─── The program ───────────────────────────────────────────────────────────
const CODE = [
  'def dobler(x):',     // 1
  '    x = x * 2',      // 2
  '    return x',       // 3
  '',                   // 4
  'n = 5',              // 5
  'svar = dobler(n)',   // 6
  'print(n, svar)',     // 7
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
// Memory-stage anchors are absolute canvas coordinates so the flying chip can
// lerp between exact slot centres.
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 96, codeTop: 200, codeFont: 23,
      frameX: 70, frameW: 580, frameH: 148,
      globalY: 620, doblerY: 818,
      slotN: { x: 106, y: 668 }, slotSvar: { x: 380, y: 668 },
      slotX: { x: 106, y: 866 },
      outX: 70, outY: 1010, outW: 580,
      slotW: 116, slotH: 56,
    };
  }
  return {
    codeLeft: 96, codeTop: 180, codeFont: 25,
    frameX: 680, frameW: 510, frameH: 150,
    globalY: 160, doblerY: 372,
    slotN: { x: 716, y: 210 }, slotSvar: { x: 960, y: 210 },
    slotX: { x: 716, y: 422 },
    outX: 680, outY: 578, outW: 510,
    slotW: 120, slotH: 58,
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Memory-stage pieces (DOM, absolutely positioned) ─────────────────────
function MemFrame({ x, y, w, h, title, accent, opacity = 1 }) {
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

// A named slot: serif-italic name above a mono value box, at absolute canvas
// coords (top-left of the box).
function VarSlot({ x, y, w, h, name, value, flash, opacity = 1 }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y - 24, opacity, transition: 'opacity 0.4s linear' }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 17,
                    color: 'var(--chalk-300)', marginBottom: 4, textAlign: 'center', width: w }}>
        {name}
      </div>
      <div style={{
        width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, boxSizing: 'border-box',
        border: `2px solid ${flash ? 'var(--amber-400)' : 'rgba(232,220,193,0.25)'}`,
        fontFamily: 'var(--font-mono)', fontSize: 26, color: 'var(--chalk-100)',
        background: flash ? 'rgba(244,184,96,0.16)' : 'rgba(0,0,0,0.35)',
        transition: 'background 0.25s linear, border-color 0.25s linear',
      }}>
        {value}
      </div>
    </div>
  );
}

// The travelling value: lerps between two slot centres on an eased path with
// a little arc, visible only mid-flight.
function FlyingChip({ from, to, t, value, slotW, slotH }) {
  if (t <= 0 || t >= 1) return null;
  const e = easeInOutCubic(t);
  const cx = from.x + slotW / 2 + (to.x - from.x) * e;
  const cy = from.y + slotH / 2 + (to.y - from.y) * e - Math.sin(Math.PI * e) * 36;
  return (
    <div style={{
      position: 'absolute', left: cx - 26, top: cy - 20, width: 52, height: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 10, border: '2px solid var(--amber-400)',
      background: 'rgba(244,184,96,0.18)', boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
      fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--amber-300)',
    }}>
      {value}
    </div>
  );
}

function OutputRow({ x, y, w, text, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, boxSizing: 'border-box',
      display: 'flex', alignItems: 'baseline', gap: 14, padding: '10px 18px',
      borderRadius: 10, border: '1.5px solid var(--amber-400)', background: 'rgba(244,184,96,0.10)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>utskrift</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: 'var(--amber-300)' }}>{text}</span>
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="funksjoner"
      title="Funksjonskall: kopien og den lille verdenen"
      duration={SCENE_DURATION}
      introEnd={11.65}
      introCaption="Hvorfor endret ikke variabelen min seg?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={11.65} end={25.95}>
        <KodeBeat/>
      </Sprite>

      <Sprite start={25.95} end={43.23}>
        <KalletBeat/>
      </Sprite>

      <Sprite start={43.23} end={57.88}>
        <ReturBeat/>
      </Sprite>

      <Sprite start={57.88} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Kode ──────────────────────────────────────────────────────────
function KodeBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  return (
    <>
      <CodeBlock
        code={CODE}
        title="dobler.py"
        reveal="lines"
        fontSize={G.codeFont}
        duration={4.6}
        delay={0.3}
        style={codePos(G)}
      />
      <FadeUp duration={0.5} delay={5.0} distance={10}>
        <MemFrame x={G.frameX} y={G.globalY} w={G.frameW} h={G.frameH}
                  title="programmet" accent="rgba(232,220,193,0.45)"/>
        <VarSlot x={G.slotN.x} y={G.slotN.y} w={G.slotW} h={G.slotH} name="n" value="5" flash={false}/>
        <VarSlot x={G.slotSvar.x} y={G.slotSvar.y} w={G.slotW} h={G.slotH} name="svar" value="–" flash={false}/>
      </FadeUp>
      <FadeUp duration={0.5} delay={7.2} distance={8}
        style={{ position: 'absolute', left: G.frameX + 4, top: G.globalY + G.frameH + 14,
                 fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                 color: 'var(--chalk-300)', maxWidth: '44ch', lineHeight: 1.5 }}>
        Spørsmålet: hva skriver print ut — og hvorfor?
      </FadeUp>
    </>
  );
}

// ─── Beat 3: Kallet (GENUINE MOTION) ───────────────────────────────────────
function KalletBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const frameIn = at(0.10);
  const flightStart = at(0.24);
  const flightEnd = at(0.38);
  const bodyHi = at(0.55);
  const calmN = at(0.74);

  const flightT = (localTime - flightStart) / (flightEnd - flightStart);
  const xValue = localTime >= bodyHi ? '10' : (flightT >= 1 ? '5' : '–');
  const xFlash = (flightT >= 1 && localTime < flightEnd + 1.2) ||
                 (localTime >= bodyHi && localTime < bodyHi + 1.2);
  const line = localTime >= bodyHi ? 2 : 6;

  return (
    <>
      <CodeBlock
        code={CODE}
        title="dobler.py"
        reveal="all"
        highlight={String(line)}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      {/* Global frame, always present */}
      <MemFrame x={G.frameX} y={G.globalY} w={G.frameW} h={G.frameH}
                title="programmet" accent="rgba(232,220,193,0.45)"/>
      <VarSlot x={G.slotN.x} y={G.slotN.y} w={G.slotW} h={G.slotH} name="n" value="5" flash={false}/>
      <VarSlot x={G.slotSvar.x} y={G.slotSvar.y} w={G.slotW} h={G.slotH} name="svar" value="–" flash={false}/>

      {/* dobler's little world */}
      {localTime >= frameIn && (
        <>
          <MemFrame x={G.frameX} y={G.doblerY} w={G.frameW} h={G.frameH}
                    title="dobler sin verden" accent="var(--amber-400)"/>
          <VarSlot x={G.slotX.x} y={G.slotX.y} w={G.slotW} h={G.slotH}
                   name="x" value={xValue} flash={xFlash}/>
        </>
      )}

      <FlyingChip from={G.slotN} to={G.slotX} t={flightT} value="5" slotW={G.slotW} slotH={G.slotH}/>

      {localTime >= flightStart && localTime < bodyHi && (
        <div style={{
          position: 'absolute', left: G.frameX + 4, top: G.doblerY + G.frameH + 14,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', maxWidth: '44ch', lineHeight: 1.5 }}>
          En <span style={{ color: 'var(--amber-300)' }}>kopi</span> av verdien reiser inn i parameteren.
        </div>
      )}
      {localTime >= calmN && (
        <div style={{
          position: 'absolute', left: G.frameX + 4, top: G.doblerY + G.frameH + 14,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', maxWidth: '44ch', lineHeight: 1.5 }}>
          x ble 10 — men <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}>n</span> der
          ute merker ingenting.
        </div>
      )}
    </>
  );
}

// ─── Beat 4: Retur (GENUINE MOTION) ────────────────────────────────────────
function ReturBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const flightStart = at(0.10);
  const flightEnd = at(0.26);
  const frameFade = at(0.42);
  const printHi = at(0.60);
  const outputAt = at(0.70);

  const flightT = (localTime - flightStart) / (flightEnd - flightStart);
  const svarValue = flightT >= 1 ? '10' : '–';
  const svarFlash = flightT >= 1 && localTime < flightEnd + 1.2;
  const doblerOpacity = localTime >= frameFade ? 0 : 1;
  // return x → (chip lands) svar = dobler(n) → print: the highlight follows
  // the value so it's obvious WHERE the returned 10 lands.
  const line = localTime >= printHi ? 7 : (flightT >= 1 ? 6 : 3);

  return (
    <>
      <CodeBlock
        code={CODE}
        title="dobler.py"
        reveal="all"
        highlight={String(line)}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      <MemFrame x={G.frameX} y={G.globalY} w={G.frameW} h={G.frameH}
                title="programmet" accent="rgba(232,220,193,0.45)"/>
      <VarSlot x={G.slotN.x} y={G.slotN.y} w={G.slotW} h={G.slotH} name="n" value="5" flash={false}/>
      <VarSlot x={G.slotSvar.x} y={G.slotSvar.y} w={G.slotW} h={G.slotH}
               name="svar" value={svarValue} flash={svarFlash}/>

      <MemFrame x={G.frameX} y={G.doblerY} w={G.frameW} h={G.frameH}
                title="dobler sin verden" accent="var(--amber-400)" opacity={doblerOpacity}/>
      <VarSlot x={G.slotX.x} y={G.slotX.y} w={G.slotW} h={G.slotH}
               name="x" value="10" flash={false} opacity={doblerOpacity}/>

      <FlyingChip from={G.slotX} to={G.slotSvar} t={flightT} value="10" slotW={G.slotW} slotH={G.slotH}/>

      {localTime >= frameFade + 0.5 && localTime < outputAt && (
        <div style={{
          position: 'absolute', left: G.frameX + 4, top: G.doblerY + 20,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', maxWidth: '44ch', lineHeight: 1.5 }}>
          Den lille verdenen er borte — og <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}>x</span> med den.
        </div>
      )}

      <OutputRow x={G.outX} y={G.outY} w={G.outW} text="5 10" show={localTime >= outputAt}/>
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
        def · return
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '30ch', lineHeight: 1.25 }}>
        Funksjonen får <span style={{ color: 'var(--amber-300)' }}>en kopi</span> — ikke variabelen.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 19,
                 color: 'var(--amber-300)' }}>
        inn: en kopi av verdien · ut: det du returnerer
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
