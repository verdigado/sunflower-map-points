/* global L */
/* global MutationObserver */
/* global sunflowerMapPoints */
/* global bootstrap */

/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

document.addEventListener( 'DOMContentLoaded', () => {
	const observer = new MutationObserver( () => {
		document.querySelectorAll( '.map-container' ).forEach( ( el ) => {
			if ( typeof L === 'undefined' ) {
				// eslint-disable-next-line no-console
				console.error(
					__( 'Leaflet is not available', 'sunflower-map-points-map' )
				);
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
						'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 48C337.7 48 352 62.3 352 80L352 98.3C450.1 112.3 527.7 189.9 541.7 288L560 288C577.7 288 592 302.3 592 320C592 337.7 577.7 352 560 352L541.7 352C527.7 450.1 450.1 527.7 352 541.7L352 560C352 577.7 337.7 592 320 592C302.3 592 288 577.7 288 560L288 541.7C189.9 527.7 112.3 450.1 98.3 352L80 352C62.3 352 48 337.7 48 320C48 302.3 62.3 288 80 288L98.3 288C112.3 189.9 189.9 112.3 288 98.3L288 80C288 62.3 302.3 48 320 48zM163.2 352C175.9 414.7 225.3 464.1 288 476.8L288 464C288 446.3 302.3 432 320 432C337.7 432 352 446.3 352 464L352 476.8C414.7 464.1 464.1 414.7 476.8 352L464 352C446.3 352 432 337.7 432 320C432 302.3 446.3 288 464 288L476.8 288C464.1 225.3 414.7 175.9 352 163.2L352 176C352 193.7 337.7 208 320 208C302.3 208 288 193.7 288 176L288 163.2C225.3 175.9 175.9 225.3 163.2 288L176 288C193.7 288 208 302.3 208 320C208 337.7 193.7 352 176 352L163.2 352zM320 272C346.5 272 368 293.5 368 320C368 346.5 346.5 368 320 368C293.5 368 272 346.5 272 320C272 293.5 293.5 272 320 272z"/></svg>';
					container.title = __(
						'Locate me',
						'sunflower-map-points-map'
					);
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
					.bindPopup(
						__( 'Your are here!', 'sunflower-map-points-map' )
					)
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
				alert(
					__(
						"Your location couldn't be found.",
						'sunflower-map-points-map'
					) +
						'\n' +
						e.message
				);
			} );

			let lastLat = null;
			let lastLng = null;

			map.on( 'click', function ( e ) {
				lastLat = e.latlng.lat.toFixed( 6 );
				lastLng = e.latlng.lng.toFixed( 6 );

				// marker icon
				const customIcon = L.icon( {
					iconUrl: sunflowerMapPoints.maps_marker,
					iconSize: [ 25, 41 ],
					iconAnchor: [ 12, 41 ],
					popupAnchor: [ 0, -25 ],
				} );

				// remove old marker icon
				if ( map._marker ) {
					map.removeLayer( map._marker );
				}

				// set new marker
				map._marker = L.marker( [ lastLat, lastLng ], {
					icon: customIcon,
				} ).addTo( map );

				// write location to modal form input fields
				document.querySelector( '#form-lat' ).value = lastLat;
				document.querySelector( '#form-lng' ).value = lastLng;

				// show modal
				if (
					typeof bootstrap !== 'undefined' &&
					typeof bootstrap.Modal === 'function'
				) {
					const modal = new bootstrap.Modal(
						document.getElementById( 'leafletModal' )
					);
					modal.show();
				} else {
					// eslint-disable-next-line no-console
					console.log(
						__(
							'Bootstrap is not available',
							'sunflower-map-points-map'
						)
					);
				}
			} );
		} );

		const modalEl = document.getElementById( 'leafletModal' );
		if ( modalEl ) {
			modalEl.addEventListener( 'shown.bs.modal', () => {
				const form = document.getElementById( 'leaflet-form' );

				if ( ! form || form.dataset.handlerAttached === 'true' ) {
					return;
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

				let isSubmitting = false;

				// register only once
				if ( ! form.dataset.listenerBound ) {
					form.addEventListener( 'submit', formSubmitHandler );
					form.dataset.listenerBound = 'true';
				}

				function formSubmitHandler( e ) {
					e.preventDefault();

					if ( isSubmitting ) {
						return; // block further submits
					}

					isSubmitting = true;

					const button = form.querySelector(
						'button[type="submit"]'
					);
					button.disabled = true;
					button.style.opacity = 0.5;

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

									isSubmitting = false;
								}, 5000 );
							} else {
								messageBox.textContent =
									data?.messageafter ||
									__(
										'An error occured!',
										'sunflower-map-points-map'
									);
								messageBox.classList.remove( 'd-none' );
								isSubmitting = false;
								button.disabled = false;
								button.style.opacity = 1;
								messageBox.classList.add(
									'alert',
									'alert-danger'
								);
							}
						} )
						.catch( () => {
							messageBox.textContent = __(
								'Error on transmitting the form data.',
								'sunflower-map-points-map'
							);
							messageBox.classList.remove( 'd-none' );
							messageBox.classList.add( 'alert', 'alert-danger' );
							isSubmitting = false;
							button.disabled = false;
							button.style.opacity = 1;
						} );
				}

				// Markiere, dass der Handler schon gesetzt wurde
				form.dataset.handlerAttached = 'true';
			} );

			modalEl.addEventListener( 'hidden.bs.modal', () => {
				const form = document.getElementById( 'leaflet-form' );
				form.dataset.handlerAttached = 'false';
				form.reset();

				// re-enable the submit button to allow multiple, different submits
				const button = form.querySelector( 'button[type="submit"]' );
				button.disabled = false;
				button.style.opacity = 1;

				if ( window.miniMap ) {
					window.miniMap.remove();
					window.miniMap = null;
					window.miniMarker = null;
				}
			} );
		}
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
} );
