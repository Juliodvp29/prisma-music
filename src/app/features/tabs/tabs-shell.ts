import { Component } from '@angular/core';
import { NativeTab, NativeTabsOutlet } from '@ng-native/router';

@Component({
  imports: [NativeTab, NativeTabsOutlet],
  selector: 'app-tabs-shell',
  template: `
    <native-tabs-outlet>
      <native-tab path="library" title="Biblioteca" />
      <native-tab path="playlists" title="Listas" />
      <native-tab path="search" title="Buscar" />
      <native-tab path="settings" title="Ajustes" />
    </native-tabs-outlet>
  `,
  styles: `
    :host {
      flex: 1;
    }
  `,
})
export class TabsShell {}
