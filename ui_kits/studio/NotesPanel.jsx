// Manimo Studio — NotesPanel
// Lists screenshot+comment notes for the current scene, read live from
// /api/notes (which is backed by motion/<sceneId>.notes/ on disk).
// Click a note → seek the player to that timestamp.

function NotesPanel({ sceneId, refreshKey, onSeek }) {
  const [notes, setNotes] = React.useState([]);
  const [open, setOpen] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!sceneId) { setNotes([]); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/notes?sceneId=${encodeURIComponent(sceneId)}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(({ notes }) => { if (!cancelled) { setNotes(notes || []); setError(null); } })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sceneId, refreshKey]);

  const count = notes.length;

  return (
    <section className={`notes-panel ${open ? 'open' : 'closed'}`}>
      <header className="notes-panel-head" onClick={() => setOpen(o => !o)}>
        <div className="notes-panel-head-left">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}>
            <polyline points="9 6 15 12 9 18"/>
          </svg>
          <span className="notes-panel-title">Notes</span>
          <span className="notes-panel-count">{count}</span>
        </div>
        <span className="notes-panel-hint">{sceneId} · press C to add</span>
      </header>
      {open && (
        <div className="notes-panel-body">
          {loading && <div className="notes-empty">Loading…</div>}
          {error && <div className="notes-empty notes-error">{error}</div>}
          {!loading && !error && count === 0 && (
            <div className="notes-empty">No notes yet. Pause the scene and press <kbd>C</kbd> to add one.</div>
          )}
          {count > 0 && (
            <ul className="notes-list">
              {notes.map(n => (
                <li key={n.id} className="notes-row">
                  <button className="notes-row-thumb" onClick={() => onSeek(n.timeSec)} title={`Seek to ${fmtT(n.timeSec)}`}>
                    {n.image
                      ? <img src={`/motion/${sceneId}.notes/${n.image}`} alt=""/>
                      : <div className="notes-row-thumb-empty"/>}
                  </button>
                  <div className="notes-row-meta">
                    <div className="notes-row-head">
                      <button className="notes-row-time" onClick={() => onSeek(n.timeSec)}>
                        t = {fmtT(n.timeSec)}
                      </button>
                      <span className="notes-row-stamp">{n.createdAt || ''}</span>
                    </div>
                    <p className="notes-row-text">{n.text || <em>(no comment)</em>}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function fmtT(s) {
  const total = Math.max(0, Number(s) || 0);
  const m = Math.floor(total / 60);
  const sec = (total % 60).toFixed(1);
  return `${m}:${String(sec).padStart(4, '0')}`;
}

window.NotesPanel = NotesPanel;
