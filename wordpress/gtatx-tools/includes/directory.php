<?php
/**
 * The Resources directory, kept in WP admin.
 *
 * - External resources (post type gtatx_resource): links to other sites, with a
 *   web address, an optional description and an optional featured image.
 * - Directory tags (taxonomy gtatx_tag): the filter tree. Its three top-level
 *   terms are the filter groups ("Ways of getting around", "Who are you?",
 *   "Type of info"); their children and grandchildren are the filters. The same
 *   tags go on External resources, blog posts and events.
 * - [gtatx_resources] sends the tree and every resource, tagged post and upcoming event
 *   to the tool (window.gtatxTools.directory). Until the starter import has run
 *   (Tools → GetThereATX directory), nothing is sent and the tool shows the list
 *   built into the plugin, so installing the plugin changes nothing by itself.
 *
 * In the prototype: src/content/resource-list.json and src/lib/directoryItems.ts (wpItem).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const GTATX_TAG_TAX = 'gtatx_tag';
/** The three filter groups, in page order. The tool expects exactly these. */
const GTATX_TAG_GROUPS = array( 'mode', 'who', 'type' );
/** How far ahead events are listed (as in src/pages/Resources.tsx). */
const GTATX_EVENT_DAYS = 120;

/* ---------- Post type and taxonomy ---------- */

function gtatx_register_directory_types() {
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
			'supports'     => array( 'title', 'thumbnail', 'revisions' ),
		)
	);
	register_post_meta( 'gtatx_resource', 'gtatx_url', gtatx_meta_args( 'string', 'esc_url_raw' ) );
	register_post_meta( 'gtatx_resource', 'gtatx_description', gtatx_meta_args( 'string', 'sanitize_textarea_field' ) );
	// A picture bundled with the plugin ("/images/resources/sites/…"), set by the import. A featured image wins over it.
	register_post_meta( 'gtatx_resource', 'gtatx_photo', gtatx_meta_args( 'string', 'sanitize_text_field' ) );

	register_taxonomy(
		GTATX_TAG_TAX,
		array( 'gtatx_resource', 'post', 'tribe_events' ),
		array(
			'labels'            => array(
				'name'          => 'Directory tags',
				'singular_name' => 'Directory tag',
				'menu_name'     => 'Directory tags',
				'add_new_item'  => 'Add directory tag',
				'parent_item'   => 'Group or parent tag',
			),
			'description'       => 'The Resources page filters. Top level = the three filter groups; below them, the filters.',
			'hierarchical'      => true,
			'public'            => false,
			'show_ui'           => true,
			'show_in_rest'      => true,
			'show_admin_column' => true,
			'rewrite'           => false,
		)
	);
}
add_action( 'init', 'gtatx_register_directory_types' );

function gtatx_register_directory_fields() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}
	acf_add_local_field_group(
		array(
			'key'      => 'group_gtatx_resource',
			'title'    => 'Link',
			'fields'   => array(
				array( 'key' => 'field_gtatx_url', 'name' => 'gtatx_url', 'label' => 'Web address', 'type' => 'url', 'required' => 1 ),
				array(
					'key'          => 'field_gtatx_description',
					'name'         => 'gtatx_description',
					'label'        => 'Description (optional)',
					'type'         => 'textarea',
					'rows'         => 3,
					'instructions' => 'One or two sentences under the title. Leave empty to show the title only. Pick filters in "Directory tags"; add a picture with "Featured image".',
				),
			),
			'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'gtatx_resource' ) ) ),
		)
	);
}
add_action( 'acf/init', 'gtatx_register_directory_fields' );

/* ---------- Reading the tree ---------- */

/** The tag the tool filters on: the original list tag (term meta) or, for tags added in WP admin, the slug. */
function gtatx_tag_key( $term ) {
	$key = get_term_meta( $term->term_id, 'gtatx_key', true );
	return $key ? $key : $term->slug;
}

/** A term's children, in the list's order (term meta gtatx_order), then A–Z. */
function gtatx_tag_children( $parent_id ) {
	$terms = get_terms(
		array(
			'taxonomy'   => GTATX_TAG_TAX,
			'parent'     => $parent_id,
			'hide_empty' => false,
		)
	);
	if ( is_wp_error( $terms ) ) {
		return array();
	}
	usort(
		$terms,
		function ( $a, $b ) {
			$oa = get_term_meta( $a->term_id, 'gtatx_order', true );
			$ob = get_term_meta( $b->term_id, 'gtatx_order', true );
			$oa = '' === $oa ? PHP_INT_MAX : (int) $oa;
			$ob = '' === $ob ? PHP_INT_MAX : (int) $ob;
			return $oa === $ob ? strcasecmp( $a->name, $b->name ) : $oa - $ob;
		}
	);
	return $terms;
}

/** The filter groups for the tool, or null when the tree isn't set up (no import yet). */
function gtatx_directory_groups() {
	$groups = array();
	foreach ( gtatx_tag_children( 0 ) as $top ) {
		$id = get_term_meta( $top->term_id, 'gtatx_group', true );
		if ( ! in_array( $id, GTATX_TAG_GROUPS, true ) ) {
			continue;
		}
		$tags = array();
		foreach ( gtatx_tag_children( $top->term_id ) as $t ) {
			$tag      = array(
				'tag'   => gtatx_tag_key( $t ),
				'label' => $t->name,
			);
			$children = array();
			foreach ( gtatx_tag_children( $t->term_id ) as $c ) {
				$children[] = array(
					'tag'   => gtatx_tag_key( $c ),
					'label' => $c->name,
				);
			}
			if ( $children ) {
				$tag['children'] = $children;
			}
			$tags[] = $tag;
		}
		if ( $tags ) {
			$groups[ $id ] = array(
				'id'    => $id,
				'label' => $top->name,
				'tags'  => $tags,
			);
		}
	}
	if ( count( $groups ) !== count( GTATX_TAG_GROUPS ) ) {
		return null;
	}
	return array_values( array_map( fn( $id ) => $groups[ $id ], GTATX_TAG_GROUPS ) );
}

function gtatx_post_tag_keys( $post_id ) {
	$terms = wp_get_post_terms( $post_id, GTATX_TAG_TAX );
	return is_wp_error( $terms ) ? array() : array_values( array_map( 'gtatx_tag_key', $terms ) );
}

/** Plain text, no shortcodes or tags, for a card's description. */
function gtatx_plain( $text ) {
	return trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( strip_shortcodes( (string) $text ) ) ) );
}

/** One entry per External resource, blog post and upcoming event. */
function gtatx_directory_entries() {
	$entries = array();

	foreach ( get_posts( array( 'post_type' => 'gtatx_resource', 'post_status' => 'publish', 'numberposts' => -1 ) ) as $p ) {
		$url = get_post_meta( $p->ID, 'gtatx_url', true );
		if ( ! $url ) {
			continue;
		}
		$photo     = get_the_post_thumbnail_url( $p, 'medium_large' );
		$entries[] = array_filter(
			array(
				'id'          => 'resource-' . $p->ID,
				'kind'        => 'site',
				'title'       => get_the_title( $p ),
				'url'         => esc_url_raw( $url ),
				'tags'        => gtatx_post_tag_keys( $p->ID ),
				'description' => gtatx_plain( get_post_meta( $p->ID, 'gtatx_description', true ) ),
				'photo'       => $photo ? $photo : get_post_meta( $p->ID, 'gtatx_photo', true ),
			),
			fn( $v ) => '' !== $v && null !== $v && false !== $v
		) + array( 'tags' => array() );
	}

	// Blog posts appear once they have at least one Directory tag (so old news posts stay out).
	$tagged_posts = get_posts(
		array(
			'post_type'   => 'post',
			'post_status' => 'publish',
			'numberposts' => -1,
			'tax_query'   => array( array( 'taxonomy' => GTATX_TAG_TAX, 'operator' => 'EXISTS' ) ), // phpcs:ignore WordPress.DB.SlowDBQuery
		)
	);
	foreach ( $tagged_posts as $p ) {
		$entries[] = array_filter(
			array(
				'id'          => 'post-' . $p->ID,
				'kind'        => 'guide',
				'title'       => gtatx_plain( get_the_title( $p ) ),
				'url'         => get_permalink( $p ),
				'tags'        => gtatx_post_tag_keys( $p->ID ),
				'description' => gtatx_plain( get_the_excerpt( $p ) ),
				'photo'       => get_the_post_thumbnail_url( $p, 'medium_large' ),
				'video'       => (bool) get_post_meta( $p->ID, 'gtatx_hero_video', true ),
			),
			fn( $v ) => '' !== $v && null !== $v && false !== $v
		) + array( 'tags' => array() );
	}

	if ( function_exists( 'tribe_get_events' ) ) {
		$events = tribe_get_events(
			array(
				'start_date'     => 'now',
				'end_date'       => gmdate( 'Y-m-d H:i:s', time() + GTATX_EVENT_DAYS * DAY_IN_SECONDS ),
				'posts_per_page' => 200,
				'eventDisplay'   => 'list',
			)
		);
		foreach ( $events as $e ) {
			$entries[] = array_filter(
				array(
					'id'          => 'event-' . $e->ID,
					'kind'        => 'event',
					'title'       => gtatx_plain( get_the_title( $e ) ),
					'url'         => get_permalink( $e ),
					'tags'        => gtatx_post_tag_keys( $e->ID ),
					'description' => gtatx_plain( get_the_excerpt( $e ) ),
					'photo'       => get_the_post_thumbnail_url( $e, 'medium_large' ),
					'start'       => function_exists( 'tribe_get_start_date' ) ? tribe_get_start_date( $e, true, 'c' ) : '',
					'venue'       => function_exists( 'tribe_get_venue' ) ? gtatx_plain( tribe_get_venue( $e->ID ) ) : '',
				),
				fn( $v ) => '' !== $v && null !== $v && false !== $v
			) + array( 'tags' => array() );
		}
	}

	return $entries;
}

/** Called by [gtatx_resources]: hands the directory to the tool (once per page). */
function gtatx_directory_send() {
	static $sent = false;
	if ( $sent ) {
		return;
	}
	$sent   = true;
	$groups = gtatx_directory_groups();
	if ( null === $groups ) {
		return; // Not imported yet: the tool keeps its built-in list.
	}
	$js  = '(window.gtatxTools = window.gtatxTools || {}).directory = ' . wp_json_encode(
		array(
			'groups'  => $groups,
			'entries' => gtatx_directory_entries(),
		)
	) . ';';
	$add = fn() => wp_add_inline_script( GTATX_TOOLS_HANDLE, $js, 'before' );
	// Block themes render the page before wp_enqueue_scripts registers the script: attach it then.
	if ( wp_script_is( GTATX_TOOLS_HANDLE, 'registered' ) ) {
		$add();
	} else {
		add_action( 'wp_enqueue_scripts', $add, 6 );
	}
}

/* ---------- Starter import (Tools → GetThereATX directory) ---------- */

/** A web address compared without http(s), www. or a trailing slash. */
function gtatx_url_key( $url ) {
	return strtolower( untrailingslashit( preg_replace( '#^https?://(www\.)?#i', '', trim( (string) $url ) ) ) );
}

/** Published External resources whose address isn't in the starter list (shown on the import page). */
function gtatx_directory_unlisted() {
	$file = plugin_dir_path( GTATX_TOOLS_FILE ) . 'data/directory-seed.json';
	$seed = file_exists( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions
	if ( ! is_array( $seed ) ) {
		return array();
	}
	$in_list = array();
	foreach ( $seed['resources'] as $r ) {
		$in_list[ gtatx_url_key( $r['url'] ) ] = true;
	}
	$out = array();
	foreach ( get_posts( array( 'post_type' => 'gtatx_resource', 'post_status' => 'publish', 'numberposts' => -1 ) ) as $p ) {
		if ( ! get_post_meta( $p->ID, 'gtatx_program', true ) && ! isset( $in_list[ gtatx_url_key( get_post_meta( $p->ID, 'gtatx_url', true ) ) ] ) ) {
			$out[] = $p;
		}
	}
	return $out;
}

/** Finds the term with this list tag, or makes it. */
function gtatx_ensure_tag( $key, $label, $parent, $order ) {
	$found = get_terms(
		array(
			'taxonomy'   => GTATX_TAG_TAX,
			'hide_empty' => false,
			'meta_key'   => 'gtatx_key', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value' => $key, // phpcs:ignore WordPress.DB.SlowDBQuery
			'number'     => 1,
		)
	);
	if ( ! is_wp_error( $found ) && $found ) {
		return $found[0]->term_id;
	}
	$made = wp_insert_term(
		$label,
		GTATX_TAG_TAX,
		array(
			'parent' => $parent,
			'slug'   => sanitize_title( $key ),
		)
	);
	if ( is_wp_error( $made ) ) {
		// Same name under the same parent already: take that one.
		$id = $made->get_error_data( 'term_exists' );
		if ( ! $id ) {
			return 0;
		}
	} else {
		$id = $made['term_id'];
	}
	update_term_meta( $id, 'gtatx_key', $key );
	update_term_meta( $id, 'gtatx_order', $order );
	return (int) $id;
}

/** Creates the tag tree, the External resources and the posts' tags from data/directory-seed.json. Safe to run twice. */
function gtatx_directory_import( $replace_old = false ) {
	$file = plugin_dir_path( GTATX_TOOLS_FILE ) . 'data/directory-seed.json';
	$seed = file_exists( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions
	if ( ! is_array( $seed ) ) {
		return new WP_Error( 'gtatx_seed', 'The starter list (data/directory-seed.json) is missing from the plugin.' );
	}
	$report = array(
		'tags'           => 0,
		'resources'      => 0,
		'updated'        => 0,
		'drafted'        => 0,
		'guides'         => 0,
		'missing_guides' => array(),
	);

	$ids = array();
	foreach ( $seed['groups'] as $gi => $group ) {
		$top = gtatx_ensure_tag( 'group-' . $group['id'], $group['label'], 0, $gi );
		update_term_meta( $top, 'gtatx_group', $group['id'] );
		foreach ( $group['tags'] as $ti => $tag ) {
			$ids[ $tag['tag'] ] = gtatx_ensure_tag( $tag['tag'], $tag['label'], $top, $ti );
			foreach ( $tag['children'] ?? array() as $ci => $child ) {
				$ids[ $child['tag'] ] = gtatx_ensure_tag( $child['tag'], $child['label'], $ids[ $tag['tag'] ], $ci );
			}
		}
	}
	$report['tags'] = count( array_filter( $ids ) );
	$term_ids       = fn( $tags ) => array_values( array_filter( array_map( fn( $t ) => $ids[ $t ] ?? 0, $tags ) ) );

	// Resources: one per web address. One that's already there keeps its title and text;
	// it only gains the list's tags, and a description or picture where it has none.
	$have = array();
	$programs = array();
	foreach ( get_posts( array( 'post_type' => 'gtatx_resource', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids' ) ) as $id ) {
		$program = get_post_meta( $id, 'gtatx_program', true );
		if ( $program ) {
			$programs[ $program ] = $id; // Programs are matched by program, never by address.
		} else {
			$have[ gtatx_url_key( get_post_meta( $id, 'gtatx_url', true ) ) ] = $id;
		}
	}
	$in_list = array();
	foreach ( $seed['resources'] as $r ) {
		$key             = gtatx_url_key( $r['url'] );
		$in_list[ $key ] = true;
		if ( isset( $have[ $key ] ) ) {
			$id = $have[ $key ];
			if ( $replace_old ) {
				// Older entry (plugin 0.2): take the list's own title and description, verbatim.
				wp_update_post( array( 'ID' => $id, 'post_title' => $r['title'], 'post_status' => 'publish' ) );
				update_post_meta( $id, 'gtatx_description', $r['description'] ?? '' );
				wp_set_object_terms( $id, $term_ids( $r['tags'] ), GTATX_TAG_TAX );
			}
			if ( ! empty( $r['description'] ) && ! get_post_meta( $id, 'gtatx_description', true ) ) {
				update_post_meta( $id, 'gtatx_description', $r['description'] );
			}
			if ( ! empty( $r['photo'] ) && ! get_post_meta( $id, 'gtatx_photo', true ) ) {
				update_post_meta( $id, 'gtatx_photo', $r['photo'] );
			}
			wp_set_object_terms( $id, $term_ids( $r['tags'] ), GTATX_TAG_TAX, true );
			++$report['updated'];
			continue;
		}
		$id = wp_insert_post(
			array(
				'post_type'   => 'gtatx_resource',
				'post_status' => 'publish',
				'post_title'  => $r['title'],
			),
			true
		);
		if ( is_wp_error( $id ) ) {
			continue;
		}
		update_post_meta( $id, 'gtatx_url', esc_url_raw( $r['url'] ) );
		if ( ! empty( $r['description'] ) ) {
			update_post_meta( $id, 'gtatx_description', $r['description'] );
		}
		if ( ! empty( $r['photo'] ) ) {
			update_post_meta( $id, 'gtatx_photo', $r['photo'] );
		}
		wp_set_object_terms( $id, $term_ids( $r['tags'] ), GTATX_TAG_TAX );
		++$report['resources'];
	}

	// Programs ("Get there together" cards): created once; staff edits are kept.
	$report['programs'] = 0;
	foreach ( $seed['programs'] ?? array() as $r ) {
		if ( isset( $programs[ $r['program'] ] ) ) {
			continue;
		}
		$id = wp_insert_post(
			array(
				'post_type'   => 'gtatx_resource',
				'post_status' => 'publish',
				'post_title'  => $r['title'],
			),
			true
		);
		if ( is_wp_error( $id ) ) {
			continue;
		}
		update_post_meta( $id, 'gtatx_program', $r['program'] );
		update_post_meta( $id, 'gtatx_url', esc_url_raw( $r['url'] ) );
		update_post_meta( $id, 'gtatx_description', $r['description'] );
		update_post_meta( $id, 'gtatx_photo', $r['photo'] );
		wp_set_object_terms( $id, $term_ids( $r['tags'] ), GTATX_TAG_TAX );
		++$report['programs'];
	}

	// Older External resources that aren't in the list (e.g. from plugin 0.2): to Draft, only if asked.
	if ( $replace_old ) {
		foreach ( $have as $key => $id ) {
			if ( ! isset( $in_list[ $key ] ) && 'publish' === get_post_status( $id ) ) {
				wp_update_post( array( 'ID' => $id, 'post_status' => 'draft' ) );
				++$report['drafted'];
			}
		}
	}

	// Blog posts: add the list's tags to the post with the same address (adds; never removes tags).
	foreach ( $seed['guides'] as $g ) {
		$post = get_page_by_path( $g['slug'], OBJECT, 'post' );
		if ( ! $post ) {
			$report['missing_guides'][] = $g['title'];
			continue;
		}
		wp_set_object_terms( $post->ID, $term_ids( $g['tags'] ), GTATX_TAG_TAX, true );
		++$report['guides'];
	}

	// Events: the "Happening in Austin" filter finds every event without a tag.
	return $report;
}

function gtatx_directory_admin_menu() {
	add_management_page( 'GetThereATX directory', 'GetThereATX directory', 'manage_options', 'gtatx-directory', 'gtatx_directory_admin_page' );
}
add_action( 'admin_menu', 'gtatx_directory_admin_menu' );

function gtatx_directory_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$report = null;
	if ( isset( $_POST['gtatx_directory_import'] ) ) {
		check_admin_referer( 'gtatx_directory_import' );
		$report = gtatx_directory_import( ! empty( $_POST['gtatx_replace_old'] ) );
	}
	$resources = wp_count_posts( 'gtatx_resource' );
	$tags      = wp_count_terms( array( 'taxonomy' => GTATX_TAG_TAX, 'hide_empty' => false ) );
	$ready     = null !== gtatx_directory_groups();
	$unlisted  = gtatx_directory_unlisted();
	?>
	<div class="wrap">
		<h1>GetThereATX directory</h1>
		<?php if ( is_wp_error( $report ) ) : ?>
			<div class="notice notice-error"><p><?php echo esc_html( $report->get_error_message() ); ?></p></div>
		<?php elseif ( $report ) : ?>
			<div class="notice notice-success"><p>
				<?php
				printf(
					'Done: %d tags, %d new External resources, %d new program cards, %d existing ones matched, %d older ones moved to Draft, tags added to %d blog posts.',
					(int) $report['tags'],
					(int) $report['resources'],
					(int) $report['programs'],
					(int) $report['updated'],
					(int) $report['drafted'],
					(int) $report['guides']
				);
				?>
			</p>
			<?php if ( $report['missing_guides'] ) : ?>
				<p>No post found for: <?php echo esc_html( implode( ', ', $report['missing_guides'] ) ); ?>. Tag those by hand.</p>
			<?php endif; ?>
			</div>
		<?php endif; ?>

		<p>The Resources page lists every <strong>External resource</strong>, blog post and upcoming event, filtered by <strong>Directory tags</strong>.</p>
		<p>
			Now: <?php echo (int) ( $resources->publish ?? 0 ); ?> published External resources,
			<?php echo is_wp_error( $tags ) ? 0 : (int) $tags; ?> Directory tags.
			The Resources page is using <strong><?php echo $ready ? 'this list from WP admin' : 'the list built into the plugin'; ?></strong>.
		</p>

		<h2>Starter import</h2>
		<p>Run once. It creates the tag tree and one External resource per site from the WKRM resource list, and adds the list's tags to matching blog posts. Running it again only adds what is missing; it never changes or deletes your edits.</p>
		<form method="post">
			<?php wp_nonce_field( 'gtatx_directory_import' ); ?>
			<?php if ( ( $resources->publish ?? 0 ) > 0 ) : ?>
				<p><label><input type="checkbox" name="gtatx_replace_old" value="1">
					Replace the older External resources (from plugin 0.2): ones with an address in the list take the list's title,
					description and tags; the <?php echo count( $unlisted ); ?> not in the list move to Draft (kept in WP admin, hidden from the Resources page):
					<?php echo esc_html( implode( ', ', wp_list_pluck( array_slice( $unlisted, 0, 8 ), 'post_title' ) ) . ( count( $unlisted ) > 8 ? ', …' : '' ) ); ?>
				</label></p>
			<?php endif; ?>
			<p><button type="submit" name="gtatx_directory_import" value="1" class="button button-primary">Import the starter list</button></p>
		</form>

		<h2>Day to day</h2>
		<ul style="list-style: disc; padding-left: 20px;">
			<li>Add a website: <a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=gtatx_resource' ) ); ?>">External resources → Add</a>. Fill the web address, tick its Directory tags, optionally a description and a featured image.</li>
			<li>Put a blog post in the directory: tick at least one Directory tag in the post's sidebar (untagged posts stay off the Resources page). Every upcoming event is listed under "Happening in Austin"; tick more tags to show it under other filters too.</li>
			<li>Add or rename a filter: <a href="<?php echo esc_url( admin_url( 'edit-tags.php?taxonomy=' . GTATX_TAG_TAX . '&post_type=gtatx_resource' ) ); ?>">Directory tags</a>. Put it under one of the three groups (or under a tag there). Don't delete or rename the three groups themselves.</li>
			<li>Renaming a tag changes the label people see; links that point at a filter keep working.</li>
		</ul>
	</div>
	<?php
}
