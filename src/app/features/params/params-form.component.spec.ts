import { TestBed } from '@angular/core/testing';

import { EnclosureStateService } from '../../core/state/enclosure-state.service';
import { ParamsFormComponent } from './params-form.component';

describe('ParamsFormComponent', () => {
  let component: ParamsFormComponent;
  let state: EnclosureStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParamsFormComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ParamsFormComponent);
    component = fixture.componentInstance;
    state = TestBed.inject(EnclosureStateService);
    fixture.detectChanges();
  });

  it('toggles accordion tabs', () => {
    component.setActiveTab(1);
    expect(component.activeTab()).toBe(1);

    component.setActiveTab(1);
    expect(component.activeTab()).toBeNull();
  });

  it('resets to simple enclosure and opens general tab', () => {
    component.setActiveTab(6);
    component.resetToSimpleEnclosure();

    expect(component.activeTab()).toBe(1);
    expect(state.params().holes.length).toBe(0);
    expect(state.params().pcbMounts.length).toBe(0);
    expect(state.params().internalWalls.length).toBe(0);
    expect(state.params().waterProof).toBeFalse();
    expect(state.params().lidScrews).toBeFalse();
  });

  it('supports dynamic holes CRUD operations', () => {
    const initialCount = state.params().holes.length;

    component.addHole();
    expect(state.params().holes.length).toBe(initialCount + 1);

    component.updateHole(initialCount, { shape: 'rectangle', length: 22, width: 9 });
    expect(state.params().holes[initialCount].shape).toBe('rectangle');
    expect(state.params().holes[initialCount].length).toBe(22);

    component.removeHole(initialCount);
    expect(state.params().holes.length).toBe(initialCount);
  });

  it('applies waterproof and lid screw coupling rules', () => {
    component.onWaterproofChange(false);
    expect(state.params().waterProof).toBeFalse();
    expect(state.params().lidScrews).toBeTrue();

    component.onLidScrewsChange(false);
    expect(state.params().lidScrews).toBeFalse();
    expect(state.params().waterProof).toBeFalse();
  });

  it('ignores empty numeric input', () => {
    const before = state.params().length;
    component.setNumberParam('length', '');
    expect(state.params().length).toBe(before);
  });
});
