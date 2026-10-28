import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_PARAMS, type MeasurementSystem, type Params, cloneParams } from '../params';
import { convertParams } from '../units';

@Injectable({ providedIn: 'root' })
export class EnclosureStateService {
  private readonly defaults = cloneParams(DEFAULT_PARAMS);

  readonly params = signal<Params>(cloneParams(this.defaults));
  readonly loading = signal(false);

  readonly holeCount = computed(() => this.params().holes.length);

  setLoading(isLoading: boolean): void {
    this.loading.set(isLoading);
  }

  setParams(next: Params): void {
    this.params.set(cloneParams(next));
  }

  setMeasurementSystem(system: MeasurementSystem): void {
    const current = this.params();
    if ((current.measurementSystem ?? 'metric') === system) {
      return;
    }
    const converted = convertParams(current, system);
    this.params.set(converted);
  }

  patchParams(patch: Partial<Params>): void {
    if (
      patch.measurementSystem !== undefined &&
      patch.measurementSystem !== (this.params().measurementSystem ?? 'metric')
    ) {
      this.setMeasurementSystem(patch.measurementSystem);
      const { measurementSystem: _, ...rest } = patch;
      if (Object.keys(rest).length > 0) {
        this.params.update((current) => ({
          ...current,
          ...rest,
        }));
      }
      return;
    }

    this.params.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  updateParam<K extends keyof Params>(key: K, value: Params[K]): void {
    if (key === 'measurementSystem') {
      this.setMeasurementSystem(value as MeasurementSystem);
      return;
    }

    this.params.update((current) => ({
      ...current,
      [key]: value,
    }));
  }

  resetToDefaults(): void {
    this.params.set(cloneParams(this.defaults));
    this.loading.set(false);
  }

  resetToSimpleEnclosure(): void {
    this.params.update((current) => ({
      ...current,
      holes: [],
      pcbMounts: [],
      internalWalls: [],
      cableClamps: [],
      waterProof: false,
      wallMounts: false,
      lidScrews: false,
      dinRailMount: false,
      snapFit: {
        ...current.snapFit,
        enabled: false,
      },
      pcbPreview: {
        ...current.pcbPreview,
        enabled: false,
      },
    }));
  }
}
