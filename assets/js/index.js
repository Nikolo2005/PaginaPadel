document.getElementById("startButton").addEventListener("click", function () {
  var loaderContainer = document.getElementById("loaderContainer");
  var mainContent = document.getElementById("mainContent");

  loaderContainer.style.display = "flex";

  setTimeout(function () {
    location.href = "disponibilidad.html";
  }, 1700); // Simula una espera de 1.7 segundos antes de redirigir
});

function isMobileDevice() {
  // Verificar el user agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileUserAgent =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent.toLowerCase(),
    );

  // Verificar el tamaño de la pantalla
  const isMobileScreenSize = window.matchMedia("(max-width: 767px)").matches;

  return isMobileUserAgent || isMobileScreenSize;
}

if (isMobileDevice()) {
  document.getElementById("mobile-warning").classList.remove("hidden");
} else {
  document.getElementById("mobile-warning").classList.add("hidden");
}
