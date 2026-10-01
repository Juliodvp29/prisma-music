import { Component, inject, signal } from '@angular/core';
import { Pressable, Text } from '@ng-native/components';
import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import type { NativePrismaAudio, PrismaAudioGreeting } from 'prisma-audio';
import { NativeAudio } from './native-audio.ts';

@Component({
  imports: [Pressable, Text],
  selector: 'app-audio-probe',
  template: `
    <pressable accessibilityRole="button" (press)="ask()">
      <text>Ask</text>
    </pressable>
    <text>Supported: {{ audio.supported }}</text>
    <text>Greeting: {{ audio.greeting() ?? 'none' }}</text>
    <text>Answer: {{ answer() ?? 'none' }}</text>
  `,
})
class AudioProbe {
  readonly audio = inject(NativeAudio);
  readonly answer = signal<string | null>(null);

  ask(): void {
    this.answer.set(this.audio.hello());
  }
}

function fakeNative(): {
  module: NativePrismaAudio;
  emit: (event: PrismaAudioGreeting) => void;
} {
  let emit: (event: PrismaAudioGreeting) => void = () => {};
  const module: NativePrismaAudio = {
    hello: () => 'Hello from PrismaAudio',
    scanLibrary: async () => [],
    cancelScan: () => {},
    extractMetadata: async () => {
      throw new Error('no metadata in this test');
    },
    addListener: (event, listener) => {
      if (event === 'onGreeting') {
        emit = listener as (event: PrismaAudioGreeting) => void;
      }
      return { remove: () => {} };
    },
  };
  return { module, emit: (event) => emit(event) };
}

test('answers the hello call and follows greeting events', async () => {
  const { module, emit } = fakeNative();
  await render(AudioProbe, {
    providers: [{ provide: NativeAudio.NATIVE, useValue: module }],
  });

  expect(screen.getByText('Supported: true')).toBeTruthy();

  await userEvent.setup().press(screen.getByRole('button', { name: 'Ask' }));
  expect(screen.getByText('Answer: Hello from PrismaAudio')).toBeTruthy();

  emit({ message: 'Hello from PrismaAudio' });
  expect(
    await screen.findByText('Greeting: Hello from PrismaAudio'),
  ).toBeTruthy();
});

test('stays quiet where the module is not in the build', async () => {
  await render(AudioProbe, {
    providers: [{ provide: NativeAudio.NATIVE, useValue: null }],
  });

  expect(screen.getByText('Supported: false')).toBeTruthy();
  expect(screen.getByText('Greeting: none')).toBeTruthy();

  await userEvent.setup().press(screen.getByRole('button', { name: 'Ask' }));
  expect(screen.getByText('Answer: none')).toBeTruthy();
});
