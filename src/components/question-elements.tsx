import {Rect, Txt, Circle, Layout} from '@reelgen/2d';
import {Gradient} from '@reelgen/2d';
import {
  all,
  createRef,
  createRefArray,
  waitFor,
  easeOutBack,
  easeOutCubic,
  easeInCubic,
  linear,
} from '@reelgen/core';
import type {View2D} from '@reelgen/2d';
import type {QuizTheme} from '../themes';

// ─── PROGRESS DOTS ───

export interface ProgressDotsConfig {
  total: number;
  current: number; // 0-indexed
  y: number;
  theme: QuizTheme;
  accentColor: string;
}

export interface ProgressDotsRefs {
  dotsRow: ReturnType<typeof createRef<Layout>>;
  progressDots: ReturnType<typeof createRefArray<Circle>>;
}

export function createProgressDots(
  config: ProgressDotsConfig,
): {jsx: any; refs: ProgressDotsRefs} {
  const dotsRow = createRef<Layout>();
  const progressDots = createRefArray<Circle>();
  const {total, current, y, theme, accentColor} = config;

  const jsx = (
    <Layout ref={dotsRow} direction="row" gap={14} y={y}>
      {...Array.from({length: total}, (_, i) => (
        <Circle
          ref={progressDots}
          size={i === current ? 16 : 10}
          fill={
            i < current
              ? theme.correct
              : i === current
                ? accentColor
                : theme.optionBorder
          }
          opacity={0}
          shadowColor={i === current ? accentColor : 'rgba(0,0,0,0)'}
          shadowBlur={i === current ? 12 : 0}
        />
      ))}
    </Layout>
  );

  return {jsx, refs: {dotsRow, progressDots}};
}

export function* animateDotsIn(refs: ProgressDotsRefs) {
  yield* all(...refs.progressDots.map(dot => dot.opacity(1, 0.3)));
}

// ─── OPTION CARDS ───

export interface OptionCardsConfig {
  options: string[];
  yStart: number;
  gap: number;
  theme: QuizTheme;
  fontSize?: number;
  wrapText?: boolean;
}

export interface OptionCardsRefs {
  optionRects: ReturnType<typeof createRefArray<Rect>>;
  optionLabels: ReturnType<typeof createRefArray<Rect>>;
}

export function createOptionCards(
  config: OptionCardsConfig,
): {jsx: any; refs: OptionCardsRefs} {
  const optionRects = createRefArray<Rect>();
  const optionLabels = createRefArray<Rect>();
  const labels = ['A', 'B', 'C', 'D'];
  const {options, yStart, gap, theme, fontSize = 32, wrapText = false} = config;

  const jsx = (
    <>
      {...options.map((opt, i) => (
        <Rect
          ref={optionRects}
          width={950}
          height={110}
          radius={20}
          fill={theme.optionBg}
          stroke={theme.optionBorder}
          lineWidth={2}
          y={yStart + i * gap}
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
            fill={theme.optionColors[i % theme.optionColors.length]}
            x={-400}
          >
            <Txt
              text={labels[i]}
              fontSize={28}
              fontWeight={800}
              fontFamily="'Arial', sans-serif"
              fill={theme.white}
            />
          </Rect>
          <Txt
            text={opt}
            fontSize={fontSize}
            fontWeight={600}
            fontFamily="'Arial', sans-serif"
            fill={theme.whiteOff}
            x={30}
            textWrap={wrapText || undefined}
            width={wrapText ? 700 : undefined}
            textAlign={wrapText ? 'center' : undefined}
          />
        </Rect>
      ))}
    </>
  );

  return {jsx, refs: {optionRects, optionLabels}};
}

export function* animateOptionsIn(refs: OptionCardsRefs, count: number) {
  for (let i = 0; i < count; i++) {
    yield* all(
      refs.optionRects[i].opacity(1, 0.25),
      refs.optionRects[i].x(0, 0.4, easeOutCubic),
    );
  }
}

// ─── TIMER ───

export interface TimerConfig {
  thinkTime: number;
  y: number;
  accentColor: string;
  theme: QuizTheme;
}

export interface TimerRefs {
  timerBgCircle: ReturnType<typeof createRef<Circle>>;
  timerFillCircle: ReturnType<typeof createRef<Circle>>;
  timerTxt: ReturnType<typeof createRef<Txt>>;
}

export function createTimer(
  config: TimerConfig,
): {jsx: any; refs: TimerRefs} {
  const timerBgCircle = createRef<Circle>();
  const timerFillCircle = createRef<Circle>();
  const timerTxt = createRef<Txt>();
  const {thinkTime, y, accentColor, theme} = config;

  const jsx = (
    <>
      <Circle
        ref={timerBgCircle}
        size={100}
        stroke={theme.timerBg}
        lineWidth={8}
        y={y}
        opacity={0}
      />
      <Circle
        ref={timerFillCircle}
        size={100}
        stroke={accentColor}
        lineWidth={8}
        y={y}
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
        fill={theme.white}
        y={y}
        opacity={0}
      />
    </>
  );

  return {jsx, refs: {timerBgCircle, timerFillCircle, timerTxt}};
}

export function* animateTimerIn(refs: TimerRefs) {
  yield* all(
    refs.timerBgCircle().opacity(1, 0.3),
    refs.timerFillCircle().opacity(1, 0.3),
    refs.timerTxt().opacity(1, 0.3),
  );
}

export function* runCountdown(refs: TimerRefs, duration: number) {
  yield* refs.timerFillCircle().endAngle(-90, duration, linear);
}

// ─── ANSWER REVEAL ───

export function* revealAnswer(
  correctIndex: number,
  optionCount: number,
  optionRefs: OptionCardsRefs,
  theme: QuizTheme,
) {
  // Highlight correct
  yield* all(
    optionRefs.optionRects[correctIndex].fill(theme.correct, 0.3),
    optionRefs.optionRects[correctIndex].stroke(theme.correctGlow, 0.3),
    optionRefs.optionRects[correctIndex].shadowColor(theme.correctGlow, 0.3),
    optionRefs.optionRects[correctIndex].shadowBlur(30, 0.3),
    optionRefs.optionRects[correctIndex].scale(1.03, 0.3, easeOutBack),
    optionRefs.optionLabels[correctIndex].fill(theme.correct, 0.3),
  );

  // Dim wrong answers
  yield* all(
    ...Array.from({length: optionCount}, (_, i) => i)
      .filter(i => i !== correctIndex)
      .flatMap(i => [
        optionRefs.optionRects[i].opacity(0.35, 0.4),
        optionRefs.optionRects[i].fill('#1a0a0f', 0.4),
        optionRefs.optionRects[i].stroke(theme.wrong, 0.3),
      ]),
  );
}

// ─── FADE OUT & CLEANUP ───

export function* fadeOutQuestion(
  nodes: any[], // all node refs to fade
  optionRefs: OptionCardsRefs,
  optionCount: number,
) {
  yield* all(
    ...nodes.map(n => n.opacity(0, 0.4)),
    ...Array.from({length: optionCount}, (_, i) =>
      optionRefs.optionRects[i].x(
        i % 2 === 0 ? -200 : 200,
        0.4,
        easeInCubic,
      ),
    ),
  );
  nodes.forEach(n => n.remove());
  yield* waitFor(0.2);
}
