const { getDefaultConfig } = require('expo/metro-config');
const { withAngularNative } = require('@ng-native/metro/config.cjs');
const { withTailwind } = require('@ng-native/tailwind/config.cjs');
const path = require('path');

// Registers the transformer that compiles Angular ahead of time, compiles each component's CSS
// into the sheet the engine reads, and adds the polyfills Angular needs before `@angular/core`
// is first evaluated. No options: the framework packages are ordinary dependencies here.
const config = getDefaultConfig(__dirname);

// Mirrors tsconfig.json `paths` so Metro resolves the same `@app`, `@core`,
// `@features`, `@shared` and `prisma-audio` aliases at bundle time.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@app': path.resolve(__dirname, 'src/app'),
  '@core': path.resolve(__dirname, 'src/app/core'),
  '@features': path.resolve(__dirname, 'src/app/features'),
  '@shared': path.resolve(__dirname, 'src/app/shared'),
  'prisma-audio': path.resolve(__dirname, 'modules/prisma-audio'),
};

// Compiles `src/styles.css` into the global utility sheet before Metro resolves the first
// import, and watches it on a dev server. The generated module is gitignored.
module.exports = withTailwind(withAngularNative(config), {
  input: './src/styles.css',
});
