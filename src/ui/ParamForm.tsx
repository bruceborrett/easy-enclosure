import React from "react";

import { useParams } from "../lib/params";

export const ParamsForm = () => {
  const { length, width, height, floor, roof, wall, cornerRadius, 
    cableGlands, cableGlandWidth, pcbMounts, pcbMountScrewDiameter, pcbMountXY, wallMounts, 
    waterProof, screws, screwDiameter, sealThickness, insertThickness, insertHeight  } = useParams()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, set: (v: number) => void) => {
    e.currentTarget.value && set(parseFloat(e.currentTarget.value))
  }

  return (
    <form id="param-form">
      <div className="input-group">
        <label>Length</label>
        <input type="number" id="length" value={length.value} min={1} onChange={(e) => handleChange(e, length.set)} />
      </div>
      <div className="input-group">
        <label>Width</label>
        <input type="number" id="width" value={width.value} min={1} onChange={(e) => handleChange(e, width.set)} />
      </div>
      <div className="input-group">
        <label>Base Height</label>
        <input type="number" id="height" value={height.value} min={1} onChange={(e) => handleChange(e, height.set)} />
      </div>
      <div className="input-group">
        <label>Floor Thickness</label>
        <input type="number" id="wall" value={floor.value} min={1} onChange={(e) => handleChange(e, floor.set)} />
      </div>
      <div className="input-group">
        <label>Roof Thickness</label>
        <input type="number" id="wall" value={roof.value} min={1} onChange={(e) => handleChange(e, roof.set)} />
      </div>
      <div className="input-group">
        <label>Wall Thickness</label>
        <input type="number" id="wall" value={wall.value} min={1} onChange={(e) => handleChange(e, wall.set)} />
      </div>
      <div className="input-group">
        <label>Insert Thickness</label>
        <input type="number" id="insertThickness" value={insertThickness.value} onChange={(e) => handleChange(e, insertThickness.set)} />
      </div>
      <div className="input-group">
        <label>Insert Height</label>
        <input type="number" id="insertHeight" value={insertHeight.value} onChange={(e) => handleChange(e, insertHeight.set)} />
      </div>
      <div className="input-group">
        <label>Corner Radius</label>
        <input type="number" id="cornerRadius" value={cornerRadius.value} min={1} onChange={(e) => handleChange(e, cornerRadius.set)} />
      </div>
      <hr />
      <div className="input-group">
        <label>Holes</label>
        <input type="number" id="cableGlands" value={cableGlands.value} min={0} onChange={(e) => handleChange(e, cableGlands.set)} />
      </div>
      {cableGlands.value > 0 && 
        (
          <div className="input-group">
            <label>Hole Diameter</label>
            <input type="number" id="cableGlandWidth" value={cableGlandWidth.value} onChange={(e) => handleChange(e, cableGlandWidth.set)} />
          </div>
        )  
      }
      <hr />
      <div className="input-group">
        <label>PCB Mounts</label>
        <input type="number" id="pcbMounts" value={pcbMounts.value} min={0} onChange={(e) => {
          const value = parseFloat(e.currentTarget.value)
          pcbMountXY.set(Array.from({ length: value }, () => [0, 0]))
          pcbMounts.set(value)
        }} />
      </div>
      {
        pcbMounts.value > 0 &&
        (
          <div className="input-group">
            <label>PCB Mount Screw Diameter</label>
            <input type="number" id="pcbMountScrewDiameter" value={pcbMountScrewDiameter.value} onChange={(e) => handleChange(e, pcbMountScrewDiameter.set)} />
          </div>
        )
      }

      {pcbMounts.value > 0 &&
        pcbMountXY.map((_, i) => (
          <div key={i}>
            <div className="input-group">
              <label>PCB Mount {i + 1} X</label>
              <input type="number" id={`pcbMountsX${i}`} value={_[0].value} onChange={(e) => _[0].set(parseFloat(e.currentTarget.value))} />
            </div>
            <div className="input-group">
              <label>PCB Mount {i + 1} Y</label>
              <input type="number" id={`pcbMountsY${i}`} value={_[1].value} onChange={(e) => _[1].set(parseFloat(e.currentTarget.value))} />
            </div>
          </div>
        ))
      }
      <hr />
      <div className="input-group">
        <label>Waterproof</label>
        <input type="checkbox" id="waterProof" checked={waterProof.value} onChange={(e) => {
          waterProof.set(e.currentTarget.checked)
          e.currentTarget.checked && screws.set(true)
        }} />
      </div>
      {
        waterProof.value &&
        (
          <div className="input-group">
            <label>Seal Thickness</label>
            <input type="number" id="sealThickness" value={sealThickness.value} onChange={(e) => handleChange(e, sealThickness.set)} />
          </div>
        )
      }
      <hr />
      <div className="input-group">
        <label>Screws</label>
        <input type="checkbox" id="screws" checked={screws.value} onChange={(e) => {
          screws.set(e.currentTarget.checked)
          !e.currentTarget.checked && waterProof.set(false)
        }} />
      </div>
      {
        screws.value &&
        (
          <div className="input-group">
            <label>Screw Diameter</label>
            <input type="number" id="screwDiameter" value={screwDiameter.value} onChange={(e) => handleChange(e, screwDiameter.set)} />
          </div>
        )
      }
      <hr />
      <div className="input-group">
        <label>Wall Mounts</label>
        <input type="checkbox" id="wallMounts" checked={wallMounts.value} onChange={(e) => wallMounts.set(e.currentTarget.checked)} />
      </div>
    </form>
  );
};