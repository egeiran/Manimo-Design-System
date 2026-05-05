// Manimo Studio — Preview canvas
// Drives the currently-selected scene's iframe via window.__manimoStage,
// so the studio's transport (play/pause/scrub) is the same playback the
// scene exposes internally — no fake timers.

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

function fmtTime(s) {
  const total = Math.max(0, s | 0);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Live scene — loads a real motion/<scene>.html via iframe and scales it
// to fit the preview frame. The Stage is intrinsically 1280×720 inside
// the iframe; we use a CSS transform to fit it to the available width.
// Uses forwardRef so the parent can grab the iframe element to talk to
// the inner Stage via window.__manimoStage.
const SceneLive = React.forwardRef(function SceneLive({ scene, aspect, onLoad }, iframeRef) {
  const wrapperRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  const portrait = aspect === '9:16';
  // Stage canvas dims must match what animations.jsx Stage uses internally
  // when the ?aspect query param flips to portrait.
  const innerW = portrait ? 720 : 1280;
  const innerH = portrait ? 1280 : 720;
  const src = portrait
    ? scene.html + (scene.html.includes('?') ? '&aspect=9:16' : '?aspect=9:16')
    : scene.html;

  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setScale(Math.min(w / innerW, h / innerH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scene.html, innerW, innerH]);

  return (
    <div ref={wrapperRef} className="scene scene-live"
         style={{ position: 'absolute', inset: 0, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <iframe
        key={src}
        ref={iframeRef}
        src={src}
        width={innerW}
        height={innerH}
        title={scene.cardTitle || scene.id}
        onLoad={onLoad}
        style={{
          border: 0,
          background: 'var(--bg-canvas)',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
        }}
      />
    </div>
  );
});

// Empty placeholder for scenes with no html yet (e.g. an "Add scene" stub).
function ScenePlaceholder({ scene }) {
  return (
    <div className="scene scene-placeholder">
      <GraphBackground/>
      <div className="scene-content centered">
        <div className="text-eyebrow" style={{ color: 'var(--fg-3)' }}>Empty scene</div>
        <h2 className="scene-title" style={{ fontSize: 'clamp(20px, 2.4vw, 32px)' }}>
          {scene.cardTitle || 'New scene'}
        </h2>
        <p className="scene-lede">Describe this scene in chat to have Manimo author it.</p>
      </div>
    </div>
  );
}

// "motion/rc-scene.html" → "rc-scene" (scene id used for the notes folder).
function sceneIdFromHtml(htmlPath) {
  if (!htmlPath) return null;
  const base = htmlPath.split('/').pop() || '';
  return base.replace(/\.html$/i, '') || null;
}

function PreviewCanvas({ aspect, scenes, sceneIndex, onSelectScene }) {
  const scene = scenes[sceneIndex];
  const sceneCount = scenes.length;
  const iframeRef = React.useRef(null);
  const [stage, setStage] = React.useState(null);          // iframe's __manimoStage
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(scene?.duration || 0);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [notesRefresh, setNotesRefresh] = React.useState(0);
  const noteSceneId = sceneIdFromHtml(scene && scene.html);

  // Total lesson duration + cumulative offsets (seconds).
  const { total, offsets } = React.useMemo(() => {
    let acc = 0;
    const offs = scenes.map(s => { const o = acc; acc += s.duration || 0; return o; });
    return { total: acc, offsets: offs };
  }, [scenes]);

  const currentOffset = offsets[sceneIndex] || 0;
  const globalTime = currentOffset + Math.min(time, scene?.duration || 0);

  // When the iframe loads, attach to its Stage handle. Reset to t=0 (Stage's
  // localStorage time-persistence is great for solo scene authoring, but
  // confusing in studio playback). Subscribe for tick updates.
  const handleIframeLoad = React.useCallback(() => {
    const win = iframeRef.current && iframeRef.current.contentWindow;
    if (!win) return;
    // Stage mounts asynchronously; poll briefly until __manimoStage exists.
    let cancelled = false;
    const start = performance.now();
    const tryAttach = () => {
      if (cancelled) return;
      const s = win.__manimoStage;
      if (!s) {
        if (performance.now() - start < 4000) requestAnimationFrame(tryAttach);
        return;
      }
      try { s.setTime(0); } catch {}
      try { s.setPlaying(playing); } catch {}
      setStage(s);
      setDuration(s.duration || scene?.duration || 0);
      const unsub = s.subscribe(({ time: t, playing: p, duration: d }) => {
        setTime(t);
        setPlaying(p);
        if (d && d !== duration) setDuration(d);
      });
      // Stash for cleanup on next load
      iframeRef.current.__unsub = unsub;
    };
    requestAnimationFrame(tryAttach);
  }, [playing, scene && scene.html]);

  // Cleanup subscription when iframe element is replaced (scene change).
  React.useEffect(() => {
    return () => {
      const fr = iframeRef.current;
      if (fr && typeof fr.__unsub === 'function') {
        try { fr.__unsub(); } catch {}
        fr.__unsub = null;
      }
      setStage(null);
    };
  }, [scene && scene.html]);

  // Auto-advance: when time crosses duration on the last tick of a playing
  // scene, jump to the next scene (or stop on the final).
  const lastTimeRef = React.useRef(0);
  React.useEffect(() => {
    const prev = lastTimeRef.current;
    lastTimeRef.current = time;
    if (!playing) return;
    // Stage loops by default — detect wrap (time jumped backwards) or
    // the rare exact-end stop. Either way, advance.
    const wrapped = prev > duration - 0.6 && time < 0.4;
    if (wrapped) {
      if (sceneIndex + 1 < sceneCount) {
        onSelectScene(sceneIndex + 1);
      } else {
        // End of lesson — pause at end of last scene.
        if (stage) try { stage.setPlaying(false); } catch {}
      }
    }
  }, [time, playing, duration, sceneIndex, sceneCount, onSelectScene, stage]);

  const togglePlay = () => {
    if (!stage) return;
    const next = !playing;
    // If we'd press play at the very end, restart the lesson.
    if (next && sceneIndex === sceneCount - 1 && time >= duration - 0.05) {
      try { stage.setTime(0); } catch {}
    }
    try { stage.setPlaying(next); } catch {}
  };

  // Global scrub: convert click position → which scene + local time.
  const seekGlobal = (gt) => {
    if (total <= 0) return;
    const clamped = Math.max(0, Math.min(total, gt));
    let idx = sceneCount - 1;
    for (let i = 0; i < sceneCount; i++) {
      const start = offsets[i];
      const end = start + (scenes[i].duration || 0);
      if (clamped < end) { idx = i; break; }
    }
    const localT = clamped - offsets[idx];
    if (idx !== sceneIndex) {
      onSelectScene(idx);
      // After scene swap, the new iframe's load handler resets to 0; we then
      // need to re-seek. Defer until the new stage is attached.
      pendingSeekRef.current = localT;
    } else if (stage) {
      try { stage.setTime(localT); } catch {}
    }
  };

  const pendingSeekRef = React.useRef(null);
  React.useEffect(() => {
    if (stage && pendingSeekRef.current != null) {
      try { stage.setTime(pendingSeekRef.current); } catch {}
      pendingSeekRef.current = null;
    }
  }, [stage]);

  const trackRef = React.useRef(null);
  const onTrackClick = (e) => {
    const r = trackRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    seekGlobal(Math.max(0, Math.min(1, x)) * total);
  };

  const progressPct = total > 0 ? (globalTime / total) * 100 : 0;

  // ── Comment / screenshot ───────────────────────────────────────────────
  // Capture target inside the iframe — Stage exposes its canvas div so we
  // can rasterise it without grabbing the iframe chrome.
  const getCanvasEl = React.useCallback(() => {
    const win = iframeRef.current && iframeRef.current.contentWindow;
    const s = win && win.__manimoStage;
    if (!s || typeof s.getCanvasEl !== 'function') return null;
    return s.getCanvasEl();
  }, []);

  const openComposer = React.useCallback(() => {
    if (!stage || !noteSceneId) return;
    try { stage.setPlaying(false); } catch {}
    setComposerOpen(true);
  }, [stage, noteSceneId]);

  // Global "C" hotkey — only when not typing in an input.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'c' && e.key !== 'C') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
      e.preventDefault();
      openComposer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openComposer]);

  const handleNoteSaved = React.useCallback(() => {
    setComposerOpen(false);
    setNotesRefresh(n => n + 1);
  }, []);

  const seekToLocalTime = React.useCallback((t) => {
    if (stage) {
      try { stage.setTime(Math.max(0, Math.min(scene?.duration || 0, t))); } catch {}
    }
  }, [stage, scene && scene.duration]);

  return (
    <main className="preview-area">
      <div className={`preview-frame aspect-${aspect.replace(':', '-')}`}>
        <div className="preview-stage">
          {scene && scene.html
            ? <SceneLive ref={iframeRef} scene={scene} aspect={aspect} onLoad={handleIframeLoad}/>
            : <ScenePlaceholder scene={scene || {}}/>}
        </div>
        <div className="preview-watermark">
          <img src="../../assets/manimo-mark.svg" alt=""/>
        </div>
        {composerOpen && noteSceneId && (
          <CommentComposer
            open={composerOpen}
            sceneId={noteSceneId}
            timeSec={time}
            getCanvasEl={getCanvasEl}
            onCancel={() => setComposerOpen(false)}
            onSaved={handleNoteSaved}
          />
        )}
      </div>
      <div className="transport">
        <button className="transport-btn" onClick={togglePlay} disabled={!stage}
                aria-label={playing ? 'Pause' : 'Play'}>
          {playing
            ? <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            : <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>}
        </button>
        <div className="scrub" ref={trackRef} onClick={onTrackClick}>
          <div className="scrub-track">
            <div className="scrub-fill" style={{ width: `${progressPct}%` }}/>
            <div className="scrub-thumb" style={{ left: `${progressPct}%` }}/>
            {scenes.map((s, i) => i === 0 ? null : (
              <div key={i} className="scrub-tick" style={{ left: `${(offsets[i] / total) * 100}%` }}/>
            ))}
          </div>
        </div>
        <div className="transport-time">
          <span className="time-cur">{fmtTime(globalTime)}</span>
          <span className="time-sep">/</span>
          <span className="time-tot">{fmtTime(total)}</span>
        </div>
        <button
          className={`transport-btn-camera ${composerOpen ? 'active' : ''}`}
          onClick={openComposer}
          disabled={!stage || !noteSceneId}
          title="Add comment with screenshot (C)"
          aria-label="Add comment">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h3l2-2h6l2 2h3v12H4z"/>
            <circle cx="12" cy="13" r="3.5"/>
          </svg>
        </button>
        <div className="transport-meta">Scene {sceneIndex + 1} of {sceneCount}</div>
      </div>
      {noteSceneId && (
        <NotesPanel
          sceneId={noteSceneId}
          refreshKey={notesRefresh}
          onSeek={seekToLocalTime}
        />
      )}
    </main>
  );
}

window.PreviewCanvas = PreviewCanvas;
