// Manimo Studio — Top Bar
// Wordmark + inline-editable lesson title + aspect toggle + chat / render.

function useRelativeNow(ts) {
  // Re-render every 30s so the "saved Xs ago" stamp stays fresh.
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (ts == null) return;
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, [ts]);
  if (ts == null) return null;
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5)   return 'saved just now';
  if (s < 60)  return `saved ${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `saved ${m} min ago`;
  return 'saved earlier';
}

function TopBar({ title, setTitle, aspect, setAspect, onRender, rendering, savedAt, chatOpen, onToggleChat }) {
  const savedLabel = useRelativeNow(savedAt) || 'draft';
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
        <span className="lesson-stamp">{savedLabel}</span>
      </div>
      <div className="topbar-right">
        <button
          className={`btn btn-ghost chat-toggle ${chatOpen ? 'on' : ''}`}
          onClick={onToggleChat}
          aria-pressed={chatOpen}
          title="Chat with Manimo"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          Chat
        </button>
        <div className="aspect-toggle" role="tablist" aria-label="Aspect ratio">
          <button role="tab" aria-selected={aspect === '16:9'} className={aspect === '16:9' ? 'on' : ''} onClick={() => setAspect('16:9')}>16:9</button>
          <button role="tab" aria-selected={aspect === '9:16'} className={aspect === '9:16' ? 'on' : ''} onClick={() => setAspect('9:16')}>9:16</button>
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
