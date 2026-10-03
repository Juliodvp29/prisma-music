import { render, screen, userEvent } from '@ng-native/testing';
import { withComponentInputBinding } from '@angular/router';
import { provideNativeRouter } from '@ng-native/router';
import { expect, test } from 'vitest';
import { testProviders } from '../../core/library/test-services.ts';
import { SearchPage } from './search-page.ts';

async function testSetup(): Promise<() => Promise<void>> {
  const { providers, db, close } = await testProviders();
  await db.runAsync("INSERT INTO artists (id, name) VALUES ('a1', 'Amalia')");
  await db.runAsync(
    "INSERT INTO albums (id, source, title, artist) VALUES ('al1', 'local', 'Amalia canta', 'Amalia')",
  );
  await db.runAsync(
    `INSERT INTO tracks (id, source, uri, title, artist, album, duration_ms)
      VALUES ('t1', 'local', 'content://one', 'Amalia vive', 'Amalia', 'Amalia canta', 180000)`,
  );
  await db.runAsync(
    `INSERT INTO tracks (id, source, uri, title, artist, album, duration_ms)
      VALUES ('t2', 'local', 'content://two', 'Otra cosa', 'Otro', 'Otro disco', 180000)`,
  );
  await render(SearchPage, {
    providers: [
      ...providers,
      provideNativeRouter([], withComponentInputBinding()),
    ],
  });
  return close;
}

test('searches songs, albums and artists after a debounce', async () => {
  const close = await testSetup();

  expect(screen.getByText('Busca en tu biblioteca.')).toBeTruthy();

  const field = screen.getByLabelText('Buscar en tu biblioteca');
  await userEvent.setup().type(field, 'Amalia');

  expect(await screen.findByText('Canciones')).toBeTruthy();
  expect(screen.getByText('Amalia vive')).toBeTruthy();
  expect(screen.getByText('Álbumes')).toBeTruthy();
  expect(screen.getByText('Artistas')).toBeTruthy();
  await close();
});

test('shows an empty state without matches', async () => {
  const { providers, close } = await testProviders();
  await render(SearchPage, {
    providers: [
      ...providers,
      provideNativeRouter([], withComponentInputBinding()),
    ],
  });

  const field = screen.getByLabelText('Buscar en tu biblioteca');
  await userEvent.setup().type(field, 'xyz');

  expect(await screen.findByText('Sin resultados para "xyz".')).toBeTruthy();
  await close();
});
