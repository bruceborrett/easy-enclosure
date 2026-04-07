import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_PARAMS, Params, cloneParams } from '../params';

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

  patchParams(patch: Partial<Params>): void {
    this.params.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  updateParam<K extends keyof Params>(key: K, value: Params[K]): void {
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
      waterProof: false,
      wallMounts: false,
      lidScrews: false,
    }));
  }
}
