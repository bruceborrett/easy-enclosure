import { TestBed } from '@angular/core/testing';
import { EnclosureStateService } from './enclosure-state.service';

describe('EnclosureStateService', () => {
  let service: EnclosureStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnclosureStateService);
  });

  it('starts with default params', () => {
    expect(service.params().length).toBe(80);
    expect(service.params().waterProof).toBeTrue();
    expect(service.params().holes.length).toBeGreaterThan(0);
  });

  it('supports targeted param updates', () => {
    service.updateParam('length', 120);
    service.patchParams({ width: 95, waterProof: false });

    expect(service.params().length).toBe(120);
    expect(service.params().width).toBe(95);
    expect(service.params().waterProof).toBeFalse();
  });

  it('resets to simple enclosure defaults', () => {
    service.resetToSimpleEnclosure();

    expect(service.params().holes).toEqual([]);
    expect(service.params().pcbMounts).toEqual([]);
    expect(service.params().internalWalls).toEqual([]);
    expect(service.params().waterProof).toBeFalse();
    expect(service.params().wallMounts).toBeFalse();
    expect(service.params().lidScrews).toBeFalse();
  });

  it('resets to full defaults', () => {
    service.updateParam('length', 123);
    service.setLoading(true);
    service.resetToDefaults();

    expect(service.params().length).toBe(80);
    expect(service.loading()).toBeFalse();
  });
});
