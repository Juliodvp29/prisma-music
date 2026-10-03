import { Component, inject, signal } from '@angular/core';
import { Pressable, Text } from '@ng-native/components';
import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test, vi } from 'vitest';
import type { NativePrismaAudio } from 'prisma-audio';
import { NativeAudio } from '../playback/native-audio.ts';
import { LocalTrackSource } from './local-track-source.ts';
import type { ScannedTrack } from './track-source.ts';

const ROW = {
  deviceId: 42,
  uri: 'content://media/external/audio/media/42',
  displayName: 'track.mp3',
  title: 'Track',
  artist: 'Artist',
  album: 'Album',
  albumId: 7,
  durationMs: 180000,
  sizeBytes: 4096,
  dateModified: 1700000000,
  mimeType: 'audio/mpeg',
  folder: 'Music/',
};

function fakeNative(): { module: NativePrismaAudio; cancelScan: () => void } {
  const cancelScan = vi.fn();
  const listeners = new Map<string, Array<(event: unknown) => void>>();
  const module: NativePrismaAudio = {
    hello: () => 'Hello from PrismaAudio',
    scanLibrary: async () => {
      listeners
        .get('onScanProgress')
        ?.forEach((emit) => emit({ scanned: 1, total: 1 }));
      return [ROW];
    },
    cancelScan,
    extractMetadata: async () => {
      throw new Error('no metadata in this test');
    },
    addListener: (event, listener) => {
      const list = listeners.get(event) ?? [];
      list.push(listener as (event: unknown) => void);
      listeners.set(event, list);
      return { remove: () => {} };
    },
  };
  return { module, cancelScan };
}

@Component({
  imports: [Pressable, Text],
  selector: 'app-scan-probe',
  template: `
    <pressable accessibilityRole="button" (press)="rescan()">
      <text>Scan</text>
    </pressable>
    <pressable accessibilityRole="button" (press)="stop()">
      <text>Stop</text>
    </pressable>
    <text>Tracks: {{ tracks().length }}</text>
    <text>First: {{ tracks()[0]?.title ?? 'none' }}</text>
    <text>Scanned: {{ scanned() }}</text>
  `,
})
class ScanProbe {
  private readonly source = inject(LocalTrackSource);
  protected readonly tracks = signal<readonly ScannedTrack[]>([]);
  protected readonly scanned = signal(-1);

  async rescan(): Promise<void> {
    this.tracks.set(
      await this.source.scan((update) => this.scanned.set(update.scanned)),
    );
  }

  stop(): void {
    this.source.cancel();
  }
}

test('maps scanned rows and reports progress', async () => {
  const { module } = fakeNative();
  await render(ScanProbe, {
    providers: [{ provide: NativeAudio.NATIVE, useValue: module }],
  });

  await userEvent.setup().press(screen.getByRole('button', { name: 'Scan' }));

  expect(await screen.findByText('Tracks: 1')).toBeTruthy();
  expect(screen.getByText('First: Track')).toBeTruthy();
  expect(screen.getByText('Scanned: 1')).toBeTruthy();
});

test('forwards cancel and scans nothing without the module', async () => {
  const { module, cancelScan } = fakeNative();
  await render(ScanProbe, {
    providers: [{ provide: NativeAudio.NATIVE, useValue: module }],
  });

  await userEvent.setup().press(screen.getByRole('button', { name: 'Stop' }));

  expect(cancelScan).toHaveBeenCalled();

  await render(ScanProbe, {
    providers: [{ provide: NativeAudio.NATIVE, useValue: null }],
  });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Scan' }));

  expect(await screen.findByText('Tracks: 0')).toBeTruthy();
});
