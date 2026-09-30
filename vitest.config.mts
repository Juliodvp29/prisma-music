import { ngNative } from '@ng-native/testing/vitest';
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

// Compiles Angular for the tests the way Metro compiles it for the app. Tests run in Node against
// a fake of the native side: no simulator, no device.
export default defineConfig({
  plugins: [ngNative()],
  // Mirrors tsconfig.json `paths` so tests resolve the same aliases as the app.
  resolve: {
    alias: {
      '@app': path.resolve(root, 'src/app'),
      '@core': path.resolve(root, 'src/app/core'),
      '@features': path.resolve(root, 'src/app/features'),
      '@shared': path.resolve(root, 'src/app/shared'),
      'prisma-audio': path.resolve(root, 'modules/prisma-audio/index.ts'),
    },
  },
});
