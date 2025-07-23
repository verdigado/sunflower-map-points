/******/ (() => { // webpackBootstrap
/*!*************************!*\
  !*** ./src/map/view.js ***!
  \*************************/
const sunflowerForm = document.getElementById('leaflet-form');
sunflowerForm.addEventListener('submit', disableButton);

/**
 * Disable submit button after first submit
 */
function disableButton() {
  const button = sunflowerForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.style.opacity = 0.5;
}
/******/ })()
;
//# sourceMappingURL=view.js.map