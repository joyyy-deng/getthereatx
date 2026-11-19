<?php
/**
 * The old theme's 10 Elementor widgets ("Get there ATX" group in the editor), as in its
 * inc/elementor.php, but each one loads only if its file was copied in, so a missing file
 * can't stop the site. The widget names are what pages store, so pages keep working.
 */

defined( 'ABSPATH' ) || exit;

/** Widget file in inc/widgets/ => its class (from the old inc/elementor.php). */
function gtatx_child_old_widgets() {
	return array(
		'text.php'        => 'Elementor_Text',
		'home-visual.php' => 'Elementor_Home_Visual',
		'home-info.php'   => 'Elementor_Home_Info',
		'trip-planer.php' => 'Elementor_Trip_Planer',
		'contacts.php'    => 'Elementor_Contacts',
		'carusel.php'     => 'Elementor_Carusel',
		'slider.php'      => 'Elementor_Slider',
		'title.php'       => 'Elementor_Theme_Title',
		'separator.php'   => 'Elementor_Separator',
		'column_text.php' => 'Elementor_Column_Text',
	);
}

add_action(
	'elementor/elements/categories_registered',
	function ( $elements_manager ) {
		$elements_manager->add_category(
			'themecategory',
			array(
				'title'  => esc_html__( 'Get there ATX', 'getthereatx' ),
				'icon'   => 'fa fa-plug',
				'active' => true,
			)
		);
	}
);

add_action(
	'elementor/widgets/register',
	function ( $widgets_manager ) {
		$dir = get_stylesheet_directory() . '/inc/widgets/';
		foreach ( gtatx_child_old_widgets() as $file => $class ) {
			if ( ! is_readable( $dir . $file ) ) {
				continue;
			}
			require_once $dir . $file;
			if ( class_exists( $class ) ) {
				$widgets_manager->register( new $class() );
			}
		}
	}
);

/** Names of the old widgets as Elementor stores them on pages (e.g. "theme_title"). */
function gtatx_child_old_widget_names() {
	static $names = null;
	if ( null !== $names ) {
		return $names;
	}
	$names = array();
	if ( ! did_action( 'elementor/loaded' ) || ! class_exists( '\Elementor\Plugin' ) ) {
		return $names;
	}
	foreach ( \Elementor\Plugin::$instance->widgets_manager->get_widget_types() as $name => $widget ) {
		if ( in_array( 'themecategory', (array) $widget->get_categories(), true ) ) {
			$names[] = $name;
		}
	}
	return $names;
}

/** Does this page's Elementor layout use one of the old widgets? */
function gtatx_child_uses_old_widgets( $post_id ) {
	$data = $post_id ? get_post_meta( $post_id, '_elementor_data', true ) : '';
	if ( ! is_string( $data ) || '' === $data ) {
		return false;
	}
	foreach ( gtatx_child_old_widget_names() as $name ) {
		if ( false !== strpos( $data, '"widgetType":"' . $name . '"' ) ) {
			return true;
		}
	}
	return false;
}
