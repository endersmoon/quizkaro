import {renderVideo} from '@revideo/renderer';

const sampleQuestions = [
  {
    text: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctIndex: 2,
  },
  {
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctIndex: 1,
  },
  {
    text: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctIndex: 3,
  },
];

async function main() {
  console.log('Starting quiz video render...');
  const startTime = Date.now();

  const outputPath = await renderVideo({
    projectFile: './src/project.ts',
    variables: {
      title: 'General Knowledge Quiz',
      questions: JSON.stringify(sampleQuestions),
      thinkTime: '10',
      bgColor: '#1a1a2e',
      accentColor: '#e94560',
    },
    settings: {
      outFile: 'quiz-video.mp4',
      outDir: './output',
      workers: 2,
      logProgress: true,
    },
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Render complete in ${elapsed}s`);
  console.log(`Output: ${outputPath}`);
}

main().catch(console.error);
