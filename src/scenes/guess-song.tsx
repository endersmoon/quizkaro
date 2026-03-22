import {Audio, Rect, Txt, Circle, Layout, Line, makeScene2D} from '@reelgen/2d';
import {Gradient} from '@reelgen/2d';
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
  Vector2,
} from '@reelgen/core';

interface SongQuestion {
  options: string[]; // "Artist - Song Title" format
  correctIndex: number;
  audioClip?: string; // optional path to audio file
}

// Canvas: 1080 x 1920 (portrait). Origin at center.
const C = {
  card: '#1c1b3a',
  cardBorder: '#3a3870',
  accent: '#ff6b9d', // pink accent for music theme
  correct: '#00e676',
  correctGlow: '#69f0ae',
  wrong: '#ff5252',
  white: '#ffffff',
  whiteOff: '#e0e0f0',
  muted: '#8888aa',
  optionBg: '#1e1e3f',
  optionBorder: '#2d2d5e',
  timerBg: '#1a1a3a',
  musicNote: '#ff6b9d',
  waveform: '#a855f7', // purple waveform bars
  waveformGlow: '#c084fc',
};

const OPTION_COLORS = ['#8b5cf6', '#ec4899', '#f97316', '#06b6d4'];

// Generate pseudo-random bar heights for waveform visualization
function generateBarHeights(count: number, seed: number): number[] {
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    // Simple deterministic pseudo-random based on index + seed
    const val = Math.sin(i * 1.7 + seed * 3.14) * 0.5 + 0.5;
    const height = 30 + val * 170; // range 30-200
    heights.push(height);
  }
  return heights;
}

export default makeScene2D('guess-song', function* (view) {
  const vars = useScene().variables;
  const title = vars.get('title', 'Guess the Song!')() as string;
  const questionsJson = vars.get('questions', '[]')() as string;
  const thinkTime = Number(vars.get('thinkTime', '15')());
  const accentColor = vars.get('accentColor', C.accent)() as string;

  const questions: SongQuestion[] = JSON.parse(questionsJson);

  // Background gradient — deeper purple for music theme
  view.fill(
    new Gradient({
      type: 'linear',
      from: [0, -960],
      to: [0, 960],
      stops: [
        {offset: 0, color: '#0a0015'},
        {offset: 0.4, color: '#1a0533'},
        {offset: 0.7, color: '#2d1b69'},
        {offset: 1, color: '#1a1040'},
      ],
    }),
  );

  // ─── INTRO SCREEN ───
  const introTitle = createRef<Txt>();
  const introIcon = createRef<Txt>();
  const introLine = createRef<Rect>();
  const introAccent = createRef<Rect>();

  yield view.add(
    <>
      <Txt
        ref={introIcon}
        text="🎵"
        fontSize={120}
        opacity={0}
        y={-200}
      />
      <Txt
        ref={introTitle}
        text={title}
        fontSize={80}
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
        lineHeight={100}
        y={-40}
      />
      <Rect
        ref={introLine}
        width={0}
        height={5}
        radius={3}
        fill={accentColor}
        shadowColor={accentColor}
        shadowBlur={25}
        y={80}
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
        y={160}
      >
        <Txt
          text={`${questions.length} SONGS`}
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
    introIcon().scale([0.5, 0.5], 0).to([1, 1], 0.6, easeOutBack),
  );
  yield* all(
    introTitle().opacity(1, 0.5),
    introTitle().scale([0.9, 0.9], 0).to([1, 1], 0.6, easeOutBack),
  );
  yield* introLine().width(400, 0.5, easeOutCubic);
  yield* all(
    introAccent().opacity(1, 0.4),
    introAccent().scale(1, 0.5, easeOutBack),
  );
  yield* waitFor(2);
  yield* all(
    introTitle().opacity(0, 0.5),
    introIcon().opacity(0, 0.5),
    introLine().opacity(0, 0.5),
    introAccent().opacity(0, 0.5),
  );
  introTitle().remove();
  introIcon().remove();
  introLine().remove();
  introAccent().remove();

  // ─── QUESTIONS ───
  const Y_HEADER = -780;
  const Y_DOTS = -730;
  const Y_LISTEN = -600;
  const Y_WAVEFORM = -400;
  const Y_PROMPT = -180;
  const Y_FIRST_OPTION_DEFAULT = -20;
  const OPTION_GAP = 140;
  const Y_TIMER_DEFAULT = 560;
  const OPTION_TOP_MARGIN = 40;

  const BAR_COUNT = 32;
  const BAR_WIDTH = 18;
  const BAR_GAP = 8;
  const WAVEFORM_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP);

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const labels = ['A', 'B', 'C', 'D'];

    // Refs
    const headerTxt = createRef<Txt>();
    const dotsRow = createRef<Layout>();
    const progressDots = createRefArray<Circle>();
    const listenTxt = createRef<Txt>();
    const waveformContainer = createRef<Rect>();
    const waveformBars = createRefArray<Rect>();
    const promptTxt = createRef<Txt>();
    const optionRects = createRefArray<Rect>();
    const optionLabels = createRefArray<Rect>();
    const timerBgCircle = createRef<Circle>();
    const timerFillCircle = createRef<Circle>();
    const timerTxt = createRef<Txt>();
    const playIcon = createRef<Circle>();
    const playTriangle = createRef<Rect>();
    const songAudio = createRef<Audio>();
    const hasAudio = !!q.audioClip;

    // Generate bar heights for this question
    const barHeights = generateBarHeights(BAR_COUNT, qi);

    yield view.add(
      <>
        {/* Header */}
        <Txt
          ref={headerTxt}
          text={`SONG ${qi + 1}`}
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

        {/* "Listen carefully..." text */}
        <Txt
          ref={listenTxt}
          text="🎧  Listen carefully..."
          fontSize={32}
          fontWeight={700}
          fontFamily="'Arial', sans-serif"
          fill={accentColor}
          y={Y_LISTEN}
          opacity={0}
          letterSpacing={2}
        />

        {/* Waveform visualization — absolutely positioned bars */}
        <Rect
          ref={waveformContainer}
          width={WAVEFORM_WIDTH}
          height={250}
          y={Y_WAVEFORM}
          opacity={0}
        >
          {...Array.from({length: BAR_COUNT}, (_, i) => {
            const barX = -WAVEFORM_WIDTH / 2 + i * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2;
            return (
              <Rect
                ref={waveformBars}
                width={BAR_WIDTH}
                height={0}
                radius={BAR_WIDTH / 2}
                x={barX}
                fill={
                  new Gradient({
                    type: 'linear',
                    from: [0, -100],
                    to: [0, 100],
                    stops: [
                      {offset: 0, color: C.waveformGlow},
                      {offset: 1, color: C.waveform},
                    ],
                  })
                }
                shadowColor={C.waveformGlow}
                shadowBlur={8}
              />
            );
          })}
        </Rect>

        {/* Audio clip (if provided) — invisible, just plays sound */}
        {hasAudio && (
          <Audio
            ref={songAudio}
            src={q.audioClip!}
            play={false}
          />
        )}

        {/* "What song is this?" prompt */}
        <Txt
          ref={promptTxt}
          text="What song is this?"
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
            y={Y_FIRST_OPTION_DEFAULT + i * OPTION_GAP}
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
              fontSize={28}
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
          y={Y_TIMER_DEFAULT}
          opacity={0}
        />
        <Circle
          ref={timerFillCircle}
          size={100}
          stroke={accentColor}
          lineWidth={8}
          y={Y_TIMER_DEFAULT}
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
          y={Y_TIMER_DEFAULT}
          opacity={0}
        />
      </>,
    );

    // Dynamically position options based on prompt text height
    const promptBottom = Y_PROMPT + promptTxt().height() / 2;
    const actualYStart = promptBottom + OPTION_TOP_MARGIN;
    for (let i = 0; i < q.options.length; i++) {
      optionRects[i].y(actualYStart + i * OPTION_GAP);
    }
    const timerY = actualYStart + q.options.length * OPTION_GAP + 40;
    timerBgCircle().y(timerY);
    timerFillCircle().y(timerY);
    timerTxt().y(timerY);

    // ─── Animate in ───
    yield* all(
      headerTxt().opacity(1, 0.3),
      ...progressDots.map(dot => dot.opacity(1, 0.3)),
    );

    // Show "Listen carefully"
    yield* all(
      listenTxt().opacity(1, 0.4),
      waveformContainer().opacity(1, 0.3),
    );

    // ─── Waveform animation (simulating audio playback) ───
    // Start audio if available
    if (hasAudio) {
      songAudio().play();
    }
    // Animate bars growing to their target heights with stagger
    yield* all(
      ...waveformBars.map((bar, i) =>
        chain(
          waitFor(i * 0.03), // stagger
          bar.height(barHeights[i], 0.4, easeOutBack),
        ),
      ),
    );

    // Animate bars pulsing for a few seconds (simulating music playing)
    const pulseIterations = 4;
    for (let p = 0; p < pulseIterations; p++) {
      const newHeights = generateBarHeights(BAR_COUNT, qi * 10 + p + 1);
      yield* all(
        ...waveformBars.map((bar, i) =>
          bar.height(newHeights[i], 0.5, easeInOutSine),
        ),
      );
    }

    // Show prompt and options
    yield* all(
      promptTxt().opacity(1, 0.4),
      promptTxt().y(promptTxt().y() + 10, 0).to(promptTxt().y(), 0.4, easeOutCubic),
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

    // Continue waveform animation during countdown
    // Run countdown and waveform pulse in parallel
    const countdownDuration = thinkTime;
    const pulsesPerSecond = 2;
    const totalPulses = Math.floor(countdownDuration * pulsesPerSecond);

    // Start countdown timer
    yield* all(
      timerFillCircle().endAngle(-90, countdownDuration, linear),
      // Waveform keeps pulsing during countdown
      ...Array.from({length: totalPulses}, (_, p) => {
        const heights = generateBarHeights(BAR_COUNT, qi * 100 + p + 50);
        return chain(
          waitFor(p / pulsesPerSecond),
          all(
            ...waveformBars.map((bar, i) =>
              bar.height(heights[i], 1 / pulsesPerSecond, easeInOutSine),
            ),
          ),
        );
      }),
    );

    // ─── Reveal answer ───
    // Stop audio and shrink waveform bars
    if (hasAudio) {
      songAudio().pause();
    }
    yield* all(
      ...waveformBars.map(bar => bar.height(10, 0.3)),
      listenTxt().opacity(0, 0.3),
    );

    // Highlight correct answer
    yield* all(
      optionRects[q.correctIndex].fill(C.correct, 0.3),
      optionRects[q.correctIndex].stroke(C.correctGlow, 0.3),
      optionRects[q.correctIndex].shadowColor(C.correctGlow, 0.3),
      optionRects[q.correctIndex].shadowBlur(30, 0.3),
      optionRects[q.correctIndex].scale(1.03, 0.3, easeOutBack),
      optionLabels[q.correctIndex].fill(C.correct, 0.3),
    );

    // Dim wrong answers
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
      headerTxt(), dotsRow(), listenTxt(), waveformContainer(),
      promptTxt(), timerBgCircle(), timerFillCircle(), timerTxt(),
      ...optionRects,
    ];
    yield* all(
      ...allNodes.map(n => n.opacity(0, 0.4)),
      ...optionRects.map((r, i) =>
        r.x(i % 2 === 0 ? -200 : 200, 0.4, easeInCubic),
      ),
    );
    allNodes.forEach(n => n.remove());
    if (hasAudio) {
      songAudio().remove();
    }
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
