# Elementor templates

Page, header and footer templates for the redesigned site, built only from normal
Elementor pieces (Containers, Heading, Text Editor, Image, Nested Accordion, Icon,
Shortcode, plus Pro's Nav Menu and Loop Grid). Staff can click any word or picture in the
Elementor editor and change it. There are no HTML widgets. Colors and fonts are set on
each widget, never in Elementor's global Site Settings.

They are generated from the site's own content (`src/content/pages.json`, `theme.json`,
...) and follow the React site's layout and sizes at desktop, tablet and 393px phone width.

**Step-by-step import for the live site: `docs/live-elementor-runbook.md`** (private, not
in git). Keep everything Draft, no display conditions, never publish.

## Files

| File | Imports as | Type | Elementor Pro |
|---|---|---|---|
| `home.json` | [WKRM] Sample Home | Page | no |
| `community.json` | [WKRM] Community | Page | the events Loop Grid |
| `plan.json` | [WKRM] Plan your trip | Page (one `[gtatx_trip_planner]` shortcode) | no |
| `resources-page.json` | [WKRM] Resources | Page (one `[gtatx_resources]` shortcode) | no |
| `header.json` | [WKRM] Header | Theme Builder Header (Nav Menu widget) | yes |
| `footer.json` | [WKRM] Footer | Theme Builder Footer | yes |
| `loop-item-event-card.json` | [WKRM] Event card | Loop Item (events) | yes |
| `loop-item-related-card.json` | [WKRM] Related card | Loop Item (posts) | yes |
| `single-post.json`, `single-event.json` | [WKRM] Blog post / Community event | Theme Builder Single | yes |
| `blog-starter.json`, `block-*.json` | [WKRM] Blog post starter / Block - ... | Section | no |

Import order: loop items first, then the rest. Plan and Resources are interactive screens
drawn by the `gtatx-tools` plugin (the same React code as the prototype), so those two
templates are just a shortcode and need the plugin active.

## Rebuilding (after a design or copy change)

```bash
npm run build:elementor            # home.json
npm run build:elementor:site       # header, footer, community, plan, resources-page
npm run build:elementor:templates -- --images=https://raw.githubusercontent.com/joyyy-deng/getthereatx/main/wordpress/elementor/images
npm run build:elementor:art        # only if the artwork or logo changed (renders PNGs into images/)
npm run check:elementor            # must say "All good" before importing
```

The first two default to the public image address above (the repo's raw GitHub folder),
which is online after a push. The importer downloads each picture into the Media Library.
`check:elementor` lists every image the templates use, and fails on missing phone values,
wide fixed widths, images outside the public address, or wording that is not in the content
files.

## Things to know

- **Font.** Widgets ask for Real Text Pro (`ff-real-text-pro`); the site needs the Adobe
  Fonts kit loaded (runbook step 1).
- **Trip card.** The From / To form belongs to the plugin, so on Home the card is a heading
  and a button to Plan your trip.
- **Menu.** The header's Nav Menu widget shows the menu with slug `gtatx-main` (Appearance
  -> Menus, runbook step 2).
- **Re-importing** adds a new copy of the template; delete the old one first.
- **Local testing** (no Pro): `wordpress/.wp-env.json` serves this folder at
  `http://wordpress/wp-content/uploads/gtatx-sample/`. Build with
  `--images=http://wordpress/wp-content/uploads/gtatx-sample/images`, import with
  `wp elementor library import ... --user=admin`, then rebuild with the default address
  before committing. Header, footer and loop files need Pro and will not import locally.

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
