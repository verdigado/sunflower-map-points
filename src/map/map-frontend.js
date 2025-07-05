/* global L */
/* global MutationObserver */
/* global sunflowerMapPoints */
/* global bootstrap */
document.addEventListener( 'DOMContentLoaded', () => {
	const observer = new MutationObserver( () => {
		document.querySelectorAll( '.map-container' ).forEach( ( el ) => {
			if ( typeof L === 'undefined' ) {
				// eslint-disable-next-line no-console
				console.error( 'Leaflet is not available' );
				return;
			}

			const mapEl = el.querySelector( '#map' );

			if ( ! mapEl ) {
				return;
			}

			if ( mapEl && mapEl._leaflet_id ) {
				return;
			}

			const initLat = parseFloat( el.dataset.lat );
			const initLng = parseFloat( el.dataset.lng );
			const initZoom = parseInt( el.dataset.zoom, 10 );

			const map = L.map( mapEl, {
				scrollWheelZoom: true,
				dragging: true,
				fullscreenControl: true,
			} ).setView( [ initLat, initLng ], initZoom );

			mapEl._leafletMap = map;

			// Custom "Locate Me" Control
			L.Control.LocateControl = L.Control.extend( {
				onAdd() {
					const container = L.DomUtil.create(
						'div',
						'leaflet-bar leaflet-control leaflet-control-custom'
					);

					container.innerHTML =
						'<i class="fa-solid fa-location-crosshairs"></i>';
					container.style.backgroundColor = 'white';
					container.style.width = '34px';
					container.style.height = '34px';
					container.style.display = 'flex';
					container.style.alignItems = 'center';
					container.style.justifyContent = 'center';
					container.style.cursor = 'pointer';

					container.onclick = function () {
						map.locate( { setView: true, maxZoom: 15 } );
					};

					// Mausinteraktion auf der Karte nicht blockieren
					L.DomEvent.disableClickPropagation( container );

					return container;
				},
			} );

			L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution:
					'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
			} ).addTo( map );

			map.addControl(
				new L.Control.LocateControl( { position: 'topright' } )
			);

			map.on( 'locationfound', function ( e ) {
				const marker = L.marker( e.latlng )
					.addTo( map )
					.bindPopup( 'Du bist hier!' )
					.openPopup();

				L.circle( e.latlng, {
					radius: e.accuracy,
					color: '#136aec',
					fillColor: '#136aec',
					fillOpacity: 0.2,
				} ).addTo( map );

				// Remove marker of current location after 2 seconds
				setTimeout( () => {
					map.removeLayer( marker );
				}, 2000 );
			} );

			map.on( 'locationerror', function ( e ) {
				// eslint-disable-next-line no-alert, no-undef
				alert( 'Standort konnte nicht gefunden werden: ' + e.message );
			} );

			let lastLat = null;
			let lastLng = null;

			map.on( 'click', function ( e ) {
				lastLat = e.latlng.lat.toFixed( 6 );
				lastLng = e.latlng.lng.toFixed( 6 );

				// Marker-Icon
				const customIcon = L.icon( {
					iconUrl: sunflowerMapPoints.maps_marker,
					iconSize: [ 25, 41 ],
					iconAnchor: [ 12, 41 ],
					popupAnchor: [ 0, -25 ],
				} );

				// Alten Marker entfernen
				if ( map._marker ) {
					map.removeLayer( map._marker );
				}

				// Neuen Marker setzen
				map._marker = L.marker( [ lastLat, lastLng ], {
					icon: customIcon,
				} ).addTo( map );

				// Formular-Werte setzen
				document.querySelector( '#form-lat' ).value = lastLat;
				document.querySelector( '#form-lng' ).value = lastLng;

				// Modal anzeigen
				const modal = new bootstrap.Modal(
					document.getElementById( 'leafletModal' )
				);
				modal.show();
			} );
		} );

		document
			.getElementById( 'leafletModal' )
			.addEventListener( 'shown.bs.modal', () => {
				const form = document.getElementById( 'leaflet-form' );

				if ( ! form || form.dataset.handlerAttached === 'true' ) {
					return; // Handler schon gesetzt oder kein Formular vorhanden
				}

				// Mini map on top of modal form
				const miniMapEl = document.getElementById( 'mini-map' );
				if ( miniMapEl ) {
					const lat = parseFloat(
						document.querySelector( '#form-lat' ).value
					);
					const lng = parseFloat(
						document.querySelector( '#form-lng' ).value
					);

					if ( ! window.miniMap ) {
						window.miniMap = L.map( miniMapEl, {
							center: [ lat, lng ],
							zoom: 17,
							dragging: false,
							scrollWheelZoom: false,
							zoomControl: false,
							attributionControl: false,
						} );

						L.tileLayer(
							'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
							{
								maxZoom: 19,
							}
						).addTo( window.miniMap );

						const customIcon = L.icon( {
							iconUrl: sunflowerMapPoints.maps_marker,
							iconSize: [ 25, 41 ],
							iconAnchor: [ 12, 41 ],
							popupAnchor: [ 0, -25 ],
						} );

						window.miniMarker = L.marker( [ lat, lng ], {
							icon: customIcon,
						} ).addTo( window.miniMap );
					} else {
						window.miniMap.setView( [ lat, lng ] );
						if ( window.miniMarker ) {
							window.miniMap.removeLayer( window.miniMarker );
						}
						window.miniMarker = L.marker( [ lat, lng ] ).addTo(
							window.miniMap
						);
						window.miniMap.invalidateSize();
					}
				}

				const mapEl = document.querySelector( '#map' );
				const map = mapEl?._leafletMap;

				form.addEventListener( 'submit', function ( e ) {
					e.preventDefault();
					const formData = new FormData( form );
					const messageBox =
						document.getElementById( 'form-message' );

					// Reset message box
					messageBox.classList.add( 'd-none', 'alert' );
					messageBox.classList.remove(
						'alert-success',
						'alert-danger'
					);
					messageBox.textContent = '';

					fetch( sunflowerMapPoints.ajaxurl, {
						method: 'POST',
						credentials: 'same-origin',
						body: formData,
					} )
						.then( ( response ) => response.json() )
						.then( ( data ) => {
							if ( data.success ) {
								form.classList.add( 'd-none' );
								form.reset();
								messageBox.innerHTML = data?.messageafter;
								messageBox.classList.remove( 'd-none' );
								messageBox.classList.add(
									'alert',
									'alert-success'
								);
								setTimeout( () => {
									const modalEl =
										document.getElementById(
											'leafletModal'
										);
									if ( modalEl ) {
										const modal =
											bootstrap.Modal.getInstance(
												modalEl
											);
										modal?.hide();
										messageBox.classList.add( 'd-none' );
										messageBox.textContent = '';
										form.classList.remove( 'd-none' );

										// remove marker
										if ( map?._marker ) {
											map.removeLayer( map._marker );
											map._marker = null;
										}
									}
								}, 5000 );
							} else {
								messageBox.textContent =
									data?.messageafter ||
									'Ein Fehler ist aufgetreten.';
								messageBox.classList.remove( 'd-none' );
								messageBox.classList.add(
									'alert',
									'alert-danger'
								);
							}
						} )
						.catch( () => {
							messageBox.textContent =
								'Fehler bei der Übertragung.';
							messageBox.classList.remove( 'd-none' );
							messageBox.classList.add( 'alert', 'alert-danger' );
						} );
				} );

				// Markiere, dass der Handler schon gesetzt wurde
				form.dataset.handlerAttached = 'true';
			} );

		document
			.getElementById( 'leafletModal' )
			.addEventListener( 'hidden.bs.modal', () => {
				const form = document.getElementById( 'leaflet-form' );
				form.dataset.handlerAttached = 'false';
				form.reset();

				if ( window.miniMap ) {
					window.miniMap.remove();
					window.miniMap = null;
					window.miniMarker = null;
				}
			} );
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
} );
