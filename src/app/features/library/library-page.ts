import { Component, inject } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { provideIcons } from '@ng-icons/core';
import {
  heroCog6Tooth,
  heroExclamationTriangle,
  heroMusicalNote,
} from '@ng-icons/heroicons/outline';
import { NgIcon } from '@ng-native/icons';
import { ThemeService } from '../../core/theme.service.ts';
import { MediaAccessService } from '../../core/library/media-access.service.ts';
import { ScanService } from '../../core/library/scan.service.ts';

@Component({
  imports: [NgIcon, Pressable, Text, View],
  providers: [
    provideIcons({ heroCog6Tooth, heroExclamationTriangle, heroMusicalNote }),
  ],
  selector: 'app-library-page',
  template: `
    <view class="flex-1 justify-center bg-background p-5">
      @switch (access.status()) {
        @case ('granted') {
          <text class="font-sans text-2xl font-bold text-text">Biblioteca</text>
          @switch (scanner.state().state) {
            @case ('scanning') {
              <text class="font-sans text-base text-text-secondary">
                Explorando {{ scanned() }} de {{ total() }}…
              </text>
              <pressable
                accessibilityRole="button"
                class="items-center rounded-full bg-primary p-4"
                (press)="scanner.cancel()"
              >
                <text class="font-sans text-base font-semibold text-on-primary">
                  Cancelar
                </text>
              </pressable>
            }
            @case ('done') {
              <text class="font-sans text-base text-text-secondary">
                {{ summary() }}
              </text>
              <pressable
                accessibilityRole="button"
                class="items-center rounded-full bg-primary p-4"
                (press)="scanner.scan()"
              >
                <text class="font-sans text-base font-semibold text-on-primary">
                  Escanear de nuevo
                </text>
              </pressable>
            }
            @case ('error') {
              <text class="font-sans text-base text-text-secondary">
                {{ errorMessage() }}
              </text>
              <pressable
                accessibilityRole="button"
                class="items-center rounded-full bg-primary p-4"
                (press)="scanner.scan()"
              >
                <text class="font-sans text-base font-semibold text-on-primary">
                  Reintentar
                </text>
              </pressable>
            }
            @default {
              <text class="font-sans text-base text-text-secondary">
                Tu música aparecerá aquí.
              </text>
              <pressable
                accessibilityRole="button"
                class="items-center rounded-full bg-primary p-4"
                (press)="scanner.scan()"
              >
                <text class="font-sans text-base font-semibold text-on-primary">
                  Escanear
                </text>
              </pressable>
            }
          }
        }
        @case ('permanently-denied') {
          <ng-icon name="heroCog6Tooth" [size]="48" [color]="iconColor()" />
          <text class="font-sans text-2xl font-bold text-text">
            Acceso bloqueado
          </text>
          <text class="font-sans text-base text-text-secondary">
            Abre los Ajustes y permite el acceso al audio para crear tu
            biblioteca.
          </text>
          <pressable
            accessibilityRole="button"
            class="items-center rounded-full bg-primary p-4"
            (press)="access.openSettings()"
          >
            <text class="font-sans text-base font-semibold text-on-primary">
              Abrir ajustes
            </text>
          </pressable>
        }
        @default {
          <ng-icon
            [name]="
              access.status() === 'denied'
                ? 'heroExclamationTriangle'
                : 'heroMusicalNote'
            "
            [size]="48"
            [color]="iconColor()"
          />
          <text class="font-sans text-2xl font-bold text-text">
            {{
              access.status() === 'denied' ? 'Acceso denegado' : 'Biblioteca'
            }}
          </text>
          <text class="font-sans text-base text-text-secondary">
            {{
              access.status() === 'denied'
                ? 'Permite el acceso para mostrar la música de este dispositivo.'
                : 'Permite el acceso a tus archivos de audio para crear tu biblioteca.'
            }}
          </text>
          <pressable
            accessibilityRole="button"
            class="items-center rounded-full bg-primary p-4"
            (press)="access.request()"
          >
            <text class="font-sans text-base font-semibold text-on-primary">
              {{
                access.status() === 'denied' ? 'Reintentar' : 'Permitir acceso'
              }}
            </text>
          </pressable>
        }
      }
    </view>
  `,
})
export class LibraryPage {
  protected readonly access = inject(MediaAccessService);
  protected readonly scanner = inject(ScanService);
  private readonly theme = inject(ThemeService);

  protected iconColor(): string {
    return this.theme.className() === 'dark' ? '#EBDDC8' : '#192028';
  }

  protected scanned(): number {
    const state = this.scanner.state();
    return state.state === 'scanning' ? state.scanned : 0;
  }

  protected total(): number {
    const state = this.scanner.state();
    return state.state === 'scanning' ? state.total : 0;
  }

  protected summary(): string {
    const state = this.scanner.state();
    if (state.state !== 'done') {
      return '';
    }
    if (state.total === 0) {
      return 'No se encontró música en este dispositivo.';
    }
    return `${state.total} canciones · ${state.added} nuevas · ${state.updated} actualizadas · ${state.removed} eliminadas`;
  }

  protected errorMessage(): string {
    const state = this.scanner.state();
    return state.state === 'error' ? state.message : '';
  }
}
