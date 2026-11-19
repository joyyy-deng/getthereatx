<?php
/**
 * QR code scan tracking redirect.
 *
 * The QR codes shown in the "Download CTX GO" modal point to
 *   /qr/eng/   and   /qr/spn/
 * on this site instead of straight to ctxgo.com. Each of those URLs renders a
 * tiny page that records a `qr_scan` event in Google Analytics (the same
 * property the rest of the site reports into) and then forwards the visitor
 * to ctxgo.com with the agreed UTM parameters.
 *
 * Why a page and not a plain 301/302: Google Analytics only records events
 * sent by a script running in the browser, so a server-side redirect would
 * never be counted.
 *
 * No WordPress page needs to exist and no permalink flush is required — the
 * request path is matched directly in template_redirect (which also runs for
 * requests WordPress would otherwise treat as a 404).
 *
 * To change a destination, edit ctx_qr_redirect_targets() below.
 */

/**
 * Slug => [ language label, destination URL ].
 */
function ctx_qr_redirect_targets() {
    return array(
        'eng' => array(
            'language' => 'ENG',
            'url'      => 'https://ctxgo.com/?utm_source=get_there_atx&utm_medium=qr_code&utm_content=ENG',
        ),
        'spn' => array(
            'language' => 'SPN',
            'url'      => 'https://ctxgo.com/?utm_source=get_there_atx&utm_medium=qr_code&utm_content=SPN',
        ),
    );
}

add_action('template_redirect', function () {
    $path = wp_parse_url(isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '', PHP_URL_PATH);
    if (!is_string($path) || !preg_match('#^/qr/(eng|spn)/?$#i', $path, $m)) {
        return;
    }

    $targets = ctx_qr_redirect_targets();
    $slug    = strtolower($m[1]);
    if (!isset($targets[$slug])) {
        return;
    }
    $language    = $targets[$slug]['language'];
    $destination = $targets[$slug]['url'];

    status_header(200);
    nocache_headers();
    // WordPress considers this path a 404; give the document a proper title
    // instead of its "Page not found" one.
    $doc_title = $language === 'SPN' ? 'Redirigiendo…' : 'Redirecting…';
    add_filter('pre_get_document_title', function () use ($doc_title) {
        return $doc_title;
    });
    // The Yoast SEO plugin (active on the live/dev sites) would otherwise
    // still title this page "Page not found" and mark it as a 404.
    add_filter('wpseo_title', function () use ($doc_title) {
        return $doc_title;
    }, 99);
    add_filter('wpseo_opengraph_title', function () use ($doc_title) {
        return $doc_title;
    }, 99);
    add_filter('wpseo_robots', function () {
        return 'noindex, nofollow';
    }, 99);
    global $wp_query;
    if ($wp_query instanceof WP_Query) {
        $wp_query->is_404 = false;
    }
    header('X-Robots-Tag: noindex, nofollow', true);
    ?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <noscript>
        <meta http-equiv="refresh" content="0;url=<?php echo esc_url($destination); ?>">
    </noscript>
    <?php wp_head(); ?>
</head>
<body>
<?php wp_body_open(); ?>
<p>
    <a href="<?php echo esc_url($destination); ?>"><?php echo esc_html($language === 'SPN' ? 'Continuar a CTX GO' : 'Continue to CTX GO'); ?></a>
</p>
<script>
(function () {
    var destination = <?php echo wp_json_encode($destination); ?>;
    var redirected = false;

    function go() {
        if (redirected) return;
        redirected = true;
        window.location.replace(destination);
    }

    // Never leave the visitor stuck: forward after 1.2s even if analytics
    // is blocked, slow, or has not loaded.
    setTimeout(go, 1200);

    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
        window.gtag = function () { window.dataLayer.push(arguments); };
    }

    window.gtag('event', 'qr_scan', {
        send_to: 'G-Z36TRK8V66',
        page_language: <?php echo wp_json_encode($language); ?>,
        transport_type: 'beacon',
        event_callback: go,
        event_timeout: 1000
    });
})();
</script>
<?php wp_footer(); ?>
</body>
</html>
    <?php
    exit;
}, 1);
