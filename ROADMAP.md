# ROADMAP.md

Source of truth for scope. Structure: **Phase > Subphase > Ticket**. One ticket = one reviewable change and one commit.

Legend: `[ ]` todo, `[~]` in progress, `[x]` done. `Deps` lists tickets that must be done first.
Mark a ticket done only after its tests and checks pass. Android first; iOS is Phase 9.

Every ticket implicitly includes: tests, typecheck/lint clean, no dropped-CSS warnings, `MEMORY.md` update.

---

## Phase 0 - Foundation and spikes

### 0.1 Bootstrap
- [x] **T-001** Create project from `@ng-native/template`, run it on an Android dev build. Ship a hello screen and a passing test.
- [x] **T-002** Tooling: TypeScript strict, ESLint, Prettier, Vitest, npm scripts (`typecheck`, `lint`, `format`, `test`). Deps: T-001
- [x] **T-003** Folder structure, path aliases, app shell with native stack routing and lazy feature routes. Deps: T-002
- [x] **T-004** Tailwind setup and design tokens from `DESIGN.md` (light/dark, system + override, bundled Inter font). Deps: T-003
- [x] **T-008** GitHub Actions CI: install with dependency cache, then `typecheck`, `lint`, `test` on push and pull request. Extend with a Gradle unit-test job for `prisma-audio` once T-006 lands. Deps: T-002

### 0.2 Technical spikes (results recorded in `MEMORY.md`)
- [x] **T-005** CSS/visual capability spike: gradients, blur, opacity, transforms, absolute layout, icons (SVG vs icon font). Decide fallbacks. Deps: T-004
- [x] **T-006** Native module scaffold `prisma-audio` (Expo Modules API), hello-world call and event from Kotlin to Angular. Deps: T-003
- [x] **T-007** Gesture/animation spike: draggable scrubber and sheet using Reanimated worklets. Deps: T-004

---

## Phase 1 - Local library

### 1.1 Access and scanning
- [x] **T-101** Storage/media permissions flow with clear denied and permanently-denied states. Deps: T-003
- [x] **T-102** Native scanner over MediaStore (batched, cancellable, progress events), exposed as the local implementation of a `TrackSource` interface. Deps: T-006, T-101
- [x] **T-103** Metadata extraction: tags, duration, bitrate, sample rate, bit depth, format, embedded artwork (cached, downsampled). Deps: T-102

### 1.2 Persistence
- [ ] **T-104** SQLite schema and migrations (tracks, albums, artists, playlists, history, settings). Tracks use UUID primary keys, a `source` column (`local` for now) and a generic `uri`, so a remote source can be added later without a schema rewrite. Deps: T-003
- [ ] **T-105** Repository services with typed queries and tests. Deps: T-104
- [ ] **T-106** Incremental rescan (add, change, remove detection) and scan status UI. Deps: T-103, T-105

### 1.3 Browsing UI
- [ ] **T-107** Tab shell (Library, Playlists, Search, Settings) with themed navigation. Deps: T-004
- [ ] **T-108** Songs list with virtualization, sorting, and fast scroll. Deps: T-105, T-107
- [ ] **T-109** Albums, artists, and folders views with detail screens. Deps: T-108
- [ ] **T-110** Search across tracks, albums, artists (debounced, local). Deps: T-109

---

## Phase 2 - Playback core

### 2.1 Native audio engine
- [ ] **T-201** Media3 ExoPlayer inside a foreground `MediaSessionService`; play, pause, seek. Deps: T-006
- [ ] **T-202** Player state and position events bridged to Angular signals (`PlaybackService`). Deps: T-201
- [ ] **T-203** Native queue (add, remove, move, jump), repeat modes, next/previous semantics. Deps: T-202
- [ ] **T-204** Audio focus, ducking, becoming-noisy pause, phone-call interruptions. Deps: T-201

### 2.2 Background and system controls
- [ ] **T-205** MediaSession notification with transport controls and artwork. Deps: T-201
- [ ] **T-206** Lock screen metadata and seek bar. Deps: T-205
- [ ] **T-207** Wireless and wired headset buttons, Bluetooth metadata (AVRCP), resume policy on connect/disconnect. Deps: T-205
- [ ] **T-208** Persist and restore queue and position after process death or reboot. Deps: T-203, T-105

### 2.3 Player UI
- [ ] **T-209** Mini player docked above tab bar. Deps: T-202, T-107
- [ ] **T-210** Full player screen (artwork, metadata, transport) as modal sheet. Deps: T-209, T-007
- [ ] **T-211** Scrubber with drag-to-seek and accessibility value. Deps: T-210
- [ ] **T-212** Queue sheet with reorder and remove. Deps: T-203, T-210

---

## Phase 3 - Playlists and play modes

### 3.1 Playlists
- [ ] **T-301** Playlist CRUD (create, rename, delete) and playlist detail. Deps: T-105, T-107
- [ ] **T-302** Add to playlist / add to queue / play next actions from any track row. Deps: T-301, T-212
- [ ] **T-303** Reorder and remove tracks in a playlist. Deps: T-301
- [ ] **T-304** Favorites (heart) and a system Favorites playlist. Deps: T-301
- [ ] **T-305** M3U import and export. Deps: T-301

### 3.2 Play modes
- [ ] **T-306** Shuffle (true random without immediate repeats) and repeat one/all. Deps: T-203
- [ ] **T-307** Play history and skip/play counters recorded on the native side events. Deps: T-105, T-202
- [ ] **T-308** Smart mode: weighted selection from play count, skips, recency, favorites, time of day, artist/genre affinity. Deterministic and unit-tested. Deps: T-306, T-307
- [ ] **T-309** Sleep timer (minutes or end of track). Deps: T-201

---

## Phase 4 - Advanced audio

### 4.1 Transitions and loudness
- [ ] **T-401** Gapless playback validation and fixes across formats (mp3 encoder delay, flac, aac). Deps: T-203
- [ ] **T-402** Crossfade with configurable duration (dual-player ramp), skipped for album continuity when enabled. Deps: T-401
- [ ] **T-403** ReplayGain / loudness normalization from tags. Deps: T-103, T-201

### 4.2 Equalizer
- [ ] **T-404** Native equalizer (bands, presets, preamp) via `android.media.audiofx`. Deps: T-201
- [ ] **T-405** Equalizer UI with band sliders, presets, save custom preset. Deps: T-404, T-007
- [ ] **T-406** Bass boost, loudness enhancer, and limiter to prevent clipping. Deps: T-404

### 4.3 Hi-Res and spatial
- [ ] **T-407** Hi-Res output path (float/24-bit PCM, no unnecessary resampling), quality badge with format details. Deps: T-103, T-201
- [ ] **T-408** Spatial audio toggle using the platform Spatializer API where available. Deps: T-201
- [ ] **T-409** Output device awareness (speaker, wired, Bluetooth codec, USB DAC) and picker. Deps: T-207, T-407

---

## Phase 5 - Lyrics

- [ ] **T-501** LRC parser (timestamps, word-level extensions, offsets) with tests. Deps: T-003
- [ ] **T-502** Lyrics sourcing: sidecar `.lrc`, embedded unsynced/synced tags. Deps: T-103, T-501
- [ ] **T-503** Synced lyrics view: active line, auto-scroll, tap to seek, unsynced fallback. Deps: T-502, T-210
- [ ] **T-504** Per-track lyrics offset adjustment, persisted. Deps: T-503
- [ ] **T-505** Optional, opt-in online lookup (LRCLIB) with local cache. Requires approval to add networking. Deps: T-503

---

## Phase 6 - Dynamic UI and polish

- [ ] **T-601** Native palette extraction from artwork, cached per album. Deps: T-103
- [ ] **T-602** Dynamic theme provider with contrast enforcement and brand fallback. Deps: T-601, T-004
- [ ] **T-603** Apply dynamic colors to full player, lyrics, mini player; animated crossfade between tracks. Deps: T-602, T-210
- [ ] **T-604** Motion and haptics pass, reduce-motion support. Deps: T-603
- [ ] **T-605** Adaptive layouts: landscape, tablets, foldables. Deps: T-210
- [ ] **T-606** Accessibility audit: screen reader flows, font scaling, contrast. Deps: T-604

---

## Phase 7 - Widgets and system integration

- [ ] **T-701** Config plugin and native infrastructure for an Android App Widget. Deps: T-201
- [ ] **T-702** Now-playing widget (artwork, title, artist, play/pause, next/previous). Deps: T-701, T-205
- [ ] **T-703** Widget sizes, light/dark and dynamic accent, tap to open the player. Deps: T-702, T-602
- [ ] **T-704** Open-with support for audio files and share intents. Deps: T-105, T-203
- [ ] **T-705** Android Auto browse and playback support. Deps: T-205, T-105

---

## Phase 8 - Reliability, performance, release

- [ ] **T-801** Performance pass: cold start, scroll jank, memory, artwork cache limits. Deps: T-110
- [ ] **T-802** Large-library stress test (50k tracks): scan time, queries, list scroll. Deps: T-106
- [ ] **T-803** Background reliability: doze, battery optimization, foreground service policy, notification permission. Deps: T-207
- [ ] **T-804** Error handling and local diagnostics log (no telemetry). Deps: T-202
- [ ] **T-805** Backup and restore of playlists, favorites, and settings to a file. Deps: T-305
- [ ] **T-806** App icon, splash, and release build (signed AAB/APK via EAS or local Gradle). A GitHub Actions release workflow runs on version tags (`v*`): builds the signed APK/AAB using keystore and secrets from GitHub Secrets, then publishes a GitHub Release with the APK attached and generated notes. Deps: T-801, T-008

---

## Phase 9 - iOS (optional)

- [ ] **T-901** Swift audio module (AVAudioEngine) with parity for queue, gapless, EQ. Deps: T-408
- [ ] **T-902** Now Playing info and remote commands. Deps: T-901
- [ ] **T-903** WidgetKit extension. Deps: T-702
- [ ] **T-904** EAS Build pipeline and TestFlight. Deps: T-902

---

## Backlog (unscheduled ideas)

- A-B loop and playback speed/pitch
- Tag editor
- Listening stats and yearly recap
- Per-track or per-album EQ profiles
- Scrobbling (opt-in)
- Quick Settings tile
- Wear OS remote
- Gapless album mode, "continue where you left off" per album
- Chromecast / DLNA output
- Remote library (future, not scheduled): Supabase Auth, Storage and Postgres or a custom backend as a second `TrackSource`; signed-URL streaming, offline download cache, playlist/favorites sync with conflict handling. Needs `provideNativeHttpClient()` and an approved networking ticket.
