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
			'public'       => false,
			'has_archive'  => false,
			'show_ui'      => true,
			'show_in_menu' => true,
			'supports'     => array( 'title', 'custom-fields' ),
			'menu_icon'    => 'dashicons-location-alt',
		)
	);
}
add_action( 'init', 'sunflower_map_points_registercustompoi_post_type' );

add_filter(
	'wp_sitemaps_post_types',
	function ( $post_types ) {
		unset( $post_types['custompoi'] );
		return $post_types;
	}
);


add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'sunflower-map/v1',
			'/pois',
			array(
				'methods'             => 'GET',
				'callback'            => 'sunflower_map_get_pois',
				'permission_callback' => '__return_true',
			)
		);
	}
);

/**
 * Get all custom pois in current map bounding box.
 *
 * @param WP_REST_Request $request The REST request object with query params (north, south, east, west).
 *
 * @return WP_REST_Response|array List of POIs as an array or WP_REST_Response.
 */
function sunflower_map_get_pois( WP_REST_Request $request ) {
	$north = floatval( $request['north'] );
	$south = floatval( $request['south'] );
	$east  = floatval( $request['east'] );
	$west  = floatval( $request['west'] );

	global $wpdb;
	$results = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT p.ID, pm1.meta_value AS lat, pm2.meta_value AS lng, pm3.meta_value AS topic, pm4.meta_value AS message
         FROM $wpdb->posts p
         JOIN $wpdb->postmeta pm1 ON p.ID = pm1.post_id AND pm1.meta_key = 'lat'
         JOIN $wpdb->postmeta pm2 ON p.ID = pm2.post_id AND pm2.meta_key = 'lng'
         LEFT JOIN $wpdb->postmeta pm3 ON p.ID = pm3.post_id AND pm3.meta_key = 'topic'
		 JOIN $wpdb->postmeta pm4 ON p.ID = pm4.post_id AND pm4.meta_key = 'message'
         WHERE p.post_type = 'custompoi'
           AND p.post_status = 'publish'
           AND CAST(pm1.meta_value AS DECIMAL(10,6)) BETWEEN %f AND %f
           AND CAST(pm2.meta_value AS DECIMAL(10,6)) BETWEEN %f AND %f",
			$south,
			$north,
			$west,
			$east
		),
		ARRAY_A
	);

	return rest_ensure_response( $results );
}

/**
 * Get the default topics as JSON string.
 *
 * @return string JSON string of default topics.
 */
function sunflower_map_points_get_default_topics_json() {

	$default_topics_json = '[
		{"icon":"fa-circle-question","label":"Sonstiges"},
		{"icon":"fa-bicycle","label":"Fahrradständer"},
		{"icon":"fa-tree","label":"Baum"},
		{"icon":"fa-chair","label":"Bank"},
		{"icon":"fa-trash","label":"Abfalleimer"},
		{"icon":"fa-faucet","label":"Trinkbrunnen"}
	]';
	return $default_topics_json;
}
