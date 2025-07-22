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
