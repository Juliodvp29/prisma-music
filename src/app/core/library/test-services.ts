import type { Provider } from '@angular/core';
import { Crypto, type NativeCrypto } from '@ng-native/expo/crypto';
import { LIBRARY_DB, type Db } from './library-db.ts';
import { migrations } from './schema.ts';
import { openTestDb } from './test-db.ts';

const unused = (): never => {
  throw new Error('unused in tests');
};

/** Providers with a migrated in-memory database and deterministic UUIDs. */
export async function testProviders(): Promise<{
  providers: Provider[];
  db: Db;
  close: () => Promise<void>;
}> {
  const { db, close } = await openTestDb(migrations);
  let nextId = 0;
  const crypto: NativeCrypto = {
    randomUUID: () => `test-id-${(nextId += 1)}`,
    digestStringAsync: async () => unused(),
    digest: async () => unused(),
    getRandomBytes: () => unused(),
    getRandomBytesAsync: async () => unused(),
    getRandomValues: <T>(array: T): T => array,
  };
  return {
    providers: [
      { provide: LIBRARY_DB, useValue: () => Promise.resolve(db) },
      { provide: Crypto.SOURCE, useValue: crypto },
    ],
    db,
    close,
  };
}
