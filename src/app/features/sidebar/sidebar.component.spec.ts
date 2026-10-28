import { TestBed } from '@angular/core/testing';

import { EnclosureStateService } from '../../core/state/enclosure-state.service';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let state: EnclosureStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    state = TestBed.inject(EnclosureStateService);
    fixture.detectChanges();
  });

  it('formats dimensions in mm when metric is active', () => {
    expect(state.params().measurementSystem).toBe('metric');
    const measurements = component.enclosureMeasurements();
    expect(measurements.wallToWall.width).toBeGreaterThan(0);
    expect(component.formatMm(measurements.wallToWall.width)).toContain('mm');
  });

  it('formats dimensions in in when imperial is active', () => {
    state.setMeasurementSystem('imperial');
    expect(state.params().measurementSystem).toBe('imperial');
    const measurements = component.enclosureMeasurements();
    expect(component.formatMm(measurements.wallToWall.width)).toContain('in');
  });
});
