import {renderVideo} from '@revideo/renderer';

const sampleQuestions = [
  {
    options: [
      'Adele - Rolling in the Deep',
      'Beyoncé - Halo',
      'Ed Sheeran - Shape of You',
      'Taylor Swift - Shake It Off',
    ],
    correctIndex: 2,
  },
  {
    options: [
      'Queen - Bohemian Rhapsody',
      'The Beatles - Hey Jude',
      'Led Zeppelin - Stairway to Heaven',
      'Pink Floyd - Comfortably Numb',
    ],
    correctIndex: 0,
  },
  {
    options: [
      'Dua Lipa - Levitating',
      'The Weeknd - Blinding Lights',
      'Harry Styles - Watermelon Sugar',
      'Olivia Rodrigo - drivers license',
    ],
    correctIndex: 1,
  },
];

async function main() {
  console.log('Starting Guess the Song video render...');
  const startTime = Date.now();

  const outputPath = await renderVideo({
    projectFile: './src/project-guess-song.ts',
    variables: {
      title: 'Guess the Song!',
      questions: JSON.stringify(sampleQuestions),
      thinkTime: '10',
      accentColor: '#ff6b9d',
    },
    settings: {
      outFile: 'guess-song.mp4',
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
