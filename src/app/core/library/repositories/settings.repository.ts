import { inject, Injectable } from '@angular/core';
import { LIBRARY_DB } from '../library-db.ts';

@Injectable({ providedIn: 'root' })
export class SettingsRepository {
  private readonly openDb = inject(LIBRARY_DB);

  async getSetting(key: string): Promise<string | null> {
    const db = await this.openDb();
    const row = await db.getFirstAsync<{ value: string | null }>(
      'SELECT value FROM settings WHERE key = ?',
      key,
    );
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const db = await this.openDb();
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
      key,
      value,
    );
  }
}
