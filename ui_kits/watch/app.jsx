const { useState, useEffect } = React;

const chapters = [
  { startSec: 0,   title: 'A circuit with a switch', kind: 'circuit', kindLabel: 'Setup' },
  { startSec: 28,  title: 'When does it reach 63%?', kind: 'curve',   kindLabel: 'Question' },
  { startSec: 76,  title: 'Why τ = RC',             kind: 'formula', kindLabel: 'Derivation' },
  { startSec: 124, title: 'Three things to remember', kind: 'recap',  kindLabel: 'Recap' },
];
const duration = 162;

function App() {
  const [progress, setProgress] = useState(0.18);
  const [isPlaying, setPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setProgress(p => {
        const np = p + (1 / duration) * 0.5;
        if (np >= 1) { setPlaying(false); return 0; }
        return np;
      });
    }, 500);
    return () => clearInterval(id);
  }, [isPlaying]);

  const activeIdx = (() => {
    const t = progress * duration;
    let idx = 0;
    chapters.forEach((c, i) => { if (t >= c.startSec) idx = i; });
    return idx;
  })();

  return (
    <>
      <WatchTopBar/>
      <div className="w-page">
        <VideoPlayer
          progress={progress}
          setProgress={setProgress}
          isPlaying={isPlaying}
          setPlaying={setPlaying}
          chapters={chapters}
          duration={duration}
        />
        <LessonHeader/>
        <div className="lesson-body">
          <div>
            <LessonSummary/>
            <CommentThread/>
          </div>
          <ChapterList
            chapters={chapters}
            activeIdx={activeIdx}
            duration={duration}
            onSelect={(i) => setProgress(chapters[i].startSec / duration)}
          />
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
