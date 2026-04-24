import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { APP_VERSION } from '../../app-version';
import { EnclosureStateService } from '../../core/state/enclosure-state.service';
import { FundingComponent } from '../../shared/funding/funding.component';
import { ParamsFormComponent } from '../params/params-form.component';
import { ToolsComponent } from '../tools/tools.component';

type SidebarSection = 'params' | 'funding';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolsComponent, ParamsFormComponent, FundingComponent],
  host: {
    class: 'block h-full',
  },
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly state = inject(EnclosureStateService);

  readonly appVersion = APP_VERSION.trim().length > 0 ? APP_VERSION : 'dev';
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

  setActiveSidebarSection(section: SidebarSection): void {
    if (this.activeSidebarSection() === section) {
      return;
    }
    this.activeSidebarSection.set(section);
  }

  formatMm(value: number): string {
    return `${value.toFixed(2)} mm`;
  }
}
