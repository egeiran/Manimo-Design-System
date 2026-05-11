// RAID — Manimo lesson scene.
// Three layouts of the same four disks: RAID 0 (striping), RAID 1
// (mirroring), and RAID 5 (striping + parity). In each beat a block
// "A" arrives and is laid across the disks the way that level
// prescribes; then one disk fails and we observe the consequence.
//
// Genuine animation lives in each RAID beat: stripe tokens travel
// from a "block A" buffer above the disks down into specific disk
// slots over a sprite-local time window. The disk-failure event then
// flips one disk's state and either kills the block (RAID 0), leaves
// a complete copy (RAID 1), or triggers a parity-xor recompute (RAID 5)
// that visually rebuilds the missing stripe from the survivors.

const SCENE_DURATION = 56;

const NARRATION = [
  /*  0.00– 9.78 */ 'A single disk gives you one shot at not failing. RAID groups several disks behind one logical drive and trades off speed, capacity, and survival.',
  /*  9.78–21.59 */ 'RAID zero splits each block across all the disks. Reads and writes go in parallel, so throughput multiplies. But one disk dies and the whole array is lost.',
  /* 21.59–32.65 */ 'RAID one mirrors every block onto two disks. You lose half your capacity, but a single disk failure leaves a complete copy behind.',
  /* 32.65–43.92 */ "RAID five stripes data across all the disks plus one parity stripe — the bitwise xor of the others. Lose any single disk, and the missing stripe can be xor'd back from what's left.",
  /* 43.92–56.00 */ 'RAID zero buys speed and gambles. RAID one buys safety and pays half. RAID five buys both and pays one disk out of however many you have.',
];

const NARRATION_AUDIO = 'audio/raid/scene.mp3';

const NUM_DISKS = 4;

function raidGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 560,
        srcX: 60, srcY: 70, srcW: 480, srcH: 90,
        diskRowY: 250, diskW: 100, diskH: 200, diskGap: 18,
        eyebrowFs: 11, captionFs: 14 }
    : { vbW: 1080, vbH: 460,
        srcX: 280, srcY: 70, srcW: 520, srcH: 80,
        diskRowY: 210, diskW: 150, diskH: 200, diskGap: 30,
        eyebrowFs: 12, captionFs: 14 };
}

function diskXY(G, i) {
  const totalW = NUM_DISKS * G.diskW + (NUM_DISKS - 1) * G.diskGap;
  const startX = (G.vbW - totalW) / 2;
  return {
    x: startX + i * (G.diskW + G.diskGap),
    y: G.diskRowY,
  };
}

function diskSlotXY(G, i, slotIdx, slotCount = 1) {
  const d = diskXY(G, i);
  const slotH = (G.diskH - 40) / slotCount;
  return {
    x: d.x + G.diskW / 2,
    y: d.y + 28 + slotIdx * slotH + slotH / 2,
  };
}

function Disk({ G, idx, dead, label, slots }) {
  // slots: [{ idx, label, color }] — already in residence
  const d = diskXY(G, idx);
  return (
    <g>
      <rect x={d.x} y={d.y} width={G.diskW} height={G.diskH} rx={12}
        fill={dead ? 'var(--rose-400)' : 'var(--chalk-200)'}
        fillOpacity={dead ? 0.10 : 0.04}
        stroke={dead ? 'var(--rose-400)' : 'var(--chalk-300)'}
        strokeWidth={1.4}
        opacity={dead ? 0.55 : 0.85}/>
      <text x={d.x + G.diskW / 2} y={d.y + 18}
        textAnchor="middle"
        fill={dead ? 'var(--rose-300)' : 'var(--chalk-300)'}
        fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.18em">
        {label}
      </text>
      {slots && slots.map((s, i) => {
        const xy = diskSlotXY(G, idx, s.idx, s.slotCount || 1);
        return (
          <g key={i} opacity={dead ? 0.35 : 1}>
            <rect x={xy.x - G.diskW / 2 + 16} y={xy.y - 18}
              width={G.diskW - 32} height={36} rx={6}
              fill={s.color} opacity={0.55}
              stroke={s.color} strokeWidth={1.4}/>
            <text x={xy.x} y={xy.y + 6}
              textAnchor="middle"
              fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={13}
              letterSpacing="0.06em">
              {s.label}
            </text>
          </g>
        );
      })}
      {dead && (
        <>
          <line x1={d.x + 20} y1={d.y + 20} x2={d.x + G.diskW - 20} y2={d.y + G.diskH - 20}
            stroke="var(--rose-400)" strokeWidth={2.5} strokeLinecap="round"/>
          <line x1={d.x + G.diskW - 20} y1={d.y + 20} x2={d.x + 20} y2={d.y + G.diskH - 20}
            stroke="var(--rose-400)" strokeWidth={2.5} strokeLinecap="round"/>
        </>
      )}
    </g>
  );
}

function StripeToken({ x, y, label, color, w = 100, h = 32, opacity = 1 }) {
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

function SourceBlock({ G, label, color, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      <rect x={G.srcX} y={G.srcY} width={G.srcW} height={G.srcH} rx={10}
        fill={color} opacity={0.18}
        stroke={color} strokeWidth={1.4}/>
      <text x={G.srcX + G.srcW / 2} y={G.srcY + G.srcH / 2 + 12}
        textAnchor="middle"
        fill="var(--chalk-100)"
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={36}>
        {label}
      </text>
      <text x={G.srcX + 14} y={G.srcY + 18}
        fill="var(--chalk-300)"
        fontFamily="var(--font-mono)" fontSize={10}
        letterSpacing="0.18em">
        BLOCK
      </text>
    </g>
  );
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="storage"
      title="RAID"
      duration={SCENE_DURATION}
      introEnd={9.78}
      introCaption="Three layouts. Same disks. Different tradeoffs."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.78} end={21.59}>
        <Raid0Beat/>
      </Sprite>

      <Sprite start={21.59} end={32.65}>
        <Raid1Beat/>
      </Sprite>

      <Sprite start={32.65} end={43.92}>
        <Raid5Beat/>
      </Sprite>

      <Sprite start={43.92} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: RAID 0 — striping ───────────────────────────────────────────
// Block A splits into A0..A3 and travels into each disk in parallel.
// Then at t=6 disk 2 fails — the full block is lost because A2 is gone.
function Raid0Beat() {
  const portrait = usePortrait();
  const G = raidGeometry(portrait);
  const { localTime } = useSprite();

  // Schedule:
  //   0.4..0.8  eyebrow + disks fade in
  //   1.0..1.4  block A appears
  //   2.0..4.0  A splits into A0..A3 stripes that drop into each disk
  //   5.5..     disk 2 dies; "BLOCK LOST" stamp on A
  const stripeFrac = clamp((localTime - 2.0) / 2.0, 0, 1);
  const stripeEased = Easing.easeInOutCubic(stripeFrac);
  const stripesPlaced = stripeFrac >= 0.99;
  const failed = localTime > 5.5;
  const stampOp = clamp((localTime - 6.2) / 0.5, 0, 1);

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={40}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={G.eyebrowFs}
            letterSpacing="0.18em">
            RAID 0 — STRIPING
          </text>
        </SvgFadeIn>

        {/* Block A — fades to dim once it has finished splitting */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <SourceBlock G={G} label="A" color="var(--amber-400)"
            opacity={stripeFrac > 0.5 ? 0.35 : 1}/>
        </SvgFadeIn>

        {/* Disks (no slots yet — stripes drop in over time) */}
        {[0, 1, 2, 3].map(i => (
          <SvgFadeIn key={i} duration={0.4} delay={0.5 + i * 0.1}>
            <Disk G={G} idx={i} label={`D${i}`} dead={failed && i === 2}
              slots={stripesPlaced ? [{ idx: 0, label: `A${i}`, color: 'var(--amber-400)', slotCount: 1 }] : []}/>
          </SvgFadeIn>
        ))}

        {/* Travelling stripes */}
        {stripeFrac > 0 && stripeFrac < 1 && [0, 1, 2, 3].map(i => {
          const startX = G.srcX + (i + 0.5) * (G.srcW / 4);
          const startY = G.srcY + G.srcH;
          const end = diskSlotXY(G, i, 0, 1);
          const x = startX + (end.x - startX) * stripeEased;
          const y = startY + (end.y - startY) * stripeEased;
          return (
            <StripeToken key={i} x={x} y={y} label={`A${i}`}
              color="var(--amber-400)" w={84} h={28}/>
          );
        })}

        {/* "BLOCK LOST" */}
        {stampOp > 0 && (
          <g opacity={stampOp}>
            <text x={G.srcX + G.srcW / 2} y={G.srcY + G.srcH / 2 + 12}
              textAnchor="middle"
              fill="var(--rose-300)"
              fontFamily="var(--font-mono)" fontSize={14}
              letterSpacing="0.22em">
              BLOCK LOST
            </text>
          </g>
        )}

        <SvgFadeIn duration={0.5} delay={6.4}>
          <text x={G.vbW / 2} y={G.diskRowY + G.diskH + 30}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 14 : 16}>
            one stripe gone → the whole block is gone
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: RAID 1 — mirroring ─────────────────────────────────────────
// Block A duplicates into TWO disks (D0, D1). D2 and D3 host a second
// mirror pair, but we focus on the A pair for visual simplicity.
// Then disk D0 dies; D1 still has a complete A.
function Raid1Beat() {
  const portrait = usePortrait();
  const G = raidGeometry(portrait);
  const { localTime } = useSprite();

  const stripeFrac = clamp((localTime - 1.6) / 1.8, 0, 1);
  const stripeEased = Easing.easeInOutCubic(stripeFrac);
  const placed = stripeFrac >= 0.99;
  const failed = localTime > 5.0;

  // After failure, highlight D1 (the survivor)
  const survivorOp = (() => {
    if (!failed) return 0;
    const t = clamp((localTime - 5.4) / 0.5, 0, 1);
    return t;
  })();

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={40}
            textAnchor="middle"
            fill="var(--teal-400)"
            fontFamily="var(--font-mono)" fontSize={G.eyebrowFs}
            letterSpacing="0.18em">
            RAID 1 — MIRRORING
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={0.6}>
          <SourceBlock G={G} label="A" color="var(--teal-400)"
            opacity={stripeFrac > 0.5 ? 0.4 : 1}/>
        </SvgFadeIn>

        {/* Disks. After placement: D0+D1 hold full A; D2+D3 hold B
            (a second mirror pair, simulated). */}
        {[0, 1, 2, 3].map(i => {
          const isAPair = i === 0 || i === 1;
          const isBPair = i === 2 || i === 3;
          const slotLabel = isAPair ? 'A' : 'B';
          const slotColor = isAPair ? 'var(--teal-400)' : 'var(--chalk-200)';
          return (
            <SvgFadeIn key={i} duration={0.4} delay={0.4 + i * 0.1}>
              <Disk G={G} idx={i} label={`D${i}`}
                dead={failed && i === 0}
                slots={placed
                  ? [{ idx: 0, label: slotLabel, color: slotColor, slotCount: 1 }]
                  : (isBPair ? [{ idx: 0, label: slotLabel, color: slotColor, slotCount: 1 }] : [])}/>
            </SvgFadeIn>
          );
        })}

        {/* Travelling A tokens going into D0 and D1 */}
        {stripeFrac > 0 && stripeFrac < 1 && [0, 1].map(i => {
          const startX = G.srcX + G.srcW / 2;
          const startY = G.srcY + G.srcH;
          const end = diskSlotXY(G, i, 0, 1);
          const x = startX + (end.x - startX) * stripeEased;
          const y = startY + (end.y - startY) * stripeEased;
          return (
            <StripeToken key={i} x={x} y={y} label="A"
              color="var(--teal-400)" w={84} h={28}/>
          );
        })}

        {/* Survivor highlight */}
        {survivorOp > 0 && (
          <g opacity={survivorOp}>
            {(() => {
              const d = diskXY(G, 1);
              return (
                <>
                  <rect x={d.x - 4} y={d.y - 4}
                    width={G.diskW + 8} height={G.diskH + 8} rx={14}
                    fill="none" stroke="var(--teal-400)" strokeWidth={2}
                    strokeDasharray="5 5"/>
                  <text x={d.x + G.diskW / 2} y={d.y + G.diskH + 18}
                    textAnchor="middle"
                    fill="var(--teal-400)"
                    fontFamily="var(--font-mono)" fontSize={11}
                    letterSpacing="0.16em">
                    SURVIVOR HOLDS A
                  </text>
                </>
              );
            })()}
          </g>
        )}

        <SvgFadeIn duration={0.5} delay={6.4}>
          <text x={G.vbW / 2} y={G.diskRowY + G.diskH + 36}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 14 : 16}>
            half the capacity · survives any one disk loss
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: RAID 5 — parity ────────────────────────────────────────────
// Block A is split into A0, A1, A2 across three disks plus Ap = A0⊕A1⊕A2
// on the fourth. Then disk 1 dies — we recompute A1 = A0⊕A2⊕Ap.
function Raid5Beat() {
  const portrait = usePortrait();
  const G = raidGeometry(portrait);
  const { localTime } = useSprite();

  // Schedule:
  //   0.4..0.8  eyebrow + disks fade in
  //   1.4..3.4  stripes A0..A2 and parity Ap drop into each disk
  //   4.2..     disk 1 dies
  //   5.6..7.6  reconstruction: a "A1 = A0 ⊕ A2 ⊕ Ap" overlay; the missing
  //              slot fills back in to show the rebuild
  const placeFrac = clamp((localTime - 1.4) / 2.0, 0, 1);
  const placeEased = Easing.easeInOutCubic(placeFrac);
  const placed = placeFrac >= 0.99;
  const failed = localTime > 4.2;
  const rebuildFrac = clamp((localTime - 5.6) / 2.0, 0, 1);
  const rebuilt = rebuildFrac >= 0.99;

  const labels = ['A0', 'A1', 'A2', 'Ap'];
  const colors = ['var(--amber-400)', 'var(--amber-400)', 'var(--amber-400)', 'var(--violet-400)'];

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={40}
            textAnchor="middle"
            fill="var(--violet-400)"
            fontFamily="var(--font-mono)" fontSize={G.eyebrowFs}
            letterSpacing="0.18em">
            RAID 5 — STRIPING WITH PARITY
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={0.5}>
          <SourceBlock G={G} label="A" color="var(--amber-400)"
            opacity={placeFrac > 0.5 ? 0.35 : 1}/>
        </SvgFadeIn>

        {/* Disks */}
        {[0, 1, 2, 3].map(i => {
          const slotShown = placed && (!failed || i !== 1 || rebuilt);
          return (
            <SvgFadeIn key={i} duration={0.4} delay={0.4 + i * 0.1}>
              <Disk G={G} idx={i} label={`D${i}`}
                dead={failed && i === 1}
                slots={slotShown
                  ? [{ idx: 0, label: labels[i], color: colors[i], slotCount: 1 }]
                  : []}/>
            </SvgFadeIn>
          );
        })}

        {/* Travelling stripes during placement */}
        {placeFrac > 0 && placeFrac < 1 && [0, 1, 2, 3].map(i => {
          const startX = G.srcX + (i + 0.5) * (G.srcW / 4);
          const startY = G.srcY + G.srcH;
          const end = diskSlotXY(G, i, 0, 1);
          const x = startX + (end.x - startX) * placeEased;
          const y = startY + (end.y - startY) * placeEased;
          return (
            <StripeToken key={i} x={x} y={y} label={labels[i]}
              color={colors[i]} w={84} h={28}/>
          );
        })}

        {/* Parity-rebuild overlay: three arrows from D0, D2, D3 to D1
            that grow during rebuildFrac, plus the formula. */}
        {failed && rebuildFrac > 0 && (() => {
          const target = diskSlotXY(G, 1, 0, 1);
          const sources = [0, 2, 3].map(i => diskSlotXY(G, i, 0, 1));
          return (
            <g>
              {sources.map((s, i) => {
                const x2 = s.x + (target.x - s.x) * Easing.easeOutCubic(rebuildFrac);
                const y2 = s.y + (target.y - s.y) * Easing.easeOutCubic(rebuildFrac);
                return (
                  <line key={i} x1={s.x} y1={s.y} x2={x2} y2={y2}
                    stroke="var(--violet-400)" strokeWidth={1.6}
                    strokeDasharray="4 4" opacity={0.85}/>
                );
              })}
              <text x={G.vbW / 2} y={G.diskRowY + G.diskH + 28}
                textAnchor="middle"
                fill="var(--violet-400)"
                fontFamily="var(--font-mono)" fontSize={portrait ? 12 : 14}
                letterSpacing="0.10em">
                A1 = A0 ⊕ A2 ⊕ Ap
              </text>
              {rebuilt && (
                <text x={G.vbW / 2} y={G.diskRowY + G.diskH + 50}
                  textAnchor="middle"
                  fill="var(--chalk-200)"
                  fontFamily="var(--font-serif)" fontStyle="italic"
                  fontSize={portrait ? 13 : 15}>
                  the missing stripe is reconstructed from the survivors
                </text>
              )}
            </g>
          );
        })()}
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
          fontSize: portrait ? 32 : 46, color: 'var(--chalk-100)',
          lineHeight: 1.05,
        }}>
        speed · capacity · survival — pick two
      </FadeUp>

      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 12 : 13,
          color: 'var(--chalk-200)', letterSpacing: '0.06em',
        }}>
        <div><span style={{ color: 'var(--amber-300)' }}>RAID 0</span>  →  fast, big, fragile</div>
        <div><span style={{ color: 'var(--teal-400)'  }}>RAID 1</span>  →  fast, half, safe</div>
        <div><span style={{ color: 'var(--violet-400)' }}>RAID 5</span>  →  fast, n−1, safe</div>
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-100)',
          lineHeight: 1.3,
        }}>
        RAID 5 is the everyday compromise
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
