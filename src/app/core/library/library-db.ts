import { InjectionToken } from '@angular/core';
import { database } from '@ng-native/expo/database';
import { migrations } from './schema.ts';

export interface Db {
  execAsync(source: string): Promise<void>;
  getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]>;
  getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null>;
  runAsync(
    source: string,
    ...params: unknown[]
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export const libraryDb = database('prisma-music.db', migrations);

/** Opens the library database (migrating first) and hands out one shared connection. */
export const LIBRARY_DB = new InjectionToken<() => Promise<Db>>('Library.db', {
  factory: () => () => libraryDb.ready(),
});
