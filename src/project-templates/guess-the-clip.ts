import {makeProject} from '@reelgen/core';
import guessTheClip from '../scenes/guess-the-clip';

export default makeProject({
  scenes: [guessTheClip],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
      background: '#050510',
      range: [0, Infinity],
    },
  },
});
