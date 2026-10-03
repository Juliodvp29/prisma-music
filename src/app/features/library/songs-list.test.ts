import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { testProviders } from '../../core/library/test-services.ts';
import type { TrackRow } from '../../core/library/repositories/track.repository.ts';
import { SongsListComponent, sortSongs } from './songs-list.ts';

function song(overrides: Partial<TrackRow>): TrackRow {
  return {
    id: overrides.id ?? 'id',
    source: 'local',
    deviceId: null,
    uri: 'content://song',
    title: 'Title',
    artist: 'Artist',
    album: 'Album',
    albumId: null,
    genre: null,
    trackNumber: null,
    discNumber: null,
    year: null,
    durationMs: 180000,
    sizeBytes: null,
    dateModified: null,
    mime: null,
    bitrate: null,
    sampleRate: null,
    channels: null,
    artworkPath: null,
    folder: null,
    ...overrides,
  };
}

test('sorts by title, artist, album and duration', () => {
  const rows = [
    song({
      id: 'a',
      title: 'Mango',
      artist: 'Zed',
      album: 'B',
      durationMs: 300,
    }),
    song({
      id: 'b',
      title: 'Apple',
      artist: 'Amy',
      album: 'A',
      durationMs: 100,
    }),
    song({
      id: 'c',
      title: 'Zebra',
      artist: 'Amy',
      album: 'A',
      durationMs: 200,
    }),
  ];

  expect(sortSongs(rows, 'title').map((row) => row.id)).toEqual([
    'b',
    'a',
    'c',
  ]);
  expect(sortSongs(rows, 'artist').map((row) => row.id)).toEqual([
    'b',
    'c',
    'a',
  ]);
  expect(sortSongs(rows, 'album').map((row) => row.id)).toEqual([
    'b',
    'c',
    'a',
  ]);
  expect(sortSongs(rows, 'duration').map((row) => row.id)).toEqual([
    'b',
    'c',
    'a',
  ]);
});

test('renders seeded songs and jumps through the rail', async () => {
  const { providers, db, close } = await testProviders();
  for (const [id, title] of [
    ['a', 'Apple'],
    ['m', 'Mango'],
    ['z', 'Zebra'],
  ] as const) {
    await db.runAsync(
      'INSERT INTO tracks (id, source, uri, title, artist, album, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id,
      'local',
      `content://${id}`,
      title,
      'Artist',
      'Album',
      180000,
    );
  }

  await render(SongsListComponent, { providers });

  expect(await screen.findByText('Apple')).toBeTruthy();
  expect(screen.getByText('Zebra')).toBeTruthy();

  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Artista' }));
  expect(screen.getByText('Mango')).toBeTruthy();

  await userEvent.setup().press(screen.getByRole('button', { name: 'Ir a Z' }));
  expect(screen.getByText('Zebra')).toBeTruthy();
  await close();
});
