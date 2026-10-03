import type { EnvironmentProviders, Provider } from '@angular/core';
import { withComponentInputBinding } from '@angular/router';
import { provideNativeRouter } from '@ng-native/router';
import { render, screen } from '@ng-native/testing';
import { expect, test } from 'vitest';
import type { Db } from '../../core/library/library-db.ts';
import { testProviders } from '../../core/library/test-services.ts';
import { AlbumDetailPage } from './album-detail-page.ts';
import { AlbumsViewComponent } from './albums-view.ts';
import { ArtistDetailPage } from './artist-detail-page.ts';
import { ArtistsViewComponent } from './artists-view.ts';
import { FolderDetailPage } from './folder-detail-page.ts';
import { FoldersViewComponent } from './folders-view.ts';

async function seed(): Promise<{
  providers: (Provider | EnvironmentProviders)[];
  close: () => Promise<void>;
}> {
  const { providers, db, close } = await testProviders();
  await insertCatalog(db);
  return {
    providers: [
      ...providers,
      provideNativeRouter([], withComponentInputBinding()),
    ],
    close,
  };
}

async function insertCatalog(db: Db): Promise<void> {
  await db.runAsync("INSERT INTO artists (id, name) VALUES ('a1', 'Artist')");
  await db.runAsync(
    "INSERT INTO albums (id, source, source_id, title, artist) VALUES ('al1', 'local', '7', 'Album', 'Artist')",
  );
  await db.runAsync(
    `INSERT INTO tracks (id, source, device_id, uri, title, artist, album,
      album_id, duration_ms, folder)
      VALUES ('t1', 'local', '1', 'content://one', 'One', 'Artist', 'Album',
      'al1', 180000, 'Music/')`,
  );
}

test('browse views list albums, artists and folders', async () => {
  const { providers, close } = await seed();

  await render(AlbumsViewComponent, { providers });
  expect(await screen.findByText('Album')).toBeTruthy();

  await render(ArtistsViewComponent, { providers });
  expect(await screen.findByText('Artist')).toBeTruthy();

  await render(FoldersViewComponent, { providers });
  expect(await screen.findByText('Music/')).toBeTruthy();
  await close();
});

test('detail pages show their contents', async () => {
  const { providers, close } = await seed();

  await render(AlbumDetailPage, { inputs: { id: 'al1' }, providers });
  expect(await screen.findByText('One')).toBeTruthy();

  await render(ArtistDetailPage, { inputs: { id: 'a1' }, providers });
  expect(await screen.findByText('Album')).toBeTruthy();

  await render(FolderDetailPage, {
    inputs: { key: encodeURIComponent('Music/') },
    providers,
  });
  expect(await screen.findByText('One')).toBeTruthy();
  await close();
});
