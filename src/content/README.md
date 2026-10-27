# Editing site content

Everything the site says lives in this folder as JSON. To change wording, a link or a list, edit a file here. You don't need to touch any page code.

## Which file controls what

| You want to change… | Edit |
|---|---|
| A heading, intro, button or label on a page | `pages.json` (one section per page: `home`, `plan`, `resources`, `students`, `community`, `notFound`) |
| The Home "Build confidence" rows | `pages.json` → `home.confidence.rows` |
| A row in the Resources directory | The client's Google Sheet ("Website Content", tab "Trip Planning"). See "Updating the Resources directory" below |
| The Resources filter tags and the Transportation dropdown, and which of the sheet's "For Who?" / "Type" words each one covers | `directory-tags.json` |
| Links used on Plan Your Trip, the Student page and the Students / Families / Seniors cards | `resources.json` |
| The blog posts behind the Home "Build confidence" rows | `posts.json` |
| The site map and test tasks (/dev/sitemap) | `sheets/site-map.csv`, `sheets/site-map-tasks.csv` |
| An upcoming event | `events.json` |
| Students / Families / Senior Citizens cards | `connect-cards.json` |
| Explore Austin cards | `explore-places.json` |
| Bus / Bike / Carpool / Walk cards on Resources | `resource-modes.json` |
| "Which sounds most like you?" cards | `personas.json` |
| Student page tabs and which resources each shows | `student-tabs.json` |
| Places you can pick on Plan Your Trip, and their map shapes | `places.json` |
| Mode cards on Plan Your Trip (times, costs, hand-off links) | `plan-modes.json` |
| "What matters to you?" chips | `plan-preferences.json` |
| CTX GO, Guaranteed Ride Home and other programs | `programs.json` |
| Site-wide alert banners | `alerts.json` |
| The fixed lists (modes, audiences, needs, place categories) and their labels | `taxonomies.ts` |

## Updating the Resources directory

The directory is the client's Google Sheet, copied in as is.

1. In Google Sheets: **File → Download → Microsoft Excel (.xlsx)**. Don't use the CSV download: it drops the web address behind each link and keeps only its title.
2. Run `npm run import-sheet -- "path/to/Website Content.xlsx"`. It copies the "Trip Planning" tab into `sheets/trip-planning.csv`, with each Link cell turned into its web address.
3. Run `npm run validate-content`. It lists anything to fix in the sheet (empty "For Who?", duplicate names, missing links).

## How records point at each other

Many records refer to others by **id** instead of repeating them. For example, a connect card's `resourceId` is a resource's `id`, and a confidence row's `postSlug` is a post's `slug`. If you rename an id, also update everything that points at it. The check below catches any you miss.

## Rules worth knowing

- **Text fields** like `"title": { "en": "…" }` are bilingual; add `"es": "…"` for Spanish later. Plain strings (as in `pages.json` and `resources.json`) are English only.
- **Images** need alt text: `{ "src": "…", "alt": "…" }`, and must be saved in the repo under `public/images/` (`"src": "/images/…"`). Links to images on other sites are rejected by the check, because they break when that site moves or deletes the file. Copies of getthereatx.com uploads are in `public/images/uploads/`.
- **Resources:** `oneLiner` must be 15 words or fewer, and `action` is the button label, so start it with a verb ("Find a carpool partner").
- **Posts, events and programs** have a `status` (`draft`, `published`, `archived`) and optional `publishAt` / `expiresAt` dates. Only published, in-date records show. Add `?preview=1` to a URL to see drafts.
- **Recurring events** are one record with a `recurrence`, not one record per date.

## Check your changes

```bash
npm run validate-content
```

This checks every file against its schema (`schema.ts`): missing fields, wrong types, duplicate ids and ids that point at nothing. `npm run build` runs it too, so broken content never ships. `npm run check-links` checks that every URL still loads.

## For developers

- `schema.ts` defines each file's shape (zod). `registry.ts` lists every file and its schema; adding a content file is one line there.
- Pages never import JSON directly. They call `src/data/index.ts`, which reads these files today and can be pointed at WordPress later without changing any page.
