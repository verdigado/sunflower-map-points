/* global L */
/* global sunflowerMapPoints */
/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';

import {
	RangeControl,
	PanelBody,
	PanelRow,
	TextControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { useLayoutEffect, useEffect, useRef } from '@wordpress/element';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               React props.
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { lat, lng, zoom, height, mailTo } = attributes;
	const mapContainerRef = useRef( null );
	const leafletMapRef = useRef( null );
	const blockProps = useBlockProps( {
		className: 'row',
	} );

	const onChangeMailTo = ( input ) => {
		setAttributes( { mailTo: input === undefined ? '' : input } );
	};

	useLayoutEffect( () => {
		if ( typeof L === 'undefined' ) {
			// eslint-disable-next-line no-console
			console.error( __( 'Leaflet is not available', 'sunflower-map-points-map' ) );
			return;
		}

		// Verhindern, dass die Karte mehrfach initialisiert wird
		if ( ! mapContainerRef.current || leafletMapRef.current ) {
			return;
		}

		const map = L.map( mapContainerRef.current, {
			scrollWheelZoom: true,
			dragging: true,
			fullscreenControl: true,
		} ).setView( [ attributes.lat, attributes.lng ], attributes.zoom );

		L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors',
			maxZoom: 18,
		} ).addTo( map );

		// Custom "Locate Me" Control
		L.Control.LocateControl = L.Control.extend( {
			onAdd() {
				const container = L.DomUtil.create(
					'div',
					'leaflet-bar leaflet-control leaflet-control-custom'
				);

				container.innerHTML =
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M320 48C337.7 48 352 62.3 352 80L352 98.3C450.1 112.3 527.7 189.9 541.7 288L560 288C577.7 288 592 302.3 592 320C592 337.7 577.7 352 560 352L541.7 352C527.7 450.1 450.1 527.7 352 541.7L352 560C352 577.7 337.7 592 320 592C302.3 592 288 577.7 288 560L288 541.7C189.9 527.7 112.3 450.1 98.3 352L80 352C62.3 352 48 337.7 48 320C48 302.3 62.3 288 80 288L98.3 288C112.3 189.9 189.9 112.3 288 98.3L288 80C288 62.3 302.3 48 320 48zM163.2 352C175.9 414.7 225.3 464.1 288 476.8L288 464C288 446.3 302.3 432 320 432C337.7 432 352 446.3 352 464L352 476.8C414.7 464.1 464.1 414.7 476.8 352L464 352C446.3 352 432 337.7 432 320C432 302.3 446.3 288 464 288L476.8 288C464.1 225.3 414.7 175.9 352 163.2L352 176C352 193.7 337.7 208 320 208C302.3 208 288 193.7 288 176L288 163.2C225.3 175.9 175.9 225.3 163.2 288L176 288C193.7 288 208 302.3 208 320C208 337.7 193.7 352 176 352L163.2 352zM320 272C346.5 272 368 293.5 368 320C368 346.5 346.5 368 320 368C293.5 368 272 346.5 272 320C272 293.5 293.5 272 320 272z"/></svg>';
				container.title = __('Locate me', 'sunflower-map-points-map');
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

		map.addControl(
			new L.Control.LocateControl( { position: 'topright' } )
		);

		map.on( 'locationfound', function ( e ) {
			L.marker( e.latlng )
				.addTo( map )
				.bindPopup(__( 'Your are here!', 'sunflower-map-points-map' ) )
				.openPopup();

			L.circle( e.latlng, {
				radius: e.accuracy,
				color: '#136aec',
				fillColor: '#136aec',
				fillOpacity: 0.2,
			} ).addTo( map );
		} );

		map.on( 'locationerror', function ( e ) {
			// eslint-disable-next-line no-alert, no-undef
			alert( __( 'Your location couldn\'t be found.', 'sunflower-map-points-map' ) + '\n' + e.message );
		} );

		// Klick auf Karte → Marker + Attribute setzen
		map.on( 'click', function ( e ) {
			const { lat: clickedLat, lng: clickedLng } = e.latlng;

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
			map._marker = L.marker( [ clickedLat, clickedLng ], {
				icon: customIcon,
			} ).addTo( map );

			// center map on new marker position
			map.setView( [ clickedLat, clickedLng ], map.getZoom() );

			// Workaround to enable dragging in Gutenberg editor.
			map.dragging.disable();
			map.dragging.enable();

			setAttributes( {
				lat: parseFloat( clickedLat.toFixed( 6 ) ),
				lng: parseFloat( clickedLng.toFixed( 6 ) ),
			} );
		} );

		map.on( 'zoomend', function () {
			const currentZoom = map.getZoom();
			setAttributes( { zoom: currentZoom } );
		} );

		leafletMapRef.current = map;
	}, [ attributes.lat, attributes.lng, attributes.zoom, setAttributes ] );

	useEffect( () => {
		const map = leafletMapRef.current;
		if ( map && typeof map.setZoom === 'function' ) {
			map.setZoom( attributes.zoom );
		}
	}, [ attributes.zoom ] );

	return (
		<div { ...blockProps }>
			{
				<>
					<div
						className="map-container"
						style={ { height: `${ attributes.height || 400 }px` } }
					>
						<div
							ref={ mapContainerRef }
							style={ { width: '100%', height: '100%' } }
							id="leaflet-editor-map"
						></div>
					</div>
				</>
			}
			{
				<>
					<InspectorControls>
						<PanelBody
								title={ __(
									'Map Settings',
									'sunflower-map-points-map'
								) }
								>
							<p className="components-base-control__help">
								{ __(
									'Click into the map and move to the right position. The position and zoom level will be used in the map settings.',
									'sunflower-map-points-map'
								) }
							</p>
							<TextControl
								label={ __(
									'Latitude',
									'sunflower-map-points-map'
								) }
								value={ lat }
								onChange={ ( val ) =>
									setAttributes( { lat: parseFloat( val ) } )
								}
							/>
							<TextControl
								label={ __(
									'Longitude',
									'sunflower-map-points-map'
								) }
								value={ lng }
								onChange={ ( val ) =>
									setAttributes( { lng: parseFloat( val ) } )
								}
							/>
							<RangeControl
								label={ __(
									'Zoom',
									'sunflower-map-points-map'
								) }
								value={ zoom }
								onChange={ ( val ) =>
									setAttributes( { zoom: val } )
								}
								min={ 1 }
								max={ 18 }
							/>
							<NumberControl
								label={ __(
									'Height',
									'sunflower-map-points-map'
								) }
								value={ height }
								onChange={ ( value ) => {
									const parsed = parseInt( value );
									if ( parsed >= 100 && parsed <= 1000 ) {
										setAttributes( { height: parsed } );
									}
								} }
								min={ 100 }
								max={ 1000 }
							/>
							<TextControl
								label={ __(
									'Mail To',
									'sunflower-map-points-map'
								) }
								help={ __(
									'Mail form to this address instead of default receiver.',
									'sunflower-map-points-map'
								) }
								value={ mailTo }
								placeholder={ __(
									'default receiver',
									'sunflower-map-points-map'
								) }
								type="email"
								onChange={ onChangeMailTo }
							/>
						</PanelBody>
					</InspectorControls>
				</>
			}
		</div>
	);
}
