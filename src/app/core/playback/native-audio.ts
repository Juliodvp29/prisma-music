import {
  DestroyRef,
  inject,
  Injectable,
  InjectionToken,
  signal,
} from '@angular/core';
import { requirePrismaAudio, type NativePrismaAudio } from 'prisma-audio';

@Injectable({ providedIn: 'root' })
export class NativeAudio {
  /** The native module, or null where it is not in the build. Overridden in tests. */
  static readonly NATIVE = new InjectionToken<NativePrismaAudio | null>(
    'NativeAudio.native',
    { factory: requirePrismaAudio },
  );

  private readonly native = inject(NativeAudio.NATIVE);
  private readonly message = signal<string | null>(null);

  readonly supported = this.native !== null;
  readonly greeting = this.message.asReadonly();

  constructor() {
    const subscription = this.native?.addListener('onGreeting', (event) =>
      this.message.set(event.message),
    );
    inject(DestroyRef).onDestroy(() => subscription?.remove());
  }

  hello(): string | null {
    return this.native?.hello() ?? null;
  }
}
