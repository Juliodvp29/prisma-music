import { inject, Injectable } from '@angular/core';
import type { NativeScannedTrack } from 'prisma-audio';
import { NativeAudio } from '../playback/native-audio.ts';
import type {
  ScannedTrack,
  ScanProgress,
  TrackSource,
} from './track-source.ts';

function toScannedTrack(row: NativeScannedTrack): ScannedTrack {
  return {
    deviceId: String(row.deviceId),
    uri: row.uri,
    displayName: row.displayName,
    title: row.title,
    artist: row.artist,
    album: row.album,
    albumId: String(row.albumId),
    durationMs: row.durationMs,
    sizeBytes: row.sizeBytes,
    dateModified: row.dateModified,
    mimeType: row.mimeType,
    folder: row.folder,
  };
}

/** The `TrackSource` backed by MediaStore through `prisma-audio`. */
@Injectable({ providedIn: 'root' })
export class LocalTrackSource implements TrackSource {
  readonly source = 'local';

  private readonly native = inject(NativeAudio.NATIVE);

  async scan(
    onProgress?: (progress: ScanProgress) => void,
  ): Promise<readonly ScannedTrack[]> {
    const native = this.native;
    if (!native) {
      return [];
    }
    const subscription = native.addListener('onScanProgress', (event) =>
      onProgress?.({ scanned: event.scanned, total: event.total }),
    );
    try {
      const rows = await native.scanLibrary(500);
      return rows.map(toScannedTrack);
    } finally {
      subscription.remove();
    }
  }

  cancel(): void {
    this.native?.cancelScan();
  }
}
