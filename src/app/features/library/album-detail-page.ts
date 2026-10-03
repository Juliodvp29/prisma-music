import { Component, inject, input, signal } from '@angular/core';
import { Text, View } from '@ng-native/components';
import { AlbumRepository } from '../../core/library/repositories/album.repository.ts';
import type { AlbumRow } from '../../core/library/repositories/album.repository.ts';
import { TrackRepository } from '../../core/library/repositories/track.repository.ts';
import type { TrackRow } from '../../core/library/repositories/track.repository.ts';
import { SongsListComponent } from './songs-list.ts';

/** Album detail pushed over the tab bar. */
@Component({
  imports: [SongsListComponent, Text, View],
  selector: 'app-album-detail-page',
  template: `
    <view class="flex-1 bg-background p-5">
      <text class="font-sans text-title font-bold text-text">
        {{ album()?.title ?? '' }}
      </text>
      <text class="font-sans text-body text-text-secondary">
        {{ album()?.artist ?? '' }}
      </text>
      <app-songs-list [tracksInput]="songs()" />
    </view>
  `,
})
export class AlbumDetailPage {
  readonly id = input.required<string>();
  private readonly albums = inject(AlbumRepository);
  private readonly trackRepository = inject(TrackRepository);
  protected readonly album = signal<AlbumRow | null>(null);
  protected readonly songs = signal<readonly TrackRow[]>([]);

  async ngOnInit(): Promise<void> {
    this.album.set(await this.albums.getAlbum(this.id()));
    this.songs.set(await this.trackRepository.listTracksByAlbum(this.id()));
  }
}
