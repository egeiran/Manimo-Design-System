// <Scene name> — Manimo lesson scene.
// <One-line description of what this scene teaches>
//
// Beats:
//   0.0– 3.0   Manimo enters; title shown by SceneChrome
//   3.0– …     <Beat 2 — fill in>
//   …– …       <Beat 3 — fill in>
//   …–<DUR>    <Final beat — formula reveal, summary, etc.>
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx — see motion/README.md.
//   • <SceneChrome eyebrow="…" title="…" duration={SCENE_DURATION}> handles
//     background, watermark, title block, and the corner Manimo. Don't reinvent.
//   • One <Sprite start end> per beat. Stagger inside a beat with `delay`.
//   • Use SvgFadeIn (not FadeUp) for anything inside an <svg>.
//   • Pull colors from var(--amber-*), var(--chalk-*), var(--rose-*), etc.
//   • Stage size is 1280×720; don't change without reason.

const SCENE_DURATION = 20; // seconds — adjust to fit your beats

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /* 0.0– 3.0 */ 'TODO: opening line that hooks the question.',
  /* 3.0– …  */ 'TODO: beat 2 narration.',
  /*  …– …   */ 'TODO: beat 3 narration.',
  /*  …–DUR  */ 'TODO: closing takeaway.',
];

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene N · TODO section"
      title="TODO: scene title"
      duration={SCENE_DURATION}
    >
      {/* Beat 1 — Manimo enters with a one-line hook */}
      <Sprite start={0.2} end={3.2}>
        <ManimoBubbleIntro/>
      </Sprite>

      {/* Beat 2 — TODO: replace with your first content beat */}
      {/* <Sprite start={3.2} end={9}>
        <YourFirstBeat/>
      </Sprite> */}

      {/* Beat 3 — TODO */}

      {/* Final beat — TODO: formula reveal / summary */}
    </SceneChrome>
  );
}

// ─── Beat 1: Manimo enters with a greeting bubble ─────────────────────────
function ManimoBubbleIntro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '46%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <svg width={140} height={140} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <ManimoEnter duration={0.7} bob={true}/>
      </svg>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 26,
          fontStyle: 'italic',
          color: 'var(--chalk-100)',
        }}>
        {/* TODO: greeting — short, conversational, in the scene's language */}
        La oss …
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f">
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
