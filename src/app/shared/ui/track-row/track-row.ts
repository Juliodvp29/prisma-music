import { Component, input } from '@angular/core';
import { Image, Text, View } from '@ng-native/components';

/** One song row: 48pt artwork, title, artist and album, duration. */
@Component({
  imports: [Image, Text, View],
  selector: 'app-track-row',
  template: `
    <view class="h-16 flex-row items-center gap-3">
      @if (artworkUri()) {
        <image
          [src]="artworkUri()"
          accessibilityLabel=""
          class="h-12 w-12 rounded-md"
        />
      } @else {
        <view
          class="h-12 w-12 items-center justify-center rounded-md bg-surface-elevated"
        >
          <text class="font-sans text-base font-semibold text-text-secondary">
            {{ initial() }}
          </text>
        </view>
      }
      <view class="flex-1">
        <text class="font-sans text-body truncate text-text">{{
          title()
        }}</text>
        <text class="font-sans text-caption truncate text-text-secondary">
          {{ artist() }} · {{ album() }}
        </text>
      </view>
      <text class="font-sans text-caption tabular-nums text-text-secondary">
        {{ duration() }}
      </text>
    </view>
  `,
})
export class TrackRowComponent {
  readonly title = input.required<string>();
  readonly artist = input.required<string>();
  readonly album = input.required<string>();
  readonly durationMs = input.required<number>();
  readonly artworkPath = input<string | null>(null);

  protected artworkUri(): string | undefined {
    const path = this.artworkPath();
    return path ? `file://${path}` : undefined;
  }

  protected initial(): string {
    return (this.title().trim()[0] ?? '·').toUpperCase();
  }

  protected duration(): string {
    const total = Math.max(0, Math.round(this.durationMs() / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = `${total % 60}`.padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
