// Manimo Studio — App entry
const { useState, useEffect, useMemo } = React;

const LS_TITLE = 'manimo.studio.title';
const LS_INDEX = 'manimo.studio.selectedIdx';
const LS_CHAT  = 'manimo.studio.chat';
const LS_ASPECT = 'manimo.studio.aspect';

// Demo conversation. Persists once the user starts editing it; until then we
// reseed on every load so the empty studio still has something to look at.
const seedMessages = [
  {
    from: 'user',
    time: '2:14 PM',
    body: 'Make a 90-second lesson on moment of inertia, focused on a hoop vs a solid disk rolling down a ramp. Audience: physics 1 students.'
  },
  {
    from: 'ai',
    time: '2:14 PM',
    body: 'Sketched four scenes — an opening question, the formula I = ∫ r² dm, a side-by-side animation, and a recap. Want to adjust the pace or swap the recap for a worked example?',
    suggestions: ['Slow down scene 2', 'Add a worked example', 'Make scene 3 longer']
  },
  {
    from: 'user',
    time: '2:16 PM',
    body: 'The opening feels flat. Lead with a question that nudges the viewer to predict the answer.'
  },
  {
    from: 'ai',
    time: '2:16 PM',
    body: 'Rewriting scene 1. New lede: "Two shapes start at the same height — same mass, same radius. Which reaches the bottom first?"',
    suggestions: ['Use this', 'Try another angle']
  }
];

// All scenes are live — each entry renders the real motion/*.html in an
// iframe via PreviewCanvas. duration is seconds (matches scene-manifest.json).
const initialScenes = [
  { id: 'live-rc',           kind: 'live', kindLabel: 'Live', cardTitle: 'Lading av en kondensator', duration: 20, html: '../../motion/rc-scene.html' },
  { id: 'live-derivation',   kind: 'live', kindLabel: 'Live', cardTitle: 'Moment of Inertia',         duration: 28, html: '../../motion/derivation-scene.html' },
  { id: 'live-hoop-disk',    kind: 'live', kindLabel: 'Live', cardTitle: 'Hoop vs Disk',              duration: 48, html: '../../motion/hoop-disk.html' },
  { id: 'live-spring',       kind: 'live', kindLabel: 'Live', cardTitle: "Hooke's Law: Spring Bobs",  duration: 41, html: '../../motion/spring-oscillation.html' },
  { id: 'live-pendulum',     kind: 'live', kindLabel: 'Live', cardTitle: 'The Simple Pendulum',       duration: 50, html: '../../motion/pendulum.html' },
  { id: 'live-rlc-pendulum', kind: 'live', kindLabel: 'Live', cardTitle: 'RLC ↔ Pendulum Analogy',    duration: 48, html: '../../motion/rlc-pendulum.html' },
];

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// Fake-but-believable Manimo reply. Only used in this preview kit.
function demoReply(userText) {
  const lower = userText.toLowerCase();
  if (/slow|pace|rhythm/.test(lower))   return 'Slowing scene 2 to give the integral room to breathe — the substitution beat now lands at 14s.';
  if (/add|insert|include/.test(lower)) return "Drafted a new scene. It slots in after the comparison and runs about twelve seconds — want me to mount it?";
  if (/shorten|trim|cut/.test(lower))   return 'Tightened the scene by trimming the lead-in chalk strokes; total is six seconds shorter.';
  if (/change|swap|replace/.test(lower))return 'Swapping in a fresh take. Reload the preview when the new build mounts.';
  return 'Working through it — a couple of options on the way. Connect a real Manimo backend to see them stream in.';
}

function App() {
  const [title, setTitle] = useState(() => loadJSON(LS_TITLE, 'Manimo · scene library'));
  const [aspect, setAspect] = useState(() => loadJSON(LS_ASPECT, '16:9'));
  const [messages, setMessages] = useState(() => loadJSON(LS_CHAT, seedMessages));
  const [scenes] = useState(initialScenes);
  const [selectedIdx, setSelectedIdx] = useState(() => {
    const v = loadJSON(LS_INDEX, 0);
    return Number.isInteger(v) && v >= 0 && v < initialScenes.length ? v : 0;
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => { saveJSON(LS_TITLE, title); setSavedAt(Date.now()); }, [title]);
  useEffect(() => { saveJSON(LS_INDEX, selectedIdx); }, [selectedIdx]);
  useEffect(() => { saveJSON(LS_CHAT, messages); }, [messages]);
  useEffect(() => { saveJSON(LS_ASPECT, aspect); }, [aspect]);

  const handleSend = (text) => {
    const stamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setMessages(m => [...m, { from: 'user', time: stamp, body: text }]);
    setTimeout(() => {
      setMessages(m => [...m, {
        from: 'ai',
        time: stamp,
        body: demoReply(text),
        demo: true,
      }]);
    }, 600);
  };

  const handlePickSuggest = (text) => handleSend(text);

  const handleResetChat = () => {
    setMessages(seedMessages);
  };

  const handleRender = () => {
    setRendering(true);
    setTimeout(() => setRendering(false), 1800);
  };

  const totalSec = useMemo(() => scenes.reduce((s, x) => s + (x.duration || 0), 0), [scenes]);

  return (
    <div className={`app ${chatOpen ? 'chat-open' : 'chat-closed'}`}>
      <TopBar
        title={title} setTitle={setTitle}
        aspect={aspect} setAspect={setAspect}
        onRender={handleRender} rendering={rendering}
        savedAt={savedAt}
        chatOpen={chatOpen} onToggleChat={() => setChatOpen(o => !o)}
        unread={messages.length}
      />
      <div className="workspace">
        <PreviewCanvas
          aspect={aspect}
          scenes={scenes}
          sceneIndex={selectedIdx}
          onSelectScene={setSelectedIdx}
        />
        <SceneList
          scenes={scenes}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
          totalSeconds={totalSec}
        />
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          onPickSuggest={handlePickSuggest}
          onClose={() => setChatOpen(false)}
          onReset={handleResetChat}
          open={chatOpen}
        />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
