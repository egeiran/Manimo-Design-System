function VideoPlayer({ progress, setProgress, isPlaying, setPlaying, chapters, duration }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div className="player" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="player-bg">
        <svg viewBox="0 0 800 450" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <pattern id="g2" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g2)"/>
        </svg>
      </div>

      <div className="player-stage">
        <div className="player-content">
          <div className="player-eyebrow">Scene 2 · the time constant</div>
          <h1 className="player-title">When does the capacitor reach 63%?</h1>
          <div className="player-eq">
            V<sub>C</sub>(t) <span className="op">=</span> V<sub>0</sub><span style={{ marginLeft: 4 }}>(1 − e<sup>−t/RC</sup>)</span>
          </div>
        </div>

        {/* Charging curve */}
        <svg className="player-curve" viewBox="0 0 220 140" fill="none">
          <line x1="20" y1="120" x2="210" y2="120" stroke="rgba(232,220,193,0.3)" strokeWidth="1"/>
          <line x1="20" y1="20" x2="20" y2="120" stroke="rgba(232,220,193,0.3)" strokeWidth="1"/>
          <line x1="20" y1="40" x2="210" y2="40" stroke="rgba(232,220,193,0.18)" strokeWidth="1" strokeDasharray="3 3"/>
          <text x="0" y="44" fontSize="9" fill="var(--chalk-300)" fontFamily="JetBrains Mono">V₀</text>
          <text x="0" y="86" fontSize="9" fill="var(--amber-400)" fontFamily="JetBrains Mono">.63</text>
          <line x1="80" y1="40" x2="80" y2="120" stroke="rgba(244,184,96,0.4)" strokeWidth="1" strokeDasharray="3 3"/>
          <text x="74" y="134" fontSize="9" fill="var(--amber-400)" fontFamily="JetBrains Mono">τ</text>
          <path d="M 20 120 Q 60 120, 80 80 T 210 42" stroke="var(--amber-400)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <circle cx="80" cy="80" r="3" fill="var(--amber-400)"/>
        </svg>
      </div>

      <div className="player-watermark"><img src="../../assets/manimo-mark.svg" alt=""/></div>

      <div className="player-transport" style={{ opacity: hover || !isPlaying ? 1 : 0.4, transition: 'opacity 240ms' }}>
        <button className="t-btn primary" onClick={() => setPlaying(!isPlaying)}>
          {isPlaying
            ? <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            : <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>}
        </button>
        <div className="t-scrub" onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setProgress((e.clientX - r.left) / r.width);
        }}>
          <div className="t-scrub-fill" style={{ width: `${progress * 100}%` }}/>
          {chapters.map((c, i) => i > 0 && (
            <div key={i} className="t-scrub-tick" style={{ left: `${(c.startSec / duration) * 100}%` }}/>
          ))}
          <div className="t-scrub-thumb" style={{ left: `${progress * 100}%` }}/>
        </div>
        <div className="t-time">
          <span>{fmt(progress * duration)}</span>
          <span className="sep">/</span>
          <span style={{ color: 'var(--fg-3)' }}>{fmt(duration)}</span>
        </div>
        <button className="t-btn" aria-label="Settings">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
        <button className="t-btn" aria-label="Fullscreen">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
        </button>
      </div>
    </div>
  );
}
function fmt(s) { const m = Math.floor(s/60); const r = Math.floor(s%60); return `${m}:${String(r).padStart(2,'0')}`; }
window.VideoPlayer = VideoPlayer;
