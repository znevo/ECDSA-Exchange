const Swal = require('sweetalert2');

class Flash {
  msg(msg, status = 'success') {
    Swal.fire({
      position: 'top-end',
      toast: true,
      timer: 3000,
      icon: status,
      text: msg
    });
  }

  error(msg) {
    this.msg(msg, 'error');
  }
}

export default Flash;
