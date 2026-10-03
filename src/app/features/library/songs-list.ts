import { Component, computed, inject, input, signal } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { VirtualList, VirtualListRow } from '@ng-native/components';
import { TrackRepository } from '../../core/library/repositories/track.repository.ts';
import type { TrackRow } from '../../core/library/repositories/track.repository.ts';
import { TrackRowComponent } from '../../shared/ui/track-row/track-row.ts';

export type SongSort = 'title' | 'artist' | 'album' | 'duration';

const SORT_LABELS: Readonly<Record<SongSort, string>> = {
  title: 'Título',
  artist: 'Artista',
  album: 'Álbum',
  duration: 'Duración',
};

const SORTS: readonly SongSort[] = ['title', 'artist', 'album', 'duration'];

/** Virtualized song list with sorting and an A-Z fast-scroll rail. */
@Component({
  imports: [
    Pressable,
    Text,
    View,
    VirtualList,
    VirtualListRow,
    TrackRowComponent,
  ],
  selector: 'app-songs-list',
  template: `
    <view class="flex-1">
      <view class="flex-row gap-2 py-2">
        @for (sort of sorts; track sort) {
          <pressable
            accessibilityRole="button"
            [accessibilityState]="{ selected: sortState() === sort }"
            [class]="chipClass(sort)"
            (press)="setSort(sort)"
          >
            <text
              class="font-sans text-callout font-medium"
              [class]="chipTextClass(sort)"
            >
              {{ labels[sort] }}
            </text>
          </pressable>
        }
      </view>
      <view class="flex-1 flex-row">
        <virtual-list
          #songs
          [items]="sorted()"
          [itemHeight]="64"
          class="flex-1"
        >
          @for (row of songs.window(); track row.slot) {
            <view [virtualListRow]="row">
              <app-track-row
                [title]="row.item.title"
                [artist]="row.item.artist"
                [album]="row.item.album"
                [durationMs]="row.item.durationMs"
                [artworkPath]="row.item.artworkPath"
              />
            </view>
          }
          <view listFooter class="h-18" />
        </virtual-list>
        @if (letters().length > 1) {
          <view class="w-6 items-center justify-center">
            @for (letter of letters(); track letter) {
              <pressable
                accessibilityRole="button"
                [accessibilityLabel]="'Ir a ' + letter"
                class="py-0.5"
                (press)="jump(letter, songs)"
              >
                <text class="font-sans text-caption text-text-tertiary">
                  {{ letter }}
                </text>
              </pressable>
            }
          </view>
        }
      </view>
    </view>
  `,
})
export class SongsListComponent {
  private readonly repository = inject(TrackRepository);

  protected readonly sorts = SORTS;
  protected readonly labels = SORT_LABELS;
  protected readonly sortState = signal<SongSort>('title');
  private readonly loaded = signal<readonly TrackRow[]>([]);

  /** Fixed tracks to show instead of loading the whole library. */
  readonly tracksInput = input<readonly TrackRow[] | undefined>(undefined);
  readonly tracks = computed(() => this.tracksInput() ?? this.loaded());

  protected readonly sorted = computed(() =>
    sortSongs(this.tracks(), this.sortState()),
  );

  protected readonly letters = computed(() => {
    const seen: string[] = [];
    for (const track of this.sorted()) {
      const letter = (track.title.trim()[0] ?? '#').toUpperCase();
      if (!seen.includes(letter)) {
        seen.push(letter);
      }
    }
    return seen;
  });

  protected readonly trackKey = (track: TrackRow): string => track.id;

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    if (this.tracksInput() === undefined) {
      this.loaded.set(await this.repository.listTracks());
    }
  }

  protected setSort(sort: SongSort): void {
    this.sortState.set(sort);
  }

  protected chipClass(sort: SongSort): string {
    const active = this.sortState() === sort;
    return `rounded-full px-4 py-2 ${active ? 'bg-primary' : 'bg-surface-elevated'}`;
  }

  protected chipTextClass(sort: SongSort): string {
    const active = this.sortState() === sort;
    return `font-sans text-callout font-medium ${active ? 'text-on-primary' : 'text-text'}`;
  }

  protected jump(letter: string, songs: VirtualList<TrackRow>): void {
    const index = this.sorted().findIndex(
      (track) => (track.title.trim()[0] ?? '#').toUpperCase() === letter,
    );
    if (index >= 0) {
      songs.scrollToIndex({ index, animated: true });
    }
  }
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function sortSongs(
  rows: readonly TrackRow[],
  sort: SongSort,
): readonly TrackRow[] {
  const sorted = [...rows];
  switch (sort) {
    case 'artist':
      return sorted.sort(
        (a, b) =>
          compare(a.artist, b.artist) ||
          compare(a.album, b.album) ||
          compare(a.title, b.title),
      );
    case 'album':
      return sorted.sort(
        (a, b) => compare(a.album, b.album) || compare(a.title, b.title),
      );
    case 'duration':
      return sorted.sort((a, b) => a.durationMs - b.durationMs);
    case 'title':
    default:
      return sorted.sort((a, b) => compare(a.title, b.title));
  }
}
