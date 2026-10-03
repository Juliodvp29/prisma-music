import type { Migration } from '@ng-native/expo/database';

const v1 = `
CREATE TABLE tracks (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'local',
  device_id TEXT,
  uri TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  artist TEXT NOT NULL DEFAULT '',
  album TEXT NOT NULL DEFAULT '',
  album_id TEXT REFERENCES albums (id),
  genre TEXT,
  track_number INTEGER,
  disc_number INTEGER,
  year INTEGER,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  size_bytes INTEGER,
  date_modified INTEGER,
  mime TEXT,
  bitrate INTEGER,
  sample_rate INTEGER,
  channels INTEGER,
  artwork_path TEXT,
  UNIQUE (source, device_id)
);
CREATE INDEX tracks_artist ON tracks (artist);
CREATE INDEX tracks_album ON tracks (album);

CREATE TABLE albums (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'local',
  source_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  artist TEXT NOT NULL DEFAULT '',
  artwork_path TEXT,
  UNIQUE (source, source_id)
);

CREATE TABLE artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  UNIQUE (name)
);

CREATE TABLE playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE playlist_tracks (
  id INTEGER PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists (id),
  track_id TEXT NOT NULL REFERENCES tracks (id),
  position INTEGER NOT NULL
);
CREATE INDEX playlist_tracks_playlist ON playlist_tracks (playlist_id);

CREATE TABLE history (
  id INTEGER PRIMARY KEY,
  track_id TEXT NOT NULL REFERENCES tracks (id),
  played_at INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX history_track ON history (track_id);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

export const migrations: readonly Migration[] = [
  { to: 1, up: (db) => db.execAsync(v1) },
  {
    to: 2,
    up: (db) => db.execAsync('ALTER TABLE tracks ADD COLUMN folder TEXT'),
  },
];
