import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { Migration } from '@ng-native/expo/database';
import type { Db } from './library-db.ts';

class TestDb implements Db {
  constructor(private readonly sqlite: DatabaseSync) {}

  async execAsync(source: string): Promise<void> {
    this.sqlite.exec(source);
  }

  async getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]> {
    return this.sqlite
      .prepare(source)
      .all(...(params as SQLInputValue[])) as T[];
  }

  async getFirstAsync<T>(
    source: string,
    ...params: unknown[]
  ): Promise<T | null> {
    return (
      (this.sqlite.prepare(source).get(...(params as SQLInputValue[])) as
        T | undefined) ?? null
    );
  }

  async runAsync(
    source: string,
    ...params: unknown[]
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const result = this.sqlite
      .prepare(source)
      .run(...(params as SQLInputValue[]));
    return {
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    };
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.sqlite.exec('BEGIN');
    try {
      await task();
      this.sqlite.exec('COMMIT');
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      throw error;
    }
  }

  async closeAsync(): Promise<void> {
    this.sqlite.close();
  }

  userVersion(): number {
    const row = this.sqlite.prepare('PRAGMA user_version').get() as {
      user_version: number;
    };
    return row.user_version;
  }

  setUserVersion(version: number): void {
    this.sqlite.exec(`PRAGMA user_version = ${version}`);
  }
}

/**
 * Opens an in-memory database and applies the app migrations the same way
 * the framework does (ordered, versioned, skipped when already applied).
 */
export async function openTestDb(
  migrationList: readonly Migration[],
): Promise<{ db: Db; close: () => Promise<void> }> {
  const sqlite = new DatabaseSync(':memory:');
  const db = new TestDb(sqlite);
  for (const migration of migrationList) {
    if (migration.to > db.userVersion()) {
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        db.setUserVersion(migration.to);
      });
    }
  }
  return { db, close: () => db.closeAsync() };
}
