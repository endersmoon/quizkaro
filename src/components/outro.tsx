import {Rect, Txt} from '@revideo/2d';
import {
  all,
  createRef,
  waitFor,
  easeOutBack,
  easeOutCubic,
} from '@revideo/core';
import type {View2D} from '@revideo/2d';

export interface OutroConfig {
  title?: string;
  subtitle?: string;
  accentColor: string;
  holdDuration?: number;
}

/**
 * Renders an animated outro screen.
 * Usage: `yield* renderOutro(view, config);`
 */
export function* renderOutro(view: View2D, config: OutroConfig) {
  const {
    title = 'Thanks for Playing!',
    subtitle = 'Like & Subscribe for more!',
    accentColor,
    holdDuration = 3,
  } = config;

  const outroTitle = createRef<Txt>();
  const outroSub = createRef<Txt>();
  const outroLine = createRef<Rect>();

  yield view.add(
    <>
      <Txt
        ref={outroTitle}
        text={title}
        fontSize={56}
        fontWeight={900}
        fontFamily="'Arial Black', 'Arial', sans-serif"
        fill={'#ffffff'}
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
        text={subtitle}
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
  yield* waitFor(holdDuration);
  yield* all(
    outroTitle().opacity(0, 0.5),
    outroSub().opacity(0, 0.5),
    outroLine().width(0, 0.5),
  );
}
