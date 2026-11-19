<?php
/**
 * Get There ATX (Hello): child theme of Hello Elementor.
 *
 * It replaces the custom "Get there ATX" theme. What it keeps from that theme:
 *
 * - inc/from-old-theme/  The old theme's own files, unchanged: the QR code redirects
 *                        (/qr/eng/, /qr/spn/), [copyright_date], Global Options, excerpts,
 *                        archive titles, the weather data, the admin columns.
 * - inc/setup.php        The rest of the old functions.php (menus, page excerpts, Contact Form 7).
 * - inc/old-parts.php    The CTX GO landing pages (English + Spanish), the old Elementor
 *                        widgets and their pictures. These are copied in from the old theme on
 *                        the server: WP admin → Tools → GetThereATX theme switch → Copy.
 * - inc/assets.php       The Adobe Fonts kit everywhere; the old theme's CSS, scripts and Google
 *                        Maps only on pages that still use the old widgets or the CTX template.
 *
 * README.md has the switch-over steps.
 */

defined( 'ABSPATH' ) || exit;

const GTATX_CHILD_VERSION = '1.0.0';

require_once __DIR__ . '/inc/setup.php';
require_once __DIR__ . '/inc/from-old-theme/shortcode.php';
require_once __DIR__ . '/inc/from-old-theme/theme_function.php';
require_once __DIR__ . '/inc/old-parts.php';
require_once __DIR__ . '/inc/elementor.php';
require_once __DIR__ . '/inc/assets.php';
require_once __DIR__ . '/inc/from-old-theme/qr-redirect.php';
