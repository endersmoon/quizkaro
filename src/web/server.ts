import {Hono} from 'hono';
import {serve} from '@hono/node-server';
import {serveStatic} from '@hono/node-server/serve-static';
import {streamSSE} from 'hono/streaming';
import * as fs from 'fs';
import * as path from 'path';
import {
  renderQuiz,
  TEMPLATE_PROJECTS,
  AVAILABLE_TEMPLATES,
  type BaseQuizData,
} from '../core/render.js';

const app = new Hono();

// ─── In-memory render jobs ───

interface RenderJob {
  id: string;
  status: 'queued' | 'rendering' | 'done' | 'error';
  progress: number;
  message: string;
  outputFile?: string;
  error?: string;
  data: BaseQuizData;
  options: {theme?: string; outFile?: string};
  createdAt: number;
}

const jobs = new Map<string, RenderJob>();
let rendering = false;
const queue: string[] = [];

function generateId() {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function processQueue() {
  if (rendering || queue.length === 0) return;
  rendering = true;

  const jobId = queue.shift()!;
  const job = jobs.get(jobId)!;
  job.status = 'rendering';
  job.message = 'Starting render...';

  try {
    const outputPath = await renderQuiz(job.data, {
      outFile: job.options.outFile,
      outDir: './output',
      theme: job.options.theme,
      workers: 2,
      logProgress: true,
      onProgress: (percent, msg) => {
        job.progress = percent;
        job.message = msg;
      },
    });

    job.status = 'done';
    job.progress = 100;
    job.outputFile = path.basename(outputPath);
    job.message = 'Render complete!';
  } catch (err: any) {
    job.status = 'error';
    job.error = err.message || String(err);
    job.message = `Error: ${job.error}`;
  } finally {
    rendering = false;
    processQueue(); // process next in queue
  }
}

// ─── Theme data (without Revideo imports) ───

const THEMES = [
  {
    name: 'dark-purple',
    label: 'Dark Purple',
    accent: '#e94560',
    bgColors: ['#0f0c29', '#302b63', '#24243e'],
  },
  {
    name: 'neon-pink',
    label: 'Neon Pink',
    accent: '#ff6b9d',
    bgColors: ['#0a0015', '#1a0533', '#2d1b69'],
  },
  {
    name: 'bollywood-gold',
    label: 'Bollywood Gold',
    accent: '#f59e0b',
    bgColors: ['#0a0510', '#1a0f2e', '#2a1540'],
  },
  {
    name: 'ocean-blue',
    label: 'Ocean Blue',
    accent: '#38bdf8',
    bgColors: ['#020617', '#0c1e3a', '#1e3a5f'],
  },
  {
    name: 'retro-arcade',
    label: 'Retro Arcade',
    accent: '#e94560',
    bgColors: ['#0a0a0a', '#1a1a2e', '#16213e'],
  },
];

const TEMPLATE_META = [
  {
    id: 'mcq',
    label: 'Multiple Choice Quiz',
    icon: '\ud83e\udde0',
    description: 'Classic MCQ with 4 options, timer, and answer reveal',
    questionFields: [
      {key: 'text', label: 'Question', type: 'text', required: true},
      {
        key: 'options',
        label: 'Options',
        type: 'string-array',
        count: 4,
        required: true,
      },
      {
        key: 'correctIndex',
        label: 'Correct Answer',
        type: 'option-index',
        required: true,
      },
    ],
    quizFields: [],
  },
  {
    id: 'guess-song',
    label: 'Guess the Song',
    icon: '\ud83c\udfa5',
    description: 'Waveform animation with song options',
    questionFields: [
      {
        key: 'options',
        label: 'Song Options',
        type: 'string-array',
        count: 4,
        required: true,
        placeholder: 'Artist - Song Title',
      },
      {
        key: 'correctIndex',
        label: 'Correct Answer',
        type: 'option-index',
        required: true,
      },
    ],
    quizFields: [],
  },
  {
    id: 'guess-movie-emoji',
    label: 'Guess Movie by Emoji',
    icon: '\ud83c\udfac',
    description: 'Show emoji clues, guess the movie',
    questionFields: [
      {
        key: 'emojis',
        label: 'Emoji Clues',
        type: 'text',
        required: true,
        placeholder: '\ud83e\udd81\ud83d\udc51\ud83c\udf0d',
      },
      {
        key: 'options',
        label: 'Movie Options',
        type: 'string-array',
        count: 4,
        required: true,
      },
      {
        key: 'correctIndex',
        label: 'Correct Answer',
        type: 'option-index',
        required: true,
      },
    ],
    quizFields: [],
  },
  {
    id: 'guess-the-clip',
    label: 'Guess the Clip',
    icon: '\ud83c\udfac',
    description: 'Simulated clip playback with Q&A',
    questionFields: [
      {
        key: 'options',
        label: 'Options',
        type: 'string-array',
        count: 4,
        required: true,
      },
      {
        key: 'correctIndex',
        label: 'Correct Answer',
        type: 'option-index',
        required: true,
      },
      {
        key: 'clipLabel',
        label: 'Hint Text',
        type: 'text',
        required: false,
        placeholder: 'Hint: A college comedy',
      },
    ],
    quizFields: [
      {key: 'icon', label: 'Icon', type: 'text', default: '\ud83c\udfac'},
      {key: 'itemLabel', label: 'Item Label', type: 'text', default: 'CLIP'},
      {
        key: 'promptText',
        label: 'Prompt Text',
        type: 'text',
        default: 'What is this?',
      },
      {
        key: 'watchText',
        label: 'Watch Text',
        type: 'text',
        default: '\ud83d\udc40  Watch carefully...',
      },
      {
        key: 'clipDuration',
        label: 'Clip Duration (seconds)',
        type: 'number',
        default: 15,
      },
    ],
  },
];

// ─── API Routes ───

// Templates metadata
app.get('/api/templates', c => c.json(TEMPLATE_META));

// Themes
app.get('/api/themes', c => c.json(THEMES));

// List saved data files
app.get('/api/data', c => {
  const dataDir = path.resolve('./data');
  const files: {path: string; template: string; title: string}[] = [];

  if (fs.existsSync(dataDir)) {
    for (const dir of fs.readdirSync(dataDir)) {
      const subDir = path.join(dataDir, dir);
      if (!fs.statSync(subDir).isDirectory()) continue;
      for (const file of fs.readdirSync(subDir)) {
        if (!file.endsWith('.json')) continue;
        try {
          const data = JSON.parse(
            fs.readFileSync(path.join(subDir, file), 'utf-8'),
          );
          files.push({
            path: `data/${dir}/${file}`,
            template: data.template || dir,
            title: data.title || file,
          });
        } catch {
          // skip invalid JSON
        }
      }
    }
  }

  return c.json(files);
});

// Load a specific data file
app.get('/api/data/load', c => {
  const filePath = c.req.query('path');
  if (!filePath) return c.json({error: 'Missing path'}, 400);

  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) return c.json({error: 'File not found'}, 404);

  try {
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    return c.json(data);
  } catch {
    return c.json({error: 'Invalid JSON'}, 400);
  }
});

// Save quiz data
app.post('/api/data/save', async c => {
  const body = await c.req.json();
  const {filename, data} = body;

  if (!filename || !data || !data.template) {
    return c.json({error: 'Missing filename or data'}, 400);
  }

  const template = data.template;
  const dir = path.resolve(`./data/${template}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});

  const filePath = path.join(dir, filename.endsWith('.json') ? filename : `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return c.json({path: `data/${template}/${path.basename(filePath)}`});
});

// Start a render
app.post('/api/render', async c => {
  const body = await c.req.json();
  const {data, theme, outFile} = body;

  if (!data || !data.template || !data.questions?.length) {
    return c.json({error: 'Invalid quiz data'}, 400);
  }

  if (!TEMPLATE_PROJECTS[data.template]) {
    return c.json(
      {error: `Unknown template: ${data.template}. Available: ${AVAILABLE_TEMPLATES.join(', ')}`},
      400,
    );
  }

  const id = generateId();
  const job: RenderJob = {
    id,
    status: 'queued',
    progress: 0,
    message: 'Queued for rendering...',
    data,
    options: {theme, outFile},
    createdAt: Date.now(),
  };

  jobs.set(id, job);
  queue.push(id);
  processQueue();

  return c.json({id, status: job.status});
});

// Render status (poll)
app.get('/api/render/:id/status', c => {
  const job = jobs.get(c.req.param('id'));
  if (!job) return c.json({error: 'Job not found'}, 404);

  return c.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    outputFile: job.outputFile,
    error: job.error,
  });
});

// Render progress (SSE)
app.get('/api/render/:id/progress', c => {
  const job = jobs.get(c.req.param('id'));
  if (!job) return c.json({error: 'Job not found'}, 404);

  return streamSSE(c, async stream => {
    let lastProgress = -1;

    while (true) {
      if (job.progress !== lastProgress || job.status === 'done' || job.status === 'error') {
        lastProgress = job.progress;
        await stream.writeSSE({
          data: JSON.stringify({
            status: job.status,
            progress: job.progress,
            message: job.message,
            outputFile: job.outputFile,
            error: job.error,
          }),
        });

        if (job.status === 'done' || job.status === 'error') {
          break;
        }
      }
      await new Promise(r => setTimeout(r, 500));
    }
  });
});

// List rendered videos
app.get('/api/videos', c => {
  const outDir = path.resolve('./output');
  if (!fs.existsSync(outDir)) return c.json([]);

  const videos = fs
    .readdirSync(outDir)
    .filter(f => f.endsWith('.mp4'))
    .map(f => {
      const stat = fs.statSync(path.join(outDir, f));
      return {
        name: f,
        size: stat.size,
        created: stat.mtime.toISOString(),
        url: `/output/${f}`,
      };
    })
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  return c.json(videos);
});

// ─── Static files ───

// Serve rendered videos
app.use('/output/*', serveStatic({root: './'}));

// Serve frontend
app.use('/*', serveStatic({root: './src/web/public'}));

// ─── Start server ───

const port = parseInt(process.env.PORT || '3000', 10);

console.log('');
console.log(`\u2728 QuizKaro Web Interface`);
console.log(`   http://localhost:${port}`);
console.log('');

serve({fetch: app.fetch, port});
