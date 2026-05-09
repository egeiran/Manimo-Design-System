
// animations.jsx
// Reusable animation starter: Stage, Timeline, Sprite, easing helpers.
// Usage (in an HTML file that loads React + Babel):
//
//   <Stage width={1280} height={720} duration={10} background="var(--bg-canvas)">
//     <MyScene />
//   </Stage>
//
// Inside <Stage>, any child can call useTime() to read the current
// playhead (seconds). Or wrap content in <Sprite start={1} end={4}>...</Sprite>
// to only render during that window -- children receive a `localTime` and
// `progress` via the useSprite() hook.
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Easing functions (hand-rolled, Popmotion-style) ─────────────────────────
// All easings take t ∈ [0,1] and return eased t ∈ [0,1] (may overshoot for back/elastic).
const Easing = {
  linear: (t) => t,

  // Quad
  easeInQuad:    (t) => t * t,
  easeOutQuad:   (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic
  easeInCubic:    (t) => t * t * t,
  easeOutCubic:   (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

  // Quart
  easeInQuart:    (t) => t * t * t * t,
  easeOutQuart:   (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),

  // Expo
  easeInExpo:  (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },

  // Sine
  easeInSine:    (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine:   (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Back (overshoot)
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158, c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// ── Core interpolation helpers ──────────────────────────────────────────────

// Clamp a value to [min, max]
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// interpolate([0, 0.5, 1], [0, 100, 50], ease?) -> fn(t)
// Popmotion-style: linearly maps t across input keyframes to output values,
// with optional easing per segment (single fn or array of fns).
function interpolate(input, output, ease = Easing.linear) {
  return (t) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? (ease[i] || Easing.linear) : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

// animate({from, to, start, end, ease})(t) — simpler single-segment tween.
// Returns `from` before `start`, `to` after `end`.
function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }) {
  return (t) => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

// ── Timeline context ────────────────────────────────────────────────────────

const TimelineContext = React.createContext({
  time: 0, duration: 10, playing: false,
  portrait: false, width: 1280, height: 720,
});

const useTime = () => React.useContext(TimelineContext).time;
const useTimeline = () => React.useContext(TimelineContext);
const usePortrait = () => React.useContext(TimelineContext).portrait;

// ── Sprite ──────────────────────────────────────────────────────────────────
// Renders children only when the playhead is inside [start, end]. Provides
// a sub-context with `localTime` (seconds since start) and `progress` (0..1).
//
//   <Sprite start={2} end={5}>
//     {({ localTime, progress }) => <Thing x={progress * 100} />}
//   </Sprite>
//
// Or as a plain wrapper — children can call useSprite() themselves.

const SpriteContext = React.createContext({ localTime: 0, progress: 0, duration: 0 });
const useSprite = () => React.useContext(SpriteContext);

function Sprite({ start = 0, end = Infinity, children, keepMounted = false }) {
  const { time } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;

  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration)
    ? clamp(localTime / duration, 0, 1)
    : 0;

  const value = { localTime, progress, duration, visible };

  return (
    <SpriteContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </SpriteContext.Provider>
  );
}

function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = 'var(--chalk-50)',
  fps = 60,
  loop = true,
  autoplay = true,
  persistKey = 'animstage',
  children,
}) {
  // ?freeze=N URL param overrides everything: pin to time N, no autoplay.
  // Used by scripts/snapshot-scene.js for headless screenshots.
  // ?embed=1 hides the internal playback bar — used when the scene is
  // rendered inside a host (e.g. Studio) that draws its own transport.
  const params = (() => { try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); } })();
  const freezeTime = (() => {
    const v = params.get('freeze');
    if (v === null) return null;
    const t = parseFloat(v);
    return isFinite(t) ? clamp(t, 0, duration) : null;
  })();
  const embedded = params.get('embed') === '1' || (() => {
    try { return window.parent && window.parent !== window; } catch { return false; }
  })();
  // ?aspect=9:16 (or "portrait") rotates the stage to a 720×1280 canvas.
  // Also accept the same key in the hash fragment (#aspect=9:16) — some
  // dev servers (Vercel `serve`) 301-redirect *.html → extensionless and
  // drop the query string, but the hash survives that redirect.
  const hashParams = (() => {
    try { return new URLSearchParams((window.location.hash || '').replace(/^#/, '')); }
    catch { return new URLSearchParams(); }
  })();
  const aspectParam = (params.get('aspect') || hashParams.get('aspect') || '').toLowerCase();
  const portrait = aspectParam === '9:16' || aspectParam === 'portrait';
  const stageW = portrait ? 720  : width;
  const stageH = portrait ? 1280 : height;

  const [time, setTime] = React.useState(() => {
    if (freezeTime != null) return freezeTime;
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ':t') || '0');
      return isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch { return 0; }
  });
  const [playing, setPlaying] = React.useState(freezeTime != null ? false : autoplay);

  // Expose a global handle for headless drivers (Playwright) and parent shells
  // (Studio). Exposes setters plus a getter and a tick subscription so a
  // parent iframe can observe playback without polling React state.
  const stageHandleRef = React.useRef({ time: 0, playing: false, subs: new Set() });
  React.useEffect(() => {
    const handle = stageHandleRef.current;
    window.__manimoStage = {
      setTime, setPlaying, duration,
      width: stageW, height: stageH, portrait,
      getTime: () => handle.time,
      isPlaying: () => handle.playing,
      getCanvasEl: () => canvasRef.current,
      subscribe: (fn) => { handle.subs.add(fn); return () => handle.subs.delete(fn); },
    };
    return () => { try { delete window.__manimoStage; } catch {} };
  }, [duration, stageW, stageH, portrait]);
  React.useEffect(() => {
    const handle = stageHandleRef.current;
    handle.time = time;
    handle.subs.forEach(fn => { try { fn({ time, playing: handle.playing, duration }); } catch {} });
  }, [time, duration]);
  React.useEffect(() => {
    const handle = stageHandleRef.current;
    handle.playing = playing;
    handle.subs.forEach(fn => { try { fn({ time: handle.time, playing, duration }); } catch {} });
  }, [playing, duration]);

  // ── Cross-origin postMessage protocol ──────────────────────────────────
  // When the scene is embedded in an iframe, the same-origin
  // `window.__manimoStage` handle is unreachable from the host. This block
  // mirrors that surface over `postMessage` so a parent can read playback
  // state and control playback across origins.
  //
  // Outbound (to window.parent):
  //   { source: 'manimo', type: 'manimo:ready', duration, width, height, portrait }
  //   { source: 'manimo', type: 'manimo:state', time, playing, duration }   // ≤30Hz
  // Inbound (from window.parent), all gated on { source: 'manimo', type }:
  //   manimo:setTime    { time }       → setTime(clamp(time, 0, duration))
  //   manimo:setPlaying { playing }    → setPlaying(playing)
  //   manimo:reset      —              → setTime(0); setPlaying(true)
  //   manimo:requestState —            → reply with one manimo:state
  const lastPostRef = React.useRef({ at: 0, playing: null });
  const postState = React.useCallback(() => {
    try {
      const handle = stageHandleRef.current;
      window.parent.postMessage({
        source: 'manimo', type: 'manimo:state',
        time: handle.time, playing: handle.playing, duration,
      }, '*');
      lastPostRef.current.at = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      lastPostRef.current.playing = handle.playing;
    } catch {}
  }, [duration]);

  // Fire manimo:ready once after mount (and on geometry changes).
  React.useEffect(() => {
    if (!embedded) return;
    try {
      window.parent.postMessage({
        source: 'manimo', type: 'manimo:ready',
        duration, width: stageW, height: stageH, portrait,
      }, '*');
    } catch {}
  }, [embedded, duration, stageW, stageH, portrait]);

  // Subscribe to ticks → emit manimo:state, throttled to ~30Hz.
  // Always emit on a play/pause edge so the host never misses a transition.
  React.useEffect(() => {
    if (!embedded) return;
    const handle = stageHandleRef.current;
    const fn = ({ time: t, playing: p, duration: d }) => {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const last = lastPostRef.current;
      const playingChanged = last.playing !== p;
      if (!playingChanged && now - last.at < 33) return;
      last.at = now;
      last.playing = p;
      try {
        window.parent.postMessage({
          source: 'manimo', type: 'manimo:state',
          time: t, playing: p, duration: d,
        }, '*');
      } catch {}
    };
    handle.subs.add(fn);
    return () => { handle.subs.delete(fn); };
  }, [embedded]);

  // Inbound message handler.
  React.useEffect(() => {
    if (!embedded) return;
    const onMessage = (e) => {
      const data = e.data;
      if (!data || data.source !== 'manimo' || typeof data.type !== 'string') return;
      switch (data.type) {
        case 'manimo:setTime':
          if (typeof data.time === 'number' && isFinite(data.time)) {
            setTime(clamp(data.time, 0, duration));
          }
          break;
        case 'manimo:setPlaying':
          setPlaying(!!data.playing);
          break;
        case 'manimo:reset':
          setTime(0);
          setPlaying(true);
          break;
        case 'manimo:requestState':
          postState();
          break;
        default:
          break;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [embedded, duration, postState]);

  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);

  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);

  // Persist playhead
  React.useEffect(() => {
    try { localStorage.setItem(persistKey + ':t', String(time)); } catch {}
  }, [time, persistKey]);

  // Auto-scale to fit viewport
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = embedded ? 0 : 44; // playback bar height
      const s = Math.min(
        el.clientWidth / stageW,
        (el.clientHeight - barH) / stageH
      );
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [stageW, stageH, embedded]);

  // Animation loop
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) {
          if (loop) next = next % duration;
          else { next = duration; setPlaying(false); }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);

  // Keyboard: space = play/pause, ← → = seek
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        setTime(t => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.code === 'ArrowRight') {
        setTime(t => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.key === '0' || e.code === 'Home') {
        setTime(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);

  const displayTime = hoverTime != null ? hoverTime : time;

  const ctxValue = React.useMemo(
    () => ({
      time: displayTime, duration, playing, setTime, setPlaying,
      portrait, width: stageW, height: stageH,
    }),
    [displayTime, duration, playing, portrait, stageW, stageH]
  );

  return (
    <div
      ref={stageRef}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--bg-sunken)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Canvas area — vertically centered in remaining space */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <div
          ref={canvasRef}
          style={{
            width: stageW, height: stageH,
            background,
            position: 'relative',
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            flexShrink: 0,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          <TimelineContext.Provider value={ctxValue}>
            {children}
          </TimelineContext.Provider>
        </div>
      </div>

      {/* Playback bar — stacked below canvas, never overlapping.
          Hidden when embedded (host draws its own transport). */}
      {!embedded && <PlaybackBar
        time={displayTime}
        actualTime={time}
        duration={duration}
        playing={playing}
        onPlayPause={() => {
          // If we're at the end of a non-looping scene, pressing play
          // should rewind first — otherwise the play toggle does nothing
          // (RAF would tick once, see time>=duration, and pause again).
          if (!playing && time >= duration) setTime(0);
          setPlaying(p => !p);
        }}
        onReset={() => { setTime(0); }}
        onSeek={(t) => setTime(t)}
        onHover={(t) => setHoverTime(t)}
      />}
    </div>
  );
}

// ── Playback bar ────────────────────────────────────────────────────────────
// Play/pause, return-to-begin, scrub track, time display.
// Uses fixed-width time fields so layout doesn't thrash.

function PlaybackBar({ time, duration, playing, onPlayPause, onReset, onSeek, onHover }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const timeFromEvent = React.useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);

  const onTrackMove = (e) => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (dragging) {
      onSeek(t);
    } else {
      onHover(t);
    }
  };

  const onTrackLeave = () => {
    if (!dragging) onHover(null);
  };

  const onTrackDown = (e) => {
    setDragging(true);
    const t = timeFromEvent(e);
    onSeek(t);
    onHover(null);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = (e) => {
      if (!trackRef.current) return;
      const t = timeFromEvent(e);
      onSeek(t);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);

  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const fmt = (t) => {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor((total * 100) % 100);
    return `${String(m).padStart(1, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  const mono = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px',
      background: 'var(--bg-overlay)',
      borderTop: '1px solid rgba(255,255,255,0.08)', /* white-on-dark UI overlay */
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',

      borderRadius: 8,
      color: 'var(--chalk-50)',
      fontFamily: 'Inter, system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <IconButton onClick={onReset} title="Return to start (0)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2v10M12 2L5 7l7 5V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        </svg>
      </IconButton>
      <IconButton onClick={onPlayPause} title="Play/pause (space)">
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="2" width="3" height="10" fill="currentColor"/>
            <rect x="8" y="2" width="3" height="10" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
          </svg>
        )}
      </IconButton>

      {/* Current time: fixed width so it doesn't thrash */}
      <div style={{
        fontFamily: mono,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        width: 64, textAlign: 'right',
        color: 'var(--chalk-50)',
      }}>
        {fmt(time)}
      </div>

      {/* Scrub track */}
      <div
        ref={trackRef}
        onMouseMove={onTrackMove}
        onMouseLeave={onTrackLeave}
        onMouseDown={onTrackDown}
        style={{
          flex: 1,
          height: 22,
          position: 'relative',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}
      >
        <div style={{
          position: 'absolute',
          left: 0, right: 0, height: 4,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute',
          left: 0, width: `${pct}%`, height: 4,
          background: 'oklch(72% 0.12 250)',
          borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute',
          left: `${pct}%`, top: '50%',
          width: 12, height: 12,
          marginLeft: -6, marginTop: -6,
          background: 'var(--chalk-50)',
          borderRadius: 6,
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        }}/>
      </div>

      {/* Duration: fixed width */}
      <div style={{
        fontFamily: mono,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        width: 64, textAlign: 'left',
        color: 'rgba(246,244,239,0.55)',
      }}>
        {fmt(duration)}
      </div>
    </div>
  );
}

function IconButton({ children, onClick, title }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        color: 'var(--chalk-50)',
        cursor: 'pointer',
        padding: 0,
        transition: 'background 120ms',
      }}
    >
      {children}
    </button>
  );
}


Object.assign(window, {
  Easing, interpolate, animate, clamp,
  TimelineContext, useTime, useTimeline, usePortrait,
  Sprite, SpriteContext, useSprite,
  Stage, PlaybackBar,
});

