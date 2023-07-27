const button = document.getElementById('download');
const modal = document.getElementById('modal');
const close = document.getElementById('close');

const toggleModal = () => {
  modal.classList.toggle('open');
}

close.addEventListener('click', toggleModal);
button.addEventListener('click', toggleModal);