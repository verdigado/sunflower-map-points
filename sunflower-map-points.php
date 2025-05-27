<?php

/**
 * @package Sunflower Map Points
 * @version 1.0.0
 *
 * @wordpress-plugin
 * Plugin Name: Sunflower Map Points
 * Description: Simple plugin allowing map points and suggestions.
 * Version: 1.0.0
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

if (!defined('ABSPATH')) {
    exit;
}

function load_leaflet_assets() {
    wp_enqueue_style('leaflet-css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    wp_enqueue_script('leaflet-js', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], null, true);
}
add_action('wp_enqueue_scripts', 'load_leaflet_assets');

function leaflet_form_shortcode() {
    ob_start(); ?>
    <div id="map" style="height: 400px;"></div>

    <form id="leaflet-form" style="display: none; margin-top: 1em;">
        <input type="text" name="name" placeholder="Dein Name" required><br>
        <textarea name="message" placeholder="Deine Nachricht" required></textarea><br>
        <input type="hidden" name="lat">
        <input type="hidden" name="lng">
        <input type="hidden" name="action" value="send_leaflet_form">
        <button type="submit">Absenden</button>
    </form>

    <script>
    document.addEventListener("DOMContentLoaded", function () {
        var map = L.map('map').setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var marker;

        map.on('click', function(e) {
            if (marker) {
                marker.setLatLng(e.latlng);
            } else {
                marker = L.marker(e.latlng).addTo(map);
            }
            document.getElementById('leaflet-form').style.display = 'block';
            document.querySelector('input[name="lat"]').value = e.latlng.lat;
            document.querySelector('input[name="lng"]').value = e.latlng.lng;
        });

        document.getElementById('leaflet-form').addEventListener('submit', function (e) {
            e.preventDefault();
            const form = this;
            const formData = new FormData(form);

            fetch('<?php echo admin_url("admin-ajax.php"); ?>', {
                method: 'POST',
                body: formData
            }).then(response => response.json())
              .then(data => {
                  alert(data.message);
                  form.reset();
                  form.style.display = 'none';
                  if (marker) {
                      map.removeLayer(marker);
                      marker = null;
                  }
              }).catch(error => {
                  alert('Fehler beim Absenden!');
                  console.error(error);
              });
        });
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('leaflet_form_map', 'leaflet_form_shortcode');

add_action('wp_ajax_send_leaflet_form', 'handle_leaflet_form');
add_action('wp_ajax_nopriv_send_leaflet_form', 'handle_leaflet_form');

function handle_leaflet_form() {
    $name = sanitize_text_field($_POST['name'] ?? '');
    $message = sanitize_textarea_field($_POST['message'] ?? '');
    $lat = sanitize_text_field($_POST['lat'] ?? '');
    $lng = sanitize_text_field($_POST['lng'] ?? '');

    // Beispiel: E-Mail senden
    $to = get_option('admin_email');
    $subject = "Neue Karteinsendung von $name";
    $body = "Name: $name\nNachricht: $message\nPosition: $lat, $lng";
    $headers = ['Content-Type: text/plain; charset=UTF-8'];

    wp_mail($to, $subject, $body, $headers);

    wp_send_json([
        'success' => true,
        'message' => 'Danke! Deine Nachricht wurde gesendet.'
    ]);
}
