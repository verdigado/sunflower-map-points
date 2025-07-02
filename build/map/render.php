<?php
/**
 * Render the Sunflower latest posts block.
 *
 * @package sunflower-map-points
 */

if ( isset( $attributes['lat'] ) && ! empty( $attributes['lat'] ) ) {

	printf( '<div class="map-container" data-lat="%s" data-lng="%s" data-zoom="%s">', esc_attr( $attributes['lat'] ), esc_attr( $attributes['lng'] ), esc_attr( $attributes['zoom'] ) );

	printf( '<div id="map" style="height: %spx;"></div>', esc_attr( $attributes['height'] ) );
}
