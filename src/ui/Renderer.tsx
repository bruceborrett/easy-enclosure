import { PointerEventHandler, WheelEventHandler, useEffect, useRef } from "react"
import { prepareRender, entitiesFromSolids, drawCommands, cameras, controls } from "@jscad/regl-renderer"
import { union } from "@jscad/modeling/src/operations/booleans"
import { translate } from "@jscad/modeling/src/operations/transforms"

import { Params, useParams } from "../lib/params"

import { Entity } from "@jscad/regl-renderer/types/geometry-utils-V2/entity"
import { Geom3 } from "@jscad/modeling/src/geometries/types"
import { Vec3 } from "@jscad/modeling/src/maths/types"

import { base } from "../lib/enclosure/base"
import { lid } from "../lib/enclosure/lid"
import { waterProofSeal } from "../lib/enclosure/waterproofseal"
import { pcbMounts } from "../lib/enclosure/pcbmount"

import { useLoading } from "./LoadingIndicator"

import _ from 'lodash'

const SPACING = 20

const perspectiveCamera = cameras.perspective
const camera = Object.assign({}, perspectiveCamera.defaults)

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

const lidDeps = ['length', 'width', 'roof', 'wall', 'cornerRadius', 'lidScrews', 'waterProof', 'lidScrewDiameter', 'insertThickness', 'insertHeight', 'insertClearance', 'holes']
const baseDeps = ['length', 'width', 'height', 'wall', 'floor', 'cornerRadius', 'holes', 'wallMounts', 'lidScrews', 'baseLidScrewDiameter', 'waterProof', 'insertThickness', 'insertHeight', 'sealThickness', 'wallMountScrewDiameter', 'insertClearance']
const sealDeps = ['length', 'width', 'wall', 'cornerRadius', 'waterProof', 'sealThickness', 'insertClearance', 'insertThickness']
const mountDeps = ['pcbMounts', 'waterProof', 'wall', 'floor', 'height']

type Render = (options: any) => void;

type RenderOptions = {
  camera: typeof camera,
  drawCommands: typeof drawCommands,
  entities: Entity[],
}

// Check if a model depends on any of the params that have changed
function checkDeps(diff: Array<string>, deps: Array<string>) { 
  let ret = false
  diff.forEach((v) => {
    if (deps.includes(v)) {
      ret = true
    }
  })
  return ret
} 

// Check which params have updated
function diffParams(a: Params, b: Params) {
  const diffKeys: string[] = []
  Object.entries(a).forEach((v) => {
    if (JSON.stringify(v[1]) !== JSON.stringify(b[v[0] as keyof Params])) {
      diffKeys.push(v[0])
    }
  })
  return diffKeys
}

export const Renderer = () => {
  const params = useParams()
  
  const container = useRef<HTMLDivElement | null>(null);
  const _lid = useRef<Geom3 | null>(null)
  const _base = useRef<Geom3 | null>(null)
  const _waterProofSeal = useRef<Geom3 | null>(null)
  const _pcbMounts = useRef<Geom3 | null>(null)
  const model = useRef<Geom3 | null>(null)
  const renderOptions = useRef<RenderOptions | null>(null)
  const renderer = useRef<Render | null>(null)
  const animationFrame = useRef<number | null>(null)
  const unload = useRef<boolean>(false)
  const prevParams = useRef<string>('{}')
  
  const loading = useLoading()
  
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
      if (!renderOptions.current?.entities) return
      control.zoomToFit.tightness = 1
      const updated = orbitControls.zoomToFit({ controls: control, camera: camera, entities: renderOptions.current?.entities })
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
      
      renderer.current && renderer.current(renderOptions.current)
    }
    
    if (!unload.current)
    animationFrame.current = requestAnimationFrame(updateAndRender)
  }
  
  const setCamera = () => {
    perspectiveCamera.setProjection(camera, camera, { 
      width: window.innerWidth, 
      height: window.innerHeight
    })
  }
  
  const renderModel = async (params: Params, diff: string[]) => {

    let lidPos: Vec3
    let basePos: Vec3
    let sealPos: Vec3
    let mountsPos: Vec3
    
    const { width, length, waterProof, pcbMounts: pcbMountParams } = params
    
    // Lid
    if (checkDeps(diff, lidDeps)) {
      console.log('Rendering lid')
      if (waterProof) {
        lidPos = [(width/2)+SPACING, -length/2, 0]
      } else {
        lidPos = [SPACING/2, -length/2, 0]
      }
      _lid.current = translate(lidPos, lid(params as Params))  
    }  

    // Base
    if (checkDeps(diff, baseDeps)) {
      console.log('Rendering base')
      if (waterProof) {
        basePos = [-width/2, -length/2, 0]
      } else {
        basePos = [-(width+(SPACING/2)), -length/2, 0]
      }
      _base.current = translate(basePos, base(params as Params))
    }

    // Waterproof seal
    if (checkDeps(diff, sealDeps)) {
      console.log('Rendering waterproof seal')
      if (params.waterProof) {
        sealPos = [-width-(width/2)-SPACING, -length/2, 0] as Vec3
        _waterProofSeal.current = translate(sealPos, waterProofSeal(params))
      }
    }

    // PCB Mounts
    if (checkDeps(diff, mountDeps)) {
      console.log('Rendering PCB mounts')
      if (pcbMountParams.length > 0) {
        if (waterProof) {
          mountsPos = [-width/2, -length/2, 0]
        } else {
          mountsPos = [-(width+(SPACING/2)), -length/2, 0]
        }
        _pcbMounts.current = translate(mountsPos, pcbMounts(params))
      }
    }

    // Combine solids
    let result: Geom3[] = []
    if (_lid.current) result.push(_lid.current)
    if (_base.current) result.push(_base.current)
    if (_waterProofSeal.current && waterProof) result.push(_waterProofSeal.current)
    if (_pcbMounts.current && pcbMountParams.length > 0) result.push(_pcbMounts.current)
    model.current = union(result)

    // Generate render options
    renderOptions.current = {
      camera: camera,
      drawCommands: drawCommands,
      entities: entitiesFromSolids({}, model.current)
    }

    // Render
    if (container.current && !renderer.current) {
      renderer.current = prepareRender({
        glOptions: { container: container.current },
      })
      setCamera()
      updateAndRender()
    } else {
      renderOptions.current.entities = entitiesFromSolids({}, model.current)
      updateView = true
    }
  }
    
  useEffect(() => {
    const _params = params.get({ noproxy: true }) as Params
    const _prevParams = JSON.parse(prevParams.current)

    let paramsDiff: string[]

    if (!_.isEmpty(_prevParams)) {
      paramsDiff = diffParams(_prevParams, _params)
    } else {
      paramsDiff = Object.keys(_params)
    }

    if (paramsDiff.length > 0) {
      // Show loading spinner
      loading.set(true)
      // Use a timeout to allow DOM to update before running long render tasks
      setTimeout(() => {
        renderModel(_params, paramsDiff).finally(() => {
          loading.set(false)
          prevParams.current = JSON.stringify(_params)
        })
      }, 250)
    }
  }, [params])
      
  return <div 
    id="jscad" 
    ref={container}
    onPointerMove={moveHandler}
    onPointerDown={downHandler}
    onPointerUp={upHandler}
    onWheel={wheelHandler} 
  />
};