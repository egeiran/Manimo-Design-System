// Journaling Filesystem — Manimo lesson scene.
// One file write actually touches three disk regions: bitmap, inode,
// data. If the power fails between writes, the filesystem is left
// inconsistent. Journaling fixes this by writing intent to a log
// region first and only then applying the updates to their real
// locations; a crash mid-stream becomes a journal replay on reboot.
//
// Genuine animation lives in `NaiveCrashBeat` and `JournalBeat`: three
// write-token tiles travel from a "memory" buffer down to a strip of
// disk regions, with their position interpolated by sprite localTime.
// A lightning flash interrupts the naive case; the journal case
// re-routes them through a single TX record that lands first.

const SCENE_DURATION = 62;

const NARRATION = [
  /*  0.00– 8.80 */ 'A single file write actually touches three different disk regions. If the power dies between any two of them, the filesystem is corrupt.',
  /*  8.80–20.41 */ 'One write to the data block. One to the inode, to record the new block pointer and size. One to the bitmap, to mark the block as used. Three updates, one disk.',
  /* 20.41–36.93 */ 'Suppose the data lands first, then a crash before the inode and bitmap reach disk. On reboot, the block holds your new bytes — but the inode still says the file is empty, and the bitmap still says the block is free. The next file you create will overwrite it.',
  /* 36.93–52.18 */ 'Journaling writes intent first. A transaction record listing all three updates goes into a log region of the disk and is committed atomically. Only then do the changes go to their real homes. If a crash happens, the next boot replays the log.',
  /* 52.18–62.00 */ 'Same updates either way. But a committed journal turns a crash from corruption into a redo — the filesystem always comes back clean.',
];

const NARRATION_AUDIO = 'audio/journaling-fs/scene.mp3';

function fsGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 580,
        memX: 50, memY: 90,  memW: 500, memH: 130,
        diskX: 50, diskY: 360, diskW: 500, diskH: 100,
        diskRegions: [
          { id: 'B', x: 0,    label: 'BITMAP',  w: 130 },
          { id: 'I', x: 140,  label: 'INODE',   w: 130 },
          { id: 'J', x: 280,  label: 'JOURNAL', w: 80  },
          { id: 'D', x: 370,  label: 'DATA',    w: 130 },
        ],
        tokenW: 50, tokenH: 32,
        eyebrowFs: 11 }
    : { vbW: 1080, vbH: 460,
        memX: 90, memY: 80,  memW: 900, memH: 120,
        diskX: 90, diskY: 290, diskW: 900, diskH: 80,
        diskRegions: [
          { id: 'B', x: 0,    label: 'BITMAP',  w: 220 },
          { id: 'I', x: 230,  label: 'INODE',   w: 220 },
          { id: 'J', x: 460,  label: 'JOURNAL', w: 200 },
          { id: 'D', x: 670,  label: 'DATA',    w: 230 },
        ],
        tokenW: 70, tokenH: 38,
        eyebrowFs: 12 };
}

// Returns centre of a memory buffer slot (B/I/D tokens at rest).
function memTokenXY(G, idx, count = 3) {
  const totalW = count * G.tokenW + (count - 1) * 24;
  const startX = G.memX + (G.memW - totalW) / 2;
  return {
    x: startX + idx * (G.tokenW + 24) + G.tokenW / 2,
    y: G.memY + G.memH / 2 + 6,
  };
}

// Returns centre of a disk region (by region id 'B'|'I'|'J'|'D').
function diskRegionXY(G, regionId) {
  const r = G.diskRegions.find(r => r.id === regionId);
  return {
    x: G.diskX + r.x + r.w / 2,
    y: G.diskY + G.diskH / 2,
  };
}

function MemoryBuffer({ G }) {
  return (
    <g>
      <rect x={G.memX} y={G.memY} width={G.memW} height={G.memH} rx={10}
        fill="var(--amber-400)" fillOpacity={0.04}
        stroke="var(--amber-400)" strokeWidth={1.2} opacity={0.7}/>
      <text x={G.memX + 14} y={G.memY + 22}
        fill="var(--amber-300)"
        fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.18em">
        MEMORY · BUFFERED WRITES
      </text>
    </g>
  );
}

function DiskStrip({ G, landed = {}, journalCommitted = false }) {
  // landed: { 'B': true, 'I': true, 'D': true, 'J': boolean }
  return (
    <g>
      <rect x={G.diskX} y={G.diskY} width={G.diskW} height={G.diskH} rx={10}
        fill="var(--chalk-200)" fillOpacity={0.025}
        stroke="var(--chalk-300)" strokeWidth={1.2} opacity={0.7}/>
      <text x={G.diskX + 14} y={G.diskY - 10}
        fill="var(--chalk-300)"
        fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.18em">
        DISK
      </text>
      {G.diskRegions.map(r => {
        const cx = G.diskX + r.x + r.w / 2;
        const isJ = r.id === 'J';
        const isLanded = landed[r.id];
        // Journal region gets a teal accent when committed.
        const stroke = isJ && journalCommitted
          ? 'var(--teal-400)'
          : isLanded ? 'var(--amber-400)' : 'var(--chalk-300)';
        return (
          <g key={r.id}>
            <rect
              x={G.diskX + r.x + 4} y={G.diskY + 6}
              width={r.w - 8} height={G.diskH - 12} rx={6}
              fill={isLanded ? 'var(--amber-400)' : (isJ && journalCommitted ? 'var(--teal-400)' : 'var(--chalk-200)')}
              fillOpacity={isLanded ? 0.12 : (isJ && journalCommitted ? 0.10 : 0.03)}
              stroke={stroke}
              strokeWidth={1.3}
              strokeDasharray={isJ && !journalCommitted ? '4 4' : undefined}/>
            {/* Region label sits BELOW the disk strip so it never
                competes with the write tokens that land inside. */}
            <text x={cx} y={G.diskY + G.diskH + 18}
              textAnchor="middle"
              fill={isJ && journalCommitted ? 'var(--teal-400)' : 'var(--chalk-300)'}
              fontFamily="var(--font-mono)" fontSize={10}
              letterSpacing="0.18em">
              {r.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function WriteToken({ x, y, label, color, w, h, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6}
        fill={color} opacity={0.55}
        stroke={color} strokeWidth={1.4}/>
      <text x={x} y={y + 5}
        textAnchor="middle"
        fill="var(--chalk-100)"
        fontFamily="var(--font-mono)" fontSize={13}
        letterSpacing="0.06em">
        {label}
      </text>
    </g>
  );
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="file systems"
      title="Journaling"
      duration={SCENE_DURATION}
      introEnd={8.8}
      introCaption="Crashes are the disk's enemy — keep the filesystem honest."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={8.8} end={20.41}>
        <ThreeWritesBeat/>
      </Sprite>

      <Sprite start={20.41} end={36.93}>
        <NaiveCrashBeat/>
      </Sprite>

      <Sprite start={36.93} end={52.18}>
        <JournalBeat/>
      </Sprite>

      <Sprite start={52.18} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: introduce the three writes and the disk layout ─────────────
function ThreeWritesBeat() {
  const portrait = usePortrait();
  const G = fsGeometry(portrait);

  // Tokens just sit in memory, fading in.
  const tokens = [
    { id: 'B', label: 'B', color: 'var(--rose-400)',  blurb: 'bitmap update', shortBlurb: 'bitmap' },
    { id: 'I', label: 'I', color: 'var(--amber-400)', blurb: 'inode update',  shortBlurb: 'inode' },
    { id: 'D', label: 'D', color: 'var(--teal-400)',  blurb: 'data block',    shortBlurb: 'data' },
  ];

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={50}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={G.eyebrowFs}
            letterSpacing="0.18em">
            ONE FILE WRITE — THREE ON-DISK UPDATES
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={0.3}><MemoryBuffer G={G}/></SvgFadeIn>

        {tokens.map((tok, i) => {
          const { x, y } = memTokenXY(G, i);
          return (
            <SvgFadeIn key={tok.id} duration={0.4} delay={0.7 + i * 0.4}>
              <WriteToken x={x} y={y} label={tok.label} color={tok.color}
                w={G.tokenW} h={G.tokenH}/>
              <text x={x} y={y + G.tokenH / 2 + 18}
                textAnchor="middle"
                fill="var(--chalk-300)"
                fontFamily="var(--font-sans)" fontSize={portrait ? 11 : 12}>
                {portrait ? tok.shortBlurb : tok.blurb}
              </text>
            </SvgFadeIn>
          );
        })}

        <SvgFadeIn duration={0.4} delay={2.4}>
          <DiskStrip G={G}/>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: naive crash ────────────────────────────────────────────────
// Schedule (sprite-local seconds):
//   0.4..0.8  intro labels
//   1.0..2.4  D token travels from memory → DATA region (lands at 2.4)
//   2.4..3.4  CRASH! lightning bolt flashes; I and B tokens evaporate
//   3.6..      INCONSISTENT stamp appears
function NaiveCrashBeat() {
  const portrait = usePortrait();
  const G = fsGeometry(portrait);
  const { localTime } = useSprite();

  const dFrac = clamp((localTime - 1.0) / 1.4, 0, 1);
  const dEased = Easing.easeInOutCubic(dFrac);
  const dLanded = dFrac >= 0.99;

  // Crash strikes at 2.5; lightning visible 2.4..3.6
  const crashOp = (() => {
    const t = clamp((localTime - 2.4) / 0.4, 0, 1);
    const fadeOut = clamp((4.0 - localTime) / 0.6, 0, 1);
    if (localTime > 4.0) return 0;
    return t * fadeOut;
  })();

  // I and B tokens evaporate during the crash window.
  const ibOpacity = (() => {
    if (localTime < 2.6) return 1;
    return clamp((3.6 - localTime) / 0.8, 0, 1);
  })();

  // Token positions
  const dStart = memTokenXY(G, 2);
  const dEnd = diskRegionXY(G, 'D');
  const dx = dStart.x + (dEnd.x - dStart.x) * dEased;
  const dy = dStart.y + (dEnd.y - dStart.y) * dEased;
  const dW = dLanded ? G.tokenW : G.tokenW;

  // Inconsistent stamp
  const stampOp = clamp((localTime - 4.0) / 0.5, 0, 1);

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={50}
            textAnchor="middle"
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={G.eyebrowFs}
            letterSpacing="0.18em">
            NAIVE — WRITE STRAIGHT TO DISK
          </text>
        </SvgFadeIn>

        <MemoryBuffer G={G}/>
        <DiskStrip G={G} landed={{ D: dLanded }}/>

        {/* B and I tokens — sit in memory and evaporate at the crash */}
        {[0, 1].map(i => {
          const { x, y } = memTokenXY(G, i);
          const tok = i === 0
            ? { label: 'B', color: 'var(--rose-400)' }
            : { label: 'I', color: 'var(--amber-400)' };
          return (
            <WriteToken key={i} x={x} y={y} label={tok.label} color={tok.color}
              w={G.tokenW} h={G.tokenH} opacity={ibOpacity}/>
          );
        })}

        {/* D token — travels then lands in DATA region */}
        {dFrac > 0 && (
          <WriteToken x={dx} y={dy} label="D" color="var(--teal-400)"
            w={dW} h={G.tokenH}/>
        )}

        {/* Lightning flash + label */}
        {crashOp > 0 && (() => {
          const cx = G.memX + G.memW / 2;
          const top = G.memY + G.memH + 10;
          const bot = G.diskY - 10;
          const mid = (top + bot) / 2;
          return (
            <g opacity={crashOp}>
              {/* Jagged bolt */}
              <path
                d={`M ${cx - 12} ${top}
                    L ${cx + 6} ${mid - 14}
                    L ${cx - 8} ${mid - 4}
                    L ${cx + 10} ${bot}`}
                fill="none"
                stroke="var(--rose-400)"
                strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
              <text x={cx + 30} y={mid - 4}
                textAnchor="start"
                fill="var(--rose-300)"
                fontFamily="var(--font-mono)" fontSize={12}
                letterSpacing="0.18em">
                CRASH
              </text>
            </g>
          );
        })()}

        {/* Inconsistent stamp */}
        {stampOp > 0 && (
          <g opacity={stampOp}>
            <text x={G.vbW / 2} y={G.diskY + G.diskH + 56}
              textAnchor="middle"
              fill="var(--rose-300)"
              fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 16}
              letterSpacing="0.22em">
              INCONSISTENT — DATA WROTE, METADATA DIDN'T
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 4: journal — write intent first ───────────────────────────────
// Schedule:
//   0.4..1.6  intro labels
//   1.6..3.6  All three tokens travel together → JOURNAL region as a TX
//   3.6..4.4  COMMIT badge appears (journal now durable)
//   4.4..6.4  Same three tokens replay from journal → their real regions
//             (B → BITMAP, I → INODE, D → DATA)
//   6.4..7.4  caption "if crash now, replay log on reboot"
function JournalBeat() {
  const portrait = usePortrait();
  const G = fsGeometry(portrait);
  const { localTime } = useSprite();

  // Phase 1: tokens travel to JOURNAL
  const jFrac = clamp((localTime - 1.6) / 2.0, 0, 1);
  const jEased = Easing.easeInOutCubic(jFrac);
  const journalLanded = jFrac >= 0.99;

  // Phase 2: commit flash
  const commitOp = clamp((localTime - 3.6) / 0.4, 0, 1) * clamp((6.0 - localTime) / 0.4, 0, 1);
  const committed = localTime >= 3.6;

  // Phase 3: each token travels from journal to its real home (staggered)
  const replayStarts = { B: 4.4, I: 5.0, D: 5.6 };
  const replayDur = 1.4;
  const replayFracs = {
    B: clamp((localTime - replayStarts.B) / replayDur, 0, 1),
    I: clamp((localTime - replayStarts.I) / replayDur, 0, 1),
    D: clamp((localTime - replayStarts.D) / replayDur, 0, 1),
  };
  const replayEased = {
    B: Easing.easeInOutCubic(replayFracs.B),
    I: Easing.easeInOutCubic(replayFracs.I),
    D: Easing.easeInOutCubic(replayFracs.D),
  };
  const landed = {
    B: replayFracs.B >= 0.99,
    I: replayFracs.I >= 0.99,
    D: replayFracs.D >= 0.99,
  };

  // Token positions during phase 1 — three tokens flying as a cluster to JOURNAL.
  // We render each from its memory start to a slightly-offset position near
  // JOURNAL centre so they're legible.
  const jCentre = diskRegionXY(G, 'J');
  const jOffsets = [
    { dx: -G.tokenW * 0.6, dy: 0 },
    { dx: 0,               dy: 0 },
    { dx:  G.tokenW * 0.6, dy: 0 },
  ];

  const tokens = [
    { id: 'B', label: 'B', color: 'var(--rose-400)',  memIdx: 0, jOffIdx: 0 },
    { id: 'I', label: 'I', color: 'var(--amber-400)', memIdx: 1, jOffIdx: 1 },
    { id: 'D', label: 'D', color: 'var(--teal-400)',  memIdx: 2, jOffIdx: 2 },
  ];

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={50}
            textAnchor="middle"
            fill="var(--teal-400)"
            fontFamily="var(--font-mono)" fontSize={G.eyebrowFs}
            letterSpacing="0.18em">
            WRITE-AHEAD LOG — INTENT BEFORE ACTION
          </text>
        </SvgFadeIn>

        <MemoryBuffer G={G}/>
        <DiskStrip G={G}
          landed={landed}
          journalCommitted={committed}/>

        {/* Phase 1+3 token rendering */}
        {tokens.map((t, i) => {
          // Where is this token "now"?
          const memStart = memTokenXY(G, t.memIdx);
          const jTarget = { x: jCentre.x + jOffsets[t.jOffIdx].dx, y: jCentre.y };
          const realTarget = diskRegionXY(G, t.id);
          const replayFrac = replayFracs[t.id];
          const replayE = replayEased[t.id];

          // If replay has started for this token, position is from jTarget → realTarget
          if (replayFrac > 0) {
            const x = jTarget.x + (realTarget.x - jTarget.x) * replayE;
            const y = jTarget.y + (realTarget.y - jTarget.y) * replayE;
            return (
              <WriteToken key={t.id} x={x} y={y} label={t.label} color={t.color}
                w={G.tokenW} h={G.tokenH}/>
            );
          }

          // Otherwise we're in phase 1 (memory → journal) or before it
          if (jFrac > 0) {
            const x = memStart.x + (jTarget.x - memStart.x) * jEased;
            const y = memStart.y + (jTarget.y - memStart.y) * jEased;
            return (
              <WriteToken key={t.id} x={x} y={y} label={t.label} color={t.color}
                w={G.tokenW} h={G.tokenH}/>
            );
          }
          // Before phase 1 — still resting in memory
          return (
            <WriteToken key={t.id} x={memStart.x} y={memStart.y}
              label={t.label} color={t.color}
              w={G.tokenW} h={G.tokenH}/>
          );
        })}

        {/* COMMIT badge */}
        {commitOp > 0 && (
          <g opacity={commitOp}>
            <rect
              x={jCentre.x - 38} y={G.diskY - 28}
              width={76} height={20} rx={6}
              fill="var(--teal-400)" fillOpacity={0.25}
              stroke="var(--teal-400)" strokeWidth={1.2}/>
            <text x={jCentre.x} y={G.diskY - 13}
              textAnchor="middle"
              fill="var(--teal-400)"
              fontFamily="var(--font-mono)" fontSize={11}
              letterSpacing="0.18em">
              COMMIT
            </text>
          </g>
        )}

        {/* TX label inside journal once committed */}
        {committed && (
          <text x={jCentre.x} y={jCentre.y - G.diskH / 2 - 8}
            textAnchor="middle"
            fill="var(--teal-400)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.16em"
            opacity={0.7}>
            TX [B, I, D]
          </text>
        )}

        {/* Replay caption */}
        <SvgFadeIn duration={0.5} delay={6.4}>
          <text x={G.vbW / 2} y={G.diskY + G.diskH + 56}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 15 : 17}>
            crash now → reboot replays the journal · disk ends clean
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: takeaway ───────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 22,
      textAlign: 'center',
      maxWidth: portrait ? '32ch' : '54ch',
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 36 : 52, color: 'var(--chalk-100)',
          lineHeight: 1.05,
        }}>
        log it · commit it · then do it
      </FadeUp>

      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          lineHeight: 1.35,
        }}>
        a crash becomes a replay, not a corruption
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={8}
        style={{
          display: 'flex', gap: portrait ? 14 : 28, marginTop: 6,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          flexDirection: portrait ? 'column' : 'row',
        }}>
        <span style={{ color: 'var(--rose-300)' }}>NAIVE → INCONSISTENT</span>
        <span style={{ color: 'var(--teal-400)' }}>JOURNAL → REDO ON REBOOT</span>
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

function App() {
  return (
    <Stage
      width={1280} height={720}
      duration={SCENE_DURATION}
      background="#0c0a1f"
      loop={false}
    >
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
