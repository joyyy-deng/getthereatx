<?php
/**
 * LOCAL TESTING ONLY (mounted by wordpress/.wp-env.json, never shipped).
 * Lets Elementor's template importer download images from the wp-env
 * containers' own address (http://wordpress/…), which WordPress otherwise
 * blocks as a private network address. The live site imports from a public
 * address and doesn't need this.
 */
add_filter( 'http_request_host_is_external', function ( $external, $host ) {
	return 'wordpress' === $host ? true : $external;
}, 10, 2 );
