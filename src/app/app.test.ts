import { Component } from '@angular/core';
import { withComponentInputBinding, type Route } from '@angular/router';
import { Pressable, Text } from '@ng-native/components';
import { NativeRouterLink, NativeStackOutlet } from '@ng-native/router';
import { provideNativeRouter } from '@ng-native/router';
import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { routes } from '@app/app.routes.ts';
import { LIBRARY_DB, type Db } from '@app/core/library/library-db.ts';
import { App } from './app.ts';

const emptyDb: Db = {
  execAsync: async () => {},
  getAllAsync: async () => [],
  getFirstAsync: async () => null,
  runAsync: async () => ({ lastInsertRowId: 0, changes: 0 }),
  withTransactionAsync: async (task) => {
    await task();
  },
};

function routerProviders() {
  return [
    provideNativeRouter(routes, withComponentInputBinding()),
    { provide: LIBRARY_DB, useValue: () => Promise.resolve(emptyDb) },
  ];
}

@Component({
  imports: [NativeRouterLink, NativeStackOutlet, Pressable, Text],
  selector: 'app-nav-probe',
  template: `
    <pressable accessibilityRole="button" nativeRouterLink="/tabs/settings">
      <text>Go to settings</text>
    </pressable>
    <native-stack-outlet />
  `,
})
class NavProbe {}

test('redirects to the library page on launch', async () => {
  await render(App, { providers: routerProviders() });

  expect(await screen.findByText('Biblioteca')).toBeTruthy();
});

test('pushes the settings screen when its link is pressed', async () => {
  await render(NavProbe, { providers: routerProviders() });

  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Go to settings' }));

  expect(await screen.findByText('Ajustes')).toBeTruthy();
});

test('lazy-loads every route', async () => {
  const loadable = (route: Route): Array<() => unknown> => [
    ...(route.loadComponent ? [route.loadComponent] : []),
    ...(route.children ?? []).flatMap(loadable),
  ];
  for (const load of routes.flatMap(loadable)) {
    expect(await load()).toBeTruthy();
  }
});
