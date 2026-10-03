import { Component, inject } from '@angular/core';
import { Text } from '@ng-native/components';
import { render, screen } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { testProviders } from '../test-services.ts';
import { TrackRepository, type NewTrack } from './track.repository.ts';

const TRACK: NewTrack = {
  source: 'local',
  deviceId: '42',
  uri: 'content://media/external/audio/media/42',
  title: 'Track',
  artist: 'Artist',
  album: 'Album',
  albumId: null,
  genre: 'Rock',
  trackNumber: 3,
  discNumber: 1,
  year: 2021,
  durationMs: 180000,
  sizeBytes: 4096,
  dateModified: 1700000000,
  mime: 'audio/mpeg',
  bitrate: 320000,
  sampleRate: 44100,
  channels: 2,
  artworkPath: '/cache/artwork/7.jpg',
};

let tracks: TrackRepository;

@Component({
  imports: [Text],
  selector: 'app-track-probe',
  template: '<text>ready</text>',
})
class TrackProbe {
  constructor() {
    tracks = inject(TrackRepository);
  }
}

test('inserts then updates the same device track', async () => {
  const { providers, close } = await testProviders();
  await render(TrackProbe, { providers });
  expect(await screen.findByText('ready')).toBeTruthy();

  const id = await tracks.upsertTrack(TRACK);
  expect(id).toBe('test-id-1');
  expect(await tracks.countTracks()).toBe(1);

  const same = await tracks.upsertTrack({ ...TRACK, title: 'Renamed' });
  expect(same).toBe(id);
  expect(await tracks.countTracks()).toBe(1);
  expect((await tracks.getTrack(id))?.title).toBe('Renamed');
  await close();
});

test('lists tracks ordered by title and removes by id', async () => {
  const { providers, close } = await testProviders();
  await render(TrackProbe, { providers });
  expect(await screen.findByText('ready')).toBeTruthy();

  const first = await tracks.upsertTrack({
    ...TRACK,
    deviceId: '1',
    uri: 'content://one',
    title: 'Zulu',
  });
  await tracks.upsertTrack({
    ...TRACK,
    deviceId: '2',
    uri: 'content://two',
    title: 'Alpha',
  });

  expect((await tracks.listTracks()).map((row) => row.title)).toEqual([
    'Alpha',
    'Zulu',
  ]);

  await tracks.removeByIds([first]);
  expect(await tracks.countTracks()).toBe(1);
  await close();
});
