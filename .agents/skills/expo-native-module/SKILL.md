---
name: expo-native-module
description: Use when working on modules/prisma-audio, any Kotlin or Swift native code, an Expo config plugin in plugins/, or the TypeScript bridge to the native audio engine.
---

# Native audio module (prisma-audio)

Custom Expo Modules API module that owns playback. The native player is the source of truth; Angular mirrors its state through events (see `AGENTS.md`).

## Layout

```
modules/prisma-audio/
  expo-module.config.json
  android/src/main/java/expo/modules/prismaaudio/   Kotlin module and services
  android/src/test/                                  JUnit tests
  ios/                                               Swift, later phase
  src/                                               typed TS wrapper
  index.ts
plugins/                                             config plugins (manifest, service, widget)
```

Never edit the generated `android/` or `ios/` app folders. Manifest entries, services, permissions and widget declarations go through a config plugin in `plugins/`.

## Kotlin rules

- The module class stays thin: it declares `Name`, `Function`, `AsyncFunction`, `Events` and forwards to plain service classes. Playback, queue and effects logic live in separate classes.
- Playback runs inside a Media3 `MediaSessionService` as a foreground service of type media playback. Default player setup: `ExoPlayer.Builder` with audio attributes for music and audio focus handling enabled, `setHandleAudioBecomingNoisy(true)`, and a local wake mode.
- Access the player only from its application looper. Never block the main thread with scanning, decoding or I/O; use coroutines or executors and report progress through events.
- Emit events through `sendEvent` with small typed payloads. Throttle position updates (about four per second while playing, none while paused).
- Reject async calls with a stable error code and message; never swallow exceptions.
- Release the player, effects and listeners in the service lifecycle.
- Keep queue, shuffle, smart-mix scoring and other pure logic free of Android classes so it can be unit tested with plain JUnit.

## TypeScript bridge

- `src/` exposes typed functions and typed event payloads, nothing else.
- Only `core/playback/native-audio.ts` imports the module. The rest of the app uses `PlaybackService`.
- Convert native events into signals in the core service, not in components.

## Verify

1. `cd modules/prisma-audio/android && ./gradlew test` for Kotlin tests.
2. `npm run typecheck`, `npm run lint`, `npm test` for the bridge.
3. `npx expo prebuild --clean` followed by `npm run android` to confirm the native build compiles.
4. Audio behavior (background playback, notification controls, Bluetooth buttons, gapless, effects) cannot be observed by the agent. Give Julio a numbered manual checklist with the expected result for each item, and state clearly what was not tested on a device.

## Do not

- Do not add native dependencies or change Gradle versions without asking.
- Do not add network access or permissions that are not in the ticket.
- Do not leave debug logging in committed code.
