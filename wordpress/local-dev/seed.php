<?php
/**
 * LOCAL TESTING ONLY. Loads the GetThereATX content into the local WordPress
 * (http://localhost:8888) so the CMS can be tried the way the client will use it.
 *
 *   npm run seed:wp        (from the prototype folder; safe to run again)
 *
 * What it makes (everything marked with the meta key _gtatx_seed, so a rerun
 * updates instead of duplicating):
 *   - The 4 blog categories and the 16 getthereatx.com posts, written in the
 *     regular editor (Option B), with featured images and directory filters.
 *   - "[Sample] Option A" (built in Elementor from the blog starter) and
 *     "[Sample] Option B" (every regular-editor style, with the date turned on).
 *   - The 2 community events in The Events Calendar, with venues and organizers,
 *     plus "[Sample] Event with every field".
 *   - The external resources.
 *   - The Elementor templates (starter, blocks), and with Elementor Pro the
 *     Theme Builder templates with their display conditions (local only).
 *
 * Never run this against the live site.
 */

if ( ! defined( 'WP_CLI' ) ) {
	exit;
}
if ( false === strpos( home_url(), 'localhost' ) ) {
	WP_CLI::error( 'Refusing to seed: this is not the local site (' . home_url() . ').' );
}

require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';

$gtatx_dir    = WP_CONTENT_DIR . '/gtatx-local-dev';
// wp eval-file runs this inside a function, so shared paths are constants, not globals.
defined( 'GTATX_SEED_PUBLIC' ) || define( 'GTATX_SEED_PUBLIC', WP_CONTENT_DIR . '/gtatx-public' );
$gtatx_tpl    = WP_CONTENT_DIR . '/uploads/gtatx-sample';
$gtatx_data   = json_decode( file_get_contents( $gtatx_dir . '/seed-data.json' ), true );
wp_set_current_user( 1 );

/** A seeded item by its key, or 0. */
function gtatx_seed_find( $key, $type ) {
	$found = get_posts( array( 'post_type' => $type, 'post_status' => 'any', 'meta_key' => '_gtatx_seed', 'meta_value' => $key, 'fields' => 'ids', 'numberposts' => 1 ) );
	return $found ? (int) $found[0] : 0;
}

/** Insert or update a seeded post. */
function gtatx_seed_post( $key, $args ) {
	$id = gtatx_seed_find( $key, $args['post_type'] );
	if ( $id ) {
		$args['ID'] = $id;
	}
	$id = wp_insert_post( wp_slash( $args ), true );
	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( $key . ': ' . $id->get_error_message() );
		return 0;
	}
	update_post_meta( $id, '_gtatx_seed', $key );
	return $id;
}

/** A /public image in the Media Library (once), returns its attachment id. */
function gtatx_seed_image( $src, $alt = '' ) {
	$found = get_posts( array( 'post_type' => 'attachment', 'meta_key' => '_gtatx_seed_src', 'meta_value' => $src, 'fields' => 'ids', 'numberposts' => 1 ) );
	if ( $found ) {
		return (int) $found[0];
	}
	$file = GTATX_SEED_PUBLIC . $src;
	if ( ! file_exists( $file ) ) {
		WP_CLI::warning( "missing image $src" );
		return 0;
	}
	$tmp = wp_tempnam( basename( $file ) );
	copy( $file, $tmp );
	$id = media_handle_sideload( array( 'name' => basename( $file ), 'tmp_name' => $tmp ), 0 );
	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( "$src: " . $id->get_error_message() );
		return 0;
	}
	update_post_meta( $id, '_gtatx_seed_src', $src );
	update_post_meta( $id, '_wp_attachment_image_alt', $alt );
	return $id;
}

/** Image placeholders in post HTML ({{img:/images/…}}) → Media Library URLs. */
function gtatx_seed_images_in( $html ) {
	return preg_replace_callback(
		'/\{\{img:([^}]+)\}\}/',
		fn( $m ) => (string) wp_get_attachment_url( gtatx_seed_image( $m[1] ) ),
		$html
	);
}

function gtatx_seed_field( $name, $value, $id ) {
	if ( function_exists( 'update_field' ) ) {
		update_field( $name, $value, $id );
	} else {
		update_post_meta( $id, $name, $value );
	}
}

// ---------- site settings (local only) ----------
// Austin time, like the live site, so event times and "Updated" dates are right.
update_option( 'timezone_string', 'America/Chicago' );
update_option( 'gmt_offset', '' );
// The new page addresses (local only; a launch step on the live site, see content.php):
// blogs at /guides/<name>/, events at /community/events/<name>/.
update_option( 'permalink_structure', '/guides/%postname%/' );
update_option( 'gtatx_new_addresses', 1 );

// ---------- local page stand-ins ----------
// The event pages' "Back to Community" link needs a /community/ page. On the
// live site that's the real Community page (Elementor, a later step).
gtatx_seed_post(
	'page:community',
	array(
		'post_type'    => 'page',
		'post_status'  => 'publish',
		'post_name'    => 'community',
		'post_title'   => 'Community',
		'post_content' => '<p>Local stand-in for the Community page (the Elementor version is a later step). <a href="/event/">Events</a></p>',
	)
);

// ---------- categories ----------
$gtatx_cat_ids = array();
foreach ( $gtatx_data['categories'] as $cat ) {
	$term = get_term_by( 'slug', $cat['slug'], 'category' );
	$term = $term ? $term : (object) wp_insert_term( $cat['name'], 'category', array( 'slug' => $cat['slug'] ) );
	$gtatx_cat_ids[ $cat['slug'] ] = (int) ( $term->term_id ?? $term->{'term_id'} );
}
WP_CLI::log( count( $gtatx_cat_ids ) . ' categories' );

// ---------- blog posts (Option B) ----------
foreach ( $gtatx_data['posts'] as $p ) {
	$id = gtatx_seed_post(
		'post:' . $p['slug'],
		array(
			'post_type'     => 'post',
			'post_status'   => 'publish',
			'post_name'     => $p['slug'],
			'post_title'    => $p['title'],
			'post_excerpt'  => $p['excerpt'],
			'post_content'  => gtatx_seed_images_in( $p['content'] ),
			'post_date'     => empty( $p['date'] ) ? '' : $p['date'] . ' 09:00:00',
			'post_category' => array_map( fn( $s ) => $gtatx_cat_ids[ $s ], $p['categories'] ),
		)
	);
	if ( $id && $p['image'] ) {
		set_post_thumbnail( $id, gtatx_seed_image( $p['image']['src'], $p['image']['alt'] ) );
	}
	gtatx_seed_field( 'gtatx_hero_video', $p['heroVideo'], $id );
	foreach ( array( 'modes', 'needs', 'audiences' ) as $f ) {
		gtatx_seed_field( 'gtatx_' . $f, $p[ $f ], $id );
	}
}
WP_CLI::log( count( $gtatx_data['posts'] ) . ' blog posts' );

// ---------- Option B sample: every regular-editor style ----------
$gtatx_img = wp_get_attachment_url( gtatx_seed_image( '/images/home/first-bus-ride.jpg', 'A blue CapMetro bus on a downtown Austin street' ) );
$gtatx_b   = gtatx_seed_post(
	'post:sample-option-b',
	array(
		'post_type'     => 'post',
		'post_status'   => 'publish',
		'post_name'     => 'sample-option-b',
		'post_title'    => '[Sample] Written in the regular editor (Option B)',
		'post_excerpt'  => 'A one or two sentence summary that tells readers what they will learn and why it matters.',
		'post_category' => array( $gtatx_cat_ids['take-transit'] ),
		'post_content'  => implode(
			"\n",
			array(
				'<h2>Section heading</h2>',
				'<p>Body paragraph. Keep it short and friendly, with one idea per paragraph so people can scan it quickly. Explain unfamiliar words the first time you use them.</p>',
				'<blockquote><p>A helpful reminder, safety note, or insider tip that is worth pulling out of the main text. (In the editor: the quote button.)</p></blockquote>',
				'<h2>How it works</h2>',
				'<ol><li>Find a station</li><li>Unlock a bike</li><li>Ride to your stop</li><li>Return it</li></ol>',
				'[caption width="1200" align="alignnone"]<img src="' . esc_url( $gtatx_img ) . '" alt="A blue CapMetro bus on a downtown Austin street" width="1200" /> Caption describing the image[/caption]',
				'<h2>Section heading</h2>',
				'<table><thead><tr><th>Column one</th><th>Column two</th><th>Column three</th></tr></thead><tbody><tr><td>Row label</td><td>Detail text</td><td>Detail text</td></tr><tr><td>Row label</td><td>Detail text</td><td>Detail text</td></tr></tbody></table>',
				'<p><a class="button" href="/plan-your-trip/">Primary action</a></p>',
			)
		),
	)
);
set_post_thumbnail( $gtatx_b, gtatx_seed_image( '/images/home/first-bus-ride.jpg', 'A blue CapMetro bus on a downtown Austin street' ) );
gtatx_seed_field( 'gtatx_show_date', 1, $gtatx_b ); // shows the "Updated" date, to try the switch

// ---------- Option B with Post body blocks (ACF PRO Flexible Content) ----------
/**
 * Save blocks in ACF's own storage format, so they show on the page now and are
 * editable in the "Post body" box once ACF PRO is active.
 */
function gtatx_seed_blocks( $post_id, array $blocks ) {
	foreach ( get_post_meta( $post_id ) as $key => $unused ) {
		if ( 0 === strpos( $key, 'gtatx_body' ) || 0 === strpos( $key, '_gtatx_body' ) ) {
			delete_post_meta( $post_id, $key );
		}
	}
	$names = array();
	foreach ( $blocks as $i => $b ) {
		$type    = $b['type'];
		$names[] = $type;
		foreach ( $b as $field => $value ) {
			if ( 'type' === $field ) {
				continue;
			}
			$key = "gtatx_body_{$i}_{$field}";
			$ref = "field_gtatx_b_{$type}_{$field}";
			if ( 'items' === $field ) {
				update_post_meta( $post_id, $key, count( $value ) );
				update_post_meta( $post_id, "_$key", $ref );
				foreach ( $value as $j => $item ) {
					foreach ( $item as $sub => $v ) {
						update_post_meta( $post_id, "{$key}_{$j}_{$sub}", $v );
						update_post_meta( $post_id, "_{$key}_{$j}_{$sub}", "{$ref}_{$sub}" );
					}
				}
				continue;
			}
			update_post_meta( $post_id, $key, $value );
			update_post_meta( $post_id, "_$key", $ref );
		}
	}
	update_post_meta( $post_id, 'gtatx_body', $names );
	update_post_meta( $post_id, '_gtatx_body', 'field_gtatx_body' );
}

$gtatx_blocks_post = gtatx_seed_post(
	'post:sample-post-body-blocks',
	array(
		'post_type'     => 'post',
		'post_status'   => 'publish',
		'post_name'     => 'sample-post-body-blocks',
		'post_title'    => '[Sample] Written with Post body blocks (Option B)',
		'post_excerpt'  => 'A one or two sentence summary that tells readers what they will learn and why it matters.',
		'post_category' => array( $gtatx_cat_ids['biking-austin'] ),
		'post_content'  => '',
	)
);
set_post_thumbnail( $gtatx_blocks_post, gtatx_seed_image( '/images/home/first-bus-ride.jpg', 'A blue CapMetro bus on a downtown Austin street' ) );
// Figma's placeholder text, block for block.
gtatx_seed_blocks(
	$gtatx_blocks_post,
	array(
		array( 'type' => 'facts', 'items' => array( array( 'label' => 'Stations', 'value' => '75+ across Austin' ), array( 'label' => 'Hours', 'value' => 'Open 24/7' ), array( 'label' => 'Bikes', 'value' => '100% electric' ) ) ),
		array( 'type' => 'heading', 'text' => 'Section heading' ),
		array( 'type' => 'paragraph', 'text' => 'Body paragraph. Keep it short and friendly, with one idea per paragraph so people can scan it quickly. Explain unfamiliar words the first time you use them.' ),
		array( 'type' => 'tip', 'label' => 'Tip', 'text' => 'A helpful reminder, safety note, or insider tip that is worth pulling out of the main text.' ),
		array( 'type' => 'heading', 'text' => 'How it works' ),
		array(
			'type'  => 'steps',
			'items' => array(
				array( 'title' => 'Find a station', 'text' => 'Open the map or app to see nearby bikes and open docks.' ),
				array( 'title' => 'Unlock a bike', 'text' => 'Scan the code or enter your account details at the dock.' ),
				array( 'title' => 'Ride to your stop', 'text' => 'Use bike lanes and trails when you can, and follow traffic signals.' ),
				array( 'title' => 'Return it', 'text' => 'Dock the bike at any open station and check that it locked.' ),
			),
		),
		array( 'type' => 'image', 'image' => gtatx_seed_image( '/images/home/first-bus-ride.jpg', 'A blue CapMetro bus on a downtown Austin street' ), 'caption' => 'Caption describing the image' ),
		array( 'type' => 'heading', 'text' => 'Section heading' ),
		array( 'type' => 'table', 'rows' => "Column one | Column two | Column three\nRow label | Detail text | Detail text\nRow label | Detail text | Detail text\nRow label | Detail text | Detail text" ),
		array( 'type' => 'button', 'label' => 'Primary action', 'link' => home_url( '/plan-your-trip/' ) ),
	)
);

// ---------- Elementor templates ----------
if ( class_exists( '\Elementor\Plugin' ) ) {
	$gtatx_source = \Elementor\Plugin::$instance->templates_manager->get_source( 'local' );

	/** Import one template file (replacing an earlier seeded copy); returns its id. */
	$import = function ( $file, $replace = array() ) use ( $gtatx_source, $gtatx_tpl ) {
		$json = file_get_contents( "$gtatx_tpl/$file" );
		$data = json_decode( $json, true );
		foreach ( get_posts( array( 'post_type' => 'elementor_library', 'post_status' => 'any', 'title' => $data['title'], 'fields' => 'ids', 'numberposts' => -1 ) ) as $old ) {
			wp_delete_post( $old, true );
		}
		$tmp = wp_tempnam( $file ) . '.json';
		file_put_contents( $tmp, strtr( $json, $replace ) );
		$result = $gtatx_source->import_template( $file, $tmp );
		if ( is_wp_error( $result ) ) {
			WP_CLI::warning( "$file: " . $result->get_error_message() );
			return 0;
		}
		return (int) $result[0]['template_id'];
	};

	$starter = $import( 'blog-starter.json' );
	foreach ( glob( "$gtatx_tpl/block-*.json" ) as $block ) {
		$import( basename( $block ) );
	}
	WP_CLI::log( 'Elementor: blog starter and blocks imported (Templates → Saved Templates)' );

	// Option A sample: a post whose body is the starter, built in Elementor.
	$gtatx_a = gtatx_seed_post(
		'post:sample-option-a',
		array(
			'post_type'     => 'post',
			'post_status'   => 'publish',
			'post_name'     => 'sample-option-a',
			'post_title'    => '[Sample] Built in Elementor (Option A)',
			'post_excerpt'  => 'A one or two sentence summary that tells readers what they will learn and why it matters.',
			'post_category' => array( $gtatx_cat_ids['biking-austin'] ),
			'post_content'  => '',
		)
	);
	if ( $starter && $gtatx_a ) {
		set_post_thumbnail( $gtatx_a, gtatx_seed_image( '/images/home/first-bus-ride.jpg', 'A blue CapMetro bus on a downtown Austin street' ) );
		update_post_meta( $gtatx_a, '_elementor_edit_mode', 'builder' ); // "Edit with Elementor"
		$doc = \Elementor\Plugin::$instance->documents->get( $gtatx_a, false );
		$doc->save( array( 'elements' => \Elementor\Plugin::$instance->documents->get( $starter )->get_elements_data() ) );
	}

	// Theme Builder templates need Elementor Pro.
	if ( defined( 'ELEMENTOR_PRO_VERSION' ) ) {
		$loops = array(
			'__LOOP_RELATED__' => (string) $import( 'loop-item-related-card.json' ),
			'__LOOP_EVENT__'   => (string) $import( 'loop-item-event-card.json' ),
		);
		$conditions = array(
			'single-post.json'  => 'include/singular/post',
			'single-event.json' => 'include/singular/tribe_events',
		);
		foreach ( $conditions as $file => $condition ) {
			$tid = $import( $file, $loops );
			// Local only: on the live site, display conditions are set by hand at launch.
			update_post_meta( $tid, '_elementor_conditions', array( $condition ) );
		}
		$theme_builder = \ElementorPro\Modules\ThemeBuilder\Module::instance();
		$theme_builder->get_conditions_manager()->get_cache()->regenerate();
		WP_CLI::log( 'Elementor Pro: Single Post, Single Event and the two cards imported, conditions set (local only)' );
	} else {
		WP_CLI::log( 'Elementor Pro is not installed: blog posts and events use the local preview templates instead (wordpress/local-dev/TESTING.md).' );
	}
}

// ---------- events (The Events Calendar) ----------
if ( function_exists( 'tribe_events' ) ) {
	/** "1216 Webberville Rd, Austin, TX 78721" → street, city, state, zip. */
	$address = function ( $text ) {
		$parts = array_map( 'trim', explode( ',', $text ) );
		preg_match( '/([A-Z]{2})\s*(\d{5})?/', end( $parts ), $sz );
		return array(
			'address'  => $parts[0],
			'city'     => $parts[1] ?? '',
			'state'    => $sz[1] ?? '',
			'zip'      => $sz[2] ?? '',
			'country'  => 'United States',
		);
	};
	$linked = function ( $type, $key, $args ) {
		$id = gtatx_seed_find( $key, $type );
		if ( ! $id ) {
			$repo = 'tribe_venue' === $type ? tribe_venues() : tribe_organizers();
			$post = $repo->set_args( $args )->create();
			$id   = $post ? $post->ID : 0;
			update_post_meta( $id, '_gtatx_seed', $key );
		}
		return $id;
	};

	$all = $gtatx_data['events'];
	$all[] = array(
		'slug'        => 'sample-event',
		'title'       => '[Sample] Event with every field',
		'description' => 'Description',
		'start'       => '2026-12-05 13:00:00',
		'end'         => '2026-12-05 16:00:00',
		'venue'       => array( 'name' => 'Central Austin Public Library', 'address' => '710 W Cesar Chavez St, Austin, TX 78701' ),
		'image'       => array( 'src' => '/images/home/first-bus-ride.jpg', 'alt' => 'A blue CapMetro bus on a downtown Austin street' ),
		'url'         => 'https://www.getthereatx.com/',
		'cost'        => 'Free or price',
		'organizer'   => 'Organizer name',
		'partners'    => 'Partner names',
		'sample'      => true,
	);
	foreach ( $all as $e ) {
		$key   = 'event:' . $e['slug'];
		$venue = $linked( 'tribe_venue', 'venue:' . $e['venue']['name'], array( 'venue' => $e['venue']['name'] ) + $address( $e['venue']['address'] ) );
		$org   = $e['organizer'] ? $linked( 'tribe_organizer', 'organizer:' . $e['organizer'], array( 'organizer' => $e['organizer'] ) ) : 0;
		$args  = array(
			'title'       => $e['title'],
			'excerpt'     => $e['description'],
			'description' => $e['description'],
			'status'      => 'publish',
			'start_date'  => $e['start'],
			'end_date'    => $e['end'],
			'timezone'    => 'America/Chicago',
			'venue'       => $venue,
			'organizer'   => $org ? array( $org ) : array(),
			'cost'        => $e['cost'],
			'url'         => $e['url'],
		);
		$id = gtatx_seed_find( $key, 'tribe_events' );
		if ( $id ) {
			tribe_events()->where( 'id', $id )->set_args( $args )->save();
		} else {
			$post = tribe_events()->set_args( $args )->create();
			$id   = $post ? $post->ID : 0;
			update_post_meta( $id, '_gtatx_seed', $key );
		}
		wp_update_post( array( 'ID' => $id, 'post_name' => $e['slug'] ) );
		if ( $e['image'] ) {
			set_post_thumbnail( $id, gtatx_seed_image( $e['image']['src'], $e['image']['alt'] ) );
		}
		gtatx_seed_field( 'gtatx_event_partners', $e['partners'], $id );
		if ( ! empty( $e['sample'] ) ) {
			// Figma's placeholder text in every optional field, to see the full layout.
			$fields = array(
				'ages'          => 'Age range',
				'registration'  => 'Required or drop-in',
				'what_to_bring' => "Item\nItem\nItem",
				'contact'       => 'Contact email or phone',
				'accessibility' => 'Accessibility details and how to request accommodations',
			);
			foreach ( $fields as $name => $value ) {
				gtatx_seed_field( 'gtatx_event_' . $name, $value, $id );
			}
			// Getting there: Figma's three, plus a fourth to show the list can grow (ACF's repeater format).
			$ways = array( 'Bus' => 'Route and stop', 'Bike' => 'Nearest station or racks', 'Parking' => 'Parking details', 'Scooter' => 'Where to find and park scooters' );
			update_post_meta( $id, 'gtatx_event_getting_there', count( $ways ) );
			update_post_meta( $id, '_gtatx_event_getting_there', 'field_gtatx_event_getting_there' );
			$i = 0;
			foreach ( $ways as $label => $details ) {
				update_post_meta( $id, "gtatx_event_getting_there_{$i}_label", $label );
				update_post_meta( $id, "_gtatx_event_getting_there_{$i}_label", 'field_gtatx_event_getting_there_label' );
				update_post_meta( $id, "gtatx_event_getting_there_{$i}_details", $details );
				update_post_meta( $id, "_gtatx_event_getting_there_{$i}_details", 'field_gtatx_event_getting_there_details' );
				++$i;
			}
		}
	}
	WP_CLI::log( count( $all ) . ' events' );
} else {
	WP_CLI::warning( 'The Events Calendar is not active: no events seeded.' );
}

// ---------- Resources directory (External resources + Directory tags) ----------
// The same starter import as Tools → GetThereATX directory on the live site.
$gtatx_report = gtatx_directory_import( true );
if ( is_wp_error( $gtatx_report ) ) {
	WP_CLI::warning( $gtatx_report->get_error_message() );
} else {
	WP_CLI::log( sprintf( 'Directory: %d tags, %d new + %d matched external resources, %d tagged posts', $gtatx_report['tags'], $gtatx_report['resources'], $gtatx_report['updated'], $gtatx_report['guides'] ) );
}

flush_rewrite_rules( false );
WP_CLI::success( 'Local WordPress seeded. Log in at ' . admin_url() . ' (admin / password).' );
