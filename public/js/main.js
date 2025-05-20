function ping() {
  setInterval(function() {
    fetch('/ping').then(response => {
      if (response.ok) {
        console.log('Actividad mantenida.');
      } else {
        console.error('Error al mantener la actividad.');
      }
    });
  }, 10 * 60 * 1000);
}
ping();

// Resaltar el enlace activo según la página actual
document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.pathname;
    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        } else {
            link.classList.remove("active");
        }
    });
});