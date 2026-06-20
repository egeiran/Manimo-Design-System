// f-strenger: hullene fylles med verdier — Manimo lesson scene.
// Chapter 3 of itgk (Inn-/utdata og strengformatering). The misconception:
// students concatenate with `+` and call `str()` everywhere. An f-string
// is a *template*: text with HULL — Python evaluates each hole and drops
// the result into place. The scene shows the template literally, lets
// two values glide from VarBoxes into the highlighted slots, then closes
// with a slot that contains an expression Python crunches before printing.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10     Manimo hook (handled by SceneChrome)
//   10–22     Anatomi — the f-prefix, the {} slots, the literal text
//   22–38     Glir inn — value chips fly from VarBoxes into slots (GENUINE MOTION)
//   38–52     Mer enn navn — the slot evaluates an expression in three steps
//   52–60     Takeaway
//
// Colour discipline:
//   chalk-100  primary text inside the template, primary values
//   chalk-200  secondary text, name tags
//   chalk-300  dimmed labels, hints
//   amber-400  the {hole} highlight, primary accent
//   amber-300  payoff bands, output
//   teal-400   a value once it has landed in its slot
//   rose-400   the f-prefix flag (a single sigil)
//
// NOTE (Norwegian narration): generate-audio.js routes language: "no" to
// ElevenLabs eleven_turbo_v2_5 with language_code "no" and voice Liam —
// multilingual_v2 reads bokmål as Danish.

const SCENE_DURATION = 48;

const NARRATION = [
  /*  0–10  */ 'Du har en variabel, og du vil putte den inn i en setning. Hvordan setter du strengen sammen uten å lime alt med pluss?',
  /* 10–22  */ 'En f-streng er en mal. En f foran anførselstegnet flagger den, krøllparentesene er hull, og resten er bokstaver Python lar stå.',
  /* 22–38  */ 'Variablene står klare i sine egne bokser. Når Python møter et hull, henter den verdien fra boksen og glir den inn på plassen — én etter én, til hele setningen er ferdig.',
  /* 38–52  */ 'Hullet er ikke begrenset til et navn. Python regner ut det som står inni — som pris ganger antall — og lar bare svaret bli stående igjen.',
  /* 52–60  */ 'En f-streng er en mal med hull. Python regner ut hver bit i hullet, og fyller den inn for deg.',
];

const NARRATION_AUDIO = 'audio/f-strenger-hullene-fylles/scene.mp3';

// ─── Shared text segments ──────────────────────────────────────────────────
// The template `f"Hei {navn}! Du er {alder} år."` broken into typed pieces
// so beat 2 can colour each part and beat 3 can drop chip values into the
// SLOT pieces without re-typesetting.
const TEMPLATE = [
  { kind: 'prefix',  text: 'f' },
  { kind: 'quote',   text: '"' },
  { kind: 'literal', text: 'Hei ' },
  { kind: 'slot',    text: '{navn}',  name: 'navn' },
  { kind: 'literal', text: '! Du er ' },
  { kind: 'slot',    text: '{alder}', name: 'alder' },
  { kind: 'literal', text: ' år.' },
  { kind: 'quote',   text: '"' },
];

const TEMPLATE4 = [
  { kind: 'call',    text: 'print(' },
  { kind: 'prefix',  text: 'f' },
  { kind: 'quote',   text: '"' },
  { kind: 'literal', text: 'Totalt: ' },
  { kind: 'slot',    text: '{pris * antall}', name: 'expr' },
  { kind: 'literal', text: ' kroner' },
  { kind: 'quote',   text: '"' },
  { kind: 'call',    text: ')' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
// Soft panel matching the founding-five pattern.
function SoftPanel({ children, left, top, width, style }) {
  return (
    <div style={{
      position: 'absolute', left, top, width, pointerEvents: 'none',
      padding: '18px 22px', background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)', borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
      ...style,
    }}>
      {children}
    </div>
  );
}

function PanelEyebrow({ children, color = 'var(--amber-300)' }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color,
                  letterSpacing: '0.16em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

// A live variable box: serif-italic name above, mono value inside. Glows
// amber for a moment while its hole is being filled.
function VarBox({ name, value, flash, portrait }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: portrait ? 17 : 19, color: 'var(--chalk-300)' }}>{name}</span>
      <div style={{
        minWidth: portrait ? 90 : 110, padding: '8px 18px', textAlign: 'center', borderRadius: 10,
        border: `2px solid ${flash ? 'var(--amber-400)' : 'rgba(232,220,193,0.25)'}`,
        fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
        background: flash ? 'rgba(244,184,96,0.16)' : 'rgba(0,0,0,0.35)',
        transition: 'background 0.25s linear, border-color 0.25s linear',
        fontVariantLigatures: 'none',
      }}>
        {value}
      </div>
    </div>
  );
}

// Output payoff band (mono inside an amber-outlined chip).
function OutputBand({ text, fontSize = 22, style }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 14, padding: '10px 18px',
      borderRadius: 10, border: '1.5px solid var(--amber-400)', background: 'rgba(244,184,96,0.10)',
      ...style,
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>utskrift</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize, color: 'var(--amber-300)',
                     whiteSpace: 'pre', fontVariantLigatures: 'none' }}>{text}</span>
    </div>
  );
}

// ─── Template renderer ─────────────────────────────────────────────────────
// Renders the f-string template as one inline mono line. Each slot can be
// either empty (showing its `{name}` placeholder) or filled (showing the
// landed value in teal). The slot positions are reported by ref so the
// flying chip knows where to land.
function TemplateLine({ template, fontSize, fillState, slotRefs }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize,
      color: 'var(--chalk-100)', whiteSpace: 'pre',
      fontVariantLigatures: 'none', lineHeight: 1.4,
      display: 'inline-flex', alignItems: 'baseline',
    }}>
      {template.map((seg, i) => {
        if (seg.kind === 'prefix') {
          return <span key={i} style={{ color: 'var(--rose-400)', fontWeight: 600 }}>{seg.text}</span>;
        }
        if (seg.kind === 'quote') {
          return <span key={i} style={{ color: 'var(--chalk-300)' }}>{seg.text}</span>;
        }
        if (seg.kind === 'call') {
          return <span key={i} style={{ color: 'var(--chalk-300)' }}>{seg.text}</span>;
        }
        if (seg.kind === 'literal') {
          return <span key={i} style={{ color: 'var(--chalk-100)' }}>{seg.text}</span>;
        }
        // slot
        const filled = fillState && fillState[seg.name];
        return (
          <span key={i}
                ref={slotRefs ? (el) => { if (slotRefs.current) slotRefs.current[seg.name] = el; } : undefined}
                style={{
                  display: 'inline-block',
                  padding: '2px 6px', borderRadius: 6,
                  border: `1.5px solid ${filled ? 'var(--teal-400)' : 'var(--amber-400)'}`,
                  background: filled ? 'rgba(127,209,197,0.14)' : 'rgba(244,184,96,0.14)',
                  color: filled ? 'var(--teal-400)' : 'var(--amber-300)',
                  fontStyle: filled ? 'normal' : 'italic',
                  transition: 'background 0.25s linear, border-color 0.25s linear, color 0.25s linear',
                }}>
            {filled ? String(filled) : seg.text}
          </span>
        );
      })}
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="strenger"
      title="f-strenger: hullene fylles med verdier"
      duration={SCENE_DURATION}
      introEnd={8.85}
      introCaption="Sett verdien rett inn der den hører hjemme."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={8.85} end={18.76}>
        <AnatomiBeat/>
      </Sprite>

      <Sprite start={18.76} end={30.19}>
        <GlirInnBeat/>
      </Sprite>

      <Sprite start={30.19} end={39.82}>
        <MerEnnNavnBeat/>
      </Sprite>

      <Sprite start={39.82} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Anatomi ───────────────────────────────────────────────────────
function AnatomiBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const fontSize = portrait ? 28 : 38;

  // Labels for each part — render in step with the explanation.
  return (
    <>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: portrait ? 360 : 290,
        display: 'flex', justifyContent: 'center',
      }}>
        <FadeUp duration={0.5} delay={0.3} distance={10}>
          <TemplateLine template={TEMPLATE} fontSize={fontSize} fillState={null} />
        </FadeUp>
      </div>

      {/* Three callouts naming the parts */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: portrait ? 540 : 430,
        display: 'flex', justifyContent: 'center', gap: portrait ? 22 : 44,
      }}>
        <FadeUp duration={0.45} delay={1.8} distance={8}>
          <LabelChip color="var(--rose-400)" hint="f-flagg">en f foran</LabelChip>
        </FadeUp>
        <FadeUp duration={0.45} delay={3.0} distance={8}>
          <LabelChip color="var(--amber-400)" hint="hull (slot)">krøllparentes</LabelChip>
        </FadeUp>
        <FadeUp duration={0.45} delay={4.4} distance={8}>
          <LabelChip color="var(--chalk-200)" hint="bokstaver">resten står</LabelChip>
        </FadeUp>
      </div>

      {/* Caption underneath the chips */}
      {localTime >= 6.2 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: portrait ? 720 : 560,
          textAlign: 'center',
        }}>
          <FadeUp duration={0.55} delay={0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)' }}>
            Tre deler. En mal.
          </FadeUp>
        </div>
      )}
    </>
  );
}

function LabelChip({ color, hint, children }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '10px 16px', borderRadius: 12,
      border: `1.5px solid ${color}`, background: 'rgba(0,0,0,0.35)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color,
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>{hint}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--chalk-200)' }}>
        {children}
      </span>
    </div>
  );
}

// ─── Beat 3: Glir inn (GENUINE MOTION) ─────────────────────────────────────
// Two VarBoxes at the top, the template in the middle with empty slots
// highlighted amber, and the formatted result at the bottom. Two chips
// fly — value-by-value — from VarBox to slot, where the slot text swaps
// to the landed value (amber italic placeholder → teal mono answer).
function GlirInnBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();

  // Layout geometry. The slot positions are measured in canvas coords
  // (matching the centered template at the configured fontSize).
  const G = portrait
    ? { fontSize: 22,
        boxNavnX: 180, boxAlderX: 540, boxY: 320,
        templY: 660, slotNavnX: 244, slotAlderX: 440,
        outputY: 870, outputFont: 18 }
    : { fontSize: 32,
        boxNavnX: 320, boxAlderX: 900, boxY: 200,
        templY: 380, slotNavnX: 522, slotAlderX: 822,
        outputY: 540, outputFont: 24 };

  // Milestones as fractions of the sprite's actual duration so rewire
  // keeps the choreography aligned with the audio.
  const T = Math.max(duration - 0.6, 1);
  const at = (f) => f * T;

  // Phases for each chip: appear at VarBox, fly, land, slot swaps.
  const navnAppear = at(0.18);
  const navnLand   = at(0.32);
  const alderAppear = at(0.45);
  const alderLand   = at(0.60);
  const resultAt   = at(0.72);

  const navnFlight = clamp((localTime - navnAppear) / (navnLand - navnAppear), 0, 1);
  const alderFlight = clamp((localTime - alderAppear) / (alderLand - alderAppear), 0, 1);

  const navnFilled = localTime >= navnLand ? 'Ada' : null;
  const alderFilled = localTime >= alderLand ? '17' : null;

  // Highlight whichever VarBox is currently sending its value.
  const flashNavn = localTime >= navnAppear - 0.2 && localTime < navnLand + 0.4;
  const flashAlder = localTime >= alderAppear - 0.2 && localTime < alderLand + 0.4;

  return (
    <>
      {/* VarBoxes — top row */}
      <div style={{
        position: 'absolute', left: G.boxNavnX, top: G.boxY,
        transform: 'translate(-50%, -50%)',
      }}>
        <FadeUp duration={0.45} delay={0.2} distance={8}>
          <VarBox name="navn" value={'"Ada"'} flash={flashNavn} portrait={portrait}/>
        </FadeUp>
      </div>
      <div style={{
        position: 'absolute', left: G.boxAlderX, top: G.boxY,
        transform: 'translate(-50%, -50%)',
      }}>
        <FadeUp duration={0.45} delay={0.45} distance={8}>
          <VarBox name="alder" value={'17'} flash={flashAlder} portrait={portrait}/>
        </FadeUp>
      </div>

      {/* Template line — centered horizontally */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: G.templY,
        display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)',
      }}>
        <FadeUp duration={0.5} delay={1.2} distance={12}>
          <TemplateLine
            template={TEMPLATE}
            fontSize={G.fontSize}
            fillState={{ navn: navnFilled, alder: alderFilled }}
          />
        </FadeUp>
      </div>

      {/* Flying chips */}
      {localTime >= navnAppear && navnFlight < 1 && (
        <FlyingChip
          fromX={G.boxNavnX} fromY={G.boxY + 18}
          toX={G.slotNavnX} toY={G.templY}
          progress={navnFlight}
          value={'"Ada"'}
        />
      )}
      {localTime >= alderAppear && alderFlight < 1 && (
        <FlyingChip
          fromX={G.boxAlderX} fromY={G.boxY + 18}
          toX={G.slotAlderX} toY={G.templY}
          progress={alderFlight}
          value={'17'}
        />
      )}

      {/* Output band — bottom row */}
      {localTime >= resultAt && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: G.outputY,
          display: 'flex', justifyContent: 'center',
        }}>
          <FadeUp duration={0.55} delay={0} distance={10}>
            <OutputBand text="Hei Ada! Du er 17 år." fontSize={G.outputFont}/>
          </FadeUp>
        </div>
      )}
    </>
  );
}

// A small mono chip that ferries a value from VarBox to slot. Positioned
// absolutely in canvas coords. Eased-out cubic on the path, fades in/out
// at the endpoints so it reads as a pickup-and-drop, not a hard teleport.
function FlyingChip({ fromX, fromY, toX, toY, progress, value }) {
  const eased = Easing.easeInOutCubic ? Easing.easeInOutCubic(progress) : progress;
  const x = fromX + (toX - fromX) * eased;
  const y = fromY + (toY - fromY) * eased;
  // Fade in over the first 15%, full opacity through middle, fade out last 10%.
  const opacity = progress < 0.15 ? progress / 0.15 : (progress > 0.90 ? (1 - progress) / 0.10 : 1);
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: 'translate(-50%, -50%)',
      padding: '4px 12px', borderRadius: 8,
      border: '1.5px solid var(--teal-400)', background: 'rgba(0,0,0,0.55)',
      color: 'var(--teal-300)', fontFamily: 'var(--font-mono)', fontSize: 22,
      fontVariantLigatures: 'none', opacity,
      boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
      pointerEvents: 'none',
    }}>
      {value}
    </div>
  );
}

// ─── Beat 4: Mer enn navn ──────────────────────────────────────────────────
// Two VarBoxes (pris, antall). The code line carries a slot containing an
// EXPRESSION. A side panel shows the slot evaluating in three steps:
// pris * antall → 25 * 4 → 100. Then the output band lands at the bottom.
function MerEnnNavnBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();

  const G = portrait
    ? { fontSize: 20,
        boxPrisX: 180, boxAntallX: 540, boxY: 320,
        templY: 600, panelX: 60, panelY: 760, panelW: 600,
        outputY: 980, outputFont: 18 }
    : { fontSize: 28,
        boxPrisX: 320, boxAntallX: 900, boxY: 200,
        templY: 360, panelX: 320, panelY: 460, panelW: 640,
        outputY: 600, outputFont: 22 };

  const T = Math.max(duration - 0.6, 1);
  const at = (f) => f * T;

  const step1At = at(0.30);  // pris * antall
  const step2At = at(0.45);  // 25 * 4
  const step3At = at(0.62);  // 100
  const resultAt = at(0.78);

  // Determine which evaluation step to show in the slot for the highlight
  // band. Once step3 lands we treat the slot as "filled" so its border
  // turns teal (matching beat 3's convention).
  const slotFilled = localTime >= step3At ? '100' : null;

  return (
    <>
      {/* VarBoxes */}
      <div style={{
        position: 'absolute', left: G.boxPrisX, top: G.boxY,
        transform: 'translate(-50%, -50%)',
      }}>
        <FadeUp duration={0.45} delay={0.2} distance={8}>
          <VarBox name="pris" value={'25'} flash={localTime >= step1At && localTime < step3At} portrait={portrait}/>
        </FadeUp>
      </div>
      <div style={{
        position: 'absolute', left: G.boxAntallX, top: G.boxY,
        transform: 'translate(-50%, -50%)',
      }}>
        <FadeUp duration={0.45} delay={0.45} distance={8}>
          <VarBox name="antall" value={'4'} flash={localTime >= step1At && localTime < step3At} portrait={portrait}/>
        </FadeUp>
      </div>

      {/* Template line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: G.templY,
        display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)',
      }}>
        <FadeUp duration={0.5} delay={1.2} distance={12}>
          <TemplateLine
            template={TEMPLATE4}
            fontSize={G.fontSize}
            fillState={{ expr: slotFilled }}
          />
        </FadeUp>
      </div>

      {/* Evaluation panel — shows the slot crunching in three steps */}
      <SoftPanel left={G.panelX} top={G.panelY} width={G.panelW}>
        <PanelEyebrow>inne i hullet</PanelEyebrow>
        <EvalSteps
          step1Show={localTime >= step1At}
          step2Show={localTime >= step2At}
          step3Show={localTime >= step3At}
          portrait={portrait}
        />
      </SoftPanel>

      {/* Output band */}
      {localTime >= resultAt && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: G.outputY,
          display: 'flex', justifyContent: 'center',
        }}>
          <FadeUp duration={0.55} delay={0} distance={10}>
            <OutputBand text="Totalt: 100 kroner" fontSize={G.outputFont}/>
          </FadeUp>
        </div>
      )}
    </>
  );
}

function EvalSteps({ step1Show, step2Show, step3Show, portrait }) {
  const monoBig = { fontFamily: 'var(--font-mono)', fontSize: portrait ? 20 : 26,
                    fontVariantLigatures: 'none' };
  const arrow = { fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
                  color: 'var(--chalk-300)', padding: '0 8px' };
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 6,
                  width: '100%', justifyContent: 'flex-start' }}>
      {step1Show && (
        <FadeUp duration={0.45} delay={0} distance={6} style={{ ...monoBig, color: 'var(--chalk-100)' }}>
          pris * antall
        </FadeUp>
      )}
      {step2Show && (
        <>
          <FadeUp duration={0.4} delay={0} distance={4} style={arrow}>→</FadeUp>
          <FadeUp duration={0.45} delay={0} distance={6} style={{ ...monoBig, color: 'var(--chalk-200)' }}>
            25 * 4
          </FadeUp>
        </>
      )}
      {step3Show && (
        <>
          <FadeUp duration={0.4} delay={0} distance={4} style={arrow}>→</FadeUp>
          <FadeUp duration={0.5} delay={0} distance={8} style={{ ...monoBig, color: 'var(--teal-400)', fontWeight: 600 }}>
            100
          </FadeUp>
        </>
      )}
    </div>
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
        f-streng
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '32ch', lineHeight: 1.25 }}>
        En mal med <span style={{ color: 'var(--amber-300)' }}>hull</span> — Python fyller dem for deg.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 22,
                 color: 'var(--amber-300)', fontVariantLigatures: 'none' }}>
        {'f"... {uttrykk} ..."'}
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
