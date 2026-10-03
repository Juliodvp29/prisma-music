# MEMORY.md

Living summary of the project state, used to resume work in a new session. Keep it short and current: rewrite sections
instead of appending history. Update at the end of every ticket. Detailed scope is in `ROADMAP.md`, rules in `AGENTS.md`.

## Snapshot

- **Project**: Prisma Music, personal local-file music player for Android, iOS later.
- **Stack**: Angular 22 + Angular Native (alpha) on Expo dev build, TypeScript strict, Tailwind, Vitest, Kotlin Expo module for audio.
- **Phase / ticket**: Phase 1.2 done. Next ticket: **T-107** (Phase 1.3).
- **Last updated**: 2026-10-03

## Done

- Phase 0: bootstrap, tooling, structure with aliases and lazy stack routes, Tailwind tokens + ThemeService + Inter, CI with Gradle job, `prisma-audio` scaffold, spikes T-005/T-007.
- Phase 1.1: media permission flow (`MediaAccessService` with granted/denied/permanently-denied states, `READ_MEDIA_AUDIO` / pre-33 `READ_EXTERNAL_STORAGE`, icons installed); native MediaStore scanner (batched, cancellable, throttled progress) behind `TrackSource`/`LocalTrackSource`; metadata via `MediaMetadataRetriever` + `MediaExtractor` (tags, duration, bitrate, sample rate, channels, mime, artwork downsampled to 512px JPEG in cache) via `LocalMetadataReader`. Only `core/` services import `prisma-audio`. `.gitattributes` enforces LF.
- Phase 1.2: SQLite via `expo-sqlite` (`database()` + v1 migration: tracks/albums/artists/playlists/playlist_tracks/history/settings, UUID keys, `source` + generic `uri`); typed repositories (tracks, albums, artists, playlists, history, settings) tested against real SQL through a `node:sqlite` in-memory adapter; `ScanService` orchestrating permission gate, scan, add/change/remove diff, metadata and status signal, with scan UI (scan/progress/summary/cancel/retry) on the library page.

## In progress

_None._

## Decisions

- D-01 Local files only; no backend or accounts. Data in SQLite (`expo-sqlite`).
- D-02 Android first; iOS deferred to Phase 9 (developer is on Windows, iOS needs EAS or a Mac).
- D-03 Custom native audio module with Expo Modules API (Media3 ExoPlayer + MediaSession), not `expo-audio`, because gapless, crossfade, EQ, Hi-Res and spatial audio need engine-level control.
- D-04 Dev build only; Expo Go cannot run the background service, widgets or the custom module.
- D-05 The native player owns playback state; Angular mirrors it through signals.
- D-06 All docs, code, comments, commits in English; user-facing UI strings in Spanish. Agents reply to the user in Spanish.
- D-07 Design based on an Apple Music palette adapted in `DESIGN.md`; Inter font bundled; Dynamic UI colors from artwork.
- D-08 A remote library (Supabase or custom backend) may be added later. Current work stays local-only, but the model is source-agnostic: UUID track IDs, `source` + generic `uri` columns, scanner behind a `TrackSource` interface, SQLite treated as a local cache. Media3 already plays `https://` URIs, so the player needs no redesign. Free Supabase Storage is small for music; a custom server (e.g. Navidrome) or S3/R2 may fit better.
- D-09 CI/CD with GitHub Actions: `checks` (`typecheck`, `lint`, `test`) plus `android-unit-tests` (`:prisma-audio:testDebugUnitTest`) on every push and PR; signed release builds later in T-806 (triggered by version tags, publishing an APK to a GitHub Release). Secrets and keystores only in GitHub Secrets. CI uses Node 22.
- D-10 Path aliases `@app`/`@core`/`@features`/`@shared` plus bare `prisma-audio`, mirrored in tsconfig `paths`, Vitest `resolve.alias` and Metro `extraNodeModules`.
- D-11 Theming: Tailwind v4 `@theme` tokens from `DESIGN.md` with a `.dark` palette override; `ThemeService` (system/light/dark, drives root `dark` class and `ColorScheme.set`); preference persistence waits for the settings store (Phase 1/8).
- D-12 Native bridge pattern: `modules/prisma-audio/src/` exposes the typed module handle only; only `core/` services import it (`playback/native-audio.ts`, `library/*`). Lazy `require('expo')` inside the factory (ESLint override scoped to the bridge). JUnit 4 as test-only dep of the module.
- D-13 T-005 outcomes: linear/radial gradients via Tailwind supported (no conic); blur is Android-only, always behind `android:` with a flat/scrim fallback on iOS; opacity, translate/scale/rotate transforms and absolute layout supported; skew is iOS-only (avoid); icons via `@ng-native/icons` `NgIcon` + outline `@ng-icons` sets over `react-native-svg` (install deferred to T-107).
- D-14 T-007 outcomes: scrubber/sheet via `Gesture.Pan` + `sharedValue` + `workletStyle` on the UI thread, `<gesture-root>` at the root, no `this` in worklet callbacks, gesture/reanimated entry-point imports (Node-safe), tests via `gestureOf` + callbacks. Library install (`react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`) deferred to T-210/T-211 with a dev-build rebuild.
- D-15 Permissions: `READ_MEDIA_AUDIO` (API 33+) with `READ_EXTERNAL_STORAGE` fallback below; runtime choice by `Platform.Version`. Icons (`NgIcon` + heroicons outline + `react-native-svg`) installed for empty states; `NgIcon` color bound to the theme accent (no token access in TS).
- D-16 Scanning: `MediaScanner` reads `IS_MUSIC = 1` rows in ID order over `backgroundCoroutineScope` + IO, batching client-side while iterating (the MediaProvider rejects SQL clauses such as LIMIT in the sort order via strict-grammar enforcement); cursor columns resolve through `CursorColumns` keyed by mapper names (a wrong key silently defaulted every row once); `"<unknown>"` normalizes to the defaults; cancellation via `ScanSession` flag; progress events per batch; bit depth has no reliable Android API, so it is omitted until the Hi-Res path (T-407) needs it.
- D-17 Persistence: `expo-sqlite` through the framework `database()` value; repos take a `Db` port (`LIBRARY_DB` thunk) so tests run real SQL on `node:sqlite` without the native module; UUIDs from the `Crypto` service (`SOURCE` overridden in tests); playlist membership allows repeats via surrogate keys.

## Architecture (current)

```
src/app/
  core/             ThemeService; playback/NativeAudio (signals over prisma-audio);
                    library/ MediaAccessService, TrackSource/LocalTrackSource, TrackMetadata/LocalMetadataReader,
                    ScanService, schema + library-db (Db port), repositories/, test-db/test-services helpers
  features/         library/ player/ playlists/ lyrics/ equalizer/ settings/ (library shows permission states; rest stubs, lazy routes)
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
- Manifest and native changes (`app.json` permissions, new native modules) need a dev-build rebuild (`npm run android`); Metro reload is not enough, and the app info screen shows no permission until then.
- TS 6 deprecates `baseUrl` (needed for `paths`); silenced with `"ignoreDeprecations": "6.0"`, revisit on TS 7.
- `@font-face` in the Tailwind entry only carries weight-matching metadata: its sources stay unresolved markers (only the component transformer turns them into `require()`), so `loadFonts(generatedSheet)` throws in expo-font. Fonts load explicitly in `main.ts` with static `require()` under `Inter`/`Inter-<weight>`; verified via `expo export` (4 OTF assets bundled).
- `@ng-native/testing` tears down TestBed after `render()`: navigate in tests via `nativeRouterLink` presses, not `TestBed.inject(Router)`.
- `injectService()` from the testing docs does not exist in `@ng-native/testing` 0.1.1; service tests use minimal probe components capturing the injected service.
- `node:sqlite` statement methods take positional values, not a single params array; the `Db` port is variadic everywhere.
- Repository tests run against real SQL via a `node:sqlite` in-memory adapter (`test-db.ts`); UUIDs are deterministic via `Crypto.SOURCE` (`test-services.ts`). `expo-sqlite` itself is never touched in Node.
- Gradle must run under Android Studio's JBR 21 (`JAVA_HOME`), not the default JDK 25. Module tests: `:prisma-audio:testDebugUnitTest` from `android/`. Expo has `backgroundCoroutineScope`, not `backgroundExecutor`.
- Remaining `[angular-native] dropped ...` warnings in `typecheck` output come from Tailwind's own utilities, not app code.
- Remaining `[angular-native] dropped ...` warnings in `typecheck` output come from Tailwind's own utilities, not app code.

## Open questions / risks

- Crossfade needs a dual-player design on Media3; validate gapless first (T-401).
- Hi-Res and spatial behavior depend on device and output route; needs real-device testing.
- Gesture/animation approach (T-007) validated against docs only; device validation deferred to T-210/T-211.
- First CI run of `android-unit-tests` failed in `setup-android@v3` (it installs the obsolete `tools` SDK package); replaced with the runner's preinstalled SDK plus `sdkmanager` platform install. Awaiting a green run after the fix.
- Scanner/metadata verified with fakes and unit tests only; a real-device scan of an actual music library has not been observed yet.

## Environment

- Windows, IntelliJ IDEA. Android emulator or physical device for dev builds.
- Commands: `npm start`, `npm run android`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run format`.
- Native: `npx expo prebuild --clean` to relink; `./gradlew :prisma-audio:testDebugUnitTest` (with JBR 21) for Kotlin tests.

## Next steps

1. T-107 tab shell (Library, Playlists, Search, Settings) with themed navigation.
2. T-108 songs list with virtualization, sorting, and fast scroll.
3. T-109 albums, artists, and folders views with detail screens.
