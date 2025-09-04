<?php
/**
 * Update code to check for updates from Update URI.
 *
 * @package sunflower-map-points
 */

/**
 * Send update request to update server specified in $plugin_data['UpdateURI'].
 *
 * @param Array  $update The plugin update data with the latest details. Default false.
 * @param Array  $plugin_data Theme data array.
 * @param string $plugin_file The plugin slug - 'sunflower-persons' our case.
 */
function sunflower_map_points_update_plugin( $update, $plugin_data, $plugin_file ) {
	// Include an unmodified $wp_version.
	require ABSPATH . WPINC . '/version.php';
	$php_version = PHP_VERSION;

	$request = array(
		'version' => $plugin_data['Version'],
		'php'     => $php_version,
		'url'     => get_bloginfo( 'url' ),
	);

	// Start checking for an update.
	$send_for_check = array(
		'body' => array(
			'request' => serialize( $request ), // phpcs:ignore
		),
	);
	$raw_response   = wp_remote_post( $plugin_data['UpdateURI'], $send_for_check );

	$data = false;
	if ( ! is_wp_error( $raw_response ) && ( 200 === $raw_response['response']['code'] ) ) {
		$data = json_decode( wp_remote_retrieve_body( $raw_response ) );
	} else {
		return $update;
	}

	if ( ! $data || version_compare( $plugin_data['Version'], $data->new_version, '>=' ) ) {
		return $update;
	}

	// Update object in the right WordPress format.
	$update = (object) array(
		'slug'    => $data->slug,
		'plugin'  => $plugin_file,
		'version' => $data->new_version,
		'url'     => $plugin_data['PluginURI'],
		'package' => $data->package,
	);

	return $update;
}

add_filter( 'update_plugins_sunflower-theme.de', 'sunflower_map_points_update_plugin', 10, 3 );
