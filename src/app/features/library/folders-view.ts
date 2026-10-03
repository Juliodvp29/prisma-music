import { Component, inject, signal } from '@angular/core';
import { Text, View } from '@ng-native/components';
import { TrackRepository } from '../../core/library/repositories/track.repository.ts';
import { CollectionRowComponent } from '../../shared/ui/collection-row/collection-row.ts';

/** Device folders browse list inside the library tab. */
@Component({
  imports: [CollectionRowComponent, Text, View],
  selector: 'app-folders-view',
  template: `
    <view class="flex-1">
      @for (folder of folders(); track folder.path) {
        <app-collection-row
          [title]="folder.name"
          [subtitle]="folder.path"
          [link]="['/folder', folder.key]"
        />
      } @empty {
        <text class="font-sans text-base text-text-secondary">
          Sin carpetas todavía.
        </text>
      }
    </view>
  `,
})
export class FoldersViewComponent {
  private readonly repository = inject(TrackRepository);
  protected readonly folders = signal<
    readonly { path: string; name: string; key: string }[]
  >([]);

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const folders = await this.repository.listFolders();
    this.folders.set(
      folders.map((path) => ({
        path,
        name:
          path
            .split('/')
            .filter((part) => part !== '')
            .pop() ?? path,
        key: encodeURIComponent(path),
      })),
    );
  }
}
