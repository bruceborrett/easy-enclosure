// import { enclosure } from './enclosure'
// import { stlSerializer } from '@jscad/stl-serializer'

// const button = document.getElementById('download');
// const modal = document.getElementById('modal');
// const close = document.getElementById('close');
// const exportButton = document.getElementById('export');

// const toggleModal = () => {
//   modal && modal.classList.toggle('open');
// }

// const exportSTL = () => {
//   console.log(enclosure)
//   const geometry = enclosure.geometry
//   const rawData = stlSerializer.serialize({binary: true}, geometry)
//   const blob = new Blob([rawData], {type: 'application/octet-stream'})
//   const url = URL.createObjectURL(blob)
//   const link = document.createElement('a')

//   link.setAttribute('href', url)
//   link.setAttribute('download', 'enclosure.stl')
//   link.style.visibility = 'hidden'

//   document.body.appendChild(link)
//   link.click()
//   document.body.removeChild(link)
// }

// close && close.addEventListener('click', toggleModal);
// button && button.addEventListener('click', toggleModal);
// exportButton && exportButton.addEventListener('click', exportSTL);