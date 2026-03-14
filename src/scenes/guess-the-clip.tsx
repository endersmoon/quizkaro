import {Rect, Txt, Circle, Layout, makeScene2D} from '@revideo/2d';
import {Gradient} from '@revideo/2d';
import {
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
  useScene,
  easeOutBack,
  easeOutCubic,
  easeInCubic,
  easeInOutSine,
  linear,
} from '@revideo/core';

interface ClipQuestion {
  options: string[];
  correctIndex: number;
  clipLabel?: string; // optional label shown during clip e.g. "Hint: 90s classic"
}

// Canvas: 1080 x 1920 (portrait). Origin at center.
const C = {
  card: '#1a1528',
  cardBorder: '#3d2b5a',
  accent: '#f43f5e',
  correct: '#00e676',
  correctGlow: '#69f0ae',
  wrong: '#ff5252',
  white: '#ffffff',
  whiteOff: '#e0e0f0',
  muted: '#8888aa',
  optionBg: '#1e1e3f',
  optionBorder: '#2d2d5e',
  timerBg: '#1a1a3a',
  clipBg: '#0d0d1a',
  progressBar: '#a855f7',
  progressGlow: '#c084fc',
};

const OPTION_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'];

export default makeScene2D('guess-the-clip', function* (view) {
  const vars = useScene().variables;
  const title = vars.get('title', 'Guess the Clip!')() as string;
  const subtitle = vars.get('subtitle', '')() as string;
  const questionsJson = vars.get('questions', '[]')() as string;
  const clipDuration = Number(vars.get('clipDuration', '15')());
  const thinkTime = Number(vars.get('thinkTime', '10')());
  const accentColor = vars.get('accentColor', C.accent)() as string;
  const icon = vars.get('icon', '🎬')() as string;
  const itemLabel = vars.get('itemLabel', 'CLIP')() as string; // "CLIP", "SONG", "CITY"
  const promptText = vars.get('promptText', 'What is this?')() as string;
  const watchText = vars.get('watchText', '👀  Watch carefully...')() as string;

  const questions: ClipQuestion[] = JSON.parse(questionsJson);

  // Background gradient
  view.fill(
    new Gradient({
      type: 'linear',
      from: [0, -960],
      to: [0, 960],
      stops: [
        {offset: 0, color: '#050510'},
        {offset: 0.35, color: '#1a0a2e'},
        {offset: 0.65, color: '#0a1628'},
        {offset: 1, color: '#0a0a1a'},
      ],
    }),
  );

  // ─── INTRO SCREEN ───
  const introIcon = createRef<Txt>();
  const introTitle = createRef<Txt>();
  const introSubtitle = createRef<Txt>();
  const introLine = createRef<Rect>();
  const introAccent = createRef<Rect>();

  yield view.add(
    <>
      <Txt
        ref={introIcon}
        text={icon}
        fontSize={130}
        opacity={0}
        y={-220}
      />
      <Txt
        ref={introTitle}
        text={title}
        fontSize={76}
        fontWeight={900}
        fontFamily="'Arial Black', 'Arial', sans-serif"
        fill={C.white}
        opacity={0}
        letterSpacing={3}
        shadowColor={accentColor}
        shadowBlur={30}
        textWrap
        width={900}
        textAlign="center"
        lineHeight={96}
        y={-60}
      />
      <Rect
        ref={introLine}
        width={0}
        height={5}
        radius={3}
        fill={accentColor}
        shadowColor={accentColor}
        shadowBlur={25}
        y={60}
      />
      <Txt
        ref={introSubtitle}
        text={subtitle || `Can you guess from a ${clipDuration}s clip?`}
        fontSize={30}
        fontWeight={700}
        fontFamily="'Arial', sans-serif"
        fill={accentColor}
        opacity={0}
        letterSpacing={2}
        y={120}
      />
      <Rect
        ref={introAccent}
        height={60}
        paddingLeft={40}
        paddingRight={40}
        radius={30}
        fill={accentColor}
        opacity={0}
        scale={0}
        shadowColor={accentColor}
        shadowBlur={20}
        y={200}
      >
        <Txt
          text={`${questions.length} ${itemLabel}S`}
          fontSize={26}
          fontWeight={800}
          fontFamily="'Arial', sans-serif"
          fill={C.white}
          letterSpacing={6}
        />
      </Rect>
    </>,
  );

  yield* all(
    introIcon().opacity(1, 0.4),
    introIcon().scale([0.5, 0.5], 0).to([1, 1], 0.7, easeOutBack),
  );
  yield* all(
    introTitle().opacity(1, 0.5),
    introTitle().scale([0.9, 0.9], 0).to([1, 1], 0.6, easeOutBack),
  );
  yield* introLine().width(450, 0.5, easeOutCubic);
  yield* all(
    introSubtitle().opacity(1, 0.4),
    introAccent().opacity(1, 0.4),
    introAccent().scale(1, 0.5, easeOutBack),
  );
  yield* waitFor(2);
  yield* all(
    introIcon().opacity(0, 0.5),
    introTitle().opacity(0, 0.5),
    introLine().opacity(0, 0.5),
    introSubtitle().opacity(0, 0.5),
    introAccent().opacity(0, 0.5),
  );
  introIcon().remove();
  introTitle().remove();
  introLine().remove();
  introSubtitle().remove();
  introAccent().remove();

  // ─── QUESTIONS ───
  const Y_HEADER = -800;
  const Y_DOTS = -750;
  const Y_WATCH_TEXT = -660;
  const Y_CLIP_BOX = -350;
  const Y_CLIP_PROGRESS = -130;
  const Y_PROMPT = -30;
  const Y_FIRST_OPTION = 100;
  const OPTION_GAP = 135;
  const Y_TIMER = 660;

  // Clip box dimensions
  const CLIP_W = 900;
  const CLIP_H = 400;

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const labels = ['A', 'B', 'C', 'D'];

    // Refs
    const headerTxt = createRef<Txt>();
    const dotsRow = createRef<Layout>();
    const progressDots = createRefArray<Circle>();
    const watchTxt = createRef<Txt>();
    const clipBox = createRef<Rect>();
    const clipIconTxt = createRef<Txt>();
    const clipCountdownTxt = createRef<Txt>();
    const clipHintTxt = createRef<Txt>();
    const progressBarBg = createRef<Rect>();
    const progressBarFill = createRef<Rect>();
    const progressTimeTxt = createRef<Txt>();
    const promptTxt = createRef<Txt>();
    const optionRects = createRefArray<Rect>();
    const optionLabels = createRefArray<Rect>();
    const timerBgCircle = createRef<Circle>();
    const timerFillCircle = createRef<Circle>();
    const timerTxt = createRef<Txt>();

    // Pulsing dots for "playing" indicator
    const playDots = createRefArray<Circle>();

    yield view.add(
      <>
        {/* Header */}
        <Txt
          ref={headerTxt}
          text={`${itemLabel} ${qi + 1}`}
          fontSize={22}
          fontWeight={700}
          fontFamily="'Arial', sans-serif"
          fill={C.muted}
          letterSpacing={6}
          y={Y_HEADER}
          opacity={0}
        />

        {/* Progress dots */}
        <Layout ref={dotsRow} direction="row" gap={14} y={Y_DOTS}>
          {...Array.from({length: questions.length}, (_, i) => (
            <Circle
              ref={progressDots}
              size={i === qi ? 16 : 10}
              fill={i < qi ? C.correct : i === qi ? accentColor : C.optionBorder}
              opacity={0}
              shadowColor={i === qi ? accentColor : 'rgba(0,0,0,0)'}
              shadowBlur={i === qi ? 12 : 0}
            />
          ))}
        </Layout>

        {/* Watch text */}
        <Txt
          ref={watchTxt}
          text={watchText}
          fontSize={30}
          fontWeight={700}
          fontFamily="'Arial', sans-serif"
          fill={accentColor}
          y={Y_WATCH_TEXT}
          opacity={0}
          letterSpacing={2}
        />

        {/* Clip playback box */}
        <Rect
          ref={clipBox}
          width={CLIP_W}
          height={CLIP_H}
          radius={24}
          fill={C.clipBg}
          stroke={C.cardBorder}
          lineWidth={3}
          y={Y_CLIP_BOX}
          opacity={0}
          shadowColor={'rgba(0,0,0,0.5)'}
          shadowBlur={40}
          shadowOffset={[0, 8]}
        >
          {/* Big play icon in center */}
          <Txt
            ref={clipIconTxt}
            text="▶"
            fontSize={80}
            fill={'rgba(255,255,255,0.15)'}
            y={-20}
          />
          {/* Countdown number */}
          <Txt
            ref={clipCountdownTxt}
            text={`${clipDuration}`}
            fontSize={120}
            fontWeight={900}
            fontFamily="'Arial Black', 'Arial', sans-serif"
            fill={C.white}
            opacity={0}
            shadowColor={accentColor}
            shadowBlur={20}
            y={-10}
          />
          {/* Optional hint label */}
          <Txt
            ref={clipHintTxt}
            text={q.clipLabel || ''}
            fontSize={22}
            fontWeight={600}
            fontFamily="'Arial', sans-serif"
            fill={C.muted}
            y={140}
            opacity={q.clipLabel ? 1 : 0}
            letterSpacing={2}
          />
          {/* Playing indicator dots */}
          <Layout direction="row" gap={12} y={80}>
            {...Array.from({length: 3}, () => (
              <Circle
                ref={playDots}
                size={10}
                fill={accentColor}
                opacity={0}
              />
            ))}
          </Layout>
        </Rect>

        {/* Progress bar */}
        <Rect
          ref={progressBarBg}
          width={CLIP_W}
          height={8}
          radius={4}
          fill={'rgba(255,255,255,0.1)'}
          y={Y_CLIP_PROGRESS}
          opacity={0}
        />
        <Rect
          ref={progressBarFill}
          width={0}
          height={8}
          radius={4}
          fill={
            new Gradient({
              type: 'linear',
              from: [-CLIP_W / 2, 0],
              to: [CLIP_W / 2, 0],
              stops: [
                {offset: 0, color: C.progressBar},
                {offset: 1, color: C.progressGlow},
              ],
            })
          }
          shadowColor={C.progressGlow}
          shadowBlur={12}
          y={Y_CLIP_PROGRESS}
          opacity={0}
          // Anchor left so it grows from the left
          x={-CLIP_W / 2}
        />
        <Txt
          ref={progressTimeTxt}
          text={`0:00 / 0:${clipDuration.toString().padStart(2, '0')}`}
          fontSize={18}
          fontWeight={600}
          fontFamily="'Arial', sans-serif"
          fill={C.muted}
          y={Y_CLIP_PROGRESS + 22}
          opacity={0}
        />

        {/* Prompt */}
        <Txt
          ref={promptTxt}
          text={promptText}
          fontSize={44}
          fontWeight={800}
          fontFamily="'Arial Black', 'Arial', sans-serif"
          fill={C.white}
          y={Y_PROMPT}
          opacity={0}
          shadowColor={accentColor}
          shadowBlur={15}
        />

        {/* Answer options */}
        {...q.options.map((opt, i) => (
          <Rect
            ref={optionRects}
            width={950}
            height={110}
            radius={20}
            fill={C.optionBg}
            stroke={C.optionBorder}
            lineWidth={2}
            y={Y_FIRST_OPTION + i * OPTION_GAP}
            opacity={0}
            x={i % 2 === 0 ? -500 : 500}
            shadowColor={'rgba(0,0,0,0.3)'}
            shadowBlur={20}
            shadowOffset={[0, 4]}
          >
            <Rect
              ref={optionLabels}
              width={60}
              height={60}
              radius={16}
              fill={OPTION_COLORS[i % OPTION_COLORS.length]}
              x={-400}
            >
              <Txt
                text={labels[i]}
                fontSize={28}
                fontWeight={800}
                fontFamily="'Arial', sans-serif"
                fill={C.white}
              />
            </Rect>
            <Txt
              text={opt}
              fontSize={30}
              fontWeight={600}
              fontFamily="'Arial', sans-serif"
              fill={C.whiteOff}
              x={30}
              textWrap
              width={700}
              textAlign="center"
            />
          </Rect>
        ))}

        {/* Timer */}
        <Circle
          ref={timerBgCircle}
          size={100}
          stroke={C.timerBg}
          lineWidth={8}
          y={Y_TIMER}
          opacity={0}
        />
        <Circle
          ref={timerFillCircle}
          size={100}
          stroke={accentColor}
          lineWidth={8}
          y={Y_TIMER}
          startAngle={-90}
          endAngle={270}
          shadowColor={accentColor}
          shadowBlur={15}
          opacity={0}
        />
        <Txt
          ref={timerTxt}
          text={`${thinkTime}`}
          fontSize={40}
          fontWeight={800}
          fontFamily="'Arial', sans-serif"
          fill={C.white}
          y={Y_TIMER}
          opacity={0}
        />
      </>,
    );

    // ─── Animate in ───
    yield* all(
      headerTxt().opacity(1, 0.3),
      ...progressDots.map(dot => dot.opacity(1, 0.3)),
    );

    yield* watchTxt().opacity(1, 0.3);

    // Show clip box
    yield* all(
      clipBox().opacity(1, 0.5, easeOutCubic),
      clipBox().scale([0.95, 0.95], 0).to([1, 1], 0.5, easeOutBack),
      progressBarBg().opacity(1, 0.3),
      progressBarFill().opacity(1, 0.3),
      progressTimeTxt().opacity(1, 0.3),
    );

    // ─── Clip playback simulation ───
    // Show countdown number and playing dots
    yield* all(
      clipIconTxt().opacity(0, 0.3),
      clipCountdownTxt().opacity(1, 0.3),
      ...playDots.map(dot => dot.opacity(0.7, 0.3)),
    );

    // Animate the clip duration — progress bar fills + countdown decreases
    // We'll animate in 1-second steps for the countdown text
    const clipStepDuration = clipDuration;

    // Run progress bar fill and playing dot pulse in parallel
    yield* all(
      // Progress bar fills left to right
      progressBarFill().width(CLIP_W, clipStepDuration, linear),
      progressBarFill().x(0, clipStepDuration, linear),
      // Clip box border pulses to show "playing"
      chain(
        ...Array.from({length: clipStepDuration}, (_, s) => {
          const remaining = clipStepDuration - s;
          const timeStr = `0:${(s + 1).toString().padStart(2, '0')} / 0:${clipDuration.toString().padStart(2, '0')}`;
          return chain(
            all(
              clipCountdownTxt().text(`${remaining - 1}`, 0),
              progressTimeTxt().text(timeStr, 0),
              // Pulse the countdown scale
              clipCountdownTxt().scale(1.1, 0.15, easeOutBack),
            ),
            clipCountdownTxt().scale(1, 0.15),
            waitFor(0.7),
          );
        }),
      ),
      // Playing dots animation
      chain(
        ...Array.from({length: clipStepDuration * 2}, (_, p) =>
          chain(
            all(
              playDots[0]?.opacity(1, 0.2),
              playDots[1]?.opacity(0.4, 0.2),
              playDots[2]?.opacity(0.4, 0.2),
            ),
            waitFor(0.05),
            all(
              playDots[0]?.opacity(0.4, 0.2),
              playDots[1]?.opacity(1, 0.2),
              playDots[2]?.opacity(0.4, 0.2),
            ),
            waitFor(0.05),
            all(
              playDots[0]?.opacity(0.4, 0.2),
              playDots[1]?.opacity(0.4, 0.2),
              playDots[2]?.opacity(1, 0.2),
            ),
            waitFor(0.05),
          ),
        ),
      ),
    );

    // Clip finished — flash the box
    yield* all(
      clipBox().stroke(accentColor, 0.3),
      clipBox().shadowColor(accentColor + '40', 0.3),
      clipBox().shadowBlur(30, 0.3),
      clipCountdownTxt().text('✓', 0),
      clipCountdownTxt().fill(C.correct, 0.3),
      ...playDots.map(dot => dot.opacity(0, 0.2)),
    );

    yield* waitFor(0.5);

    // Shrink clip box and show prompt + options
    yield* all(
      clipBox().scale(0.85, 0.4, easeOutCubic),
      clipBox().y(Y_CLIP_BOX + 40, 0.4, easeOutCubic),
      clipBox().opacity(0.5, 0.4),
      progressBarBg().opacity(0, 0.3),
      progressBarFill().opacity(0, 0.3),
      progressTimeTxt().opacity(0, 0.3),
      watchTxt().opacity(0, 0.3),
    );

    // Show prompt
    yield* all(
      promptTxt().opacity(1, 0.4),
      promptTxt().y(Y_PROMPT + 10, 0).to(Y_PROMPT, 0.4, easeOutCubic),
    );

    // Slide in options
    for (let i = 0; i < q.options.length; i++) {
      yield* all(
        optionRects[i].opacity(1, 0.25),
        optionRects[i].x(0, 0.4, easeOutCubic),
      );
    }

    // Show timer
    yield* all(
      timerBgCircle().opacity(1, 0.3),
      timerFillCircle().opacity(1, 0.3),
      timerTxt().opacity(1, 0.3),
    );

    // ─── Countdown ───
    yield* timerFillCircle().endAngle(-90, thinkTime, linear);

    // ─── Reveal answer ───
    yield* all(
      optionRects[q.correctIndex].fill(C.correct, 0.3),
      optionRects[q.correctIndex].stroke(C.correctGlow, 0.3),
      optionRects[q.correctIndex].shadowColor(C.correctGlow, 0.3),
      optionRects[q.correctIndex].shadowBlur(30, 0.3),
      optionRects[q.correctIndex].scale(1.03, 0.3, easeOutBack),
      optionLabels[q.correctIndex].fill(C.correct, 0.3),
    );

    yield* all(
      ...q.options.flatMap((_, i) => {
        if (i === q.correctIndex) return [];
        return [
          optionRects[i].opacity(0.35, 0.4),
          optionRects[i].fill('#1a0a0f', 0.4),
          optionRects[i].stroke(C.wrong, 0.3),
        ];
      }),
    );

    yield* waitFor(2.5);

    // ─── Fade out ───
    const allNodes = [
      headerTxt(), dotsRow(), watchTxt(), clipBox(),
      progressBarBg(), progressBarFill(), progressTimeTxt(),
      promptTxt(), timerBgCircle(), timerFillCircle(), timerTxt(),
      ...optionRects,
    ];
    yield* all(
      ...allNodes.map(n => n.opacity(0, 0.4)),
      ...optionRects.map((r, i) =>
        r.x(i % 2 === 0 ? -200 : 200, 0.4, easeInCubic),
      ),
      clipBox().scale(0.8, 0.4),
    );
    allNodes.forEach(n => n.remove());
    yield* waitFor(0.2);
  }

  // ─── OUTRO ───
  const outroTitle = createRef<Txt>();
  const outroSub = createRef<Txt>();
  const outroLine = createRef<Rect>();

  yield view.add(
    <>
      <Txt
        ref={outroTitle}
        text="How many did you get?"
        fontSize={56}
        fontWeight={900}
        fontFamily="'Arial Black', 'Arial', sans-serif"
        fill={C.white}
        opacity={0}
        shadowColor={accentColor}
        shadowBlur={30}
        textWrap
        width={900}
        textAlign="center"
        lineHeight={72}
        y={-60}
      />
      <Rect
        ref={outroLine}
        width={0}
        height={4}
        radius={2}
        fill={accentColor}
        shadowColor={accentColor}
        shadowBlur={20}
        y={10}
      />
      <Txt
        ref={outroSub}
        text="Like & Subscribe for more!"
        fontSize={28}
        fontWeight={700}
        fontFamily="'Arial', sans-serif"
        fill={accentColor}
        opacity={0}
        letterSpacing={2}
        y={60}
      />
    </>,
  );

  yield* all(
    outroTitle().opacity(1, 0.5),
    outroTitle().scale([0.9, 0.9], 0).to([1, 1], 0.6, easeOutBack),
  );
  yield* outroLine().width(400, 0.5, easeOutCubic);
  yield* outroSub().opacity(1, 0.4);
  yield* waitFor(3);
  yield* all(
    outroTitle().opacity(0, 0.5),
    outroSub().opacity(0, 0.5),
    outroLine().width(0, 0.5),
  );
});
