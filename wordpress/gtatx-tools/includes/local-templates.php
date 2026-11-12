<?php
/**
 * LOCAL TESTING ONLY. Page templates for blog posts and events that follow
 * the Figma designs, so the CMS can be tried on a local WordPress without
 * Elementor Pro (whose Theme Builder makes the real templates).
 *
 * Off unless BOTH are true:
 *   - the site defines GTATX_LOCAL_TEMPLATES (only wordpress/.wp-env.json does), and
 *   - Elementor Pro is not active.
 * The live site has Elementor Pro and no such setting, so this never runs there.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function gtatx_local_templates_on() {
	return defined( 'GTATX_LOCAL_TEMPLATES' ) && GTATX_LOCAL_TEMPLATES && ! defined( 'ELEMENTOR_PRO_VERSION' );
}

add_filter(
	'template_include',
	function ( $template ) {
		if ( ! gtatx_local_templates_on() ) {
			return $template;
		}
		if ( is_singular( 'post' ) ) {
			return __DIR__ . '/../templates/single-post.php';
		}
		if ( is_singular( 'tribe_events' ) ) {
			return __DIR__ . '/../templates/single-event.php';
		}
		return $template;
	},
	99999
);

add_action(
	'wp_enqueue_scripts',
	function () {
		if ( gtatx_local_templates_on() && is_singular( array( 'post', 'tribe_events' ) ) ) {
			// Real Text Pro, as on the live site (the Adobe Fonts kit).
			wp_enqueue_style( 'gtatx-typekit', 'https://use.typekit.net/pgu6iej.css', array(), null );
		}
	}
);

/** Shared page start: <head>, a plain site header, then the page. */
function gtatx_local_page_start( $kind ) {
	?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
	<?php wp_body_open(); ?>
<header class="gtatx-wrap" style="display:flex;align-items:center;justify-content:space-between;height:64px;font-family:'ff-real-text-pro',system-ui,sans-serif;border-bottom:1px solid #dcdcdc">
	<a href="<?php echo esc_url( home_url( '/' ) ); ?>" style="font-weight:700;color:#111;text-decoration:none">Get There ATX</a>
	<span style="font-size:12px;color:#52525b">Local preview template (Elementor Pro not installed)</span>
</header>
<main class="gtatx-page gtatx-page--<?php echo esc_attr( $kind ); ?> gtatx-blog">
	<?php
}

function gtatx_local_page_end() {
	?>
</main>
	<?php wp_footer(); ?>
</body>
</html>
	<?php
}

/** Figma "Article/Related card". */
function gtatx_local_card( $post_id, $eyebrow, $action = '' ) {
	?>
	<li>
		<a class="gtatx-card" href="<?php echo esc_url( get_permalink( $post_id ) ); ?>">
			<span class="gtatx-card-image"><?php echo get_the_post_thumbnail( $post_id, 'medium_large', array( 'alt' => '' ) ); ?></span>
			<span class="gtatx-card-text">
				<?php if ( $eyebrow ) : ?>
					<span class="gtatx-eyebrow"><?php echo esc_html( $eyebrow ); ?></span>
				<?php endif; ?>
				<span class="gtatx-card-title"><?php echo esc_html( get_the_title( $post_id ) ); ?></span>
				<span class="gtatx-card-action gtatx-arrow"><?php echo esc_html( $action ); ?></span>
			</span>
		</a>
	</li>
	<?php
}
