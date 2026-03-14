import {renderVideo} from '@revideo/renderer';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───

interface BaseQuizData {
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

// ─── Template → Project file mapping ───

const TEMPLATE_PROJECTS: Record<string, string> = {
  mcq: './src/project-templates/mcq.ts',
  'guess-song': './src/project-templates/guess-song.ts',
  'guess-movie-emoji': './src/project-templates/guess-movie-emoji.ts',
  'guess-the-clip': './src/project-templates/guess-the-clip.ts',
};

// ─── CLI ───

function usage() {
  console.log(`
QuizKaro CLI — Render quiz videos from JSON data files

Usage:
  npx tsx src/cli.ts <data-file> [options]

Arguments:
  <data-file>    Path to a JSON quiz data file (e.g. data/mcq/science.json)

Options:
  --out <name>   Output filename (default: auto-generated from input filename)
  --outdir <dir> Output directory (default: ./output)
  --theme <name> Override theme (dark-purple, neon-pink, bollywood-gold, ocean-blue, retro-arcade)
  --workers <n>  Number of render workers (default: 2)

Examples:
  npx tsx src/cli.ts data/mcq/general-knowledge.json
  npx tsx src/cli.ts data/guess-movie-emoji/bollywood.json --theme ocean-blue
  npx tsx src/cli.ts data/guess-song/pop-hits.json --out my-song-quiz.mp4
`);
}

function parseArgs(args: string[]) {
  const result: {
    dataFile: string;
    outFile?: string;
    outDir: string;
    theme?: string;
    workers: number;
  } = {
    dataFile: '',
    outDir: './output',
    workers: 2,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--out' && args[i + 1]) {
      result.outFile = args[++i];
    } else if (arg === '--outdir' && args[i + 1]) {
      result.outDir = args[++i];
    } else if (arg === '--theme' && args[i + 1]) {
      result.theme = args[++i];
    } else if (arg === '--workers' && args[i + 1]) {
      result.workers = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      result.dataFile = arg;
    }
    i++;
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.dataFile) {
    usage();
    process.exit(1);
  }

  // Read and parse the data file
  const dataPath = path.resolve(args.dataFile);
  if (!fs.existsSync(dataPath)) {
    console.error(`Error: File not found: ${dataPath}`);
    process.exit(1);
  }

  const data: BaseQuizData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Validate template
  const template = data.template;
  if (!TEMPLATE_PROJECTS[template]) {
    console.error(
      `Error: Unknown template "${template}". Available: ${Object.keys(TEMPLATE_PROJECTS).join(', ')}`,
    );
    process.exit(1);
  }

  // Determine output filename
  const inputName = path.basename(args.dataFile, '.json');
  const outFile = args.outFile || `${template}-${inputName}.mp4`;
  const themeName = args.theme || data.theme || 'dark-purple';

  console.log(`╔══════════════════════════════════════════╗`);
  console.log(`║         QuizKaro Video Renderer          ║`);
  console.log(`╚══════════════════════════════════════════╝`);
  console.log(`  Template:  ${template}`);
  console.log(`  Title:     ${data.title}`);
  console.log(`  Questions: ${data.questions.length}`);
  console.log(`  Theme:     ${themeName}`);
  console.log(`  Output:    ${args.outDir}/${outFile}`);
  console.log(`  Workers:   ${args.workers}`);
  console.log('');

  const startTime = Date.now();

  // Build variables from data
  const variables: Record<string, string> = {
    title: data.title,
    questions: JSON.stringify(data.questions),
    thinkTime: String(data.thinkTime ?? 10),
    theme: themeName,
  };
  if (data.subtitle) variables.subtitle = data.subtitle;
  if (data.accentColor) variables.accentColor = data.accentColor;
  // guess-the-clip specific variables
  if (data.icon) variables.icon = data.icon;
  if (data.itemLabel) variables.itemLabel = data.itemLabel;
  if (data.promptText) variables.promptText = data.promptText;
  if (data.watchText) variables.watchText = data.watchText;
  if (data.clipDuration) variables.clipDuration = String(data.clipDuration);

  const projectFile = TEMPLATE_PROJECTS[template];

  const outputPath = await renderVideo({
    projectFile,
    variables,
    settings: {
      outFile,
      outDir: args.outDir,
      workers: args.workers,
      logProgress: true,
    },
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log(`✅ Render complete in ${elapsed}s`);
  console.log(`📁 Output: ${outputPath}`);
}

main().catch(err => {
  console.error('Render failed:', err);
  process.exit(1);
});
