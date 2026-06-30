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

  describe('buildGridEntity', () => {
    it('returns null when showGrid is false', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;
      const result = (component as any).buildGridEntity(
        {
          ...DEFAULT_PARAMS,
          showGrid: false,
          gridSpacing: 10,
        },
        [
          [-50, -40, 0],
          [50, 40, 30],
        ],
      );
      expect(result).toBeNull();
    });

    it('returns null when gridSpacing is 0', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;
      const result = (component as any).buildGridEntity(
        {
          ...DEFAULT_PARAMS,
          showGrid: true,
          gridSpacing: 0,
        },
        [
          [-50, -40, 0],
          [50, 40, 30],
        ],
      );
      expect(result).toBeNull();
    });

    it('returns a drawGrid entity centered on measured bounds', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;
      const bounds = [
        [-180, -60, 0],
        [140, 90, 30],
      ];
      const result = (component as any).buildGridEntity(
        {
          ...DEFAULT_PARAMS,
          showGrid: true,
          gridSpacing: 10,
        },
        bounds,
      );

      expect(result).not.toBeNull();
      expect(result.visuals.drawCmd).toBe('drawGrid');
      expect(result.visuals.show).toBe(true);
      expect(result.visuals.fadeOut).toBe(true);
      expect(result.ticks[1]).toBe(10);
      expect(result.ticks[0]).toBe(50);
      expect(result.model).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -20, 15, 0, 1]);
      expect(result.fadeCenter).toEqual([-20, 15]);
      expect(result.fadeDistance).toBe(325);
      // drawGrid interprets size[0] as Y span and size[1] as X span.
      expect(result.size).toEqual([450, 650]);
    });
  });
});
