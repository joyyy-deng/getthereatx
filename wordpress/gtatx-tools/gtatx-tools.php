<?php
/**
 * Plugin Name:       GetThereATX Tools
 * Description:       The GetThereATX trip planner and resources directory. Shortcodes: [gtatx_trip_planner] and [gtatx_resources].
 * Version:           0.1.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            WKRM (UT Austin) for Austin Transportation and Public Works
 * License:           GPL-2.0-or-later
 * Text Domain:       gtatx-tools
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const GTATX_TOOLS_VERSION = '0.1.0';
const GTATX_TOOLS_HANDLE  = 'gtatx-tools';

/**
 * Register (not enqueue) the script and style. They load only when a page
 * uses one of the shortcodes, so no other page on the site changes.
 */
function gtatx_tools_register_assets() {
	$base = plugin_dir_url( __FILE__ );
	$dir  = plugin_dir_path( __FILE__ );
	$ver  = file_exists( $dir . 'build/gtatx-tools.js' )
		? GTATX_TOOLS_VERSION . '-' . filemtime( $dir . 'build/gtatx-tools.js' )
		: GTATX_TOOLS_VERSION;

	wp_register_style( GTATX_TOOLS_HANDLE, $base . 'build/gtatx-tools.css', array(), $ver );
	wp_register_script( GTATX_TOOLS_HANDLE, $base . 'build/gtatx-tools.js', array(), $ver, true );

	/**
	 * Links from the tools to other GetThereATX pages. Change these with the
	 * `gtatx_tools_pages` filter once the real page URLs are known.
	 */
	$pages = apply_filters(
		'gtatx_tools_pages',
		array(
			'home'      => home_url( '/' ),
			'plan'      => home_url( '/plan-your-trip/' ),
			'community' => home_url( '/community/' ),
			'resources' => home_url( '/resources/' ),
			'students'  => home_url( '/resources/students/' ),
		)
	);

	wp_add_inline_script(
		GTATX_TOOLS_HANDLE,
		'window.gtatxTools = ' . wp_json_encode(
			array(
				'assetBase' => $base . 'assets/',
				'pages'     => $pages,
			)
		) . ';',
		'before'
	);
}
add_action( 'wp_enqueue_scripts', 'gtatx_tools_register_assets', 5 );

/** Load the style in <head> when the post content has a shortcode, so the tool doesn't flash unstyled. */
function gtatx_tools_enqueue_early() {
	$post = get_post();
	if ( ! is_singular() || ! $post ) {
		return;
	}
	if ( has_shortcode( $post->post_content, 'gtatx_trip_planner' ) || has_shortcode( $post->post_content, 'gtatx_resources' ) ) {
		wp_enqueue_style( GTATX_TOOLS_HANDLE );
	}
}
add_action( 'wp_enqueue_scripts', 'gtatx_tools_enqueue_early', 20 );

/** The mount point. The script finds it by data-gtatx-mount and renders the tool there. */
function gtatx_tools_mount( $tool, $extra = array() ) {
	// Shortcodes inside Elementor widgets aren't in post_content, so enqueue here too.
	wp_enqueue_style( GTATX_TOOLS_HANDLE );
	wp_enqueue_script( GTATX_TOOLS_HANDLE );

	$attrs = '';
	foreach ( $extra as $name => $value ) {
		$attrs .= sprintf( ' %s="%s"', esc_attr( $name ), esc_attr( $value ) );
	}
	return sprintf(
		'<div class="gtatx-app" data-gtatx-mount="%s"%s><noscript>%s</noscript></div>',
		esc_attr( $tool ),
		$attrs,
		esc_html__( 'This tool needs JavaScript turned on.', 'gtatx-tools' )
	);
}

/**
 * [gtatx_trip_planner]
 * [gtatx_trip_planner height="760px"]  Map height. Default: the screen height minus 120px.
 */
function gtatx_tools_trip_planner_shortcode( $atts ) {
	$atts = shortcode_atts( array( 'height' => 'calc(100dvh - 120px)' ), $atts, 'gtatx_trip_planner' );
	return gtatx_tools_mount( 'plan', array( 'data-gtatx-height' => $atts['height'] ) );
}
add_shortcode( 'gtatx_trip_planner', 'gtatx_tools_trip_planner_shortcode' );

/** [gtatx_resources] */
function gtatx_tools_resources_shortcode() {
	return gtatx_tools_mount( 'resources' );
}
add_shortcode( 'gtatx_resources', 'gtatx_tools_resources_shortcode' );
