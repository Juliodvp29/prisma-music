import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'library', pathMatch: 'full' },
  {
    path: 'library',
    loadComponent: () =>
      import('./features/library/library-page.ts').then((m) => m.LibraryPage),
  },
  {
    path: 'player',
    loadComponent: () =>
      import('./features/player/player-page.ts').then((m) => m.PlayerPage),
  },
  {
    path: 'playlists',
    loadComponent: () =>
      import('./features/playlists/playlists-page.ts').then(
        (m) => m.PlaylistsPage,
      ),
  },
  {
    path: 'lyrics',
    loadComponent: () =>
      import('./features/lyrics/lyrics-page.ts').then((m) => m.LyricsPage),
  },
  {
    path: 'equalizer',
    loadComponent: () =>
      import('./features/equalizer/equalizer-page.ts').then(
        (m) => m.EqualizerPage,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings-page.ts').then(
        (m) => m.SettingsPage,
      ),
  },
];
