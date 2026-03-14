import {makeProject} from '@revideo/core';
import guessSong from './scenes/guess-song';

const sampleQuestions = JSON.stringify([
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
]);

export default makeProject({
  scenes: [guessSong],
  variables: {
    title: 'Guess the Song!',
    questions: sampleQuestions,
    thinkTime: '10',
    accentColor: '#ff6b9d',
  },
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
      background: '#0a0015',
      range: [0, Infinity],
    },
  },
});
