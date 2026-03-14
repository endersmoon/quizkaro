import {makeProject} from '@revideo/core';
import mcqQuiz from '../scenes/mcq-quiz-v2';

export default makeProject({
  scenes: [mcqQuiz],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
      background: '#0f0c29',
      range: [0, Infinity],
    },
  },
});
