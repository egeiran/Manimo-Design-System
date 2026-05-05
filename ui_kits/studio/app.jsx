// Manimo Studio — App entry
const { useState, useEffect } = React;


const initialMessages = [
  {
    from: 'user',
    time: '2:14 PM',
    body: 'Make a 90-second lesson on moment of inertia, focused on a hoop vs a solid disk rolling down a ramp. Audience: physics 1 students.'
  },
  {
    from: 'ai',
    time: '2:14 PM',
    body: <>Manimo sketched four scenes — an opening question, the formula <em>I = ∫ r² dm</em>, a side-by-side animation, and a recap. Want to adjust the pace or swap the recap for a worked example?</>,
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
    status: 'thinking',
    body: <>Rewriting scene 1. New lede: <em>"Two shapes start at the same height — same mass, same radius. Which reaches the bottom first?"</em></>,
    suggestions: ['Use this', 'Try another angle']
  }
];

// All four scenes are live — each entry renders the real motion/*.html
// in an iframe via PreviewCanvas's SceneLive renderer. To add a scene:
// drop a new motion/<id>.html, then append an entry below.
const initialScenes = [
  {
    id: 'live-rc', kind: 'live', kindLabel: 'Live',
    cardTitle: 'Lading av en kondensator',
    duration: '0:20',
    html: '../../motion/rc-scene.html',
  },
  {
    id: 'live-derivation', kind: 'live', kindLabel: 'Live',
    cardTitle: 'Moment of Inertia',
    duration: '0:28',
    html: '../../motion/derivation-scene.html',
  },
  {
    id: 'live-hoop-disk', kind: 'live', kindLabel: 'Live',
    cardTitle: 'Hoop vs Disk',
    duration: '0:39',
    html: '../../motion/hoop-disk.html',
  },
  {
    id: 'live-spring', kind: 'live', kindLabel: 'Live',
    cardTitle: "Hooke's Law: Spring Bobs",
    duration: '0:41',
    html: '../../motion/spring-oscillation.html',
  },
  {
    id: 'live-pendulum', kind: 'live', kindLabel: 'Live',
    cardTitle: 'The Simple Pendulum',
    duration: '0:52',
    html: '../../motion/pendulum.html',
  },
];

function App() {
  const [title, setTitle] = useState('Manimo · scene library');
  const [aspect, setAspect] = useState('16:9');
  const [messages, setMessages] = useState(initialMessages);
  const [scenes, setScenes] = useState(initialScenes);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.42);
  const [rendering, setRendering] = useState(false);

  // Fake playback
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setProgress(p => {
        const np = p + 0.005;
        if (np >= 1) { setPlaying(false); return 0; }
        return np;
      });
    }, 80);
    return () => clearInterval(id);
  }, [isPlaying]);

  const handleSend = (text) => {
    const now = new Date();
    const stamp = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const userMsg = { from: 'user', time: stamp, body: text };
    setMessages(m => [...m, userMsg]);
    // Fake AI reply
    setTimeout(() => {
      setMessages(m => [...m, {
        from: 'ai',
        time: stamp,
        body: <>Manimo is exploring two ways to do that. The first keeps scene 3 intact; the second trims it to make room. Which feels right?</>,
        suggestions: ['Keep scene 3', 'Trim scene 3']
      }]);
    }, 700);
  };

  const handlePickSuggest = (text) => {
    handleSend(text);
  };

  const handleAddScene = () => {
    const id = 's' + (scenes.length + 1);
    setScenes(s => [...s, {
      id, kind: 'recap', kindLabel: 'Recap',
      cardTitle: 'New scene',
      duration: '0:00'
    }]);
  };

  const handleRender = () => {
    setRendering(true);
    setTimeout(() => setRendering(false), 1800);
  };

  return (
    <div className="app">
      <TopBar
        title={title} setTitle={setTitle}
        aspect={aspect} setAspect={setAspect}
        onRender={handleRender} rendering={rendering}
      />
      <div className="workspace">
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          onPickSuggest={handlePickSuggest}
        />
        <PreviewCanvas
          aspect={aspect}
          scene={scenes[selectedIdx]}
          sceneIndex={selectedIdx}
          sceneCount={scenes.length}
          isPlaying={isPlaying}
          setPlaying={setPlaying}
          progress={progress}
        />
        <SceneList
          scenes={scenes}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
          onAddScene={handleAddScene}
        />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
