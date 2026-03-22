import {Rect, Txt, Circle, Layout, makeScene2D} from '@reelgen/2d';
import {Gradient} from '@reelgen/2d';
import {
  all,
  createRef,
  createRefArray,
  waitFor,
  useScene,
  easeOutBack,
  easeOutCubic,
  easeInCubic,
  linear,
} from '@reelgen/core';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

// Canvas: 1080 x 1920 (portrait). Origin at center.
// X: -540 to +540, Y: -960 to +960

const C = {
  card: '#1c1b3a',
  cardBorder: '#3a3870',
  accent: '#e94560',
  correct: '#00e676',
  correctGlow: '#69f0ae',
  wrong: '#ff5252',
  white: '#ffffff',
  whiteOff: '#e0e0f0',
  muted: '#8888aa',
  optionBg: '#1e1e3f',
  optionBorder: '#2d2d5e',
  timerBg: '#1a1a3a',
};

const OPTION_COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3'];

export default makeScene2D('mcq-quiz', function* (view) {
  const vars = useScene().variables;
  const title = vars.get('title', 'Quiz Time!')() as string;
  const questionsJson = vars.get('questions', '[]')() as string;
  const thinkTime = Number(vars.get('thinkTime', '10')());
  const accentColor = vars.get('accentColor', C.accent)() as string;

  const questions: Question[] = JSON.parse(questionsJson);

  // Background gradient
  view.fill(
    new Gradient({
      type: 'linear',
      from: [0, -960],
      to: [0, 960],
      stops: [
        {offset: 0, color: '#0f0c29'},
        {offset: 0.5, color: '#302b63'},
        {offset: 1, color: '#24243e'},
      ],
    }),
  );

  // ─── INTRO SCREEN ───
  // Using absolute positioning to avoid layout flow issues with scale animations
  const introTitle = createRef<Txt>();
  const introAccent = createRef<Rect>();
  const introLine = createRef<Rect>();

  yield view.add(
    <>
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
        y={-80}
      />
      <Rect
        ref={introLine}
        width={0}
        height={5}
        radius={3}
        fill={accentColor}
        shadowColor={accentColor}
        shadowBlur={25}
        y={40}
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
        y={120}
      >
        <Txt
          text={`${questions.length} QUESTIONS`}
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
    introTitle().opacity(1, 0.5),
    introTitle().scale([0.9, 0.9], 0).to([1, 1], 0.6, easeOutBack),
  );
  yield* introLine().width(400, 0.5, easeOutCubic);
  yield* all(
    introAccent().opacity(1, 0.4),
    introAccent().scale(1, 0.5, easeOutBack),
  );
  yield* waitFor(2.5);
  yield* all(
    introTitle().opacity(0, 0.5),
    introLine().opacity(0, 0.5),
    introAccent().opacity(0, 0.5),
  );
  introTitle().remove();
  introLine().remove();
  introAccent().remove();

  // ─── QUESTIONS ───
  // Positions for 1080x1920 portrait canvas
  const Y_HEADER = -750;
  const Y_DOTS = -700;
  const Y_QUESTION = -500;
  const Y_FIRST_OPTION_DEFAULT = -180;
  const OPTION_GAP = 150;
  const Y_TIMER_DEFAULT = 520;
  const OPTION_TOP_MARGIN = 40;

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const labels = ['A', 'B', 'C', 'D'];

    // Refs
    const headerTxt = createRef<Txt>();
    const dotsRow = createRef<Layout>();
    const progressDots = createRefArray<Circle>();
    const questionCard = createRef<Rect>();
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
          text={`QUESTION ${qi + 1}`}
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

        {/* Question card */}
        <Rect
          ref={questionCard}
          width={950}
          radius={24}
          fill={C.card}
          stroke={C.cardBorder}
          lineWidth={2}
          y={Y_QUESTION}
          opacity={0}
          paddingTop={40}
          paddingBottom={40}
          paddingLeft={40}
          paddingRight={40}
          shadowColor={'rgba(0,0,0,0.4)'}
          shadowBlur={40}
          shadowOffset={[0, 10]}
        >
          <Txt
            text={q.text}
            fontSize={42}
            fontWeight={700}
            fontFamily="'Arial', sans-serif"
            fill={C.white}
            textWrap
            width={860}
            textAlign="center"
            lineHeight={58}
          />
        </Rect>

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
            {/* Label badge — positioned left */}
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
            {/* Option text — centered */}
            <Txt
              text={opt}
              fontSize={32}
              fontWeight={600}
              fontFamily="'Arial', sans-serif"
              fill={C.whiteOff}
              x={30}
            />
          </Rect>
        ))}

        {/* Timer circle background */}
        <Circle
          ref={timerBgCircle}
          size={100}
          stroke={C.timerBg}
          lineWidth={8}
          y={Y_TIMER_DEFAULT}
          opacity={0}
        />
        {/* Timer circle fill */}
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
        {/* Timer number */}
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

    // Wait one frame for Revideo to compute layout before reading card height
    yield;

    // Dynamically position options based on question card height
    const cardHeight = questionCard().height();
    const cardBottom = Y_QUESTION + Math.max(cardHeight, 120) / 2;
    const actualYStart = Math.max(cardBottom + OPTION_TOP_MARGIN, Y_FIRST_OPTION_DEFAULT);
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

    yield* all(
      questionCard().opacity(1, 0.5, easeOutCubic),
      questionCard().y(Y_QUESTION, 0).to(Y_QUESTION + 20, 0.5, easeOutBack),
    );

    for (let i = 0; i < q.options.length; i++) {
      yield* all(
        optionRects[i].opacity(1, 0.3),
        optionRects[i].x(0, 0.5, easeOutCubic),
      );
    }

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
      headerTxt(), dotsRow(), questionCard(),
      timerBgCircle(), timerFillCircle(), timerTxt(),
      ...optionRects,
    ];
    yield* all(
      ...allNodes.map(n => n.opacity(0, 0.4)),
      ...optionRects.map((r, i) =>
        r.x(i % 2 === 0 ? -200 : 200, 0.4, easeInCubic),
      ),
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
        text="Thanks for Playing!"
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
