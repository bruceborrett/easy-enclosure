const button = document.getElementById('download');
const modal = document.getElementById('modal');
const close = document.getElementById('close');
const exportButton = document.getElementById('export');

const toggleModal = () => {
  modal.classList.toggle('open');
}

const exportSTL = () => {
  console.log(model)
  const rawData = serialize({binary: false}, model)
  const blob = new Blob([rawData], {type: mimeType})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.setAttribute('href', url)
  link.setAttribute('download', 'enclosure.stl')
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

close.addEventListener('click', toggleModal);
button.addEventListener('click', toggleModal);
exportButton.addEventListener('click', exportSTL);