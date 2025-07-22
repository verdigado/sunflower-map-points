<?php
/**
 * Server-side rendering for the Counter block
 *
 * @package sunflower-map-points
 */

	$sunflower_map_points_date = isset( $attributes['dateFrom'] ) ? sanitize_text_field( $attributes['dateFrom'] ) : '';

	$sunflower_map_points_args = array(
		'post_type'      => 'custompoi',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'date_query'     => array(),
		'fields'         => 'ids',
	);

	if ( $sunflower_map_points_date ) {
		$sunflower_map_points_args['date_query'][] = array(
			'after'     => $sunflower_map_points_date,
			'inclusive' => true,
		);
	}

	$sunflower_map_points_count = count( get_posts( $sunflower_map_points_args ) );

	$sunflower_map_points_text_template = $attributes['text'] ?? '%%COUNT%% since %%DATE%%.';
	$sunflower_map_points_display_date  = $sunflower_map_points_date ? date_i18n( get_option( 'date_format' ), strtotime( $sunflower_map_points_date ) ) : '';

	$output = str_replace(
		array( '%%COUNT%%', '%%DATE%%' ),
		array( $sunflower_map_points_count, $sunflower_map_points_display_date ),
		$sunflower_map_points_text_template
	);

	echo '<div class="sunflower-map-counter">' . esc_html( $output ) . '</div>';
