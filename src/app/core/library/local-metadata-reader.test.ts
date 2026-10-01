import { Component, inject, signal } from '@angular/core';
import { Pressable, Text } from '@ng-native/components';
import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import type { NativePrismaAudio, NativeTrackMetadata } from 'prisma-audio';
import { NativeAudio } from '../playback/native-audio.ts';
import { LocalMetadataReader } from './local-metadata-reader.ts';

const METADATA: NativeTrackMetadata = {
  title: 'Track',
  artist: 'Artist',
  album: 'Album',
  albumArtist: null,
  genre: 'Rock',
  trackNumber: 3,
  discNumber: 1,
  year: 2021,
  durationMs: 180000,
  bitrate: 320000,
  sampleRate: 44100,
  channelCount: 2,
  mimeType: 'audio/mpeg',
  artworkPath: '/cache/artwork/7.jpg',
};

function fakeNative(
  metadata: NativeTrackMetadata | null,
  failing: boolean,
): NativePrismaAudio {
  return {
    hello: () => 'Hello from PrismaAudio',
    scanLibrary: async () => [],
    cancelScan: () => {},
    extractMetadata: async () => {
      if (failing || !metadata) {
        throw new Error('unreadable');
      }
      return metadata;
    },
    addListener: () => ({ remove: () => {} }),
  };
}

@Component({
  imports: [Pressable, Text],
  selector: 'app-metadata-probe',
  template: `
    <pressable accessibilityRole="button" (press)="read()">
      <text>Read</text>
    </pressable>
    <text>Title: {{ metadata()?.title ?? 'none' }}</text>
    <text>Format: {{ metadata()?.sampleRate ?? 'none' }}</text>
    <text>Artwork: {{ metadata()?.artworkPath ?? 'none' }}</text>
  `,
})
class MetadataProbe {
  private readonly reader = inject(LocalMetadataReader);
  protected readonly metadata = signal<NativeTrackMetadata | null>(null);

  async read(): Promise<void> {
    this.metadata.set(await this.reader.read('content://track', '7'));
  }
}

test('returns metadata with cached artwork', async () => {
  await render(MetadataProbe, {
    providers: [
      { provide: NativeAudio.NATIVE, useValue: fakeNative(METADATA, false) },
    ],
  });

  await userEvent.setup().press(screen.getByRole('button', { name: 'Read' }));

  expect(await screen.findByText('Title: Track')).toBeTruthy();
  expect(screen.getByText('Format: 44100')).toBeTruthy();
  expect(screen.getByText('Artwork: /cache/artwork/7.jpg')).toBeTruthy();
});

test('returns null without the module or on unreadable files', async () => {
  await render(MetadataProbe, {
    providers: [{ provide: NativeAudio.NATIVE, useValue: null }],
  });

  await userEvent.setup().press(screen.getByRole('button', { name: 'Read' }));

  expect(await screen.findByText('Title: none')).toBeTruthy();

  await render(MetadataProbe, {
    providers: [
      { provide: NativeAudio.NATIVE, useValue: fakeNative(null, true) },
    ],
  });

  await userEvent.setup().press(screen.getByRole('button', { name: 'Read' }));

  expect(await screen.findByText('Title: none')).toBeTruthy();
});
