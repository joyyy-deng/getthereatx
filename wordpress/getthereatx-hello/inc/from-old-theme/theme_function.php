<?php

/**
 * Add active class to menu
 */
function special_nav_class($classes, $item) {
    if (in_array('current_page_item', $classes) || in_array('current-page-ancestor', $classes) || in_array('current-menu-item', $classes)) {
        $classes[] = 'active';
    }
    return $classes;
}

add_filter('nav_menu_css_class', 'special_nav_class', 10, 2);

/**
 * CF7
 */
add_filter('wpcf7_autop_or_not', '__return_false');

/**
 * Custom excerpt lenght 
 */
function custom_excerpt($limit, $excerpt) {
    if (strlen($excerpt) > $limit) {
        $excerpt = preg_replace(" (\[.*?\])", '', $excerpt);
        $excerpt = strip_shortcodes($excerpt);
        $excerpt = strip_tags($excerpt);
        $excerpt = substr($excerpt, 0, $limit);
        $excerpt = substr($excerpt, 0, strripos($excerpt, " "));
        $excerpt = trim(preg_replace('/\s+/', ' ', $excerpt));
        $excerpt = $excerpt . '...';
    }
    return $excerpt;
}

/**
 * if ACF not exist
 */
if( !class_exists( 'acf' ) && !is_admin() ) {
    function get_field_reference( $field_name, $post_id ) { return ''; }
    function get_field_objects( $post_id = false, $options = array() ) { return false; }
    function get_fields( $post_id = false ) { return false; }
    function get_field( $field_key, $post_id = false, $format_value = true )  { return false; }
    function get_field_object( $field_key, $post_id = false, $options = array() ) { return false; }
    function the_field( $field_name, $post_id = false ) {}
    function have_rows( $field_name, $post_id = false ) { return false; }
    function the_row() {}
    function reset_rows( $hard_reset = false ) {}
    function has_sub_field( $field_name, $post_id = false ) { return false; }
    function get_sub_field( $field_name ) { return false; }
    function the_sub_field( $field_name ) {}
    function get_sub_field_object( $child_name ) { return false;}
    function acf_get_child_field_from_parent_field( $child_name, $parent ) { return false; }
    function register_field_group( $array ) {}
    function get_row_layout() { return false; }
    function acf_form_head() {}
    function acf_form( $options = array() ) {}
    function update_field( $field_key, $value, $post_id = false ) { return false; }
    function delete_field( $field_name, $post_id ) {}
    function create_field( $field ) {}
    function reset_the_repeater_field() {}
    function the_repeater_field( $field_name, $post_id = false ) { return false; }
    function the_flexible_field( $field_name, $post_id = false ) { return false; }
    function acf_filter_post_id( $post_id ) { return $post_id; }
}

/*
 * Get page id by template
 */
function theme_get_template_id($name = '') {
    if (!$name) {
        return '';
    }
    $args = array(
        'post_type' => 'page',
        'fields' => 'ids',
        'nopaging' => true,
        'meta_key' => '_wp_page_template',
        'meta_value' => $name
    );
    $pages = new WP_Query($args);
    if (!empty($pages->posts[0])) {
        return $pages->posts[0];
    } else {
        return '';
    }
}

/*
 * Add global option page
 */
if (function_exists('acf_add_options_page')) {
    acf_add_options_page(array(
        'page_title' => __('Theme General Settings', 'getthereatx'),
        'menu_title' => __('Global Options', 'getthereatx'),
        'capability' => 'edit_posts',
    ));
}

/*
 * Search query
 */
/*add_action( 'pre_get_posts', 'theme_search_page_query' );
function theme_search_page_query($query) {
    if ( !is_admin() && $query->is_main_query() && $query->is_search ) {
        $query->set( 'posts_per_page', -1 );
    }
}*/



/*
 * Weather api ( get current weather )
 */
function get_api_weather_data(){

    // is set cached data - return cached data
    $weather_data = get_transient( 'getthereatx_api_weather_data' );
    if ($weather_data) {
        return $weather_data;
    }



    $place = get_field('place','option');

  
    $apikey = get_field('weather_api_key','option');
    if ($apikey && $place) {

        $lat = $place['lat'];
        $lng = $place['lng'];
        
        $url_base = 'https://api.openweathermap.org/data/2.5/weather';    
        $params   = array(
            'lat'   => $lat,
            'lon'   => $lng,
            'appid'     => $apikey,
        );
        $url = add_query_arg( $params, $url_base );       
        $response = wp_remote_get( $url );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code($response);
        if (200 !== $code) {
            return new WP_Error('api_failed', __( 'Remote response return error code', 'getthereatx' ));
        }

        $body = wp_remote_retrieve_body( $response );
        if ( ! $body ) {
            return new WP_Error('api_failed', __( 'Remote response body not exist', 'getthereatx' ));
        }

        $data_api = json_decode( $body, true );
        return $data_api;

    } else {
        return new WP_Error('api_failed', __( 'Not set "api key" or "place" on "Theme Options" page ("Weather api tab)', 'getthereatx' ));
    }

}

/*
 * Weather api ( get current air pollution )
 */
function get_api_air_pollution_data(){

    // is set cached data - return cached data
    $air_pollution_data = get_transient( 'getthereatx_api_air_pollution_data' );
    if ($air_pollution_data) {
        return $air_pollution_data;
    }



    $place = get_field('place','option');

  
    $apikey = get_field('weather_api_key','option');
    if ($apikey && $place) {

        $lat = $place['lat'];
        $lng = $place['lng'];
        
        $url_base = 'https://api.openweathermap.org/data/2.5/air_pollution';    
        $params   = array(
            'lat'   => $lat,
            'lon'   => $lng,
            'appid'     => $apikey,
        );
        $url = add_query_arg( $params, $url_base );
        $response = wp_remote_get( $url );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code($response);
        if (200 !== $code) {
            return new WP_Error('api_failed', __( 'Remote response return error code', 'getthereatx' ));
        }

        $body = wp_remote_retrieve_body( $response );
        if ( ! $body ) {
            return new WP_Error('api_failed', __( 'Remote response body not exist', 'getthereatx' ));
        }

        $data_api = json_decode( $body, true );
        return $data_api;

    } else {
        return new WP_Error('api_failed', __( 'Not set "api key" or "place" on "Theme Options" page ("Weather api tab)', 'getthereatx' ));
    }

}

/*
 * Refresh weather api data
 */
add_action('init','theme_getthereatx_refresh_weather_api_data');
function theme_getthereatx_refresh_weather_api_data(){
    $weather_data = get_transient( 'getthereatx_api_weather_data' );
    if (!$weather_data) {
        $wdata = get_api_weather_data();
        if (!is_wp_error($wdata) && !empty($wdata['weather'][0]['icon'])  && !empty($wdata['main']['temp'])) {
            set_transient( 'getthereatx_api_weather_data' , $wdata, 1 * HOUR_IN_SECONDS );
        }
    }


    $air_pollution_data = get_transient( 'getthereatx_api_air_pollution_data' );
    if (!$air_pollution_data) {
        $apdata = get_api_air_pollution_data();
        if (!is_wp_error($apdata) && !empty($apdata['list'][0]['main']['aqi'])) {
            set_transient( 'getthereatx_api_air_pollution_data' , $apdata, 1 * HOUR_IN_SECONDS );
        }
    }
}

/*
 * Change  archive titles on archive pages
 */
add_filter('get_the_archive_title', function ($title) {
    if (is_category()) {
        $title = single_cat_title('', false);
    } elseif (is_tag()) {
        $title = single_tag_title('', false);
    } elseif (is_author()) {
        $title = '<span class="vcard">' . get_the_author() . '</span>';
    } elseif (is_tax()) { //for custom post types
        $title = sprintf(__('%1$s'), single_term_title('', false));
    } elseif (is_post_type_archive()) {
        $title = post_type_archive_title('', false);
    }
    return $title;
});

/*
 * Add thumbs to list posts in admin
 */
add_action('init', 'add_post_thumbs_in_post_list_table', 20);
function add_post_thumbs_in_post_list_table() {

    $supports = get_theme_support('post-thumbnails');
    $ptype_names = array('post');

    if (!isset($ptype_names)) {
        if ($supports === true) {
            $ptype_names = get_post_types(array('public' => true), 'names');
            $ptype_names = array_diff($ptype_names, array('attachment'));
        } elseif (is_array($supports)) {
            $ptype_names = $supports[0];
        }
    }
    foreach ($ptype_names as $ptype) {
        add_filter("manage_{$ptype}_posts_columns", 'add_thumb_post_column');
        add_action("manage_{$ptype}_posts_custom_column", 'add_thumb_post_value', 10, 2);
    }
}

function add_thumb_post_column($columns) {
    add_action('admin_notices', function () {
        echo '
        <style>
            .column-thumbnail{ width:80px; text-align:center; }
            .column-thumbnail img {max-width:80px;height: auto;border: 1px solid #000;}
        </style>';
    });
    $num = 1;
    $new_columns = array('thumbnail' => __('Thumbnail', 'getthereatx'));
    return array_slice($columns, 0, $num) + $new_columns + array_slice($columns, $num);
}

function add_thumb_post_value($colname, $post_id) {
    if ('thumbnail' == $colname) {
        $width = $height = 80;
        if ($thumbnail_id = get_post_meta($post_id, '_thumbnail_id', true)) {
            $thumb = wp_get_attachment_image($thumbnail_id, array($width, $height), true);
        }
        echo empty($thumb) ? '<img class="column-thumbnail-img" src="' . get_stylesheet_directory_uri() . '/images/no-thumb.png">' : $thumb;
    }
}

/*
 * Add post layout field to list posts in admin
 */
add_action('init', 'add_post_layout_in_post_list_table', 30);
function add_post_layout_in_post_list_table() {

    $ptype_names = array('post');
    foreach ($ptype_names as $ptype) {
        add_filter("manage_{$ptype}_posts_columns", 'add_post_layout_column');
        add_action("manage_{$ptype}_posts_custom_column", 'add_post_layout_value', 10, 2);
    }
}

function add_post_layout_column($columns) {
    add_action('admin_notices', function () {
        echo '
        <style>
            .column-post_layout{ width:50px; text-align:center; }
        </style>';
    });
    $num = 7;
    $new_columns = array('post_layout' => __('Layout', 'getthereatx'));
    return array_slice($columns, 0, $num) + $new_columns + array_slice($columns, $num);
}

function add_post_layout_value($colname, $post_id) {
    if ('post_layout' == $colname) {
        $post_layout = get_field('post_layout', $post_id);
        echo ($post_layout) ? __( 'Large', 'getthereatx' ) : __( 'Small', 'getthereatx' );
    }
}


/**
 * Change the excerpt more string
 */
 function theme_theme_excerpt_more( $more ) {
     return '&hellip;';
 }
 add_filter( 'excerpt_more', 'theme_theme_excerpt_more' );

function custom_excerpt_length( $length ) {
    return 30;
}
add_filter( 'excerpt_length', 'custom_excerpt_length', 999 );
