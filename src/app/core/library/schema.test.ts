import { expect, test } from 'vitest';
import { migrations } from './schema.ts';
import { openTestDb } from './test-db.ts';

test('v1 creates every table', async () => {
  const { db, close } = await openTestDb(migrations);

  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );

  expect(tables.map((row) => row.name).sort()).toEqual([
    'albums',
    'artists',
    'history',
    'playlist_tracks',
    'playlists',
    'settings',
    'tracks',
  ]);

  const columns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(tracks)',
  );
  expect(columns.map((column) => column.name)).toContain('folder');
  await close();
});
