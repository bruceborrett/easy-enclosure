import { useState } from "react";
import { serialize } from '@jscad/stl-serializer'
import { lid } from '../lib/enclosure/lid'
import { base } from '../lib/enclosure/base'
import { waterProofSeal } from '../lib/enclosure/waterproofseal'
import { Params } from "../lib/params";
import { Geom3 } from "@jscad/modeling/src/geometries/types";

type Props = {
  params: Params
}

export const Exporter = ({params}: Props) => {
  const [open, setOpen] = useState(false);
  
  const _export = (name: string, geometry: Geom3) => {
    const rawData = serialize({binary: false}, geometry)
    const blob = new Blob([rawData], {type: 'application/octet-stream'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
  
    link.setAttribute('href', url)
    link.setAttribute('download', name + Date.now() + '.stl')
    link.style.visibility = 'hidden'
  
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportSTL = () => {
    const ts = new Date()
    const y = ts.getFullYear()
    const m = ts.getMonth()+1
    const d = ts.getDate()
    const h = ts.getHours()
    const mm = ts.getMinutes()
    const s = ts.getSeconds()
    const tsStr = '' + y + m + d + h + mm + s

    _export('enclosure-lid-' + tsStr, lid(params))
    _export('enclosure-base-' + tsStr, base(params))
    _export('enclosure-waterproof-seal-' + tsStr, waterProofSeal(params))

    setOpen(false)
  }

  return (
    <>
      <button id="download" onClick={() => setOpen(true)}>
        <img alt="Download" src={process.env.PUBLIC_URL + "/download.svg"} />
      </button>

      <div id="modal" className={open ? "open" : ""}>
        <div id="modal-content">
          <span id="close" onClick={() => setOpen(false)}>&times;</span>
          <p>Multiple STL files will be exported, one for each entity (lid, base, waterproof seal etc)</p>
          <button id="export" onClick={exportSTL}>Export</button>
        </div>
      </div>
    </>
  );
}