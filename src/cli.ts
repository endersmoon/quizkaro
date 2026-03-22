import * as fs from 'fs';
import * as path from 'path';
import {
  renderQuiz,
  TEMPLATE_PROJECTS,
  type BaseQuizData,
} from './core/render.js';

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
  if (!TEMPLATE_PROJECTS[data.template]) {
    console.error(
      `Error: Unknown template "${data.template}". Available: ${Object.keys(TEMPLATE_PROJECTS).join(', ')}`,
    );
    process.exit(1);
  }

  const inputName = path.basename(args.dataFile, '.json');
  const outFile = args.outFile || `${data.template}-${inputName}.mp4`;
  const themeName = args.theme || data.theme || 'dark-purple';

  console.log(`╔══════════════════════════════════════════╗`);
  console.log(`║         QuizKaro Video Renderer          ║`);
  console.log(`╚══════════════════════════════════════════╝`);
  console.log(`  Template:  ${data.template}`);
  console.log(`  Title:     ${data.title}`);
  console.log(`  Questions: ${data.questions.length}`);
  console.log(`  Theme:     ${themeName}`);
  console.log(`  Output:    ${args.outDir}/${outFile}`);
  console.log(`  Workers:   ${args.workers}`);
  console.log('');

  const startTime = Date.now();

  const outputPath = await renderQuiz(data, {
    outFile,
    outDir: args.outDir,
    theme: args.theme,
    workers: args.workers,
    logProgress: true,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log(`\u2705 Render complete in ${elapsed}s`);
  console.log(`\ud83d\udcc1 Output: ${outputPath}`);
}

main().catch(err => {
  console.error('Render failed:', err);
  process.exit(1);
});
