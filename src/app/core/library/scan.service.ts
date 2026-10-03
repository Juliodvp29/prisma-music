import { inject, Injectable, signal } from '@angular/core';
import { LocalMetadataReader } from './local-metadata-reader.ts';
import { LocalTrackSource } from './local-track-source.ts';
import { MediaAccessService } from './media-access.service.ts';
import { AlbumRepository } from './repositories/album.repository.ts';
import { ArtistRepository } from './repositories/artist.repository.ts';
import { TrackRepository } from './repositories/track.repository.ts';
import type { ScannedTrack } from './track-source.ts';

export type ScanState =
  | { readonly state: 'idle' }
  | {
      readonly state: 'scanning';
      readonly scanned: number;
      readonly total: number;
    }
  | {
      readonly state: 'done';
      readonly added: number;
      readonly updated: number;
      readonly removed: number;
      readonly total: number;
    }
  | { readonly state: 'error'; readonly message: string };

function keyOf(source: string, deviceId: string | null, uri: string): string {
  return deviceId === null ? `${source}|uri:${uri}` : `${source}|${deviceId}`;
}

/** Full library refresh: permission gate, scan, diff, metadata, status. */
@Injectable({ providedIn: 'root' })
export class ScanService {
  private readonly access = inject(MediaAccessService);
  private readonly source = inject(LocalTrackSource);
  private readonly reader = inject(LocalMetadataReader);
  private readonly tracks = inject(TrackRepository);
  private readonly albums = inject(AlbumRepository);
  private readonly artists = inject(ArtistRepository);

  private readonly stateSignal = signal<ScanState>({ state: 'idle' });
  private cancelled = false;

  readonly state = this.stateSignal.asReadonly();

  async scan(): Promise<void> {
    if (this.access.status() !== 'granted') {
      this.stateSignal.set({
        state: 'error',
        message: 'Se necesita acceso al audio para escanear.',
      });
      return;
    }
    this.cancelled = false;
    this.stateSignal.set({ state: 'scanning', scanned: 0, total: 0 });
    try {
      const rows = await this.source.scan((progress) =>
        this.stateSignal.set({
          state: 'scanning',
          scanned: progress.scanned,
          total: progress.total,
        }),
      );
      const summary = await this.synchronize(rows);
      this.stateSignal.set({ state: 'done', ...summary });
    } catch {
      this.stateSignal.set(
        this.cancelled
          ? { state: 'idle' }
          : {
              state: 'error',
              message: 'El escaneo falló. Inténtalo de nuevo.',
            },
      );
      this.cancelled = false;
    }
  }

  cancel(): void {
    this.cancelled = true;
    this.source.cancel();
  }

  private async synchronize(rows: readonly ScannedTrack[]): Promise<{
    added: number;
    updated: number;
    removed: number;
    total: number;
  }> {
    const source = this.source.source;
    const stored = await this.tracks.listTracks();
    const storedByKey = new Map(
      stored.map((track) => [
        keyOf(track.source, track.deviceId, track.uri),
        track,
      ]),
    );
    let added = 0;
    let updated = 0;
    for (const row of rows) {
      const previous = storedByKey.get(keyOf(source, row.deviceId, row.uri));
      if (!previous) {
        await this.insertRow(source, row);
        added += 1;
      } else if (
        previous.dateModified !== row.dateModified ||
        previous.sizeBytes !== row.sizeBytes ||
        (previous.folder === null && row.folder !== null)
      ) {
        await this.insertRow(source, row);
        updated += 1;
      }
      storedByKey.delete(keyOf(source, row.deviceId, row.uri));
    }
    const removedIds = [...storedByKey.values()].map((track) => track.id);
    await this.tracks.removeByIds(removedIds);
    return {
      added,
      updated,
      removed: removedIds.length,
      total: await this.tracks.countTracks(),
    };
  }

  private async insertRow(source: string, row: ScannedTrack): Promise<void> {
    const metadata = await this.reader.read(row.uri, `album-${row.albumId}`);
    const title = metadata?.title ?? row.title;
    const artist = metadata?.artist ?? row.artist;
    const album = metadata?.album ?? row.album;
    await this.artists.upsertArtist(artist);
    const albumId = await this.albums.upsertAlbum({
      source,
      sourceId: row.albumId === '0' ? null : row.albumId,
      title: album,
      artist,
      artworkPath: metadata?.artworkPath ?? null,
    });
    await this.tracks.upsertTrack({
      source,
      deviceId: row.deviceId,
      uri: row.uri,
      title,
      artist,
      album,
      albumId,
      genre: metadata?.genre ?? null,
      trackNumber: metadata?.trackNumber ?? null,
      discNumber: metadata?.discNumber ?? null,
      year: metadata?.year ?? null,
      durationMs: metadata?.durationMs ?? row.durationMs,
      sizeBytes: row.sizeBytes,
      dateModified: row.dateModified,
      mime: metadata?.mimeType ?? row.mimeType,
      bitrate: metadata?.bitrate ?? null,
      sampleRate: metadata?.sampleRate ?? null,
      channels: metadata?.channelCount ?? null,
      artworkPath: metadata?.artworkPath ?? null,
      folder: row.folder,
    });
  }
}
