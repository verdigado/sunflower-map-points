<?php
/**
 * Main file of the sunflower map points plugin.
 *
 * @package Sunflower Map Points
 *
 * @wordpress-plugin
 * Plugin Name: Sunflower Map Points
 * Description: Simple plugin allowing map points and suggestions.
 * Version: 1.6.0
 * Author: verdigado eG, Alexander Bigga
 * Author URI: https://github.com/verdigado/sunflower-map-points
 * License: GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0.txt
 * Text Domain: sunflower-map-point
 * Domain Path: /languages
 * Requires at least: 6.8
 * Requires PHP: 8.2
 * Requires Plugins:
 * Plugin URI:  https://github.com/verdigado/sunflower-map-points
 * Update URI: https://sunflower-theme.de/updateserver/sunflower-map-points/
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
require_once 'inc/export-csv.php';
require_once 'inc/update.php';
require_once 'inc/class-sunflowermappointssettingspage.php';

/**
 * Enqueue map block map-frontend.js.
 */
function sunflower_map_points_enqueue_styles() {
	global $post;

	if ( isset( $post ) && ( has_block( 'sunflower-map-points/map', $post ) || is_admin() ) ) {

		wp_localize_script(
			'sunflower-map-points-map-script',
			'sunflowerMapPoints',
			array(
				'ajaxurl'     => admin_url( 'admin-ajax.php' ),
				'maps_marker' => plugin_dir_url( __FILE__ ) . 'assets/img/marker.png',
			)
		);

		$options        = get_option( 'sunflower_map_points_topics_options' );
		$default_topics = '[{"label":"Sonstiges","icon":"fa-circle-question"}]';
		$topics_json    = ( isset( $options['sunflower_map_points_topics_items'] ) && ! empty( $options['sunflower_map_points_topics_items'] ) ) ? $options['sunflower_map_points_topics_items'] : $default_topics;
		$topics         = json_decode( $topics_json, true );

		wp_localize_script(
			'sunflower-map-points-map-script',
			'sunflowerMapPointsTopics',
			$topics
		);

	}
}
add_action( 'wp_enqueue_scripts', 'sunflower_map_points_enqueue_styles' );

// Enqueue in block editor as well.
add_action( 'enqueue_block_editor_assets', 'sunflower_map_points_enqueue_styles' );

add_action( 'wp_ajax_send_leaflet_form', 'sunflower_map_points_handle_leaflet_form' );
add_action( 'wp_ajax_nopriv_send_leaflet_form', 'sunflower_map_points_handle_leaflet_form' );

/**
 * Save the form data to custom post type.
 */
function sunflower_map_points_handle_leaflet_form() {
	// Do not send, if nonce is invalid.
	check_ajax_referer( 'sunflower_map_points_feedback' );

	$name    = sanitize_text_field( $_POST['name'] ?? '' );
	$message = sanitize_textarea_field( $_POST['message'] ?? '' );
	$lat     = sanitize_text_field( $_POST['lat'] ?? '' );
	$lng     = sanitize_text_field( $_POST['lng'] ?? '' );
	$email   = sanitize_text_field( $_POST['email'] ?? '' );
	$phone   = sanitize_text_field( $_POST['phone'] ?? '' );
	$topic   = sanitize_text_field( $_POST['topic'] ?? '' );

	// Set lock to avoid duplicates.
	$user_ip = $_SERVER['REMOTE_ADDR'];
	$key     = 'form_lock_' . md5( implode( $_POST ) . $user_ip );

	if ( get_transient( $key ) ) {
		wp_send_json(
			array(
				'success'      => false,
				'messageafter' => 'Fehler beim Speichern.',
			)
		);
		return;
	}

	set_transient( $key, true, 10 );

	$mail_to = sanitize_text_field( $_POST['mailTo'] );
	if ( $mail_to ) {
		$to = sanitize_email( base64_decode( strrev( (string) $mail_to ) ) ); // phpcs:ignore
	}

	// Create custom post 'custompoi'.
	$post_id = wp_insert_post(
		array(
			'post_type'   => 'custompoi',
			'post_title'  => wp_strip_all_tags( $name ),
			'post_status' => 'publish',
		)
	);

	// Send E-Mail to admin.
	if ( empty( $to ) ) {
		$to = get_option( 'admin_email' );
	}

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

add_action( 'init', 'sunflower_map_points_blocks_init' );

/**
 * Register map block and all required assets.
 */
function sunflower_map_points_blocks_init() {
	// Register leaflet library.
	wp_register_script(
		'sunflower-leaflet',
		plugin_dir_url( __FILE__ ) . 'assets/vndr/leaflet/dist/leaflet.js',
		array(),
		SUNFLOWER_MAP_POINTS_VERSION,
		true
	);

	// Register leaflet library.
	wp_register_script(
		'sunflower-leaflet-markercluster',
		plugin_dir_url( __FILE__ ) . 'assets/vndr/leaflet.markercluster/dist/leaflet.markercluster.js',
		array(),
		SUNFLOWER_MAP_POINTS_VERSION,
		true
	);

	// Register leaflet styles.
	wp_register_style(
		'sunflower-leaflet',
		plugin_dir_url( __FILE__ ) . 'assets/vndr/leaflet/dist/leaflet.css',
		array(),
		SUNFLOWER_MAP_POINTS_VERSION
	);

	// Register leaflet styles.
	wp_register_style(
		'sunflower-leaflet-markercluster',
		plugin_dir_url( __FILE__ ) . 'assets/vndr/leaflet.markercluster/dist/MarkerCluster.Default.css',
		array(),
		SUNFLOWER_MAP_POINTS_VERSION
	);

	// Register map block.
	register_block_type( __DIR__ . '/build/map' );

	// Load translation file.
	wp_set_script_translations(
		'sunflower-map-points-map-editor-script',
		'sunflower-map-points-map',
		plugin_dir_path( __FILE__ ) . 'languages'
	);

	// Register counter block.
	register_block_type( __DIR__ . '/build/counter' );

	// Load translation file.
	wp_set_script_translations(
		'sunflower-map-points-counter-editor-script',
		'sunflower-map-points-counter',
		plugin_dir_path( __FILE__ ) . 'languages'
	);
}

/**
 * Add the block language files.
 */
function sunflower_map_points_blocks_load_textdomain() {
	load_plugin_textdomain( 'sunflower-map-points', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	load_plugin_textdomain( 'sunflower-map-points-map', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}

add_action( 'after_setup_theme', 'sunflower_map_points_blocks_load_textdomain' );

// Load FontAwesome only in backend.
add_action(
	'admin_enqueue_scripts',
	function () {
		wp_register_style(
			'fontawesome6',
			plugin_dir_url( __FILE__ ) . 'assets/css/admin-fontawesome.css',
			array(),
			SUNFLOWER_MAP_POINTS_VERSION
		);
	}
);
