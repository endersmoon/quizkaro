import {makeProject} from '@revideo/core';
import mcqQuiz from './scenes/mcq-quiz';

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
  scenes: [mcqQuiz],
  variables: {
    title: 'General Knowledge Quiz',
    questions: sampleQuestions,
    thinkTime: '10',
    accentColor: '#e94560',
  },
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
      background: '#0f0c29',
      range: [0, Infinity],
    },
  },
});
