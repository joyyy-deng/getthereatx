<?php
/**
 * Runs when the plugin is deleted from the Plugins screen: removes the one
 * setting the plugin keeps. Posts, events and their fields are left alone.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'gtatx_new_addresses' );
