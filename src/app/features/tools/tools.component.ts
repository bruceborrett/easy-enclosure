import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import { union } from '@jscad/modeling/src/operations/booleans';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { base } from '../../core/enclosure/base';
import { dinRailMount } from '../../core/enclosure/dinrailmount';
import { internalWalls } from '../../core/enclosure/internalwalls';
import { lid } from '../../core/enclosure/lid';
import { pcbMountsOnBase, pcbMountsOnLid } from '../../core/enclosure/pcbmount';
import { waterProofSeal } from '../../core/enclosure/waterproofseal';
import {
  type ExportFormatDefinition,
  type ExportFormatId,
  STL_FORMAT,
} from '../../core/export/export-format';
import { ExportFormatService } from '../../core/export/export-format.service';
import type { Params } from '../../core/params';
import { EnclosureStateService } from '../../core/state/enclosure-state.service';
import { ActionButtonComponent } from '../../shared/action-button/action-button.component';

export type { ExportFormatId as ExportFormat };

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
  private readonly exportFormatService = inject(ExportFormatService);

  readonly supportedFormats = this.exportFormatService.formats;
  readonly isExportModalOpen = signal(false);
  readonly isExporting = signal(false);
  readonly exportFormat = signal<ExportFormatId>('stl');

  readonly selectedFormat = computed<ExportFormatDefinition>(() => {
    return (
      this.exportFormatService.getFormat(this.exportFormat()) ??
      this.supportedFormats()[0] ??
      STL_FORMAT
    );
  });

  setExportFormat(format: ExportFormatId): void {
    if (this.exportFormatService.getFormat(format)) {
      this.exportFormat.set(format);
    }
  }

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
    const fmt = this.selectedFormat().extension.toUpperCase();
    return this.willExportZip() ? 'Download ZIP' : `Download ${fmt}`;
  });

  readonly exportButtonTitle = computed(() => {
    const labels = this.supportedFormats()
      .map((f) => f.extension.toUpperCase())
      .join(' or ');
    return `Export enclosure to ${labels}`;
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
      const current = this.state.params();
      const merged: Params = {
        ...current,
        ...data,
        snapFit: {
          ...current.snapFit,
          ...(data.snapFit ?? {}),
        },
      };
      this.state.setParams(merged);
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
      const format = this.selectedFormat();
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
        const baseName = `enclosure-base-${tsStr}`;
        files.push({
          name: `${baseName}.${format.extension}`,
          blob: this.exportFormatService.serialize(format.id, baseGeometry, { name: baseName }),
        });
      }

      if (this.exportLid()) {
        const lidMounts = pcbMountsOnLid(currentParams);
        const lidGeometry = lidMounts ? union([lid(currentParams), lidMounts]) : lid(currentParams);
        const lidName = `enclosure-lid-${tsStr}`;
        files.push({
          name: `${lidName}.${format.extension}`,
          blob: this.exportFormatService.serialize(format.id, lidGeometry, { name: lidName }),
        });
      }

      if (this.hasSeal() && this.exportSeal()) {
        const sealName = `enclosure-waterproof-seal-${tsStr}`;
        files.push({
          name: `${sealName}.${format.extension}`,
          blob: this.exportFormatService.serialize(format.id, waterProofSeal(currentParams), {
            name: sealName,
          }),
        });
      }

      if (this.hasPcbMounts() && this.exportPcbMounts()) {
        const baseMounts = pcbMountsOnBase(currentParams);
        if (baseMounts) {
          const mountBaseName = `enclosure-pcb-mounts-base-${tsStr}`;
          files.push({
            name: `${mountBaseName}.${format.extension}`,
            blob: this.exportFormatService.serialize(format.id, baseMounts, {
              name: mountBaseName,
            }),
          });
        }

        const lidMounts = pcbMountsOnLid(currentParams);
        if (lidMounts) {
          const mountLidName = `enclosure-pcb-mounts-lid-${tsStr}`;
          files.push({
            name: `${mountLidName}.${format.extension}`,
            blob: this.exportFormatService.serialize(format.id, lidMounts, {
              name: mountLidName,
            }),
          });
        }
      }

      if (this.hasDinRailMount() && this.exportDinRail()) {
        const dinRailName = `enclosure-din-rail-mount-${tsStr}`;
        files.push({
          name: `${dinRailName}.${format.extension}`,
          blob: this.exportFormatService.serialize(format.id, dinRailMount(currentParams), {
            name: dinRailName,
          }),
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

  exportDinRailMountOnly(format?: ExportFormatId): Promise<void> {
    if (format) {
      this.setExportFormat(format);
    }
    this.exportBase.set(false);
    this.exportLid.set(false);
    this.exportSeal.set(false);
    this.exportPcbMounts.set(false);
    this.exportDinRail.set(true);
    return this.exportSelected();
  }

  exportDinRailMountsStl(): Promise<void> {
    return this.exportDinRailMountOnly();
  }

  exportPcbMountsOnly(format?: ExportFormatId): Promise<void> {
    if (format) {
      this.setExportFormat(format);
    }
    this.exportBase.set(false);
    this.exportLid.set(false);
    this.exportSeal.set(false);
    this.exportDinRail.set(false);
    this.exportPcbMounts.set(true);
    return this.exportSelected();
  }

  exportPcbMountsStl(): Promise<void> {
    return this.exportPcbMountsOnly();
  }

  private geometryToBlob(geometry: Geom3, name = 'enclosure'): Blob {
    return this.exportFormatService.serialize(this.exportFormat(), geometry, { name });
  }

  private exportGeometry(name: string, geometry: Geom3): void {
    const format = this.selectedFormat();
    const blob = this.exportFormatService.serialize(format.id, geometry, { name });
    this.saveFile(blob, `${name}.${format.extension}`);
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
