import { Component, inject } from '@angular/core';
import { Text } from '@ng-native/components';
import type { PermissionAnswer } from '@ng-native/device';
import { render, screen } from '@ng-native/testing';
import { expect, test } from 'vitest';
import type { NativePrismaAudio, NativeScannedTrack } from 'prisma-audio';
import { NativeAudio } from '../playback/native-audio.ts';
import { MediaAccessService } from './media-access.service.ts';
import { testProviders } from './test-services.ts';
import { ScanService } from './scan.service.ts';
import { TrackRepository } from './repositories/track.repository.ts';
import type { NewTrack } from './repositories/track.repository.ts';

function row(overrides: Partial<NativeScannedTrack>): NativeScannedTrack {
  return {
    deviceId: 1,
    uri: 'content://one',
    displayName: 'one.mp3',
    title: 'One',
    artist: 'Artist',
    album: 'Album',
    albumId: 7,
    durationMs: 180000,
    sizeBytes: 4096,
    dateModified: 1700000000,
    mimeType: 'audio/mpeg',
    folder: 'Music/',
    ...overrides,
  };
}

const METADATA = {
  title: 'One',
  artist: 'Artist',
  album: 'Album',
  albumArtist: null,
  genre: 'Rock',
  trackNumber: 1,
  discNumber: null,
  year: 2021,
  durationMs: 180000,
  bitrate: 320000,
  sampleRate: 44100,
  channelCount: 2,
  mimeType: 'audio/mpeg',
  artworkPath: '/cache/artwork/7.jpg',
};

const GRANTED: PermissionAnswer = {
  status: 'granted',
  granted: true,
  canAskAgain: true,
};

let scanner: ScanService;
let tracks: TrackRepository;
let access: MediaAccessService;

@Component({
  imports: [Text],
  selector: 'app-scan-probe',
  template: '<text>ready</text>',
})
class ScanProbe {
  constructor() {
    scanner = inject(ScanService);
    tracks = inject(TrackRepository);
    access = inject(MediaAccessService);
  }
}

function fakeNative(state: {
  rows: NativeScannedTrack[];
  failing: boolean;
  rejectScan?: (error: Error) => void;
}): NativePrismaAudio {
  return {
    hello: () => 'Hello from PrismaAudio',
    scanLibrary: async () => {
      if (state.failing) {
        throw new Error('no media');
      }
      if (state.rejectScan) {
        await new Promise<never>((_, reject) => {
          state.rejectScan = reject;
        });
      }
      return state.rows;
    },
    cancelScan: () => state.rejectScan?.(new Error('cancelled')),
    extractMetadata: async (uri: string) => ({
      ...METADATA,
      title: uri === 'content://two' ? 'Two' : 'One',
    }),
    addListener: () => ({ remove: () => {} }),
  };
}

async function renderScanner(options: {
  answer: PermissionAnswer;
  rows: NativeScannedTrack[];
  failing?: boolean;
}): Promise<() => Promise<void>> {
  const { providers, close } = await testProviders();
  const state = { rows: options.rows, failing: options.failing ?? false };
  await render(ScanProbe, {
    providers: [
      ...providers,
      {
        provide: MediaAccessService.PERMISSION,
        useValue: {
          check: async () => options.answer,
          request: async () => options.answer,
        },
      },
      { provide: NativeAudio.NATIVE, useValue: fakeNative(state) },
    ],
  });
  expect(await screen.findByText('ready')).toBeTruthy();
  await access.refresh();
  return close;
}

const STORED: NewTrack = {
  source: 'local',
  deviceId: 'old',
  uri: 'content://old',
  title: 'Old',
  artist: 'Artist',
  album: 'Album',
  albumId: null,
  genre: null,
  trackNumber: null,
  discNumber: null,
  year: null,
  durationMs: 100,
  sizeBytes: 100,
  dateModified: 100,
  mime: null,
  bitrate: null,
  sampleRate: null,
  channels: null,
  artworkPath: null,
  folder: null,
};

test('inserts scanned tracks with artists, albums and metadata', async () => {
  const close = await renderScanner({
    answer: GRANTED,
    rows: [row({}), row({ deviceId: 2, uri: 'content://two', title: 'Two' })],
  });

  await scanner.scan();

  expect(scanner.state()).toEqual({
    state: 'done',
    added: 2,
    updated: 0,
    removed: 0,
    total: 2,
  });
  const titles = (await tracks.listTracks()).map((track) => track.title);
  expect(titles.sort()).toEqual(['One', 'Two']);
  expect((await tracks.listTracks())[0]).toMatchObject({
    genre: 'Rock',
    sampleRate: 44100,
    artworkPath: '/cache/artwork/7.jpg',
  });
  await close();
});

test('detects added, changed and removed tracks', async () => {
  const close = await renderScanner({
    answer: GRANTED,
    rows: [
      row({
        deviceId: 9,
        uri: 'content://changed',
        dateModified: 200,
        sizeBytes: 200,
      }),
      row({ deviceId: 10, uri: 'content://fresh', title: 'Fresh' }),
    ],
  });
  await tracks.upsertTrack(STORED);
  await tracks.upsertTrack({
    ...STORED,
    deviceId: '9',
    uri: 'content://changed',
    title: 'Changed',
  });

  await scanner.scan();

  expect(scanner.state()).toEqual({
    state: 'done',
    added: 1,
    updated: 1,
    removed: 1,
    total: 2,
  });
  await close();
});

test('backfills folders onto rows scanned before folders existed', async () => {
  const close = await renderScanner({
    answer: GRANTED,
    rows: [row({ deviceId: 5, uri: 'content://five', folder: 'Music/' })],
  });
  await tracks.upsertTrack({
    ...STORED,
    deviceId: '5',
    uri: 'content://five',
    dateModified: 1700000000,
    sizeBytes: 4096,
  });

  await scanner.scan();

  expect(scanner.state()).toEqual({
    state: 'done',
    added: 0,
    updated: 1,
    removed: 0,
    total: 1,
  });
  await close();
});

test('refuses without access and reports failures', async () => {
  const denied: PermissionAnswer = {
    status: 'denied',
    granted: false,
    canAskAgain: false,
  };
  const close = await renderScanner({ answer: denied, rows: [] });

  await scanner.scan();

  expect(scanner.state()).toEqual({
    state: 'error',
    message: 'Se necesita acceso al audio para escanear.',
  });
  await close();

  const closeFailing = await renderScanner({
    answer: GRANTED,
    rows: [],
    failing: true,
  });

  await scanner.scan();

  expect(scanner.state()).toEqual({
    state: 'error',
    message: 'El escaneo falló. Inténtalo de nuevo.',
  });
  await closeFailing();
});
