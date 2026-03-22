import {renderVideo} from '@reelgen/renderer';
import * as path from 'path';

// ─── Types ───

export interface BaseQuizData {
  template: 'mcq' | 'guess-song' | 'guess-movie-emoji' | 'guess-the-clip';
  title: string;
  subtitle?: string;
  theme?: string;
  thinkTime?: number;
  accentColor?: string;
  questions: any[];
  // guess-the-clip specific
  icon?: string;
  itemLabel?: string;
  promptText?: string;
  watchText?: string;
  clipDuration?: number;
}

export interface RenderOptions {
  outFile?: string;
  outDir?: string;
  theme?: string;
  workers?: number;
  logProgress?: boolean;
  onProgress?: (percent: number, message: string) => void;
}

// ─── Template → Project file mapping ───

export const TEMPLATE_PROJECTS: Record<string, string> = {
  mcq: './src/project-templates/mcq.ts',
  'guess-song': './src/project-templates/guess-song.ts',
  'guess-movie-emoji': './src/project-templates/guess-movie-emoji.ts',
  'guess-the-clip': './src/project-templates/guess-the-clip.ts',
};

export const AVAILABLE_TEMPLATES = Object.keys(TEMPLATE_PROJECTS);

/**
 * Build Revideo scene variables from quiz data.
 */
export function buildVariables(
  data: BaseQuizData,
  themeName: string,
): Record<string, string> {
  const variables: Record<string, string> = {
    title: data.title,
    questions: JSON.stringify(data.questions),
    thinkTime: String(data.thinkTime ?? 10),
    theme: themeName,
  };
  if (data.subtitle) variables.subtitle = data.subtitle;
  if (data.accentColor) variables.accentColor = data.accentColor;
  if (data.icon) variables.icon = data.icon;
  if (data.itemLabel) variables.itemLabel = data.itemLabel;
  if (data.promptText) variables.promptText = data.promptText;
  if (data.watchText) variables.watchText = data.watchText;
  if (data.clipDuration) variables.clipDuration = String(data.clipDuration);
  return variables;
}

/**
 * Render a quiz video from data. Used by both CLI and web server.
 */
export async function renderQuiz(
  data: BaseQuizData,
  options: RenderOptions = {},
): Promise<string> {
  const template = data.template;
  const projectFile = TEMPLATE_PROJECTS[template];

  if (!projectFile) {
    throw new Error(
      `Unknown template "${template}". Available: ${AVAILABLE_TEMPLATES.join(', ')}`,
    );
  }

  const themeName = options.theme || data.theme || 'dark-purple';
  const outFile =
    options.outFile || `${template}-${Date.now()}.mp4`;
  const outDir = options.outDir || './output';
  const workers = options.workers ?? 2;

  const variables = buildVariables(data, themeName);

  // Intercept console.log to capture progress if callback provided
  const originalLog = console.log;
  if (options.onProgress) {
    const onProgress = options.onProgress;
    console.log = (...args: any[]) => {
      const msg = args.map(String).join(' ');
      // Revideo logs progress like: "Rendering: 45/120 frames (37%)"
      const match = msg.match(/(\d+)%/);
      if (match) {
        onProgress(parseInt(match[1], 10), msg);
      }
      if (options.logProgress) {
        originalLog(...args);
      }
    };
  }

  try {
    const outputPath = await renderVideo({
      projectFile,
      variables,
      settings: {
        outFile,
        outDir,
        workers,
        logProgress: options.logProgress ?? true,
      },
    });
    return outputPath as string;
  } finally {
    if (options.onProgress) {
      console.log = originalLog;
    }
  }
}
