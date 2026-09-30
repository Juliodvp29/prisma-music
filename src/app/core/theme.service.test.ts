import { Component, inject } from '@angular/core';
import { Pressable, Text } from '@ng-native/components';
import { ColorScheme } from '@ng-native/device';
import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { ThemeService } from './theme.service.ts';

@Component({
  imports: [Pressable, Text],
  selector: 'app-theme-probe',
  template: `
    <pressable accessibilityRole="button" (press)="theme.setPreference('dark')">
      <text>Dark</text>
    </pressable>
    <pressable
      accessibilityRole="button"
      (press)="theme.setPreference('light')"
    >
      <text>Light</text>
    </pressable>
    <text>Mode: {{ theme.className() === 'dark' ? 'dark' : 'light' }}</text>
  `,
})
class ThemeProbe {
  readonly theme = inject(ThemeService);
}

test('starts in the system theme and follows the in-app override', async () => {
  await render(ThemeProbe, {
    providers: [
      {
        provide: ColorScheme.SOURCE,
        useValue: {
          current: () => 'light' as const,
          subscribe: () => () => {},
        },
      },
    ],
  });

  expect(screen.getByText('Mode: light')).toBeTruthy();

  await userEvent.setup().press(screen.getByRole('button', { name: 'Dark' }));
  expect(screen.getByText('Mode: dark')).toBeTruthy();

  await userEvent.setup().press(screen.getByRole('button', { name: 'Light' }));
  expect(screen.getByText('Mode: light')).toBeTruthy();
});
