<?php
/**
 * Blog posts and community events: the fields staff fill in, and the helpers
 * the Elementor templates (and the local preview templates) read.
 *
 * Figma: "Article/blog Master template" and "Community Event Detail Template".
 * Plan: docs/cms-plan.md in the prototype repo.
 *
 * Nothing here changes how the live site looks on its own:
 * - The fields only add boxes to the post / event edit screens.
 * - The blog stylesheet only styles content inside a `.gtatx-blog` wrapper,
 *   which exists only in our Elementor Single Post template.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* -------------------------------------------------------------------------
 * Fields (ACF; free ACF is enough, no repeaters).
 * Registered in PHP so they live in this plugin and survive a theme change.
 * ---------------------------------------------------------------------- */

function gtatx_register_fields() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	acf_add_local_field_group(
		array(
			'key'      => 'group_gtatx_blog',
			'title'    => 'Blog page settings',
			'position' => 'side',
			'fields'   => array(
				array(
					'key'           => 'field_gtatx_show_date',
					'name'          => 'gtatx_show_date',
					'label'         => 'Show date',
					'type'          => 'true_false',
					'ui'            => 1,
					'default_value' => 0,
					'instructions'  => 'Off by default. On adds "Updated Month Year" (the last time the post was saved) under the title.',
				),
				array(
					'key'          => 'field_gtatx_author_label',
					'name'         => 'gtatx_author_label',
					'label'        => 'By',
					'type'         => 'text',
					'placeholder'  => 'Get There ATX',
					'instructions' => 'Shown as "By …" under the title. Leave empty for Get There ATX.',
				),
				array(
					'key'          => 'field_gtatx_hero_video',
					'name'         => 'gtatx_hero_video',
					'label'        => 'Hero video (optional)',
					'type'         => 'url',
					'instructions' => 'A YouTube link. If set, the video replaces the featured image at the top.',
				),
			),
			'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'post' ) ) ),
		)
	);

	$text = function ( $name, $label, $instructions, $type = 'text' ) {
		return array(
			'key'          => 'field_gtatx_event_' . $name,
			'name'         => 'gtatx_event_' . $name,
			'label'        => $label,
			'type'         => $type,
			'rows'         => 'textarea' === $type ? 4 : null,
			'instructions' => $instructions . ' Leave empty to hide it.',
		);
	};

	acf_add_local_field_group(
		array(
			'key'      => 'group_gtatx_event',
			'title'    => 'Event page details',
			'fields'   => array(
				$text( 'ages', 'Ages', 'Age range, e.g. "14–18" or "All ages".' ),
				$text( 'registration', 'Registration', 'e.g. "Required" or "Drop-in".' ),
				$text( 'what_to_bring', 'What to bring / What you will gain', 'One item per line; each line becomes a bullet.', 'textarea' ),
				$text( 'partners', 'Partners', 'Shown after the organizer under "Hosted by".' ),
				$text( 'contact', 'Contact', 'An email address or phone number.' ),
				$text( 'accessibility', 'Accessibility', 'Accessibility details and how to request accommodations.', 'textarea' ),
				gtatx_getting_there_field(),
			),
			'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'tribe_events' ) ) ),
		)
	);
}
add_action( 'acf/init', 'gtatx_register_fields' );

/**
 * "Getting there": a list staff add to (Bus, Bike, Scooter, Walk, Parking…),
 * each a label and the details. A Repeater, so it needs ACF PRO (the live site
 * has it); without PRO the box is hidden, but saved rows still show.
 */
function gtatx_getting_there_field() {
	if ( ! function_exists( 'acf_get_field_type' ) || ! acf_get_field_type( 'repeater' ) ) {
		return array(
			'key'     => 'field_gtatx_event_getting_there_note',
			'name'    => '',
			'label'   => 'Getting there',
			'type'    => 'message',
			'message' => 'Adding ways to get there needs ACF PRO.',
		);
	}
	return array(
		'key'          => 'field_gtatx_event_getting_there',
		'name'         => 'gtatx_event_getting_there',
		'label'        => 'Getting there',
		'type'         => 'repeater',
		'layout'       => 'table',
		'button_label' => 'Add a way to get there',
		'instructions' => 'One row per way: Bus, Bike, Scooter, Walk, Parking… Three show in a row on the page; more start a new row. Leave empty to hide the section.',
		'sub_fields'   => array(
			array( 'key' => 'field_gtatx_event_getting_there_label', 'name' => 'label', 'label' => 'Way', 'type' => 'text', 'required' => 1, 'placeholder' => 'Scooter' ),
			array( 'key' => 'field_gtatx_event_getting_there_details', 'name' => 'details', 'label' => 'Details', 'type' => 'text', 'required' => 1, 'placeholder' => 'Lime and Bird scooters park at the corner of 6th & Lamar' ),
		),
	);
}

/** The Getting there rows, read from post meta in ACF's storage format (works with or without ACF PRO). */
function gtatx_getting_there( $post_id ) {
	$rows = array();
	for ( $i = 0, $n = (int) get_post_meta( $post_id, 'gtatx_event_getting_there', true ); $i < $n; $i++ ) {
		$label   = trim( (string) get_post_meta( $post_id, "gtatx_event_getting_there_{$i}_label", true ) );
		$details = trim( (string) get_post_meta( $post_id, "gtatx_event_getting_there_{$i}_details", true ) );
		if ( '' !== $label && '' !== $details ) {
			$rows[] = array( 'label' => $label, 'details' => $details );
		}
	}
	return $rows;
}

/** The facts panel HTML for Getting there (styled by blog.css .gtatx-facts). */
function gtatx_getting_there_html( $post_id ) {
	return gtatx_facts_html( gtatx_getting_there( $post_id ) );
}

/* Shared HTML for the list blocks (Elementor widgets, Post body blocks, Getting there). All escaped here. */

/** Facts panel: [label, details] pairs, three to a row on desktop. */
function gtatx_facts_html( array $facts ) {
	$facts = array_values( array_filter( $facts, fn( $f ) => '' !== trim( (string) $f['label'] ) . trim( (string) $f['details'] ) ) );
	if ( ! $facts ) {
		return '';
	}
	$out = sprintf( '<dl class="gtatx-facts gtatx-facts--n%d">', min( 3, count( $facts ) ) );
	foreach ( $facts as $f ) {
		$out .= sprintf( '<div class="gtatx-fact"><dt>%s</dt><dd>%s</dd></div>', esc_html( $f['label'] ), esc_html( $f['details'] ) );
	}
	return $out . '</dl>';
}

/** Steps: [title, text] pairs, numbered automatically. */
function gtatx_steps_html( array $steps ) {
	$steps = array_values( array_filter( $steps, fn( $s ) => '' !== trim( (string) $s['title'] ) . trim( (string) $s['text'] ) ) );
	if ( ! $steps ) {
		return '';
	}
	$out = '<ol class="gtatx-steps">';
	foreach ( $steps as $j => $s ) {
		$out .= sprintf(
			'<li><span class="gtatx-step-number" aria-hidden="true">%1$d</span><div><h3><span class="screen-reader-text">Step %1$d:</span> %2$s</h3><p>%3$s</p></div></li>',
			$j + 1,
			esc_html( $s['title'] ),
			nl2br( esc_html( $s['text'] ) )
		);
	}
	return $out . '</ol>';
}

/** Table: header cells, then rows; the first cell of each row is its (bold) row header. */
function gtatx_table_html( array $head, array $rows ) {
	if ( ! $head ) {
		return '';
	}
	$out = '<table class="gtatx-table"><thead><tr>' . implode( '', array_map( fn( $c ) => '<th scope="col">' . esc_html( $c ) . '</th>', $head ) ) . '</tr></thead><tbody>';
	foreach ( $rows as $row ) {
		$row  = array_pad( array_slice( $row, 0, count( $head ) ), count( $head ), '' );
		$out .= '<tr><th scope="row">' . esc_html( array_shift( $row ) ) . '</th>' . implode( '', array_map( fn( $c ) => '<td>' . esc_html( $c ) . '</td>', $row ) ) . '</tr>';
	}
	return $out . '</tbody></table>';
}

/** Getting there in the REST API, for the prototype's data layer. */
add_action(
	'rest_api_init',
	function () {
		register_rest_field( 'tribe_events', 'gtatx_getting_there', array( 'get_callback' => fn( $post ) => gtatx_getting_there( $post['id'] ) ) );
	}
);

/** The same fields in the REST API, so the prototype's data layer can read them (docs/cms-plan.md). */
function gtatx_register_meta() {
	foreach ( array( 'gtatx_show_date' => 'boolean', 'gtatx_author_label' => 'string', 'gtatx_hero_video' => 'string' ) as $key => $type ) {
		register_post_meta( 'post', $key, gtatx_meta_args( $type, 'boolean' === $type ? 'rest_sanitize_boolean' : 'sanitize_text_field' ) );
	}
	foreach ( gtatx_event_field_names() as $name ) {
		register_post_meta( 'tribe_events', 'gtatx_event_' . $name, gtatx_meta_args( 'string', 'sanitize_textarea_field' ) );
	}
}

/**
 * Settings for a field that the REST API can read and write: the value is
 * cleaned on the way in, and only someone who may edit that post can change it.
 */
function gtatx_meta_args( $type, $sanitize ) {
	return array(
		'type'              => $type,
		'single'            => true,
		'show_in_rest'      => true,
		'sanitize_callback' => $sanitize,
		'auth_callback'     => function ( $allowed, $meta_key, $post_id ) {
			return current_user_can( 'edit_post', $post_id );
		},
	);
}
add_action( 'init', 'gtatx_register_meta' );

function gtatx_event_field_names() {
	return array( 'ages', 'registration', 'what_to_bring', 'partners', 'contact', 'accessibility' );
}

/** A field value (ACF if active, else the plain post meta it stores to). */
function gtatx_field( $name, $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$value   = function_exists( 'get_field' ) ? get_field( $name, $post_id ) : get_post_meta( $post_id, $name, true );
	return is_string( $value ) ? trim( $value ) : $value;
}

/* -------------------------------------------------------------------------
 * Blog helpers
 * ---------------------------------------------------------------------- */

/** Minutes to read, at 200 words a minute (the prototype's rule). */
function gtatx_read_minutes( $post_id = null ) {
	$post  = get_post( $post_id );
	$words = str_word_count( wp_strip_all_tags( $post->post_excerpt . ' ' . strip_shortcodes( $post->post_content ) ) );
	return max( 1, (int) round( $words / 200 ) );
}

/**
 * "5 min read  ·  By Get There ATX". The client asked for no date by default;
 * "Updated Oct 2026" is added only when the post's "Show date" is on.
 */
function gtatx_blog_meta( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$parts   = array( sprintf( '%d min read', gtatx_read_minutes( $post_id ) ) );
	if ( gtatx_field( 'gtatx_show_date', $post_id ) ) {
		$parts[] = 'Updated ' . get_the_modified_date( 'M Y', $post_id );
	}
	$by      = gtatx_field( 'gtatx_author_label', $post_id );
	$parts[] = 'By ' . ( $by ? $by : 'Get There ATX' );
	return implode( "\u{00a0} · \u{00a0}", $parts );
}

/** The YouTube id from the hero video link, or ''. */
function gtatx_hero_video_id( $post_id = null ) {
	$url = (string) gtatx_field( 'gtatx_hero_video', $post_id );
	return preg_match( '~(?:youtu\.be/|v=|embed/|shorts/)([\w-]{11})~', $url, $m ) ? $m[1] : '';
}

/**
 * Option B (the regular editor): wrap the text of posts NOT built with
 * Elementor in .gtatx-classic, so blog.css can give headings, lists, images,
 * tables and quotes the Figma styles without touching Elementor-built posts.
 */
function gtatx_wrap_classic_content( $content ) {
	if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	$id = get_the_ID();
	if ( class_exists( '\Elementor\Plugin' ) ) {
		$doc = \Elementor\Plugin::$instance->documents->get( $id );
		if ( $doc && $doc->is_built_with_elementor() ) {
			return $content;
		}
	}
	return '<div class="gtatx-classic">' . $content . '</div>';
}
add_filter( 'the_content', 'gtatx_wrap_classic_content', 20 );

/**
 * blog.css: registered everywhere (our Elementor widgets ask for it wherever
 * they're used, including the Elementor editor), loaded on single posts and
 * events. Everything in it is scoped to our own classes.
 */
function gtatx_register_blog_styles() {
	$file = plugin_dir_path( GTATX_TOOLS_FILE ) . 'css/blog.css';
	wp_register_style( 'gtatx-blog', plugin_dir_url( GTATX_TOOLS_FILE ) . 'css/blog.css', array(), GTATX_TOOLS_VERSION . '-' . filemtime( $file ) );
}
add_action( 'wp_enqueue_scripts', 'gtatx_register_blog_styles', 5 );
add_action( 'elementor/editor/before_enqueue_styles', 'gtatx_register_blog_styles' );

function gtatx_enqueue_blog_styles() {
	if ( is_singular( array( 'post', 'tribe_events' ) ) ) {
		wp_enqueue_style( 'gtatx-blog' );
	}
}
add_action( 'wp_enqueue_scripts', 'gtatx_enqueue_blog_styles', 30 );

/* -------------------------------------------------------------------------
 * Event helpers (The Events Calendar)
 * ---------------------------------------------------------------------- */

/** All the event page's text, with empty values for anything not filled in. */
function gtatx_event_data( $post_id = null ) {
	$id   = $post_id ? $post_id : get_the_ID();
	$tec  = function_exists( 'tribe_get_start_date' );
	$orgs = $tec && function_exists( 'tribe_get_organizer_ids' ) ? array_map( 'get_the_title', tribe_get_organizer_ids( $id ) ) : array();
	$partners = (string) gtatx_field( 'gtatx_event_partners', $id );
	// Hosted by: the first organizer, then the other organizers and the partners field.
	$hosted = $orgs ? array_merge( array( array_shift( $orgs ) ), $orgs ? array( implode( ', ', $orgs ) ) : array() ) : array();
	if ( $partners ) {
		$hosted[] = $partners;
	}
	$bring = array_values( array_filter( array_map( 'trim', preg_split( '/\r?\n/', (string) gtatx_field( 'gtatx_event_what_to_bring', $id ) ) ) ) );
	return array(
		'date'          => $tec ? tribe_get_start_date( $id, false, 'l, F j, Y' ) : '',
		'time'          => $tec && ! tribe_event_is_all_day( $id ) ? tribe_get_start_date( $id, false, 'g:i A' ) . ' – ' . tribe_get_end_date( $id, false, 'g:i A' ) : '',
		'venue'         => $tec ? (string) tribe_get_venue( $id ) : '',
		'address'       => $tec ? trim( implode( ', ', array_filter( array( tribe_get_address( $id ), tribe_get_city( $id ) ) ) ) ) : '',
		'cost'          => $tec ? (string) tribe_get_cost( $id, true ) : '',
		'website'       => $tec ? (string) tribe_get_event_website_url( $id ) : '',
		'ical'          => $tec && function_exists( 'tribe_get_single_ical_link' ) ? tribe_get_single_ical_link( $id ) : '',
		'ages'          => (string) gtatx_field( 'gtatx_event_ages', $id ),
		'registration'  => (string) gtatx_field( 'gtatx_event_registration', $id ),
		'what_to_bring' => $bring,
		'hosted_by'     => implode( "\u{00a0} · \u{00a0}", $hosted ),
		'contact'       => (string) gtatx_field( 'gtatx_event_contact', $id ),
		'accessibility' => (string) gtatx_field( 'gtatx_event_accessibility', $id ),
		'getting_there' => gtatx_getting_there( $id ),
	);
}

/** Up to 3 other upcoming events, for "More events". */
function gtatx_more_events( $post_id = null, $count = 3 ) {
	if ( ! function_exists( 'tribe_get_events' ) ) {
		return array();
	}
	return tribe_get_events(
		array(
			'posts_per_page' => $count,
			'start_date'     => 'now',
			'post__not_in'   => array( $post_id ? $post_id : get_the_ID() ),
		)
	);
}

/** Up to 3 other posts that share a category, newest first ("Keep reading"). */
function gtatx_related_posts( $post_id = null, $count = 3 ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$cats    = wp_get_post_categories( $post_id );
	return $cats ? get_posts( array( 'category__in' => $cats, 'post__not_in' => array( $post_id ), 'posts_per_page' => $count ) ) : array();
}

/**
 * Elementor Loop Grid "Query ID"s used by the templates:
 *   gtatx_related_posts     Keep reading: posts sharing a category with this one.
 *   gtatx_upcoming_events   More events: the next upcoming events, not this one.
 */
add_action(
	'elementor/query/gtatx_related_posts',
	function ( $query ) {
		$id = get_queried_object_id();
		$query->set( 'post_type', 'post' );
		$query->set( 'category__in', $id ? wp_get_post_categories( $id ) : array() );
		$query->set( 'post__not_in', array( $id ) );
		$query->set( 'posts_per_page', 3 );
	}
);
add_action(
	'elementor/query/gtatx_upcoming_events',
	function ( $query ) {
		$query->set( 'post_type', 'tribe_events' );
		$query->set( 'post__not_in', array( get_queried_object_id() ) );
		$query->set( 'posts_per_page', 3 );
		$query->set( 'meta_key', '_EventStartDate' );
		$query->set( 'orderby', 'meta_value' );
		$query->set( 'order', 'ASC' );
		$query->set( 'meta_query', array( array( 'key' => '_EventEndDate', 'value' => current_time( 'mysql' ), 'compare' => '>=', 'type' => 'DATETIME' ) ) );
	}
);

/**
 * Hide empty optional parts of the Elementor event and blog templates.
 * Give an Elementor container the CSS class `gtatx-if-<part>` (Advanced →
 * CSS Classes) and it disappears when that part is empty, e.g.
 * gtatx-if-what_to_bring, gtatx-if-hosted_by, gtatx-if-accessibility,
 * gtatx-if-getting_there, gtatx-if-cost, gtatx-if-ages, gtatx-if-registration,
 * gtatx-if-website, gtatx-if-more_events, gtatx-if-related (blog Keep reading),
 * gtatx-if-hero_video / gtatx-if-no_hero_video (blog hero: video or featured image).
 */
function gtatx_should_render( $should_render, $element ) {
	$classes = (string) $element->get_settings( '_css_classes' );
	if ( ! $should_render || false === strpos( $classes, 'gtatx-if-' ) || ! preg_match( '/gtatx-if-([a-z_]+)/', $classes, $m ) ) {
		return $should_render;
	}
	$id = get_the_ID();
	if ( 'more_events' === $m[1] ) {
		return (bool) gtatx_more_events( $id );
	}
	if ( 'related' === $m[1] ) {
		return (bool) gtatx_related_posts( $id );
	}
	if ( 'hero_video' === $m[1] || 'no_hero_video' === $m[1] ) {
		return ( '' !== gtatx_hero_video_id( $id ) ) === ( 'hero_video' === $m[1] );
	}
	if ( 'tribe_events' !== get_post_type( $id ) ) {
		return $should_render;
	}
	$e = gtatx_event_data( $id );
	if ( 'hosted_by' === $m[1] ) {
		return '' !== $e['hosted_by'] . $e['contact'];
	}
	return isset( $e[ $m[1] ] ) ? ! empty( $e[ $m[1] ] ) : $should_render;
}
foreach ( array( 'container', 'widget', 'section', 'column' ) as $gtatx_type ) {
	add_filter( "elementor/frontend/{$gtatx_type}/should_render", 'gtatx_should_render', 10, 2 );
}
unset( $gtatx_type );

/* -------------------------------------------------------------------------
 * External resources: links to other sites (CapMetro, DriveTexas, …) that
 * show as ↗ rows in the Resources directory. No page of their own.
 * In the prototype: src/content/resources.json (schema Resource).
 * ---------------------------------------------------------------------- */

function gtatx_register_resource_type() {
	register_post_type(
		'gtatx_resource',
		array(
			'labels'       => array(
				'name'          => 'External resources',
				'singular_name' => 'External resource',
				'add_new_item'  => 'Add external resource',
				'edit_item'     => 'Edit external resource',
				'menu_name'     => 'External resources',
			),
			'description'  => 'Links to other sites, shown in the Resources directory.',
			'public'       => false,
			'show_ui'      => true,
			'show_in_rest' => true,
			'menu_icon'    => 'dashicons-external',
			'supports'     => array( 'title', 'revisions' ),
		)
	);
	foreach ( array( 'url', 'provider', 'action', 'one_liner', 'last_checked' ) as $key ) {
		register_post_meta( 'gtatx_resource', 'gtatx_' . $key, gtatx_meta_args( 'string', 'url' === $key ? 'esc_url_raw' : 'sanitize_text_field' ) );
	}
}
add_action( 'init', 'gtatx_register_resource_type' );

/** The directory's filter values (src/content/taxonomies.ts). */
function gtatx_directory_choices() {
	return array(
		'modes'     => array( 'walk' => 'Walk', 'bike' => 'Bike', 'bus' => 'Bus', 'rail' => 'Rail', 'carpool' => 'Carpool', 'drive' => 'Drive' ),
		'needs'     => array( 'plan-route' => 'Plan a route', 'check-conditions' => 'Check conditions', 'learn-how' => 'Learn how', 'join-program' => 'Join a program', 'save-money' => 'Save money' ),
		'audiences' => array( 'everyone' => 'Everyone', 'commuter' => 'Commuter', 'student' => 'University Student', 'visitor' => 'Visiting Austin', 'family' => 'Families', 'senior' => 'Seniors', 'new-to-transit' => 'New to transit', 'accessibility' => 'Accessibility' ),
	);
}

function gtatx_register_resource_fields() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}
	acf_add_local_field_group(
		array(
			'key'      => 'group_gtatx_resource',
			'title'    => 'Link',
			'fields'   => array(
				array( 'key' => 'field_gtatx_url', 'name' => 'gtatx_url', 'label' => 'Web address', 'type' => 'url', 'required' => 1 ),
				array( 'key' => 'field_gtatx_provider', 'name' => 'gtatx_provider', 'label' => 'Who runs it', 'type' => 'text', 'required' => 1, 'placeholder' => 'CapMetro' ),
				array( 'key' => 'field_gtatx_action', 'name' => 'gtatx_action', 'label' => 'Button text', 'type' => 'text', 'required' => 1, 'instructions' => 'Start with a verb: "Find a carpool partner".' ),
				array( 'key' => 'field_gtatx_one_liner', 'name' => 'gtatx_one_liner', 'label' => 'What you’ll find there', 'type' => 'text', 'required' => 1, 'instructions' => '15 words or fewer.' ),
				array( 'key' => 'field_gtatx_last_checked', 'name' => 'gtatx_last_checked', 'label' => 'Link last checked', 'type' => 'date_picker', 'return_format' => 'Y-m-d' ),
			),
			'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'gtatx_resource' ) ) ),
		)
	);
	// Directory filters, on external resources and blog posts (so blogs show under the same filters).
	$fields = array();
	foreach ( gtatx_directory_choices() as $name => $choices ) {
		$fields[] = array(
			'key'     => 'field_gtatx_' . $name,
			'name'    => 'gtatx_' . $name,
			'label'   => array( 'modes' => 'Ways of getting around', 'needs' => 'Helps people…', 'audiences' => 'For who?' )[ $name ],
			'type'    => 'checkbox',
			'choices' => $choices,
			'layout'  => 'horizontal',
		);
	}
	acf_add_local_field_group(
		array(
			'key'      => 'group_gtatx_directory',
			'title'    => 'Resources directory filters',
			'fields'   => $fields,
			'location' => array(
				array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'gtatx_resource' ) ),
				array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'post' ) ),
			),
		)
	);
}
add_action( 'acf/init', 'gtatx_register_resource_fields' );

/* -------------------------------------------------------------------------
 * Post body blocks (Option B, the "fill in the boxes" way to write a post).
 * An ACF PRO Flexible Content field: Add block → pick a type → type into its
 * boxes → drag to reorder. The blocks are laid out in the Figma styles after
 * the post's text (blog.css, .gtatx-classic), so the layout can't go wrong.
 * Same blocks as the Elementor starter and the prototype's PostBlock.
 * ---------------------------------------------------------------------- */

function gtatx_register_body_blocks() {
	// Flexible Content is an ACF PRO field type; without PRO the box doesn't appear
	// (blocks already saved still show on the page, see gtatx_body_blocks()).
	if ( ! function_exists( 'acf_add_local_field_group' ) || ! function_exists( 'acf_get_field_type' ) || ! acf_get_field_type( 'flexible_content' ) ) {
		return;
	}
	$f = function ( $name, $label, $type = 'text', $extra = array() ) {
		return array_merge( array( 'key' => 'field_gtatx_b_' . $name, 'name' => $name, 'label' => $label, 'type' => $type ), $extra );
	};
	$layout = function ( $name, $label, $fields ) {
		return array( 'key' => 'layout_gtatx_' . $name, 'name' => $name, 'label' => $label, 'display' => 'block', 'sub_fields' => $fields );
	};
	// Field keys must be unique per layout.
	$k = function ( $prefix, array $fields ) {
		foreach ( $fields as &$field ) {
			$field['key'] = 'field_gtatx_b_' . $prefix . '_' . $field['name'];
			if ( ! empty( $field['sub_fields'] ) ) {
				foreach ( $field['sub_fields'] as &$sub ) {
					$sub['key'] = $field['key'] . '_' . $sub['name'];
				}
			}
		}
		return $fields;
	};

	acf_add_local_field_group(
		array(
			'key'          => 'group_gtatx_body',
			'title'        => 'Post body blocks',
			'menu_order'   => 0,
			'instructions' => '',
			'fields'       => array(
				array(
					'key'          => 'field_gtatx_body',
					'name'         => 'gtatx_body',
					'label'        => 'Post body',
					'type'         => 'flexible_content',
					'button_label' => 'Add block',
					'instructions' => 'Add blocks in the order readers should see them; drag to reorder. They appear after anything typed in the editor above. Preview to see the final look.',
					'layouts'      => array(
						$layout( 'heading', 'Section heading', $k( 'heading', array( $f( 'text', 'Heading' ) ) ) ),
						$layout( 'paragraph', 'Paragraph', $k( 'paragraph', array( $f( 'text', 'Text', 'wysiwyg', array( 'toolbar' => 'basic', 'media_upload' => 0, 'tabs' => 'visual' ) ) ) ) ),
						$layout( 'tip', 'Tip', $k( 'tip', array( $f( 'label', 'Label', 'text', array( 'placeholder' => 'Tip' ) ), $f( 'text', 'Tip', 'textarea', array( 'rows' => 3 ) ) ) ) ),
						$layout(
							'steps',
							'Steps',
							$k(
								'steps',
								array(
									$f(
										'items',
										'Steps',
										'repeater',
										array(
											'button_label' => 'Add step',
											'layout'       => 'block',
											'sub_fields'   => array( $f( 'title', 'Step title' ), $f( 'text', 'What to do', 'textarea', array( 'rows' => 2 ) ) ),
										)
									),
								)
							)
						),
						$layout(
							'facts',
							'Facts strip',
							$k(
								'facts',
								array(
									$f(
										'items',
										'Facts',
										'repeater',
										array(
											'button_label' => 'Add fact',
											'layout'       => 'table',
											'sub_fields'   => array( $f( 'label', 'Label', 'text', array( 'placeholder' => 'Hours' ) ), $f( 'value', 'Value', 'text', array( 'placeholder' => 'Open 24/7' ) ) ),
										)
									),
								)
							)
						),
						$layout( 'image', 'Image', $k( 'image', array( $f( 'image', 'Image', 'image', array( 'return_format' => 'id' ) ), $f( 'caption', 'Caption' ) ) ) ),
						$layout(
							'table',
							'Table',
							$k(
								'table',
								array(
									$f(
										'rows',
										'Table',
										'textarea',
										array(
											'rows'         => 5,
											'instructions' => 'One row per line, cells separated by | . The first line is the header. Example: Route | Where | How often',
										)
									),
								)
							)
						),
						$layout( 'button', 'Button', $k( 'button', array( $f( 'label', 'Button text' ), $f( 'link', 'Link', 'url' ) ) ) ),
					),
				),
			),
			'location'     => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'post' ) ) ),
		)
	);
}
add_action( 'acf/init', 'gtatx_register_body_blocks' );

/**
 * The post's body blocks, read straight from post meta in ACF's storage format
 * (gtatx_body = layout names; gtatx_body_{i}_{field}; repeaters …_{j}_{sub}),
 * so they show on the page whether or not ACF PRO is active.
 */
function gtatx_body_blocks( $post_id ) {
	$names  = get_post_meta( $post_id, 'gtatx_body', true );
	$blocks = array();
	if ( ! is_array( $names ) ) {
		return $blocks;
	}
	foreach ( array_values( $names ) as $i => $name ) {
		$get   = fn( $field ) => get_post_meta( $post_id, "gtatx_body_{$i}_{$field}", true );
		$block = array( 'type' => $name );
		foreach ( array( 'text', 'label', 'image', 'caption', 'rows', 'link' ) as $field ) {
			$block[ $field ] = $get( $field );
		}
		$block['items'] = array();
		for ( $j = 0, $n = (int) $get( 'items' ); $j < $n; $j++ ) {
			$block['items'][] = array(
				'title' => $get( "items_{$j}_title" ),
				'text'  => $get( "items_{$j}_text" ),
				'label' => $get( "items_{$j}_label" ),
				'value' => $get( "items_{$j}_value" ),
			);
		}
		$blocks[] = $block;
	}
	return $blocks;
}

/** One block as HTML, in the markup blog.css styles (.gtatx-classic). */
function gtatx_render_body_block( $b ) {
	switch ( $b['type'] ) {
		case 'heading':
			return '<h2>' . esc_html( $b['text'] ) . '</h2>';
		case 'paragraph':
			return wpautop( wp_kses_post( $b['text'] ) );
		case 'tip':
			return sprintf( '<blockquote data-label="%s"><p>%s</p></blockquote>', esc_attr( $b['label'] ? $b['label'] : 'Tip' ), nl2br( esc_html( $b['text'] ) ) );
		case 'steps':
			return gtatx_steps_html( $b['items'] );
		case 'facts':
			return gtatx_facts_html( array_map( fn( $f ) => array( 'label' => $f['label'], 'details' => $f['value'] ), $b['items'] ) );
		case 'image':
			$img = $b['image'] ? wp_get_attachment_image( (int) $b['image'], 'full' ) : '';
			return $img ? '<figure>' . $img . ( $b['caption'] ? '<figcaption>' . esc_html( $b['caption'] ) . '</figcaption>' : '' ) . '</figure>' : '';
		case 'table':
			$lines = array_values( array_filter( array_map( 'trim', preg_split( '/\r?\n/', (string) $b['rows'] ) ) ) );
			if ( ! $lines ) {
				return '';
			}
			$cells = fn( $line ) => array_map( 'trim', explode( '|', $line ) );
			$head  = $cells( array_shift( $lines ) );
			return gtatx_table_html( $head, array_map( $cells, $lines ) );
		case 'button':
			return $b['label'] && $b['link'] ? sprintf( '<p><a class="button" href="%s">%s</a></p>', esc_url( $b['link'] ), esc_html( $b['label'] ) ) : '';
	}
	return '';
}

/** Add the blocks after the post's text (before the .gtatx-classic wrapper at priority 20). */
function gtatx_append_body_blocks( $content ) {
	if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	// A password-protected post shows only the password form until it is unlocked.
	if ( post_password_required() ) {
		return $content;
	}
	$html = implode( "\n", array_map( 'gtatx_render_body_block', gtatx_body_blocks( get_the_ID() ) ) );
	return $content . $html;
}
add_filter( 'the_content', 'gtatx_append_body_blocks', 15 );

/* -------------------------------------------------------------------------
 * Page addresses (Joy, 2026-11-12): blogs at /guides/<name>/, community
 * events at /community/events/<name>/, matching the prototype.
 *
 * OFF until the option gtatx_new_addresses is turned on, so uploading the
 * plugin never changes the live site's addresses. At launch:
 *   1. Settings → Permalinks → Custom structure: /guides/%postname%/
 *      (WordPress then sends old /<name>/ links to the new address by itself,
 *      a 301 "guess" redirect; a Redirection rule list is the belt-and-braces.)
 *   2. Turn on the event addresses: wp option update gtatx_new_addresses 1
 *      (old /event/<name>/ links redirect to /community/events/<name>/).
 *   3. Settings → Permalinks → Save once more, so WordPress picks up the rules.
 * ---------------------------------------------------------------------- */

function gtatx_new_addresses_on() {
	return (bool) get_option( 'gtatx_new_addresses' );
}

/** /community/events/<name>/ opens that event. */
add_action(
	'init',
	function () {
		if ( gtatx_new_addresses_on() ) {
			add_rewrite_rule( '^community/events/([^/]+)/?$', 'index.php?post_type=tribe_events&tribe_events=$matches[1]&name=$matches[1]', 'top' );
		}
	},
	20
);

/** Events link to their new address everywhere (lists, cards, the REST API, sitemaps). */
add_filter(
	'post_type_link',
	function ( $link, $post ) {
		if ( gtatx_new_addresses_on() && 'tribe_events' === $post->post_type && $post->post_name && 'publish' === $post->post_status ) {
			return home_url( '/community/events/' . $post->post_name . '/' );
		}
		return $link;
	},
	20,
	2
);

/** Old /event/<name>/ addresses (and anything else not canonical) move permanently to the new one. */
add_action(
	'template_redirect',
	function () {
		if ( ! gtatx_new_addresses_on() || ! is_singular( 'tribe_events' ) ) {
			return;
		}
		$want = wp_parse_url( get_permalink(), PHP_URL_PATH );
		$have = wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '', PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		if ( $want && $have && untrailingslashit( $want ) !== untrailingslashit( $have ) ) {
			wp_safe_redirect( get_permalink(), 301 );
			exit;
		}
	}
);

/**
 * Old blog links (getthereatx.com/<name>/) after the switch to /guides/<name>/:
 * WordPress reads /<name>/ as a page, finds none and shows "not found". If a
 * published post has that name, send the visitor there for good (301).
 * Only while the blog addresses start with /guides/.
 */
add_action(
	'template_redirect',
	function () {
		if ( ! is_404() || 0 !== strpos( (string) get_option( 'permalink_structure' ), '/guides/' ) ) {
			return;
		}
		$path = trim( (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '', PHP_URL_PATH ), '/' ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		if ( '' === $path || false !== strpos( $path, '/' ) ) {
			return; // only single-segment addresses were blog posts
		}
		$post = get_page_by_path( sanitize_title( $path ), OBJECT, 'post' );
		if ( $post && 'publish' === $post->post_status ) {
			wp_safe_redirect( get_permalink( $post ), 301 );
			exit;
		}
	},
	5
);
