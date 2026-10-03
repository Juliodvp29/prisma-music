/** One audio file found on a device, before it is stored. */
export interface ScannedTrack {
  readonly deviceId: string;
  readonly uri: string;
  readonly displayName: string;
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly albumId: string;
  readonly durationMs: number;
  readonly sizeBytes: number;
  readonly dateModified: number;
  readonly mimeType: string;
  readonly folder: string | null;
}

export interface ScanProgress {
  readonly scanned: number;
  readonly total: number;
}

/**
 * A source the library can scan. Local files today; a remote backend later
 * implements the same interface without changing callers.
 */
export interface TrackSource {
  readonly source: string;
  scan(
    onProgress?: (progress: ScanProgress) => void,
  ): Promise<readonly ScannedTrack[]>;
  cancel(): void;
}
