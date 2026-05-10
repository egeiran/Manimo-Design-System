// The Inode: A File's Map to Its Blocks — Manimo lesson scene.
// Every file gets a fixed-size inode that holds metadata and a list of
// pointers to disk blocks. Direct pointers cover small files; an indirect
// pointer fans out to reach large ones.
//
// Beats (timed to single-track Voxtral narration in
// motion/operativsystemer/audio/inode-block-pointers/):
//    0.00– 5.44  Manimo intro: where do a file's bytes live?
//    5.44–15.78  The inode card: metadata rows + pointer list
//   15.78–25.13  Direct pointer lookup: pointer 4 → block 4 (genuine motion)
//   25.13–35.63  Indirect pointer: inode → indirect block → far data block
//   35.63–43.00  Takeaway
//
// Authoring notes:
//   • Beats 3 and 4 carry the genuine animation: a dot drives a TraceIn arrow
//     across the canvas to a target data block, which lights up when the
//     arrow tip arrives. The viewer literally watches the lookup happen.
//   • SvgFadeIn for everything inside <svg>; FadeUp for HTML/DOM only.

const SCENE_DURATION = 43;

const NARRATION = [
  /*  0.00– 5.44 */ 'A file is bytes — but where on the disk do those bytes actually live?',
  /*  5.44–15.78 */ 'An inode answers that. It is a small record per file: who owns it, how big it is, when it changed — and a list of pointers to the disk blocks that hold the data.',
  /* 15.78–25.13 */ 'Want byte one thousand? Divide by the block size, look up the right pointer, and follow it. Twelve direct pointers cover small files in one hop.',
  /* 25.13–35.63 */ 'Bigger files reach further. The thirteenth pointer is indirect — it points to a whole block of pointers. Now one inode lookup reaches thousands more blocks.',
  /* 35.63–43.00 */ 'Small files travel one hop. Big files take a tree. Same inode, same shape — only the depth changes.',
];

const NARRATION_AUDIO = 'audio/inode-block-pointers/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="file systems"
      title="The Inode: A File's Map to Its Blocks"
      duration={SCENE_DURATION}
      introEnd={5.44}
      introCaption="How does the file system find your bytes?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.44} end={15.78}>
        <InodeIntroBeat />
      </Sprite>

      <Sprite start={15.78} end={25.13}>
        <DirectLookupBeat />
      </Sprite>

      <Sprite start={25.13} end={35.63}>
        <IndirectLookupBeat />
      </Sprite>

      <Sprite start={35.63} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// Shared inode card geometry — shape used in beats 2-4.
function inodeGeom(portrait) {
  return portrait
    ? { vbW: 600, vbH: 560, cardX: 30, cardY: 30, cardW: 250, cardH: 470,
        metaRowH: 26, ptrCellW: 40, ptrCellH: 18, ptrCols: 4, ptrRows: 3,
        ptrStartY: 220,
        // Right-side data-block grid (4×3 in landscape, 3×4 in portrait)
        gridX: 320, gridY: 60, gridCols: 3, gridRows: 4,
        blockW: 70, blockH: 56, blockGap: 14,
        captionY: 540 }
    : { vbW: 1100, vbH: 480, cardX: 60, cardY: 30, cardW: 280, cardH: 420,
        metaRowH: 26, ptrCellW: 50, ptrCellH: 22, ptrCols: 4, ptrRows: 3,
        ptrStartY: 200,
        gridX: 460, gridY: 50, gridCols: 4, gridRows: 3,
        blockW: 130, blockH: 96, blockGap: 18,
        captionY: 460 };
}

// Render the inode card. `highlightDirect` is the direct-pointer slot index
// to highlight (0..11), `highlightIndirect` lights up the indirect slot.
function InodeCard({ G, highlightDirect = -1, highlightIndirect = false }) {
  const { cardX: x, cardY: y, cardW: w, cardH: h } = G;
  return (
    <g>
      {/* Card backdrop */}
      <rect x={x} y={y} width={w} height={h} rx={10}
        fill="rgba(232,220,193,0.04)"
        stroke="var(--teal-400)" strokeWidth={1.4}/>
      {/* Header */}
      <rect x={x} y={y} width={w} height={32} rx={10}
        fill="var(--teal-400)" opacity={0.85}/>
      <rect x={x} y={y + 22} width={w} height={10}
        fill="var(--teal-400)" opacity={0.85}/>
      <text x={x + 16} y={y + 22}
        fill="#0c0a1f"
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={18} fontWeight={500}>
        Inode #42
      </text>

      {/* Metadata rows */}
      {[
        ['mode',  '-rw-r--r--'],
        ['owner', 'alice (1000)'],
        ['size',  '4 612 bytes'],
        ['mtime', '2026-05-09 18:21'],
      ].map(([k, v], i) => {
        const ry = y + 56 + i * G.metaRowH;
        return (
          <g key={k}>
            <text x={x + 16} y={ry}
              fill="var(--chalk-300)"
              fontFamily="var(--font-mono)" fontSize={11}
              letterSpacing="0.08em">
              {k}
            </text>
            <text x={x + 76} y={ry}
              fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={12}>
              {v}
            </text>
          </g>
        );
      })}

      {/* Divider */}
      <line x1={x + 16} y1={G.ptrStartY - 14}
        x2={x + w - 16} y2={G.ptrStartY - 14}
        stroke="var(--chalk-300)" strokeWidth={1} opacity={0.4}/>
      <text x={x + 16} y={G.ptrStartY - 22}
        fill="var(--chalk-300)"
        fontFamily="var(--font-mono)" fontSize={10}
        letterSpacing="0.16em">DIRECT POINTERS</text>

      {/* 12 direct pointer cells (4 cols × 3 rows) */}
      {[...Array(12)].map((_, i) => {
        const col = i % G.ptrCols;
        const row = Math.floor(i / G.ptrCols);
        const px = x + 16 + col * (G.ptrCellW + 6);
        const py = G.ptrStartY + row * (G.ptrCellH + 6);
        const isHL = i === highlightDirect;
        return (
          <g key={i}>
            <rect x={px} y={py} width={G.ptrCellW} height={G.ptrCellH}
              rx={3}
              fill={isHL ? 'var(--amber-400)' : 'rgba(232,220,193,0.06)'}
              opacity={isHL ? 0.85 : 1}
              stroke={isHL ? 'var(--amber-400)' : 'var(--chalk-300)'}
              strokeWidth={1}/>
            <text x={px + G.ptrCellW / 2} y={py + G.ptrCellH / 2 + 4}
              textAnchor="middle"
              fill={isHL ? '#0c0a1f' : 'var(--chalk-200)'}
              fontFamily="var(--font-mono)" fontSize={10}>
              [{i}]
            </text>
          </g>
        );
      })}

      {/* Indirect pointer slot */}
      <line x1={x + 16} y1={G.ptrStartY + G.ptrRows * (G.ptrCellH + 6) + 8}
        x2={x + w - 16} y2={G.ptrStartY + G.ptrRows * (G.ptrCellH + 6) + 8}
        stroke="var(--chalk-300)" strokeWidth={1} opacity={0.4}/>
      <text x={x + 16} y={G.ptrStartY + G.ptrRows * (G.ptrCellH + 6) + 24}
        fill="var(--chalk-300)"
        fontFamily="var(--font-mono)" fontSize={10}
        letterSpacing="0.16em">INDIRECT</text>
      {(() => {
        const ix = x + 16;
        const iy = G.ptrStartY + G.ptrRows * (G.ptrCellH + 6) + 32;
        const iw = w - 32;
        const ih = 22;
        return (
          <g>
            <rect x={ix} y={iy} width={iw} height={ih}
              rx={3}
              fill={highlightIndirect ? 'var(--rose-400)' : 'rgba(232,220,193,0.06)'}
              opacity={highlightIndirect ? 0.85 : 1}
              stroke={highlightIndirect ? 'var(--rose-400)' : 'var(--chalk-300)'}
              strokeWidth={1}/>
            <text x={ix + iw / 2} y={iy + ih / 2 + 4}
              textAnchor="middle"
              fill={highlightIndirect ? '#0c0a1f' : 'var(--chalk-200)'}
              fontFamily="var(--font-mono)" fontSize={11}>
              → block of pointers
            </text>
          </g>
        );
      })()}
    </g>
  );
}

// Compute the screen-space (x,y) of the centre of direct-pointer slot i.
function ptrSlotCentre(G, i) {
  const col = i % G.ptrCols;
  const row = Math.floor(i / G.ptrCols);
  const px = G.cardX + 16 + col * (G.ptrCellW + 6) + G.ptrCellW;
  const py = G.ptrStartY + row * (G.ptrCellH + 6) + G.ptrCellH / 2;
  return { x: px, y: py };
}

function indirectSlotCentre(G) {
  const ix = G.cardX + 16;
  const iw = G.cardW - 32;
  const iy = G.ptrStartY + G.ptrRows * (G.ptrCellH + 6) + 32;
  return { x: ix + iw, y: iy + 11 };
}

function blockCentre(G, i) {
  const col = i % G.gridCols;
  const row = Math.floor(i / G.gridCols);
  const x = G.gridX + col * (G.blockW + G.blockGap) + G.blockW / 2;
  const y = G.gridY + row * (G.blockH + G.blockGap) + G.blockH / 2;
  return { x, y };
}

function blockCorner(G, i) {
  const col = i % G.gridCols;
  const row = Math.floor(i / G.gridCols);
  const x = G.gridX + col * (G.blockW + G.blockGap);
  const y = G.gridY + row * (G.blockH + G.blockGap);
  return { x, y };
}

// ─── Beat 2: The inode card ───────────────────────────────────────────────
function InodeIntroBeat() {
  const portrait = usePortrait();
  const G = inodeGeom(portrait);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.5} delay={0.2}>
          <InodeCard G={G}/>
        </SvgFadeIn>

        {/* Annotation lines pointing at the metadata + pointer regions */}
        <SvgFadeIn duration={0.5} delay={2.4}>
          <line x1={G.cardX + G.cardW + 8} y1={G.cardY + 80}
            x2={G.cardX + G.cardW + (portrait ? 50 : 100)} y2={G.cardY + 80}
            stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}/>
          <text x={G.cardX + G.cardW + (portrait ? 56 : 110)} y={G.cardY + 84}
            fill="var(--teal-400)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 14 : 16}>
            metadata
          </text>
          <text x={G.cardX + G.cardW + (portrait ? 56 : 110)} y={G.cardY + 102}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}>
            who · how big · when
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={4.0}>
          <line x1={G.cardX + G.cardW + 8} y1={G.ptrStartY + 24}
            x2={G.cardX + G.cardW + (portrait ? 50 : 100)} y2={G.ptrStartY + 24}
            stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}/>
          <text x={G.cardX + G.cardW + (portrait ? 56 : 110)} y={G.ptrStartY + 28}
            fill="var(--amber-300)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 14 : 16}>
            block pointers
          </text>
          <text x={G.cardX + G.cardW + (portrait ? 56 : 110)} y={G.ptrStartY + 46}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}>
            12 direct + 1 indirect
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={8.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            one fixed-size record per file — found by inode number
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Direct pointer lookup ────────────────────────────────────────
function DirectLookupBeat() {
  const portrait = usePortrait();
  const G = inodeGeom(portrait);
  const { localTime } = useSprite();

  const targetSlot = 4;     // pointer index to follow
  const targetBlock = 4;    // matching data-block index in the grid

  // Pointer source + block destination centres.
  const src = ptrSlotCentre(G, targetSlot);
  const dst = blockCentre(G, targetBlock);

  // Arrow draw progress (eased) — 1.4..2.4 s.
  const arrowStart = 1.4;
  const arrowDur = 1.0;
  const t = clamp((localTime - arrowStart) / arrowDur, 0, 1);
  const cur = { x: src.x + (dst.x - src.x) * t, y: src.y + (dst.y - src.y) * t };

  // Block lights up when the arrow tip arrives (t ≥ 1).
  const blockLit = t >= 1;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 10,
        }}>
        direct pointer — one hop
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Inode card with target slot highlighted (after delay 0.6) */}
        <InodeCard G={G} highlightDirect={localTime > 0.6 ? targetSlot : -1}/>

        {/* Data-block grid (12 blocks) */}
        {[...Array(G.gridCols * G.gridRows)].map((_, i) => {
          const c = blockCorner(G, i);
          const isLit = blockLit && i === targetBlock;
          return (
            <g key={i}>
              <rect x={c.x} y={c.y} width={G.blockW} height={G.blockH}
                rx={6}
                fill={isLit ? 'var(--amber-400)' : 'rgba(232,220,193,0.04)'}
                opacity={isLit ? 0.6 : 1}
                stroke={isLit ? 'var(--amber-400)' : 'var(--chalk-300)'}
                strokeWidth={isLit ? 1.6 : 1}/>
              <text x={c.x + G.blockW / 2} y={c.y + G.blockH / 2 + 4}
                textAnchor="middle"
                fill={isLit ? 'var(--chalk-100)' : 'var(--chalk-300)'}
                fontFamily="var(--font-mono)" fontSize={11}
                letterSpacing="0.06em">
                blk {i}
              </text>
            </g>
          );
        })}

        {/* Grid label */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <text x={G.gridX} y={G.gridY - 12}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.16em">DATA BLOCKS ON DISK</text>
        </SvgFadeIn>

        {/* The lookup arrow — drawn dynamically from src toward dst */}
        {localTime > arrowStart && (
          <g>
            <line x1={src.x} y1={src.y} x2={cur.x} y2={cur.y}
              stroke="var(--amber-400)" strokeWidth={2}/>
            {t > 0 && (
              <circle cx={cur.x} cy={cur.y} r={5}
                fill="var(--amber-400)"/>
            )}
          </g>
        )}

        {/* Math caption: byte → block calc */}
        <SvgFadeIn duration={0.5} delay={3.4}>
          <text x={G.vbW / 2} y={G.captionY - 22}
            textAnchor="middle"
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 15}>
            byte 16384 → block ⌊16384 / 4096⌋ = 4
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={7.6}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            twelve direct pointers — one inode lookup reaches the bytes
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Indirect pointer lookup ──────────────────────────────────────
function IndirectLookupBeat() {
  const portrait = usePortrait();
  const G = inodeGeom(portrait);
  const { localTime } = useSprite();

  // Indirect block geometry — sits where the data blocks lived in beat 3.
  // Show it as a tightly-packed grid of pointer cells.
  const ind = portrait
    ? { x: 320, y: 60, cols: 6, rows: 8, cellW: 38, cellH: 22, gap: 4 }
    : { x: 460, y: 50, cols: 8, rows: 8, cellW: 50, cellH: 24, gap: 5 };

  // Far data block — placed off to the right/bottom.
  const farBlock = portrait
    ? { x: 320, y: 320, w: 220, h: 60 }
    : { x: 800, y: 320, w: 240, h: 80 };

  // Source: indirect slot in inode. Picked indirect-cell index 27.
  const indirectCellIdx = 27;
  const indCellCol = indirectCellIdx % ind.cols;
  const indCellRow = Math.floor(indirectCellIdx / ind.cols);
  const indCellX = ind.x + indCellCol * (ind.cellW + ind.gap) + ind.cellW / 2;
  const indCellY = ind.y + indCellRow * (ind.cellH + ind.gap) + ind.cellH / 2;

  const src = indirectSlotCentre(G);
  const dst1 = { x: ind.x - 4, y: ind.y + ind.rows * (ind.cellH + ind.gap) / 2 };
  const dst2 = { x: farBlock.x + farBlock.w / 2, y: farBlock.y + farBlock.h / 2 };

  // First arrow: 0.8..1.6 s. Second arrow: 3.0..3.8 s.
  const a1Start = 0.8, a1Dur = 0.8;
  const a2Start = 3.0, a2Dur = 0.8;
  const t1 = clamp((localTime - a1Start) / a1Dur, 0, 1);
  const t2 = clamp((localTime - a2Start) / a2Dur, 0, 1);

  // Highlights: indirect cell after t1 finishes; far block after t2 finishes.
  const cellLit = localTime > a1Start + a1Dur + 0.2;
  const blockLit = t2 >= 1;

  // Animated arrow tips
  const tip1 = { x: src.x + (dst1.x - src.x) * t1, y: src.y + (dst1.y - src.y) * t1 };
  // Second arrow source: chosen cell centre.
  const a2Src = { x: indCellX, y: indCellY };
  const tip2 = { x: a2Src.x + (dst2.x - a2Src.x) * t2, y: a2Src.y + (dst2.y - a2Src.y) * t2 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--rose-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 10,
        }}>
        indirect pointer — two hops
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Inode with indirect slot highlighted */}
        <InodeCard G={G} highlightIndirect={localTime > 0.4}/>

        {/* Indirect block: a grid of pointer cells, fades in just after the
            first arrow lands. */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <rect x={ind.x - 6} y={ind.y - 22}
            width={ind.cols * (ind.cellW + ind.gap) + 6}
            height={ind.rows * (ind.cellH + ind.gap) + 26}
            rx={6}
            fill="rgba(232,220,193,0.04)"
            stroke="var(--chalk-300)" strokeWidth={1}/>
          <text x={ind.x} y={ind.y - 8}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.16em">INDIRECT BLOCK · 1024 PTRS</text>
          {[...Array(ind.cols * ind.rows)].map((_, i) => {
            const col = i % ind.cols;
            const row = Math.floor(i / ind.cols);
            const x = ind.x + col * (ind.cellW + ind.gap);
            const y = ind.y + row * (ind.cellH + ind.gap);
            const isHL = cellLit && i === indirectCellIdx;
            return (
              <rect key={i} x={x} y={y} width={ind.cellW} height={ind.cellH}
                rx={2}
                fill={isHL ? 'var(--rose-400)' : 'rgba(232,220,193,0.05)'}
                opacity={isHL ? 0.85 : 1}
                stroke={isHL ? 'var(--rose-400)' : 'var(--chalk-300)'}
                strokeWidth={isHL ? 1.4 : 0.8}/>
            );
          })}
        </SvgFadeIn>

        {/* Far data block — sits below or to the side */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <rect x={farBlock.x} y={farBlock.y} width={farBlock.w} height={farBlock.h}
            rx={6}
            fill={blockLit ? 'var(--rose-400)' : 'rgba(232,220,193,0.04)'}
            opacity={blockLit ? 0.6 : 1}
            stroke={blockLit ? 'var(--rose-400)' : 'var(--chalk-300)'}
            strokeWidth={blockLit ? 1.6 : 1}/>
          <text x={farBlock.x + farBlock.w / 2} y={farBlock.y + farBlock.h / 2 + 5}
            textAnchor="middle"
            fill={blockLit ? 'var(--chalk-100)' : 'var(--chalk-300)'}
            fontFamily="var(--font-mono)" fontSize={12}>
            data block 1024+27
          </text>
        </SvgFadeIn>

        {/* Arrow 1: inode indirect slot → indirect block */}
        {localTime > a1Start && (
          <g>
            <line x1={src.x} y1={src.y} x2={tip1.x} y2={tip1.y}
              stroke="var(--rose-400)" strokeWidth={2}/>
            <circle cx={tip1.x} cy={tip1.y} r={4}
              fill="var(--rose-400)"/>
          </g>
        )}

        {/* Arrow 2: indirect cell → far data block */}
        {localTime > a2Start && (
          <g>
            <line x1={a2Src.x} y1={a2Src.y} x2={tip2.x} y2={tip2.y}
              stroke="var(--rose-400)" strokeWidth={2}/>
            <circle cx={tip2.x} cy={tip2.y} r={4}
              fill="var(--rose-400)"/>
          </g>
        )}

        {/* Math caption */}
        <SvgFadeIn duration={0.5} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY - 22}
            textAnchor="middle"
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 15}>
            12 + 1024 = 1036 reachable blocks per inode
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={8.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--rose-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            two hops — one to the index, one to the data
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 32,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '40ch',
          lineHeight: 1.3,
        }}>
        Small file: one hop. Big file: a tree.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.14em',
          textAlign: 'center',
          maxWidth: portrait ? '32ch' : 'none',
        }}>
        real systems also stack double- and triple-indirect pointers
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
