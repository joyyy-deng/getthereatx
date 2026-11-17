<?php
/**
 * LOCAL TESTING ONLY (see includes/local-templates.php): an event in the
 * Figma "Community Event Detail Template" layout. On the live site the
 * Elementor Pro Single template (wordpress/elementor/single-event.json) does this.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

gtatx_local_page_start( 'event' );
while ( have_posts() ) :
	the_post();
	$gtatx_id = get_the_ID();
	$gtatx_e  = gtatx_event_data( $gtatx_id );
	$gtatx_fact = function ( $label, $value ) {
		if ( '' === trim( (string) $value ) ) {
			return;
		}
		printf( '<div class="gtatx-fact"><dt>%s</dt><dd>%s</dd></div>', esc_html( $label ), wp_kses( $value, array( 'br' => array() ) ) );
	};
	?>
	<article>
		<?php if ( has_post_thumbnail() ) : ?>
			<div class="gtatx-hero"><?php the_post_thumbnail( 'full' ); ?></div>
		<?php endif; ?>

		<header class="gtatx-wrap gtatx-header">
			<a class="gtatx-back" href="<?php echo esc_url( home_url( '/community/#events' ) ); ?>">Back</a>
			<div class="gtatx-header-text" style="display:flex;flex-direction:column;gap:12px">
				<h1 class="gtatx-title"><?php the_title(); ?></h1>
				<?php // Figma "Description": the excerpt, or the event's description text. ?>
				<p class="gtatx-lead"><?php echo esc_html( has_excerpt() ? get_the_excerpt() : wp_strip_all_tags( get_the_content() ) ); ?></p>
			</div>
		</header>

		<div class="gtatx-wrap gtatx-event-body">
			<aside class="gtatx-details" aria-label="Event details">
				<dl>
					<?php
					$gtatx_fact( 'Date', esc_html( $gtatx_e['date'] ) );
					$gtatx_fact( 'Time', esc_html( $gtatx_e['time'] ) );
					$gtatx_fact( 'Location', esc_html( $gtatx_e['venue'] ) . ( $gtatx_e['address'] ? '<br>' . esc_html( $gtatx_e['address'] ) : '' ) );
					$gtatx_fact( 'Cost', esc_html( $gtatx_e['cost'] ) );
					$gtatx_fact( 'Ages', esc_html( $gtatx_e['ages'] ) );
					$gtatx_fact( 'Registration', esc_html( $gtatx_e['registration'] ) );
					?>
				</dl>
				<div class="gtatx-divider" aria-hidden="true"></div>
				<div class="gtatx-actions">
					<?php if ( $gtatx_e['website'] ) : ?>
						<a class="gtatx-button gtatx-button--green gtatx-arrow" href="<?php echo esc_url( $gtatx_e['website'] ); ?>" target="_blank" rel="noopener noreferrer">Book now<span class="screen-reader-text"> (opens in a new tab)</span></a>
					<?php endif; ?>
					<?php if ( $gtatx_e['ical'] ) : ?>
						<a class="gtatx-button gtatx-button--outline gtatx-arrow" href="<?php echo esc_url( $gtatx_e['ical'] ); ?>">Add to calendar</a>
					<?php endif; ?>
				</div>
			</aside>

			<div class="gtatx-event-main">
				<?php if ( $gtatx_e['what_to_bring'] ) : ?>
					<section class="gtatx-event-section">
						<h2>What to bring/What you will gain</h2>
						<ul class="gtatx-bullets">
							<?php foreach ( $gtatx_e['what_to_bring'] as $gtatx_item ) : ?>
								<li><?php echo esc_html( $gtatx_item ); ?></li>
							<?php endforeach; ?>
						</ul>
					</section>
				<?php endif; ?>
				<?php if ( $gtatx_e['hosted_by'] || $gtatx_e['contact'] ) : ?>
					<section class="gtatx-event-section">
						<h2>Hosted by</h2>
						<?php if ( $gtatx_e['hosted_by'] ) : ?>
							<p><?php echo esc_html( $gtatx_e['hosted_by'] ); ?></p>
						<?php endif; ?>
						<?php if ( $gtatx_e['contact'] ) : ?>
							<p><?php echo esc_html( $gtatx_e['contact'] ); ?></p>
						<?php endif; ?>
					</section>
				<?php endif; ?>
				<?php if ( $gtatx_e['accessibility'] ) : ?>
					<section class="gtatx-event-section">
						<h2>Accessibility</h2>
						<p><?php echo esc_html( $gtatx_e['accessibility'] ); ?></p>
					</section>
				<?php endif; ?>
				<?php if ( $gtatx_e['getting_there'] ) : ?>
					<section class="gtatx-event-section">
						<h2>Getting there</h2>
						<?php echo wp_kses_post( gtatx_getting_there_html( $gtatx_id ) ); ?>
					</section>
				<?php endif; ?>
			</div>
		</div>

		<?php
		$gtatx_more = gtatx_more_events( $gtatx_id );
		if ( $gtatx_more ) :
			?>
			<section class="gtatx-wrap gtatx-section gtatx-more" aria-labelledby="more-events-title">
				<h2 id="more-events-title" class="gtatx-section-title">More events</h2>
				<ul class="gtatx-cards">
					<?php
					foreach ( $gtatx_more as $gtatx_other ) {
						gtatx_local_card( $gtatx_other->ID, tribe_get_start_date( $gtatx_other->ID, false, 'D, M j' ), 'View event' );
					}
					?>
				</ul>
			</section>
		<?php endif; ?>
	</article>
	<?php
endwhile;
gtatx_local_page_end();
