import { inject, Injectable } from '@angular/core';
import { LIBRARY_DB } from '../library-db.ts';
import type { TrackRow } from './track.repository.ts';

export interface HistoryEntry extends TrackRow {
  readonly playedAt: number;
  readonly completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class HistoryRepository {
  private readonly openDb = inject(LIBRARY_DB);

  async recordPlay(trackId: string, completed: boolean): Promise<void> {
    const db = await this.openDb();
    await db.runAsync(
      'INSERT INTO history (track_id, played_at, completed) VALUES (?, ?, ?)',
      trackId,
      Date.now(),
      completed ? 1 : 0,
    );
  }

  async recentPlays(limit: number): Promise<readonly HistoryEntry[]> {
    const db = await this.openDb();
    const rows = await db.getAllAsync<
      TrackRow & { played_at: number; completed: number }
    >(
      `SELECT t.id, t.source, t.device_id AS deviceId, t.uri, t.title,
        t.artist, t.album, t.album_id AS albumId, t.genre,
        t.track_number AS trackNumber, t.disc_number AS discNumber, t.year,
        t.duration_ms AS durationMs, t.size_bytes AS sizeBytes,
        t.date_modified AS dateModified, t.mime, t.bitrate,
        t.sample_rate AS sampleRate, t.channels, t.artwork_path AS artworkPath,
        h.played_at, h.completed
        FROM history h JOIN tracks t ON t.id = h.track_id
        ORDER BY h.played_at DESC, h.id DESC LIMIT ?`,
      limit,
    );
    return rows.map((row) => ({
      ...row,
      playedAt: row.played_at,
      completed: row.completed === 1,
    }));
  }

  async clearHistory(): Promise<void> {
    const db = await this.openDb();
    await db.runAsync('DELETE FROM history');
  }
}
