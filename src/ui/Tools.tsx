import { useRef, useState } from "react";
import { serialize } from '@jscad/stl-serializer'
import { lid } from '../lib/enclosure/lid'
import { base } from '../lib/enclosure/base'
import { waterProofSeal } from '../lib/enclosure/waterproofseal'
import { Params, useParams } from "../lib/params";
import { Geom3 } from "@jscad/modeling/src/geometries/types";
import { union } from "@jscad/modeling/src/operations/booleans";
import { pcbMounts } from "../lib/enclosure/pcbmount";
import { saveAs } from 'file-saver'

import { BiSolidSave, BiSolidFolderOpen, BiSolidFileExport } from 'react-icons/bi'

const formattedTimestamp = () => {
  const ts = new Date()
  const y = ts.getFullYear()
  const m = ts.getMonth()+1
  const d = ts.getDate()
  const h = ts.getHours()
  const mm = ts.getMinutes()
  const s = ts.getSeconds()
  return '' + y + m + d + h + mm + s
}

export const Tools = () => {
  const [open, setOpen] = useState(false);
  
  const params = useParams()

  const fileInput = useRef<HTMLInputElement>(null)

  const _export = (name: string, geometry: Geom3) => {
    const rawData = serialize({binary: false}, geometry)
    const blob = new Blob([rawData], {type: 'application/octet-stream'})
    saveAs(blob, name + '.stl')
  }

  const exportSTL = () => {
    const tsStr = formattedTimestamp()

    _export('enclosure-lid-' + tsStr, lid(params.get() as Params))

    if (params.pcbMounts.value > 0) {
      _export('enclosure-base-' + tsStr, union(
        base(params.get() as Params),
        pcbMounts(params.get() as Params)
      ))
    } else {
      _export('enclosure-base-' + tsStr, base(params.get() as Params))
    }
    
    if (params.waterProof.value)
      _export('enclosure-waterproof-seal-' + tsStr, waterProofSeal(params.get() as Params))

    setOpen(false)
  }

  const loadParamsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = e => {
      const data = JSON.parse(fileReader.result as string)
      params.set(data);
    };
  }

  const saveParamsFile = () => {
    const tsStr = formattedTimestamp()
    const data = JSON.stringify(params.get(), null, 2)
    const textFile = new Blob([data], {type: 'text/plain'})
    saveAs(textFile, 'enclosure-' + tsStr + '.json')
  }
  
  return (
    <div id="tools">
      <button className="tool-button" onClick={() => fileInput.current?.click()}>
        <BiSolidFolderOpen title="Load settings from file" size="36" color="#666666" />
      </button>
      <button className="tool-button" onClick={() => saveParamsFile()}>
        <BiSolidSave title="Save settings to file" size="36" color="#666666" />
      </button>
      <button className="tool-button" onClick={() => setOpen(true)}>
        <BiSolidFileExport title="Export to STL" size="36" color="#666666" />
      </button>

      <input ref={fileInput} type="file" accept=".json" className="hidden" onChange={loadParamsFile}/>

      <div id="modal" className={open ? "open" : ""}>
        <div id="modal-content">
          <span id="close" onClick={() => setOpen(false)}>&times;</span>
          <p>Multiple STL files will be exported, one for each entity (lid, base, waterproof seal etc)</p>
          <button id="export" onClick={exportSTL}>Export</button>
        </div>
      </div>
    </div>
  );
}