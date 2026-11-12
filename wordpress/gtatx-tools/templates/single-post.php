<?php
/**
 * LOCAL TESTING ONLY (see includes/local-templates.php): a blog post in the
 * Figma "Article/blog Master template" layout. On the live site the Elementor
 * Pro Single Post template (wordpress/elementor/single-post.json) does this.
 */

gtatx_local_page_start( 'blog' );
while ( have_posts() ) :
	the_post();
	$gtatx_id    = get_the_ID();
	$gtatx_video = gtatx_hero_video_id( $gtatx_id );
	$gtatx_cats  = wp_get_post_categories( $gtatx_id );
	?>
	<article>
		<?php if ( $gtatx_video ) : ?>
			<?php // Click to play, as in the prototype: no YouTube player (or cookies) until someone presses play. ?>
			<div class="gtatx-hero">
				<button type="button" class="gtatx-video" aria-label="Play video: <?php the_title_attribute(); ?>" data-youtube="<?php echo esc_attr( $gtatx_video ); ?>" onclick="this.outerHTML='<iframe src=&quot;https://www.youtube-nocookie.com/embed/'+this.dataset.youtube+'?rel=0&amp;autoplay=1&quot; title=&quot;'+this.getAttribute('aria-label').replace('Play video','Video')+'&quot; allow=&quot;autoplay; fullscreen; picture-in-picture&quot; allowfullscreen></iframe>'">
					<img src="https://i.ytimg.com/vi/<?php echo esc_attr( $gtatx_video ); ?>/hqdefault.jpg" alt="">
					<span aria-hidden="true"></span>
				</button>
			</div>
		<?php elseif ( has_post_thumbnail() ) : ?>
			<div class="gtatx-hero"><?php the_post_thumbnail( 'full' ); ?></div>
		<?php endif; ?>

		<header class="gtatx-wrap gtatx-header">
			<a class="gtatx-back" href="<?php echo esc_url( home_url( '/resources/?mode=Guides#directory' ) ); ?>">Back to Resources</a>
			<div class="gtatx-header-text" style="display:flex;flex-direction:column;gap:inherit">
				<div class="gtatx-eyebrow-space" aria-hidden="true"></div>
				<h1 class="gtatx-title"><?php the_title(); ?></h1>
				<?php if ( has_excerpt() ) : ?>
					<p class="gtatx-lead"><?php echo esc_html( get_the_excerpt() ); ?></p>
				<?php endif; ?>
				<p class="gtatx-meta"><?php echo esc_html( gtatx_blog_meta( $gtatx_id ) ); ?></p>
			</div>
		</header>

		<div class="gtatx-wrap gtatx-body"><?php the_content(); ?></div>

		<?php
		$gtatx_related = $gtatx_cats ? get_posts(
			array(
				'category__in'   => $gtatx_cats,
				'post__not_in'   => array( $gtatx_id ),
				'posts_per_page' => 3,
			)
		) : array();
		if ( $gtatx_related ) :
			?>
			<section class="gtatx-wrap gtatx-section" aria-labelledby="related-title">
				<h2 id="related-title" class="gtatx-section-title">Keep reading</h2>
				<ul class="gtatx-cards">
					<?php
					foreach ( $gtatx_related as $gtatx_post ) {
						$gtatx_cat = get_the_category( $gtatx_post->ID );
						gtatx_local_card( $gtatx_post->ID, $gtatx_cat ? $gtatx_cat[0]->name : '' );
					}
					?>
				</ul>
			</section>
		<?php endif; ?>

		<div class="gtatx-wrap gtatx-cta-wrap">
			<section class="gtatx-cta" aria-labelledby="plan-cta-title">
				<div class="gtatx-cta-text">
					<h2 id="plan-cta-title">Ready to plan your trip?</h2>
					<p>Tell us where you are going and we will show you the best ways to get there.</p>
					<a class="gtatx-button gtatx-button--black gtatx-arrow" href="<?php echo esc_url( home_url( '/plan-your-trip/' ) ); ?>">Plan my trip</a>
				</div>
				<div class="gtatx-cta-art"><img src="<?php echo esc_url( plugin_dir_url( GTATX_TOOLS_FILE ) . 'assets/images/mascots/guides-kangaroo.svg' ); ?>" alt=""></div>
			</section>
		</div>
	</article>
	<?php
endwhile;
gtatx_local_page_end();
