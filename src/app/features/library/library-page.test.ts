import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import type { NativePrismaAudio } from 'prisma-audio';
import { NativeAudio } from '../../core/playback/native-audio.ts';
import { MediaAccessService } from '../../core/library/media-access.service.ts';
import { testProviders } from '../../core/library/test-services.ts';
import { LibraryPage } from './library-page.ts';

function fakeNative(): NativePrismaAudio {
  return {
    hello: () => 'Hello from PrismaAudio',
    scanLibrary: async () => [
      {
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
      },
    ],
    cancelScan: () => {},
    extractMetadata: async () => ({
      title: null,
      artist: null,
      album: null,
      albumArtist: null,
      genre: null,
      trackNumber: null,
      discNumber: null,
      year: null,
      durationMs: 180000,
      bitrate: null,
      sampleRate: null,
      channelCount: null,
      mimeType: null,
      artworkPath: null,
    }),
    addListener: () => ({ remove: () => {} }),
  };
}

test('scans from the library page and shows the summary', async () => {
  const { providers, close } = await testProviders();
  await render(LibraryPage, {
    providers: [
      ...providers,
      {
        provide: MediaAccessService.PERMISSION,
        useValue: {
          check: async () => ({
            status: 'granted',
            granted: true,
            canAskAgain: true,
          }),
          request: async () => ({
            status: 'granted',
            granted: true,
            canAskAgain: true,
          }),
        },
      },
      { provide: NativeAudio.NATIVE, useValue: fakeNative() },
    ],
  });

  expect(await screen.findByText('Biblioteca')).toBeTruthy();

  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Escanear' }));

  expect(
    await screen.findByText(
      '1 canciones · 1 nuevas · 0 actualizadas · 0 eliminadas',
    ),
  ).toBeTruthy();
  await close();
});
