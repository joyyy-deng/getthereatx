<?php

/**
 *  Enable shortcodes in widgets
 */
add_filter('widget_text', 'do_shortcode', 11);

/**
 * Shortcode [copyright_date]
 */
add_shortcode('copyright_date', 'copyright_date');
function copyright_date() {
    return date('Y');
}
