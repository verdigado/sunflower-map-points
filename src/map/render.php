<?php
/**
 * Render the Sunflower latest posts block.
 *
 * @package sunflower-map-points
 */

$sunflower_map_points_mailto = $attributes['mailTo'] ?? '';

if ( isset( $attributes['lat'] ) && ! empty( $attributes['lat'] ) ) {

	printf(
		'<div class="map-container" data-lat="%s" data-lng="%s" data-zoom="%s" data-mail-to="%s">',
		esc_attr( $attributes['lat'] ),
		esc_attr( $attributes['lng'] ),
		esc_attr( $attributes['zoom'] ),
		esc_attr(
			strrev(
				base64_encode( $sunflower_map_points_mailto ) //phpcs:ignore
			)
		)
	);

	printf( '<div id="map" style="height: %spx;"></div>', esc_attr( $attributes['height'] ) );
}
