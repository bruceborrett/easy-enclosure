import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import type { Vec3 } from '@jscad/modeling/src/maths/types';
import { union } from '@jscad/modeling/src/operations/booleans';
import { translate } from '@jscad/modeling/src/operations/transforms';
import {
  cameras,
  controls,
  drawCommands,
  entitiesFromSolids,
  prepareRender,
} from '@jscad/regl-renderer';
import type { Entity } from '@jscad/regl-renderer/types/geometry-utils-V2/entity';

import { base } from '../../core/enclosure/base';
import { internalWalls } from '../../core/enclosure/internalwalls';
import { lid } from '../../core/enclosure/lid';
import { pcbMounts } from '../../core/enclosure/pcbmount';
import { waterProofSeal } from '../../core/enclosure/waterproofseal';
import type { Params } from '../../core/params';
import { EnclosureStateService } from '../../core/state/enclosure-state.service';

const SPACING = 20;

const lidDeps = [
  'length',
  'width',
  'roof',
  'wall',
  'cornerRadius',
  'lidScrews',
  'waterProof',
  'lidScrewDiameter',
  'baseLidScrewDiameter',
  'insertThickness',
  'insertHeight',
  'insertClearance',
  'holes',
];
const baseDeps = [
  'length',
  'width',
  'height',
  'wall',
  'floor',
  'cornerRadius',
  'holes',
  'wallMounts',
  'lidScrews',
  'baseLidScrewDiameter',
  'waterProof',
  'insertThickness',
  'insertHeight',
  'sealThickness',
  'wallMountScrewDiameter',
  'wallMountCount',
  'insertClearance',
];
const sealDeps = [
  'length',
  'width',
  'wall',
  'cornerRadius',
  'waterProof',
  'sealThickness',
  'insertClearance',
  'insertThickness',
  'lidScrewDiameter',
  'baseLidScrewDiameter',
  'lidScrews',
];
const mountDeps = ['pcbMounts', 'waterProof', 'wall', 'floor', 'height'];
const internalWallDeps = ['internalWalls', 'length', 'width', 'waterProof', 'floor'];

type RenderOptions = {
  camera: typeof cameras.perspective.defaults;
  drawCommands: typeof drawCommands;
  entities: Entity[];
};

@Component({
  selector: 'app-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointermove)': 'onPointerMove($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(wheel)': 'onWheel($event)',
  },
  templateUrl: './renderer.component.html',
  styleUrl: './renderer.component.css',
})
export class RendererComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true })
  containerRef?: ElementRef<HTMLDivElement>;

  private readonly state = inject(EnclosureStateService);

  private readonly perspectiveCamera = cameras.perspective;
  private readonly orbitControls = controls.orbit;

  private readonly camera = {
    ...this.perspectiveCamera.defaults,
  };
  private control = this.orbitControls.defaults;

  private lastX = 0;
  private lastY = 0;
  private rotateDelta: [number, number] = [0, 0];
  private panDelta: [number, number] = [0, 0];
  private zoomDelta = 0;
  private pointerDown = false;
  private zoomToFit = true;
  private updateView = true;

  private readonly rotateSpeed = 0.002;
  private readonly panSpeed = 1;
  private readonly zoomSpeed = 0.08;

  private lidModel: Geom3 | null = null;
  private baseModel: Geom3 | null = null;
  private sealModel: Geom3 | null = null;
  private mountsModel: Geom3 | null = null;
  private internalWallsModel: Geom3 | null = null;

  private model: Geom3 | null = null;
  private renderOptions: RenderOptions | null = null;
  private renderer: ((options?: RenderOptions) => void) | null = null;
  private animationFrame: number | null = null;

  private prevParams: Params | null = null;
  private renderDelayHandle: ReturnType<typeof setTimeout> | null = null;
  private isViewReady = false;

  constructor() {
    effect(() => {
      const currentParams = this.state.params();
      this.scheduleModelRender(currentParams);
    });
  }

  ngAfterViewInit(): void {
    this.isViewReady = true;
    this.scheduleModelRender(this.state.params());
  }

  ngOnDestroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.renderDelayHandle !== null) {
      clearTimeout(this.renderDelayHandle);
      this.renderDelayHandle = null;
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.pointerDown) {
      return;
    }

    const dx = this.lastX - event.pageX;
    const dy = event.pageY - this.lastY;

    if (event.shiftKey) {
      this.panDelta[0] += dx;
      this.panDelta[1] += dy;
    } else {
      this.rotateDelta[0] -= dx;
      this.rotateDelta[1] -= dy;
    }

    this.lastX = event.pageX;
    this.lastY = event.pageY;
    event.preventDefault();
  }

  onPointerDown(event: PointerEvent): void {
    this.pointerDown = true;
    this.lastX = event.pageX;
    this.lastY = event.pageY;
    this.containerRef?.nativeElement.setPointerCapture(event.pointerId);
  }

  onPointerUp(event: PointerEvent): void {
    this.pointerDown = false;
    this.containerRef?.nativeElement.releasePointerCapture(event.pointerId);
  }

  onWheel(event: WheelEvent): void {
    this.zoomDelta += event.deltaY;
  }

  private checkDeps(diff: string[], deps: string[]): boolean {
    return diff.some((item) => deps.includes(item));
  }

  private diffParams(previous: Params, current: Params): string[] {
    const diffKeys: string[] = [];
    (Object.keys(previous) as Array<keyof Params>).forEach((key) => {
      if (JSON.stringify(previous[key]) !== JSON.stringify(current[key])) {
        diffKeys.push(key);
      }
    });
    return diffKeys;
  }

  private scheduleModelRender(params: Params): void {
    if (!this.isViewReady) {
      return;
    }

    const paramsDiff = this.prevParams
      ? this.diffParams(this.prevParams, params)
      : Object.keys(params);

    if (paramsDiff.length === 0) {
      return;
    }

    this.state.setLoading(true);

    if (this.renderDelayHandle !== null) {
      clearTimeout(this.renderDelayHandle);
    }

    this.renderDelayHandle = setTimeout(() => {
      void this.renderModel(params, paramsDiff).finally(() => {
        this.state.setLoading(false);
        this.prevParams = JSON.parse(JSON.stringify(params)) as Params;
      });
    }, 250);
  }

  private doRotatePanZoom(): void {
    if (this.rotateDelta[0] || this.rotateDelta[1]) {
      const updated = this.orbitControls.rotate(
        { controls: this.control, camera: this.camera, speed: this.rotateSpeed },
        this.rotateDelta,
      );
      this.control = { ...this.control, ...updated.controls };
      this.updateView = true;
      this.rotateDelta = [0, 0];
    }

    if (this.panDelta[0] || this.panDelta[1]) {
      const updated = this.orbitControls.pan(
        { controls: this.control, camera: this.camera, speed: this.panSpeed },
        this.panDelta,
      );
      this.control = { ...this.control, ...updated.controls };
      this.panDelta = [0, 0];
      this.camera.position = updated.camera.position;
      this.camera.target = updated.camera.target;
      this.updateView = true;
    }

    if (this.zoomDelta) {
      const updated = this.orbitControls.zoom(
        { controls: this.control, camera: this.camera, speed: this.zoomSpeed },
        this.zoomDelta,
      );
      this.control = { ...this.control, ...updated.controls };
      this.zoomDelta = 0;
      this.updateView = true;
    }

    if (this.zoomToFit) {
      if (!this.renderOptions?.entities) {
        return;
      }
      this.control.zoomToFit.tightness = 1;
      const updated = this.orbitControls.zoomToFit({
        controls: this.control,
        camera: this.camera,
        entities: this.renderOptions.entities,
      });
      this.control = { ...this.control, ...updated.controls };
      this.zoomToFit = false;
      this.updateView = true;
    }
  }

  private updateAndRender = (): void => {
    this.doRotatePanZoom();

    if (this.updateView) {
      const updates = this.orbitControls.update({
        controls: this.control,
        camera: this.camera,
      });

      this.control = { ...this.control, ...updates.controls };
      this.updateView = this.control.changed;

      this.camera.position = updates.camera.position;
      this.perspectiveCamera.update(this.camera);

      if (this.renderer && this.renderOptions) {
        this.renderer(this.renderOptions);
      }
    }

    this.animationFrame = requestAnimationFrame(this.updateAndRender);
  };

  private setCameraProjection(): void {
    this.perspectiveCamera.setProjection(this.camera, this.camera, {
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  private async renderModel(params: Params, diff: string[]): Promise<void> {
    let lidPos: Vec3;
    let basePos: Vec3;
    let sealPos: Vec3;
    let mountsPos: Vec3;

    const {
      width,
      length,
      waterProof,
      pcbMounts: pcbMountParams,
      internalWalls: internalWallParams,
    } = params;

    if (this.checkDeps(diff, lidDeps)) {
      lidPos = waterProof ? [width / 2 + SPACING, -length / 2, 0] : [SPACING / 2, -length / 2, 0];
      this.lidModel = translate(lidPos, lid(params));
    }

    if (this.checkDeps(diff, baseDeps)) {
      basePos = waterProof
        ? [-width / 2, -length / 2, 0]
        : [-(width + SPACING / 2), -length / 2, 0];
      this.baseModel = translate(basePos, base(params));
    }

    if (this.checkDeps(diff, sealDeps) && waterProof) {
      sealPos = [-width - width / 2 - SPACING, -length / 2, 0];
      this.sealModel = translate(sealPos, waterProofSeal(params));
    }

    if (this.checkDeps(diff, mountDeps) && pcbMountParams.length > 0) {
      mountsPos = waterProof
        ? [-width / 2, -length / 2, 0]
        : [-(width + SPACING / 2), -length / 2, 0];
      this.mountsModel = translate(mountsPos, pcbMounts(params));
    }

    if (this.checkDeps(diff, internalWallDeps) && internalWallParams.length > 0) {
      mountsPos = waterProof
        ? [-width / 2, -length / 2, 0]
        : [-(width + SPACING / 2), -length / 2, 0];
      this.internalWallsModel = translate(mountsPos, internalWalls(params));
    }

    const result: Geom3[] = [];
    if (this.lidModel) {
      result.push(this.lidModel);
    }
    if (this.baseModel) {
      result.push(this.baseModel);
    }
    if (this.sealModel && waterProof) {
      result.push(this.sealModel);
    }
    if (this.mountsModel && pcbMountParams.length > 0) {
      result.push(this.mountsModel);
    }
    if (this.internalWallsModel && internalWallParams.length > 0) {
      result.push(this.internalWallsModel);
    }

    if (result.length === 0) {
      return;
    }

    this.model = union(result);

    this.renderOptions = {
      camera: this.camera,
      drawCommands,
      entities: entitiesFromSolids({}, this.model) as Entity[],
    };

    if (!this.renderer && this.containerRef?.nativeElement) {
      this.renderer = prepareRender({
        glOptions: { container: this.containerRef.nativeElement },
      }) as (options?: RenderOptions) => void;
      this.setCameraProjection();
      if (this.animationFrame === null) {
        this.updateAndRender();
      }
    } else {
      this.renderOptions.entities = entitiesFromSolids({}, this.model) as Entity[];
      this.updateView = true;
    }
  }
}
