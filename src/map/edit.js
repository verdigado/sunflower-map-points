/* global L */
/* global sunflowerMapPoints */
/* global sunflowerMapPointsTopics */
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
	Button,
	RangeControl,
	PanelBody,
	TextControl,
	SelectControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';

import { useSelect } from '@wordpress/data';
import {
	useLayoutEffect,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

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
	const { lat, lng, zoom, height, mailTo, topics, showMarker } = attributes;

	const areas = Array.isArray( attributes.areas ) ? attributes.areas : [];

	const mapContainerRef = useRef( null );
	const leafletMapRef = useRef( null );
	const blockProps = useBlockProps( {
		className: 'row',
	} );
	const allTopics =
		typeof sunflowerMapPointsTopics !== 'undefined'
			? sunflowerMapPointsTopics
			: [];
	const clusterGroupRef = useRef( null );
	const [ allowedLayers, setAllowedLayers ] = useState( [] );

	const toggleTopic = ( value ) => {
		if ( topics.includes( value ) ) {
			setAttributes( {
				topics: topics.filter( ( t ) => t !== value ),
			} );
		} else {
			// Add new topic in the order of allTopics
			const updated = [ ...topics, value ];
			const ordered = allTopics
				.map( ( t ) => t.label )
				.filter( ( label ) => updated.includes( label ) );

			setAttributes( { topics: ordered } );
		}
	};

	const onChangeMailTo = ( input ) => {
		setAttributes( { mailTo: input === undefined ? '' : input } );
	};

	const onChangeShowMarkerSelect = ( input ) => {
		setAttributes( { showMarker: input === undefined ? 'none' : input } );
	};

	const allowedAreas = useSelect(
		( select ) =>
			( areas || [] ).map( ( id ) => select( 'core' ).getMedia( id ) ),
		[ areas ]
	);

	function getIcon( label ) {
		// Standard-Icon, falls nichts gefunden wird
		let iconClass = 'fa-solid fa-map-marker';

		const topic = sunflowerMapPointsTopics.find(
			( t ) => t.label === label
		);
		if ( topic && topic.icon ) {
			iconClass = `fa-solid ${ topic.icon }`;
		}

		return L.divIcon( {
			html: `<i class="${ iconClass } fa-2x"></i>`,
			className: 'custom-fa-icon',
			iconSize: [ 30, 30 ],
			iconAnchor: [ 15, 30 ],
		} );
	}

	useLayoutEffect( () => {
		if ( typeof L === 'undefined' ) {
			// eslint-disable-next-line no-console
			console.error(
				__( 'Leaflet is not available', 'sunflower-map-points-map' )
			);
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
				container.title = __( 'Locate me', 'sunflower-map-points-map' );
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
				.bindPopup( __( 'Your are here!', 'sunflower-map-points-map' ) )
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
			alert(
				__(
					"Your location couldn't be found.",
					'sunflower-map-points-map'
				) +
					'\n' +
					e.message
			);
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
	}, [
		attributes.lat,
		attributes.lng,
		attributes.zoom,
		attributes.showMarker,
		setAttributes,
	] );

	useLayoutEffect( () => {
		if ( ! allowedAreas || allowedAreas.length === 0 ) {
			return;
		}

		async function loadLayers() {
			const map = leafletMapRef.current;
			if ( ! map ) {
				return;
			}

			const newLayers = [];

			function approximateLayerArea( layer ) {
				const bounds = layer.getBounds();

				const north = bounds.getNorth();
				const south = bounds.getSouth();
				const east = bounds.getEast();
				const west = bounds.getWest();

				const layerHeight = Math.abs( north - south ) * 100;
				const layerWidth = Math.abs( east - west ) * 100;

				return layerWidth * layerHeight;
			}

			for ( const file of allowedAreas ) {
				if ( ! file || ! file.source_url ) {
					continue;
				}

				try {
					const res = await fetch( file.source_url );
					const json = await res.json();

					const layer = L.geoJSON( json, {
						style: {
							color: '#005437ff',
							weight: 2,
							fillColor: '#148f435b',
							fillOpacity: 0.15,
						},
					} ).addTo( map );

					layer.areaName = file.title;
					layer.sortIndex = approximateLayerArea( layer );

					newLayers.push( layer );
				} catch ( e ) {
					// eslint-disable-next-line no-console
					console.error( 'GeoJSON loading failed', e );
				}
			}

			setAllowedLayers( newLayers );
		}

		loadLayers();
	}, [ allowedAreas ] );

	useLayoutEffect( () => {
		const map = leafletMapRef.current;

		clusterGroupRef.current?.clearLayers();

		if (
			( attributes.showMarker === 'front-and-backend' ||
				attributes.showMarker === 'backend' ) &&
			typeof sunflowerMapPointsTopics !== 'undefined'
		) {
			const clusterGroup = L.markerClusterGroup();
			map.addLayer( clusterGroup );
			clusterGroupRef.current = clusterGroup;

			function loadMarkers() {
				const bounds = map.getBounds();
				const url =
					`/wp-json/sunflower-map/v1/pois?` +
					`north=${ bounds.getNorth() }&south=${ bounds.getSouth() }&east=${ bounds.getEast() }&west=${ bounds.getWest() }`;

				fetch( url )
					.then( ( res ) => res.json() )
					.then( ( data ) => {
						clusterGroup.clearLayers();
						data.forEach( ( poi ) => {
							if ( poi.lat && poi.lng ) {
								const marker = L.marker( [ poi.lat, poi.lng ], {
									icon: getIcon( poi.topic ),
								} );
								marker.bindPopup(
									`<strong>${ poi.topic }</strong><br><i>${ poi.message }</i>`
								);
								clusterGroup.addLayer( marker );
							}
						} );
					} );
			}

			loadMarkers();

			// Reload markers after every move.
			map.on( 'moveend', loadMarkers );
		}
	}, [ attributes.showMarker ] );

	useEffect( () => {
		const map = leafletMapRef.current;
		if ( map && typeof map.setZoom === 'function' ) {
			map.setZoom( attributes.zoom );
		}
	}, [ attributes.zoom ] );

	const openGeoJsonFrame = () => {
		const frame = wp.media( {
			title: 'GeoJSON auswählen',
			library: {
				type: [ 'application/json', 'application/geo+json' ],
			},
			button: { text: 'Hinzufügens' },
			multiple: true,
		} );

		// Vorauswahl aktivieren
		frame.on( 'open', () => {
			const selection = frame.state().get( 'selection' );
			attributes.areas.forEach( ( id ) => {
				const attachment = wp.media.attachment( id );
				attachment.fetch();
				selection.add( attachment );
			} );
		} );

		// Auswahl speichern
		frame.on( 'select', () => {
			const selection = frame.state().get( 'selection' );
			const ids = selection.map( ( att ) => att.id );
			setAttributes( { areas: ids } );
		} );

		frame.open();
	};

	async function runReassignment() {
		const map = leafletMapRef.current;

		if (
			! confirm(
				'Alle Marker anhand der aktuellen Gebietsflächen neu zuordnen?'
			)
		) {
			return;
		}

		const pois = [];
		// 1. Alle POIs holen

		const bounds = map.getBounds();
		const url =
			`/wp-json/sunflower-map/v1/pois?` +
			`north=${ bounds.getNorth() }&south=${ bounds.getSouth() }&east=${ bounds.getEast() }&west=${ bounds.getWest() }`;

		console.log( 'url:', url );
		await fetch( url )
			.then( ( res ) => res.json() )
			.then( ( data ) => {
				console.log( 'data (1): ', data );
				data.forEach( ( poi ) => {
					pois.push( poi );
				} );
			} );
		console.log( 'pois (1): ', pois );

		const results = [];

		for ( const poi of pois ) {
			console.log( 'poi: ', poi );

			const latlng = L.latLng( poi.lat, poi.lng );
			const point = [ poi.lng, poi.lat ];

			const matched = [];
			console.log( 'allowedLayers:', allowedLayers );

			for ( const layer of allowedLayers ) {
				const found = leafletPip.pointInLayer( point, layer, true );

				if ( found.length > 0 ) {
					// Gebietsnamen aus Layer holen
					const name = layer.areaName || null;
					if ( name ) {
						matched.push( {
							name,
							sortIndex: layer.sortIndex,
						} );
					}
				}
			}

			console.log( 'matched', matched );
			// Sort by index to get always the same order.
			matched.sort( ( a, b ) => b.sortIndex - a.sortIndex );
			results.push( {
				id: poi.ID,
				area: matched.map( ( m ) => m.name.rendered ).join( ', ' ),
			} );
		}

		console.log( 'results: ', results );

		// 3. Ergebnisse per REST speichern
		await apiFetch( {
			path: '/sunflower-map/v1/update-poi-areas',
			method: 'POST',
			data: { results },
		} );

		alert( 'Gebiete erfolgreich neu zugeordnet.' );
	}

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
							<SelectControl
								label={ __(
									'Show marker on map',
									'sunflower-map-points-map'
								) }
								value={ showMarker }
								options={ [
									{
										value: 'backend',
										label: __(
											'Backend',
											'sunflower-map-points-map'
										),
									},
									{
										value: 'noshow',
										label: __(
											'Do not show',
											'sunflower-map-points-map'
										),
									},
									{
										value: 'front-and-backend',
										label: __(
											'Front- & Backend',
											'sunflower-map-points-map'
										),
									},
								] }
								onChange={ onChangeShowMarkerSelect }
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

							<div>
								<h3>Erlaubte Gebiete (GeoJSON)</h3>
								<Button
									variant="primary"
									onClick={ openGeoJsonFrame }
								>
									GeoJSON-Dateien auswählen
								</Button>
								<ul>
									{ allowedAreas.map( ( file, index ) => {
										if ( ! file ) {
											return (
												<li key={ index }>
													Lade Datei…
												</li>
											);
										}

										return (
											<li
												key={ file.id }
												style={ {
													display: 'flex',
													alignItems: 'center',
												} }
											>
												<span>
													{ file.title.rendered }
												</span>

												<Button
													isDestructive
													icon="no-alt"
													onClick={ () => {
														const updated = [
															...attributes.areas,
														];
														updated.splice(
															index,
															1
														);
														setAttributes( {
															areas: updated,
														} );
													} }
												/>
											</li>
										);
									} ) }
								</ul>
								<Button
									variant="secondary"
									onClick={ runReassignment }
								>
									Gebiete neu zuordnen
								</Button>
							</div>
						</PanelBody>
						<PanelBody
							title={ __(
								'Formular-Einstellungen',
								'sunflower-map-points'
							) }
						>
							<p className="components-base-control__help">
								{ __(
									'The following topics will be available in the hint form.',
									'sunflower-map-points-map'
								) }
							</p>
							{ allTopics.map( ( t, index ) => {
								const checked = topics.includes( t.label );
								return (
									<div
										key={ t.label }
										className="sunflower-topic-option"
									>
										<label htmlFor={ `topic-${ index }` }>
											<input
												type="checkbox"
												checked={ checked }
												id={ `topic-${ index }` }
												onChange={ () =>
													toggleTopic( t.label )
												}
											/>
											<span
												style={ {
													marginLeft: '0.5em',
												} }
											>
												<i
													className={ `fa-solid ${ t.icon }` }
													style={ {
														marginRight: '0.3em',
													} }
												></i>
												{ t.label }
											</span>
										</label>
									</div>
								);
							} ) }
						</PanelBody>
					</InspectorControls>
				</>
			}
		</div>
	);
}
