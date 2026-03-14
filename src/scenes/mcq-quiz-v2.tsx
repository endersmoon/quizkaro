import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  all,
  createRef,
  waitFor,
  useScene,
  easeOutBack,
  easeOutCubic,
} from '@revideo/core';
import {
  renderIntro,
  renderOutro,
  createProgressDots,
  animateDotsIn,
  createOptionCards,
  animateOptionsIn,
  createTimer,
  animateTimerIn,
  runCountdown,
  revealAnswer,
  fadeOutQuestion,
} from '../components';
import {getTheme, themeBgGradient} from '../themes';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

export default makeScene2D('mcq-quiz-v2', function* (view) {
  const vars = useScene().variables;
  const title = vars.get('title', 'Quiz Time!')() as string;
  const questionsJson = vars.get('questions', '[]')() as string;
  const thinkTime = Number(vars.get('thinkTime', '10')());
  const themeName = vars.get('theme', 'dark-purple')() as string;
  const accentOverride = vars.get('accentColor', '')() as string;

  const theme = getTheme(themeName);
  const accentColor = accentOverride || theme.accent;
  const questions: Question[] = JSON.parse(questionsJson);

  // Background
  view.fill(themeBgGradient(theme));

  // ─── INTRO ───
  yield* renderIntro(view, {
    title,
    countLabel: `${questions.length} QUESTIONS`,
    accentColor,
  });

  // ─── QUESTIONS ───
  const Y_HEADER = -750;
  const Y_DOTS = -700;
  const Y_QUESTION = -500;
  const Y_FIRST_OPTION = -180;
  const OPTION_GAP = 150;
  const Y_TIMER = 520;

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];

    // Create elements using shared components
    const headerTxt = createRef<Txt>();
    const questionCard = createRef<Rect>();

    const dots = createProgressDots({
      total: questions.length,
      current: qi,
      y: Y_DOTS,
      theme,
      accentColor,
    });

    const options = createOptionCards({
      options: q.options,
      yStart: Y_FIRST_OPTION,
      gap: OPTION_GAP,
      theme,
    });

    const timer = createTimer({
      thinkTime,
      y: Y_TIMER,
      accentColor,
      theme,
    });

    yield view.add(
      <>
        <Txt
          ref={headerTxt}
          text={`QUESTION ${qi + 1}`}
          fontSize={22}
          fontWeight={700}
          fontFamily="'Arial', sans-serif"
          fill={theme.muted}
          letterSpacing={6}
          y={Y_HEADER}
          opacity={0}
        />
        {dots.jsx}
        <Rect
          ref={questionCard}
          width={950}
          radius={24}
          fill={theme.card}
          stroke={theme.cardBorder}
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
            fill={theme.white}
            textWrap
            width={860}
            textAlign="center"
            lineHeight={58}
          />
        </Rect>
        {options.jsx}
        {timer.jsx}
      </>,
    );

    // Animate in
    yield* all(headerTxt().opacity(1, 0.3));
    yield* animateDotsIn(dots.refs);

    yield* all(
      questionCard().opacity(1, 0.5, easeOutCubic),
      questionCard().y(Y_QUESTION, 0).to(Y_QUESTION + 20, 0.5, easeOutBack),
    );

    yield* animateOptionsIn(options.refs, q.options.length);
    yield* animateTimerIn(timer.refs);

    // Countdown
    yield* runCountdown(timer.refs, thinkTime);

    // Reveal
    yield* revealAnswer(q.correctIndex, q.options.length, options.refs, theme);
    yield* waitFor(2.5);

    // Fade out
    yield* fadeOutQuestion(
      [
        headerTxt(),
        dots.refs.dotsRow(),
        questionCard(),
        timer.refs.timerBgCircle(),
        timer.refs.timerFillCircle(),
        timer.refs.timerTxt(),
        ...options.refs.optionRects,
      ],
      options.refs,
      q.options.length,
    );
  }

  // ─── OUTRO ───
  yield* renderOutro(view, {accentColor});
});
