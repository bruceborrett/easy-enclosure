import { Params } from "../lib/params";

interface Props {
  params: Params,
  setParams: (params: Params) => void,
}

export const ParamsForm = ({params, setParams}: Props) => {

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.currentTarget.id as keyof typeof params

    let value
    if (e.currentTarget.type === 'checkbox') {
      value = e.currentTarget.checked  
    } else {
      value = parseFloat(e.currentTarget.value)
    }

    setParams({
      ...params,
      [id]: value
    })
  }
  
  return (
    <form>
      <label>Length</label>
      <input type="number" id="length" value={params.length} min={1} onChange={onChange} />
      <label>Width</label>
      <input type="number" id="width" value={params.width} min={1} onChange={onChange} />
      <label>Height</label>
      <input type="number" id="height" value={params.height} min={1} onChange={onChange} />
      <label>Wall Thickness</label>
      <input type="number" id="wall" value={params.wall} min={1} onChange={onChange} />
      <label>Corner Radius</label>
      <input type="number" id="cornerRadius" value={params.cornerRadius} min={1} onChange={onChange} />
      <label>Holes</label>
      <input type="number" id="cableGlands" value={params.cableGlands} onChange={onChange} />
      <label>Hole Width</label>
      <input type="number" id="cableGlandWidth" value={params.cableGlandWidth} onChange={onChange} />
      <label>Show Lid</label>
      <input type="checkbox" id="showLid" checked={params.showLid} onChange={onChange} />
      <label>Show Base</label>
      <input type="checkbox" id="showBase" checked={params.showBase} onChange={onChange} />
      <label>Wall Mounts</label>
      <input type="checkbox" id="wallMounts" checked={params.wallMounts} onChange={onChange} />
      <label>Waterproof</label>
      <input type="checkbox" id="waterProof" checked={params.waterProof} onChange={onChange} />
    </form>
  );
};