document.addEventListener("DOMContentLoaded", function () {
  function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  if (isMobileDevice()) {
    document.getElementById("content").classList.add("hidden");
    document.getElementById("mobile-warning").classList.remove("hidden");
  }
});
