<?php
/**
 * LOCAL TESTING ONLY (mounted by wordpress/.wp-env.json, never shipped).
 * Loads copies of getthereatx.com's theme stylesheet and Elementor global
 * styles (live-css/, git-ignored) so the tools can be tested against the
 * real site's CSS, including `.elementor-kit-10 button { padding: 16rem … }`.
 * Turn off by visiting a page with ?no-live-css.
 */
add_action( 'wp_enqueue_scripts', function () {
	if ( isset( $_GET['no-live-css'] ) ) {
		return;
	}
	$base = content_url( 'mu-plugins/gtatx-live-css/' );
	wp_enqueue_style( 'gtatx-live-theme', $base . 'theme.css', array(), '1' );
	// After the plugin's own CSS, like on the live site.
	wp_enqueue_style( 'gtatx-live-kit', $base . 'kit.css', array(), '1' );
	// Stand-in for the theme's `body #main article a:not(.btn):not(.sbi_photo)` (same or higher weight).
	wp_add_inline_style( 'gtatx-live-kit', 'html:not(#x) body .wp-site-blocks main a:not(.btn):not(.sbi_photo){color:#009F4D;text-decoration:underline}' );
}, 100 );
add_filter( 'body_class', function ( $classes ) {
	$classes[] = 'elementor-kit-10';
	return $classes;
} );
