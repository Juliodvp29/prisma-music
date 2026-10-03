import { Component, inject } from '@angular/core';
import { Text } from '@ng-native/components';
import { render, screen } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { testProviders } from '../test-services.ts';
import { AlbumRepository } from './album.repository.ts';
import { ArtistRepository } from './artist.repository.ts';

let albums: AlbumRepository;
let artists: ArtistRepository;

@Component({
  imports: [Text],
  selector: 'app-catalog-probe',
  template: '<text>ready</text>',
})
class CatalogProbe {
  constructor() {
    albums = inject(AlbumRepository);
    artists = inject(ArtistRepository);
  }
}

test('upserts albums by device id and artists by name', async () => {
  const { providers, close } = await testProviders();
  await render(CatalogProbe, { providers });
  expect(await screen.findByText('ready')).toBeTruthy();

  const albumId = await albums.upsertAlbum({
    source: 'local',
    sourceId: '7',
    title: 'Album',
    artist: 'Artist',
    artworkPath: null,
  });
  expect(
    await albums.upsertAlbum({
      source: 'local',
      sourceId: '7',
      title: 'Renamed',
      artist: 'Artist',
      artworkPath: '/cache/artwork/7.jpg',
    }),
  ).toBe(albumId);
  expect((await albums.getAlbum(albumId))?.artworkPath).toBe(
    '/cache/artwork/7.jpg',
  );
  expect((await albums.listAlbums()).map((row) => row.title)).toEqual([
    'Renamed',
  ]);

  const artistId = await artists.upsertArtist('Artist');
  expect(await artists.upsertArtist('Artist')).toBe(artistId);
  expect((await artists.listArtists()).map((row) => row.name)).toEqual([
    'Artist',
  ]);
  await close();
});
