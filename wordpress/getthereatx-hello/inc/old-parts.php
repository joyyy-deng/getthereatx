<?php
/**
 * Old theme parts copied in on the server (Tools → GetThereATX theme switch → Copy):
 * the CTX GO landing system (template, header, sections, CSS/JS/pictures, its ACF fields,
 * the English/Spanish pairing) and the old Elementor widgets. Each is loaded only if the
 * copy is there, so a missing piece never takes the site down; WP admin shows a notice.
 *
 * The copy changes get_template_directory() to get_stylesheet_directory() in those files,
 * because in a child theme the "template" folder is Hello Elementor's, not this one.
 */

defined( 'ABSPATH' ) || exit;

/** Files from the old theme, in the order its functions.php loaded them. */
function gtatx_child_old_php_files() {
	return array( 'inc/i18n.php', 'inc/acf-i18n.php', 'ctx-landing/acf-ctx-landing.php' );
}

foreach ( gtatx_child_old_php_files() as $gtatx_child_file ) {
	if ( is_readable( get_stylesheet_directory() . '/' . $gtatx_child_file ) ) {
		require_once get_stylesheet_directory() . '/' . $gtatx_child_file;
	}
}
unset( $gtatx_child_file );

/** True when the CTX template is in this theme (the copy has run). */
function gtatx_child_has_ctx() {
	return is_readable( get_stylesheet_directory() . '/ctx-landing/template-ctx-landing.php' );
}

/** Pages that use an old-theme page template this theme doesn't have. */
function gtatx_child_missing_templates() {
	global $wpdb;
	$rows = $wpdb->get_results(
		"SELECT p.ID, p.post_title, m.meta_value AS tpl FROM {$wpdb->posts} p
		 JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = '_wp_page_template'
		 WHERE p.post_type = 'page' AND p.post_status IN ('publish','private','draft','future','pending')
		 AND m.meta_value NOT IN ('', 'default', 'elementor_header_footer', 'elementor_canvas', 'elementor_theme')"
	);
	$listed = wp_get_theme()->get_page_templates( null, 'page' ); // includes ones plugins add
	return array_values(
		array_filter(
			(array) $rows,
			fn( $r ) => ! locate_template( $r->tpl ) && ! isset( $listed[ $r->tpl ] )
		)
	);
}

add_action(
	'admin_notices',
	function () {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$problems = array();
		if ( ! gtatx_child_has_ctx() ) {
			$problems[] = 'the CTX GO landing template';
		}
		if ( ! is_dir( get_stylesheet_directory() . '/inc/widgets' ) ) {
			$problems[] = 'the old Elementor widgets';
		}
		$missing = gtatx_child_missing_templates();
		if ( $missing ) {
			$problems[] = 'page templates used by: ' . implode( ', ', wp_list_pluck( $missing, 'post_title' ) );
		}
		if ( ! $problems ) {
			return;
		}
		$url = admin_url( 'tools.php?page=gtatx-theme-switch' );
		printf(
			'<div class="notice notice-error"><p><strong>Get There ATX (Hello)</strong> is missing %s. Copy them from the old theme: <a href="%s">Tools → GetThereATX theme switch</a>.</p></div>',
			esc_html( implode( '; ', $problems ) ),
			esc_url( $url )
		);
	}
);
