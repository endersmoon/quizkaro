import {defineConfig} from 'vite';
import motionCanvas from '@reelgen/vite-plugin';

export default defineConfig({
  plugins: [
    motionCanvas({project: './src/project.ts'}),
  ],
});
