import { inject, Injectable } from '@angular/core';
import { Crypto } from '@ng-native/expo/crypto';
import { LIBRARY_DB } from '../library-db.ts';
import type { TrackRow } from './track.repository.ts';

export interface PlaylistRow {
  readonly id: string;
  readonly name: string;
  readonly isSystem: boolean;
  readonly createdAt: number;
}

export interface PlaylistTrackRow extends TrackRow {
  readonly position: number;
}

@Injectable({ providedIn: 'root' })
export class PlaylistRepository {
  private readonly openDb = inject(LIBRARY_DB);
  private readonly crypto = inject(Crypto);

  async createPlaylist(name: string): Promise<string> {
    const db = await this.openDb();
    const id = this.crypto.randomUUID();
    await db.runAsync(
      'INSERT INTO playlists (id, name, is_system, created_at) VALUES (?, ?, 0, ?)',
      id,
      name,
      Date.now(),
    );
    return id;
  }

  async renamePlaylist(id: string, name: string): Promise<void> {
    const db = await this.openDb();
    await db.runAsync('UPDATE playlists SET name = ? WHERE id = ?', name, id);
  }

  async deletePlaylist(id: string): Promise<void> {
    const db = await this.openDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'DELETE FROM playlist_tracks WHERE playlist_id = ?',
        id,
      );
      await db.runAsync('DELETE FROM playlists WHERE id = ?', id);
    });
  }

  async listPlaylists(): Promise<readonly PlaylistRow[]> {
    const db = await this.openDb();
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      is_system: number;
      created_at: number;
    }>(
      'SELECT id, name, is_system, created_at FROM playlists ORDER BY created_at, id',
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      isSystem: row.is_system === 1,
      createdAt: row.created_at,
    }));
  }

  async addTrack(playlistId: string, trackId: string): Promise<void> {
    const db = await this.openDb();
    await db.withTransactionAsync(async () => {
      const row = await db.getFirstAsync<{ position: number | null }>(
        'SELECT MAX(position) AS position FROM playlist_tracks WHERE playlist_id = ?',
        playlistId,
      );
      await db.runAsync(
        'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)',
        playlistId,
        trackId,
        (row?.position ?? -1) + 1,
      );
    });
  }

  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    const db = await this.openDb();
    await db.withTransactionAsync(async () => {
      const row = await db.getFirstAsync<{ position: number }>(
        'SELECT position FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
        playlistId,
        trackId,
      );
      if (!row) {
        return;
      }
      await db.runAsync(
        'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
        playlistId,
        trackId,
      );
      await db.runAsync(
        'UPDATE playlist_tracks SET position = position - 1 WHERE playlist_id = ? AND position > ?',
        playlistId,
        row.position,
      );
    });
  }

  async setTrackOrder(
    playlistId: string,
    trackIds: readonly string[],
  ): Promise<void> {
    const db = await this.openDb();
    await db.withTransactionAsync(async () => {
      for (const [position, trackId] of trackIds.entries()) {
        await db.runAsync(
          'UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?',
          position,
          playlistId,
          trackId,
        );
      }
    });
  }

  async listTracks(playlistId: string): Promise<readonly PlaylistTrackRow[]> {
    const db = await this.openDb();
    return db.getAllAsync<PlaylistTrackRow>(
      `SELECT t.id, t.source, t.device_id AS deviceId, t.uri, t.title,
        t.artist, t.album, t.album_id AS albumId, t.genre,
        t.track_number AS trackNumber, t.disc_number AS discNumber, t.year,
        t.duration_ms AS durationMs, t.size_bytes AS sizeBytes,
        t.date_modified AS dateModified, t.mime, t.bitrate,
        t.sample_rate AS sampleRate, t.channels, t.artwork_path AS artworkPath,
        pt.position AS position
        FROM playlist_tracks pt JOIN tracks t ON t.id = pt.track_id
        WHERE pt.playlist_id = ? ORDER BY pt.position`,
      playlistId,
    );
  }
}
