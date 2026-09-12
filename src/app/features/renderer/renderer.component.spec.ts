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

  describe('pointer interaction and CAD orbit shifting', () => {
    it('pans (shifts orbit center) when dragging with ctrlKey', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;

      component.onPointerDown({
        pageX: 100,
        pageY: 100,
        pointerId: 1,
      } as PointerEvent);

      component.onPointerMove({
        pageX: 120,
        pageY: 110,
        ctrlKey: true,
        preventDefault: () => {},
      } as unknown as PointerEvent);

      const panDelta = (component as any).panDelta;
      const rotateDelta = (component as any).rotateDelta;

      expect(panDelta[0]).toBe(-20);
      expect(panDelta[1]).toBe(10);
      expect(rotateDelta).toEqual([0, 0]);
    });

    it('orbits (rotates) when dragging without modifier keys', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;

      component.onPointerDown({
        pageX: 100,
        pageY: 100,
        pointerId: 1,
      } as PointerEvent);

      component.onPointerMove({
        pageX: 120,
        pageY: 110,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        buttons: 1,
        preventDefault: () => {},
      } as unknown as PointerEvent);

      const panDelta = (component as any).panDelta;
      const rotateDelta = (component as any).rotateDelta;

      expect(rotateDelta[0]).toBe(20);
      expect(rotateDelta[1]).toBe(-10);
      expect(panDelta).toEqual([0, 0]);
    });
  });

  describe('renderModel with DIN rail mounts', () => {
    it('creates dinRailModel and positions it to the right of lid in line layout', async () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;

      const params = {
        ...DEFAULT_PARAMS,
        width: 100,
        length: 80,
        waterProof: false,
        dinRailMount: true,
        showDinRailMount: true,
        showLid: true,
        showBase: true,
      };

      await (component as any).renderModel(params, [
        'dinRailMount',
        'showDinRailMount',
        'width',
        'length',
      ]);

      expect((component as any).dinRailModel).not.toBeNull();
      const dinOrigin = (component as any).dinRailOrigin;
      const lidOrigin = (component as any).lidOrigin;
      // In line layout, dinRailOrigin X must be greater than lidOrigin X + width
      expect(dinOrigin[0]).toBeGreaterThan(lidOrigin[0] + params.width);
    });
  });
});

