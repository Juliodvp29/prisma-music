export interface PrismaAudioGreeting {
  readonly message: string;
}

export interface NativeScannedTrack {
  readonly deviceId: number;
  readonly uri: string;
  readonly displayName: string;
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly albumId: number;
  readonly durationMs: number;
  readonly sizeBytes: number;
  readonly dateModified: number;
  readonly mimeType: string;
  readonly folder: string | null;
}

export interface ScanProgressEvent {
  readonly scanned: number;
  readonly total: number;
}

export interface NativeTrackMetadata {
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

export interface NativeSubscription {
  remove(): void;
}

/** What `PrismaAudioModule.kt` declares natively, written out for TypeScript. */
export interface NativePrismaAudio {
  hello(): string;
  scanLibrary(pageSize: number): Promise<readonly NativeScannedTrack[]>;
  cancelScan(): void;
  extractMetadata(
    uri: string,
    artworkKey: string,
  ): Promise<NativeTrackMetadata>;
  addListener(
    event: 'onGreeting',
    listener: (event: PrismaAudioGreeting) => void,
  ): NativeSubscription;
  addListener(
    event: 'onScanProgress',
    listener: (event: ScanProgressEvent) => void,
  ): NativeSubscription;
}

/**
 * The native module, or null where it is not in the build (Expo Go, a build
 * made before the module existed) or outside it (Node, where tests run).
 */
export function requirePrismaAudio(): NativePrismaAudio | null {
  if (typeof require !== 'function') {
    return null;
  }
  return (
    require('expo') as typeof import('expo')
  ).requireOptionalNativeModule<NativePrismaAudio>('PrismaAudio');
}
