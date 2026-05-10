// Address Translation — Manimo lesson scene.
// How the OS turns a virtual address into a physical one: split into
// VPN + offset, look up the page table, glue the frame number back onto
// the offset.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/address-translation/):
//    0.00– 6.33  Manimo intro: where is byte 0x40c2 really?
//    6.33–17.47  A virtual address splits into VPN | offset
//   17.47–27.10  Page-table lookup: a dot traces VPN row → PFN → frame
//   27.10–36.31  PFN ‖ offset = physical address (genuine: bits slide and snap together)
//   36.31–47.00  Takeaway: each process has its own table
//
// Authoring notes:
//   • Beat 3 carries the genuine animation: a glowing dot follows the
//     translation pathway from the virtual-address row, through the page-
//     table row, to the physical-frame slot. Driven by sprite localTime.
//   • Beat 4 reinforces with a snap-together motion (PFN bits slide left
//     to meet offset bits sliding right).

const SCENE_DURATION = 47;

const NARRATION = [
  /*  0.00– 6.33 */ 'Your program asks for byte zero one zero zero. But where is byte zero one zero zero, really?',
  /*  6.33–17.47 */ 'Every virtual address is split into two parts. The top bits name a page — the virtual page number, or VPN. The bottom bits name a byte inside that page — the offset.',
  /* 17.47–27.10 */ "The VPN is an index into the process's page table. Walk to that row, read the physical frame number, and you know where in real memory the page actually lives.",
  /* 27.10–36.31 */ 'The physical address is just the frame number with the original offset glued on. The CPU does this on every memory access — and the page table makes it cheap.',
  /* 36.31–47.00 */ 'Each process has its own page table, so two programs can use the very same virtual address and never collide. Memory becomes private by translation, not by trust.',
];

const NARRATION_AUDIO = 'audio/address-translation/scene.mp3';

// 16-bit virtual address: 0100 0000 1100 0010 → VPN=4 (0100), offset=0xC2.
// Page table maps VPN → PFN. Worked example: VPN 4 → PFN 6.
const VPN_BITS = '0100';
const OFFSET_BITS = '0000 1100 0010';
const PFN_BITS = '110';
const TARGET_VPN = 4;
const TARGET_PFN = 6;

// Page table rows shown in the lookup beat.
const PAGE_TABLE = [
  { vpn: 0, pfn: 1 },
  { vpn: 1, pfn: 7 },
  { vpn: 2, pfn: 0 },
  { vpn: 3, pfn: 3 },
  { vpn: 4, pfn: TARGET_PFN }, // <- the row we hit
  { vpn: 5, pfn: 2 },
  { vpn: 6, pfn: 5 },
  { vpn: 7, pfn: 4 },
];

function Scene() {
  return (
    <SceneChrome
      eyebrow="paging"
      title="Address Translation"
      duration={SCENE_DURATION}
      introEnd={6.33}
      introCaption="Where does a virtual address actually live?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.33} end={17.47}>
        <SplitAddressBeat />
      </Sprite>

      <Sprite start={17.47} end={27.1}>
        <PageTableLookupBeat />
      </Sprite>

      <Sprite start={27.1} end={36.31}>
        <ConcatBeat />
      </Sprite>

      <Sprite start={36.31} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: split address ────────────────────────────────────────────────
// The 16-bit address appears in mono; brackets fade in beneath the bit
// groups labelling VPN and offset.
function SplitAddressBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 400, addrY: 160, vpnLabelY: 240, offLabelY: 240,
        captionY: 340, eyebrowY: 80, fontAddr: 28 }
    : { vbW: 1080, vbH: 320, addrY: 140, vpnLabelY: 220, offLabelY: 220,
        captionY: 280, eyebrowY: 60, fontAddr: 40 };

  // Layout the 16 bits in groups of 4: "0100 0000 1100 0010"
  // We measure the position of the first 4 bits (VPN) vs the last 12 (offset).
  // Use a centred mono string and compute approximate bracket positions.
  const charW = portrait ? 18 : 26;
  const groupGap = portrait ? 12 : 18;
  // 4 groups of 4 chars, with 3 gaps between groups.
  const totalW = 16 * charW + 3 * groupGap;
  const startX = (G.vbW - totalW) / 2;

  // VPN spans first 4 chars (0..3) → positions startX .. startX+4*charW
  const vpnX1 = startX;
  const vpnX2 = startX + 4 * charW;
  // Offset spans chars 4..15, with 3 group gaps between them.
  const offX1 = startX + 4 * charW + groupGap;
  const offX2 = startX + 16 * charW + 3 * groupGap;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0.2} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 18,
        }}>
        16-bit virtual address
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* The bits, laid out group by group */}
        <SvgFadeIn duration={0.5} delay={0.4}>
          {[VPN_BITS, OFFSET_BITS.slice(0,4), OFFSET_BITS.slice(5,9), OFFSET_BITS.slice(10,14)].map((group, gi) => (
            <text key={gi}
              x={startX + gi * (4 * charW + groupGap)}
              y={G.addrY}
              fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={G.fontAddr}
              letterSpacing="0.04em">
              {group}
            </text>
          ))}
        </SvgFadeIn>

        {/* VPN bracket (top) */}
        <SvgFadeIn duration={0.4} delay={2.2}>
          <line x1={vpnX1} y1={G.addrY - G.fontAddr - 12}
            x2={vpnX2} y2={G.addrY - G.fontAddr - 12}
            stroke="var(--amber-400)" strokeWidth={2}/>
          <line x1={vpnX1} y1={G.addrY - G.fontAddr - 12}
            x2={vpnX1} y2={G.addrY - G.fontAddr - 4}
            stroke="var(--amber-400)" strokeWidth={2}/>
          <line x1={vpnX2} y1={G.addrY - G.fontAddr - 12}
            x2={vpnX2} y2={G.addrY - G.fontAddr - 4}
            stroke="var(--amber-400)" strokeWidth={2}/>
          <text x={(vpnX1 + vpnX2) / 2} y={G.addrY - G.fontAddr - 22}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={12}
            letterSpacing="0.18em">VPN</text>
          <text x={(vpnX1 + vpnX2) / 2} y={G.addrY - G.fontAddr - 38}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.10em">page number</text>
        </SvgFadeIn>

        {/* Offset bracket (bottom) */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <line x1={offX1} y1={G.addrY + 14}
            x2={offX2} y2={G.addrY + 14}
            stroke="var(--rose-400)" strokeWidth={2}/>
          <line x1={offX1} y1={G.addrY + 14}
            x2={offX1} y2={G.addrY + 6}
            stroke="var(--rose-400)" strokeWidth={2}/>
          <line x1={offX2} y1={G.addrY + 14}
            x2={offX2} y2={G.addrY + 6}
            stroke="var(--rose-400)" strokeWidth={2}/>
          <text x={(offX1 + offX2) / 2} y={G.addrY + 32}
            textAnchor="middle"
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={12}
            letterSpacing="0.18em">OFFSET</text>
          <text x={(offX1 + offX2) / 2} y={G.addrY + 48}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.10em">byte inside the page</text>
        </SvgFadeIn>

        {/* Takeaway */}
        <SvgFadeIn duration={0.5} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 15}
            letterSpacing="0.02em">
            page number ▸ which page;  offset ▸ which byte inside it
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: page-table lookup ────────────────────────────────────────────
// Genuine motion. A glowing dot enters at VPN 4 on the page-table column,
// pauses (the lookup), then arrows across to physical-frame row 6.
function PageTableLookupBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 560, ptX: 60, ptY: 60, ptW: 200, rowH: 36,
        memX: 340, memY: 60, memW: 200,
        captionY: 510, eyebrowY: 30 }
    : { vbW: 1080, vbH: 460, ptX: 220, ptY: 60, ptW: 240, rowH: 36,
        memX: 620, memY: 60, memW: 240,
        captionY: 410, eyebrowY: 40 };

  // Animation timeline (sprite local):
  //   0.0 — 1.2    fade in page table + memory
  //   1.6          dot appears at top of page table
  //   1.6 — 3.0    dot descends to VPN-4 row
  //   3.0 — 4.4    dot pauses on row, row glows
  //   4.4 — 6.0    dot crosses to physical-memory row 6
  //   6.0 — end    dot stays inside memory slot 6
  const startDot = 1.6;
  const arriveRow = 3.0;
  const leaveRow = 4.4;
  const arriveFrame = 6.0;

  const ptRowY = G.ptY + (TARGET_VPN + 0.5) * G.rowH;
  const memRowY = G.memY + (TARGET_PFN + 0.5) * G.rowH;
  const ptRowX = G.ptX + G.ptW; // right edge of PT row, where dot rests
  const memRowX = G.memX;       // left edge of mem row, where dot lands

  let dotX, dotY, dotVisible, rowGlow;
  if (localTime < startDot) {
    dotVisible = false;
    rowGlow = 0;
    dotX = ptRowX;
    dotY = G.ptY;
  } else if (localTime < arriveRow) {
    // Descending the right edge of the page table to row 4.
    const t = clamp((localTime - startDot) / (arriveRow - startDot), 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    dotVisible = true;
    rowGlow = 0;
    dotX = ptRowX;
    dotY = G.ptY + eased * (ptRowY - G.ptY);
  } else if (localTime < leaveRow) {
    // Paused on the row, glow ramps up.
    const t = clamp((localTime - arriveRow) / (leaveRow - arriveRow), 0, 1);
    dotVisible = true;
    rowGlow = t;
    dotX = ptRowX;
    dotY = ptRowY;
  } else if (localTime < arriveFrame) {
    // Cross to the physical-memory row.
    const t = clamp((localTime - leaveRow) / (arriveFrame - leaveRow), 0, 1);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    dotVisible = true;
    rowGlow = 1;
    dotX = ptRowX + eased * (memRowX - ptRowX);
    dotY = ptRowY + eased * (memRowY - ptRowY);
  } else {
    dotVisible = true;
    rowGlow = 1;
    dotX = memRowX + 18;
    dotY = memRowY;
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 14,
        }}>
        page-table lookup
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Page table column */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <text x={G.ptX + G.ptW / 2} y={G.ptY - 12}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.14em">PAGE TABLE</text>
          <rect x={G.ptX} y={G.ptY} width={G.ptW} height={PAGE_TABLE.length * G.rowH}
            rx={6}
            fill="rgba(232,220,193,0.04)"
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          {PAGE_TABLE.map((row, i) => {
            const isHit = row.vpn === TARGET_VPN;
            const rowY = G.ptY + i * G.rowH;
            return (
              <g key={i}>
                {/* Row separator */}
                {i > 0 && (
                  <line x1={G.ptX} y1={rowY} x2={G.ptX + G.ptW} y2={rowY}
                    stroke="var(--chalk-300)" strokeWidth={0.8} opacity={0.4}/>
                )}
                {isHit && (
                  <rect x={G.ptX + 2} y={rowY + 2}
                    width={G.ptW - 4} height={G.rowH - 4}
                    fill="var(--amber-400)" opacity={0.18 + 0.32 * rowGlow}/>
                )}
                <text x={G.ptX + 18} y={rowY + G.rowH / 2 + 5}
                  fill={isHit ? 'var(--amber-300)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={13}>
                  VPN {row.vpn}
                </text>
                <text x={G.ptX + G.ptW - 18} y={rowY + G.rowH / 2 + 5}
                  textAnchor="end"
                  fill={isHit ? 'var(--amber-200)' : 'var(--chalk-200)'}
                  fontFamily="var(--font-mono)" fontSize={13}>
                  → PFN {row.pfn}
                </text>
              </g>
            );
          })}
        </SvgFadeIn>

        {/* Physical memory column */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.memX + G.memW / 2} y={G.memY - 12}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.14em">PHYSICAL MEMORY</text>
          <rect x={G.memX} y={G.memY} width={G.memW} height={PAGE_TABLE.length * G.rowH}
            rx={6}
            fill="rgba(232,220,193,0.04)"
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          {PAGE_TABLE.map((_, i) => {
            const isHit = i === TARGET_PFN;
            const rowY = G.memY + i * G.rowH;
            return (
              <g key={i}>
                {i > 0 && (
                  <line x1={G.memX} y1={rowY} x2={G.memX + G.memW} y2={rowY}
                    stroke="var(--chalk-300)" strokeWidth={0.8} opacity={0.4}/>
                )}
                {isHit && (
                  <rect x={G.memX + 2} y={rowY + 2}
                    width={G.memW - 4} height={G.rowH - 4}
                    fill="var(--rose-400)" opacity={0.14 + 0.36 * (localTime > leaveRow ? rowGlow : 0)}/>
                )}
                <text x={G.memX + 18} y={rowY + G.rowH / 2 + 5}
                  fill="var(--chalk-300)"
                  fontFamily="var(--font-mono)" fontSize={13}>
                  PFN {i}
                </text>
                <text x={G.memX + G.memW - 18} y={rowY + G.rowH / 2 + 5}
                  textAnchor="end"
                  fill={isHit ? 'var(--rose-300)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={11}
                  opacity={0.85}>
                  frame {i}
                </text>
              </g>
            );
          })}
        </SvgFadeIn>

        {/* Trailing arrow path: dotted reference line from PT row to memory row */}
        {localTime > leaveRow && (
          <line x1={ptRowX} y1={ptRowY} x2={memRowX} y2={memRowY}
            stroke="var(--rose-400)" strokeWidth={1.4}
            strokeDasharray="4 4" opacity={0.55}/>
        )}

        {/* The travelling dot */}
        {dotVisible && (
          <g>
            <circle cx={dotX} cy={dotY} r={9}
              fill="var(--rose-400)" opacity={0.25}/>
            <circle cx={dotX} cy={dotY} r={5}
              fill="var(--rose-300)"/>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={6.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.06em">
            VPN {TARGET_VPN} → PFN {TARGET_PFN} → frame {TARGET_PFN} of memory
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: PFN ‖ offset = physical address ──────────────────────────────
// Reinforcement: PFN bits and offset bits slide in from opposite sides
// and snap together. Driven by sprite localTime.
function ConcatBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 380, addrY: 200, fontBits: 28, eyebrowY: 40,
        captionY: 320 }
    : { vbW: 1080, vbH: 320, addrY: 170, fontBits: 38, eyebrowY: 40,
        captionY: 270 };

  // Slide-in start delay: 1.6s. Slide takes 1.4s.
  const slideStart = 1.6;
  const slideDur = 1.4;
  const t = clamp((localTime - slideStart) / slideDur, 0, 1);
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // Final centred position. PFN sits left of OFFSET, separated by a small gap.
  const charW = portrait ? 18 : 26;
  const pfnW = PFN_BITS.length * charW;
  const offW = OFFSET_BITS.length * charW * 0.85; // some chars are spaces
  const gap = portrait ? 14 : 22;
  const totalW = pfnW + gap + offW;
  const finalLeftX = (G.vbW - totalW) / 2;
  const pfnFinalX = finalLeftX;
  const offFinalX = finalLeftX + pfnW + gap;

  // Off-screen origins.
  const pfnFromX = -pfnW - 40;                  // off the left edge
  const offFromX = G.vbW + 40;                  // off the right edge

  const pfnX = pfnFromX + eased * (pfnFinalX - pfnFromX);
  const offX = offFromX + eased * (offFinalX - offFromX);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0.2} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 14,
        }}>
        physical address = PFN ‖ offset
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Sliding PFN bits */}
        <text x={pfnX} y={G.addrY}
          fill="var(--amber-300)"
          fontFamily="var(--font-mono)" fontSize={G.fontBits}
          letterSpacing="0.04em">
          {PFN_BITS}
        </text>
        <text x={pfnX + pfnW / 2} y={G.addrY + 32}
          textAnchor="middle"
          fill="var(--chalk-300)"
          fontFamily="var(--font-mono)" fontSize={11}
          letterSpacing="0.14em">PFN</text>

        {/* Sliding offset bits */}
        <text x={offX} y={G.addrY}
          fill="var(--rose-300)"
          fontFamily="var(--font-mono)" fontSize={G.fontBits}
          letterSpacing="0.04em">
          {OFFSET_BITS}
        </text>
        <text x={offX + offW / 2} y={G.addrY + 32}
          textAnchor="middle"
          fill="var(--chalk-300)"
          fontFamily="var(--font-mono)" fontSize={11}
          letterSpacing="0.14em">OFFSET</text>

        {/* "Snap" pulse when the two land */}
        {t >= 1 && (
          <g>
            <text x={(pfnFinalX + pfnW + offFinalX) / 2} y={G.addrY}
              textAnchor="middle"
              fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={G.fontBits}
              opacity={0.85}>
              ‖
            </text>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 15}
            letterSpacing="0.02em">
            same offset, different page — that is the whole trick
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
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
          fontSize: portrait ? 24 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '40ch',
          lineHeight: 1.3,
        }}>
        VPN — a guess. PFN — the truth. The OS keeps the table.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.14em',
          textAlign: 'center',
        }}>
        (this is what we mean by virtual memory)
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
