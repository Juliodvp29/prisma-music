import { Component, computed, inject, input, signal } from '@angular/core';
import { Text, View } from '@ng-native/components';
import { TrackRepository } from '../../core/library/repositories/track.repository.ts';
import type { TrackRow } from '../../core/library/repositories/track.repository.ts';
import { SongsListComponent } from './songs-list.ts';

/** Folder detail pushed over the tab bar. */
@Component({
  imports: [SongsListComponent, Text, View],
  selector: 'app-folder-detail-page',
  template: `
    <view class="flex-1 bg-background p-5">
      <text class="font-sans text-title font-bold text-text">
        {{ folderName() }}
      </text>
      <text class="font-sans text-body text-text-secondary">
        {{ folder() }}
      </text>
      <app-songs-list [tracksInput]="songs()" />
    </view>
  `,
})
export class FolderDetailPage {
  readonly key = input.required<string>();
  private readonly trackRepository = inject(TrackRepository);
  protected readonly songs = signal<readonly TrackRow[]>([]);

  protected readonly folder = computed(() => decodeURIComponent(this.key()));
  protected readonly folderName = computed(
    () =>
      this.folder()
        .split('/')
        .filter((part) => part !== '')
        .pop() ?? this.folder(),
  );

  async ngOnInit(): Promise<void> {
    this.songs.set(
      await this.trackRepository.listTracksByFolder(this.folder()),
    );
  }
}
