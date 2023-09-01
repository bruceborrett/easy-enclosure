import { PointerEventHandler, WheelEventHandler, useEffect, useRef } from "react"
import { prepareRender, entitiesFromSolids, drawCommands, cameras, controls } from "@jscad/regl-renderer"

import { Params } from "../lib/params"
import { Entity } from "@jscad/regl-renderer/types/geometry-utils-V2/entity"
import { Geom3 } from "@jscad/modeling/src/geometries/types"

interface Props {
  params: Params,
  enclosure: Geom3
}

// prepare the camera
const perspectiveCamera = cameras.perspective
const camera = Object.assign({}, perspectiveCamera.defaults)

// prepare the controls
const orbitControls = controls.orbit
let control = orbitControls.defaults

let lastX = 0
let lastY = 0

let rotateDelta = [0, 0]
let panDelta = [0, 0]
let zoomDelta = 0
let pointerDown = false
let zoomToFit = true
let updateView = true

const rotateSpeed = 0.002
const panSpeed = 1
const zoomSpeed = 0.08

type Render = (options: any) => void;
let renderer: Render | null = null;

let container: React.RefObject<HTMLDivElement>;

let renderOptions: {
  camera: typeof camera,
  drawCommands: typeof drawCommands,
  entities: Entity[],
}

const moveHandler: PointerEventHandler = (ev) => {
  if(!pointerDown) return
  const dx = lastX - ev.pageX 
  const dy = ev.pageY - lastY 

  const shiftKey = (ev.shiftKey === true)
  if (shiftKey) {
    panDelta[0] += dx
    panDelta[1] += dy
  } else {
    rotateDelta[0] -= dx
    rotateDelta[1] -= dy
  }

  lastX = ev.pageX
  lastY = ev.pageY

  ev.preventDefault()
}

const downHandler: PointerEventHandler = (ev) => {
  pointerDown = true
  lastX = ev.pageX
  lastY = ev.pageY
  container.current?.setPointerCapture(ev.pointerId)
}

const upHandler: PointerEventHandler = (ev) => {
  pointerDown = false
  container.current?.releasePointerCapture(ev.pointerId)
}

const wheelHandler: WheelEventHandler = (ev) => {
  zoomDelta += ev.deltaY
}

const doRotatePanZoom = () => {
  if (rotateDelta[0] || rotateDelta[1]) {
    const updated = orbitControls.rotate({ controls: control, camera: camera, speed: rotateSpeed }, rotateDelta)
    control = { ...control, ...updated.controls }
    updateView = true
    rotateDelta = [0, 0]
  }

  if (panDelta[0] || panDelta[1]) {
    const updated = orbitControls.pan({ controls:control, camera:camera, speed: panSpeed }, panDelta)
    control = { ...control, ...updated.controls }
    panDelta = [0, 0]
    camera.position = updated.camera.position
    camera.target = updated.camera.target
    updateView = true
  }

  if (zoomDelta) {
    const updated = orbitControls.zoom({ controls:control, camera:camera, speed: zoomSpeed }, zoomDelta)
    control = { ...control, ...updated.controls }
    zoomDelta = 0
    updateView = true
  }

  if (zoomToFit) {
    control.zoomToFit.tightness = 1
    const updated = orbitControls.zoomToFit({ controls: control, camera: camera, entities: renderOptions?.entities })
    control = { ...control, ...updated.controls }
    zoomToFit = false
    updateView = true
  }
}

const updateAndRender = (timestamp?: Number) => {
  doRotatePanZoom()

  if (updateView) {
    const updates = orbitControls.update({ controls: control, camera: camera })
    control = { ...control, ...updates.controls }
    updateView = control.changed // for elasticity in rotate / zoom

    camera.position = updates.camera.position
    perspectiveCamera.update(camera)

    renderer && renderer(renderOptions)
  }

  requestAnimationFrame(updateAndRender)
}

const setCamera = () => {
  perspectiveCamera.setProjection(camera, camera, { 
    width: window.innerWidth, 
    height: window.innerHeight
  })
}

export const JSCad = ({ params, enclosure }: Props) => {

  container = useRef<HTMLDivElement>(null);
  
  renderOptions = {
    camera: camera,
    drawCommands: drawCommands,
    entities: entitiesFromSolids({}, enclosure)
  }
  
  // Initial render
  useEffect(() => {
    if (container.current && !renderer) {
      renderer = prepareRender({
        glOptions: { container: container.current },
      })
    }
    setCamera()
    updateAndRender()
  }, []);

  // Re-render on param change
  useEffect(() => {
    renderOptions.entities = entitiesFromSolids({}, enclosure)
    updateView = true
  }, [params, enclosure])

  return <div 
    id="jscad" 
    ref={container}
    onPointerMove={moveHandler}
    onPointerDown={downHandler}
    onPointerUp={upHandler}
    onWheel={wheelHandler} 
  />;
};