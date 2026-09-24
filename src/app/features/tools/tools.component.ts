import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import { union } from '@jscad/modeling/src/operations/booleans';
import { serialize } from '@jscad/stl-serializer';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { base } from '../../core/enclosure/base';
import { dinRailMount } from '../../core/enclosure/dinrailmount';
import { internalWalls } from '../../core/enclosure/internalwalls';
import { lid } from '../../core/enclosure/lid';
import { pcbMountsOnBase, pcbMountsOnLid } from '../../core/enclosure/pcbmount';
import { waterProofSeal } from '../../core/enclosure/waterproofseal';
import type { Params } from '../../core/params';
import { EnclosureStateService } from '../../core/state/enclosure-state.service';
import { ActionButtonComponent } from '../../shared/action-button/action-button.component';

@Component({
  selector: 'app-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActionButtonComponent],
  templateUrl: './tools.component.html',
})
export class ToolsComponent {
  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;

  @ViewChild('exportDialog')
  exportDialog?: ElementRef<HTMLDialogElement>;

  private readonly state = inject(EnclosureStateService);

  readonly isExportModalOpen = signal(false);
  readonly isExporting = signal(false);

  readonly hasSeal = computed(() => this.state.params().waterProof);
  readonly hasDinRailMount = computed(() => this.state.params().dinRailMount);
  readonly hasPcbMounts = computed(() => this.state.params().pcbMounts.length > 0);

  readonly exportBase = signal(true);
  readonly exportLid = signal(true);
  readonly exportSeal = signal(true);
  readonly exportPcbMounts = signal(true);
  readonly exportDinRail = signal(true);

  readonly selectedCount = computed(() => {
    let count = 0;
    if (this.exportBase()) count++;
    if (this.exportLid()) count++;
    if (this.hasSeal() && this.exportSeal()) count++;
    if (this.hasPcbMounts() && this.exportPcbMounts()) count++;
    if (this.hasDinRailMount() && this.exportDinRail()) count++;
    return count;
  });

  readonly willExportZip = computed(() => {
    let fileCount = 0;
    if (this.exportBase()) fileCount++;
    if (this.exportLid()) fileCount++;
    if (this.hasSeal() && this.exportSeal()) fileCount++;
    if (this.hasDinRailMount() && this.exportDinRail()) fileCount++;
    if (this.hasPcbMounts() && this.exportPcbMounts()) {
      const params = this.state.params();
      const hasBaseMounts = params.pcbMounts.some((m) => (m.surface ?? 'bottom') !== 'top');
      const hasLidMounts = params.pcbMounts.some((m) => (m.surface ?? 'bottom') === 'top');
      if (hasBaseMounts) fileCount++;
      if (hasLidMounts) fileCount++;
    }
    return fileCount > 1;
  });

  readonly downloadButtonText = computed(() => {
    if (this.selectedCount() === 0) {
      return 'Download';
    }
    return this.willExportZip() ? 'Download ZIP' : 'Download STL';
  });

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  openExportModal(): void {
    this.exportBase.set(true);
    this.exportLid.set(true);
    this.exportSeal.set(true);
    this.exportPcbMounts.set(true);
    this.exportDinRail.set(true);
    this.isExportModalOpen.set(true);
    const dialog = this.exportDialog?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  closeExportModal(): void {
    this.isExportModalOpen.set(false);
    const dialog = this.exportDialog?.nativeElement;
    if (dialog?.open) {
      dialog.close();
    }
  }

  saveParamsFile(): void {
    const tsStr = this.formattedTimestamp();
    const data = JSON.stringify(this.state.params(), null, 2);
    const textFile = new Blob([data], { type: 'text/plain' });
    this.saveFile(textFile, `enclosure-${tsStr}.json`);
  }

  loadParamsFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      const data = JSON.parse(fileReader.result as string) as Partial<Params>;
      const merged = {
        ...this.state.params(),
        ...data,
      };
      this.state.setParams(merged as Params);
    };
    fileReader.readAsText(input.files[0], 'UTF-8');

    input.value = '';
  }

  async exportSelected(): Promise<void> {
    if (this.selectedCount() === 0 || this.isExporting()) {
      return;
    }

    this.isExporting.set(true);
    try {
      const tsStr = this.formattedTimestamp();
      const currentParams = this.state.params();
      const files: { name: string; blob: Blob }[] = [];

      if (this.exportBase()) {
        const baseParts: Geom3[] = [base(currentParams)];
        const baseMounts = pcbMountsOnBase(currentParams);

        if (baseMounts) {
          baseParts.push(baseMounts);
        }

        if (currentParams.internalWalls.length > 0) {
          baseParts.push(internalWalls(currentParams));
        }

        const baseGeometry = baseParts.length > 1 ? union(baseParts) : baseParts[0];
        files.push({
          name: `enclosure-base-${tsStr}.stl`,
          blob: this.geometryToBlob(baseGeometry),
        });
      }

      if (this.exportLid()) {
        const lidMounts = pcbMountsOnLid(currentParams);
        const lidGeometry = lidMounts ? union([lid(currentParams), lidMounts]) : lid(currentParams);
        files.push({
          name: `enclosure-lid-${tsStr}.stl`,
          blob: this.geometryToBlob(lidGeometry),
        });
      }

      if (this.hasSeal() && this.exportSeal()) {
        files.push({
          name: `enclosure-waterproof-seal-${tsStr}.stl`,
          blob: this.geometryToBlob(waterProofSeal(currentParams)),
        });
      }

      if (this.hasPcbMounts() && this.exportPcbMounts()) {
        const baseMounts = pcbMountsOnBase(currentParams);
        if (baseMounts) {
          files.push({
            name: `enclosure-pcb-mounts-base-${tsStr}.stl`,
            blob: this.geometryToBlob(baseMounts),
          });
        }

        const lidMounts = pcbMountsOnLid(currentParams);
        if (lidMounts) {
          files.push({
            name: `enclosure-pcb-mounts-lid-${tsStr}.stl`,
            blob: this.geometryToBlob(lidMounts),
          });
        }
      }

      if (this.hasDinRailMount() && this.exportDinRail()) {
        files.push({
          name: `enclosure-din-rail-mount-${tsStr}.stl`,
          blob: this.geometryToBlob(dinRailMount(currentParams)),
        });
      }

      if (files.length === 1) {
        this.saveFile(files[0].blob, files[0].name);
      } else if (files.length > 1) {
        const zip = new JSZip();
        for (const file of files) {
          zip.file(file.name, file.blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        this.saveFile(zipBlob, `enclosure-${tsStr}.zip`);
      }

      this.closeExportModal();
    } finally {
      this.isExporting.set(false);
    }
  }

  exportStl(): Promise<void> {
    return this.exportSelected();
  }

  exportDinRailMountsStl(): Promise<void> {
    this.exportBase.set(false);
    this.exportLid.set(false);
    this.exportSeal.set(false);
    this.exportPcbMounts.set(false);
    this.exportDinRail.set(true);
    return this.exportSelected();
  }

  exportPcbMountsStl(): Promise<void> {
    this.exportBase.set(false);
    this.exportLid.set(false);
    this.exportSeal.set(false);
    this.exportDinRail.set(false);
    this.exportPcbMounts.set(true);
    return this.exportSelected();
  }

  private geometryToBlob(geometry: Geom3): Blob {
    const rawData = serialize({ binary: false }, geometry);
    return new Blob([rawData], { type: 'application/octet-stream' });
  }

  private exportGeometry(name: string, geometry: Geom3): void {
    const blob = this.geometryToBlob(geometry);
    this.saveFile(blob, `${name}.stl`);
  }

  private saveFile(data: Blob, fileName: string): void {
    saveAs(data, fileName);
  }

  private formattedTimestamp(): string {
    const ts = new Date();
    const y = ts.getFullYear();
    const m = ts.getMonth() + 1;
    const d = ts.getDate();
    const h = ts.getHours();
    const mm = ts.getMinutes();
    const s = ts.getSeconds();
    return `${y}${m}${d}${h}${mm}${s}`;
  }
}
