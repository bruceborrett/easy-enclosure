import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';

import { DEFAULT_PARAMS } from '../../core/params';
import { EnclosureStateService } from '../../core/state/enclosure-state.service';
import { RendererComponent } from './renderer.component';

describe('RendererComponent', () => {
  let component: RendererComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RendererComponent],
    }).compileComponents();
  });

  it('renders updated params from state and clears loading after render cycle', fakeAsync(() => {
    const fixture = TestBed.createComponent(RendererComponent);
    component = fixture.componentInstance;

    const renderModelSpy = spyOn(component as any, 'renderModel').and.returnValue(
      Promise.resolve(),
    );

    fixture.detectChanges();
    tick(260);
    flushMicrotasks();

    renderModelSpy.calls.reset();

    const localState = fixture.debugElement.injector.get(EnclosureStateService);
    localState.updateParam('length', 123);
    (component as any).scheduleModelRender(localState.params());

    tick(260);
    flushMicrotasks();

    expect(renderModelSpy).toHaveBeenCalled();
    expect(localState.loading()).toBeFalse();
  }));

  describe('buildGridGeometry', () => {
    it('returns null when gridSpacing is 0', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;
      const result = (component as any).buildGridGeometry({
        ...DEFAULT_PARAMS,
        gridSpacing: 0,
      });
      expect(result).toBeNull();
    });

    it('returns a plane Geom3 and a lines path2 when gridSpacing is positive', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;
      const result = (component as any).buildGridGeometry({
        ...DEFAULT_PARAMS,
        gridSpacing: 10,
      });
      expect(result).not.toBeNull();
      expect(result.plane.type).toBe('3d');
      expect(result.plane.polygons.length).toBeGreaterThan(0);
      // path2 carries ordered points (line segment vertices in pairs).
      expect(Array.isArray(result.lines.points)).toBeTrue();
      expect(result.lines.points.length).toBeGreaterThanOrEqual(4);
      // The path2 is positioned above the floor (z translation in the
      // transforms matrix is non-zero on the Z row).
      const t = result.lines.transforms;
      expect(t[14]).not.toBe(0);
    });

    it('scales point count with spacing', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;
      const coarse = (component as any).buildGridGeometry({
        ...DEFAULT_PARAMS,
        gridSpacing: 50,
      });
      const fine = (component as any).buildGridGeometry({
        ...DEFAULT_PARAMS,
        gridSpacing: 5,
      });
      // Finer spacing = more grid lines = more points in the path2.
      expect(coarse.lines.points.length).toBeLessThan(fine.lines.points.length);
    });
  });
});
