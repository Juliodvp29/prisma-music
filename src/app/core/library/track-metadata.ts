/** Rich metadata for one track, read from the file itself. */
export interface TrackMetadata {
  readonly title: string | null;
  readonly artist: string | null;
  readonly album: string | null;
  readonly albumArtist: string | null;
  readonly genre: string | null;
  readonly trackNumber: number | null;
  readonly discNumber: number | null;
  readonly year: number | null;
  readonly durationMs: number;
  readonly bitrate: number | null;
  readonly sampleRate: number | null;
  readonly channelCount: number | null;
  readonly mimeType: string | null;
  readonly artworkPath: string | null;
}
