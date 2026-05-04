function LessonHeader() {
  const [liked, setLiked] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  return (
    <div className="lesson-header">
      <div>
        <h1 className="l-title">Charging a capacitor through a resistor</h1>
        <div className="l-meta">
          <div className="l-author">
            <div className="l-author-av">Æ</div>
            <div>
              <div className="l-author-name">Åsmund Eldhuset</div>
              <div className="l-author-stat">12.4k followers</div>
            </div>
          </div>
          <div className="l-divider"/>
          <span className="l-stat">8,219 views</span>
          <span className="l-stat">·</span>
          <span className="l-stat">2 days ago</span>
          <span className="l-stat">·</span>
          <span className="l-stat" style={{ color: 'var(--amber-300)' }}>TFY4125 · Electromagnetism</span>
        </div>
      </div>
      <div className="l-actions">
        <button className={`icon-btn ${liked ? 'on' : ''}`} onClick={() => setLiked(!liked)}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {liked ? '413' : '412'}
        </button>
        <button className={`icon-btn ${saved ? 'on' : ''}`} onClick={() => setSaved(!saved)}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          Save
        </button>
        <button className="icon-btn">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share
        </button>
      </div>
    </div>
  );
}
window.LessonHeader = LessonHeader;
