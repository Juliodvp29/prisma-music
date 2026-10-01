import { Component, inject } from '@angular/core';
import { Pressable, Text } from '@ng-native/components';
import type { PermissionAnswer } from '@ng-native/device';
import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import {
  MediaAccessService,
  type MediaPermissionPort,
} from './media-access.service.ts';

function answer(
  status: PermissionAnswer['status'],
  granted: boolean,
  canAskAgain: boolean,
): PermissionAnswer {
  return { status, granted, canAskAgain };
}

function fakePort(initial: PermissionAnswer): {
  port: MediaPermissionPort;
  answer: { current: PermissionAnswer };
} {
  const answerState = { current: initial };
  const port: MediaPermissionPort = {
    check: async () => answerState.current,
    request: async () => answerState.current,
  };
  return { port, answer: answerState };
}

@Component({
  imports: [Pressable, Text],
  selector: 'app-access-probe',
  template: `
    <pressable accessibilityRole="button" (press)="access.request()">
      <text>Ask</text>
    </pressable>
    <pressable accessibilityRole="button" (press)="access.openSettings()">
      <text>Settings</text>
    </pressable>
    <text>Status: {{ access.status() }}</text>
  `,
})
class AccessProbe {
  readonly access = inject(MediaAccessService);
}

test('maps a denied answer onto denied and a later grant onto granted', async () => {
  const { port, answer: state } = fakePort(answer('denied', false, true));
  await render(AccessProbe, {
    providers: [{ provide: MediaAccessService.PERMISSION, useValue: port }],
  });

  expect(await screen.findByText('Status: denied')).toBeTruthy();

  state.current = answer('granted', true, true);
  await userEvent.setup().press(screen.getByRole('button', { name: 'Ask' }));

  expect(await screen.findByText('Status: granted')).toBeTruthy();
});

test('maps a never-ask-again denial onto permanently-denied', async () => {
  const { port } = fakePort(answer('denied', false, false));
  await render(AccessProbe, {
    providers: [{ provide: MediaAccessService.PERMISSION, useValue: port }],
  });

  expect(await screen.findByText('Status: permanently-denied')).toBeTruthy();

  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Settings' }));

  expect(await screen.findByText('Status: permanently-denied')).toBeTruthy();
});

test('stays askable when nothing was ever requested', async () => {
  const { port } = fakePort(answer('undetermined', false, true));
  await render(AccessProbe, {
    providers: [{ provide: MediaAccessService.PERMISSION, useValue: port }],
  });

  expect(await screen.findByText('Status: undetermined')).toBeTruthy();
});
