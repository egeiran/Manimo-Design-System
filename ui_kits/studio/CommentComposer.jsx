// Manimo Studio — CommentComposer
// Overlay textarea + Save/Cancel that appears over the preview when the
// user enters comment mode. The screenshot is taken at submit-time from
// the iframe's __manimoStage.getCanvasEl(), serialised via html2canvas.

const COMPOSER_LS_DRAFT = 'manimo.studio.note.draft';

async function captureSceneAsPng(canvasEl) {
  if (!canvasEl) throw new Error('No canvas element to capture');
  const win = canvasEl.ownerDocument && canvasEl.ownerDocument.defaultView;
  // html2canvas is loaded in the parent (studio) document. We can pass any
  // element from any same-origin window into it.
  const html2canvas = window.html2canvas;
  if (!html2canvas) throw new Error('html2canvas not loaded');
  const canvas = await html2canvas(canvasEl, {
    backgroundColor: null,
    width: canvasEl.offsetWidth,
    height: canvasEl.offsetHeight,
    scale: 1,
    useCORS: true,
    logging: false,
    // Pass the iframe's window so html2canvas reads the correct
    // computed styles for elements inside the scene.
    windowWidth: win ? win.innerWidth : undefined,
    windowHeight: win ? win.innerHeight : undefined,
  });
  return canvas.toDataURL('image/png');
}

function CommentComposer({ open, sceneId, timeSec, getCanvasEl, onCancel, onSaved }) {
  const [text, setText] = React.useState(() => {
    try { return localStorage.getItem(COMPOSER_LS_DRAFT) || ''; } catch { return ''; }
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const taRef = React.useRef(null);

  React.useEffect(() => {
    if (open && taRef.current) taRef.current.focus();
  }, [open]);

  React.useEffect(() => {
    try { localStorage.setItem(COMPOSER_LS_DRAFT, text); } catch {}
  }, [text]);

  const cancel = () => {
    setText('');
    setError(null);
    try { localStorage.removeItem(COMPOSER_LS_DRAFT); } catch {}
    onCancel();
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const imageDataUrl = await captureSceneAsPng(getCanvasEl());
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sceneId, timeSec, text, imageDataUrl }),
      });
      if (!res.ok) throw new Error(`server returned ${res.status}`);
      const { note } = await res.json();
      try { localStorage.removeItem(COMPOSER_LS_DRAFT); } catch {}
      setText('');
      onSaved(note);
    } catch (err) {
      setError(err.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); save(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open) return null;

  return (
    <div className="note-composer" role="dialog" aria-label="Add comment">
      <div className="note-composer-head">
        <span className="note-composer-time">t = {fmtTime(timeSec)}</span>
        <span className="note-composer-hint">paused · scrub to choose frame</span>
      </div>
      <textarea
        ref={taRef}
        className="note-composer-text"
        placeholder="What's the note? (⌘+Enter to save · Esc to cancel)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        disabled={saving}
      />
      {error && <div className="note-composer-error">{error}</div>}
      <div className="note-composer-foot">
        <button className="btn btn-ghost btn-sm" onClick={cancel} disabled={saving}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !text.trim()}>
          {saving ? 'Saving…' : 'Save note'}
        </button>
      </div>
    </div>
  );
}

function fmtTime(s) {
  const total = Math.max(0, Number(s) || 0);
  const m = Math.floor(total / 60);
  const sec = (total % 60).toFixed(1);
  return `${m}:${String(sec).padStart(4, '0')}`;
}

Object.assign(window, { CommentComposer, captureSceneAsPng });
