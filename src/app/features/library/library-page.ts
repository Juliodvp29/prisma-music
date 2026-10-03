import { Component, inject, signal, viewChild } from '@angular/core';
import { Pressable, SafeAreaView, Text, View } from '@ng-native/components';
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
import { TrackRepository } from '../../core/library/repositories/track.repository.ts';
import { SongsListComponent } from './songs-list.ts';
import { AlbumsViewComponent } from './albums-view.ts';
import { ArtistsViewComponent } from './artists-view.ts';
import { FoldersViewComponent } from './folders-view.ts';

type LibrarySection = 'songs' | 'albums' | 'artists' | 'folders';

const SECTION_LABELS: Readonly<Record<LibrarySection, string>> = {
  songs: 'Canciones',
  albums: 'Álbumes',
  artists: 'Artistas',
  folders: 'Carpetas',
};

const SECTIONS: readonly LibrarySection[] = [
  'songs',
  'albums',
  'artists',
  'folders',
];

@Component({
  imports: [
    AlbumsViewComponent,
    ArtistsViewComponent,
    FoldersViewComponent,
    NgIcon,
    Pressable,
    SafeAreaView,
    SongsListComponent,
    Text,
    View,
  ],
  providers: [
    provideIcons({ heroCog6Tooth, heroExclamationTriangle, heroMusicalNote }),
  ],
  selector: 'app-library-page',
  template: `
    <safe-area-view
      [edges]="['top']"
      class="flex-1 justify-center bg-background p-5"
    >
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
            @default {
              @if (scanMessage() !== '') {
                <text class="font-sans text-base text-text-secondary">
                  {{ scanMessage() }}
                </text>
              }
              <view class="flex-row gap-2 py-2">
                @for (section of sections; track section) {
                  <pressable
                    accessibilityRole="button"
                    [accessibilityState]="{
                      selected: sectionState() === section,
                    }"
                    [class]="sectionChipClass(section)"
                    (press)="setSection(section)"
                  >
                    <text
                      class="font-sans text-callout font-medium"
                      [class]="sectionChipTextClass(section)"
                    >
                      {{ sectionLabels[section] }}
                    </text>
                  </pressable>
                }
              </view>
              @switch (sectionState()) {
                @case ('albums') {
                  <app-albums-view />
                }
                @case ('artists') {
                  <app-artists-view />
                }
                @case ('folders') {
                  <app-folders-view />
                }
                @default {
                  @if (hasTracks()) {
                    <app-songs-list />
                  } @else {
                    <text class="font-sans text-base text-text-secondary">
                      Tu música aparecerá aquí.
                    </text>
                  }
                }
              }
              <pressable
                accessibilityRole="button"
                class="items-center rounded-full bg-primary p-4"
                (press)="rescan()"
              >
                <text class="font-sans text-base font-semibold text-on-primary">
                  {{ hasTracks() ? 'Escanear de nuevo' : 'Escanear' }}
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
    </safe-area-view>
  `,
})
export class LibraryPage {
  protected readonly access = inject(MediaAccessService);
  protected readonly scanner = inject(ScanService);
  protected readonly songs = viewChild(SongsListComponent);
  protected readonly albumsView = viewChild(AlbumsViewComponent);
  protected readonly artistsView = viewChild(ArtistsViewComponent);
  protected readonly foldersView = viewChild(FoldersViewComponent);
  protected readonly trackCount = signal(0);
  protected readonly sections = SECTIONS;
  protected readonly sectionLabels = SECTION_LABELS;
  protected readonly sectionState = signal<LibrarySection>('songs');
  private readonly theme = inject(ThemeService);
  private readonly trackRepository = inject(TrackRepository);

  async ngOnInit(): Promise<void> {
    await this.refreshCount();
  }

  protected iconColor(): string {
    return this.theme.className() === 'dark' ? '#EBDDC8' : '#192028';
  }

  protected async rescan(): Promise<void> {
    await this.scanner.scan();
    await this.refreshCount();
    await this.songs()?.refresh();
    await this.albumsView()?.refresh();
    await this.artistsView()?.refresh();
    await this.foldersView()?.refresh();
  }

  protected setSection(section: LibrarySection): void {
    this.sectionState.set(section);
  }

  protected sectionChipClass(section: LibrarySection): string {
    const active = this.sectionState() === section;
    return `rounded-full px-4 py-2 ${active ? 'bg-primary' : 'bg-surface-elevated'}`;
  }

  protected sectionChipTextClass(section: LibrarySection): string {
    const active = this.sectionState() === section;
    return `font-sans text-callout font-medium ${active ? 'text-on-primary' : 'text-text'}`;
  }

  protected hasTracks(): boolean {
    return this.trackCount() > 0;
  }

  protected async refreshCount(): Promise<void> {
    this.trackCount.set(await this.trackRepository.countTracks());
  }

  protected scanned(): number {
    const state = this.scanner.state();
    return state.state === 'scanning' ? state.scanned : 0;
  }

  protected total(): number {
    const state = this.scanner.state();
    return state.state === 'scanning' ? state.total : 0;
  }

  protected scanMessage(): string {
    const state = this.scanner.state();
    switch (state.state) {
      case 'done':
        return state.total === 0
          ? 'No se encontró música en este dispositivo.'
          : `${state.total} canciones · ${state.added} nuevas · ${state.updated} actualizadas · ${state.removed} eliminadas`;
      case 'error':
        return state.message;
      default:
        return '';
    }
  }
}
