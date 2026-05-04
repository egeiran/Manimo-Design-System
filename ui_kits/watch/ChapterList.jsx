function ChapterList({ chapters, activeIdx, onSelect, duration }) {
  return (
    <div>
      <h3 className="section-title">Chapters</h3>
      <div className="chapters">
        {chapters.map((c, i) => (
          <button key={i} className={`chapter ${i === activeIdx ? 'active' : ''}`} onClick={() => onSelect(i)}>
            <span className="chapter-time">{fmtTime(c.startSec)}</span>
            <div className="chapter-thumb">
              <ChapThumb kind={c.kind}/>
            </div>
            <div>
              <div className="chapter-title">{c.title}</div>
              <div className="chapter-sub">{c.kindLabel}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
function fmtTime(s) { const m = Math.floor(s/60); const r = Math.floor(s%60); return `${m}:${String(r).padStart(2,'0')}`; }

function ChapThumb({ kind }) {
  if (kind === 'circuit') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <path d="M 14 22 H 26 V 14 H 38 V 22 H 50" stroke="#f4b860" strokeWidth="1.2" fill="none"/>
        <rect x="50" y="16" width="3" height="12" fill="#7fd1c5"/>
        <rect x="56" y="14" width="3" height="16" fill="#7fd1c5"/>
        <path d="M 60 22 H 70 V 32 H 14 V 22" stroke="#f4b860" strokeWidth="1.2" fill="none"/>
      </svg>
    );
  }
  if (kind === 'curve') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <line x1="10" y1="35" x2="74" y2="35" stroke="rgba(232,220,193,0.3)" strokeWidth="0.7"/>
        <line x1="10" y1="8" x2="10" y2="35" stroke="rgba(232,220,193,0.3)" strokeWidth="0.7"/>
        <path d="M 10 35 Q 24 35 32 22 T 74 11" stroke="#f4b860" strokeWidth="1.4" fill="none"/>
      </svg>
    );
  }
  if (kind === 'formula') {
    return (
      <svg viewBox="0 0 80 45" width="100%" height="100%">
        <rect width="80" height="45" fill="#0c0a1f"/>
        <text x="40" y="27" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="10" fill="#fbf7ee" textAnchor="middle">τ = RC</text>
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

window.ChapterList = ChapterList;
