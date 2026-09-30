export interface PrismaAudioGreeting {
  readonly message: string;
}

/** What `PrismaAudioModule.kt` declares natively, written out for TypeScript. */
export interface NativePrismaAudio {
  hello(): string;
  addListener(
    event: 'onGreeting',
    listener: (event: PrismaAudioGreeting) => void,
  ): { remove(): void };
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
