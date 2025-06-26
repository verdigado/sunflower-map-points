<?php
/**
 * Add custom post type.
 *
 * @package sunflower-map-points
 */

/**
 * Register custom post type for map hints.
 */
function sunflower_map_points_registercustompoi_post_type() {
	register_post_type(
		'custompoi',
		array(
			'labels'       => array(
				'name'          => 'Kartenmeldungen',
				'singular_name' => 'Kartenmeldung',
			),
			'public'       => true,
			'has_archive'  => false,
			'show_in_menu' => true,
			'supports'     => array( 'title', 'custom-fields' ),
			'menu_icon'    => 'dashicons-location-alt',
		)
	);
}
add_action( 'init', 'sunflower_map_points_registercustompoi_post_type' );
