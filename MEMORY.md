# MEMORY.md

Living summary of the project state, used to resume work in a new session. Keep it short and current: rewrite sections
instead of appending history. Update at the end of every ticket. Detailed scope is in `ROADMAP.md`, rules in `AGENTS.md`.

## Snapshot

- **Project**: Prisma Music, personal local-file music player for Android, iOS later.
- **Stack**: Angular 22 + Angular Native (alpha) on Expo dev build, TypeScript strict, Tailwind, Vitest, Kotlin Expo module for audio.
- **Phase / ticket**: Phase 0. No code yet. Next ticket: **T-001**.
- **Last updated**: 2026-09-29

## Done

_None yet._

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
- D-09 CI/CD with GitHub Actions: checks (`typecheck`, `lint`, `test`) on every push and PR from T-008; signed release builds later in T-806 (triggered by version tags, publishing an APK to a GitHub Release). Secrets and keystores only in GitHub Secrets.

## Architecture (current)

Planned layout in `AGENTS.md`. Nothing implemented yet.

## Known gotchas (Angular Native alpha)

- Lowercase tags and explicit imports per element, otherwise the element renders as a plain view.
- `provideHttpClient()` returns null bodies on device; use `provideNativeHttpClient()` if HTTP is ever needed.
- No `@angular/animations`, no DOM, no Angular DevTools; use `AnimatedStyle` or Reanimated worklets.
- Decorator metadata: no method shorthand. Templates: no arrow functions reading their own parameter.
- `hover:` in Tailwind means pressed state. Font stacks collapse to the first name; bundle and name a single font.
- CSS `position: sticky/fixed`, grid, `::before/::after` are unsupported. Unsupported CSS is dropped with a build warning.
- Hot reload keeps state for template/style edits; selector, input, method, or import changes need a full reload.

## Open questions / risks

- Gradient, blur, and SVG support in Angular Native are unverified (resolve in T-005).
- Crossfade needs a dual-player design on Media3; validate gapless first (T-401).
- Hi-Res and spatial behavior depend on device and output route; needs real-device testing.

## Environment

- Windows, IntelliJ IDEA. Android emulator or physical device for dev builds.
- Commands are listed in `AGENTS.md`; `typecheck`, `lint`, `format` scripts arrive with T-002.

## Next steps

1. T-001 bootstrap from `@ng-native/template` and run on Android.
2. T-002 tooling, then T-003 structure and shell.
