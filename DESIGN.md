---
version: alpha
name: Prisma Music
description: "A calm, content-first music player. Neutral light/dark surfaces in the spirit of Apple Music, with an accent that adapts to the album artwork (Dynamic UI). Single font family, soft depth, fast and quiet motion."

colors:
  light:
    background: "#F1F1F1"
    surface: "#F6F6F6"
    surface-elevated: "#FFFFFF"
    text: "#000000"
    text-secondary: "rgba(0,0,0,0.55)"
    text-tertiary: "rgba(0,0,0,0.35)"
    separator: "rgba(0,0,0,0.08)"
    primary: "#192028"
    on-primary: "#FFFFFF"
    accent: "#192028"
  dark:
    background: "#0B0F13"
    surface: "#141A20"
    surface-elevated: "#1C242C"
    text: "#FFFFFF"
    text-secondary: "rgba(255,255,255,0.62)"
    text-tertiary: "rgba(255,255,255,0.38)"
    separator: "rgba(255,255,255,0.10)"
    primary: "#EBDDC8"
    on-primary: "#192028"
    accent: "#EBDDC8"
  brand:
    sand: "#EBDDC8"
    ink: "#192028"
  feedback:
    danger: "#E5484D"
    success: "#30A46C"

typography:
  fontFamily: "Inter"
  fontFamilyNote: "Native fontFamily accepts a single name and has no fallback stack. Bundle Inter with expo-font and reference only that name."
  largeTitle: { fontSize: 34, fontWeight: 700, lineHeight: 41 }
  title: { fontSize: 22, fontWeight: 700, lineHeight: 28 }
  headline: { fontSize: 17, fontWeight: 600, lineHeight: 22 }
  body: { fontSize: 15, fontWeight: 400, lineHeight: 20 }
  callout: { fontSize: 13, fontWeight: 500, lineHeight: 18 }
  caption: { fontSize: 12, fontWeight: 400, lineHeight: 16 }
  lyrics: { fontSize: 28, fontWeight: 700, lineHeight: 36 }
  numeric: "Use tabular figures for timers and durations."

spacing:
  unit: 4
  scale: [2, 4, 8, 12, 16, 20, 24, 32, 40, 56]
  screenGutter: 20
  listRowHeight: 64
  miniPlayerHeight: 64
  tabBarHeight: 56
  minTouchTarget: 48

radius:
  xs: 4
  sm: 6
  md: 8
  lg: 12
  xl: 20
  pill: 9999

elevation:
  card: 2
  player-artwork: 8
  sheet: 12
  note: "Android uses elevation; iOS ignores it. Do not rely on shadows for hierarchy; use surface contrast first."

motion:
  duration-fast: 100
  duration-base: 250
  duration-slow: 400
  easing-standard: "cubic-bezier(0.4, 0, 0.2, 1)"
  easing-enter: "cubic-bezier(0, 0, 0.2, 1)"
  easing-exit: "cubic-bezier(0.4, 0, 1, 1)"
  pressed: { opacity: 0.7, scale: 0.97 }
---

## Overview

Prisma Music should feel like a native system app: quiet chrome, artwork as the hero, generous touch targets, no visual noise.
Reference: Apple Music (neutral surfaces, low radii, soft depth, SF-like type). Tokens above are adapted from a measured
Apple Music palette (`#F1F1F1` background, `#F6F6F6` surface, `#192028` ink, `#EBDDC8` sand) and scaled for a phone.
Values are density-independent pixels.

## Theme

- Follows the system by default, with an in-app override (System / Light / Dark). Use the `dark` class approach from Angular Native theming.
- Light: ink (`#192028`) is the interactive color on light surfaces. Dark: sand (`#EBDDC8`) is the interactive color.
- All colors are semantic tokens exposed as CSS custom properties (`--color-background`, `--color-surface`, `--color-text`, ...). Components never use raw hex.
- Minimum contrast: 4.5:1 for text, 3:1 for icons and controls.

## Dynamic UI (album colors)

- On track change, the palette (dominant, vibrant, muted) is extracted natively from the artwork and cached per album.
- Applies to: full player background, lyrics view, mini player tint, widget accent. It does **not** recolor the rest of the app, except a subtle accent (progress, active tab indicator).
- The full player always renders on a dark-tinted background derived from the dominant color, with white text, in both themes.
- Derived colors must pass contrast checks against their background; if not, adjust lightness until they do, or fall back to `brand`.
- Palette changes crossfade over `duration-slow`. Missing or failing artwork falls back to brand tokens and a generated placeholder (no broken image states).
- Gradients and blur depend on what Angular Native supports; the CSS capability spike (T-005) decides. Fallback is a flat dominant color with a scrim.

## Layout

- Bottom navigation: **Library, Playlists, Search, Settings**. A **mini player** docks above the tab bar whenever a queue exists.
- Tap or swipe up on the mini player to open the **full player** as a modal sheet; swipe down to dismiss.
- Respect safe areas, gesture navigation, and landscape/tablet widths (two-pane on wide screens).
- Screen gutter 20. Section spacing 24-32. List rows 64 high with a 48 artwork.

## Components

- **Track row**: 48 artwork (radius `sm`), title (`body`, 1 line), artist + album (`caption`, secondary, 1 line), duration right. Currently playing row shows an animated equalizer glyph in the accent.
- **Artwork**: radius `md` in lists, `lg` in grids, `xl` in the full player with `player-artwork` elevation. Square, always downsampled and cached.
- **Mini player**: 64 high, `surface-elevated`, artwork, title/artist, play/pause, next, thin progress line at the bottom.
- **Full player**: artwork, title/artist, scrubber with elapsed/remaining, transport row (shuffle, previous, play/pause, next, repeat), secondary row (lyrics, equalizer, queue, output device). Play/pause is the largest control (72).
- **Scrubber**: 4 high track, 16 thumb visible only while dragging, seeks on release, haptic tick on start.
- **Buttons**: primary is a filled pill (`primary` / `on-primary`); secondary is `surface` with `text`. Icon buttons are 48 hit area.
- **Sheets and menus**: `surface-elevated`, radius `xl` top corners, drag handle.
- **Lyrics**: `lyrics` type, active line full opacity, others `text-tertiary`, auto-scroll centers the active line, tap a line to seek.
- **Equalizer**: vertical band sliders with dB labels, preset chips, master on/off.
- **Empty and error states**: one icon, one sentence, one action.
- **Icons**: single-weight outline set, 24 default. The delivery method (SVG or icon font) is decided in T-005.

## Motion

- Transitions use `duration-base` with `easing-standard`; enters use `easing-enter`, exits `easing-exit`.
- Pressed state: opacity 0.7 and scale 0.97 over `duration-fast` (`hover:` maps to pressed on native).
- Sheet open/close and scrubber run on the UI thread (Reanimated worklets or `AnimatedStyle`), never on JS frame callbacks.
- Honor the system "reduce motion" setting: replace movement with crossfades.
- Keep animations subtle; never animate list scrolling or block playback controls.

## Do and Don't

- Do let artwork and typography carry the design; keep chrome neutral.
- Do use tokens, the 4 spacing grid, and the radius scale only.
- Do provide accessibility labels, roles, and values for every control (scrubber exposes current/total time).
- Don't use pure black backgrounds outside the dark theme token, drop shadows as separators, or more than one accent at a time.
- Don't put text directly on artwork without a scrim.
- Don't introduce a new font, color, or radius without updating this file.
