<?php
/**
 * Server-side rendering for the Counter block
 */

	$date        = isset( $attributes['dateFrom'] ) ? sanitize_text_field( $attributes['dateFrom'] ) : '';
	$labelBefore = esc_html( $attributes['labelBefore'] ?? '' );
	$labelAfter  = esc_html( $attributes['labelAfter'] ?? '' );
	$showDate    = $attributes['showDate'] ?? false;

	$args = array(
		'post_type'      => 'custompoi',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'date_query'     => array(),
		'fields'         => 'ids', // nur IDs für Performance
	);

	if ( $date ) {
		$args['date_query'][] = array(
			'after'     => $date,
			'inclusive' => true,
		);
	}

	$posts = get_posts( $args );
	$count = count( $posts );

	$text_template = $attributes['text'] ?? '%%COUNT%% since %%DATE%%.';
	$display_date  = $date ? date_i18n( get_option( 'date_format' ), strtotime( $date ) ) : '';

	$output = str_replace(
		array( '%%COUNT%%', '%%DATE%%' ),
		array( $count, $display_date ),
		$text_template
	);

	echo '<div class="sunflower-map-counter">' . esc_html( $output ) . '</div>';
