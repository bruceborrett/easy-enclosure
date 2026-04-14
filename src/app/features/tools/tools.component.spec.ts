import { TestBed } from '@angular/core/testing';

import { cloneParams } from '../../core/params';
import { EnclosureStateService } from '../../core/state/enclosure-state.service';
import { ToolsComponent } from './tools.component';

describe('ToolsComponent', () => {
  let component: ToolsComponent;
  let state: EnclosureStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolsComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ToolsComponent);
    component = fixture.componentInstance;
    state = TestBed.inject(EnclosureStateService);
    fixture.detectChanges();
  });

  it('opens and closes export modal', () => {
    component.openExportModal();
    expect(component.isExportModalOpen()).toBeTrue();

    component.closeExportModal();
    expect(component.isExportModalOpen()).toBeFalse();
  });

  it('saves params as json file', () => {
    const saveSpy = spyOn(component as any, 'saveFile');

    component.saveParamsFile();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.any(Blob),
      jasmine.stringMatching(/^enclosure-\d+\.json$/),
    );
  });

  it('loads params from json and merges with current settings', () => {
    const originalFileReader = globalThis.FileReader;

    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;

      readAsText(): void {
        this.result = '{"length": 145, "waterProof": false}';
        if (this.onload) {
          this.onload.call(
            this as unknown as FileReader,
            new ProgressEvent('load') as ProgressEvent<FileReader>,
          );
        }
      }
    }

    (globalThis as { FileReader: typeof FileReader }).FileReader =
      MockFileReader as unknown as typeof FileReader;
    (window as Window & { FileReader: typeof FileReader }).FileReader =
      MockFileReader as unknown as typeof FileReader;

    try {
      const input = document.createElement('input');
      const file = new File(['{"length": 145}'], 'params.json', { type: 'application/json' });
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
      } as unknown as FileList;
      Object.defineProperty(input, 'files', { value: fileList });

      component.loadParamsFile({ target: input } as unknown as Event);

      expect(state.params().length).toBe(145);
      expect(state.params().waterProof).toBeFalse();
      expect(state.params().width).toBe(100);
      expect(input.value).toBe('');
    } finally {
      (globalThis as { FileReader: typeof FileReader }).FileReader = originalFileReader;
      (window as Window & { FileReader: typeof FileReader }).FileReader = originalFileReader;
    }
  });

  it('exports the expected STL artifacts for a simple waterproof enclosure', () => {
    const exportGeometrySpy = spyOn(component as never, 'exportGeometry' as never);
    const closeSpy = spyOn(component, 'closeExportModal');

    const simple = cloneParams(state.params());
    simple.pcbMounts = [];
    simple.internalWalls = [];
    simple.waterProof = true;
    state.setParams(simple);

    component.exportStl();

    const exportedNames = exportGeometrySpy.calls
      .allArgs()
      .map((args) => args[0] as string)
      .join(' ');
    expect(exportedNames).toContain('enclosure-lid-');
    expect(exportedNames).toContain('enclosure-base-');
    expect(exportedNames).toContain('enclosure-waterproof-seal-');
    expect(closeSpy).toHaveBeenCalled();
  });

  it('exports only base and lid pcb mount STL artifacts', () => {
    const exportGeometrySpy = spyOn(component as never, 'exportGeometry' as never);
    const closeSpy = spyOn(component, 'closeExportModal');

    const params = cloneParams(state.params());
    params.pcbMounts = [
      {
        x: 10,
        y: 10,
        height: 8,
        outerDiameter: 6,
        screwDiameter: 3,
        surface: 'bottom',
      },
      {
        x: 20,
        y: 20,
        height: 8,
        outerDiameter: 6,
        screwDiameter: 3,
        surface: 'top',
      },
    ];
    state.setParams(params);

    component.exportPcbMountsStl();

    const exportedNames = exportGeometrySpy.calls
      .allArgs()
      .map((args) => args[0] as string)
      .join(' ');
    expect(exportedNames).toContain('enclosure-pcb-mounts-base-');
    expect(exportedNames).toContain('enclosure-pcb-mounts-lid-');
    expect(exportedNames).not.toContain('enclosure-base-');
    expect(exportedNames).not.toContain('enclosure-lid-');
    expect(exportedNames).not.toContain('enclosure-waterproof-seal-');
    expect(closeSpy).toHaveBeenCalled();
  });

  it('skips pcb mount export when no mounts exist', () => {
    const exportGeometrySpy = spyOn(component as never, 'exportGeometry' as never);
    const closeSpy = spyOn(component, 'closeExportModal');

    const params = cloneParams(state.params());
    params.pcbMounts = [];
    state.setParams(params);

    component.exportPcbMountsStl();

    expect(exportGeometrySpy).not.toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });
});
