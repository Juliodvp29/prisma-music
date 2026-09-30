# MEMORY.md

Living summary of the project state, used to resume work in a new session. Keep it short and current: rewrite sections
instead of appending history. Update at the end of every ticket. Detailed scope is in `ROADMAP.md`, rules in `AGENTS.md`.

## Snapshot

- **Project**: Prisma Music, personal local-file music player for Android, iOS later.
- **Stack**: Angular 22 + Angular Native (alpha) on Expo dev build, TypeScript strict, Tailwind, Vitest, Kotlin Expo module for audio.
- **Phase / ticket**: Phase 0 done. Next ticket: **T-101** (Phase 1).
- **Last updated**: 2026-09-30

## Done

- Phase 0: bootstrap from `@ng-native/template`; tooling (strict TS, ESLint, Prettier, Vitest, `typecheck`/`lint`/`format`/`test`); folder structure with path aliases and native-stack shell with six lazy feature routes; Tailwind v4 with `DESIGN.md` tokens, system/light/dark `ThemeService`, bundled Inter (Regular/Medium/SemiBold/Bold OTF); CI (`checks` + `android-unit-tests` jobs); `prisma-audio` native scaffold (`hello()` + `onGreeting` event, `GreetingService` + JUnit, `NativeAudio` service with signals); spikes T-005/T-007 recorded below.

## In progress

_None._

## Decisions

- D-01 Local files only; no backend or accounts. Data in SQLite (`expo-sqlite`).
- D-02 Android first; iOS deferred to Phase 9 (developer is on Windows, iOS needs EAS or a Mac).
- D-03 Custom native audio module with Expo Modules API (Media3 ExoPlayer + MediaSession), not `expo-audio`, because gapless, crossfade, EQ, Hi-Res and spatial audio need engine-level control.
- D-04 Dev build only; Expo Go cannot run the background service, widgets or the custom module.
- D-05 The native player owns playback state; Angular mirrors it through signals.
- D-06 All docs, code, comments, commits in English. Agents reply to the user in Spanish.
- D-07 Design based on an Apple Music palette adapted in `DESIGN.md`; Inter font bundled; Dynamic UI colors from artwork.
- D-08 A remote library (Supabase or custom backend) may be added later. Current work stays local-only, but the model is source-agnostic: UUID track IDs, `source` + generic `uri` columns, scanner behind a `TrackSource` interface, SQLite treated as a local cache. Media3 already plays `https://` URIs, so the player needs no redesign. Free Supabase Storage is small for music; a custom server (e.g. Navidrome) or S3/R2 may fit better.
- D-09 CI/CD with GitHub Actions: `checks` (`typecheck`, `lint`, `test`) plus `android-unit-tests` (`:prisma-audio:testDebugUnitTest`) on every push and PR; signed release builds later in T-806 (triggered by version tags, publishing an APK to a GitHub Release). Secrets and keystores only in GitHub Secrets. CI uses Node 22.
- D-10 Path aliases `@app`/`@core`/`@features`/`@shared` plus bare `prisma-audio`, mirrored in tsconfig `paths`, Vitest `resolve.alias` and Metro `extraNodeModules`.
- D-11 Theming: Tailwind v4 `@theme` tokens from `DESIGN.md` with a `.dark` palette override; `ThemeService` (system/light/dark, drives root `dark` class and `ColorScheme.set`); preference persistence waits for the settings store (Phase 1/8).
- D-12 Native bridge pattern: `modules/prisma-audio/src/` exposes the typed module handle only; `core/playback/native-audio.ts` is the sole importer and converts events to signals. Lazy `require('expo')` inside the factory (ESLint override scoped to the bridge). JUnit 4 as test-only dep of the module.
- D-13 T-005 outcomes: linear/radial gradients via Tailwind supported (no conic); blur is Android-only, always behind `android:` with a flat/scrim fallback on iOS; opacity, translate/scale/rotate transforms and absolute layout supported; skew is iOS-only (avoid); icons via `@ng-native/icons` `NgIcon` + outline `@ng-icons` sets over `react-native-svg` (install deferred to T-107).
- D-14 T-007 outcomes: scrubber/sheet via `Gesture.Pan` + `sharedValue` + `workletStyle` on the UI thread, `<gesture-root>` at the root, no `this` in worklet callbacks, gesture/reanimated entry-point imports (Node-safe), tests via `gestureOf` + callbacks. Library install (`react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`) deferred to T-210/T-211 with a dev-build rebuild.

## Architecture (current)

```
src/app/
  core/             ThemeService; playback/NativeAudio (signals over prisma-audio)
  features/         library/ player/ playlists/ lyrics/ equalizer/ settings/ (stub pages, lazy routes)
  shared/           ui/ utils/ models/ (scaffolded, empty)
modules/prisma-audio/   Name/Function/Events thin module + pure GreetingService; typed TS bridge
```

## Known gotchas (Angular Native alpha)

- Lowercase tags and explicit imports per element, otherwise the element renders as a plain view.
- `provideHttpClient()` returns null bodies on device; use `provideNativeHttpClient()` if HTTP is ever needed.
- No `@angular/animations`, no DOM, no Angular DevTools; use `AnimatedStyle` or Reanimated worklets.
- Decorator metadata: no method shorthand. Templates: no arrow functions reading their own parameter.
- `hover:` in Tailwind means pressed state. Font stacks collapse to the first name; bundle and name a single font.
- CSS `position: sticky/fixed`, grid, `::before/::after` are unsupported. Unsupported CSS is dropped with a build warning.
- Hot reload keeps state for template/style edits; selector, input, method, or import changes need a full reload.
- TS 6 deprecates `baseUrl` (needed for `paths`); silenced with `"ignoreDeprecations": "6.0"`, revisit on TS 7.
- The generated `.angular-native/app.tailwind.js` is typed as `StyleSheet` but carries `fonts` at runtime; `main.ts` narrows it with `as unknown as SheetWithFonts` for `loadFonts()` (docs say to pass the generated sheet, types do not align).
- `@ng-native/testing` tears down TestBed after `render()`: navigate in tests via `nativeRouterLink` presses, not `TestBed.inject(Router)`.
- Gradle must run under Android Studio's JBR 21 (`JAVA_HOME`), not the default JDK 25. Module tests: `:prisma-audio:testDebugUnitTest` from `android/`.
- Remaining `[angular-native] dropped ...` warnings in `typecheck` output come from Tailwind's own utilities, not app code.

## Open questions / risks

- Crossfade needs a dual-player design on Media3; validate gapless first (T-401).
- Hi-Res and spatial behavior depend on device and output route; needs real-device testing.
- Gesture/animation approach (T-007) validated against docs only; device validation deferred to T-210/T-211.
- First CI run of `android-unit-tests` failed in `setup-android@v3` (it installs the obsolete `tools` SDK package); replaced with the runner's preinstalled SDK plus `sdkmanager` platform install. Awaiting a green run after the fix.

## Environment

- Windows, IntelliJ IDEA. Android emulator or physical device for dev builds.
- Commands: `npm start`, `npm run android`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run format`.
- Native: `npx expo prebuild --clean` to relink; `./gradlew :prisma-audio:testDebugUnitTest` (with JBR 21) for Kotlin tests.

## Next steps

1. T-101 storage/media permissions flow.
2. T-102 native scanner over MediaStore behind `TrackSource`.
3. T-103 metadata extraction.
