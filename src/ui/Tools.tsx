import { Geom3 } from "@jscad/modeling/src/geometries/types";
import { union } from "@jscad/modeling/src/operations/booleans";
import { serialize } from "@jscad/stl-serializer";
import { saveAs } from "file-saver";
import { useRef, useState } from "react";
import { base } from "../lib/enclosure/base";
import { internalWalls } from "../lib/enclosure/internalwalls";
import { lid } from "../lib/enclosure/lid";
import { pcbMounts } from "../lib/enclosure/pcbmount";
import { waterProofSeal } from "../lib/enclosure/waterproofseal";
import { Params, useParams } from "../lib/params";

import {
  BiSolidFileExport,
  BiSolidFolderOpen,
  BiSolidSave,
} from "react-icons/bi";

const formattedTimestamp = () => {
  const ts = new Date();
  const y = ts.getFullYear();
  const m = ts.getMonth() + 1;
  const d = ts.getDate();
  const h = ts.getHours();
  const mm = ts.getMinutes();
  const s = ts.getSeconds();
  return "" + y + m + d + h + mm + s;
};

export const Tools = () => {
  const [open, setOpen] = useState(false);

  const params = useParams();

  const fileInput = useRef<HTMLInputElement>(null);

  const _export = (name: string, geometry: Geom3) => {
    const rawData = serialize({ binary: false }, geometry);
    const blob = new Blob([rawData], { type: "application/octet-stream" });
    saveAs(blob, name + ".stl");
  };

  const exportSTL = () => {
    const tsStr = formattedTimestamp();
    const currentParams = params.get() as Params;

    _export("enclosure-lid-" + tsStr, lid(currentParams));

    const baseParts: Geom3[] = [base(currentParams)];

    if (currentParams.pcbMounts.length > 0) {
      baseParts.push(pcbMounts(currentParams));
    }

    if (currentParams.internalWalls.length > 0) {
      baseParts.push(internalWalls(currentParams));
    }

    if (baseParts.length > 1) {
      _export("enclosure-base-" + tsStr, union(baseParts));
    } else {
      _export("enclosure-base-" + tsStr, baseParts[0]);
    }

    if (currentParams.waterProof)
      _export(
        "enclosure-waterproof-seal-" + tsStr,
        waterProofSeal(currentParams),
      );

    setOpen(false);
  };

  const loadParamsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      const data = JSON.parse(fileReader.result as string);
      params.set({ ...params.get(), ...data });
    };
  };

  const saveParamsFile = () => {
    const tsStr = formattedTimestamp();
    const data = JSON.stringify(params.get(), null, 2);
    const textFile = new Blob([data], { type: "text/plain" });
    saveAs(textFile, "enclosure-" + tsStr + ".json");
  };

  return (
    <div id="tools">
      <button
        className="tool-button"
        onClick={() => fileInput.current?.click()}
      >
        <BiSolidFolderOpen title="Load settings from file" size="28" />
      </button>
      <button className="tool-button" onClick={() => saveParamsFile()}>
        <BiSolidSave title="Save settings to file" size="28" />
      </button>
      <button className="tool-button" onClick={() => setOpen(true)}>
        <BiSolidFileExport title="Export to STL" size="28" />
      </button>

      <input
        ref={fileInput}
        type="file"
        accept=".json"
        className="hidden"
        onChange={loadParamsFile}
      />

      <div id="modal" className={open ? "open" : ""}>
        <div id="modal-content">
          <button id="close" type="button" onClick={() => setOpen(false)}>
            &times;
          </button>
          <p>
            Multiple STL files will be exported, one for each entity (lid, base,
            waterproof seal etc)
          </p>
          <button id="export" onClick={exportSTL}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
