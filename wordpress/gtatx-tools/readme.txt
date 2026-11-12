=== GetThereATX Tools ===
Requires at least: 6.0
Requires PHP: 7.4
Version: 0.2.0
License: GPL-2.0-or-later

The GetThereATX trip planner and resources directory, for use on getthereatx.com.

== What it does ==

Adds two shortcodes. Put one on a page and the tool appears there, inside your
theme's normal header and footer.

  [gtatx_trip_planner]   Plan Your Trip: map, From/To, mode cards, links out to CapMetro, Google Maps, DriveTexas and more.
  [gtatx_resources]      The resources directory, with its mode, audience and search filters.

Nothing else on the site changes:
- The plugin's script and styles load ONLY on pages that use one of the shortcodes.
- All of its styles are scoped under the .gtatx-app wrapper, so the theme's
  colors, fonts, buttons and headings are untouched everywhere else.
- It adds no settings, menus, database tables or post types.

== Install ==

1. In WordPress admin, go to Plugins > Add New Plugin > Upload Plugin.
2. Choose gtatx-tools.zip and click Install Now, then Activate.
3. Create a new page (keep it Draft or Private until it's approved), named
   "[WKRM] Plan Your Trip".
4. Add the shortcode:
   - Block editor: add a "Shortcode" block and type [gtatx_trip_planner]
   - Elementor: drag in a "Shortcode" widget and type [gtatx_trip_planner]
5. Preview the page. Do the same with [gtatx_resources] on a second page.

Note: in the Elementor editor the tool may show as an empty box. Use Preview to see it working.

== Options ==

Links to other pages. The tools link to Home, Plan Your Trip, Community,
Resources and Student Resources. The defaults are /, /plan-your-trip/,
/community/, /resources/ and /resources/students/. If the real pages live
elsewhere, a developer can change them in the theme's functions.php:

  add_filter( 'gtatx_tools_pages', function ( $pages ) {
      $pages['plan'] = home_url( '/plan/' );
      return $pages;
  } );

Width. By default each tool stretches to the full page width, like the Figma
design, even when the theme puts page content in a narrow column. To keep a
tool inside the column instead:

  [gtatx_trip_planner width="content"]

Page title. Hide the theme's page title on these pages (Elementor: page
settings > Hide Title), since each tool has its own heading.

Trip links. Plan Your Trip keeps the trip in the page address
(?from=downtown&to=mueller&pref=cost), so refreshing, going back and sharing
the link all bring back the same trip.

== Uninstall ==

Deactivate and delete the plugin under Plugins, then remove the shortcodes
from any pages that used them. The plugin stores nothing in the database.

== For developers: building ==

From the prototype repo:

  npm run build:wp   Validates content, then builds into wordpress/gtatx-tools/build/
                     and copies the mode images into wordpress/gtatx-tools/assets/.
  npm run zip:wp     Builds, then creates wordpress/gtatx-tools.zip.

The plugin build uses vite.wp.config.ts and the entry src/wp/main.tsx. The
GitHub Pages prototype (vite.config.ts) is separate and unaffected.

Content still comes from the JSON bundled with the build (src/content/). A
later phase switches it to WordPress data.

== For developers: testing on a local WordPress ==

Never test on the live site first. Two easy options:

Option A: LocalWP (no command line)
1. Install LocalWP from localwp.com and create a new site (any name, "Preferred" settings).
2. Click "WP Admin", then install gtatx-tools.zip as in "Install" above.
3. Make a page with [gtatx_trip_planner] and view it.

Option B: wp-env (needs Docker Desktop running)
1. In the repo's wordpress/ folder, run:
     npx @wordpress/env start
   wordpress/.wp-env.json pins the live site's versions (WordPress 7.1.4,
   PHP 8.4) and loads the plugin folder directly, so a rebuild shows on reload.
2. Open http://localhost:8888/wp-admin (wp-env's default login is admin / password).
3. Activate "GetThereATX Tools", make a page with the shortcode, and view it.
4. Stop with: npx @wordpress/env stop

What to check:
- The trip planner: pick From and To, see the mode cards, click a hand-off
  button (it opens a new tab), refresh and confirm the trip is still there.
- The resources page: mode cards, "Which sounds most like you?" cards, search.
- A page WITHOUT a shortcode: in the browser's dev tools (Network tab), no
  gtatx-tools.js or gtatx-tools.css is loaded.
- The theme's header and footer look the same as on other pages.

== Blog posts, community events and external resources (0.2.0) ==

- Fields (ACF): "Blog page settings" on posts (Show date: off by default, By,
  Hero video), "Event page details" on events, "Resources directory filters"
  on posts and external resources.
- An "External resources" post type (links shown in the Resources directory).
- Elementor dynamic tags: "GetThereATX text" and "GetThereATX link".
- css/blog.css: Figma styles for posts written in the regular editor, loaded
  on single posts and events only and scoped to our templates' wrappers.
- Elementor Loop Grid Query IDs: gtatx_related_posts, gtatx_upcoming_events.

None of this changes how existing pages look until the Elementor templates in
wordpress/elementor/ are imported and turned on. The local preview templates
(includes/local-templates.php) only run when GTATX_LOCAL_TEMPLATES is defined
and Elementor Pro is not active; the live site has neither.
