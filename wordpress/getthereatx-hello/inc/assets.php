<?php
/**
 * Styles and scripts.
 *
 * The old theme loaded its CSS, three scripts and Google Maps on every page; they restyled our
 * new Elementor pages. Here they load only where they're still needed: pages whose Elementor
 * layout uses an old widget, and the CTX GO landing pages (which always had them).
 * Filter `gtatx_child_load_old_assets` to force them on or off for a page.
 */

defined( 'ABSPATH' ) || exit;

/** This theme's style.css, plus Real Text Pro (the Adobe Fonts kit) everywhere. */
add_action(
	'wp_enqueue_scripts',
	function () {
		wp_enqueue_style( 'gtatx-typekit', 'https://use.typekit.net/pgu6iej.css', array(), null );
		wp_enqueue_style( 'gtatx-hello', get_stylesheet_uri(), array(), GTATX_CHILD_VERSION );
	},
	20
);

/** True on pages that still need the old theme's CSS, scripts and Google Maps. */
function gtatx_child_needs_old_assets() {
	$id    = is_singular() ? get_queried_object_id() : 0;
	$needs = $id && ( is_page_template( 'ctx-landing/template-ctx-landing.php' ) || gtatx_child_uses_old_widgets( $id ) );
	return (bool) apply_filters( 'gtatx_child_load_old_assets', $needs, $id );
}

/** URL + version for a copied old-theme file, or null when it isn't there. */
function gtatx_child_asset( $rel ) {
	$path = get_stylesheet_directory() . '/' . $rel;
	return is_readable( $path ) ? array( get_stylesheet_directory_uri() . '/' . $rel, (string) filemtime( $path ) ) : null;
}

/** The old theme's theme_scripts(), for the pages that need it. */
add_action(
	'wp_enqueue_scripts',
	function () {
		if ( ! gtatx_child_needs_old_assets() ) {
			return;
		}
		foreach ( array( 'getthereatx-styles' => 'css/styles.css', 'getthereatx-style' => 'css/old-theme-style.css' ) as $handle => $rel ) {
			$a = gtatx_child_asset( $rel );
			if ( $a ) {
				wp_enqueue_style( $handle, $a[0], array(), $a[1] );
			}
		}

		$key = function_exists( 'get_field' ) ? (string) get_field( 'google_map_api_key', 'option' ) : '';
		if ( $key ) {
			wp_enqueue_script( 'google-maps', 'https://maps.google.com/maps/api/js?key=' . rawurlencode( $key ) . '&libraries=places', array( 'jquery' ), null, true );
		}

		$deps = array( 'jquery' );
		foreach ( array( 'getthereatx-plugins' => 'js/plugins.js', 'getthereatx-scripts' => 'js/scripts.js', 'getthereatx' => 'js/getthereatx.js' ) as $handle => $rel ) {
			$a = gtatx_child_asset( $rel );
			if ( $a ) {
				wp_enqueue_script( $handle, $a[0], $deps, $a[1], true );
				$deps = array( 'jquery', $handle );
			}
		}
		if ( wp_script_is( 'getthereatx-scripts', 'enqueued' ) ) {
			wp_localize_script(
				'getthereatx-scripts',
				'wp_helper',
				array(
					'home_url'           => home_url(),
					'home_path'          => get_stylesheet_directory_uri(),
					'ajax_url'           => admin_url( 'admin-ajax.php' ),
					'nonce'              => wp_create_nonce( 'view-nonce' ),
					'google_map_api_key' => $key,
				)
			);
		}
	},
	25
);

/**
 * CTX GO landing CSS/JS (the old theme_ctx_landing_scripts()): header, footer and download modal
 * on every CTX page; each section's own files only when the page uses that section.
 */
add_action(
	'wp_enqueue_scripts',
	function () {
		if ( ! is_page_template( 'ctx-landing/template-ctx-landing.php' ) ) {
			return;
		}
		$css = function ( $name, $deps = array( 'ctx-landing-global' ) ) {
			$a = gtatx_child_asset( "ctx-landing/css/{$name}.css" );
			if ( $a ) {
				wp_enqueue_style( $name, $a[0], $deps, $a[1] );
			}
		};
		$js = function ( $name ) {
			$a = gtatx_child_asset( "ctx-landing/js/{$name}.js" );
			if ( $a ) {
				wp_enqueue_script( $name, $a[0], array( 'jquery' ), $a[1], true );
			}
		};

		$css( 'ctx-landing-global', array() );
		$css( 'ctx-landing-header' );
		$css( 'ctx-landing-footer' );
		$css( 'ctx-landing-download-modal' );
		$js( 'ctx-landing-header' );
		$js( 'ctx-landing-download-modal' );

		$sections = function_exists( 'get_field' ) ? ( get_field( 'ctx_page_sections', get_queried_object_id() ) ?: array() ) : array();
		$used     = wp_list_pluck( (array) $sections, 'acf_fc_layout' );
		if ( in_array( 'hero', $used, true ) ) {
			$css( 'ctx-landing-hero' );
			$js( 'ctx-landing-hero' );
		}
		if ( in_array( 'how-it-works', $used, true ) ) {
			$css( 'ctx-landing-how-it-works' );
		}
		if ( in_array( 'modes', $used, true ) ) {
			$css( 'ctx-landing-modes' );
			$js( 'ctx-landing-modes' );
		}
		if ( in_array( 'cta-banner', $used, true ) ) {
			$css( 'ctx-landing-cta-banner' );
		}
	},
	25
);

/** ACF map fields in WP admin use the key from Global Options (old enqueue.php). */
add_filter(
	'acf/fields/google_map/api',
	function ( $api ) {
		$key = function_exists( 'get_field' ) ? get_field( 'google_map_api_key', 'option' ) : '';
		if ( $key ) {
			$api['key'] = $key;
		}
		return $api;
	}
);

/**
 * Google Analytics, only if the old theme itself printed it (its header.php or footer.php).
 * The theme switch tool finds the ID there and saves it; if GA came from a plugin instead,
 * this stays empty so visits aren't counted twice.
 */
add_action(
	'wp_head',
	function () {
		$id = (string) get_option( 'gtatx_child_ga_id', '' );
		if ( preg_match( '/^G-[A-Z0-9]{4,}$/', $id ) ) {
			printf(
				"<script async src=\"https://www.googletagmanager.com/gtag/js?id=%1\$s\"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','%1\$s');</script>\n",
				esc_attr( $id )
			);
		} elseif ( preg_match( '/^GTM-[A-Z0-9]{4,}$/', $id ) ) {
			printf(
				"<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','%s');</script>\n",
				esc_js( $id )
			);
		}
	},
	1
);
