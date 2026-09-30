---
name: ng-native-component
description: Use when creating or modifying an Angular Native component, screen, or design-system element in this project (anything rendered with @ng-native/components), including its test.
---

# Angular Native component

Read `DESIGN.md` for tokens and component specs before building UI. Framework rules are in `AGENTS.md`; this skill is the checklist and template.

## Checklist

- Standalone component, `app-` selector, kebab-case file, test next to it (`name.ts`, `name.test.ts`).
- Presentational components take data through `input()` and emit through `output()`; services and stores are injected only in feature containers.
- Lowercase tags, each imported from `@ng-native/components`; all text inside `<text>`.
- Events are native (`(press)`), never `(click)`.
- Accessibility props on every interactive element: `accessibilityRole`, `accessibilityLabel`, and `[accessibilityState]` or value when relevant. Touch target at least 48dp.
- Colors, spacing, radius, type sizes come from design tokens (CSS custom properties); no raw hex or magic numbers.
- Layout with flexbox only. Watch build output for dropped CSS warnings and fix them.
- Long lists use `<virtual-list>`; artwork is downsampled and cached.
- Animations on the UI thread (CSS transitions, `AnimatedStyle`, Reanimated worklets); respect reduce-motion.
- No method shorthand in decorator metadata, no template arrow functions that read their parameter, no backticks inside inline templates.

## Template

```ts
import { Component, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';

@Component({
  selector: 'app-track-row',
  imports: [Pressable, Text, View],
  template: `
    <pressable
      class="row"
      accessibilityRole="button"
      [accessibilityLabel]="title()"
      (press)="selected.emit()"
    >
      <view class="meta">
        <text class="title">{{ title() }}</text>
        <text class="subtitle">{{ artist() }}</text>
      </view>
    </pressable>
  `,
  styles: `
    .row {
      flex-direction: row;
      align-items: center;
      min-height: 64px;
      padding: 0 20px;
    }
    .title {
      color: var(--color-text);
    }
    .subtitle {
      color: var(--color-text-secondary);
    }
  `,
})
export class TrackRow {
  readonly title = input.required<string>();
  readonly artist = input.required<string>();
  readonly selected = output<void>();
}
```

Adjust property names to the tokens defined in the theme setup; the sample uses the names from `DESIGN.md`.

## Test shape

```ts
import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { TrackRow } from './track-row.ts';

test('exposes the track as a button', async () => {
  await render(TrackRow /* inputs: see the writing-a-test page */);
  expect(screen.getByRole('button')).toBeTruthy();
});
```

Passing inputs and services in tests: https://ng-native.com/packages/testing/writing-a-test. Cover: rendering with each input state, the press output, and the accessibility role and label.

## Verify

Run `npm run typecheck`, `npm run lint`, `npm test`, and a bundle build. Visual result and touch behavior are checked by Julio on a device: list what to look at.
