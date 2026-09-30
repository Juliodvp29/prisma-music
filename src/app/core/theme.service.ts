import { computed, inject, Injectable, signal } from '@angular/core';
import { ColorScheme } from '@ng-native/device';

export type ThemePreference = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly system = inject(ColorScheme);
  private readonly preference = signal<ThemePreference>('system');

  readonly className = computed(() => {
    const chosen =
      this.preference() === 'system'
        ? this.system.current()
        : this.preference();
    return chosen === 'dark' ? 'dark' : '';
  });

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    this.system.set(preference === 'system' ? null : preference);
  }
}
