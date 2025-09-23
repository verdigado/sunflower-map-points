<?php
/**
 * Render the Sunflower latest posts block.
 *
 * @package sunflower-map-points
 */

$sunflower_map_points_mailto = $attributes['mailTo'] ?? '';

if ( isset( $attributes['lat'] ) && ! empty( $attributes['lat'] ) ) {

	printf(
		'<div class="map-container" data-lat="%s" data-lng="%s" data-zoom="%s" data-show-marker="%s">',
		esc_attr( $attributes['lat'] ),
		esc_attr( $attributes['lng'] ),
		esc_attr( $attributes['zoom'] ),
		esc_attr( $attributes['showMarker'] )
	);

	printf( '<div id="map" style="height: %spx;"></div></div>', esc_attr( $attributes['height'] ) );
}
?>
<div class="modal fade" id="leafletModal" tabindex="-1" style="display: none;" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Hinweis geben</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
			</div>
			<div class="modal-body">

				<div class="position-relative mb-3">
					<div id="mini-map" style="height: 150px; width: 100%; border-radius: 0.5rem;"></div>
				</div>

				<form id="leaflet-form">
					<?php wp_nonce_field( 'sunflower_map_points_feedback', '_wpnonce' ); ?>
					<input type="hidden" name="action" value="send_leaflet_form">
					<input type="hidden" id="form-lat" name="lat">
					<input type="hidden" id="form-lng" name="lng">
					<input type="hidden" name="mailTo" value="
					<?php
					echo esc_attr(
						strrev(
				base64_encode( $sunflower_map_points_mailto ) //phpcs:ignore
						)
					)
					?>
		">

					<div class="mb-3">
						<label for="name" class="form-label">Name (*)</label>
						<input type="text" name="name" id="name" class="form-control" required>
					</div>

					<div class="mb-3">
						<label for="email" class="form-label">Email (*)</label>
						<input type="email" name="email" id="email" class="form-control" required>
					</div>

					<div class="mb-3">
						<label for="phone" class="form-label">Telefon</label>
						<input type="tel" name="phone" id="phone" class="form-control">
					</div>

					<div class="mb-3">
						<label for="topic" class="form-label">Thema (*)</label>
						<select id="topic" name="topic" class="form-select">
							<?php foreach ( $attributes['topics'] as $sunflower_map_points_topics ) : ?>
								<option value="<?php echo esc_attr( trim( $sunflower_map_points_topics ) ); ?>">
									<i className="fa-solid fa-bicycle"></i> <?php echo esc_html( trim( $sunflower_map_points_topics ) ); ?>
								</option>
							<?php endforeach; ?>
						</select>
					</div>

					<div class="mb-3">
						<label for="message" class="form-label">Hinweis (*)</label>
						<textarea name="message" id="message" class="form-control" rows="10" required></textarea>
					</div>

					<button type="submit" class="btn btn-primary w-100">Senden</button>
				</form>
				<div id="form-message" class="alert d-none mt-3" role="alert"></div>
			</div>
		</div>
	</div>
</div>
