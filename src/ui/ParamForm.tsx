import { useState } from "react";
import { useParams } from "../lib/params";
import { none } from '@hookstate/core'
import { BiTrash, BiPlus, BiMinus } from 'react-icons/bi'
import { Surface } from "../lib/enclosure";

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
    <div className="input-group" key={value}>
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
            {active ? <BiMinus /> : <BiPlus />}
          </span>
        </p>
      <div className="accordian-body">
        {children}
      </div>
    </div>
  )
}

export const ParamsForm = () => {
  const { length, width, height, floor, roof, wall, cornerRadius, wallMountScrewDiameter, 
    holes, pcbMounts, wallMounts, waterProof, lidScrews, lidScrewDiameter,
    baseLidScrewDiameter, sealThickness, insertThickness, insertHeight, 
    insertClearance  } = useParams()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement| HTMLSelectElement>, set: (v: number) => void) => {
    e.currentTarget.value && set(parseFloat(e.currentTarget.value))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    document.body.click()
  }

  const addHole = () => {
    holes[holes.length].set({
      shape: 'circle', 
      surface: 'front', 
      diameter: 12.5, 
      width: 10, 
      length: 10, 
      y: width.value/2, 
      x: 6
    })
  }

  const addPcbMount = () => {
    pcbMounts[pcbMounts.length].set({
      x: 0,
      y: 0,
      height: 5,
      outerDiameter: 6,
      screwDiameter: 2
    })
  }

  const [activeTab, setActiveTab] = useState<number | null>(null)

  const _setActiveTab = (i: number) => {
    if(activeTab === i) {
      setActiveTab(null)
    } else {
      setActiveTab(i)
    }
  }

  return (
    <form id="param-form" onSubmit={handleSubmit}>

      <Accordian title="General" active={activeTab === 1} onClick={() => _setActiveTab(1)}>
        <NumberInput label="Length" value={length.value} min={1} onChange={(e) => handleChange(e, length.set)} />
        <NumberInput label="Width" value={width.value} min={1} onChange={(e) => handleChange(e, width.set)} />
        <NumberInput label="Height" value={height.value} min={1} onChange={(e) => handleChange(e, height.set)} />
        <NumberInput label="Floor Thickness" value={floor.value} min={1} onChange={(e) => handleChange(e, floor.set)} />
        <NumberInput label="Wall Thickness" value={wall.value} min={1} onChange={(e) => handleChange(e, wall.set)} />
        <NumberInput label="Lid Thickness" value={roof.value} min={1} onChange={(e) => handleChange(e, roof.set)} />
        <NumberInput label="Corner Radius" value={cornerRadius.value} min={1} onChange={(e) => handleChange(e, cornerRadius.set)} />
      </Accordian>

      <Accordian title="Lid Insert" active={activeTab === 2} onClick={() => _setActiveTab(2)}>
        <NumberInput label="Insert Thickness" value={insertThickness.value} min={1} step={0.01} onChange={(e) => handleChange(e, insertThickness.set)} />
        <NumberInput label="Insert Height" value={insertHeight.value} min={1} step={0.01} onChange={(e) => handleChange(e, insertHeight.set)} />
        <NumberInput label="Insert Clearance" value={insertClearance.value} min={0.01} step={0.01} onChange={(e) => handleChange(e, insertClearance.set)} />
      </Accordian>

      <Accordian title="Holes" active={activeTab === 3} onClick={() => _setActiveTab(3)}>
        {holes.map((hole, i) => (
            <div key={`${hole.shape.value}${hole.surface.value}${i}`} className="sub-params">
              <button className="remove-btn" onClick={() => holes[i].set(none)}>
                <BiTrash title="Remove Hole" size="16" color="#ff7f50" />
              </button>
              <p><b>Hole {i+1}</b></p>
              <div className="input-group">
                <label>Shape</label>
                <select value={hole.shape.value} onChange={(e) => hole.shape.set(e.target.value as 'circle' | 'square')}>
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="rectangle">Rectangle</option>
                </select>
              </div>          
              <div className="input-group">
                <label>Surface</label>
                <select value={hole.surface.value} onChange={(e) => hole.surface.set(e.target.value as Surface)}>
                  <option value={'front'}>Front</option>
                  <option value={'right'}>Right</option>
                  <option value={'back'}>Back</option>
                  <option value={'left'}>Left</option>
                  <option value={'top'}>Top</option>
                  <option value={'bottom'}>Bottom</option>
                </select>
              </div> 
              <NumberInput label="X" value={hole.x.value} onChange={(e) => handleChange(e, hole.x.set)} />
              <NumberInput label="Y" value={hole.y.value} onChange={(e) => handleChange(e, hole.y.set)} />
              {(hole.shape.value === 'rectangle' || hole.shape.value === 'square') &&
              <NumberInput label="Width" value={hole.width.value} step={0.1} onChange={(e) => handleChange(e, hole.width.set)} />
              }
              {hole.shape.value === 'rectangle' &&
                <NumberInput label="Length" value={hole.length.value} step={0.1} onChange={(e) => handleChange(e, hole.length.set)} />
              }
              {hole.shape.value === 'circle' &&
                <NumberInput label="Diameter" value={hole.diameter.value} step={0.1} onChange={(e) => handleChange(e, hole.diameter.set)} />
              }
            </div>
          ))
        }
        <button className="add-btn" onClick={addHole}>ADD NEW HOLE</button>
      </Accordian>

      <Accordian title="PCB Mounts" active={activeTab === 4} onClick={() => _setActiveTab(4)}>
        {pcbMounts.map((mount, i) => (
          <div key={`${mount.x.value}${mount.y.value}${i}`} className="sub-params">
            <button className="remove-btn" onClick={() => pcbMounts[i].set(none)}>
              <BiTrash title="Remove Mount" size="16" color="#ff7f50" />
            </button>
            <p><b>Mount {i+1}</b></p>
            <NumberInput label="X" value={mount.x.value} onChange={(e) => handleChange(e, mount.x.set)} />
            <NumberInput label="Y" value={mount.y.value} onChange={(e) => handleChange(e, mount.y.set)} />
            <NumberInput label="Height" value={mount.height.value} onChange={(e) => handleChange(e, mount.height.set)} />
            <NumberInput label="Outer Diameter" value={mount.outerDiameter.value} onChange={(e) => handleChange(e, mount.outerDiameter.set)} />
            <NumberInput label="Screw Diameter" value={mount.screwDiameter.value} onChange={(e) => handleChange(e, mount.screwDiameter.set)} />
          </div>
        ))}
        <button className="add-btn" onClick={addPcbMount}>ADD NEW MOUNT</button>
      </Accordian>

      <Accordian title="Waterproofing" active={activeTab === 5} onClick={() => _setActiveTab(5)}>
        <CheckBox label="Waterproof" checked={waterProof.value} onChange={(e) => {
          waterProof.set(e.currentTarget.checked)
          e.currentTarget.checked && lidScrews.set(true)
        }} />
        {
          waterProof.value &&
            <NumberInput label="Seal Thickness" value={sealThickness.value} min={1} step={0.01} onChange={(e) => handleChange(e, sealThickness.set)} />
        }
      </Accordian>

      <Accordian title="Lid Screws" active={activeTab === 6} onClick={() => _setActiveTab(6)}>
        <CheckBox label="Include Lid Screws" checked={lidScrews.value} onChange={(e) => {
          lidScrews.set(e.currentTarget.checked)
          !e.currentTarget.checked && waterProof.set(false)
        }} />
        <br/>
        {
          lidScrews.value && 
            <>
              <NumberInput label="Lid Hole Diameter" value={lidScrewDiameter.value} min={1} step={0.01} onChange={(e) => handleChange(e, lidScrewDiameter.set)} />
              <NumberInput label="Base Hole Diameter" value={baseLidScrewDiameter.value} min={1} step={0.01} onChange={(e) => handleChange(e, baseLidScrewDiameter.set)} />
            </>
        }
      </Accordian>

      <Accordian title="Wall Mounts" active={activeTab === 7} onClick={() => _setActiveTab(7)}>
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