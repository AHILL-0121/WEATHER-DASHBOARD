import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Node by default; component tests opt into jsdom with a file comment
    environment: 'node',
    setupFiles: ['./test/setup.js'],
    include: ['**/*.test.{js,jsx}'],
    exclude: ['node_modules/**', '.next/**'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
