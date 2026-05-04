// Manimo Studio — Top Bar
// Wordmark + inline-editable lesson title + aspect toggle + render button.

function TopBar({ title, setTitle, aspect, setAspect, onRender, rendering }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <a href="#" className="brand" aria-label="Manimo home">
          <img src="../../assets/manimo-mark.svg" alt=""/>
          <span className="brand-word">Manimo</span>
        </a>
        <span className="brand-sep" aria-hidden>/</span>
        <input
          className="lesson-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Lesson title"
        />
        <span className="lesson-stamp">draft · saved 2 sec ago</span>
      </div>
      <div className="topbar-right">
        <div className="aspect-toggle" role="tablist" aria-label="Aspect ratio">
          <button
            role="tab"
            aria-selected={aspect === '16:9'}
            className={aspect === '16:9' ? 'on' : ''}
            onClick={() => setAspect('16:9')}
          >16:9</button>
          <button
            role="tab"
            aria-selected={aspect === '9:16'}
            className={aspect === '9:16' ? 'on' : ''}
            onClick={() => setAspect('9:16')}
          >9:16</button>
        </div>
        <button className="btn btn-ghost" aria-label="Share">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share
        </button>
        <button className="btn btn-primary" onClick={onRender} disabled={rendering}>
          {rendering ? 'Rendering…' : 'Render lesson'}
          {!rendering && <span aria-hidden> →</span>}
        </button>
      </div>
    </header>
  );
}

window.TopBar = TopBar;
