import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
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
import { pcbMountsOnBase, pcbMountsOnLid } from '../../core/enclosure/pcbmount';
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
const mountDeps = [
  'pcbMounts',
  'waterProof',
  'wall',
  'floor',
  'lidScrews',
  'height',
  'roof',
  'length',
  'width',
  'insertThickness',
  'insertClearance',
];
const internalWallDeps = ['internalWalls', 'length', 'width', 'waterProof', 'floor'];

type RenderOptions = {
  camera: typeof cameras.perspective.defaults;
  drawCommands: typeof drawCommands;
  entities: Entity[];
};

type Vec3Tuple = [number, number, number];

type SurfaceLabel = {
  name: 'Front' | 'Back' | 'Left' | 'Right' | 'Lid' | 'Bottom' | 'Seal';
  x: number;
  y: number;
};

type SurfaceAnchor = {
  name: SurfaceLabel['name'];
  point: Vec3Tuple;
  normal: Vec3Tuple;
};

@Component({
  selector: 'app-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block h-full w-full overflow-hidden',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(wheel)': 'onWheel($event)',
  },
  templateUrl: './renderer.component.html',
})
export class RendererComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true })
  containerRef?: ElementRef<HTMLDivElement>;

  private resizeObserver: ResizeObserver | null = null;

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
  private baseOrigin: Vec3Tuple = [0, 0, 0];
  private lidOrigin: Vec3Tuple = [0, 0, 0];
  private sealOrigin: Vec3Tuple = [0, 0, 0];
  private wheelInteracting = false;
  private wheelInteractionHandle: ReturnType<typeof setTimeout> | null = null;

  readonly surfaceLabels = signal<SurfaceLabel[]>([]);

  constructor() {
    effect(() => {
      const currentParams = this.state.params();
      this.scheduleModelRender(currentParams);
    });
  }

  ngAfterViewInit(): void {
    this.isViewReady = true;
    this.observeContainerSize();
    this.scheduleModelRender(this.state.params());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.renderDelayHandle !== null) {
      clearTimeout(this.renderDelayHandle);
      this.renderDelayHandle = null;
    }
    if (this.wheelInteractionHandle !== null) {
      clearTimeout(this.wheelInteractionHandle);
      this.wheelInteractionHandle = null;
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
    this.updateSurfaceLabels();
  }

  onPointerUp(event: PointerEvent): void {
    this.pointerDown = false;
    this.containerRef?.nativeElement.releasePointerCapture(event.pointerId);
    this.updateSurfaceLabels();
  }

  onWheel(event: WheelEvent): void {
    this.zoomDelta += event.deltaY;
    this.wheelInteracting = true;
    if (this.wheelInteractionHandle !== null) {
      clearTimeout(this.wheelInteractionHandle);
    }
    this.wheelInteractionHandle = setTimeout(() => {
      this.wheelInteracting = false;
      this.updateSurfaceLabels();
    }, 250);
    this.updateSurfaceLabels();
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

      this.updateSurfaceLabels();
    }

    this.animationFrame = requestAnimationFrame(this.updateAndRender);
  };

  private setCameraProjection(): void {
    const container = this.containerRef?.nativeElement;
    const width = container?.clientWidth ?? window.innerWidth;
    const height = container?.clientHeight ?? window.innerHeight;

    this.perspectiveCamera.setProjection(this.camera, this.camera, {
      width: Math.max(width, 1),
      height: Math.max(height, 1),
    });
  }

  private observeContainerSize(): void {
    const container = this.containerRef?.nativeElement;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.renderOptions) {
        return;
      }

      this.setCameraProjection();
      this.zoomToFit = true;
      this.updateView = true;
      this.updateSurfaceLabels();
    });
    this.resizeObserver.observe(container);
  }

  private updateSurfaceLabels(): void {
    const container = this.containerRef?.nativeElement;
    if (!container || !this.baseModel || (!this.pointerDown && !this.wheelInteracting)) {
      this.surfaceLabels.set([]);
      return;
    }

    const { width, length, height, roof, insertHeight } = this.state.params();
    const [originX, originY, originZ] = this.baseOrigin;
    const [lidX, lidY, lidZ] = this.lidOrigin;

    const anchors: SurfaceAnchor[] = [
      {
        name: 'Front',
        point: [originX + width / 2, originY + length, originZ + height / 2],
        normal: [0, 1, 0],
      },
      {
        name: 'Back',
        point: [originX + width / 2, originY, originZ + height / 2],
        normal: [0, -1, 0],
      },
      {
        name: 'Left',
        point: [originX + width, originY + length / 2, originZ + height / 2],
        normal: [1, 0, 0],
      },
      {
        name: 'Right',
        point: [originX, originY + length / 2, originZ + height / 2],
        normal: [-1, 0, 0],
      },
      {
        name: 'Bottom',
        point: [originX + width / 2, originY + length / 2, originZ],
        normal: [0, 0, -1],
      },
    ];

    if (this.lidModel) {
      anchors.push({
        name: 'Lid',
        point: [lidX + width / 2, lidY + length / 2, lidZ + roof + insertHeight],
        normal: [0, 0, 1],
      });
    }

    if (this.sealModel) {
      const [sealX, sealY, sealZ] = this.sealOrigin;
      anchors.push({
        name: 'Seal',
        point: [sealX + width / 2, sealY + length / 2, sealZ + Math.max(1, roof) / 2],
        normal: [0, 0, 1],
      });
    }

    const projected = anchors
      .filter((anchor) => this.isFacingCamera(anchor.point, anchor.normal))
      .map((anchor) => {
        const screenPos = this.projectWorldToScreen(anchor.point, container);
        return screenPos
          ? {
              name: anchor.name,
              x: screenPos[0],
              y: screenPos[1],
            }
          : null;
      })
      .filter((item): item is SurfaceLabel => item !== null);

    this.surfaceLabels.set(projected);
  }

  private isFacingCamera(point: Vec3Tuple, normal: Vec3Tuple): boolean {
    const cameraPosition = this.camera.position as Vec3Tuple;
    const toCamera = this.normalize(this.subtract(cameraPosition, point));
    return this.dot(normal, toCamera) > 0.08;
  }

  private projectWorldToScreen(
    point: Vec3Tuple,
    container: HTMLDivElement,
  ): [number, number] | null {
    const cameraPosition = this.camera.position as Vec3Tuple;
    const cameraTarget = this.camera.target as Vec3Tuple;
    const cameraUp = (this.camera.up as Vec3Tuple | undefined) ?? [0, 0, 1];

    const zAxis = this.normalize(this.subtract(cameraPosition, cameraTarget));
    const xAxis = this.normalize(this.cross(cameraUp, zAxis));
    const yAxis = this.cross(zAxis, xAxis);

    const toPoint = this.subtract(point, cameraPosition);
    const camX = this.dot(toPoint, xAxis);
    const camY = this.dot(toPoint, yAxis);
    const camZ = this.dot(toPoint, zAxis);

    if (camZ >= -0.001) {
      return null;
    }

    const rawFov = this.camera.fov;
    const fov = rawFov > Math.PI ? (rawFov * Math.PI) / 180 : rawFov;
    const halfFovTan = Math.tan(fov / 2);

    if (!Number.isFinite(halfFovTan) || halfFovTan === 0) {
      return null;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / Math.max(height, 1);

    const ndcX = camX / (-camZ * halfFovTan * aspect);
    const ndcY = camY / (-camZ * halfFovTan);

    if (!Number.isFinite(ndcX) || !Number.isFinite(ndcY)) {
      return null;
    }

    if (Math.abs(ndcX) > 1.05 || Math.abs(ndcY) > 1.05) {
      return null;
    }

    const screenX = ((ndcX + 1) / 2) * width;
    const screenY = ((1 - ndcY) / 2) * height;
    return [screenX, screenY];
  }

  private subtract(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  private cross(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  private dot(a: Vec3Tuple, b: Vec3Tuple): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  private normalize(vector: Vec3Tuple): Vec3Tuple {
    const magnitude = Math.hypot(vector[0], vector[1], vector[2]);
    if (magnitude < 0.000001) {
      return [0, 0, 0];
    }
    return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude];
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
      this.lidOrigin = lidPos;
      this.lidModel = translate(lidPos, lid(params));
    }

    if (this.checkDeps(diff, baseDeps)) {
      basePos = waterProof
        ? [-width / 2, -length / 2, 0]
        : [-(width + SPACING / 2), -length / 2, 0];
      this.baseOrigin = basePos;
      this.baseModel = translate(basePos, base(params));
    }

    if (this.checkDeps(diff, sealDeps) && waterProof) {
      sealPos = [-width - width / 2 - SPACING, -length / 2, 0];
      this.sealOrigin = sealPos;
      this.sealModel = translate(sealPos, waterProofSeal(params));
    } else if (this.checkDeps(diff, sealDeps) && !waterProof) {
      this.sealModel = null;
    }

    if (this.checkDeps(diff, mountDeps) && pcbMountParams.length > 0) {
      const baseMountsPos: Vec3 = waterProof
        ? [-width / 2, -length / 2, 0]
        : [-(width + SPACING / 2), -length / 2, 0];

      const lidMountsPos: Vec3 = waterProof
        ? [width / 2 + SPACING, -length / 2, 0]
        : [SPACING / 2, -length / 2, 0];

      const mountParts: Geom3[] = [];
      const baseMounts = pcbMountsOnBase(params);
      const lidMounts = pcbMountsOnLid(params);

      if (baseMounts) {
        mountParts.push(translate(baseMountsPos, baseMounts));
      }

      if (lidMounts) {
        mountParts.push(translate(lidMountsPos, lidMounts));
      }

      this.mountsModel =
        mountParts.length > 0 ? (mountParts.length > 1 ? union(mountParts) : mountParts[0]) : null;
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
      this.updateSurfaceLabels();
      if (this.animationFrame === null) {
        this.updateAndRender();
      }
    } else {
      this.renderOptions.entities = entitiesFromSolids({}, this.model) as Entity[];
      this.updateView = true;
      this.updateSurfaceLabels();
    }
  }
}
