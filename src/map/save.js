export function save( { attributes } ) {
	const { lat, lng, zoom } = attributes;

	return (
		<div
			className="wp-block-sunflower-map"
			data-lat={ lat }
			data-lng={ lng }
			data-zoom={ zoom }
		>
			<div id="map" style={ { height: '300px' } }></div>
		</div>
	);
}
