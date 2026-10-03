import { Component, inject, signal } from '@angular/core';
import { Text, View } from '@ng-native/components';
import { AlbumRepository } from '../../core/library/repositories/album.repository.ts';
import type { AlbumRow } from '../../core/library/repositories/album.repository.ts';
import { CollectionRowComponent } from '../../shared/ui/collection-row/collection-row.ts';

/** Albums browse list inside the library tab. */
@Component({
  imports: [CollectionRowComponent, Text, View],
  selector: 'app-albums-view',
  template: `
    <view class="flex-1">
      @for (album of albums(); track album.id) {
        <app-collection-row
          [title]="album.title"
          [subtitle]="album.artist"
          [artworkPath]="album.artworkPath"
          [link]="['/album', album.id]"
        />
      } @empty {
        <text class="font-sans text-base text-text-secondary">
          Sin álbumes todavía.
        </text>
      }
    </view>
  `,
})
export class AlbumsViewComponent {
  private readonly repository = inject(AlbumRepository);
  protected readonly albums = signal<readonly AlbumRow[]>([]);

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.albums.set(await this.repository.listAlbums());
  }
}
