import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import { androidPermission, type PermissionAnswer } from '@ng-native/device';

export type MediaAccessStatus =
  'checking' | 'undetermined' | 'granted' | 'denied' | 'permanently-denied';

export interface MediaPermissionPort {
  check(): Promise<PermissionAnswer>;
  request(): Promise<PermissionAnswer>;
}

function reactNative(): typeof import('react-native') | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- static import would load react-native in Node and fail every test reaching this file.
  return typeof require === 'function' ? require('react-native') : null;
}

function audioPermissionName(): string {
  const version = reactNative()?.Platform.Version;
  if (typeof version === 'number' && version < 33) {
    return 'android.permission.READ_EXTERNAL_STORAGE';
  }
  return 'android.permission.READ_MEDIA_AUDIO';
}

function toStatus(answer: PermissionAnswer): MediaAccessStatus {
  if (answer.granted) {
    return 'granted';
  }
  if (answer.status === 'undetermined') {
    return 'undetermined';
  }
  return answer.canAskAgain ? 'denied' : 'permanently-denied';
}

@Injectable({ providedIn: 'root' })
export class MediaAccessService {
  /** The runtime permission pair. Overridden in tests. */
  static readonly PERMISSION = new InjectionToken<MediaPermissionPort>(
    'MediaAccess.permission',
    {
      factory: () => {
        const [check, request] = androidPermission(audioPermissionName());
        return { check, request };
      },
    },
  );

  private readonly permission = inject(MediaAccessService.PERMISSION);
  private readonly statusSignal = signal<MediaAccessStatus>('undetermined');

  readonly status = this.statusSignal.asReadonly();

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.statusSignal.set('checking');
    try {
      this.statusSignal.set(toStatus(await this.permission.check()));
    } catch {
      this.statusSignal.set('undetermined');
    }
  }

  async request(): Promise<void> {
    this.statusSignal.set('checking');
    try {
      this.statusSignal.set(toStatus(await this.permission.request()));
    } catch {
      this.statusSignal.set('undetermined');
    }
  }

  openSettings(): void {
    void reactNative()?.Linking.openSettings();
  }
}
