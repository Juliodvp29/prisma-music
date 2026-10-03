import { Component, inject, input, signal } from '@angular/core';
import { Text, View } from '@ng-native/components';
import { ArtistRepository } from '../../core/library/repositories/artist.repository.ts';
import type { ArtistRow } from '../../core/library/repositories/artist.repository.ts';
import { AlbumRepository } from '../../core/library/repositories/album.repository.ts';
import type { AlbumRow } from '../../core/library/repositories/album.repository.ts';
import { TrackRepository } from '../../core/library/repositories/track.repository.ts';
import type { TrackRow } from '../../core/library/repositories/track.repository.ts';
import { CollectionRowComponent } from '../../shared/ui/collection-row/collection-row.ts';
import { SongsListComponent } from './songs-list.ts';

/** Artist detail pushed over the tab bar. */
@Component({
  imports: [CollectionRowComponent, SongsListComponent, Text, View],
  selector: 'app-artist-detail-page',
  template: `
    <view class="flex-1 bg-background p-5">
      <text class="font-sans text-title font-bold text-text">
        {{ artist()?.name ?? '' }}
      </text>
      @for (album of albumRows(); track album.id) {
        <app-collection-row
          [title]="album.title"
          [subtitle]="album.artist"
          [artworkPath]="album.artworkPath"
          [link]="['/album', album.id]"
        />
      }
      <app-songs-list [tracksInput]="songs()" />
    </view>
  `,
})
export class ArtistDetailPage {
  readonly id = input.required<string>();
  private readonly artists = inject(ArtistRepository);
  private readonly albumRepository = inject(AlbumRepository);
  private readonly trackRepository = inject(TrackRepository);
  protected readonly artist = signal<ArtistRow | null>(null);
  protected readonly albumRows = signal<readonly AlbumRow[]>([]);
  protected readonly songs = signal<readonly TrackRow[]>([]);

  async ngOnInit(): Promise<void> {
    const artist = await this.artists.getArtist(this.id());
    this.artist.set(artist);
    if (artist) {
      this.albumRows.set(
        await this.albumRepository.listAlbumsByArtist(artist.name),
      );
      this.songs.set(
        await this.trackRepository.listTracksByArtist(artist.name),
      );
    }
  }
}
