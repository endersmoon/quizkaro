import {Gradient} from '@revideo/2d';

/**
 * Theme definition for quiz videos.
 * Each theme provides colors, gradients, and option accent colors.
 */
export interface QuizTheme {
  name: string;

  // Background
  bgGradientStops: {offset: number; color: string}[];

  // UI colors
  card: string;
  cardBorder: string;
  accent: string;
  accentGlow: string;
  correct: string;
  correctGlow: string;
  wrong: string;
  white: string;
  whiteOff: string;
  muted: string;
  optionBg: string;
  optionBorder: string;
  timerBg: string;

  // Option label colors (A, B, C, D)
  optionColors: [string, string, string, string];
}

/** Create a Gradient from theme background stops */
export function themeBgGradient(theme: QuizTheme): Gradient {
  return new Gradient({
    type: 'linear',
    from: [0, -960],
    to: [0, 960],
    stops: theme.bgGradientStops,
  });
}

// ─── Built-in Themes ───

export const darkPurple: QuizTheme = {
  name: 'dark-purple',
  bgGradientStops: [
    {offset: 0, color: '#0f0c29'},
    {offset: 0.5, color: '#302b63'},
    {offset: 1, color: '#24243e'},
  ],
  card: '#1c1b3a',
  cardBorder: '#3a3870',
  accent: '#e94560',
  accentGlow: '#ff6b8a',
  correct: '#00e676',
  correctGlow: '#69f0ae',
  wrong: '#ff5252',
  white: '#ffffff',
  whiteOff: '#e0e0f0',
  muted: '#8888aa',
  optionBg: '#1e1e3f',
  optionBorder: '#2d2d5e',
  timerBg: '#1a1a3a',
  optionColors: ['#6c5ce7', '#00b894', '#e17055', '#0984e3'],
};

export const neonPink: QuizTheme = {
  name: 'neon-pink',
  bgGradientStops: [
    {offset: 0, color: '#0a0015'},
    {offset: 0.4, color: '#1a0533'},
    {offset: 0.7, color: '#2d1b69'},
    {offset: 1, color: '#1a1040'},
  ],
  card: '#1c1b3a',
  cardBorder: '#3a3870',
  accent: '#ff6b9d',
  accentGlow: '#ff8ab5',
  correct: '#00e676',
  correctGlow: '#69f0ae',
  wrong: '#ff5252',
  white: '#ffffff',
  whiteOff: '#e0e0f0',
  muted: '#8888aa',
  optionBg: '#1e1e3f',
  optionBorder: '#2d2d5e',
  timerBg: '#1a1a3a',
  optionColors: ['#8b5cf6', '#ec4899', '#f97316', '#06b6d4'],
};

export const bollywoodGold: QuizTheme = {
  name: 'bollywood-gold',
  bgGradientStops: [
    {offset: 0, color: '#0a0510'},
    {offset: 0.3, color: '#1a0f2e'},
    {offset: 0.6, color: '#2a1540'},
    {offset: 1, color: '#150d25'},
  ],
  card: '#1a1528',
  cardBorder: '#3d2b5a',
  accent: '#f59e0b',
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
  optionColors: ['#e74c3c', '#2ecc71', '#3498db', '#9b59b6'],
};

export const oceanBlue: QuizTheme = {
  name: 'ocean-blue',
  bgGradientStops: [
    {offset: 0, color: '#020617'},
    {offset: 0.4, color: '#0c1e3a'},
    {offset: 0.7, color: '#1e3a5f'},
    {offset: 1, color: '#0f172a'},
  ],
  card: '#0f1d32',
  cardBorder: '#1e3a5f',
  accent: '#38bdf8',
  accentGlow: '#7dd3fc',
  correct: '#00e676',
  correctGlow: '#69f0ae',
  wrong: '#ff5252',
  white: '#ffffff',
  whiteOff: '#e0e8f0',
  muted: '#64748b',
  optionBg: '#0f1d32',
  optionBorder: '#1e3a5f',
  timerBg: '#0c1629',
  optionColors: ['#f43f5e', '#22c55e', '#a855f7', '#f59e0b'],
};

export const retroArcade: QuizTheme = {
  name: 'retro-arcade',
  bgGradientStops: [
    {offset: 0, color: '#0a0a0a'},
    {offset: 0.5, color: '#1a1a2e'},
    {offset: 1, color: '#16213e'},
  ],
  card: '#16213e',
  cardBorder: '#0f3460',
  accent: '#e94560',
  accentGlow: '#ff6b8a',
  correct: '#53d769',
  correctGlow: '#7ce68a',
  wrong: '#ff453a',
  white: '#ffffff',
  whiteOff: '#d1d5db',
  muted: '#6b7280',
  optionBg: '#1f2937',
  optionBorder: '#374151',
  timerBg: '#111827',
  optionColors: ['#ef4444', '#10b981', '#3b82f6', '#f59e0b'],
};

/** Look up a theme by name, default to darkPurple */
export function getTheme(name: string): QuizTheme {
  const themes: Record<string, QuizTheme> = {
    'dark-purple': darkPurple,
    'neon-pink': neonPink,
    'bollywood-gold': bollywoodGold,
    'ocean-blue': oceanBlue,
    'retro-arcade': retroArcade,
  };
  return themes[name] ?? darkPurple;
}
