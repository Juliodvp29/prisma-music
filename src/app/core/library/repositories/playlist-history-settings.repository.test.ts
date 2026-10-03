import { Component, inject } from '@angular/core';
import { Text } from '@ng-native/components';
import { render, screen } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { testProviders } from '../test-services.ts';
import { HistoryRepository } from './history.repository.ts';
import { PlaylistRepository } from './playlist.repository.ts';
import { SettingsRepository } from './settings.repository.ts';
import { TrackRepository, type NewTrack } from './track.repository.ts';

const TRACK: NewTrack = {
  source: 'local',
  deviceId: '42',
  uri: 'content://media/external/audio/media/42',
  title: 'Track',
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
};

let tracks: TrackRepository;
let playlists: PlaylistRepository;
let history: HistoryRepository;
let settings: SettingsRepository;

@Component({
  imports: [Text],
  selector: 'app-collection-probe',
  template: '<text>ready</text>',
})
class CollectionProbe {
  constructor() {
    tracks = inject(TrackRepository);
    playlists = inject(PlaylistRepository);
    history = inject(HistoryRepository);
    settings = inject(SettingsRepository);
  }
}

test('manages playlist tracks in order', async () => {
  const { providers, close } = await testProviders();
  await render(CollectionProbe, { providers });
  expect(await screen.findByText('ready')).toBeTruthy();

  const first = await tracks.upsertTrack({ ...TRACK, deviceId: '1' });
  const second = await tracks.upsertTrack({ ...TRACK, deviceId: '2' });
  const id = await playlists.createPlaylist('Mix');
  await playlists.renamePlaylist(id, 'Renamed');
  expect((await playlists.listPlaylists())[0]).toMatchObject({
    id,
    name: 'Renamed',
    isSystem: false,
  });

  await playlists.addTrack(id, first);
  await playlists.addTrack(id, second);
  expect((await playlists.listTracks(id)).map((row) => row.deviceId)).toEqual([
    '1',
    '2',
  ]);

  await playlists.setTrackOrder(id, [second, first]);
  expect((await playlists.listTracks(id)).map((row) => row.deviceId)).toEqual([
    '2',
    '1',
  ]);

  await playlists.removeTrack(id, second);
  expect((await playlists.listTracks(id)).map((row) => row.deviceId)).toEqual([
    '1',
  ]);

  await playlists.deletePlaylist(id);
  expect(await playlists.listPlaylists()).toEqual([]);
  await close();
});

test('records and reads play history', async () => {
  const { providers, close } = await testProviders();
  await render(CollectionProbe, { providers });
  expect(await screen.findByText('ready')).toBeTruthy();

  const id = await tracks.upsertTrack(TRACK);
  await history.recordPlay(id, true);
  await history.recordPlay(id, false);

  const plays = await history.recentPlays(10);
  expect(plays).toHaveLength(2);
  expect(plays[0]).toMatchObject({ id, completed: false });
  expect(plays[1]).toMatchObject({ id, completed: true });

  await history.clearHistory();
  expect(await history.recentPlays(10)).toEqual([]);
  await close();
});

test('round-trips settings', async () => {
  const { providers, close } = await testProviders();
  await render(CollectionProbe, { providers });
  expect(await screen.findByText('ready')).toBeTruthy();

  expect(await settings.getSetting('theme')).toBeNull();
  await settings.setSetting('theme', 'dark');
  await settings.setSetting('theme', 'light');
  expect(await settings.getSetting('theme')).toBe('light');
  await close();
});
