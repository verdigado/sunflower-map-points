/******/ (() => { // webpackBootstrap
/*!*********************************!*\
  !*** ./src/map/map-frontend.js ***!
  \*********************************/
/* global L */
/* global MutationObserver */
/* global sunflowerMapPoints */
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.map-container').forEach(el => {
      if (typeof L === 'undefined') {
        // eslint-disable-next-line no-console
        console.error('Leaflet is not available');
        return;
      }
      const mapEl = el.querySelector('#map');
      if (!mapEl) {
        return;
      }
      if (mapEl && mapEl._leaflet_id) {
        return;
      }
      const initLat = parseFloat(el.dataset.lat);
      const initLng = parseFloat(el.dataset.lng);
      const initZoom = parseInt(el.dataset.zoom, 10);
      const map = L.map(mapEl, {
        scrollWheelZoom: true,
        dragging: true,
        fullscreenControl: true
      }).setView([initLat, initLng], initZoom);

      // Custom "Locate Me" Control
      L.Control.LocateControl = L.Control.extend({
        onAdd() {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
          container.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
          container.style.backgroundColor = 'white';
          container.style.width = '34px';
          container.style.height = '34px';
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
          container.style.cursor = 'pointer';
          container.onclick = function () {
            map.locate({
              setView: true,
              maxZoom: 15
            });
          };

          // Mausinteraktion auf der Karte nicht blockieren
          L.DomEvent.disableClickPropagation(container);
          return container;
        }
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      }).addTo(map);
      map.addControl(new L.Control.LocateControl({
        position: 'topright'
      }));
      map.on('locationfound', function (e) {
        const marker = L.marker(e.latlng).addTo(map).bindPopup('Du bist hier!').openPopup();
        L.circle(e.latlng, {
          radius: e.accuracy,
          color: '#136aec',
          fillColor: '#136aec',
          fillOpacity: 0.2
        }).addTo(map);

        // Remove marker of current location after 2 seconds
        setTimeout(() => {
          map.removeLayer(marker);
        }, 2000);
      });
      map.on('locationerror', function (e) {
        // eslint-disable-next-line no-alert, no-undef
        alert('Standort konnte nicht gefunden werden: ' + e.message);
      });
      let marker;
      map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        // Entferne vorherigen Marker (optional)
        if (marker) {
          map.removeLayer(marker);
        }

        // Create custom icon
        const customIcon = L.icon({
          iconUrl: sunflowerMapPoints.maps_marker,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [0, -25]
        });

        // Create marker
        marker = L.marker([lat, lng], {
          icon: customIcon
        }).addTo(map);

        // show form as popup
        const formHtml = `
				<form id="leaflet-form">
				${sunflowerMapPoints._nonce}
				<input type="hidden" name="action" value="send_leaflet_form">
				<input type="hidden" name="lat" value="${lat}">
				<input type="hidden" name="lng" value="${lng}">
				<div class="mb-2">
					<label>Name (*):<br><input type="text" name="name" required></label>
				</div>
				<div class="mb-2">
					<label>Email (*):<br><input type="email" name="email" required></label>
				</div>
				<div class="mb-2">
					<label>Telefon:<br><input type="tel" name="phone"></label>
				</div>
				<div class="mb-2">
					<label>Hinweis (*):<br><textarea name="message" rows="10" required></textarea></label>
				</div>
				<button type="submit" class="btn btn-primary btn-sm">Senden</button>
				</form>
				<div id="form-message" class="alert d-none mt-2" role="alert"></div>
			`;

        // Popup anzeigen
        marker.bindPopup(formHtml, {
          autoPan: true,
          autoPanPadding: [40, 40],
          // sorgt für ausreichend Abstand von Rändern
          offset: [0, -10] // zentriert Popup besser über Marker
        }).openPopup();
      });
      map.on('popupopen', function () {
        const form = document.getElementById('leaflet-form');
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(form);
            fetch(sunflowerMapPoints.ajaxurl, {
              method: 'POST',
              body: formData
            }).then(response => response.json()).then(data => {
              const popupContent = `
							<div class="alert alert-success fade-message mb-0" id="popup-message">
							${data.messageafter}
							</div>
						`;

              // Popup-Inhalt ersetzen (statt nur Nachricht unten drunter)
              marker.getPopup().setContent(popupContent);
              setTimeout(() => {
                map.closePopup();
                if (marker) {
                  map.removeLayer(marker);
                  marker = null;
                }
              }, 8000);
              form.reset();
            }).catch(() => {
              const msgBox = document.getElementById('form-message');
              msgBox.textContent = 'Fehler beim Absenden!';
              msgBox.className = 'alert alert-danger mt-2';
              msgBox.classList.remove('d-none');
            });
            setTimeout(() => {
              map.closePopup();
              if (marker) {
                map.removeLayer(marker);
                marker = null;
              }
            }, 8000);
          });
        }
      });
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
/******/ })()
;
//# sourceMappingURL=map-frontend.js.map