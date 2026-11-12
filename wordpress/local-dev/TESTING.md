# Try the CMS locally

A full copy of the client's editing setup on your Mac, at http://localhost:8888:
WordPress, Elementor, The Events Calendar, ACF, Classic Editor and our
plugin, filled with the real blog posts, events and external resources.
Nothing here touches getthereatx.com.

## Start it

Docker Desktop must be running. From the prototype folder:

```bash
cd wordpress && npx @wordpress/env start && cd ..
```

```bash
npm run seed:wp
```

Log in at http://localhost:8888/wp-admin with **admin / password**.
`npm run seed:wp` can be run again at any time. It puts the seeded posts,
events and resources back the way they are in the prototype; anything else you
create stays.

## Elementor Pro (optional, for the real templates)

Without Elementor Pro, blog posts and events use **local preview templates**
from our plugin. They look the same as the Figma designs, and a grey note in
the top bar says "Local preview template". That's enough to test editing.

To test the real Elementor Theme Builder templates as well:

1. Download Elementor Pro from your Elementor account (my.elementor.com →
   Downloads) and save it as `wordpress/local-dev/plugins/elementor-pro.zip`.
   That folder is git-ignored, so the zip is never committed.
2. Create `wordpress/.wp-env.override.json` (also git-ignored) with:

   ```json
   {
     "plugins": [
       "./gtatx-tools",
       "https://downloads.wordpress.org/plugin/elementor.4.3.6.zip",
       "./local-dev/plugins/elementor-pro.zip",
       "https://downloads.wordpress.org/plugin/the-events-calendar.latest-stable.zip",
       "https://downloads.wordpress.org/plugin/advanced-custom-fields.latest-stable.zip",
       "https://downloads.wordpress.org/plugin/classic-editor.latest-stable.zip"
     ]
   }
   ```

3. Run `npx @wordpress/env start` in `wordpress/` again, activate the license
   if Elementor asks, then run `npm run seed:wp`. It imports the Single Post,
   Single Event and card templates and turns them on, **locally only**.

## ACF PRO (for the Post body blocks box)

The **Post body** box (Add block → type into the boxes) is an ACF PRO field.
The live site has ACF PRO; this local copy has the free version, so the box is
hidden until you add PRO (the sample post's blocks still show on the page):

1. Download ACF PRO from your ACF account (advancedcustomfields.com → My
   Account → Licenses → Download) and save it as
   `wordpress/local-dev/plugins/advanced-custom-fields-pro.zip`.
2. In `wordpress/.wp-env.override.json` (see the Elementor Pro section below
   for the full file), replace the free ACF line with
   `"./local-dev/plugins/advanced-custom-fields-pro.zip"`.
3. Run `npx @wordpress/env start` in `wordpress/` again.

## Things to try (as the client would)

Tick these off with a phone-width preview too (in the browser, or the
Responsive mode in Elementor).

**Blogs**

- [ ] **Table, Facts strip, Steps.** Click one in Elementor: the left panel has
      a list. Table: pick 2–4 columns, type the headings, **Add row**. Facts:
      **Add fact** (three to a row; a fourth starts a new row). Steps:
      **Add step**, drag to reorder; the numbers update by themselves. They're
      also in the widget list under **GetThereATX**.
- [ ] **Images are never stretched.** Swap the image for a small or tall one:
      it keeps its shape and is never shown bigger than the file.
- [ ] **Spacing.** In Elementor, drag a block out of the starter, or add one
      from **[WKRM] Block – …** somewhere else: each block brings its own space
      below it (32px, 24px on phones), so nothing needs margins or padding.
- [ ] **Option A (Elementor).** Posts → Add New Post → give it a title, an
      excerpt (the description under the title) and a featured image →
      Save Draft → **Edit with Elementor** → folder icon → My Templates →
      **[WKRM] Blog post starter** → Insert. Type over the placeholder text,
      delete blocks you don't need, add one back from **[WKRM] Block – …**.
      Compare with "[Sample] Built in Elementor (Option A)".
- [ ] **Option B with Post body blocks (fill in the boxes).** Needs ACF PRO
      (see below). On a post, scroll to **Post body** → **Add block** → pick
      Section heading, Paragraph, Tip, Steps, Facts strip, Image, Table or
      Button → type into its boxes. Drag blocks to reorder. Preview to see
      the Figma layout. Compare with "[Sample] Written with Post body blocks
      (Option B)", which shows even without ACF PRO.
- [ ] **Option B (regular editor).** Add a post and just type. Try a heading
      (Heading 2), a list, an image with a caption, a table and a quote. The
      quote becomes the "Tip" box. Compare with "[Sample] Written in the
      regular editor (Option B)".
- [ ] **No date by default.** Open any post: under the title it says
      "5 min read · By Get There ATX", no date. Tick **Show date** (right
      sidebar, "Blog page settings") and preview: "Updated Nov 2026" appears.
- [ ] **By.** Type a name in **By**; the line under the title changes.
- [ ] **Hero video.** Paste a YouTube link in **Hero video**: it replaces the
      featured image (see "5 Steps of a Helmet Fitting").
- [ ] **Keep reading** shows 3 other posts from the same category. Change a
      post's category and watch it move.
- [ ] **Categories.** Posts → Categories: rename one; cards show the new name.

**Community events** (Events → Add New)

- [ ] Fill in the title, the excerpt (the description under the title), a
      featured image, date and time, venue, organizer, cost and the event
      website. The website becomes **Book now**; **Add to calendar** works on
      its own.
- [ ] Scroll to **Event page details**: ages, registration, what to bring (one
      per line), partners, contact, accessibility. Each part shows only when
      filled in.
- [ ] **Getting there** (needs ACF PRO): **Add a way to get there** → a label
      (Bus, Scooter, Walk, Parking…) and the details. Add as many as you like;
      three sit in a row on desktop and the rest wrap. The sample event has a
      fourth (Scooter) to show it. Compare "Ride to the Future" (only the live
      calendar's facts) with "[Sample] Event with every field".
- [ ] **More events** lists the next upcoming events.

**External resources** (External resources → Add)

- [ ] Add a link: web address, who runs it, button text, a one-line
      description, and the directory filters. These feed the Resources page
      once it reads from WordPress (next phase).

## Automated checks

With the site running and seeded:

```bash
WP_BASE=http://localhost:8888 npm run test:e2e -- wordpress
```

This checks the Figma sizes, no date by default, the Option B styles, the
event facts and sections, sideways scrolling at 320–1440px, and accessibility
(axe).

## Page addresses

The local copy uses the new addresses: blogs at **/guides/<name>/**, events at
**/community/events/<name>/**. Old links (/<name>/, /event/<name>/) move there
by themselves. On the live site this is a launch step (see the comment at the
end of `wordpress/gtatx-tools/includes/content.php`).

## Stop it

```bash
cd wordpress && npx @wordpress/env stop
```
