// Address Space Layout — Manimo lesson scene.
// The four neighbourhoods of a virtual address space (code, data, heap, stack)
// and how the heap and stack grow toward each other at run time.
//
// Beats (timed to estimated narration durations — re-run `npm run audio
// address-space-layout` with a working ElevenLabs/Voxtral/local TTS to overwrite):
//    0.00– 6.16  Manimo intro: every program sees the same shape of memory
//    6.16–18.31  The static layout: code · data · heap · stack
//   18.31–25.61  Heap grows up: three mallocs stack on each other
//   25.61–34.84  Stack grows down: three function calls; one returns
//   34.84–42.00  Takeaway
//
// Authoring notes:
//   • Beats 3 and 4 carry the genuine animation: heap blocks materialise from
//     the bottom and the heap-top arrow rises with them; stack frames push down
//     from the top and the stack-top arrow descends. Both are driven by sprite
//     localTime so the viewer sees the address space deform in real time.
//   • SvgFadeIn for everything inside <svg>; FadeUp for HTML/DOM only.

const SCENE_DURATION = 42;

const NARRATION = [
  /*  0.00– 6.16 */ 'Every program sees a clean slab of memory laid out the same way each time it runs.',
  /*  6.16–18.31 */ 'At the bottom sits your code, frozen and read-only. Above it, the static data the compiler set up. The stack lives at the top — and the heap is everything in between.',
  /* 18.31–25.61 */ 'Call malloc, and the heap creeps upward. Each new block sits wherever the allocator can find room.',
  /* 25.61–34.84 */ 'Call a function, and a new frame is pushed onto the stack — locals, return address, the works. Return, and the frame is gone.',
  /* 34.84–42.00 */ 'Two arrows, growing toward each other. As long as the gap holds, the program runs.',
];

// Shared geometry — the address-space rectangle is the visual anchor for
// beats 2-4 and we want it to live in the same place in all three.
function addrSpaceGeom(portrait) {
  return portrait
    ? { vbW: 540, vbH: 540, asX: 180, asY: 30, asW: 180, asH: 460,
        // segment heights, summed = asH (460): code 56, data 56, heap+gap+stack 348
        codeH: 56, dataH: 56, fixedSegH: 112,
        labelGutterX: 380, axisX: 162,
        captionY: 525 }
    : { vbW: 1000, vbH: 460, asX: 410, asY: 28, asW: 180, asH: 400,
        codeH: 50, dataH: 50, fixedSegH: 100,
        labelGutterX: 610, axisX: 392,
        captionY: 444 };
}

// Helper: convert a "logical address fraction" (0 = bottom, 1 = top) to SVG y
// inside the address-space rectangle.
function asY(G, frac) {
  return G.asY + G.asH * (1 - frac);
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="memory"
      title="Address Space: Where Your Program Lives"
      duration={SCENE_DURATION}
      introEnd={6.16}
      introCaption="Where in memory does each part of your program live?"
    >
      <Sprite start={6.16} end={18.31}>
        <LayoutBeat />
      </Sprite>

      <Sprite start={18.31} end={25.61}>
        <HeapGrowsBeat />
      </Sprite>

      <Sprite start={25.61} end={34.84}>
        <StackGrowsBeat />
      </Sprite>

      <Sprite start={34.84} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: The static layout ───────────────────────────────────────────
function LayoutBeat() {
  const portrait = usePortrait();
  const G = addrSpaceGeom(portrait);

  // Segment vertical positions (measured from bottom of asY rectangle).
  const codeBot = G.asY + G.asH;          // bottom of the rect
  const codeTop = codeBot - G.codeH;
  const dataBot = codeTop;
  const dataTop = dataBot - G.dataH;
  // Stack region: top 30% of the remaining gap.
  const stackTop = G.asY;
  const stackBot = G.asY + 0.30 * (G.asH - G.fixedSegH);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Outer frame */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <rect x={G.asX} y={G.asY} width={G.asW} height={G.asH}
            fill="rgba(232,220,193,0.03)"
            stroke="var(--chalk-300)" strokeWidth={1.4}/>
        </SvgFadeIn>

        {/* CODE segment (bottom) */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <rect x={G.asX} y={codeTop} width={G.asW} height={G.codeH}
            fill="var(--violet-400)" opacity={0.55}
            stroke="var(--violet-400)" strokeWidth={1}/>
          <text x={G.asX + G.asW / 2} y={codeTop + G.codeH / 2 + 5}
            textAnchor="middle"
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={13}
            letterSpacing="0.16em">CODE</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.9}>
          <text x={G.labelGutterX} y={codeTop + G.codeH / 2 + 5}
            fill="var(--violet-400)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 16 : 18}>
            program text
          </text>
          <text x={G.labelGutterX} y={codeTop + G.codeH / 2 + 24}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}>
            read-only
          </text>
        </SvgFadeIn>

        {/* DATA segment */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <rect x={G.asX} y={dataTop} width={G.asW} height={G.dataH}
            fill="var(--teal-400)" opacity={0.5}
            stroke="var(--teal-400)" strokeWidth={1}/>
          <text x={G.asX + G.asW / 2} y={dataTop + G.dataH / 2 + 5}
            textAnchor="middle"
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={13}
            letterSpacing="0.16em">DATA</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={1.7}>
          <text x={G.labelGutterX} y={dataTop + G.dataH / 2 + 5}
            fill="var(--teal-400)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 16 : 18}>
            globals · static
          </text>
          <text x={G.labelGutterX} y={dataTop + G.dataH / 2 + 24}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}>
            initialised at start
          </text>
        </SvgFadeIn>

        {/* HEAP label + upward arrow */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <text x={G.asX + G.asW / 2} y={dataTop - 18}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={13}
            letterSpacing="0.18em">HEAP</text>
          <line x1={G.asX + G.asW / 2} y1={dataTop - 8}
            x2={G.asX + G.asW / 2} y2={dataTop - 50}
            stroke="var(--amber-400)" strokeWidth={2}/>
          <polygon
            points={`${G.asX + G.asW / 2 - 5},${dataTop - 50} ${G.asX + G.asW / 2 + 5},${dataTop - 50} ${G.asX + G.asW / 2},${dataTop - 60}`}
            fill="var(--amber-400)"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={2.7}>
          <text x={G.labelGutterX} y={dataTop - 30}
            fill="var(--amber-300)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 16 : 18}>
            grows up
          </text>
          <text x={G.labelGutterX} y={dataTop - 10}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}>
            malloc / new
          </text>
        </SvgFadeIn>

        {/* STACK label + downward arrow */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          <text x={G.asX + G.asW / 2} y={stackBot + 32}
            textAnchor="middle"
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={13}
            letterSpacing="0.18em">STACK</text>
          <line x1={G.asX + G.asW / 2} y1={stackBot + 22}
            x2={G.asX + G.asW / 2} y2={stackBot + 64}
            stroke="var(--rose-400)" strokeWidth={2}/>
          <polygon
            points={`${G.asX + G.asW / 2 - 5},${stackBot + 64} ${G.asX + G.asW / 2 + 5},${stackBot + 64} ${G.asX + G.asW / 2},${stackBot + 74}`}
            fill="var(--rose-400)"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={3.5}>
          <text x={G.labelGutterX} y={stackBot + 36}
            fill="var(--rose-300)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 16 : 18}>
            grows down
          </text>
          <text x={G.labelGutterX} y={stackBot + 56}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}>
            function call frames
          </text>
        </SvgFadeIn>

        {/* Address axis on the left */}
        <SvgFadeIn duration={0.5} delay={4.4}>
          <line x1={G.axisX} y1={G.asY} x2={G.axisX} y2={G.asY + G.asH}
            stroke="var(--chalk-300)" strokeWidth={1}/>
          <text x={G.axisX - 6} y={G.asY + 10}
            textAnchor="end"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.12em">2ⁿ − 1</text>
          <text x={G.axisX - 6} y={G.asY + G.asH + 4}
            textAnchor="end"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.12em">0</text>
          <text x={G.axisX - 6} y={G.asY + G.asH / 2}
            textAnchor="end"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.12em">addr</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            {portrait
              ? 'code · data · heap · stack'
              : 'code · data · heap · stack — the four neighbourhoods of every process'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Heap grows up ──────────────────────────────────────────────
function HeapGrowsBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = addrSpaceGeom(portrait);

  // Segment positions (matching LayoutBeat)
  const codeBot = G.asY + G.asH;
  const codeTop = codeBot - G.codeH;
  const dataTop = codeTop - G.dataH;

  // Heap blocks materialise sequentially. Each block is 36px tall and stacks
  // on top of the data segment (so the heap-top moves UP the screen).
  const blocks = [
    { size: 32, h: 32, color: 'var(--amber-400)', appearAt: 0.6 },
    { size: 64, h: 56, color: 'var(--amber-400)', appearAt: 2.4 },
    { size: 16, h: 22, color: 'var(--amber-400)', appearAt: 4.2 },
  ];

  // Cumulative heap height that has materialised so far.
  let runningTop = dataTop;
  const blockBoxes = blocks.map((b) => {
    const top = runningTop - b.h;
    const visible = localTime > b.appearAt;
    // Smoothed grow-in: 0..1 over 0.4s
    const grow = visible ? clamp((localTime - b.appearAt) / 0.4, 0, 1) : 0;
    runningTop = top;
    return { ...b, top, grow, visible, height: b.h };
  });

  // Heap-top arrow tip: slides up as blocks materialise.
  const heapTopY = runningTop;

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
          marginBottom: 12,
        }}>
        the heap grows
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Address-space frame (held over from the previous beat) */}
        <rect x={G.asX} y={G.asY} width={G.asW} height={G.asH}
          fill="rgba(232,220,193,0.03)"
          stroke="var(--chalk-300)" strokeWidth={1.4}/>

        {/* Code + data segments (always present) */}
        <rect x={G.asX} y={codeTop} width={G.asW} height={G.codeH}
          fill="var(--violet-400)" opacity={0.45}
          stroke="var(--violet-400)" strokeWidth={1}/>
        <text x={G.asX + G.asW / 2} y={codeTop + G.codeH / 2 + 5}
          textAnchor="middle" fill="var(--chalk-100)"
          fontFamily="var(--font-mono)" fontSize={12} letterSpacing="0.16em">CODE</text>

        <rect x={G.asX} y={dataTop} width={G.asW} height={G.dataH}
          fill="var(--teal-400)" opacity={0.4}
          stroke="var(--teal-400)" strokeWidth={1}/>
        <text x={G.asX + G.asW / 2} y={dataTop + G.dataH / 2 + 5}
          textAnchor="middle" fill="var(--chalk-100)"
          fontFamily="var(--font-mono)" fontSize={12} letterSpacing="0.16em">DATA</text>

        {/* Heap blocks materialising bottom-up */}
        {blockBoxes.map((b, i) => {
          if (!b.visible) return null;
          const drawH = b.height * b.grow;
          const drawTop = b.top + (b.height - drawH);
          return (
            <g key={i}>
              <rect x={G.asX + 6} y={drawTop} width={G.asW - 12} height={drawH}
                fill={b.color} opacity={0.55}
                stroke={b.color} strokeWidth={1}/>
              {b.grow > 0.95 && (
                <text x={G.asX + G.asW / 2} y={b.top + b.height / 2 + 4}
                  textAnchor="middle" fill="var(--chalk-100)"
                  fontFamily="var(--font-mono)" fontSize={10}
                  letterSpacing="0.06em">
                  {b.size} B
                </text>
              )}
              {/* Side label "malloc(n)" */}
              {b.grow > 0.95 && (
                <g>
                  <line x1={G.asX + G.asW + 4} y1={b.top + b.height / 2}
                    x2={G.labelGutterX - 6} y2={b.top + b.height / 2}
                    stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}/>
                  <text x={G.labelGutterX} y={b.top + b.height / 2 + 5}
                    fill="var(--amber-300)"
                    fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 14}>
                    malloc({b.size})
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Heap-top arrow — points to whatever the current heap-top is */}
        {localTime > 0.4 && (
          <g>
            <line x1={G.asX + G.asW / 2} y1={heapTopY - 4}
              x2={G.asX + G.asW / 2} y2={heapTopY - 30}
              stroke="var(--amber-400)" strokeWidth={2}/>
            <polygon
              points={`${G.asX + G.asW / 2 - 5},${heapTopY - 30} ${G.asX + G.asW / 2 + 5},${heapTopY - 30} ${G.asX + G.asW / 2},${heapTopY - 40}`}
              fill="var(--amber-400)"/>
            <text x={G.asX + G.asW / 2} y={heapTopY - 46}
              textAnchor="middle"
              fill="var(--amber-300)"
              fontFamily="var(--font-mono)" fontSize={11}
              letterSpacing="0.16em">heap-top</text>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={6.4}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            heap-top moves up — toward the stack
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Stack grows down ──────────────────────────────────────────
function StackGrowsBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = addrSpaceGeom(portrait);

  // Stack frames materialise top-down. Each frame is ~44px tall.
  const frameH = portrait ? 38 : 42;
  const frames = [
    { name: 'main()',   appearAt: 0.4, returnAt: null },
    { name: 'work()',   appearAt: 2.2, returnAt: null },
    { name: 'helper()', appearAt: 4.0, returnAt: 6.4 },
  ];

  // Resolve which frames are currently on the stack.
  const live = frames.filter(f => localTime >= f.appearAt && (f.returnAt === null || localTime < f.returnAt));

  // Position each frame: top-down from G.asY.
  const frameBoxes = live.map((f, i) => {
    const top = G.asY + i * frameH;
    const grow = clamp((localTime - f.appearAt) / 0.4, 0, 1);
    // If returning soon, shrink it.
    let shrink = 1;
    if (f.returnAt !== null && localTime > f.returnAt - 0.4) {
      shrink = clamp((f.returnAt - localTime) / 0.4, 0, 1);
    }
    return { ...f, top, grow, shrink };
  });

  // Stack-top y = bottom of last live frame.
  const stackTopY = live.length > 0
    ? G.asY + live.length * frameH
    : G.asY;

  // Code + data positions (held over)
  const codeBot = G.asY + G.asH;
  const codeTop = codeBot - G.codeH;
  const dataTop = codeTop - G.dataH;

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
          marginBottom: 12,
        }}>
        the stack grows
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Address-space frame */}
        <rect x={G.asX} y={G.asY} width={G.asW} height={G.asH}
          fill="rgba(232,220,193,0.03)"
          stroke="var(--chalk-300)" strokeWidth={1.4}/>

        {/* Code + data + faded heap (so the viewer keeps orientation) */}
        <rect x={G.asX} y={codeTop} width={G.asW} height={G.codeH}
          fill="var(--violet-400)" opacity={0.4}
          stroke="var(--violet-400)" strokeWidth={1}/>
        <text x={G.asX + G.asW / 2} y={codeTop + G.codeH / 2 + 5}
          textAnchor="middle" fill="var(--chalk-100)"
          fontFamily="var(--font-mono)" fontSize={12} letterSpacing="0.16em">CODE</text>

        <rect x={G.asX} y={dataTop} width={G.asW} height={G.dataH}
          fill="var(--teal-400)" opacity={0.4}
          stroke="var(--teal-400)" strokeWidth={1}/>
        <text x={G.asX + G.asW / 2} y={dataTop + G.dataH / 2 + 5}
          textAnchor="middle" fill="var(--chalk-100)"
          fontFamily="var(--font-mono)" fontSize={12} letterSpacing="0.16em">DATA</text>

        {/* Persisting heap blocks from beat 3 (faded) */}
        {[
          { h: 32, top: dataTop - 32 },
          { h: 56, top: dataTop - 88 },
          { h: 22, top: dataTop - 110 },
        ].map((b, i) => (
          <rect key={`h-${i}`} x={G.asX + 6} y={b.top} width={G.asW - 12} height={b.h}
            fill="var(--amber-400)" opacity={0.28}
            stroke="var(--amber-400)" strokeWidth={1}/>
        ))}

        {/* Stack frames pushing down from the top */}
        {frameBoxes.map((f, i) => {
          const drawH = frameH * f.grow * f.shrink;
          return (
            <g key={f.name + i} opacity={f.shrink}>
              <rect x={G.asX + 6} y={f.top} width={G.asW - 12} height={drawH}
                fill="var(--rose-400)" opacity={0.55}
                stroke="var(--rose-400)" strokeWidth={1}/>
              {f.grow > 0.7 && (
                <text x={G.asX + G.asW / 2} y={f.top + frameH / 2 + 5}
                  textAnchor="middle" fill="var(--chalk-100)"
                  fontFamily="var(--font-serif)" fontStyle="italic"
                  fontSize={portrait ? 14 : 15}>
                  {f.name}
                </text>
              )}
              {/* Side label */}
              {f.grow > 0.9 && (
                <g>
                  <line x1={G.asX + G.asW + 4} y1={f.top + frameH / 2}
                    x2={G.labelGutterX - 6} y2={f.top + frameH / 2}
                    stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}/>
                  <text x={G.labelGutterX} y={f.top + frameH / 2 + 5}
                    fill="var(--rose-300)"
                    fontFamily="var(--font-mono)" fontSize={portrait ? 12 : 13}>
                    push frame
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Stack-top arrow */}
        {live.length > 0 && (
          <g>
            <line x1={G.asX + G.asW / 2} y1={stackTopY + 4}
              x2={G.asX + G.asW / 2} y2={stackTopY + 30}
              stroke="var(--rose-400)" strokeWidth={2}/>
            <polygon
              points={`${G.asX + G.asW / 2 - 5},${stackTopY + 30} ${G.asX + G.asW / 2 + 5},${stackTopY + 30} ${G.asX + G.asW / 2},${stackTopY + 40}`}
              fill="var(--rose-400)"/>
            <text x={G.asX + G.asW / 2} y={stackTopY + 54}
              textAnchor="middle"
              fill="var(--rose-300)"
              fontFamily="var(--font-mono)" fontSize={11}
              letterSpacing="0.16em">stack-top</text>
          </g>
        )}

        {/* Return marker — when helper() returns, briefly show "return" */}
        {localTime > 6.2 && localTime < 7.2 && (
          <text x={G.asX + G.asW + 14} y={G.asY + 2 * frameH + frameH / 2 + 4}
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={12}
            letterSpacing="0.14em"
            opacity={1 - clamp(localTime - 6.7, 0, 1)}>
            ← return
          </text>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={7.6}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            stack-top moves down — toward the heap
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
          fontSize: portrait ? 24 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '40ch',
          lineHeight: 1.3,
        }}>
        Heap grows up. Stack grows down. They meet — that's out of memory.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.14em',
          textAlign: 'center',
          maxWidth: portrait ? '32ch' : 'none',
        }}>
        every process sees its own private copy
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
    >
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
