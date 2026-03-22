import {Rect, Txt} from '@reelgen/2d';
import {
  all,
  createRef,
  waitFor,
  easeOutBack,
  easeOutCubic,
} from '@reelgen/core';
import type {View2D} from '@reelgen/2d';
import type {QuizTheme} from '../themes';

export interface IntroConfig {
  title: string;
  countLabel: string; // e.g. "5 QUESTIONS", "3 SONGS"
  icon?: string; // emoji icon, e.g. "🎬"
  subtitle?: string; // optional subtitle
  accentColor: string;
  holdDuration?: number; // how long to display (default 2.5)
}

/**
 * Renders an animated intro screen with title, optional icon, line, and count badge.
 * Usage: `yield* renderIntro(view, config);`
 */
export function* renderIntro(view: View2D, config: IntroConfig) {
  const {
    title,
    countLabel,
    icon,
    subtitle,
    accentColor,
    holdDuration = 2.5,
  } = config;

  const introIcon = icon ? createRef<Txt>() : null;
  const introTitle = createRef<Txt>();
  const introLine = createRef<Rect>();
  const introSubtitle = subtitle ? createRef<Txt>() : null;
  const introAccent = createRef<Rect>();

  // Calculate Y positions based on what elements are present
  const hasIcon = !!icon;
  const hasSub = !!subtitle;
  const iconY = -220;
  const titleY = hasIcon ? -60 : -80;
  const lineY = hasIcon ? 80 : 40;
  const subY = lineY + 60;
  const badgeY = hasSub ? subY + 80 : lineY + 80;

  yield view.add(
    <>
      {introIcon && (
        <Txt
          ref={introIcon}
          text={icon!}
          fontSize={130}
          opacity={0}
          y={iconY}
        />
      )}
      <Txt
        ref={introTitle}
        text={title}
        fontSize={80}
        fontWeight={900}
        fontFamily="'Arial Black', 'Arial', sans-serif"
        fill={'#ffffff'}
        opacity={0}
        letterSpacing={3}
        shadowColor={accentColor}
        shadowBlur={30}
        textWrap
        width={900}
        textAlign="center"
        lineHeight={100}
        y={titleY}
      />
      <Rect
        ref={introLine}
        width={0}
        height={5}
        radius={3}
        fill={accentColor}
        shadowColor={accentColor}
        shadowBlur={25}
        y={lineY}
      />
      {introSubtitle && (
        <Txt
          ref={introSubtitle}
          text={subtitle!}
          fontSize={30}
          fontWeight={700}
          fontFamily="'Arial', sans-serif"
          fill={accentColor}
          opacity={0}
          letterSpacing={2}
          y={subY}
        />
      )}
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
        y={badgeY}
      >
        <Txt
          text={countLabel}
          fontSize={26}
          fontWeight={800}
          fontFamily="'Arial', sans-serif"
          fill={'#ffffff'}
          letterSpacing={6}
        />
      </Rect>
    </>,
  );

  // Animate in
  if (introIcon) {
    yield* all(
      introIcon().opacity(1, 0.4),
      introIcon().scale([0.5, 0.5], 0).to([1, 1], 0.7, easeOutBack),
    );
  }
  yield* all(
    introTitle().opacity(1, 0.5),
    introTitle().scale([0.9, 0.9], 0).to([1, 1], 0.6, easeOutBack),
  );
  yield* introLine().width(400, 0.5, easeOutCubic);
  const badgeAnims = [
    introAccent().opacity(1, 0.4),
    introAccent().scale(1, 0.5, easeOutBack),
  ];
  if (introSubtitle) {
    badgeAnims.push(introSubtitle().opacity(1, 0.4));
  }
  yield* all(...badgeAnims);

  yield* waitFor(holdDuration);

  // Fade out
  const fadeOuts = [
    introTitle().opacity(0, 0.5),
    introLine().opacity(0, 0.5),
    introAccent().opacity(0, 0.5),
  ];
  if (introIcon) fadeOuts.push(introIcon().opacity(0, 0.5));
  if (introSubtitle) fadeOuts.push(introSubtitle().opacity(0, 0.5));
  yield* all(...fadeOuts);

  // Cleanup
  introTitle().remove();
  introLine().remove();
  introAccent().remove();
  if (introIcon) introIcon().remove();
  if (introSubtitle) introSubtitle().remove();
}
