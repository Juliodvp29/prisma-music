# AGENTS.md

Rules for any AI agent working in this repository. Keep this file short; details live in the linked docs.

## Language

- Talk to the user (Julio) **always in Spanish**.
- User-facing UI strings are **Spanish**. Everything else is **English**: code, identifiers, comments, tests, commit messages, docs.

## Project

**Prisma Music** is a personal music player for Android (iOS later), built with **Angular Native** (alpha) on Expo.
Plays local files only. No backend, no accounts, no network required.
A remote library (Supabase or a custom backend) may be added in the future, so keep the design source-agnostic:
tracks use UUIDs and a generic `uri`, and sources sit behind a `TrackSource` interface. Do not build any remote
functionality until a ticket asks for it.

Core goals: fluid UI, background playback with native media controls, gapless/crossfade, EQ, Hi-Res/spatial audio,
synced lyrics, playlists, smart shuffle, home-screen widgets, dynamic UI colors from album art.

Read before working: `MEMORY.md` (current state) -> `ROADMAP.md` (tickets) -> `DESIGN.md` (any UI work).

Framework docs, for reading before a change: https://ng-native.com/llms-full.txt (outline: https://ng-native.com/llms.txt).
Angular's own best practices apply too: https://angular.dev/assets/context/best-practices.md, except its browser-only
parts. Where they disagree, this file wins.

## Stack

- Angular 22 (latest APIs) + `@ng-native/*` (components, platform, router, tailwind, testing, device). Docs: https://ng-native.com
- Expo (dev build, never Expo Go), Metro, TypeScript strict, Tailwind via `@ng-native/tailwind`
- Vitest + `@ng-native/testing` for TS; JUnit for Kotlin
- Native audio: custom **Expo Modules API** module in `modules/prisma-audio` (Kotlin, Media3 ExoPlayer + MediaSession; Swift later)
- Persistence: `expo-sqlite`. Settings: small key-value store
- Windows + IntelliJ IDEA. Use cross-platform commands (no bash-only syntax in scripts)
- CI/CD: GitHub Actions (`.github/workflows/`)

## Architecture

```
src/app/
  core/       singleton services: playback state, library repository, settings, theme
  features/   library/ player/ playlists/ lyrics/ equalizer/ settings/  (routed, lazy-loaded)
  shared/     ui/ (design-system components), utils/, models/
modules/prisma-audio/   native audio module (android/, ios/, src/)
plugins/                Expo config plugins (widgets, manifest)
```

- Layers: UI component -> feature service/store -> core service -> native bridge. A layer only calls the one below it.
- The **native player is the source of truth** for playback. Angular mirrors it into signals via module events.
- Only services in `core/` may import `prisma-audio`: `core/playback/native-audio.ts` for playback and `core/library/*` for scanning. Everything else uses the `PlaybackService` or a `TrackSource`.
- Feature folders never import from each other; shared code goes in `core/` or `shared/`.

## Commands

```
npm start                       # Metro; open the installed dev build (never Expo Go)
npm run android                 # expo run:android (dev build)
npm test                        # Vitest in Node against a fake native layer, no emulator needed
npm run typecheck
npm run lint | format           # added in T-002
npx expo prebuild --clean       # regenerate native folders (never edit them by hand)
cd modules/prisma-audio/android && ./gradlew test   # Kotlin tests
```

`src/main.ts` mounts the root component `src/app/app.ts`. Run `npm test` and `npm run typecheck` after every change;
both are fast.
CI runs `typecheck`, `lint` and `test` on every push and pull request on Ubuntu runners, so these commands must stay
headless, deterministic and cross-platform. A ticket is not done while CI would fail.

## Ticket workflow (mandatory)

1. Read `MEMORY.md` and the ticket in `ROADMAP.md`. Ask if anything is ambiguous.
2. **Present a plan first and stop.** Files to touch, approach, tests, risks. Wait for explicit approval before writing code.
3. Implement in small steps. **Always add tests** (services, pure logic, components; Kotlin unit tests for native logic).
4. **Always verify**: run typecheck, lint, tests, and a bundle/build. For native or UI/audio behavior you cannot observe,
   say so and give Julio a short manual checklist. Never claim something works unless you ran it.
5. Update the ticket checkbox in `ROADMAP.md` and rewrite the affected parts of `MEMORY.md` (concise, no history dumps).
6. Finish with: what was implemented, files changed, tests/checks run and results, manual checks for Julio, and a
   **suggested commit message** (Conventional Commits, e.g. `feat(player): add mini player progress bar`).
   **Never run `git commit`, `git push` or change git config.** Julio commits.

## Code conventions

- TypeScript strict. No `any` (use `unknown` + narrowing). No non-null `!` without a reason. Prefer `readonly`, `const`.
- Standalone components only. `input()`, `output()`, `model()`, `inject()`, `computed()`, signals-first; `effect()` sparingly.
- New control flow (`@if`, `@for` with `track`, `@switch`, `@defer`). Signal Forms for forms. RxJS only when a stream is truly needed.
- Small components; one responsibility; presentational components get data via inputs. Files kebab-case, `app-` selector prefix.
- Errors are handled explicitly at boundaries (native bridge, DB, file access). No empty `catch`.
- Comments: English, only for non-obvious *why*. Impersonal and timeless. **Never** first person ("I", "we"), TODO notes
  addressed to agents, references to `AGENTS.md`/`ROADMAP.md`/tickets, or narration of what code does.
- No dead code, no commented-out code, no `console.log` left behind.

## Angular Native rules

This is an Angular app rendering real native views (Fabric, inside Expo). It is not a web app and not React: no DOM, no JSX.

- **Signals, zoneless, AOT.** State lives in signals and `computed()`. There is no zone.js, so a plain field change outside a signal or an event does not update the UI.
- **Element names are lowercase:** `<view>`, `<text>`, `<pressable>`, `<scroll-view>`, `<text-input>`, `<image>`, `<switch>`, `<safe-area-view>`, `<virtual-list>`, `<modal>`. Import each from `@ng-native/components` into `imports`. `<View>` compiles to an empty template; a missing import renders a plain view.
- **No DOM:** no `document`, `window`, `<div>`, `<span>`, `<button>`, `<input>`, `@angular/platform-browser`, `@angular/animations`, `NgOptimizedImage` (use `<image>`).
- **Text only renders inside `<text>`.**
- **Events are native:** `(press)` not `(click)`; `(changeText)` or `[(value)]` on `<text-input>`; `(scroll)`, `(layout)`. Pressable text: `<text pressable (press)="...">`.
- **Accessibility is props:** `accessibilityRole`, `accessibilityLabel`, `[accessibilityState]`.
- **No backticks inside an inline template**, even in comments; they break the build with a misleading error.
- **Styling:** `[style]` takes a React Native style object (camelCase, numbers in points). A component's `styles` is real CSS compiled at build time; grid, float, `::before`/`::after`, `:hover` and `:focus-visible` are dropped with a warning, so use flexbox (column by default). Tailwind v4 via `@ng-native/tailwind` with `ios:`, `android:`, `dark:`. Tokens come from `DESIGN.md`. Build warnings about dropped CSS are failures: fix them.
- **Animations:** CSS transitions and keyframes, `AnimatedStyle`, or Reanimated worklets (import from their own entry points, see docs).
- **Lists:** long lists use `<virtual-list>` (`@for (row of list.window(); track row.slot)`); `<scroll-view>` only for short content.
- **Navigation:** `provideNativeRouter(routes)` from `@ng-native/router` in `mount`'s `providers`, `<native-stack-outlet />` in templates, and `withComponentInputBinding()` (in tests too).
- **Forms:** Signal Forms (`@angular/forms/signals`) with `[formField]`.
- **HTTP:** only `provideNativeHttpClient()` from `@ng-native/platform/http`, never `provideHttpClient()` (and no network calls without an approved ticket).
- **Tests:** `render(Component)`, query with `screen.getByRole`, `getByText` or `getByTestId`, act with `userEvent.setup().press(...)` or `.type(...)`, all from `@ng-native/testing`. Write one alongside every change.
- **Alpha bugs to avoid:** no method shorthand inside decorator metadata (`attach: function () {}`), no template arrow functions that read their parameter (use a component method), always close `@if (...)` and `@let ...;`.
- Before adding any Expo/React Native library that renders UI, check the Angular Native docs for support.
- If docs and behavior disagree, stop and tell Julio; record the finding in `MEMORY.md`.

## Do not

- Do not edit generated `android/` or `ios/` folders; native code lives in `modules/` and `plugins/`.
- Do not touch `.agents/skills/` (managed by Julio), and do not edit `AGENTS.md` or `DESIGN.md` without asking.
- Do not edit `.github/workflows/` without an approved ticket. Never commit keystores, `.env` files, tokens or credentials;
  signing keys and secrets live in GitHub Secrets only.
- Do not add or upgrade dependencies without asking (Angular Native is alpha; versions are pinned deliberately).
- Do not add a backend, analytics, telemetry, ads, or network calls without an approved ticket.
- Do not hardcode colors, spacing, or font sizes; use design tokens.
- Do not expand scope beyond the ticket; note extra ideas in the final summary instead.
- Do not delete or overwrite the user's music files. The app only reads them.

## Quality bar

Playback must never glitch the UI thread: no heavy work on the JS thread during playback, scanning is batched and
cancellable, lists are virtualized, artwork is downsampled and cached. Touch targets are at least 48dp.