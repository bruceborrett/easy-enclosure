import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import type {
  CableClamp,
  Hole,
  InternalWall,
  MeasurementSystem,
  PCBMount,
  Params,
  PCBPreview,
  SnapFit,
} from '../../core/params';
import { DEFAULT_CABLE_CLAMP } from '../../core/params';
import { EnclosureStateService } from '../../core/state/enclosure-state.service';
import { mmToInches } from '../../core/units';

type Surface = 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back';

@Component({
  selector: 'app-params-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './params-form.component.html',
  styleUrl: './params-form.component.css',
})
export class ParamsFormComponent {
  private readonly state = inject(EnclosureStateService);

  readonly activeTab = signal<number | null>(null);

  readonly surfaces: Surface[] = ['front', 'right', 'back', 'left', 'top', 'bottom'];

  surfaceLabel(surface: Surface): string {
    if (surface === 'top') {
      return 'Lid';
    }
    return surface[0].toUpperCase() + surface.slice(1);
  }

  params(): Params {
    return this.state.params();
  }

  measurementSystem(): MeasurementSystem {
    return this.params().measurementSystem ?? 'metric';
  }

  isImperial(): boolean {
    return this.measurementSystem() === 'imperial';
  }

  unit(): string {
    return this.isImperial() ? 'in' : 'mm';
  }

  setMeasurementSystem(system: MeasurementSystem): void {
    this.state.setMeasurementSystem(system);
  }

  setActiveTab(tab: number): void {
    this.activeTab.set(this.activeTab() === tab ? null : tab);
  }

  resetToSimpleEnclosure(): void {
    this.state.resetToSimpleEnclosure();
    this.activeTab.set(1);
  }

  setNumberParam<K extends keyof Params>(key: K, rawValue: string): void {
    if (!rawValue) {
      return;
    }
    const parsed = parseFloat(rawValue);
    if (!Number.isNaN(parsed)) {
      this.state.updateParam(key, parsed as Params[K]);
    }
  }

  setBooleanParam<K extends keyof Params>(key: K, checked: boolean): void {
    this.state.updateParam(key, checked as Params[K]);
  }

  addHole(): void {
    const current = this.params();
    const isImp = current.measurementSystem === 'imperial';
    const next: Hole = {
      shape: 'circle',
      surface: 'front',
      diameter: isImp ? mmToInches(12.5) : 12.5,
      width: isImp ? mmToInches(10) : 10,
      length: isImp ? mmToInches(10) : 10,
      flatWidth: isImp ? mmToInches(11) : 11,
      rotation: 0,
      y: Number((current.width / 2).toFixed(isImp ? 4 : 2)),
      x: isImp ? mmToInches(6) : 6,
    };
    this.state.patchParams({ holes: [...current.holes, next] });
  }

  removeHole(index: number): void {
    const current = this.params();
    this.state.patchParams({ holes: current.holes.filter((_, i) => i !== index) });
  }

  updateHole(index: number, patch: Partial<Hole>): void {
    const current = this.params();
    const isImp = current.measurementSystem === 'imperial';
    this.state.patchParams({
      holes: current.holes.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, ...patch };
        if (patch.shape === 'double-d') {
          if (updated.flatWidth === undefined) {
            const defaultFlat = isImp ? mmToInches(11) : 11;
            updated.flatWidth = updated.diameter
              ? Number((updated.diameter * 0.9).toFixed(isImp ? 4 : 1))
              : defaultFlat;
          }
          if (updated.rotation === undefined) {
            updated.rotation = 0;
          }
        }
        return updated;
      }),
    });
  }

  addPcbMount(): void {
    const current = this.params();
    const isImp = current.measurementSystem === 'imperial';
    const next: PCBMount = {
      surface: 'bottom',
      x: 0,
      y: 0,
      height: isImp ? mmToInches(5) : 5,
      outerDiameter: isImp ? mmToInches(6) : 6,
      screwDiameter: isImp ? mmToInches(2) : 2,
      chamfer: true,
    };
    this.state.patchParams({ pcbMounts: [...current.pcbMounts, next] });
  }

  removePcbMount(index: number): void {
    const current = this.params();
    this.state.patchParams({ pcbMounts: current.pcbMounts.filter((_, i) => i !== index) });
  }

  updatePcbMount(index: number, patch: Partial<PCBMount>): void {
    const current = this.params();
    this.state.patchParams({
      pcbMounts: current.pcbMounts.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  }

  addInternalWall(): void {
    const current = this.params();
    const isImp = current.measurementSystem === 'imperial';
    const next: InternalWall = {
      x: 0,
      y: 0,
      height: isImp ? mmToInches(10) : 10,
      length: isImp ? mmToInches(25) : 25,
      thickness: isImp ? mmToInches(2) : 2,
      rotation: 0,
    };
    this.state.patchParams({ internalWalls: [...current.internalWalls, next] });
  }

  removeInternalWall(index: number): void {
    const current = this.params();
    this.state.patchParams({ internalWalls: current.internalWalls.filter((_, i) => i !== index) });
  }

  updateInternalWall(index: number, patch: Partial<InternalWall>): void {
    const current = this.params();
    this.state.patchParams({
      internalWalls: current.internalWalls.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  }

  addCableClamp(): void {
    const current = this.params();
    const isImp = current.measurementSystem === 'imperial';
    const baseClamp = DEFAULT_CABLE_CLAMP;
    const next: CableClamp = isImp
      ? {
          ...baseClamp,
          length: mmToInches(baseClamp.length),
          wallHeight: mmToInches(baseClamp.wallHeight),
          wallThickness: mmToInches(baseClamp.wallThickness),
          mountScrewDiameter: mmToInches(baseClamp.mountScrewDiameter),
          mountOuterDiameter: mmToInches(baseClamp.mountOuterDiameter),
          mountHeight: mmToInches(baseClamp.mountHeight),
          topHeight: mmToInches(baseClamp.topHeight),
          topScrewDiameter: mmToInches(baseClamp.topScrewDiameter),
        }
      : { ...baseClamp };
    this.state.patchParams({ cableClamps: [...(current.cableClamps ?? []), next] });
  }

  removeCableClamp(index: number): void {
    const current = this.params();
    this.state.patchParams({
      cableClamps: (current.cableClamps ?? []).filter((_, i) => i !== index),
    });
  }

  updateCableClamp(index: number, patch: Partial<CableClamp>): void {
    const current = this.params();
    this.state.patchParams({
      cableClamps: (current.cableClamps ?? []).map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  }

  onWaterproofChange(checked: boolean): void {
    this.state.patchParams({
      waterProof: checked,
      lidScrews: checked ? true : this.params().lidScrews,
    });
  }

  onLidScrewsChange(checked: boolean): void {
    this.state.patchParams({
      lidScrews: checked,
      waterProof: checked ? this.params().waterProof : false,
    });
  }

  setStringParam<K extends keyof Params>(key: K, value: Params[K]): void {
    this.state.updateParam(key, value);
  }

  onDinRailMountChange(checked: boolean): void {
    this.state.patchParams({
      dinRailMount: checked,
      wallMounts: checked ? true : this.params().wallMounts,
    });
  }

  parseIntValue(rawValue: string): number {
    return parseInt(rawValue, 10);
  }

  setSnapFitEnabled(enabled: boolean): void {
    const current = this.params();
    this.state.patchParams({
      snapFit: {
        ...current.snapFit,
        enabled,
      },
    });
  }

  setSnapFitPreset(rawValue: string): void {
    const preset = parseInt(rawValue, 10);
    if (preset === 4 || preset === 6 || preset === 8) {
      const current = this.params();
      this.state.patchParams({
        snapFit: {
          ...current.snapFit,
          preset,
        },
      });
    }
  }

  setSnapFitNumber<K extends keyof SnapFit>(key: K, rawValue: string): void {
    if (!rawValue) {
      return;
    }
    const parsed = parseFloat(rawValue);
    if (!Number.isNaN(parsed)) {
      const current = this.params();
      this.state.patchParams({
        snapFit: {
          ...current.snapFit,
          [key]: parsed,
        },
      });
    }
  }

  setPcbPreviewEnabled(checked: boolean): void {
    const current = this.params();
    this.state.patchParams({
      pcbPreview: {
        ...current.pcbPreview,
        enabled: checked,
      },
    });
  }

  setPcbPreviewNumber<K extends Exclude<keyof PCBPreview, 'enabled'>>(
    key: K,
    rawValue: string,
  ): void {
    if (!rawValue) {
      return;
    }
    const parsed = parseFloat(rawValue);
    if (!Number.isNaN(parsed)) {
      const current = this.params();
      this.state.patchParams({
        pcbPreview: {
          ...current.pcbPreview,
          [key]: parsed,
        },
      });
    }
  }
}
