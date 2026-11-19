<?php
/**
 * Tools → GetThereATX theme switch.
 *
 * Before the site moves from the custom "Get there ATX" theme to "Get There ATX (Hello)":
 * 1. Check (read only): what the old theme does that the site relies on, and which pages use it.
 * 2. Copy: the old theme's CTX GO landing files, Elementor widgets, CSS/JS/pictures and ACF JSON
 *    into the new theme's folder. Nothing on the live pages changes until the new theme is activated.
 */

defined( 'ABSPATH' ) || exit;

const GTATX_CHILD_THEME = 'getthereatx-hello';

/** The old custom theme, or null. */
function gtatx_ts_old_theme() {
	foreach ( wp_get_themes() as $slug => $theme ) {
		if ( GTATX_CHILD_THEME === $slug || $theme->parent() ) {
			continue;
		}
		if ( 'getthereatx' === $slug || 0 === strcasecmp( trim( $theme->get( 'Name' ) ), 'Get there ATX' ) ) {
			return $theme;
		}
	}
	return null;
}

/**
 * What to copy: old path => new path (relative to each theme folder).
 * Folders are copied whole. Root page templates and ctx partials are added at run time.
 */
function gtatx_ts_copy_map( $old_dir ) {
	$map = array();
	foreach ( array( 'inc/widgets', 'ctx-landing', 'css', 'js', 'images', 'img', 'fonts', 'acf-json', 'template-parts', 'partials', 'languages' ) as $d ) {
		if ( is_dir( "$old_dir/$d" ) ) {
			$map[ $d ] = $d;
		}
	}
	foreach ( array( 'inc/i18n.php', 'inc/acf-i18n.php' ) as $f ) {
		if ( is_file( "$old_dir/$f" ) ) {
			$map[ $f ] = $f;
		}
	}
	if ( is_file( "$old_dir/style.css" ) ) {
		$map['style.css'] = 'css/old-theme-style.css';
	}
	// Root files: page templates ("Template Name:") and CTX header/footer partials.
	foreach ( (array) glob( "$old_dir/*.php" ) as $file ) {
		$name = basename( $file );
		$head = (string) file_get_contents( $file, false, null, 0, 4096 );
		if ( false !== stripos( $name, 'ctx' ) || preg_match( '/Template Name\s*:/i', $head ) ) {
			$map[ $name ] = $name;
		}
	}
	return $map;
}

/** Copy one file; PHP files get get_template_directory*() → get_stylesheet_directory*(). */
function gtatx_ts_copy_file( $from, $to ) {
	if ( ! wp_mkdir_p( dirname( $to ) ) ) {
		return false;
	}
	if ( 'php' === strtolower( pathinfo( $from, PATHINFO_EXTENSION ) ) ) {
		$code = (string) file_get_contents( $from );
		$code = str_replace( array( 'get_template_directory_uri(', 'get_template_directory(' ), array( 'get_stylesheet_directory_uri(', 'get_stylesheet_directory(' ), $code );
		return false !== file_put_contents( $to, $code );
	}
	return copy( $from, $to );
}

/** Run the copy. Returns [ copied count, errors[] ]. Never deletes anything. */
function gtatx_ts_copy( $old_dir, $new_dir ) {
	$copied = 0;
	$errors = array();
	foreach ( gtatx_ts_copy_map( $old_dir ) as $from_rel => $to_rel ) {
		$from = "$old_dir/$from_rel";
		if ( is_dir( $from ) ) {
			$it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $from, FilesystemIterator::SKIP_DOTS ) );
			foreach ( $it as $file ) {
				if ( ! $file->isFile() ) {
					continue;
				}
				$rel = substr( $file->getPathname(), strlen( $from ) + 1 );
				gtatx_ts_copy_file( $file->getPathname(), "$new_dir/$to_rel/$rel" ) ? ++$copied : $errors[] = "$from_rel/$rel";
			}
		} else {
			gtatx_ts_copy_file( $from, "$new_dir/$to_rel" ) ? ++$copied : $errors[] = $from_rel;
		}
	}
	return array( $copied, $errors );
}

/** Scan the old theme's header/footer/functions for things only the theme provides. */
function gtatx_ts_scan_old( $old_dir ) {
	$found = array( 'ga' => array(), 'typekit' => array(), 'gtranslate' => array(), 'scripts' => array() );
	foreach ( array( 'header.php', 'footer.php', 'functions.php', 'inc/enqueue.php' ) as $f ) {
		if ( ! is_file( "$old_dir/$f" ) ) {
			continue;
		}
		$code = (string) file_get_contents( "$old_dir/$f" );
		if ( preg_match_all( '/(?:googletagmanager\.com\/(?:gtag\/js\?id=|gtm\.js\?id=)|gtag\(\s*[\'"]config[\'"]\s*,\s*[\'"]|[\'"])((?:G|GTM)-[A-Z0-9]{4,})/', $code, $m ) ) {
			foreach ( array_unique( $m[1] ) as $id ) {
				$found['ga'][ $id ] = $f;
			}
		}
		if ( preg_match_all( '#use\.typekit\.net/[a-z0-9]+\.(?:css|js)#i', $code, $m ) ) {
			foreach ( array_unique( $m[0] ) as $kit ) {
				$found['typekit'][ $kit ] = $f;
			}
		}
		if ( false !== stripos( $code, 'gtranslate' ) || false !== strpos( $code, '[gt-' ) ) {
			$found['gtranslate'][] = $f;
		}
		if ( preg_match_all( '#<script[^>]+src=["\']([^"\']+)#i', $code, $m ) ) {
			foreach ( $m[1] as $src ) {
				if ( false === strpos( $src, 'googletagmanager.com' ) && false === strpos( $src, 'typekit.net' ) ) {
					$found['scripts'][ $src ] = $f;
				}
			}
		}
	}
	return $found;
}

/** Pages, posts and templates whose Elementor layout uses an old widget, by widget name. */
function gtatx_ts_widget_usage() {
	global $wpdb;
	$out = array();
	if ( ! class_exists( '\Elementor\Plugin' ) ) {
		return $out;
	}
	foreach ( \Elementor\Plugin::$instance->widgets_manager->get_widget_types() as $name => $widget ) {
		if ( ! in_array( 'themecategory', (array) $widget->get_categories(), true ) ) {
			continue;
		}
		$out[ $name ] = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT p.ID, p.post_title, p.post_type, p.post_status FROM {$wpdb->posts} p
				 JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = '_elementor_data'
				 WHERE m.meta_value LIKE %s AND p.post_type <> 'revision' AND p.post_status NOT IN ('trash','auto-draft','inherit')",
				'%' . $wpdb->esc_like( '"widgetType":"' . $name . '"' ) . '%'
			)
		);
	}
	return $out;
}

/** Pages with a page template other than the default / Elementor ones. */
function gtatx_ts_template_pages() {
	global $wpdb;
	return $wpdb->get_results(
		"SELECT p.ID, p.post_title, p.post_status, m.meta_value AS tpl FROM {$wpdb->posts} p
		 JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = '_wp_page_template'
		 WHERE p.post_type = 'page' AND p.post_status NOT IN ('trash','auto-draft','inherit')
		 AND m.meta_value NOT IN ('', 'default', 'elementor_header_footer', 'elementor_canvas', 'elementor_theme')
		 ORDER BY m.meta_value, p.post_title"
	);
}

add_action(
	'admin_menu',
	function () {
		add_management_page( 'GetThereATX theme switch', 'GetThereATX theme switch', 'manage_options', 'gtatx-theme-switch', 'gtatx_ts_page' );
	}
);

function gtatx_ts_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$old   = gtatx_ts_old_theme();
	$hello = wp_get_theme( 'hello-elementor' );
	$child = wp_get_theme( GTATX_CHILD_THEME );
	$ready = $old && $child->exists();
	$scan  = $old ? gtatx_ts_scan_old( $old->get_stylesheet_directory() ) : null;
	$ga    = $scan ? array_keys( $scan['ga'] ) : array();

	$result = null;
	if ( $ready && isset( $_POST['gtatx_ts_copy'] ) ) {
		check_admin_referer( 'gtatx_ts_copy' );
		$result = gtatx_ts_copy( $old->get_stylesheet_directory(), $child->get_stylesheet_directory() );
		// GA the old theme printed itself moves with the theme (one ID only; the QR page's own ID is not in these files).
		$ga_id = $ga ? $ga[0] : '';
		update_option( 'gtatx_child_ga_id', $ga_id, false );
	}

	$row  = fn( $ok, $text ) => printf( '<li>%s %s</li>', $ok ? '✅' : '⚠️', wp_kses_post( $text ) );
	$link = fn( $id, $title ) => sprintf( '<a href="%s">%s</a>', esc_url( get_edit_post_link( $id ) ?: '#' ), esc_html( $title ?: '(no title)' ) );
	?>
	<div class="wrap">
		<h1>GetThereATX theme switch</h1>
		<p>Moving from the custom <strong>Get there ATX</strong> theme to <strong>Get There ATX (Hello)</strong>. This page only reads, until you press Copy. Copy writes into the new theme's folder only; the live site doesn't change until the new theme is activated.</p>

		<?php if ( $result ) : ?>
			<div class="notice <?php echo $result[1] ? 'notice-error' : 'notice-success'; ?>"><p>
				Copied <?php echo (int) $result[0]; ?> files into <?php echo esc_html( $child->get( 'Name' ) ); ?>.
				<?php if ( $result[1] ) : ?>Could not copy: <?php echo esc_html( implode( ', ', array_slice( $result[1], 0, 20 ) ) ); ?><?php endif; ?>
				<?php echo $ga ? 'Google Analytics ' . esc_html( $ga[0] ) . ' will be loaded by the new theme.' : ''; ?>
			</p></div>
		<?php endif; ?>

		<h2>1. Themes</h2>
		<ul>
			<?php
			$row( (bool) $old, $old ? 'Old theme found: <code>' . esc_html( $old->get_stylesheet() ) . '</code>' . ( get_stylesheet() === $old->get_stylesheet() ? ' (active now)' : '' ) : 'Old "Get there ATX" theme not found. Keep it installed until the copy is done.' );
			$row( $hello->exists(), $hello->exists() ? 'Hello Elementor installed (' . esc_html( $hello->get( 'Version' ) ) . '). Leave it inactive.' : 'Install <strong>Hello Elementor</strong>: Appearance → Themes → Add New Theme → search "Hello Elementor" → Install. Don\'t activate it.' );
			$row( $child->exists(), $child->exists() ? 'Get There ATX (Hello) installed (' . esc_html( $child->get( 'Version' ) ) . ')' . ( get_stylesheet() === GTATX_CHILD_THEME ? ' (active now)' : '' ) : 'Upload <code>getthereatx-hello.zip</code>: Appearance → Themes → Add New Theme → Upload Theme. Don\'t activate it.' );
			?>
		</ul>

		<h2>2. Copy the old theme's parts</h2>
		<?php if ( $ready ) : ?>
			<?php $map = gtatx_ts_copy_map( $old->get_stylesheet_directory() ); ?>
			<p>These go into the new theme (safe to run again; it overwrites the copies, never deletes):</p>
			<ul style="list-style: disc; padding-left: 20px;">
				<?php foreach ( $map as $from => $to ) : ?>
					<li><code><?php echo esc_html( $from ); ?></code><?php echo $from !== $to ? ' → <code>' . esc_html( $to ) . '</code>' : ''; ?>
						<?php echo file_exists( $child->get_stylesheet_directory() . '/' . $to ) ? ' ✅ copied' : ''; ?></li>
				<?php endforeach; ?>
			</ul>
			<form method="post">
				<?php wp_nonce_field( 'gtatx_ts_copy' ); ?>
				<p><button type="submit" name="gtatx_ts_copy" value="1" class="button button-primary">Copy into Get There ATX (Hello)</button></p>
			</form>
		<?php else : ?>
			<p>Needs both the old theme and Get There ATX (Hello) installed.</p>
		<?php endif; ?>

		<?php if ( $scan ) : ?>
			<h2>3. Things the old theme's header and footer provide</h2>
			<ul>
				<?php
				$row( true, $ga ? 'Google Analytics in the theme: <code>' . esc_html( implode( ', ', $ga ) ) . '</code> (' . esc_html( implode( ', ', array_unique( $scan['ga'] ) ) ) . '). The Copy button sets the new theme to load it.' : 'No Google Analytics in the theme files, so it comes from a plugin or Elementor Custom Code, which keep working after the switch.' );
				$row( true, $scan['typekit'] ? 'Adobe Fonts in the theme: <code>' . esc_html( implode( ', ', array_keys( $scan['typekit'] ) ) ) . '</code>. The new theme loads the kit pgu6iej everywhere; if the ID differs, tell the dev.' : 'No Adobe Fonts link in the theme files. The new theme loads the kit pgu6iej everywhere.' );
				$row( ! $scan['gtranslate'], $scan['gtranslate'] ? 'The GTranslate language switcher is in the old theme (' . esc_html( implode( ', ', $scan['gtranslate'] ) ) . '). After the switch it disappears unless the GTranslate widget is added to the [WKRM] Header.' : 'No GTranslate in the theme files.' );
				foreach ( $scan['scripts'] as $src => $file ) {
					$row( false, 'Script in old ' . esc_html( $file ) . ': <code>' . esc_html( $src ) . '</code>. It won\'t load after the switch; check if it still matters.' );
				}
				?>
			</ul>
		<?php endif; ?>

		<h2>4. Pages using old page templates</h2>
		<?php $pages = gtatx_ts_template_pages(); ?>
		<?php if ( ! $pages ) : ?>
			<p>None.</p>
		<?php else : ?>
			<ul>
				<?php
				foreach ( $pages as $p ) {
					// In the new theme's folder, or added by a plugin (Elementor and others list theirs too).
					$there = $child->exists() && ( file_exists( $child->get_stylesheet_directory() . '/' . $p->tpl ) || isset( $child->get_page_templates( null, 'page' )[ $p->tpl ] ) );
					$row( $there, $link( $p->ID, $p->post_title ) . ' (' . esc_html( $p->post_status ) . '): <code>' . esc_html( $p->tpl ) . '</code>' . ( $there ? ', in the new theme' : ', not in the new theme yet' ) );
				}
				?>
			</ul>
		<?php endif; ?>

		<h2>5. Where the old Elementor widgets are used</h2>
		<?php $usage = gtatx_ts_widget_usage(); ?>
		<?php if ( ! $usage ) : ?>
			<p>No "Get there ATX" widgets are registered right now (the old theme is not active, and none were copied yet).</p>
		<?php else : ?>
			<p>These pages keep the old theme's CSS, scripts and Google Maps after the switch. Everything else drops them.</p>
			<ul>
				<?php
				foreach ( $usage as $name => $posts ) {
					$where = $posts ? implode( ', ', array_map( fn( $p ) => $link( $p->ID, $p->post_title ) . ' <small>(' . esc_html( $p->post_type . ', ' . $p->post_status ) . ')</small>', $posts ) ) : 'not used';
					$row( true, '<code>' . esc_html( $name ) . '</code>: ' . $where );
				}
				?>
			</ul>
		<?php endif; ?>
	</div>
	<?php
}
