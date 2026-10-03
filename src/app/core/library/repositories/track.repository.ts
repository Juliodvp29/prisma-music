import { inject, Injectable } from '@angular/core';
import { Crypto } from '@ng-native/expo/crypto';
import { LIBRARY_DB } from '../library-db.ts';
import { likePattern } from './search-utils.ts';

export interface TrackRow {
  readonly id: string;
  readonly source: string;
  readonly deviceId: string | null;
  readonly uri: string;
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly albumId: string | null;
  readonly genre: string | null;
  readonly trackNumber: number | null;
  readonly discNumber: number | null;
  readonly year: number | null;
  readonly durationMs: number;
  readonly sizeBytes: number | null;
  readonly dateModified: number | null;
  readonly mime: string | null;
  readonly bitrate: number | null;
  readonly sampleRate: number | null;
  readonly channels: number | null;
  readonly artworkPath: string | null;
  readonly folder: string | null;
}

export type NewTrack = Omit<TrackRow, 'id'>;

const COLUMNS = `id, source, device_id AS deviceId, uri, title, artist, album,
  album_id AS albumId, genre, track_number AS trackNumber, disc_number AS discNumber,
  year, duration_ms AS durationMs, size_bytes AS sizeBytes,
  date_modified AS dateModified, mime, bitrate, sample_rate AS sampleRate,
  channels, artwork_path AS artworkPath, folder`;

@Injectable({ providedIn: 'root' })
export class TrackRepository {
  private readonly openDb = inject(LIBRARY_DB);
  private readonly crypto = inject(Crypto);

  async upsertTrack(track: NewTrack): Promise<string> {
    const db = await this.openDb();
    const existing =
      track.deviceId === null
        ? await db.getFirstAsync<Pick<TrackRow, 'id'>>(
            'SELECT id FROM tracks WHERE source = ? AND uri = ?',
            track.source,
            track.uri,
          )
        : await db.getFirstAsync<Pick<TrackRow, 'id'>>(
            'SELECT id FROM tracks WHERE source = ? AND device_id = ?',
            track.source,
            track.deviceId,
          );
    if (existing) {
      await db.runAsync(
        `UPDATE tracks SET uri = ?, title = ?, artist = ?, album = ?,
          album_id = ?, genre = ?, track_number = ?, disc_number = ?, year = ?,
          duration_ms = ?, size_bytes = ?, date_modified = ?, mime = ?,
          bitrate = ?, sample_rate = ?, channels = ?, artwork_path = ?,
          folder = ?
          WHERE id = ?`,
        track.uri,
        track.title,
        track.artist,
        track.album,
        track.albumId,
        track.genre,
        track.trackNumber,
        track.discNumber,
        track.year,
        track.durationMs,
        track.sizeBytes,
        track.dateModified,
        track.mime,
        track.bitrate,
        track.sampleRate,
        track.channels,
        track.artworkPath,
        track.folder,
        existing.id,
      );
      return existing.id;
    }
    const id = this.crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO tracks (id, source, device_id, uri, title, artist, album,
        album_id, genre, track_number, disc_number, year, duration_ms,
        size_bytes, date_modified, mime, bitrate, sample_rate, channels,
        artwork_path, folder)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      track.source,
      track.deviceId,
      track.uri,
      track.title,
      track.artist,
      track.album,
      track.albumId,
      track.genre,
      track.trackNumber,
      track.discNumber,
      track.year,
      track.durationMs,
      track.sizeBytes,
      track.dateModified,
      track.mime,
      track.bitrate,
      track.sampleRate,
      track.channels,
      track.artworkPath,
      track.folder,
    );
    return id;
  }

  async listTracks(): Promise<readonly TrackRow[]> {
    const db = await this.openDb();
    return db.getAllAsync<TrackRow>(
      `SELECT ${COLUMNS} FROM tracks ORDER BY title COLLATE NOCASE`,
    );
  }

  async getTrack(id: string): Promise<TrackRow | null> {
    const db = await this.openDb();
    return db.getFirstAsync<TrackRow>(
      `SELECT ${COLUMNS} FROM tracks WHERE id = ?`,
      id,
    );
  }

  async removeByIds(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const db = await this.openDb();
    await db.runAsync(
      `DELETE FROM tracks WHERE id IN (${ids.map(() => '?').join(', ')})`,
      ...ids,
    );
  }

  async countTracks(): Promise<number> {
    const db = await this.openDb();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM tracks',
    );
    return row?.count ?? 0;
  }

  async listFolders(): Promise<readonly string[]> {
    const db = await this.openDb();
    const rows = await db.getAllAsync<{ folder: string }>(
      'SELECT DISTINCT folder FROM tracks WHERE folder IS NOT NULL ORDER BY folder',
    );
    return rows.map((row) => row.folder);
  }

  async listTracksByFolder(folder: string): Promise<readonly TrackRow[]> {
    const db = await this.openDb();
    return db.getAllAsync<TrackRow>(
      `SELECT ${COLUMNS} FROM tracks WHERE folder = ? ORDER BY title COLLATE NOCASE`,
      folder,
    );
  }

  async listTracksByAlbum(albumId: string): Promise<readonly TrackRow[]> {
    const db = await this.openDb();
    return db.getAllAsync<TrackRow>(
      `SELECT ${COLUMNS} FROM tracks WHERE album_id = ? ORDER BY track_number, title COLLATE NOCASE`,
      albumId,
    );
  }

  async listTracksByArtist(artist: string): Promise<readonly TrackRow[]> {
    const db = await this.openDb();
    return db.getAllAsync<TrackRow>(
      `SELECT ${COLUMNS} FROM tracks WHERE artist = ? ORDER BY album, track_number, title COLLATE NOCASE`,
      artist,
    );
  }

  async searchTracks(
    query: string,
    limit: number,
  ): Promise<readonly TrackRow[]> {
    const db = await this.openDb();
    const pattern = likePattern(query);
    return db.getAllAsync<TrackRow>(
      `SELECT ${COLUMNS} FROM tracks
        WHERE title LIKE ? ESCAPE '\\' OR artist LIKE ? ESCAPE '\\' OR album LIKE ? ESCAPE '\\'
        ORDER BY title COLLATE NOCASE LIMIT ?`,
      pattern,
      pattern,
      pattern,
      limit,
    );
  }
}
