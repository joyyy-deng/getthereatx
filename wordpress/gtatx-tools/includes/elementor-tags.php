<?php
/**
 * Elementor dynamic tags (the database icon next to a widget's text or link):
 * "GetThereATX text" and "GetThereATX link", each with a Field dropdown,
 * like Elementor's own ACF tag. The templates in wordpress/elementor/ use them.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Text fields: key => [label, value(post id)]. */
function gtatx_tag_text_fields() {
	$event = fn( $key ) => fn( $id ) => gtatx_event_data( $id )[ $key ];
	return array(
		'blog_meta'          => array( 'Blog: read time · (date) · by', 'gtatx_blog_meta' ),
		'event_date'         => array( 'Event: date', $event( 'date' ) ),
		'event_time'         => array( 'Event: start – end', $event( 'time' ) ),
		'event_venue'        => array( 'Event: venue name', $event( 'venue' ) ),
		'event_address'      => array( 'Event: street address', $event( 'address' ) ),
		'event_cost'         => array( 'Event: cost', $event( 'cost' ) ),
		'event_ages'         => array( 'Event: ages', $event( 'ages' ) ),
		'event_registration' => array( 'Event: registration', $event( 'registration' ) ),
		'event_hosted_by'    => array( 'Event: organizer · partners', $event( 'hosted_by' ) ),
		'event_contact'      => array( 'Event: contact', $event( 'contact' ) ),
		'event_accessibility' => array( 'Event: accessibility', $event( 'accessibility' ) ),
		'event_getting_there' => array( 'Event: getting there (facts panel)', 'gtatx_getting_there_html' ),
		'event_what_to_bring' => array(
			'Event: what to bring (bullets)',
			function ( $id ) {
				$items = gtatx_event_data( $id )['what_to_bring'];
				return $items ? '<ul class="gtatx-bullets"><li>' . implode( '</li><li>', array_map( 'esc_html', $items ) ) . '</li></ul>' : '';
			},
		),
		'event_date_short'   => array( 'Event: short date (cards)', fn( $id ) => function_exists( 'tribe_get_start_date' ) ? tribe_get_start_date( $id, false, 'D, M j' ) : '' ),
	);
}

/** Link fields. */
function gtatx_tag_url_fields() {
	return array(
		'event_website' => array( 'Event: website (Book now)', fn( $id ) => gtatx_event_data( $id )['website'] ),
		'event_ical'    => array( 'Event: add to calendar (.ics)', fn( $id ) => gtatx_event_data( $id )['ical'] ),
	);
}

// Loaded by gtatx-tools.php inside the elementor/dynamic_tags/register hook, when Elementor's classes exist.

class GTATX_Text_Tag extends \Elementor\Core\DynamicTags\Tag {
	public function get_name() {
		return 'gtatx-text';
	}

	public function get_title() {
		return 'GetThereATX text';
	}

	public function get_group() {
		return 'gtatx';
	}

	public function get_categories() {
		return array( \Elementor\Modules\DynamicTags\Module::TEXT_CATEGORY );
	}

	protected function register_controls() {
		$this->add_control(
			'field',
			array(
				'label'   => 'Field',
				'type'    => \Elementor\Controls_Manager::SELECT,
				'options' => array_map( fn( $f ) => $f[0], gtatx_tag_text_fields() ),
				'default' => 'blog_meta',
			)
		);
	}

	public function render() {
		$fields = gtatx_tag_text_fields();
		$key    = $this->get_settings( 'field' );
		$value  = isset( $fields[ $key ] ) ? (string) call_user_func( $fields[ $key ][1], get_the_ID() ) : '';
		// These two return their own escaped HTML (a list, a facts panel); the rest is plain text.
		echo in_array( $key, array( 'event_what_to_bring', 'event_getting_there' ), true ) ? wp_kses_post( $value ) : esc_html( $value );
	}
}

class GTATX_Url_Tag extends \Elementor\Core\DynamicTags\Data_Tag {
	public function get_name() {
		return 'gtatx-url';
	}

	public function get_title() {
		return 'GetThereATX link';
	}

	public function get_group() {
		return 'gtatx';
	}

	public function get_categories() {
		return array( \Elementor\Modules\DynamicTags\Module::URL_CATEGORY );
	}

	protected function register_controls() {
		$this->add_control(
			'field',
			array(
				'label'   => 'Field',
				'type'    => \Elementor\Controls_Manager::SELECT,
				'options' => array_map( fn( $f ) => $f[0], gtatx_tag_url_fields() ),
				'default' => 'event_website',
			)
		);
	}

	public function get_value( array $options = array() ) {
		$fields = gtatx_tag_url_fields();
		$key    = $this->get_settings( 'field' );
		return isset( $fields[ $key ] ) ? esc_url( (string) call_user_func( $fields[ $key ][1], get_the_ID() ) ) : '';
	}
}
