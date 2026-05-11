// Demand Paging — Manimo lesson scene.
// Virtual pages live in two places: a few in physical RAM frames, the
// rest on disk in the swap area. The page-table's present bit says
// which. When the CPU reads a present=0 page, a page fault triggers
// the swap-in animation: a page tile slides from disk up to a free
// RAM frame and the present bit flips. When RAM is full, an old page
// must be evicted first — the tile slides down.
//
// Genuine animation lives in `FaultBeat` and `EvictionBeat`: a page
// tile's y-position is interpolated by sprite localTime so it visibly
// travels between the RAM and disk blocks. The page-table entries on
// the right update their present bits in sync.

const SCENE_DURATION = 54;

const NARRATION = [
  /*  0.00–10.09 */ 'Your program thinks it owns gigabytes of memory. In reality, only the pages you actively touch live in RAM. The rest sit on disk until you need them.',
  /* 10.09–20.28 */ 'Physical memory holds a handful of page frames. The disk swap area holds many more. The present bit in each page-table entry says which store to look in.',
  /* 20.28–34.18 */ 'When the CPU reads a virtual page whose present bit is zero, the hardware traps into the kernel. The page-fault handler finds the page on disk and copies it into a free frame. Then the access can be retried.',
  /* 34.18–45.13 */ 'If RAM is already full, one of the resident pages has to leave first. The replacement policy picks a victim, writes it back if dirty, and only then the new page can land.',
  /* 45.13–54.00 */ "Hit in RAM, it's nanoseconds. Miss to disk, it's milliseconds. Demand paging only pays that price for what you actually use.",
];

const NARRATION_AUDIO = 'audio/demand-paging/scene.mp3';

function memGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 580,
        ramX: 50,  ramY: 100, ramW: 240, ramH: 110, frameW: 50, frameGap: 6,
        diskX: 50, diskY: 290, diskW: 240, diskH: 220,
        ptX: 320,  ptY: 90,  ptW: 250, rowH: 28,
        labelFs: 12, eyebrowFs: 11 }
    : { vbW: 1080, vbH: 430,
        ramX: 90,  ramY: 90,  ramW: 420, ramH: 110, frameW: 90, frameGap: 10,
        diskX: 90, diskY: 240, diskW: 420, diskH: 150,
        ptX: 590,  ptY: 80,  ptW: 360, rowH: 34,
        labelFs: 13, eyebrowFs: 12 };
}

const RAM_SLOTS = 4;
const DISK_SLOTS_PER_ROW = 6;
const DISK_ROWS = 2;

// Returns the centre (x,y) of RAM frame index i (0..3).
function ramSlotXY(G, i) {
  const totalW = RAM_SLOTS * G.frameW + (RAM_SLOTS - 1) * G.frameGap;
  const startX = G.ramX + (G.ramW - totalW) / 2;
  const x = startX + i * (G.frameW + G.frameGap) + G.frameW / 2;
  const y = G.ramY + G.ramH / 2 + 8;
  return { x, y };
}
// Returns the centre (x,y) of disk slot index i (0..DISK_SLOTS_PER_ROW*DISK_ROWS - 1).
function diskSlotXY(G, i) {
  const col = i % DISK_SLOTS_PER_ROW;
  const row = Math.floor(i / DISK_SLOTS_PER_ROW);
  const cellW = (G.diskW - 40) / DISK_SLOTS_PER_ROW;
  const cellH = (G.diskH - 50) / DISK_ROWS;
  const x = G.diskX + 20 + col * cellW + cellW / 2;
  const y = G.diskY + 32 + row * cellH + cellH / 2;
  return { x, y };
}

function PageTile({ x, y, label, color, w = 60, h = 36, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6}
        fill={color} opacity={0.55}
        stroke={color} strokeWidth={1.4}/>
      <text x={x} y={y + 5}
        textAnchor="middle"
        fill="var(--chalk-100)"
        fontFamily="var(--font-mono)" fontSize={13}
        letterSpacing="0.08em">
        {label}
      </text>
    </g>
  );
}

function MemoryFrame({ G, slotIdx, occupied }) {
  const { x, y } = ramSlotXY(G, slotIdx);
  return (
    <rect
      x={x - G.frameW / 2} y={y - 28}
      width={G.frameW} height={56} rx={6}
      fill={occupied ? 'var(--amber-400)' : 'var(--chalk-200)'}
      fillOpacity={occupied ? 0.06 : 0.025}
      stroke="var(--chalk-300)" strokeWidth={1.2}/>
  );
}

function DiskSlot({ G, slotIdx }) {
  const { x, y } = diskSlotXY(G, slotIdx);
  return (
    <rect
      x={x - 30} y={y - 18}
      width={60} height={36} rx={6}
      fill="var(--chalk-200)" fillOpacity={0.025}
      stroke="var(--chalk-300)" strokeWidth={1}
      strokeDasharray="3 4"/>
  );
}

function PageTable({ G, entries }) {
  // entries: [{ vpn, present }]
  return (
    <g>
      <text x={G.ptX + G.ptW / 2} y={G.ptY - 14}
        textAnchor="middle"
        fill="var(--chalk-300)"
        fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.18em">
        PAGE TABLE
      </text>
      <rect x={G.ptX} y={G.ptY} width={G.ptW} height={entries.length * G.rowH + 24} rx={8}
        fill="var(--chalk-200)" fillOpacity={0.025}
        stroke="var(--chalk-300)" strokeWidth={1}/>
      {entries.map((e, i) => {
        const y = G.ptY + 14 + i * G.rowH + G.rowH / 2;
        return (
          <g key={i}>
            <text x={G.ptX + 18} y={y + 5}
              fill="var(--chalk-200)"
              fontFamily="var(--font-mono)" fontSize={12}
              letterSpacing="0.06em">
              {e.vpn}
            </text>
            <text x={G.ptX + G.ptW - 18} y={y + 5}
              textAnchor="end"
              fill={e.present ? 'var(--teal-400)' : 'var(--rose-300)'}
              fontFamily="var(--font-mono)" fontSize={12}
              letterSpacing="0.10em">
              {e.present ? 'present = 1' : 'present = 0'}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="virtual memory"
      title="Demand Paging"
      duration={SCENE_DURATION}
      introEnd={10.09}
      introCaption="RAM is small. Programs can be much bigger."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.09} end={20.28}>
        <TwoStoresBeat/>
      </Sprite>

      <Sprite start={20.28} end={34.18}>
        <FaultBeat/>
      </Sprite>

      <Sprite start={34.18} end={45.13}>
        <EvictionBeat/>
      </Sprite>

      <Sprite start={45.13} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

const PAGE_COLORS = {
  V0: 'var(--chalk-200)',
  V1: 'var(--amber-400)',
  V2: 'var(--rose-400)',
  V3: 'var(--teal-400)',
  V4: 'var(--violet-400)',
  V5: 'var(--rose-400)',
};

// ─── Beat 2: introduce two stores ────────────────────────────────────────
function TwoStoresBeat() {
  const portrait = usePortrait();
  const G = memGeometry(portrait);

  // Initial layout: V1 sits in RAM frame 0, V3 sits in RAM frame 2.
  // V0, V2, V4 sit in disk slots.
  const ramOccupants = { 0: 'V1', 2: 'V3' };
  const diskOccupants = { 0: 'V0', 1: 'V2', 2: 'V4', 7: 'V5' };

  const entries = [
    { vpn: 'V0', present: 0 },
    { vpn: 'V1', present: 1 },
    { vpn: 'V2', present: 0 },
    { vpn: 'V3', present: 1 },
    { vpn: 'V4', present: 0 },
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
            RAM = FAST, SMALL · DISK = SLOW, BIG
          </text>
        </SvgFadeIn>

        {/* RAM block */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <rect x={G.ramX} y={G.ramY} width={G.ramW} height={G.ramH} rx={10}
            fill="var(--amber-400)" fillOpacity={0.04}
            stroke="var(--amber-400)" strokeWidth={1.3} opacity={0.8}/>
          <text x={G.ramX + 14} y={G.ramY + 22}
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">
            PHYSICAL MEMORY · 4 FRAMES
          </text>
        </SvgFadeIn>
        {[0, 1, 2, 3].map(i => (
          <SvgFadeIn key={i} duration={0.3} delay={0.7 + i * 0.1}>
            <MemoryFrame G={G} slotIdx={i} occupied={!!ramOccupants[i]}/>
          </SvgFadeIn>
        ))}
        {Object.entries(ramOccupants).map(([slot, vpn]) => {
          const { x, y } = ramSlotXY(G, +slot);
          return (
            <SvgFadeIn key={vpn} duration={0.4} delay={1.2}>
              <PageTile x={x} y={y} label={vpn} color={PAGE_COLORS[vpn]}/>
            </SvgFadeIn>
          );
        })}

        {/* Disk block */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <rect x={G.diskX} y={G.diskY} width={G.diskW} height={G.diskH} rx={10}
            fill="var(--chalk-200)" fillOpacity={0.025}
            stroke="var(--chalk-300)" strokeWidth={1.2} opacity={0.7}/>
          <text x={G.diskX + 14} y={G.diskY + 22}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">
            DISK SWAP AREA
          </text>
        </SvgFadeIn>
        {Array.from({ length: DISK_SLOTS_PER_ROW * DISK_ROWS }).map((_, i) => (
          <SvgFadeIn key={i} duration={0.3} delay={0.9 + i * 0.05}>
            <DiskSlot G={G} slotIdx={i}/>
          </SvgFadeIn>
        ))}
        {Object.entries(diskOccupants).map(([slot, vpn]) => {
          const { x, y } = diskSlotXY(G, +slot);
          return (
            <SvgFadeIn key={vpn} duration={0.4} delay={1.5}>
              <PageTile x={x} y={y} label={vpn} color={PAGE_COLORS[vpn]} w={56} h={32}/>
            </SvgFadeIn>
          );
        })}

        {/* Page table */}
        <SvgFadeIn duration={0.5} delay={2.0}>
          <PageTable G={G} entries={entries}/>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: page fault — the centrepiece swap-in animation ─────────────
// CPU reads V2. Page table shows present=0 (row pulses rose). Page V2
// then *slides* from its disk slot up to a free RAM frame (slot 1) over
// a 2.5s window. When it lands, the present bit flips to 1.
function FaultBeat() {
  const portrait = usePortrait();
  const G = memGeometry(portrait);
  const { localTime } = useSprite();

  // Initial layout (kept from previous beat):
  const ramOccupants = { 0: 'V1', 2: 'V3' };
  const diskOccupants = { 0: 'V0', 2: 'V4', 7: 'V5' };  // V2 no longer here once it moves

  // Animation schedule:
  //   0.0..0.6   eyebrow + everything fades in
  //   0.6..1.6   "CPU reads V2" arrow points from a CPU glyph to PT row V2
  //   1.6..2.4   trap glyph appears
  //   2.4..5.4   V2 page tile travels from its disk slot to RAM frame 1
  //   5.4+       present bit flips to 1, V2 sits in RAM
  const trapOp = clamp((localTime - 1.6) / 0.5, 0, 1);
  const swapFrac = clamp((localTime - 2.4) / 3.0, 0, 1);
  const swapEased = Easing.easeInOutCubic(swapFrac);

  const v2Start = diskSlotXY(G, 1);          // we say V2 was at disk slot 1
  const v2End   = ramSlotXY(G, 1);           // lands in RAM slot 1
  const v2x = v2Start.x + (v2End.x - v2Start.x) * swapEased;
  const v2y = v2Start.y + (v2End.y - v2Start.y) * swapEased;

  const entries = [
    { vpn: 'V0', present: 0 },
    { vpn: 'V1', present: 1 },
    { vpn: 'V2', present: swapFrac >= 0.99 ? 1 : 0 },
    { vpn: 'V3', present: 1 },
    { vpn: 'V4', present: 0 },
  ];

  // V2 row pulse (rose) — pulses on while present is still 0 and we're
  // doing the fault.
  const v2RowY = G.ptY + 14 + 2 * G.rowH + G.rowH / 2;
  const v2RowPulse = (() => {
    if (localTime < 0.6 || swapFrac >= 0.99) return 0;
    const t = localTime - 0.6;
    return 0.4 + 0.4 * Math.abs(Math.sin(t * 3.5));
  })();

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={50}
            textAnchor="middle"
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={G.eyebrowFs}
            letterSpacing="0.18em">
            PAGE FAULT — FETCH FROM DISK
          </text>
        </SvgFadeIn>

        {/* RAM */}
        <rect x={G.ramX} y={G.ramY} width={G.ramW} height={G.ramH} rx={10}
          fill="var(--amber-400)" fillOpacity={0.04}
          stroke="var(--amber-400)" strokeWidth={1.3} opacity={0.8}/>
        <text x={G.ramX + 14} y={G.ramY + 22}
          fill="var(--amber-300)"
          fontFamily="var(--font-mono)" fontSize={11}
          letterSpacing="0.18em">
          PHYSICAL MEMORY
        </text>
        {[0, 1, 2, 3].map(i => (
          <MemoryFrame key={i} G={G} slotIdx={i} occupied={!!ramOccupants[i] || (i === 1 && swapFrac > 0.5)}/>
        ))}
        {Object.entries(ramOccupants).map(([slot, vpn]) => {
          const { x, y } = ramSlotXY(G, +slot);
          return <PageTile key={vpn} x={x} y={y} label={vpn} color={PAGE_COLORS[vpn]}/>;
        })}

        {/* Disk */}
        <rect x={G.diskX} y={G.diskY} width={G.diskW} height={G.diskH} rx={10}
          fill="var(--chalk-200)" fillOpacity={0.025}
          stroke="var(--chalk-300)" strokeWidth={1.2} opacity={0.7}/>
        <text x={G.diskX + 14} y={G.diskY + 22}
          fill="var(--chalk-300)"
          fontFamily="var(--font-mono)" fontSize={11}
          letterSpacing="0.18em">
          DISK SWAP AREA
        </text>
        {Array.from({ length: DISK_SLOTS_PER_ROW * DISK_ROWS }).map((_, i) => (
          <DiskSlot key={i} G={G} slotIdx={i}/>
        ))}
        {Object.entries(diskOccupants).map(([slot, vpn]) => {
          const { x, y } = diskSlotXY(G, +slot);
          return <PageTile key={vpn} x={x} y={y} label={vpn} color={PAGE_COLORS[vpn]} w={56} h={32}/>;
        })}

        {/* The travelling V2 tile — visible from when fault starts until
            it lands. The disk slot it left is just an empty cell. */}
        {localTime > 1.6 && (
          <PageTile x={v2x} y={v2y} label="V2"
            color={PAGE_COLORS.V2}
            w={swapFrac < 0.5 ? 56 : 60}
            h={swapFrac < 0.5 ? 32 : 36}/>
        )}

        {/* Page table on the right */}
        <PageTable G={G} entries={entries}/>
        {/* V2 row pulse highlight */}
        {v2RowPulse > 0 && (
          <rect x={G.ptX + 4} y={v2RowY - G.rowH / 2 + 2}
            width={G.ptW - 8} height={G.rowH - 4}
            fill="var(--rose-400)" opacity={v2RowPulse * 0.18}
            rx={4}/>
        )}

        {/* Trap glyph — sits to the right edge of the RAM block,
            below the eyebrow but above the disk. Fades out once V2 has
            landed in RAM so it doesn't clutter the post-fault frame. */}
        {trapOp > 0 && (() => {
          const trapFadeOut = clamp((6.5 - localTime) / 0.8, 0, 1);
          const op = trapOp * trapFadeOut;
          if (op <= 0) return null;
          return (
            <g opacity={op}>
              <text
                x={G.ramX + G.ramW - 14}
                y={G.ramY + G.ramH + 52}
                textAnchor="end"
                fill="var(--rose-300)"
                fontFamily="var(--font-mono)" fontSize={11}
                letterSpacing="0.16em">
                TRAP → kernel
              </text>
            </g>
          );
        })()}

        {/* CPU read indicator — placed under the RAM block, well below
            the eyebrow so they never collide. */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.ramX + G.ramW / 2} y={G.ramY + G.ramH + 30}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.14em">
            CPU reads V2 → check present bit
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: eviction — two tiles travel in opposite directions ─────────
function EvictionBeat() {
  const portrait = usePortrait();
  const G = memGeometry(portrait);
  const { localTime } = useSprite();

  // Starting state (continuing from after fault beat): RAM is now full,
  // with V1, V2, V3, V4 — V4 was loaded after the previous beat.
  const ramOccupants = { 0: 'V1', 1: 'V2', 2: 'V3', 3: 'V4' };
  const diskOccupants = { 1: 'V0', 7: 'V5' };  // V5 is the one we'll bring in

  // CPU touches V5 (present=0). Need a victim → policy picks V1.
  //   1.0..3.0  V1 slides DOWN from RAM slot 0 to disk slot 0
  //   3.0..3.4  pause
  //   3.4..6.4  V5 slides UP from disk slot 7 to RAM slot 0
  const evictFrac = clamp((localTime - 1.0) / 2.0, 0, 1);
  const evictEased = Easing.easeInOutCubic(evictFrac);
  const installFrac = clamp((localTime - 3.4) / 3.0, 0, 1);
  const installEased = Easing.easeInOutCubic(installFrac);

  const v1Start = ramSlotXY(G, 0);
  const v1End   = diskSlotXY(G, 0);
  const v1x = v1Start.x + (v1End.x - v1Start.x) * evictEased;
  const v1y = v1Start.y + (v1End.y - v1Start.y) * evictEased;

  const v5Start = diskSlotXY(G, 7);
  const v5End   = ramSlotXY(G, 0);
  const v5x = v5Start.x + (v5End.x - v5Start.x) * installEased;
  const v5y = v5Start.y + (v5End.y - v5Start.y) * installEased;

  const entries = [
    { vpn: 'V1', present: evictFrac >= 0.99 ? 0 : 1 },
    { vpn: 'V2', present: 1 },
    { vpn: 'V3', present: 1 },
    { vpn: 'V4', present: 1 },
    { vpn: 'V5', present: installFrac >= 0.99 ? 1 : 0 },
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
            RAM FULL — EVICT BEFORE INSTALL
          </text>
        </SvgFadeIn>

        {/* RAM */}
        <rect x={G.ramX} y={G.ramY} width={G.ramW} height={G.ramH} rx={10}
          fill="var(--amber-400)" fillOpacity={0.04}
          stroke="var(--amber-400)" strokeWidth={1.3} opacity={0.8}/>
        <text x={G.ramX + 14} y={G.ramY + 22}
          fill="var(--amber-300)"
          fontFamily="var(--font-mono)" fontSize={11}
          letterSpacing="0.18em">
          PHYSICAL MEMORY
        </text>
        {[0, 1, 2, 3].map(i => {
          // Slot 0 is being emptied during evict, then filled during install
          let occupied = !!ramOccupants[i];
          if (i === 0) occupied = evictFrac < 0.5 || installFrac > 0.5;
          return <MemoryFrame key={i} G={G} slotIdx={i} occupied={occupied}/>;
        })}
        {/* RAM contents that aren't moving */}
        {[1, 2, 3].map(i => {
          const vpn = ramOccupants[i];
          const { x, y } = ramSlotXY(G, i);
          return <PageTile key={vpn} x={x} y={y} label={vpn} color={PAGE_COLORS[vpn]}/>;
        })}

        {/* Disk */}
        <rect x={G.diskX} y={G.diskY} width={G.diskW} height={G.diskH} rx={10}
          fill="var(--chalk-200)" fillOpacity={0.025}
          stroke="var(--chalk-300)" strokeWidth={1.2} opacity={0.7}/>
        <text x={G.diskX + 14} y={G.diskY + 22}
          fill="var(--chalk-300)"
          fontFamily="var(--font-mono)" fontSize={11}
          letterSpacing="0.18em">
          DISK SWAP AREA
        </text>
        {Array.from({ length: DISK_SLOTS_PER_ROW * DISK_ROWS }).map((_, i) => (
          <DiskSlot key={i} G={G} slotIdx={i}/>
        ))}
        {/* Disk contents that aren't moving (V0 stays) */}
        {(() => {
          const { x, y } = diskSlotXY(G, 1);
          return <PageTile x={x} y={y} label="V0" color={PAGE_COLORS.V0} w={56} h={32}/>;
        })()}

        {/* Travelling V1 (DOWN) */}
        <PageTile x={v1x} y={v1y} label="V1"
          color={PAGE_COLORS.V1}
          w={evictFrac > 0.5 ? 56 : 60}
          h={evictFrac > 0.5 ? 32 : 36}/>

        {/* Travelling V5 (UP) — only visible after evict completes */}
        {localTime > 3.2 && (
          <PageTile x={v5x} y={v5y} label="V5"
            color={PAGE_COLORS.V5}
            w={installFrac > 0.5 ? 60 : 56}
            h={installFrac > 0.5 ? 36 : 32}/>
        )}

        {/* Page table */}
        <PageTable G={G} entries={entries}/>

        {/* Victim/install labels */}
        {evictFrac > 0 && evictFrac < 1 && (
          <text x={(v1Start.x + v1End.x) / 2 + 70} y={(v1Start.y + v1End.y) / 2}
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.14em">
            ↓ EVICT V1
          </text>
        )}
        {installFrac > 0 && installFrac < 1 && (
          <text x={(v5Start.x + v5End.x) / 2 + 70} y={(v5Start.y + v5End.y) / 2}
            fill="var(--teal-400)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.14em">
            ↑ INSTALL V5
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 5: takeaway ────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 22,
      textAlign: 'center',
      maxWidth: portrait ? '30ch' : '50ch',
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          display: 'flex', gap: portrait ? 14 : 36, alignItems: 'baseline',
          flexDirection: portrait ? 'column' : 'row',
        }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
          }}>RAM HIT</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 44 : 64, color: 'var(--amber-300)',
            lineHeight: 1,
          }}>≈ 100 ns</div>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 26,
          color: 'var(--chalk-300)', letterSpacing: '0.16em',
        }}>vs</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--rose-300)', letterSpacing: '0.18em',
          }}>DISK MISS</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 44 : 64, color: 'var(--rose-300)',
            lineHeight: 1,
          }}>≈ 10 ms</div>
        </div>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.5} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          lineHeight: 1.35,
        }}>
        five orders of magnitude — keep your working set small
      </FadeUp>

      <FadeUp duration={0.5} delay={2.5} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
        }}>
        DEMAND PAGING ONLY PAYS THE PRICE FOR WHAT YOU TOUCH
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
