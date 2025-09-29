<?php
/**
 * Class for the Sunflower Map points settings page.
 *
 * @package Sunflower Map Points
 */

/**
 * The class itself.
 */
class SunflowerMapPointsSettingsPage {

	/**
	 * Holds the values to be used in the fields callbacks
	 *
	 * @var $options
	 */
	private $options;

	/**
	 * Start up
	 */
	public function __construct() {
		add_action( 'admin_menu', $this->sunflower_map_points_add_plugin_page( ... ) );
		add_action( 'admin_init', $this->sunflower_map_points_event_page_init( ... ) );
	}

	/**
	 * Add options page
	 */
	public function sunflower_map_points_add_plugin_page(): void {
		$this->options = get_option( 'sunflower_map_points_topics_options' );
		add_submenu_page(
			'edit.php?post_type=custompoi',
			__( 'Sunflower Map Points Settings', 'sunflower-map-points' ),
			__( 'Settings', 'sunflower-map-points' ),
			'manage_options',
			'sunflower-map-points-settings',
			$this->sunflower_map_points_settings_page( ... )
		);
	}

	/**
	 * Print the Section text
	 */
	public function print_section_info() {
	}

	/**
	 * Register and add event settings
	 */
	public function sunflower_map_points_event_page_init(): void {
		register_setting(
			'sunflower_map_points_topics_option_group',
			'sunflower_map_points_topics_options',
			$this->sanitize( ... )
		);

		add_settings_section(
			'sunflower_map_points_topics',
			__( 'Available topics in all forms', 'sunflower-map-points' ),
			$this->print_section_info( ... ),
			'sunflower-setting-events'
		);

		add_settings_field(
			'sunflower_map_points_topics_items',
			__( 'Topics', 'sunflower-map-points' ),
			$this->sunflower_map_points_settings_page( ... ),
			'sunflower-setting-social-media-options',
			'sunflower_map_points_topics'
		);
	}

	/**
	 * Sanitize each setting field as needed
	 *
	 * @param array $input Contains all settings fields as array keys.
	 */
	public function sanitize( $input ) {
		$new_input = array();

		// Sanitize everything element of the input array.
		foreach ( $input as $key => $value ) {
			if ( isset( $input[ $key ] ) && empty( $new_input[ $key ] ?? false ) ) {

				if ( 'sunflower_map_points_topics_items' === $key ) {
					$lines  = array_filter( array_map( 'trim', explode( "\n", $input['sunflower_map_points_topics_items'] ) ) );
					$topics = array();

					foreach ( $lines as $line ) {
						$parts = array_map( 'trim', explode( ';', $line ) );
						if ( ! empty( $parts[0] ) && ! empty( $parts[1] ) ) {
							$topics[] = array(
								'icon'  => $parts[0] ?? '',
								'label' => $parts[1] ?? '',
							);
						}
					}

					$new_input['sunflower_map_points_topics_items'] = wp_json_encode( $topics, JSON_UNESCAPED_UNICODE );
				} else {
					$new_input[ $key ] = sanitize_text_field( $value );
				}
			}
		}

		return $new_input;
	}

	/**
	 * Get the settings option array and print one of its values
	 */
	public function sunflower_map_points_settings_page(): void {

		$default_topics_json = sunflower_map_points_get_default_topics_json();

		$topics = ( isset( $this->options['sunflower_map_points_topics_items'] ) && ! empty( $this->options['sunflower_map_points_topics_items'] ) ) ? json_decode( $this->options['sunflower_map_points_topics_items'], true ) : '';

		// Convert json to csv.
		$lines = array();
		if ( ! is_array( $topics ) || empty( $topics ) ) {
			$topics = json_decode( $default_topics_json, true );
		}
		foreach ( $topics as $t ) {
			$lines[] = $t['icon'] . ';' . $t['label'];
		}
		$topics_textarea = implode( "\n", $lines );

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Sunflower Map Points Settings', 'sunflower-map-points' ); ?></h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( 'sunflower_map_points_topics_option_group' );
				?>
				<p>
					<?php esc_html_e( 'Definiere hier die verfügbaren Themen und Icons (FontAwesome-Klassen).', 'sunflower-map-points' ); ?>
				</p>
				<?php
				printf(
					'<textarea style="white-space: pre-wrap;width: 90%%;height:18em;font-family: monospace;" rows="7" id="sunflower_map_points_topics_items" name="sunflower_map_points_topics_options[sunflower_map_points_topics_items]">%s</textarea>',
					esc_textarea( $topics_textarea )
				);
				submit_button();
				?>
			</form>
			<p>
				<strong><?php esc_html_e( 'Beispiel-Eintrag:', 'sunflower-map-points' ); ?></strong><br>
				<code>fa-bicycle;Fahrradständer</code>
			</p>
		</div>
		<?php
	}
}
if ( is_admin() ) {
	$sunflower_map_points_settings_page = new SunflowerMapPointsSettingsPage();
}
