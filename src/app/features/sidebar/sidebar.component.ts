import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { APP_VERSION } from '../../app-version';
import { EnclosureStateService } from '../../core/state/enclosure-state.service';
import { FundingComponent } from '../../shared/funding/funding.component';
import { ParamsFormComponent } from '../params/params-form.component';
import { ToolsComponent } from '../tools/tools.component';

type SidebarSection = 'params' | 'funding';
type SidebarSide = 'left' | 'right';

const SIDEBAR_OPEN_KEY = 'easy-enclosure.sidebar.open';
const SIDEBAR_SIDE_KEY = 'easy-enclosure.sidebar.side';
const SIDEBAR_COMPACT_KEY = 'easy-enclosure.sidebar.compact';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolsComponent, ParamsFormComponent, FundingComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly state = inject(EnclosureStateService);

  readonly appVersion = APP_VERSION.trim().length > 0 ? APP_VERSION : 'dev';
  readonly sidebarOpen = signal(this.readStoredBoolean(SIDEBAR_OPEN_KEY, true));
  readonly sidebarSide = signal<SidebarSide>(this.readStoredSide());
  readonly compactMode = signal(this.readStoredBoolean(SIDEBAR_COMPACT_KEY, false));
  readonly activeSidebarSection = signal<SidebarSection>('params');

  readonly enclosureMeasurements = computed(() => {
    const params = this.state.params();
    const innerWallThickness = params.waterProof
      ? params.wall * 2 + params.insertClearance * 2 + params.insertThickness
      : params.wall;

    const wallToWall = {
      width: Math.max(0, params.width - innerWallThickness * 2),
      length: Math.max(0, params.length - innerWallThickness * 2),
    };

    let screwToScrew: { width: number; length: number } | null = null;
    if (params.lidScrews) {
      const diameterMax = Math.max(params.baseLidScrewDiameter, params.lidScrewDiameter);
      const offset = diameterMax / 2 + params.cornerRadius / 4 + params.wall / 2;
      screwToScrew = {
        width: Math.max(0, params.width - offset * 2),
        length: Math.max(0, params.length - offset * 2),
      };
    }

    return {
      wallToWall,
      screwToScrew,
    };
  });

  toggleSidebar(): void {
    this.sidebarOpen.update((value) => {
      const next = !value;
      this.storeBoolean(SIDEBAR_OPEN_KEY, next);
      return next;
    });
  }

  toggleSidebarSide(): void {
    this.sidebarSide.update((value) => {
      const next: SidebarSide = value === 'right' ? 'left' : 'right';
      this.storeString(SIDEBAR_SIDE_KEY, next);
      return next;
    });
  }

  toggleCompactMode(): void {
    this.compactMode.update((value) => {
      const next = !value;
      this.storeBoolean(SIDEBAR_COMPACT_KEY, next);
      return next;
    });
    this.activeSidebarSection.set('params');
  }

  setActiveSidebarSection(section: SidebarSection): void {
    if (this.activeSidebarSection() === section) {
      return;
    }
    this.activeSidebarSection.set(section);
  }

  formatMm(value: number): string {
    return `${value.toFixed(2)} mm`;
  }

  private readStoredBoolean(key: string, fallback: boolean): boolean {
    if (typeof localStorage === 'undefined') {
      return fallback;
    }

    const value = localStorage.getItem(key);
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return fallback;
  }

  private readStoredSide(): SidebarSide {
    if (typeof localStorage === 'undefined') {
      return 'right';
    }

    const value = localStorage.getItem(SIDEBAR_SIDE_KEY);
    return value === 'left' ? 'left' : 'right';
  }

  private storeBoolean(key: string, value: boolean): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(key, value ? 'true' : 'false');
  }

  private storeString(key: string, value: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(key, value);
  }
}
