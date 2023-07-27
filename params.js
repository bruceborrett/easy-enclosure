const params = {
  length: 100,
  width: 100,
  height: 30,
  wall: 2,
  dustProof: true,
  waterProof: true,
  showLid: true,
  showBase: true,
};

const updateParams = (e) => {
  const id = e.target.id
  if (typeof params[id] === "boolean") {
    params[id] = e.target.checked
  } else if (typeof params[id] === "number") {
    params[id] = parseFloat(e.target.value)
  }
  console.log(params)
  updateEntities()
}

// Get input elements
const lengthInput = document.getElementById("length")
const widthInput = document.getElementById("width")
const heightInput = document.getElementById("height")
const wallInput = document.getElementById("wall")
const dustProofInput = document.getElementById("dustProof")
const waterProofInput = document.getElementById("waterProof")
const showLidInput = document.getElementById("showLid")
const showBaseInput = document.getElementById("showBase")

// Set input values
lengthInput.value = params.length
widthInput.value = params.width
heightInput.value = params.height
wallInput.value = params.wall
dustProofInput.checked = params.dustProof
waterProofInput.checked = params.waterProof
showLidInput.checked = params.showLid
showBaseInput.checked = params.showBase

// Update params when inputs change
lengthInput.addEventListener("change", updateParams)
widthInput.addEventListener("change", updateParams)
heightInput.addEventListener("change", updateParams)
wallInput.addEventListener("change", updateParams)
dustProofInput.addEventListener("change", updateParams)
waterProofInput.addEventListener("change", updateParams)
showLidInput.addEventListener("change", updateParams)
showBaseInput.addEventListener("change", updateParams)