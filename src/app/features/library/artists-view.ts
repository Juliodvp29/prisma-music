import { Component, inject, signal } from '@angular/core';
import { Text, View } from '@ng-native/components';
import { ArtistRepository } from '../../core/library/repositories/artist.repository.ts';
import type { ArtistRow } from '../../core/library/repositories/artist.repository.ts';
import { CollectionRowComponent } from '../../shared/ui/collection-row/collection-row.ts';

/** Artists browse list inside the library tab. */
@Component({
  imports: [CollectionRowComponent, Text, View],
  selector: 'app-artists-view',
  template: `
    <view class="flex-1">
      @for (artist of artists(); track artist.id) {
        <app-collection-row
          [title]="artist.name"
          [link]="['/artist', artist.id]"
        />
      } @empty {
        <text class="font-sans text-base text-text-secondary">
          Sin artistas todavía.
        </text>
      }
    </view>
  `,
})
export class ArtistsViewComponent {
  private readonly repository = inject(ArtistRepository);
  protected readonly artists = signal<readonly ArtistRow[]>([]);

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.artists.set(await this.repository.listArtists());
  }
}
