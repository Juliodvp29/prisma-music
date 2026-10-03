import { Component, DestroyRef, inject, signal } from '@angular/core';
import { SafeAreaView, Text, TextInput } from '@ng-native/components';
import { AlbumRepository } from '../../core/library/repositories/album.repository.ts';
import type { AlbumRow } from '../../core/library/repositories/album.repository.ts';
import { ArtistRepository } from '../../core/library/repositories/artist.repository.ts';
import type { ArtistRow } from '../../core/library/repositories/artist.repository.ts';
import { TrackRepository } from '../../core/library/repositories/track.repository.ts';
import type { TrackRow } from '../../core/library/repositories/track.repository.ts';
import { CollectionRowComponent } from '../../shared/ui/collection-row/collection-row.ts';
import { TrackRowComponent } from '../../shared/ui/track-row/track-row.ts';

/** Local search across songs, albums and artists with debounced input. */
@Component({
  imports: [
    CollectionRowComponent,
    SafeAreaView,
    Text,
    TextInput,
    TrackRowComponent,
  ],
  selector: 'app-search-page',
  template: `
    <safe-area-view [edges]="['top']" class="flex-1 bg-background p-5">
      <text-input
        [(value)]="query"
        (changeText)="scheduleSearch($event)"
        placeholder="Buscar canciones, álbumes y artistas"
        returnKeyType="search"
        accessibilityLabel="Buscar en tu biblioteca"
        class="rounded-full bg-surface-elevated px-5 py-3 font-sans text-body text-text"
      />
      @if (searched() === '') {
        <text class="pt-4 font-sans text-base text-text-secondary">
          Busca en tu biblioteca.
        </text>
      } @else {
        @if (hasResults()) {
          @if (tracks().length > 0) {
            <text class="pt-4 font-sans text-headline font-semibold text-text">
              Canciones
            </text>
            @for (track of tracks(); track track.id) {
              <app-track-row
                [title]="track.title"
                [artist]="track.artist"
                [album]="track.album"
                [durationMs]="track.durationMs"
                [artworkPath]="track.artworkPath"
              />
            }
          }
          @if (albums().length > 0) {
            <text class="pt-4 font-sans text-headline font-semibold text-text">
              Álbumes
            </text>
            @for (album of albums(); track album.id) {
              <app-collection-row
                [title]="album.title"
                [subtitle]="album.artist"
                [artworkPath]="album.artworkPath"
                [link]="['/album', album.id]"
              />
            }
          }
          @if (artists().length > 0) {
            <text class="pt-4 font-sans text-headline font-semibold text-text">
              Artistas
            </text>
            @for (artist of artists(); track artist.id) {
              <app-collection-row
                [title]="artist.name"
                [link]="['/artist', artist.id]"
              />
            }
          }
        } @else {
          <text class="pt-4 font-sans text-base text-text-secondary">
            Sin resultados para "{{ searched() }}".
          </text>
        }
      }
    </safe-area-view>
  `,
})
export class SearchPage {
  protected readonly query = signal('');
  protected readonly searched = signal('');
  protected readonly tracks = signal<readonly TrackRow[]>([]);
  protected readonly albums = signal<readonly AlbumRow[]>([]);
  protected readonly artists = signal<readonly ArtistRow[]>([]);

  private readonly trackRepository = inject(TrackRepository);
  private readonly albumRepository = inject(AlbumRepository);
  private readonly artistRepository = inject(ArtistRepository);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected hasResults(): boolean {
    return (
      this.tracks().length > 0 ||
      this.albums().length > 0 ||
      this.artists().length > 0
    );
  }

  protected scheduleSearch(query: string): void {
    clearTimeout(this.timer);
    const trimmed = query.trim();
    if (trimmed === '') {
      this.searched.set('');
      this.tracks.set([]);
      this.albums.set([]);
      this.artists.set([]);
      return;
    }
    this.timer = setTimeout(() => void this.runSearch(trimmed), 300);
  }

  private async runSearch(query: string): Promise<void> {
    const [tracks, albums, artists] = await Promise.all([
      this.trackRepository.searchTracks(query, 50),
      this.albumRepository.searchAlbums(query, 20),
      this.artistRepository.searchArtists(query, 20),
    ]);
    this.tracks.set(tracks);
    this.albums.set(albums);
    this.artists.set(artists);
    this.searched.set(query);
  }
}
