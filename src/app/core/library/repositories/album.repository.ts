import { inject, Injectable } from '@angular/core';
import { Crypto } from '@ng-native/expo/crypto';
import { LIBRARY_DB } from '../library-db.ts';

export interface AlbumRow {
  readonly id: string;
  readonly source: string;
  readonly sourceId: string | null;
  readonly title: string;
  readonly artist: string;
  readonly artworkPath: string | null;
}

export interface NewAlbum {
  readonly source: string;
  readonly sourceId: string | null;
  readonly title: string;
  readonly artist: string;
  readonly artworkPath: string | null;
}

@Injectable({ providedIn: 'root' })
export class AlbumRepository {
  private readonly openDb = inject(LIBRARY_DB);
  private readonly crypto = inject(Crypto);

  async upsertAlbum(album: NewAlbum): Promise<string> {
    const db = await this.openDb();
    const existing =
      album.sourceId === null
        ? await db.getFirstAsync<Pick<AlbumRow, 'id'>>(
            'SELECT id FROM albums WHERE source = ? AND title = ? AND artist = ?',
            album.source,
            album.title,
            album.artist,
          )
        : await db.getFirstAsync<Pick<AlbumRow, 'id'>>(
            'SELECT id FROM albums WHERE source = ? AND source_id = ?',
            album.source,
            album.sourceId,
          );
    if (existing) {
      await db.runAsync(
        'UPDATE albums SET title = ?, artist = ?, artwork_path = ? WHERE id = ?',
        album.title,
        album.artist,
        album.artworkPath,
        existing.id,
      );
      return existing.id;
    }
    const id = this.crypto.randomUUID();
    await db.runAsync(
      'INSERT INTO albums (id, source, source_id, title, artist, artwork_path) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      album.source,
      album.sourceId,
      album.title,
      album.artist,
      album.artworkPath,
    );
    return id;
  }

  async listAlbums(): Promise<readonly AlbumRow[]> {
    const db = await this.openDb();
    return db.getAllAsync<AlbumRow>(
      'SELECT id, source, source_id AS sourceId, title, artist, artwork_path AS artworkPath FROM albums ORDER BY title COLLATE NOCASE',
    );
  }

  async getAlbum(id: string): Promise<AlbumRow | null> {
    const db = await this.openDb();
    return db.getFirstAsync<AlbumRow>(
      'SELECT id, source, source_id AS sourceId, title, artist, artwork_path AS artworkPath FROM albums WHERE id = ?',
      id,
    );
  }
}
