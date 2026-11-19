# Get There ATX (Hello)

Child theme of **Hello Elementor**. It replaces the custom "Get there ATX" theme.

## What it keeps from the old theme

| Old theme | Here |
|---|---|
| `/qr/eng/` and `/qr/spn/` QR redirects (printed QR codes point at these) | `inc/from-old-theme/qr-redirect.php`, unchanged |
| `[copyright_date]`, shortcodes in text widgets | `inc/from-old-theme/shortcode.php`, unchanged |
| Global Options page, excerpts (30 words, …), archive titles, weather/air data, admin thumbnail + layout columns, CF7 no auto-paragraphs | `inc/from-old-theme/theme_function.php`, unchanged |
| Menu locations, page excerpts, Contact Form 7 only on pages with a form | `inc/setup.php` |
| CTX GO landing pages (EN + ES), their ACF fields and language pairing | copied in from the old theme on the server (below) |
| The 10 "Get there ATX" Elementor widgets | copied in; loaded by `inc/elementor.php` |
| Theme CSS, `plugins.js`, `scripts.js`, `getthereatx.js`, Google Maps | copied in; load **only** on pages that use an old widget or the CTX template (`inc/assets.php`) |
| Google Analytics, if the old header printed it | loaded by `inc/assets.php` when the copy finds it |

New: the Adobe Fonts kit (`pgu6iej`, Real Text Pro) loads on every page.

## Switch-over (Joy, on the live site)

Before launch day, nothing here changes what visitors see:

1. **Plugins:** upload `gtatx-tools.zip` (0.3.1 or newer), "Replace current with uploaded".
2. **Appearance → Themes → Add New Theme:** search **Hello Elementor**, Install. **Don't activate.**
3. **Add New Theme → Upload Theme:** `getthereatx-hello.zip`, Install. **Don't activate.**
4. **Tools → GetThereATX theme switch:** read sections 3–5, then press **Copy into Get There ATX (Hello)**.
   Every row in sections 2 and 4 should show ✅.
5. **Appearance → Themes → Get There ATX (Hello) → Live Preview.** Click through: Home, CTX GO (EN
   and ES), a blog post, an event, Contact, any page listed in section 5. Close without activating.

Launch day:

6. Elementor → Templates → Theme Builder: set the [WKRM] Header and Footer to **Entire site**,
   **excluding both CTX GO pages** (English and Spanish).
7. **Activate Get There ATX (Hello).** Check `/qr/eng/` and `/qr/spn/` forward to ctxgo.com.
8. Keep the old theme installed (inactive) until after the Dec 3 presentation. It's the undo:
   activate it again and the site is back as it was.

If something on an old page looks unstyled after the switch, the page may need the old theme's CSS
even though it uses no old widget. A developer can add its ID with the `gtatx_child_load_old_assets` filter.
