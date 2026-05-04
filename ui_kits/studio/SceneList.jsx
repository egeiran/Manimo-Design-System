// Manimo Studio — Scene list (right column)
// Ordered list of scenes Manimo composed. Click to select.

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
          <span className="scene-card-dur">{scene.duration}</span>
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
        <text x="8" y="18" fontFamily="Fraunces, serif" fontSize="9" fill="#fbf7ee">A question</text>
        <line x1="8" y1="26" x2="62" y2="26" stroke="#f4b860" strokeWidth="1"/>
        <line x1="8" y1="32" x2="40" y2="32" stroke="rgba(232,220,193,0.3)" strokeWidth="1"/>
      </svg>
    );
  }
  if (kind === 'formula') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <text x="40" y="26" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="11" fill="#fbf7ee" textAnchor="middle">K = ½ I ω²</text>
      </svg>
    );
  }
  if (kind === 'comparison') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <line x1="6" y1="36" x2="38" y2="14" stroke="rgba(232,220,193,0.5)" strokeWidth="1"/>
        <circle cx="22" cy="26" r="4" fill="none" stroke="#f4b860" strokeWidth="1.2"/>
        <line x1="42" y1="36" x2="74" y2="14" stroke="rgba(232,220,193,0.5)" strokeWidth="1"/>
        <circle cx="58" cy="26" r="4" fill="rgba(232,122,144,0.4)" stroke="#e87a90" strokeWidth="1.2"/>
      </svg>
    );
  }
  if (kind === 'recap') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <circle cx="10" cy="14" r="1.4" fill="#f4b860"/><line x1="16" y1="14" x2="56" y2="14" stroke="rgba(232,220,193,0.5)" strokeWidth="1"/>
        <circle cx="10" cy="22" r="1.4" fill="#e87a90"/><line x1="16" y1="22" x2="50" y2="22" stroke="rgba(232,220,193,0.5)" strokeWidth="1"/>
        <circle cx="10" cy="30" r="1.4" fill="#7fd1c5"/><line x1="16" y1="30" x2="58" y2="30" stroke="rgba(232,220,193,0.5)" strokeWidth="1"/>
      </svg>
    );
  }
  return null;
}

function SceneList({ scenes, selectedIdx, onSelect, onAddScene }) {
  return (
    <aside className="scene-list">
      <div className="scene-list-head">
        <div>
          <div className="text-eyebrow">Scenes</div>
          <div className="scene-list-count">{scenes.length} · 1 min 42 sec</div>
        </div>
        <button className="tool-btn" aria-label="Library">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </button>
      </div>
      <div className="scene-list-scroll">
        {scenes.map((s, i) => (
          <SceneCard key={s.id} scene={s} index={i} selected={i === selectedIdx} onSelect={onSelect}/>
        ))}
        <button className="add-scene" onClick={onAddScene}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Add scene
        </button>
      </div>
    </aside>
  );
}

window.SceneList = SceneList;
window.SceneCard = SceneCard;
