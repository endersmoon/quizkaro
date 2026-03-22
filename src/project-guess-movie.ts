import {makeProject} from '@reelgen/core';
import guessMovieEmoji from './scenes/guess-movie-emoji';

const sampleQuestions = JSON.stringify([
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
]);

export default makeProject({
  scenes: [guessMovieEmoji],
  variables: {
    title: 'Guess the Bollywood Movie!',
    subtitle: 'From emojis 🎬',
    questions: sampleQuestions,
    thinkTime: '10',
    accentColor: '#f59e0b',
  },
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
      background: '#0a0510',
      range: [0, Infinity],
    },
  },
});
