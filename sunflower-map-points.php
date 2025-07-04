<?php
/**
 * Main file of the sunflower map points plugin.
 *
 * @package Sunflower Map Points
 * @version 1.2.2
 *
 * @wordpress-plugin
 * Plugin Name: Sunflower Map Points
 * Description: Simple plugin allowing map points and suggestions.
 * Version: 1.2.2
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

if ( ! defined( 'SUNFLOWER_MAP_POINTS_VERSION' ) ) {
	$sunflower_map_points_plugin_data    = get_plugin_data( __FILE__, false, false );
	$sunflower_map_points_plugin_version = $sunflower_map_points_plugin_data['Version'];
	define( 'SUNFLOWER_MAP_POINTS_VERSION', $sunflower_map_points_plugin_version );
}

require_once 'inc/custom-pois.php';


/**
 * Enqueue leaflet library from Sunflower theme.
 */
function sunflower_map_points_enqueue_styles() {
	global $post;

	if ( isset( $post ) && has_block( 'sunflower-map-points/map', $post ) ) {
		wp_enqueue_script(
			'sunflower-leaflet',
			get_template_directory_uri() . '/assets/vndr/leaflet/dist/leaflet.js',
			array(),
			SUNFLOWER_MAP_POINTS_VERSION,
			true
		);

		wp_enqueue_style(
			'sunflower-leaflet',
			get_template_directory_uri() . '/assets/vndr/leaflet/dist/leaflet.css',
			array(),
			SUNFLOWER_MAP_POINTS_VERSION
		);

		wp_localize_script(
			'sunflower-map-points-map-script',
			'sunflowerMapPoints',
			array(
				'ajaxurl'     => admin_url( 'admin-ajax.php' ),
				'_nonce'      => wp_nonce_field( 'sunflower_map_points_feedback', '_wpnonce' ),
				'maps_marker' => plugin_dir_url( __FILE__ ) . '/assets/img/marker.png',
				'texts'       => array(
					'readmore' => __( 'Continue reading', 'sunflower' ),
				),
			)
		);
	}
}
add_action( 'wp_enqueue_scripts', 'sunflower_map_points_enqueue_styles' );
add_action( 'admin_enqueue_scripts', 'sunflower_map_points_enqueue_styles' );

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
	$email   = sanitize_text_field( $_POST['email'] ?? '' );
	$phone   = sanitize_text_field( $_POST['phone'] ?? '' );
	$topic   = sanitize_text_field( $_POST['topic'] ?? '' );

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
	$subject = "Neue Kartenhinweis von \"$name\"";
	$link    = "https://www.openstreetmap.org/?mlat=$lat&mlon=$lng#map=17/$lat/$lng";
	$body    = "Name: $name\nHinweis: $message\nPosition: $lat, $lng\nKarte: $link\nE-Mail: $email\nTelefon: $phone\nThema: $topic";
	$headers = array( 'Content-Type: text/plain; charset=UTF-8' );

	wp_mail( $to, $subject, $body, $headers );

	if ( $post_id && ! is_wp_error( $post_id ) ) {
		// Save submitted metadata.
		update_post_meta( $post_id, 'message', $message );
		update_post_meta( $post_id, 'lat', $lat );
		update_post_meta( $post_id, 'lng', $lng );
		update_post_meta( $post_id, 'link', $link );
		update_post_meta( $post_id, 'email', $email );
		update_post_meta( $post_id, 'phone', $phone );
		update_post_meta( $post_id, 'topic', $topic );

		wp_send_json(
			array(
				'success'      => true,
				'messageafter' => 'DANKE für Deinen Hinweis! 💚 Wir prüfen Deinen Vorschlag und setzen uns demnächst mit Dir in Verbindung und schauen dann gemeinsam, was wir machen können.',
			)
		);
	} else {
		wp_send_json(
			array(
				'success'      => false,
				'messageafter' => 'Fehler beim Speichern.',
			)
		);
	}
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function sunflower_map_points_blocks_init() {

	register_block_type( __DIR__ . '/build/map' );
}

add_action( 'init', 'sunflower_map_points_blocks_init' );
