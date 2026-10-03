import { Component, input } from '@angular/core';
import { Image, Pressable, Text, View } from '@ng-native/components';
import { NativeRouterLink } from '@ng-native/router';

/** A tappable browse row: artwork, title, optional subtitle. */
@Component({
  imports: [Image, NativeRouterLink, Pressable, Text, View],
  selector: 'app-collection-row',
  template: `
    <pressable
      accessibilityRole="button"
      [nativeRouterLink]="link()"
      class="h-16 flex-row items-center gap-3"
    >
      @if (artworkPath()) {
        <image
          [src]="'file://' + artworkPath()"
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
        <text class="font-sans text-body truncate text-text">
          {{ title() }}
        </text>
        @if (subtitle() !== '') {
          <text class="font-sans text-caption truncate text-text-secondary">
            {{ subtitle() }}
          </text>
        }
      </view>
    </pressable>
  `,
})
export class CollectionRowComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly artworkPath = input<string | null>(null);
  readonly link = input.required<readonly string[]>();

  protected initial(): string {
    return (this.title().trim()[0] ?? '·').toUpperCase();
  }
}
