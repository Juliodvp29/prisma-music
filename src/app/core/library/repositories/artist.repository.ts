import { inject, Injectable } from '@angular/core';
import { Crypto } from '@ng-native/expo/crypto';
import { LIBRARY_DB } from '../library-db.ts';
import { likePattern } from './search-utils.ts';

export interface ArtistRow {
  readonly id: string;
  readonly name: string;
}

@Injectable({ providedIn: 'root' })
export class ArtistRepository {
  private readonly openDb = inject(LIBRARY_DB);
  private readonly crypto = inject(Crypto);

  async upsertArtist(name: string): Promise<string> {
    const db = await this.openDb();
    const existing = await db.getFirstAsync<Pick<ArtistRow, 'id'>>(
      'SELECT id FROM artists WHERE name = ?',
      name,
    );
    if (existing) {
      return existing.id;
    }
    const id = this.crypto.randomUUID();
    await db.runAsync('INSERT INTO artists (id, name) VALUES (?, ?)', id, name);
    return id;
  }

  async listArtists(): Promise<readonly ArtistRow[]> {
    const db = await this.openDb();
    return db.getAllAsync<ArtistRow>(
      'SELECT id, name FROM artists ORDER BY name COLLATE NOCASE',
    );
  }

  async getArtist(id: string): Promise<ArtistRow | null> {
    const db = await this.openDb();
    return db.getFirstAsync<ArtistRow>(
      'SELECT id, name FROM artists WHERE id = ?',
      id,
    );
  }

  async searchArtists(
    query: string,
    limit: number,
  ): Promise<readonly ArtistRow[]> {
    const db = await this.openDb();
    return db.getAllAsync<ArtistRow>(
      `SELECT id, name FROM artists WHERE name LIKE ? ESCAPE '\\'
        ORDER BY name COLLATE NOCASE LIMIT ?`,
      likePattern(query),
      limit,
    );
  }
}
