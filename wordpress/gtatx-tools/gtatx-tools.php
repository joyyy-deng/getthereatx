<?php
/**
 * Plugin Name:       GetThereATX Tools
 * Description:       The GetThereATX trip planner and resources directory (shortcodes [gtatx_trip_planner] and [gtatx_resources]), plus the fields and Elementor dynamic tags for blog posts and community events.
 * Version:           0.3.1
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            WKRM (UT Austin) for Austin Transportation and Public Works
 * License:           GPL-2.0-or-later
 * Text Domain:       gtatx-tools
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const GTATX_TOOLS_VERSION = '0.3.1';
const GTATX_TOOLS_FILE    = __FILE__;
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
	wp_register_script( GTATX_TOOLS_HANDLE, $base . 'build/gtatx-tools.js', array(), $ver, array( 'in_footer' => true, 'strategy' => 'defer' ) );

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
 * Both shortcodes take width="full" (default: the tool spans the whole page,
 * as in the Figma) or width="content" (it stays inside the theme's column).
 */
function gtatx_tools_width_attr( $atts, $tag ) {
	$atts = shortcode_atts( array( 'width' => 'full' ), $atts, $tag );
	return array( 'data-gtatx-width' => 'content' === $atts['width'] ? 'content' : 'full' );
}

/** [gtatx_trip_planner] */
function gtatx_tools_trip_planner_shortcode( $atts ) {
	return gtatx_tools_mount( 'plan', gtatx_tools_width_attr( $atts, 'gtatx_trip_planner' ) );
}
add_shortcode( 'gtatx_trip_planner', 'gtatx_tools_trip_planner_shortcode' );

/** [gtatx_resources] */
function gtatx_tools_resources_shortcode( $atts ) {
	// The directory from WP admin (External resources, posts, events, Directory tags): includes/directory.php.
	gtatx_directory_send();
	return gtatx_tools_mount( 'resources', gtatx_tools_width_attr( $atts, 'gtatx_resources' ) );
}
add_shortcode( 'gtatx_resources', 'gtatx_tools_resources_shortcode' );

/* WP admin → Tools → GetThereATX theme switch: check and copy before moving to Hello Elementor. */
if ( is_admin() ) {
	require_once __DIR__ . '/includes/theme-switch.php';
}

/* Blog posts and community events: fields, helpers, styles (includes/content.php). */
require_once __DIR__ . '/includes/content.php';

/* Elementor dynamic tags: "GetThereATX text" and "GetThereATX link". */
add_action(
	'elementor/dynamic_tags/register',
	function ( $tags ) {
		require_once __DIR__ . '/includes/elementor-tags.php';
		\Elementor\Plugin::$instance->dynamic_tags->register_group( 'gtatx', array( 'title' => 'GetThereATX' ) );
		$tags->register( new GTATX_Text_Tag() );
		$tags->register( new GTATX_Url_Tag() );
	}
);

/* Elementor widgets: Facts strip, Steps, Table (includes/elementor-widgets.php), under "GetThereATX". */
add_action(
	'elementor/elements/categories_registered',
	function ( $manager ) {
		$manager->add_category( 'gtatx', array( 'title' => 'GetThereATX', 'icon' => 'fa fa-plug' ) );
	}
);
add_action(
	'elementor/widgets/register',
	function ( $widgets ) {
		require_once __DIR__ . '/includes/elementor-widgets.php';
		$widgets->register( new GTATX_Facts_Widget() );
		$widgets->register( new GTATX_Steps_Widget() );
		$widgets->register( new GTATX_Table_Widget() );
	}
);

/*
 * Local testing only: page templates for when Elementor Pro isn't installed
 * (includes/local-templates.php). Loaded only where the site turns it on
 * (wordpress/.wp-env.json); the uploaded zip leaves these files out.
 */
if ( defined( 'GTATX_LOCAL_TEMPLATES' ) && GTATX_LOCAL_TEMPLATES && file_exists( __DIR__ . '/includes/local-templates.php' ) ) {
	require_once __DIR__ . '/includes/local-templates.php';
}
