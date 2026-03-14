import {makeProject} from '@revideo/core';
import guessMovieEmoji from '../scenes/guess-movie-emoji';

export default makeProject({
  scenes: [guessMovieEmoji],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
      background: '#0a0510',
      range: [0, Infinity],
    },
  },
});
