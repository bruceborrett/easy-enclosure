import { useState } from "react";

import { useParams } from "../lib/params";

import { none } from '@hookstate/core'

const NumberInput = ({
  label, value, min=undefined, step=1, onChange
}: {
  label: string, value: number, min?: number, step?: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  const handleKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.code === 'Enter') {
      e.currentTarget.blur()
    }
  }
  return (
    <div className="input-group">
      <label>{label}</label>
      <input type="number" min={min} defaultValue={value} step={step} onBlur={onChange} onKeyDown={handleKeydown} />
    </div>
  )
}

const CheckBox = ({label, checked, onChange}: {label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}) => (
  <div className="input-group">
    <label>{label}</label>
    <input type="checkbox" checked={checked} onChange={onChange} />
  </div>
)

const Accordian = ({children, title, active, onClick}: {children: React.ReactNode, title: string, active: boolean, onClick: () => void}) => {
  return (
    <div className={`accordian ${active ? 'active' : ''}`}>
        <p className="accordian-header" onClick={onClick}>
          {title}
          <span className="accordian-icon">
            {`${active ? '-' : '+'}`}
          </span>
        </p>
      <div>
        {children}
      </div>
    </div>
  )
}

export const ParamsForm = () => {
  const { length, width, height, floor, roof, wall, cornerRadius, wallMountScrewDiameter, 
    cableGlands, pcbMounts, pcbMountScrewDiameter, pcbMountXY, wallMounts, 
    waterProof, screws, screwDiameter, sealThickness, insertThickness, insertHeight, insertClearance  } = useParams()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement| HTMLSelectElement>, set: (v: number) => void) => {
    e.currentTarget.value && set(parseFloat(e.currentTarget.value))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    document.body.click()
  }

  const addHole = () => {
    cableGlands[cableGlands.length].set({
      shape: 'circle', surface: 0, diameter: 12.5, y: width.value/2, x: 6
    })
  }

  const [activeTab, setActiveTab] = useState(1)

  return (
    <form id="param-form" onSubmit={handleSubmit}>

      <Accordian title="General" active={activeTab === 1} onClick={() => setActiveTab(1)}>
        <NumberInput label="Length" value={length.value} min={1} onChange={(e) => handleChange(e, length.set)} />
        <NumberInput label="Width" value={width.value} min={1} onChange={(e) => handleChange(e, width.set)} />
        <NumberInput label="Height" value={height.value} min={1} onChange={(e) => handleChange(e, height.set)} />
        <NumberInput label="Floor Thickness" value={floor.value} min={1} onChange={(e) => handleChange(e, floor.set)} />
        <NumberInput label="Wall Thickness" value={wall.value} min={1} onChange={(e) => handleChange(e, wall.set)} />
        <NumberInput label="Lid Thickness" value={roof.value} min={1} onChange={(e) => handleChange(e, roof.set)} />
        <NumberInput label="Corner Radius" value={cornerRadius.value} min={1} onChange={(e) => handleChange(e, cornerRadius.set)} />
      </Accordian>

      <Accordian title="Lid Insert" active={activeTab === 2} onClick={() => setActiveTab(2)}>
        <NumberInput label="Insert Thickness" value={insertThickness.value} min={1} step={0.01} onChange={(e) => handleChange(e, insertThickness.set)} />
        <NumberInput label="Insert Height" value={insertHeight.value} min={1} step={0.01} onChange={(e) => handleChange(e, insertHeight.set)} />
        <NumberInput label="Insert Clearance" value={insertClearance.value} min={0.01} step={0.01} onChange={(e) => handleChange(e, insertClearance.set)} />
      </Accordian>

      <Accordian title="Holes" active={activeTab === 3} onClick={() => setActiveTab(3)}>
        {cableGlands.map((cg, i) => (
            <div key={i} className="hole-params">
              <p><b>Hole {i+1}</b></p>
              <div className="input-group">
                <label>Shape</label>
                <select value={cg.shape.value} onChange={(e) => cg.shape.set(e.target.value as 'circle' | 'square')}>
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                </select>
              </div>          
              <div className="input-group">
                <label>Surface</label>
                <select value={cg.surface.value} onChange={(e) => handleChange(e, cg.surface.set)}>
                  <option value={0}>Front</option>
                  <option value={1}>Right</option>
                  <option value={2}>Back</option>
                  <option value={3}>Left</option>
                  <option value={4}>Top</option>
                  <option value={5}>Bottom</option>
                </select>
              </div> 
              <NumberInput label="X" value={cg.x.value} onChange={(e) => handleChange(e, cg.x.set)} />
              <NumberInput label="Y" value={cg.y.value} onChange={(e) => handleChange(e, cg.y.set)} />
              <NumberInput label="Diameter" value={cg.diameter.value} onChange={(e) => handleChange(e, cg.diameter.set)} />
              <button className="remove-hole" onClick={() => cableGlands[i].set(none)}>REMOVE</button>
            </div>
          ))
        }
        <button className="add-hole" onClick={addHole}>ADD NEW HOLE</button>
      </Accordian>

      <Accordian title="PCB Mounts" active={activeTab === 4} onClick={() => setActiveTab(4)}>
        <NumberInput label="PCB Mounts" value={pcbMounts.value} min={0} onChange={(e) => {
          const value = parseFloat(e.currentTarget.value)
          pcbMountXY.set(Array.from({ length: value }, () => [0, 0]))
          pcbMounts.set(value)
        }} />
        {
          pcbMounts.value > 0 &&
            <NumberInput label="Screw Diameter" value={pcbMountScrewDiameter.value} min={0} step={0.01} onChange={(e) => handleChange(e, pcbMountScrewDiameter.set)} />
        }

        {pcbMounts.value > 0 &&
          pcbMountXY.map((_, i) => (
            <div key={i}>
              <NumberInput label={`PCB Mount ${i + 1} X`} value={_[0].value} onChange={(e) => handleChange(e, _[0].set)} />
              <NumberInput label={`PCB Mount ${i + 1} Y`} value={_[1].value} onChange={(e) => handleChange(e, _[1].set)} />
            </div>
          ))
        }
      </Accordian>

      <Accordian title="Waterproofing" active={activeTab === 5} onClick={() => setActiveTab(5)}>
        <CheckBox label="Waterproof" checked={waterProof.value} onChange={(e) => {
          waterProof.set(e.currentTarget.checked)
          e.currentTarget.checked && screws.set(true)
        }} />
        {
          waterProof.value &&
            <NumberInput label="Seal Thickness" value={sealThickness.value} min={1} step={0.01} onChange={(e) => handleChange(e, sealThickness.set)} />
        }
      </Accordian>

      <Accordian title="Lid Screws" active={activeTab === 6} onClick={() => setActiveTab(6)}>
        <CheckBox label="Lid Screws" checked={screws.value} onChange={(e) => {
          screws.set(e.currentTarget.checked)
          !e.currentTarget.checked && waterProof.set(false)
        }} />
        {
          screws.value &&
            <NumberInput label="Screw Diameter" value={screwDiameter.value} min={1} step={0.01} onChange={(e) => handleChange(e, screwDiameter.set)} />
        }
      </Accordian>

      <Accordian title="Wall Mounts" active={activeTab === 7} onClick={() => setActiveTab(7)}>
        <CheckBox label="Wall Mounts" checked={wallMounts.value} onChange={(e) => wallMounts.set(e.currentTarget.checked)} />
        {
          wallMounts.value &&
            <NumberInput label="Screw Diameter" value={wallMountScrewDiameter.value} min={1} step={0.01} onChange={(e) => handleChange(e, wallMountScrewDiameter.set)} />
        }
      </Accordian>

      <button type="submit" className="hidden">Submit</button>

    </form>
  );
};