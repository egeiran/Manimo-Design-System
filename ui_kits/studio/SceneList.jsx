// Manimo Studio — Scene list (right column)
// Ordered list of scenes Manimo composed. Click to select.

function formatTotalDuration(scenes) {
  // scene.duration is seconds. Sum and format.
  const totalSec = scenes.reduce((sum, s) => sum + (s.duration || 0), 0);
  const m = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${m} min ${String(sec).padStart(2, '0')} sec`;
}

function formatSceneDuration(s) {
  const total = Math.max(0, s | 0);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function SceneCard({ scene, index, selected, onSelect }) {
  return (
    <button
      className={`scene-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(index)}
    >
      <div className="scene-card-num">{String(index + 1).padStart(2, '0')}</div>
      <div className="scene-card-thumb" aria-hidden>
        <SceneThumb kind={scene.kind}/>
      </div>
      <div className="scene-card-meta">
        <div className="scene-card-title">{scene.cardTitle}</div>
        <div className="scene-card-sub">
          <span className={`kind-tag kind-${scene.kind}`}>{scene.kindLabel}</span>
          <span className="scene-card-dur">{formatSceneDuration(scene.duration)}</span>
        </div>
      </div>
    </button>
  );
}

function SceneThumb({ kind }) {
  if (kind === 'opening') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <text x="8" y="18" fontFamily="Fraunces, serif" fontSize="9" fill="var(--chalk-50)">A question</text>
        <line x1="8" y1="26" x2="62" y2="26" stroke="var(--amber-400)" strokeWidth="1"/>
        <line x1="8" y1="32" x2="40" y2="32" stroke="rgba(232,220,193,0.3)" strokeWidth="1"/>
      </svg>
    );
  }
  if (kind === 'formula') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <text x="40" y="26" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="11" fill="var(--chalk-50)" textAnchor="middle">K = ½ I ω²</text>
      </svg>
    );
  }
  if (kind === 'comparison') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <line x1="6" y1="36" x2="38" y2="14" stroke="rgba(232,220,193,0.5)" strokeWidth="1"/>
        <circle cx="22" cy="26" r="4" fill="none" stroke="var(--amber-400)" strokeWidth="1.2"/>
        <line x1="42" y1="36" x2="74" y2="14" stroke="rgba(232,220,193,0.5)" strokeWidth="1"/>
        <circle cx="58" cy="26" r="4" fill="rgba(232,122,144,0.4)" stroke="var(--rose-400)" strokeWidth="1.2"/>
      </svg>
    );
  }
  if (kind === 'recap') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <circle cx="10" cy="14" r="1.4" fill="var(--amber-400)"/><line x1="16" y1="14" x2="56" y2="14" stroke="rgba(232,220,193,0.5)" strokeWidth="1"/>
        <circle cx="10" cy="22" r="1.4" fill="var(--rose-400)"/><line x1="16" y1="22" x2="50" y2="22" stroke="rgba(232,220,193,0.5)" strokeWidth="1"/>
        <circle cx="10" cy="30" r="1.4" fill="var(--teal-400)"/><line x1="16" y1="30" x2="58" y2="30" stroke="rgba(232,220,193,0.5)" strokeWidth="1"/>
      </svg>
    );
  }
  if (kind === 'live') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <circle cx="40" cy="22.5" r="11" fill="none" stroke="var(--amber-400)" strokeWidth="1.2"/>
        <polygon points="36,17 36,28 47,22.5" fill="var(--amber-400)"/>
        <text x="40" y="40" fontFamily="JetBrains Mono, monospace" fontSize="6" fill="rgba(232,220,193,0.5)" textAnchor="middle" letterSpacing="0.2em">LIVE</text>
      </svg>
    );
  }
  return null;
}

function SceneList({ scenes, selectedIdx, onSelect }) {
  return (
    <aside className="scene-list">
      <div className="scene-list-head">
        <div>
          <div className="text-eyebrow">Scenes</div>
          <div className="scene-list-count">{scenes.length} · {formatTotalDuration(scenes)}</div>
        </div>
      </div>
      <div className="scene-list-scroll">
        {scenes.map((s, i) => (
          <SceneCard key={s.id} scene={s} index={i} selected={i === selectedIdx} onSelect={onSelect}/>
        ))}
      </div>
    </aside>
  );
}

window.SceneList = SceneList;
window.SceneCard = SceneCard;
