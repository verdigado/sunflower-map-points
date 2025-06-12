<?php

function registercustompoi_post_type() {
    register_post_type('custompoi', [
        'labels' => [
            'name' => 'Kartenmeldungen',
            'singular_name' => 'Kartenmeldung'
        ],
        'public' => true,
        'has_archive' => false,
        'show_in_menu' => true,
        'supports' => ['title', 'custom-fields'],
        'menu_icon' => 'dashicons-location-alt',
    ]);
}
add_action('init', 'registercustompoi_post_type');
