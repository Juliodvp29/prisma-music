import { AppRegistry, Image, Platform, processColor } from 'react-native';
import { withComponentInputBinding } from '@angular/router';
import { mount } from '@ng-native/platform';
import {
  currentConditions,
  deviceTokens,
  watchConditions,
} from '@ng-native/device';
import {
  getFabricUIManager,
  registerPlatformComponents,
} from '@ng-native/fabric';
import { provideNativeRouter } from '@ng-native/router';
import { loadAsync as loadFontAssets } from 'expo-font';
import tailwind from '../.angular-native/app.tailwind.js';
import { routes } from './app/app.routes.ts';
import { App } from './app/app.ts';

registerPlatformComponents(Platform.OS);

AppRegistry.registerRunnable(
  'main',
  ({ rootTag }: { rootTag: number | string }) => {
    void (async () => {
      // The `@font-face` list in the Tailwind entry only carries weight
      // matching metadata: its sources are unresolved markers no transformer
      // converts, so register the files directly under the composed names
      // (`Inter`, `Inter-<weight>`) the engine resolves them by.
      /* eslint-disable @typescript-eslint/no-require-imports -- static asset requires are Metro's bundling mechanism for fonts; main.ts never runs in Node. */
      await loadFontAssets({
        Inter: require('./fonts/Inter-Regular.otf'),
        'Inter-500': require('./fonts/Inter-Medium.otf'),
        'Inter-600': require('./fonts/Inter-SemiBold.otf'),
        'Inter-700': require('./fonts/Inter-Bold.otf'),
      });
      /* eslint-enable @typescript-eslint/no-require-imports */
      const app = mount(Number(rootTag), App, getFabricUIManager(), {
        providers: [provideNativeRouter(routes, withComponentInputBinding())],
        // Utility classes from `src/styles.css`, matched against every node.
        globalStyles: tailwind,
        // Colours, as the integers the platform wants.
        processColor,
        // What `@media` resolves against. Without it every media query is false and a responsive
        // layout renders as its smallest case.
        conditions: currentConditions(),
        // Values only the device knows - the hairline width, which is a third of a point on a 3x
        // screen. Without it `1px` is what you get, and that is a visibly fat divider.
        tokens: deviceTokens(),
        // Turns a `require('./x.png')` into something native can load. Without it images are blank.
        resolveAssetSource: (value) => Image.resolveAssetSource(value as never),
      });

      // Re-resolves the conditions when the device rotates or the theme changes. A rotation dirties
      // no component and no binding, so without this nothing re-renders and `dark:` stops following
      // the system switch.
      watchConditions(app.engine);
    })();
  },
);
