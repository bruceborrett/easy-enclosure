import { TestBed } from '@angular/core/testing';
import JSZip from 'jszip';

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

  it('has all checklist items checked by default', () => {
    expect(component.exportBase()).toBeTrue();
    expect(component.exportLid()).toBeTrue();
    expect(component.exportSeal()).toBeTrue();
    expect(component.exportPcbMounts()).toBeTrue();
    expect(component.exportDinRail()).toBeTrue();
  });

  it('resets all checklist items to checked by default when opening export modal', () => {
    component.exportBase.set(false);
    component.exportLid.set(false);
    component.openExportModal();

    expect(component.exportBase()).toBeTrue();
    expect(component.exportLid()).toBeTrue();
    expect(component.exportSeal()).toBeTrue();
    expect(component.exportPcbMounts()).toBeTrue();
    expect(component.exportDinRail()).toBeTrue();
  });

  it('exports multiple STL artifacts bundled in a ZIP when multiple options are checked', async () => {
    const saveSpy = spyOn(component as any, 'saveFile');
    const closeSpy = spyOn(component, 'closeExportModal');

    const simple = cloneParams(state.params());
    simple.pcbMounts = [];
    simple.internalWalls = [];
    simple.waterProof = true;
    state.setParams(simple);

    await component.exportSelected();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.any(Blob),
      jasmine.stringMatching(/^enclosure-\d+\.zip$/),
    );
    const savedBlob = saveSpy.calls.mostRecent().args[0] as Blob;
    const zip = await JSZip.loadAsync(savedBlob);
    const fileNames = Object.keys(zip.files).join(' ');
    expect(fileNames).toContain('enclosure-lid-');
    expect(fileNames).toContain('enclosure-base-');
    expect(fileNames).toContain('enclosure-waterproof-seal-');
    expect(closeSpy).toHaveBeenCalled();
  });

  it('exports a single STL directly when only enclosure base is selected', async () => {
    const saveSpy = spyOn(component as any, 'saveFile');
    const closeSpy = spyOn(component, 'closeExportModal');

    component.exportBase.set(true);
    component.exportLid.set(false);
    component.exportSeal.set(false);
    component.exportPcbMounts.set(false);
    component.exportDinRail.set(false);

    await component.exportSelected();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.any(Blob),
      jasmine.stringMatching(/^enclosure-base-\d+\.stl$/),
    );
    expect(closeSpy).toHaveBeenCalled();
  });

  it('exports a single STL directly when only enclosure lid is selected', async () => {
    const saveSpy = spyOn(component as any, 'saveFile');
    const closeSpy = spyOn(component, 'closeExportModal');

    component.exportBase.set(false);
    component.exportLid.set(true);
    component.exportSeal.set(false);
    component.exportPcbMounts.set(false);
    component.exportDinRail.set(false);

    await component.exportSelected();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.any(Blob),
      jasmine.stringMatching(/^enclosure-lid-\d+\.stl$/),
    );
    expect(closeSpy).toHaveBeenCalled();
  });

  it('exports only base and lid pcb mount STL artifacts in a zip when both exist', async () => {
    const saveSpy = spyOn(component as any, 'saveFile');
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

    await component.exportPcbMountsStl();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.any(Blob),
      jasmine.stringMatching(/^enclosure-\d+\.zip$/),
    );
    const savedBlob = saveSpy.calls.mostRecent().args[0] as Blob;
    const zip = await JSZip.loadAsync(savedBlob);
    const fileNames = Object.keys(zip.files).join(' ');
    expect(fileNames).toContain('enclosure-pcb-mounts-base-');
    expect(fileNames).toContain('enclosure-pcb-mounts-lid-');
    expect(fileNames).not.toContain('enclosure-base-');
    expect(fileNames).not.toContain('enclosure-lid-');
    expect(fileNames).not.toContain('enclosure-waterproof-seal-');
    expect(closeSpy).toHaveBeenCalled();
  });

  it('exports single STL when only base PCB mounts exist and PCB mounts is selected', async () => {
    const saveSpy = spyOn(component as any, 'saveFile');
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
    ];
    state.setParams(params);

    await component.exportPcbMountsStl();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.any(Blob),
      jasmine.stringMatching(/^enclosure-pcb-mounts-base-\d+\.stl$/),
    );
    expect(closeSpy).toHaveBeenCalled();
  });

  it('skips pcb mount export when no mounts exist', async () => {
    const saveSpy = spyOn(component as any, 'saveFile');
    const closeSpy = spyOn(component, 'closeExportModal');

    const params = cloneParams(state.params());
    params.pcbMounts = [];
    state.setParams(params);

    await component.exportPcbMountsStl();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('exports din rail mount STL when enabled during full enclosure export', async () => {
    const saveSpy = spyOn(component as any, 'saveFile');
    const closeSpy = spyOn(component, 'closeExportModal');

    const params = cloneParams(state.params());
    params.dinRailMount = true;
    state.setParams(params);

    await component.exportSelected();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.any(Blob),
      jasmine.stringMatching(/^enclosure-\d+\.zip$/),
    );
    const savedBlob = saveSpy.calls.mostRecent().args[0] as Blob;
    const zip = await JSZip.loadAsync(savedBlob);
    const fileNames = Object.keys(zip.files).join(' ');
    expect(fileNames).toContain('enclosure-din-rail-mount-');
    expect(closeSpy).toHaveBeenCalled();
  });

  it('exports only din rail mount STL via exportDinRailMountsStl', async () => {
    const saveSpy = spyOn(component as any, 'saveFile');
    const closeSpy = spyOn(component, 'closeExportModal');

    const params = cloneParams(state.params());
    params.dinRailMount = true;
    state.setParams(params);

    await component.exportDinRailMountsStl();

    expect(saveSpy).toHaveBeenCalledWith(
      jasmine.any(Blob),
      jasmine.stringMatching(/^enclosure-din-rail-mount-\d+\.stl$/),
    );
    expect(closeSpy).toHaveBeenCalled();
  });

  it('disables export when all items are unchecked', async () => {
    const saveSpy = spyOn(component as any, 'saveFile');
    component.exportBase.set(false);
    component.exportLid.set(false);
    component.exportSeal.set(false);
    component.exportPcbMounts.set(false);
    component.exportDinRail.set(false);

    expect(component.selectedCount()).toBe(0);
    expect(component.downloadButtonText()).toBe('Download');

    await component.exportSelected();
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
