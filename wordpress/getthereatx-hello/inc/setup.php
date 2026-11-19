<?php
/**
 * The parts of the old theme's functions.php that Hello Elementor doesn't already do.
 * (Hello already adds title-tag, post-thumbnails, feed links, HTML5 markup.)
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'after_setup_theme',
	function () {
		load_theme_textdomain( 'getthereatx' );
		add_theme_support( 'customize-selective-refresh-widgets' );
		add_theme_support( 'wp-block-styles' );
		add_theme_support( 'align-wide' );
		add_post_type_support( 'page', 'excerpt' );

		// Same menu locations as the old theme, so old code that asks for them still works.
		register_nav_menus(
			array(
				'primary' => __( 'Primary Navigation', 'getthereatx' ),
				'footer'  => __( 'Footer Navigation', 'getthereatx' ),
			)
		);
	},
	20
);

/** Pingback link on single posts (old functions.php). */
add_action(
	'wp_head',
	function () {
		if ( is_singular() && pings_open() ) {
			printf( '<link rel="pingback" href="%s">' . "\n", esc_url( get_bloginfo( 'pingback_url' ) ) );
		}
	}
);

/**
 * Contact Form 7 loads its scripts and reCAPTCHA only on pages with a form (old functions.php).
 */
function boundby_cf7_shortcode_exists( $post_id = null ) {
	if ( ! is_null( $post_id ) || ( is_singular() && class_exists( 'WPCF7' ) ) ) {
		if ( is_null( $post_id ) ) {
			$post_id = get_queried_object_id();
		}
		if ( ! $post_id ) {
			return false;
		}
		$elementor_data = get_post_meta( $post_id, '_elementor_data', true );
		$haystack       = $elementor_data ? $elementor_data : get_post_field( 'post_content', $post_id );
		return is_string( $haystack ) && false !== strpos( $haystack, '[contact-form-7 ' );
	}
	return false;
}

add_action(
	'wp_enqueue_scripts',
	function () {
		if ( ! boundby_cf7_shortcode_exists() ) {
			remove_action( 'wp_enqueue_scripts', 'wpcf7_recaptcha_enqueue_scripts', 20 );
		}
	},
	1
);

add_action(
	'wp_enqueue_scripts',
	function () {
		if ( boundby_cf7_shortcode_exists() ) {
			if ( function_exists( 'wpcf7_enqueue_scripts' ) ) {
				wpcf7_enqueue_scripts();
			}
			if ( function_exists( 'wpcf7_enqueue_styles' ) ) {
				wpcf7_enqueue_styles();
			}
		}
	},
	20
);
