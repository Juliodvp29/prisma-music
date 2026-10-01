import { Component } from '@angular/core';
import { withComponentInputBinding } from '@angular/router';
import { Pressable, Text } from '@ng-native/components';
import { NativeRouterLink, NativeStackOutlet } from '@ng-native/router';
import { provideNativeRouter } from '@ng-native/router';
import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { routes } from '@app/app.routes.ts';
import { App } from './app.ts';

@Component({
  imports: [NativeRouterLink, NativeStackOutlet, Pressable, Text],
  selector: 'app-nav-probe',
  template: `
    <pressable accessibilityRole="button" nativeRouterLink="/settings">
      <text>Go to settings</text>
    </pressable>
    <native-stack-outlet />
  `,
})
class NavProbe {}

test('redirects to the library page on launch', async () => {
  await render(App, {
    providers: [provideNativeRouter(routes, withComponentInputBinding())],
  });

  expect(await screen.findByText('Biblioteca')).toBeTruthy();
});

test('pushes the settings screen when its link is pressed', async () => {
  await render(NavProbe, {
    providers: [provideNativeRouter(routes, withComponentInputBinding())],
  });

  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Go to settings' }));

  expect(await screen.findByText('Ajustes')).toBeTruthy();
});

test('lazy-loads every feature route', async () => {
  for (const route of routes) {
    if (route.loadComponent) {
      expect(await route.loadComponent()).toBeTruthy();
    }
  }
});
