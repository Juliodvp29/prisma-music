import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs', pathMatch: 'full' },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./features/tabs/tabs-shell.ts').then((m) => m.TabsShell),
    children: [
      { path: '', redirectTo: 'library', pathMatch: 'full' },
      {
        path: 'library',
        loadComponent: () =>
          import('./features/library/library-page.ts').then(
            (m) => m.LibraryPage,
          ),
      },
      {
        path: 'playlists',
        loadComponent: () =>
          import('./features/playlists/playlists-page.ts').then(
            (m) => m.PlaylistsPage,
          ),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search-page.ts').then((m) => m.SearchPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page.ts').then(
            (m) => m.SettingsPage,
          ),
      },
    ],
  },
  {
    path: 'player',
    loadComponent: () =>
      import('./features/player/player-page.ts').then((m) => m.PlayerPage),
  },
  {
    path: 'album/:id',
    loadComponent: () =>
      import('./features/library/album-detail-page.ts').then(
        (m) => m.AlbumDetailPage,
      ),
  },
  {
    path: 'artist/:id',
    loadComponent: () =>
      import('./features/library/artist-detail-page.ts').then(
        (m) => m.ArtistDetailPage,
      ),
  },
  {
    path: 'folder/:key',
    loadComponent: () =>
      import('./features/library/folder-detail-page.ts').then(
        (m) => m.FolderDetailPage,
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
];
