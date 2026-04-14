import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import { union } from '@jscad/modeling/src/operations/booleans';
import { serialize } from '@jscad/stl-serializer';
import { saveAs } from 'file-saver';

import { base } from '../../core/enclosure/base';
import { internalWalls } from '../../core/enclosure/internalwalls';
import { lid } from '../../core/enclosure/lid';
import { pcbMountsOnBase, pcbMountsOnLid } from '../../core/enclosure/pcbmount';
import { waterProofSeal } from '../../core/enclosure/waterproofseal';
import type { Params } from '../../core/params';
import { EnclosureStateService } from '../../core/state/enclosure-state.service';

@Component({
  selector: 'app-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tools.component.html',
})
export class ToolsComponent {
  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;

  @ViewChild('exportDialog')
  exportDialog?: ElementRef<HTMLDialogElement>;

  private readonly state = inject(EnclosureStateService);

  readonly isExportModalOpen = signal(false);

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  openExportModal(): void {
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

  exportStl(): void {
    const tsStr = this.formattedTimestamp();
    const currentParams = this.state.params();
    const lidMounts = pcbMountsOnLid(currentParams);

    const lidGeometry = lidMounts ? union([lid(currentParams), lidMounts]) : lid(currentParams);

    this.exportGeometry(`enclosure-lid-${tsStr}`, lidGeometry);

    const baseParts: Geom3[] = [base(currentParams)];
    const baseMounts = pcbMountsOnBase(currentParams);

    if (baseMounts) {
      baseParts.push(baseMounts);
    }

    if (currentParams.internalWalls.length > 0) {
      baseParts.push(internalWalls(currentParams));
    }

    this.exportGeometry(
      `enclosure-base-${tsStr}`,
      baseParts.length > 1 ? union(baseParts) : baseParts[0],
    );

    if (currentParams.waterProof) {
      this.exportGeometry(`enclosure-waterproof-seal-${tsStr}`, waterProofSeal(currentParams));
    }

    this.closeExportModal();
  }

  exportPcbMountsStl(): void {
    const tsStr = this.formattedTimestamp();
    const currentParams = this.state.params();

    const baseMounts = pcbMountsOnBase(currentParams);
    if (baseMounts) {
      this.exportGeometry(`enclosure-pcb-mounts-base-${tsStr}`, baseMounts);
    }

    const lidMounts = pcbMountsOnLid(currentParams);
    if (lidMounts) {
      this.exportGeometry(`enclosure-pcb-mounts-lid-${tsStr}`, lidMounts);
    }

    this.closeExportModal();
  }

  private exportGeometry(name: string, geometry: Geom3): void {
    const rawData = serialize({ binary: false }, geometry);
    const blob = new Blob([rawData], { type: 'application/octet-stream' });
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
