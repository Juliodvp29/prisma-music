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
          <text class="font-sans text-base text-text-secondary">
            Tu música aparecerá aquí.
          </text>
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
  private readonly theme = inject(ThemeService);

  protected iconColor(): string {
    return this.theme.className() === 'dark' ? '#EBDDC8' : '#192028';
  }
}
