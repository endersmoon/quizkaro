import {Rect, Txt, Circle, Layout, makeScene2D} from '@reelgen/2d';
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
  easeOutElastic,
  easeInCubic,
  easeInOutSine,
  linear,
} from '@reelgen/core';

interface MovieQuestion {
  emojis: string; // emoji clue string e.g. "🦁👑"
  options: string[];
  correctIndex: number;
}

// Canvas: 1080 x 1920 (portrait). Origin at center.
const C = {
  card: '#1a1528',
  cardBorder: '#3d2b5a',
  accent: '#f59e0b', // golden/amber for Bollywood theme
  accentGlow: '#fbbf24',
  correct: '#00e676',
  correctGlow: '#69f0ae',
  wrong: '#ff5252',
  white: '#ffffff',
  whiteOff: '#e0e0f0',
  muted: '#9988bb',
  optionBg: '#1e1830',
  optionBorder: '#352a50',
  timerBg: '#1a1530',
  emojiGlow: '#f59e0b',
};

const OPTION_COLORS = ['#e74c3c', '#2ecc71', '#3498db', '#9b59b6'];

export default makeScene2D('guess-movie-emoji', function* (view) {
  const vars = useScene().variables;
  const title = vars.get('title', 'Guess the Movie!')() as string;
  const subtitle = vars.get('subtitle', '')() as string;
  const questionsJson = vars.get('questions', '[]')() as string;
  const thinkTime = Number(vars.get('thinkTime', '10')());
  const accentColor = vars.get('accentColor', C.accent)() as string;

  const questions: MovieQuestion[] = JSON.parse(questionsJson);

  // Background gradient — warm dark for Bollywood/cinema theme
  view.fill(
    new Gradient({
      type: 'linear',
      from: [0, -960],
      to: [0, 960],
      stops: [
        {offset: 0, color: '#0a0510'},
        {offset: 0.3, color: '#1a0f2e'},
        {offset: 0.6, color: '#2a1540'},
        {offset: 1, color: '#150d25'},
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
        text="🎬"
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
        text={subtitle || 'Can you guess from emojis?'}
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
          text={`${questions.length} MOVIES`}
          fontSize={26}
          fontWeight={800}
          fontFamily="'Arial', sans-serif"
          fill={'#1a0f2e'}
          letterSpacing={6}
        />
      </Rect>
    </>,
  );

  // Intro animations
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
  const Y_HEADER = -780;
  const Y_DOTS = -730;
  const Y_PROMPT = -620;
  const Y_EMOJI_BOX = -350;
  const Y_QUESTION_MARK = -80;
  const Y_FIRST_OPTION_DEFAULT = 80;
  const OPTION_GAP = 140;
  const Y_TIMER_DEFAULT = 660;
  const OPTION_TOP_MARGIN = 40;

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const labels = ['A', 'B', 'C', 'D'];

    // Split emojis into individual characters for stagger animation
    const emojiChars = [...q.emojis];

    // Refs
    const headerTxt = createRef<Txt>();
    const dotsRow = createRef<Layout>();
    const progressDots = createRefArray<Circle>();
    const promptTxt = createRef<Txt>();
    const emojiCard = createRef<Rect>();
    const emojiTexts = createRefArray<Txt>();
    const questionMark = createRef<Txt>();
    const optionRects = createRefArray<Rect>();
    const optionLabels = createRefArray<Rect>();
    const timerBgCircle = createRef<Circle>();
    const timerFillCircle = createRef<Circle>();
    const timerTxt = createRef<Txt>();

    yield view.add(
      <>
        {/* Header */}
        <Txt
          ref={headerTxt}
          text={`MOVIE ${qi + 1}`}
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

        {/* "Guess the movie!" prompt */}
        <Txt
          ref={promptTxt}
          text="Guess the movie from emojis!"
          fontSize={28}
          fontWeight={700}
          fontFamily="'Arial', sans-serif"
          fill={C.muted}
          y={Y_PROMPT}
          opacity={0}
          letterSpacing={2}
        />

        {/* Emoji card */}
        <Rect
          ref={emojiCard}
          width={900}
          height={280}
          radius={30}
          fill={C.card}
          stroke={C.cardBorder}
          lineWidth={3}
          y={Y_EMOJI_BOX}
          opacity={0}
          shadowColor={'rgba(245, 158, 11, 0.15)'}
          shadowBlur={60}
          shadowOffset={[0, 10]}
        >
          {/* Emojis positioned inside the card */}
          {...emojiChars.map((emoji, i) => {
            const totalWidth = emojiChars.length * 110;
            const emojiX = -totalWidth / 2 + i * 110 + 55;
            return (
              <Txt
                ref={emojiTexts}
                text={emoji}
                fontSize={90}
                opacity={0}
                scale={0}
                x={emojiX}
              />
            );
          })}
        </Rect>

        {/* "Which movie?" text */}
        <Txt
          ref={questionMark}
          text="Which movie is this?"
          fontSize={42}
          fontWeight={800}
          fontFamily="'Arial Black', 'Arial', sans-serif"
          fill={C.white}
          y={Y_QUESTION_MARK}
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

    // Dynamically position options based on question mark text height
    const qmBottom = Y_QUESTION_MARK + questionMark().height() / 2;
    const actualYStart = qmBottom + OPTION_TOP_MARGIN;
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

    yield* promptTxt().opacity(1, 0.3);

    // Show emoji card
    yield* all(
      emojiCard().opacity(1, 0.5, easeOutCubic),
      emojiCard().scale([0.95, 0.95], 0).to([1, 1], 0.5, easeOutBack),
    );

    // Stagger emoji reveal — each emoji pops in one by one
    for (let i = 0; i < emojiChars.length; i++) {
      yield* all(
        emojiTexts[i].opacity(1, 0.2),
        emojiTexts[i].scale(1.3, 0).to(1, 0.4, easeOutBack),
      );
      yield* waitFor(0.3);
    }

    yield* waitFor(0.5);

    // Show "Which movie?" and options
    yield* all(
      questionMark().opacity(1, 0.4),
      questionMark().y(Y_QUESTION_MARK + 10, 0).to(Y_QUESTION_MARK, 0.4, easeOutCubic),
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
    // Flash the emoji card border gold
    yield* all(
      emojiCard().stroke(accentColor, 0.3),
      emojiCard().shadowColor('rgba(245, 158, 11, 0.4)', 0.3),
      emojiCard().shadowBlur(40, 0.3),
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
      headerTxt(), dotsRow(), promptTxt(), emojiCard(),
      questionMark(), timerBgCircle(), timerFillCircle(), timerTxt(),
      ...optionRects,
    ];
    yield* all(
      ...allNodes.map(n => n.opacity(0, 0.4)),
      ...optionRects.map((r, i) =>
        r.x(i % 2 === 0 ? -200 : 200, 0.4, easeInCubic),
      ),
      emojiCard().scale(0.9, 0.4),
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
        text="How many did you get right?"
        fontSize={52}
        fontWeight={900}
        fontFamily="'Arial Black', 'Arial', sans-serif"
        fill={C.white}
        opacity={0}
        shadowColor={accentColor}
        shadowBlur={30}
        textWrap
        width={900}
        textAlign="center"
        lineHeight={70}
        y={-80}
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
