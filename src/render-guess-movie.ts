import {renderVideo} from '@reelgen/renderer';

const sampleQuestions = [
  {
    emojis: '🦁👑🌍',
    options: ['Bahubali', 'Mufasa: The Lion King', 'The Jungle Book', 'Padmaavat'],
    correctIndex: 1,
  },
  {
    emojis: '🏍️💨👮‍♂️',
    options: ['Dhoom', 'Singham', 'Dabangg', 'Rohit Shetty Cop Universe'],
    correctIndex: 0,
  },
  {
    emojis: '✈️🇮🇳🫡',
    options: ['Uri: The Surgical Strike', 'Fighter', 'Lakshya', 'Border'],
    correctIndex: 1,
  },
  {
    emojis: '🤼‍♀️🥇🇮🇳',
    options: ['Bhaag Milkha Bhaag', 'Mary Kom', 'Dangal', 'Sultan'],
    correctIndex: 2,
  },
  {
    emojis: '🧑‍🚀🌙🚀',
    options: ['Mission Mangal', 'Swades', 'Interstellar', 'Gravity'],
    correctIndex: 0,
  },
];

async function main() {
  console.log('Starting Guess the Movie (Emoji) video render...');
  const startTime = Date.now();

  const outputPath = await renderVideo({
    projectFile: './src/project-guess-movie.ts',
    variables: {
      title: 'Guess the Bollywood Movie!',
      subtitle: 'From emojis 🎬',
      questions: JSON.stringify(sampleQuestions),
      thinkTime: '10',
      accentColor: '#f59e0b',
    },
    settings: {
      outFile: 'guess-movie-emoji.mp4',
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
