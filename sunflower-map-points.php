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
 * @since 1.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once 'inc/custom-pois.php';

function sunflower_map_points_enqueue_styles() {
    global $post;

    if (isset($post) && has_shortcode($post->post_content, 'leaflet_form_map')) {
        wp_enqueue_script(
            'sunflower-leaflet',
            get_template_directory_uri() . '/assets/vndr/leaflet/dist/leaflet.js',
            null,
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
            plugin_dir_url(__FILE__) . 'assets/css/sunflower-map-points.css'
        );
    }
}
add_action('wp_enqueue_scripts', 'sunflower_map_points_enqueue_styles');


function leaflet_form_shortcode() {
    ob_start(); ?>
    <div id="map-container" style="position: relative;">
        <div id="map" style="height: 600px;"></div>
    </div>
    <form id="leaflet-form" style="display: none; margin-top: 1em;">
        <input type="text" name="name" maxlength="50" placeholder="Dein Name" required><br>
        <textarea name="message" cols="80" rows="10" placeholder="Dein Hinweis" required></textarea><br>
        <input type="hidden" name="lat">
        <input type="hidden" name="lng">
        <input type="hidden" name="action" value="send_leaflet_form">
        <button type="submit">Absenden</button>
    </form>

    <div id="form-message" class="alert d-none" role="alert"></div>

    <script>
    document.addEventListener("DOMContentLoaded", function () {
        // Custom "Locate Me" Control
        L.Control.LocateControl = L.Control.extend({
            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

                container.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
                container.style.backgroundColor = 'white';
                container.style.width = '34px';
                container.style.height = '34px';
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.cursor = 'pointer';

                container.onclick = function () {
                    map.locate({ setView: true, maxZoom: 15 });
                };

                // Mausinteraktion auf der Karte nicht blockieren
                L.DomEvent.disableClickPropagation(container);

                return container;
            },

            onRemove: function (map) {
                // nichts nötig
            }
        });

        var map = L.map('map',
                {scrollWheelZoom: true, dragging: true, fullscreen: true}).setView([51.25426,7.14987], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href=\"http:\/\/www.openstreetmap.org\/copyright\">OpenStreetMap contributors<\/a>'
        }).addTo(map);

        map.addControl(new L.Control.LocateControl({ position: 'topright' }));

        map.on('locationfound', function (e) {
            const marker = L.marker(e.latlng).addTo(map)
                .bindPopup("Du bist hier!").openPopup();

            L.circle(e.latlng, {
                radius: e.accuracy,
                color: '#136aec',
                fillColor: '#136aec',
                fillOpacity: 0.2
            }).addTo(map);

            // Remove marker of current location after 2 seconds
            setTimeout(() => {
                map.removeLayer(marker);
            }, 2000);
        });

        map.on('locationerror', function (e) {
            alert("Standort konnte nicht gefunden werden: " + e.message);
        });

        var marker;

        map.on('click', function (e) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);

            // Entferne vorherigen Marker (optional)
            if (marker) {
                map.removeLayer(marker);
            }

            // Neuer Marker
            marker = L.marker([lat, lng]).addTo(map);

            // Formular-HTML als Popup-Inhalt
            const formHtml = `
                <form id="leaflet-form">
                <input type="hidden" name="action" value="send_leaflet_form">
                <input type="hidden" name="lat" value="${lat}">
                <input type="hidden" name="lng" value="${lng}">
                <div class="mb-2">
                    <label>Name:<br><input type="text" name="name" required></label>
                </div>
                <div class="mb-2">
                    <label>Nachricht:<br><textarea name="message" rows="10" required></textarea></label>
                </div>
                <button type="submit" class="btn btn-primary btn-sm">Senden</button>
                </form>
                <div id="form-message" class="alert d-none mt-2" role="alert"></div>
            `;

            // Popup anzeigen
            marker.bindPopup(formHtml, {
  autoPan: true,
  autoPanPadding: [40, 40], // sorgt für ausreichend Abstand von Rändern
  offset: [0, -10] // zentriert Popup besser über Marker
}).openPopup();
        });


        map.on('popupopen', function () {
            const form = document.getElementById('leaflet-form');
            if (form) {
                form.addEventListener('submit', function (e) {
                e.preventDefault();
                const formData = new FormData(form);

                fetch('<?php echo admin_url("admin-ajax.php"); ?>', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        const popupContent = `
                            <div class="alert alert-success fade-message mb-0" id="popup-message">
                            ${data.message}
                            </div>
                        `;

                        // Popup-Inhalt ersetzen (statt nur Nachricht unten drunter)
                        marker.getPopup().setContent(popupContent);

                        setTimeout(() => {
                            map.closePopup();
                            if (marker) {
                            map.removeLayer(marker);
                            marker = null;
                            }
                        }, 8000);

                        form.reset();
                    })
                    .catch(error => {
                        const msgBox = document.getElementById('form-message');
                        msgBox.textContent = 'Fehler beim Absenden!';
                        msgBox.className = 'alert alert-danger mt-2';
                        msgBox.classList.remove('d-none');
                        });

                        setTimeout(() => {
                            map.closePopup();
                            if (marker) {
                            map.removeLayer(marker);
                            marker = null;
                            }
                        }, 8000);
                    });
                }
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

    // Beitrag erstellen
    $post_id = wp_insert_post([
        'post_type' => 'custompoi',
        'post_title' => wp_strip_all_tags($name),
        'post_status' => 'publish', // oder 'pending' für Moderation
    ]);

    // Beispiel: E-Mail senden
    $to = get_option('admin_email');
    $subject = "Neue Kartenhinweis von $name";
    $link = "https://www.openstreetmap.org/?mlat=$lat&mlon=$lng#map=17/$lat/$lng";
    $body = "Name: $name\nNachricht: $message\nPosition: $lat, $lng\nKarte: $link";
    $headers = ['Content-Type: text/plain; charset=UTF-8'];

    wp_mail($to, $subject, $body, $headers);

    if ($post_id && !is_wp_error($post_id)) {
        // Metadaten speichern
        update_post_meta($post_id, 'message', $message);
        update_post_meta($post_id, 'lat', $lat);
        update_post_meta($post_id, 'lng', $lng);
        update_post_meta($post_id, 'link', $link);

        wp_send_json([
            'success' => true,
            'message' => 'Danke! Deine Hinweis wurde gespeichert.'
        ]);
    } else {
        wp_send_json([
            'success' => false,
            'message' => 'Fehler beim Speichern.'
        ]);
    }

}
