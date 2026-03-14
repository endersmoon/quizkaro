import {makeProject} from '@revideo/core';
import guessSong from '../scenes/guess-song';

export default makeProject({
  scenes: [guessSong],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
      background: '#0a0015',
      range: [0, Infinity],
    },
  },
});
