import {makeProject} from '@revideo/core';
import mcqQuizV2 from './scenes/mcq-quiz-v2';

const sampleQuestions = JSON.stringify([
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
]);

export default makeProject({
  scenes: [mcqQuizV2],
  variables: {
    title: 'General Knowledge Quiz',
    questions: sampleQuestions,
    thinkTime: '10',
    theme: 'ocean-blue', // Testing a different theme!
  },
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
      background: '#020617',
      range: [0, Infinity],
    },
  },
});
