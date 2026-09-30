import { Component } from '@angular/core';
import { Text, View } from '@ng-native/components';

@Component({
  imports: [Text, View],
  selector: 'app-library-page',
  template: `
    <view class="flex-1 justify-center bg-background p-5">
      <text class="font-sans text-2xl font-bold text-text">Library</text>
    </view>
  `,
})
export class LibraryPage {}
