# Elementor templates

`home.json` is the Home page as an Elementor page template, built only from
normal Elementor pieces (Containers, Heading, Text Editor, Button, Image,
Accordion). Staff can click any word or picture in the Elementor editor and
change it. There are no HTML widgets.

It is generated from the site's own content, so it always matches the
prototype's wording and colors:

```bash
npm run build:elementor -- --images=https://raw.githubusercontent.com/joyyy-deng/getthereatx/main/wordpress/elementor/images
```

Run it again after any design or copy change, then re-import.

## Importing it on the live site (as a draft)

The images must be reachable on the web first: push this repo to GitHub so
`wordpress/elementor/images/` is online at the address above. Elementor's
importer downloads each image into the site's Media Library.

1. WP admin → **Templates → Saved Templates → Import Templates** → choose
   `home.json` → **Import Now**. It appears as **[WKRM] Sample Home**.
2. **Pages → Add New Page**, title **[WKRM] Sample Home**, keep it a **Draft**.
3. **Edit with Elementor** → the folder icon (Add Template) → **My Templates**
   → **[WKRM] Sample Home** → **Insert**.
4. Page settings (gear icon): Page Layout **Elementor Full Width**, turn on
   **Hide Title**.
5. **Save Draft** and **Preview**. Don't publish.

Nothing else on the site changes: colors and fonts are set on each widget, not
in Elementor's global Site Settings.

## Things to know

- **Font.** Widgets ask for Real Text Pro (`ff-real-text-pro`). The live site
  needs the Adobe Fonts kit loaded, either via Elementor Pro → Settings →
  Integrations → Adobe Fonts, or a Custom Code snippet with
  `<link rel="stylesheet" href="https://use.typekit.net/pgu6iej.css">`.
  Without it, browsers show a plain sans-serif.
- **Trip card.** The From / To form belongs to the trip planner tool, so on
  this page the card is a heading and a button to Plan Your Trip.
- **Re-importing** adds a new copy of the template; insert it into the page
  again (or delete the old template first).
- **Local testing:** `wordpress/.wp-env.json` runs Elementor 4.3.6 (same as
  live) and serves this folder at
  `http://wordpress/wp-content/uploads/gtatx-sample/`; build with
  `--images=http://wordpress/wp-content/uploads/gtatx-sample/images` and import
  with `wp elementor library import … --user=admin`.

---

# Blog and event templates

Built by `npm run build:elementor:templates -- --images=<address of wordpress/elementor/images>`
from the Figma blog and event frames (plan: `docs/cms-plan.md`). Same rules as
above: normal widgets only, colors and fonts set per widget, wording from
`pages.json`. They need the **gtatx-tools plugin** (dynamic tags, fields,
`css/blog.css`) and **Elementor Pro** for the Theme Builder and Loop files.

| File | Imports as | Type |
|---|---|---|
| `blog-starter.json` | [WKRM] Blog post starter | Section: insert into a post (Option A) |
| `block-*.json` | [WKRM] Block – Facts / Heading / Paragraph / Tip / Steps / Image / Table / Button | Section |
| `single-post.json` | [WKRM] Blog post | Theme Builder Single Post |
| `single-event.json` | [WKRM] Community event | Theme Builder Single (for Events) |
| `loop-item-related-card.json` | [WKRM] Related card | Loop Item (posts) |
| `loop-item-event-card.json` | [WKRM] Event card | Loop Item (events) |

**Importing (Joy does this; keep everything Draft, no display conditions):**

1. Templates → Saved Templates → Import Templates: import the two `loop-item-*` files first, then the rest.
2. Open **[WKRM] Blog post** in Elementor → the Loop Grid under "Keep reading" → **Choose a template** → [WKRM] Related card. Check its Query ID is `gtatx_related_posts`. Same for **[WKRM] Community event** → [WKRM] Event card, Query ID `gtatx_upcoming_events`.
3. Preview each with a real post / event (the eye icon → Settings → Preview Dynamic Content as).
4. Don't set display conditions on the live site; that's a launch step (`docs/cms-plan.md`).
5. Log each item in `docs/wordpress-changes.md`.

**Optional parts** hide themselves through CSS classes on their containers:
`gtatx-if-what_to_bring`, `gtatx-if-hosted_by`, `gtatx-if-accessibility`,
`gtatx-if-getting_there`, `gtatx-if-cost`, `gtatx-if-ages`, `gtatx-if-registration`,
`gtatx-if-website`, `gtatx-if-more_events`, `gtatx-if-related`,
`gtatx-if-hero_video` / `gtatx-if-no_hero_video`.

Locally, `npm run seed:wp` imports all of these (with Elementor Pro installed) and
sets the conditions on the local copy only. See `wordpress/local-dev/TESTING.md`.
