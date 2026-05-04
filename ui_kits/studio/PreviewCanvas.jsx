// Manimo Studio — Preview canvas
// 16:9 or 9:16 viewport. Renders the currently-selected scene.

function GraphBackground() {
  return (
    <svg className="graph-bg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)"/>
    </svg>
  );
}

// --- Scene renderers — keyed by scene.kind ---

function SceneOpening({ scene }) {
  return (
    <div className="scene scene-opening">
      <GraphBackground/>
      <div className="scene-content">
        <div className="text-eyebrow" style={{ color: 'var(--amber-300)' }}>A question</div>
        <h2 className="scene-title">{scene.title}</h2>
        <p className="scene-lede">{scene.lede}</p>
      </div>
    </div>
  );
}

function SceneFormula({ scene }) {
  return (
    <div className="scene scene-formula">
      <GraphBackground/>
      <div className="scene-content centered">
        <div className="formula-stack">
          <div className="formula-eq">
            K<sub>rot</sub> <span className="op">=</span> <span className="frac"><span className="num">1</span><span className="den">2</span></span> I&#8239;ω<sup>2</sup>
          </div>
          <div className="formula-caption">Rotational kinetic energy</div>
        </div>
        <div className="formula-stack" style={{ marginTop: 36 }}>
          <div className="formula-eq small">
            I <span className="op">=</span> <span className="integral">∫</span> r² dm
          </div>
          <div className="formula-caption">Moment of inertia</div>
        </div>
      </div>
    </div>
  );
}

function SceneComparison({ scene }) {
  // Side-by-side: hoop vs disk rolling down a ramp
  return (
    <div className="scene scene-comparison">
      <GraphBackground/>
      <div className="scene-content compare-grid">
        <div className="compare-col">
          <div className="ramp-stage">
            <svg viewBox="0 0 200 140" width="100%" height="100%">
              <line x1="20" y1="120" x2="180" y2="40" stroke="rgba(232,220,193,0.5)" strokeWidth="2"/>
              <line x1="20" y1="120" x2="180" y2="120" stroke="rgba(232,220,193,0.3)" strokeWidth="1" strokeDasharray="3 3"/>
              <circle cx="80" cy="93" r="14" fill="none" stroke="#f4b860" strokeWidth="2.5"/>
            </svg>
          </div>
          <div className="compare-label">Hoop</div>
          <div className="compare-formula">I = m r²</div>
        </div>
        <div className="compare-col">
          <div className="ramp-stage">
            <svg viewBox="0 0 200 140" width="100%" height="100%">
              <line x1="20" y1="120" x2="180" y2="40" stroke="rgba(232,220,193,0.5)" strokeWidth="2"/>
              <line x1="20" y1="120" x2="180" y2="120" stroke="rgba(232,220,193,0.3)" strokeWidth="1" strokeDasharray="3 3"/>
              <circle cx="105" cy="80" r="14" fill="rgba(232,122,144,0.25)" stroke="#e87a90" strokeWidth="2.5"/>
            </svg>
          </div>
          <div className="compare-label">Solid disk</div>
          <div className="compare-formula">I = ½ m r²</div>
        </div>
      </div>
    </div>
  );
}

function SceneRecap({ scene }) {
  return (
    <div className="scene scene-recap">
      <GraphBackground/>
      <div className="scene-content">
        <div className="text-eyebrow" style={{ color: 'var(--rose-300)' }}>To remember</div>
        <ul className="recap-list">
          <li><span className="dot dot-amber"/>The hoop carries more of its mass far from the axis.</li>
          <li><span className="dot dot-rose"/>So more of its potential energy goes into <em>rotation</em>, not motion.</li>
          <li><span className="dot dot-teal"/>Same height, same mass — different finish line.</li>
        </ul>
      </div>
    </div>
  );
}

const sceneRenderers = {
  opening: SceneOpening,
  formula: SceneFormula,
  comparison: SceneComparison,
  recap: SceneRecap,
};

function PreviewCanvas({ aspect, scene, sceneIndex, sceneCount, isPlaying, setPlaying, progress }) {
  const Renderer = sceneRenderers[scene.kind] || SceneOpening;
  return (
    <main className="preview-area">
      <div className={`preview-frame aspect-${aspect.replace(':', '-')}`}>
        <div className="preview-stage">
          <Renderer scene={scene}/>
        </div>
        <div className="preview-watermark">
          <img src="../../assets/manimo-mark.svg" alt=""/>
        </div>
      </div>
      <div className="transport">
        <button className="transport-btn" onClick={() => setPlaying(!isPlaying)} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying
            ? <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            : <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>}
        </button>
        <div className="scrub">
          <div className="scrub-track">
            <div className="scrub-fill" style={{ width: `${progress * 100}%` }}/>
            <div className="scrub-thumb" style={{ left: `${progress * 100}%` }}/>
            {/* scene tick marks */}
            {Array.from({ length: sceneCount - 1 }).map((_, i) => (
              <div key={i} className="scrub-tick" style={{ left: `${((i + 1) / sceneCount) * 100}%` }}/>
            ))}
          </div>
        </div>
        <div className="transport-time">
          <span className="time-cur">0:42</span>
          <span className="time-sep">/</span>
          <span className="time-tot">1:42</span>
        </div>
        <div className="transport-meta">Scene {sceneIndex + 1} of {sceneCount}</div>
      </div>
    </main>
  );
}

window.PreviewCanvas = PreviewCanvas;
