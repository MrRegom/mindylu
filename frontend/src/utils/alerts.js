import Swal from 'sweetalert2';

// Diseño acorde a la app móvil tipo WhatsApp / Premium iOS
const swalConfig = {
  customClass: {
    popup: 'swal-mobile-popup',
    confirmButton: 'btn swal-btn-primary',
    cancelButton: 'btn swal-btn-secondary',
  },
  buttonsStyling: false,
  background: '#ffffff',
  color: '#111b21',
  backdrop: 'rgba(11, 20, 26, 0.4)'
};

export const showAlert = (mensaje, type = 'info') => {
  return Swal.fire({
    ...swalConfig,
    text: mensaje,
    icon: type === 'error' ? 'error' : type === 'success' ? 'success' : 'info',
    confirmButtonText: 'Aceptar',
    width: '320px',
    padding: '1.5em',
  });
};

export const showConfirm = async (mensaje, titulo = '¿Estás seguro?') => {
  const result = await Swal.fire({
    ...swalConfig,
    title: titulo,
    text: mensaje,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
    width: '320px',
    padding: '1.5em',
  });
  return result.isConfirmed;
};

export const showToast = (mensaje, type = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#ffffff',
    color: '#111b21',
    customClass: {
      popup: 'swal-mobile-toast',
    }
  });

  return Toast.fire({
    icon: type,
    title: mensaje
  });
};
