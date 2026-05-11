// TLB Hits and Misses — Manimo lesson scene.
// The TLB is a tiny on-chip cache of virtual-to-physical mappings; a hit
// completes a translation in one cycle, a miss walks the page table in
// memory and fills the TLB before continuing.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/tlb-hit-miss/):
//    0.00– 8.36  Manimo intro: how do we make a page-table lookup cheap?
//    8.36–17.92  TLB card: four rows, three pre-populated
//   17.92–27.32  Hit: virtual address glides to TLB, row lights up, PFN exits
//   27.32–39.14  Miss: address arrives, no hit; walk to page table; fill TLB; continue
//   39.14–48.00  Takeaway: hit ≈ 10 ns, miss ≈ 100 ns — locality is what saves us
//
// Genuine animation:
//   • Beat 3 (hit): a labeled address tile is interpolated from left edge
//     into the TLB; the matching row's stroke pulses; the resulting PFN
//     tile then travels right to the physical-address box. Two synced
//     value-driven motions.
//   • Beat 4 (miss): the address tile arrives at the TLB but does not
//     match; a dotted path branches down to a page-table box; the PFN
//     travels up and fills an empty TLB row before continuing. The TLB's
//     row content actually changes mid-beat (the empty row becomes
//     occupied with VPN=19 → PFN=34) — a state mutation, not a fade-in.

const SCENE_DURATION = 48;

const NARRATION = [
  /*  0.00– 8.36 */ 'Every memory access has to be translated. Doing that walk on every load would be ruinously slow — so the hardware keeps a tiny cheat sheet.',
  /*  8.36–17.92 */ 'The translation lookaside buffer is a small on-chip cache. Each entry maps a virtual page number to a physical frame number, with a valid bit on the side.',
  /* 17.92–27.32 */ 'A load asks for virtual page seven. The TLB has it, and answers in one cycle: frame ninety-two. Fast path — about ten nanoseconds.',
  /* 27.32–39.14 */ 'A load asks for virtual page nineteen. Not in the TLB. The hardware walks the page table in memory, finds frame thirty-four, fills a TLB slot, and only then completes the access.',
  /* 39.14–48.00 */ 'Programs reuse a small set of pages, so most lookups hit the TLB — and a few cheap misses end up paying for themselves many times over.',
];

const NARRATION_AUDIO = 'audio/tlb-hit-miss/scene.mp3';

// Static TLB contents shown in Beat 2 + Beat 3 (hit on VPN=7).
const TLB_INITIAL = [
  { vpn: '02', pfn: '13', valid: 1 },
  { vpn: '07', pfn: '92', valid: 1 },
  { vpn: '11', pfn: '04', valid: 1 },
  { vpn: '--', pfn: '--', valid: 0 },
];
// In Beat 4 the bottom row gets filled with VPN=19 → PFN=34 after the walk.
const TLB_AFTER_FILL = [
  { vpn: '02', pfn: '13', valid: 1 },
  { vpn: '07', pfn: '92', valid: 1 },
  { vpn: '11', pfn: '04', valid: 1 },
  { vpn: '19', pfn: '34', valid: 1 },
];

function Scene() {
  return (
    <SceneChrome
      eyebrow="paging"
      title="TLB Hits and Misses"
      duration={SCENE_DURATION}
      introEnd={8.36}
      introCaption="How do we make a page-table lookup cheap?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={8.36} end={17.92}>
        <TlbCardBeat />
      </Sprite>

      <Sprite start={17.92} end={27.32}>
        <HitBeat />
      </Sprite>

      <Sprite start={27.32} end={39.14}>
        <MissBeat />
      </Sprite>

      <Sprite start={39.14} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// Shared geometry for the TLB layout — used by beats 2, 3, 4.
function lookupGeom(portrait) {
  return portrait
    ? { vbW: 600, vbH: 500,
        tlbX: 180, tlbY: 80,
        tlbW: 240, rowH: 50, rows: 4,
        addrX: 60, addrY: 175,   // virtual-address tile origin
        padX:  500, padY: 175,   // physical-address tile origin
        pageTblX: 180, pageTblY: 360, pageTblW: 240, pageTblH: 80,
        timingY: 470 }
    : { vbW: 1080, vbH: 500,
        tlbX: 380, tlbY: 60,
        tlbW: 320, rowH: 50, rows: 4,
        addrX: 80, addrY: 150,
        padX:  840, padY: 150,
        pageTblX: 380, pageTblY: 340, pageTblW: 320, pageTblH: 80,
        timingY: 470 };
}

// Reusable TLB drawing. `entries` is an array of 4 row objects; `hitRow`
// (if set) gets a pulsing amber stroke driven by `pulsePhase`.
function TlbTable({ G, entries, hitRow = -1, pulsePhase = 0 }) {
  const colVpnX = G.tlbX + 36;
  const colPfnX = G.tlbX + G.tlbW * 0.5;
  const colValX = G.tlbX + G.tlbW - 36;
  return (
    <g>
      {/* Frame */}
      <rect x={G.tlbX} y={G.tlbY} width={G.tlbW} height={G.rowH * (G.rows + 1)}
        rx={10} fill="rgba(232,220,193,0.04)"
        stroke="var(--chalk-200)" strokeWidth={1.4}/>

      {/* Header row */}
      <rect x={G.tlbX} y={G.tlbY} width={G.tlbW} height={G.rowH}
        rx={10} fill="rgba(244,184,96,0.10)"
        stroke="none"/>
      <text x={colVpnX} y={G.tlbY + G.rowH / 2 + 5}
        fill="var(--amber-300)"
        fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.18em">VPN</text>
      <text x={colPfnX} y={G.tlbY + G.rowH / 2 + 5}
        textAnchor="middle"
        fill="var(--amber-300)"
        fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.18em">PFN</text>
      <text x={colValX} y={G.tlbY + G.rowH / 2 + 5}
        textAnchor="end"
        fill="var(--amber-300)"
        fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.18em">VALID</text>

      {/* Body rows */}
      {entries.map((e, i) => {
        const y = G.tlbY + (i + 1) * G.rowH;
        const isHit = i === hitRow;
        const pulse = isHit ? (0.6 + 0.4 * Math.sin(pulsePhase * 4.0)) : 0;
        return (
          <g key={i}>
            <line x1={G.tlbX} y1={y} x2={G.tlbX + G.tlbW} y2={y}
              stroke="var(--chalk-300)" strokeWidth={1} opacity={0.32}/>
            {isHit && (
              <rect x={G.tlbX + 4} y={y + 4}
                width={G.tlbW - 8} height={G.rowH - 8}
                rx={6}
                fill="var(--teal-400)"
                opacity={0.16 + 0.18 * pulse}
                stroke="var(--teal-400)"
                strokeWidth={1.8}/>
            )}
            <text x={colVpnX} y={y + G.rowH / 2 + 6}
              fill={isHit ? 'var(--teal-400)' : 'var(--chalk-100)'}
              fontFamily="var(--font-mono)" fontSize={15}>
              {e.vpn}
            </text>
            <text x={colPfnX} y={y + G.rowH / 2 + 6}
              textAnchor="middle"
              fill={isHit ? 'var(--teal-400)' : 'var(--chalk-100)'}
              fontFamily="var(--font-mono)" fontSize={15}>
              {e.pfn}
            </text>
            <text x={colValX} y={y + G.rowH / 2 + 6}
              textAnchor="end"
              fill={e.valid ? (isHit ? 'var(--teal-400)' : 'var(--chalk-200)') : 'var(--chalk-300)'}
              fontFamily="var(--font-mono)" fontSize={15}>
              {e.valid ? '1' : '0'}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// Small labelled tile representing a virtual or physical address.
function AddrTile({ x, y, w, h, eyebrow, value, valueColor, frameColor }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8}
        fill="rgba(232,220,193,0.05)"
        stroke={frameColor} strokeWidth={1.4}/>
      <text x={x + w / 2} y={y + 18}
        textAnchor="middle"
        fill="var(--chalk-300)"
        fontFamily="var(--font-mono)" fontSize={10}
        letterSpacing="0.18em">
        {eyebrow}
      </text>
      <text x={x + w / 2} y={y + h - 14}
        textAnchor="middle"
        fill={valueColor}
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={20}>
        {value}
      </text>
    </g>
  );
}

// ─── Beat 2: TLB card on its own ────────────────────────────────────────
function TlbCardBeat() {
  const portrait = usePortrait();
  const G = lookupGeom(portrait);
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={32}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">
            TLB · TRANSLATION LOOKASIDE BUFFER
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={0.4}>
          <TlbTable G={G} entries={TLB_INITIAL}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={2.6}>
          <text x={G.vbW / 2}
            y={G.tlbY + (G.rows + 1) * G.rowH + 36}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            {portrait
              ? 'small cache of recent translations'
              : 'a small on-chip cache of recent virtual-to-physical mappings'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: TLB Hit ─────────────────────────────────────────────────────
function HitBeat() {
  const portrait = usePortrait();
  const G = lookupGeom(portrait);
  const { localTime } = useSprite();

  // Phases:
  //   0.0–1.5 — VA tile flies from addrX into the TLB's left edge
  //   1.5–2.2 — matching row (VPN=07) pulses
  //   2.2–3.7 — PFN tile flies from TLB's right edge to physical-addr tile
  //   3.7+    — final timing readout

  const tileW = portrait ? 130 : 150;
  const tileH = 56;

  const VA_START = 0.6, VA_END = 1.8;
  const PFN_START = 2.4, PFN_END = 3.7;

  const tlbLeftEdgeX = G.tlbX;
  const tlbRightEdgeX = G.tlbX + G.tlbW;

  // VA tile X — start at addrX, end at TLB left edge (minus tile width)
  const vaProg = clamp((localTime - VA_START) / (VA_END - VA_START), 0, 1);
  const vaStartX = G.addrX;
  const vaEndX = tlbLeftEdgeX - tileW - 8;
  const vaX = vaStartX + (vaEndX - vaStartX) * Easing.easeOutCubic(vaProg);

  // PFN tile X — start at TLB right edge, end at padX
  const pfnProg = clamp((localTime - PFN_START) / (PFN_END - PFN_START), 0, 1);
  const pfnStartX = tlbRightEdgeX + 8;
  const pfnEndX = G.padX;
  const pfnX = pfnStartX + (pfnEndX - pfnStartX) * Easing.easeOutCubic(pfnProg);
  const pfnVisible = localTime >= PFN_START - 0.05;

  const hitRow = localTime >= VA_END - 0.05 ? 1 : -1;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={32}
            textAnchor="middle"
            fill="var(--teal-400)"
            fontFamily="var(--font-mono)" fontSize={12}
            letterSpacing="0.22em">
            TLB HIT
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={0.1}>
          <TlbTable G={G} entries={TLB_INITIAL} hitRow={hitRow} pulsePhase={localTime}/>
        </SvgFadeIn>

        {/* Connecting line from VA tile region to TLB (dashed) */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.addrX + tileW + 6}
            y1={G.addrY + tileH / 2}
            x2={G.tlbX - 6} y2={G.addrY + tileH / 2}
            stroke="var(--chalk-300)" strokeWidth={1.2}
            strokeDasharray="4 4" opacity={0.55}/>
          <line x1={G.tlbX + G.tlbW + 6}
            y1={G.padY + tileH / 2}
            x2={G.padX - 6} y2={G.padY + tileH / 2}
            stroke="var(--chalk-300)" strokeWidth={1.2}
            strokeDasharray="4 4" opacity={0.55}/>
        </SvgFadeIn>

        {/* VA tile — flies in from addrX area */}
        <AddrTile
          x={vaX} y={G.addrY} w={tileW} h={tileH}
          eyebrow="VIRTUAL · VPN"
          value="07"
          valueColor="var(--teal-400)"
          frameColor="var(--teal-400)"/>

        {/* PFN tile — flies out to padX area, only once hit pulses */}
        {pfnVisible && (
          <AddrTile
            x={pfnX} y={G.padY} w={tileW} h={tileH}
            eyebrow="PHYSICAL · PFN"
            value="92"
            valueColor="var(--teal-400)"
            frameColor="var(--teal-400)"/>
        )}

        {/* Timing readout */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.timingY}
            textAnchor="middle"
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 17 : 18}
            letterSpacing="0.06em">
            ≈ 10 ns · one memory cycle
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: TLB Miss ────────────────────────────────────────────────────
function MissBeat() {
  const portrait = usePortrait();
  const G = lookupGeom(portrait);
  const { localTime } = useSprite();

  const tileW = portrait ? 130 : 150;
  const tileH = 56;

  // Phases:
  //   0.4–1.6 — VA tile flies to TLB
  //   1.6–2.6 — VA highlight: red flash (no match)
  //   2.6–4.2 — dotted branch down to page-table box; PFN appears
  //   4.2–5.6 — PFN travels up, fills empty TLB slot 3
  //   5.6–7.0 — PFN tile travels right to physical-addr box
  //   7.0+   — timing readout fades in

  const VA_START = 0.6, VA_END = 1.8;
  const BRANCH_START = 2.6, BRANCH_END = 4.0;
  const FILL_START = 4.2, FILL_END = 5.4;
  const OUT_START = 5.6, OUT_END = 7.0;

  const tlbLeftEdgeX = G.tlbX;
  const tlbRightEdgeX = G.tlbX + G.tlbW;

  // VA tile X — into TLB left edge
  const vaProg = clamp((localTime - VA_START) / (VA_END - VA_START), 0, 1);
  const vaStartX = G.addrX;
  const vaEndX = tlbLeftEdgeX - tileW - 8;
  const vaX = vaStartX + (vaEndX - vaStartX) * Easing.easeOutCubic(vaProg);
  const vaArrived = localTime >= VA_END - 0.1;
  // Red flash on the VA tile when it's at the TLB and no match
  const flashing = vaArrived && localTime < BRANCH_START + 0.3;

  // TLB content: after FILL_END, the bottom row mutates to the new entry.
  const tlbEntries = localTime >= FILL_END ? TLB_AFTER_FILL : TLB_INITIAL;
  // Pulse the freshly-filled row briefly
  const justFilled = localTime >= FILL_END && localTime < FILL_END + 1.2;
  const hitRow = justFilled ? 3 : -1;

  // Branch path (dashed) from below VA tile down to page-table box.
  // Computed: from (tlbX + tlbW/2, tlbY + (rows+1)*rowH) down to page table.
  const branchTopX = G.tlbX + G.tlbW / 2;
  const branchTopY = G.tlbY + (G.rows + 1) * G.rowH;
  const branchBotX = G.pageTblX + G.pageTblW / 2;
  const branchBotY = G.pageTblY;
  const branchD = `M ${branchTopX} ${branchTopY} L ${branchTopX} ${(branchTopY + branchBotY) / 2} L ${branchBotX} ${(branchTopY + branchBotY) / 2} L ${branchBotX} ${branchBotY}`;
  const branchProg = clamp((localTime - BRANCH_START) / (BRANCH_END - BRANCH_START), 0, 1);
  const branchPathLen = 600;
  const branchOn = localTime >= BRANCH_START;

  // PFN ball animates from page table up to TLB row 3, then right to padX.
  // Slot 3's centre:
  const slot3Y = G.tlbY + (3 + 0.5 + 1) * G.rowH;  // header + row 3 mid
  const ballR = 11;
  let ballX = null, ballY = null, ballColor = 'var(--amber-400)', ballOp = 1;

  if (localTime >= BRANCH_END - 0.05 && localTime < FILL_START) {
    // Sits briefly at page-table top edge (PFN was read).
    ballX = G.pageTblX + G.pageTblW / 2;
    ballY = G.pageTblY;
  } else if (localTime >= FILL_START && localTime < FILL_END) {
    const k = clamp((localTime - FILL_START) / (FILL_END - FILL_START), 0, 1);
    const e = Easing.easeOutCubic(k);
    ballX = (G.pageTblX + G.pageTblW / 2) + ((G.tlbX + G.tlbW / 2) - (G.pageTblX + G.pageTblW / 2)) * e;
    ballY = G.pageTblY + (slot3Y - G.pageTblY) * e;
  } else if (localTime >= OUT_START && localTime < OUT_END) {
    const k = clamp((localTime - OUT_START) / (OUT_END - OUT_START), 0, 1);
    const e = Easing.easeOutCubic(k);
    ballX = (G.tlbX + G.tlbW) + (G.padX + tileW / 2 - (G.tlbX + G.tlbW)) * e;
    ballY = G.padY + tileH / 2;
  } else if (localTime >= FILL_END && localTime < OUT_START) {
    // Briefly disappear into the slot.
    ballX = null;
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={32}
            textAnchor="middle"
            fill="var(--rose-400)"
            fontFamily="var(--font-mono)" fontSize={12}
            letterSpacing="0.22em">
            TLB MISS
          </text>
        </SvgFadeIn>

        {/* TLB */}
        <SvgFadeIn duration={0.4} delay={0.1}>
          <TlbTable G={G} entries={tlbEntries} hitRow={hitRow} pulsePhase={localTime}/>
        </SvgFadeIn>

        {/* Static lines into / out of TLB */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.addrX + tileW + 6}
            y1={G.addrY + tileH / 2}
            x2={G.tlbX - 6} y2={G.addrY + tileH / 2}
            stroke="var(--chalk-300)" strokeWidth={1.2}
            strokeDasharray="4 4" opacity={0.55}/>
          <line x1={G.tlbX + G.tlbW + 6}
            y1={G.padY + tileH / 2}
            x2={G.padX - 6} y2={G.padY + tileH / 2}
            stroke="var(--chalk-300)" strokeWidth={1.2}
            strokeDasharray="4 4" opacity={0.55}/>
        </SvgFadeIn>

        {/* Page-table box — appears as the branch begins to draw */}
        {branchOn && (
          <SvgFadeIn duration={0.4} delay={0}>
            <rect x={G.pageTblX} y={G.pageTblY}
              width={G.pageTblW} height={G.pageTblH}
              rx={8}
              fill="rgba(232,220,193,0.05)"
              stroke="var(--chalk-200)" strokeWidth={1.4}/>
            <text x={G.pageTblX + G.pageTblW / 2} y={G.pageTblY + 22}
              textAnchor="middle"
              fill="var(--chalk-300)"
              fontFamily="var(--font-mono)" fontSize={10}
              letterSpacing="0.18em">
              PAGE TABLE IN MEMORY
            </text>
            <text x={G.pageTblX + G.pageTblW / 2} y={G.pageTblY + G.pageTblH - 18}
              textAnchor="middle"
              fill="var(--amber-300)"
              fontFamily="var(--font-mono)" fontSize={14}>
              VPN 19 → PFN 34
            </text>
          </SvgFadeIn>
        )}

        {/* The branch line: draws from TLB downward to the page-table box */}
        {branchOn && (
          <path d={branchD}
            stroke="var(--chalk-200)" strokeWidth={1.6} fill="none"
            strokeDasharray={`${branchPathLen}`}
            strokeDashoffset={`${branchPathLen * (1 - Easing.easeOutCubic(branchProg))}`}
            opacity={0.85}/>
        )}

        {/* VA tile */}
        <AddrTile
          x={vaX} y={G.addrY} w={tileW} h={tileH}
          eyebrow="VIRTUAL · VPN"
          value="19"
          valueColor={flashing ? 'var(--rose-400)' : 'var(--chalk-100)'}
          frameColor={flashing ? 'var(--rose-400)' : 'var(--chalk-200)'}/>

        {/* PFN tile fades in at the physical-address spot once the ball
            has arrived there */}
        {localTime >= OUT_END - 0.05 && (
          <AddrTile
            x={G.padX} y={G.padY} w={tileW} h={tileH}
            eyebrow="PHYSICAL · PFN"
            value="34"
            valueColor="var(--amber-400)"
            frameColor="var(--amber-400)"/>
        )}

        {/* PFN ball travelling along its path */}
        {ballX !== null && (
          <circle cx={ballX} cy={ballY} r={ballR}
            fill="var(--amber-400)" opacity={ballOp}/>
        )}

        {/* Timing readout */}
        {localTime >= OUT_END + 0.3 && (
          <SvgFadeIn duration={0.5} delay={0}>
            <text x={G.vbW / 2} y={G.timingY}
              textAnchor="middle"
              fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={portrait ? 17 : 18}
              letterSpacing="0.06em">
              ≈ 100 ns · table walk + fill
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 22,
    }}>
      <div style={{
        display: 'flex', flexDirection: portrait ? 'column' : 'row',
        gap: portrait ? 14 : 60, alignItems: 'center',
      }}>
        <FadeUp duration={0.6} delay={0.3} distance={14}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--teal-400)', letterSpacing: '0.2em',
          }}>HIT</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 54 : 68, color: 'var(--teal-400)',
            lineHeight: 1,
          }}>≈ 10 ns</div>
        </FadeUp>

        <FadeUp duration={0.5} delay={1.0} distance={14}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--rose-300)', letterSpacing: '0.2em',
          }}>MISS</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 54 : 68, color: 'var(--rose-300)',
            lineHeight: 1,
          }}>≈ 100 ns</div>
        </FadeUp>
      </div>

      <FadeUp duration={0.6} delay={2.0} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '40ch',
          textAlign: 'center', lineHeight: 1.3,
          marginTop: 10,
        }}>
        Locality of reference is why this works.
      </FadeUp>

      <FadeUp duration={0.5} delay={3.2} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--chalk-300)', letterSpacing: '0.14em',
          textAlign: 'center',
        }}>
        (hit rates of 95–99% are typical)
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
