import React, { useState } from "react";

import { serialize } from '@jscad/stl-serializer'
import { Geom3 } from "@jscad/modeling/src/geometries/types";

type Props = {
  enclosure: Geom3
}

export const Exporter = ({enclosure}: Props) => {
  const [open, setOpen] = useState(false);
  
  const exportSTL = () => {
    const geometry = enclosure
    const rawData = serialize({binary: false}, geometry)
    const blob = new Blob([rawData], {type: 'application/octet-stream'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
  
    link.setAttribute('href', url)
    link.setAttribute('download', 'enclosure.stl')
    link.style.visibility = 'hidden'
  
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

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
          <button id="export" onClick={exportSTL}>Export STL File</button>
        </div>
      </div>
    </>
  );
}