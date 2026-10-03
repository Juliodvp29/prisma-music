import { render, screen } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { TrackRowComponent } from './track-row.ts';

test('shows title, artists, duration and a placeholder initial', async () => {
  await render(TrackRowComponent, {
    inputs: {
      title: 'One',
      artist: 'Artist',
      album: 'Album',
      durationMs: 185000,
      artworkPath: null,
    },
  });

  expect(screen.getByText('One')).toBeTruthy();
  expect(screen.getByText('Artist · Album')).toBeTruthy();
  expect(screen.getByText('3:05')).toBeTruthy();
  expect(screen.getByText('O')).toBeTruthy();
});

test('shows artwork instead of the placeholder when present', async () => {
  const { queryByText } = await render(TrackRowComponent, {
    inputs: {
      title: 'One',
      artist: 'Artist',
      album: 'Album',
      durationMs: 60000,
      artworkPath: '/cache/artwork/7.jpg',
    },
  });

  expect(screen.getByText('1:00')).toBeTruthy();
  expect(queryByText('O')).toBeNull();
});
