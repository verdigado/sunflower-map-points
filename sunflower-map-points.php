<?php
/**
 * Main file of the sunflower map points plugin.
 *
 * @package Sunflower Map Points
 * @version 1.1.0
 *
 * @wordpress-plugin
 * Plugin Name: Sunflower Map Points
 * Description: Simple plugin allowing map points and suggestions.
 * Version: 1.1.0
 * Author: Alexander Bigga
 * License: GPL v2 oder später
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: sunflower-map-point
 * Domain Path: /languages
 * Requires at least: 6.8
 * Requires PHP: 8.2
 * Requires Plugins:
 * Requires Themes: sunflower
 *
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once 'inc/custom-pois.php';

/**
 * Enqueue leaflet library from Sunflower theme.
 */
function sunflower_map_points_enqueue_styles() {
	global $post;

	if ( isset( $post ) && has_shortcode( $post->post_content, 'leaflet_form_map' ) ) {
		wp_enqueue_script(
			'sunflower-leaflet',
			get_template_directory_uri() . '/assets/vndr/leaflet/dist/leaflet.js',
			array(),
			'1.1.0',
			true
		);

		wp_enqueue_style(
			'sunflower-leaflet',
			get_template_directory_uri() . '/assets/vndr/leaflet/dist/leaflet.css',
			array(),
			'1.1.0'
		);

		wp_enqueue_style(
			'sunflower-map-points-style',
			plugin_dir_url( __FILE__ ) . 'assets/css/sunflower-map-points.css',
			array(),
			'1.1.0'
		);
	}
}
add_action( 'wp_enqueue_scripts', 'sunflower_map_points_enqueue_styles' );

/**
 * Print leaflet map and form for hints.
 */
function sunflower_map_points_leaflet_form_shortcode() {
	ob_start(); ?>
	<div id="map-container" style="position: relative;">
		<div id="map" style="height: 600px;"></div>
	</div>

	<?php
	return ob_get_clean();
}
add_shortcode( 'leaflet_form_map', 'sunflower_map_points_leaflet_form_shortcode' );

add_action( 'wp_ajax_send_leaflet_form', 'sunflower_map_points_handle_leaflet_form' );
add_action( 'wp_ajax_nopriv_send_leaflet_form', 'sunflower_map_points_handle_leaflet_form' );

/**
 * Save the form data to custom post type.
 */
function sunflower_map_points_handle_leaflet_form() {
	// Do not send, if nonce is invalid.
	if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( $_POST['_wpnonce'], 'sunflower_map_points_feedback' ) ) {
		return;
	}

	$name    = sanitize_text_field( $_POST['name'] ?? '' );
	$message = sanitize_textarea_field( $_POST['message'] ?? '' );
	$lat     = sanitize_text_field( $_POST['lat'] ?? '' );
	$lng     = sanitize_text_field( $_POST['lng'] ?? '' );

	// Create custom post 'custompoi'.
	$post_id = wp_insert_post(
		array(
			'post_type'   => 'custompoi',
			'post_title'  => wp_strip_all_tags( $name ),
			'post_status' => 'publish',
		)
	);

	// Send E-Mail to admin.
	$to      = get_option( 'admin_email' );
	$subject = "Neue Kartenhinweis von $name";
	$link    = "https://www.openstreetmap.org/?mlat=$lat&mlon=$lng#map=17/$lat/$lng";
	$body    = "Name: $name\nNachricht: $message\nPosition: $lat, $lng\nKarte: $link";
	$headers = array( 'Content-Type: text/plain; charset=UTF-8' );

	wp_mail( $to, $subject, $body, $headers );

	if ( $post_id && ! is_wp_error( $post_id ) ) {
		// Save submitted metadata.
		update_post_meta( $post_id, 'message', $message );
		update_post_meta( $post_id, 'lat', $lat );
		update_post_meta( $post_id, 'lng', $lng );
		update_post_meta( $post_id, 'link', $link );

		wp_send_json(
			array(
				'success' => true,
				'messageafter' => 'Danke! Deine Hinweis wurde gespeichert.',
			)
		);
	} else {
		wp_send_json(
			array(
				'success' => false,
				'messageafter' => 'Fehler beim Speichern.',
			)
		);
	}
}

/**
 * Enqueue scripts and styles.
 */
function sunflower_map_points_scripts() {

	wp_enqueue_script(
		'frontend',
		plugin_dir_url( __FILE__ ) . '/assets/js/frontend.js',
		array(),
		'1.1.0',
		true
	);

	wp_localize_script(
		'frontend',
		'sunflower_map_points',
		array(
			'ajaxurl'     => admin_url( 'admin-ajax.php' ),
			'_nonce' 		=> wp_nonce_field( 'sunflower_map_points_feedback', '_wpnonce' ),
			'maps_marker' => plugin_dir_url( __FILE__ ) . '/assets/img/marker.png',
			'texts'       => array(
				'readmore' => __( 'Continue reading', 'sunflower' ),
			),
		)
	);
}
add_action( 'wp_enqueue_scripts', 'sunflower_map_points_scripts' );
