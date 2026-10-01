import { inject, Injectable } from '@angular/core';
import { NativeAudio } from '../playback/native-audio.ts';
import type { TrackMetadata } from './track-metadata.ts';

/** Reads file metadata through `prisma-audio`. Artwork arrives cached. */
@Injectable({ providedIn: 'root' })
export class LocalMetadataReader {
  private readonly native = inject(NativeAudio.NATIVE);

  async read(uri: string, artworkKey: string): Promise<TrackMetadata | null> {
    const native = this.native;
    if (!native) {
      return null;
    }
    try {
      return await native.extractMetadata(uri, artworkKey);
    } catch {
      return null;
    }
  }
}
