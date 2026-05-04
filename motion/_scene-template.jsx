// <Scene name> — Manimo lesson scene.
// <One-line description of what this scene teaches>
//
// Beats:
//   0.0– 3.0   Manimo enters; title writes on
//   3.0– …     <Beat 2 — fill in>
//   …– …       <Beat 3 — fill in>
//   …–<DUR>    <Final beat — formula reveal, summary, etc.>
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx — see motion/README.md.
//   • One <Sprite start end> per beat. Stagger inside a beat with `delay`.
//   • Use SvgFadeIn (not FadeUp) for anything inside an <svg>.
//   • Pull colors from var(--amber-*), var(--chalk-*), var(--rose-*), etc.
//   • Stage size is 1280×720; don't change without reason.

const { useState, useEffect } = React;

const SCENE_DURATION = 20; // seconds — adjust to fit your beats

function Scene() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'radial-gradient(ellipse at 50% 60%, rgba(244,184,96,0.05), transparent 60%), #0c0a1f',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
    }}>
      <Background/>
      <Watermark/>

      {/* Beat 1 — Manimo enters */}
      <Sprite start={0.2} end={3.2}>
        <ManimoBubbleIntro/>
      </Sprite>

      {/* Beat 1.5 — Scene title (persistent in upper-left) */}
      <Sprite start={1.0} end={SCENE_DURATION}>
        <SceneTitle/>
      </Sprite>

      {/* Beat 2 — TODO: replace with your first content beat */}
      {/* <Sprite start={3.2} end={9}>
        <YourFirstBeat/>
      </Sprite> */}

      {/* Beat 3 — TODO */}

      {/* Final beat — TODO: formula / takeaway */}

      {/* Persistent Manimo, lower-left */}
      <Sprite start={2.2} end={SCENE_DURATION}>
        <ManimoCorner/>
      </Sprite>
    </div>
  );
}

// ─── Background grid ──────────────────────────────────────────────────────
function Background() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(232,220,193,0.04)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)"/>
    </svg>
  );
}

function Watermark() {
  return (
    <div style={{
      position: 'absolute', top: 24, right: 32,
      fontFamily: 'var(--font-serif)', fontSize: 18, fontStyle: 'italic',
      color: 'rgba(232,220,193,0.4)',
    }}>
      Manimo
    </div>
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
        {/* TODO: greeting in Norwegian (bokmål), conversational, short */}
        La oss …
      </FadeUp>
    </div>
  );
}

// ─── Beat 1.5: Eyebrow + scene title (persistent) ────────────────────────
function SceneTitle() {
  return (
    <div style={{
      position: 'absolute', left: 48, top: 28,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
          letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
        {/* TODO: scene number + section, e.g. "Scene 2 · utledning" */}
        Scene N · …
      </FadeUp>
      <FadeUp duration={0.5} delay={0.2} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--chalk-100)',
          fontStyle: 'italic', letterSpacing: '0.005em',
        }}>
        {/* TODO: scene title */}
        …
      </FadeUp>
    </div>
  );
}

// ─── Persistent Manimo, lower-left ────────────────────────────────────────
function ManimoCorner() {
  return (
    <svg width={120} height={120} viewBox="0 0 200 200"
         style={{ position: 'absolute', left: 32, bottom: 32, overflow: 'visible' }}>
      <Manimo size={120} color="var(--amber-400)" bobAmplitude={3} bobSpeed={1.8}/>
    </svg>
  );
}

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f">
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
