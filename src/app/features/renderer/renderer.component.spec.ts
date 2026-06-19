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
    it('returns null when gridSpacing is 0', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;
      const result = (component as any).buildGridEntity({
        ...DEFAULT_PARAMS,
        gridSpacing: 0,
      });
      expect(result).toBeNull();
    });

    it('returns a drawGrid entity sized to gridWidth/gridLength', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;
      const result = (component as any).buildGridEntity({
        ...DEFAULT_PARAMS,
        gridSpacing: 10,
        gridWidth: 200,
        gridLength: 150,
      });
      expect(result).not.toBeNull();
      expect(result.visuals.drawCmd).toBe('drawGrid');
      expect(result.visuals.show).toBe(true);
      // Rectangular extent [width, length].
      expect(result.size).toEqual([200, 150]);
      // ticks[1] = minor step = spacing; ticks[0] = major step = 5× spacing.
      expect(result.ticks[1]).toBe(10);
      expect(result.ticks[0]).toBe(50);
    });

    it('disables fadeOut while the grid is within 320 mm', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;
      const result = (component as any).buildGridEntity({
        ...DEFAULT_PARAMS,
        gridSpacing: 10,
        gridWidth: 320,
        gridLength: 320,
      });
      expect(result.visuals.fadeOut).toBe(false);
    });

    it('enables fadeOut once the grid exceeds 320 mm on either side', () => {
      const fixture = TestBed.createComponent(RendererComponent);
      component = fixture.componentInstance;
      const wide = (component as any).buildGridEntity({
        ...DEFAULT_PARAMS,
        gridSpacing: 10,
        gridWidth: 400,
        gridLength: 320,
      });
      const long = (component as any).buildGridEntity({
        ...DEFAULT_PARAMS,
        gridSpacing: 10,
        gridWidth: 320,
        gridLength: 400,
      });
      expect(wide.visuals.fadeOut).toBe(true);
      expect(long.visuals.fadeOut).toBe(true);
    });
  });
});
