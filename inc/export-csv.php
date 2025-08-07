<?php
/**
 * Add export menu
 *
 * @package sunflower-map-points
 */

add_action(
	'admin_menu',
	function () {
		add_submenu_page(
			'edit.php?post_type=custompoi',
			__( 'Export POIs', 'sunflower-map-points' ),
			__( 'Export POIs', 'sunflower-map-points' ),
			'export',
			'export-pois-csv',
			'sunflower_map_points_export_pois_csv_page'
		);
	}
);

/**
 * Page for export function
 */
function sunflower_map_points_export_pois_csv_page() {

	$export_url = admin_url( 'admin-post.php?action=export_custompois_csv' );

	echo '<div class="wrap">';
	echo '<h1>' . esc_html__( 'Export POIs as CSV', 'sunflower-map-points' ) . '</h1>';
	echo '<a href="' . esc_url( $export_url ) . '" class="button button-primary">' . esc_html__( 'Export', 'sunflower-map-points' ) . '</a>';
	echo '</div>';
}

/**
 * Export function
 */
function sunflower_map_points_export_pois_as_csv() {

	$filename = 'pois_export_' . gmdate( 'Y-m-d' ) . '.csv';

	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename=' . $filename );

	$output = fopen( 'php://output', 'w' );
	fputcsv( $output, array( 'ID', esc_html__( 'Date', 'sunflower-map-points' ), 'Lat', 'Lng', 'Link', 'Typ', 'Name', esc_html__( 'Phone', 'sunflower-map-points' ), 'Email', __( 'Note', 'sunflower-map-points' ) ) );

	$args = array(
		'post_type'      => 'custompoi',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
	);

	$posts = get_posts( $args );

	foreach ( $posts as $post ) {
		setup_postdata( $post );

		$lat  = get_post_meta( $post->ID, 'lat', true );
		$lng  = get_post_meta( $post->ID, 'lng', true );
		$link = "https://www.openstreetmap.org/?mlat=$lat&mlon=$lng#map=17/$lat/$lng";

		fputcsv(
			$output,
			array(
				$post->ID,
				get_the_date( 'Y-m-d', $post ),
				$lat,
				$lng,
				$link,
				get_post_meta( $post->ID, 'topic', true ),
				$post->post_title,
				get_post_meta( $post->ID, 'phone', true ),
				get_post_meta( $post->ID, 'email', true ),
				get_post_meta( $post->ID, 'message', true ),
			)
		);
	}

	wp_reset_postdata();
	fclose( $output ); // phpcs:ignore
	exit;
}
