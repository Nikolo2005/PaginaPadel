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