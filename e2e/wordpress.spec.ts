import { expect, test } from '@playwright/test';
import { box, css, DESKTOP, expectAccessible, expectImagesNotStretched, expectNoSideScroll, PHONE, WIDTHS } from './helpers';

// The local WordPress copy (wordpress/local-dev, http://localhost:8888) after
// `npm run seed:wp`. Run with:  WP_BASE=http://localhost:8888 npm run test:e2e -- wordpress
// Without Elementor Pro these pages use the plugin's local preview templates;
// with it, the Elementor Theme Builder templates. The checks are the same.

const WP = process.env.WP_BASE;
test.skip(!WP, 'set WP_BASE=http://localhost:8888 to check the local WordPress');

// ?name= finds a post by its slug whatever the date in its address.
const PAGES = {
  optionA: '/?name=sample-option-a',
  optionB: '/?name=sample-option-b',
  blocks: '/?name=sample-post-body-blocks',
  helmet: '/?name=5-steps-of-a-helmet-fitting',
  transit: '/?name=transit-101',
  event: '/event/ride-to-the-future/',
  sampleEvent: '/event/sample-event/',
};

async function openWp(page: import('@playwright/test').Page, path: string, size = DESKTOP) {
  await page.setViewportSize(size);
  await page.goto(WP + path);
  await expect(page.locator('h1').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test('blog: Figma sizes, no date unless "Show date" is on', async ({ page }) => {
  await openWp(page, PAGES.transit);
  expect(await css(page.locator('h1'), 'font-size')).toBe('72px');
  await expect(page.getByText(/min read/)).not.toContainText('Updated');
  await expect(page.getByText(/min read/)).toContainText('By Get There ATX');
  expect((await box(page.locator('.gtatx-hero'))).height).toBe(360);

  await openWp(page, PAGES.optionB);
  await expect(page.getByText(/min read/)).toContainText('Updated');
  // The black "Plan my trip" button's text is white (the live theme colors links).
  expect(await css(page.getByRole('link', { name: 'Plan my trip' }), 'color')).toBe('rgb(255, 255, 255)');
});

test('Option B: regular-editor text gets the Figma styles', async ({ page }) => {
  await openWp(page, PAGES.optionB);
  const body = page.locator('.gtatx-classic');
  expect(await css(body.locator('h2').first(), 'font-size')).toBe('32px');
  expect(await css(body.locator('p').first(), 'font-size')).toBe('18px');
  const tip = body.locator('blockquote');
  expect(await css(tip, 'background-color')).toBe('rgb(240, 244, 248)');
  expect(await css(tip, 'border-left-width')).toBe('4px');
  expect(await css(body.locator('thead th').first(), 'border-bottom-width')).toBe('2px');
  expect(await css(body.locator('a.button'), 'background-color')).toBe('rgb(116, 171, 96)');
  await page.screenshot({ path: 'e2e/__screenshots__/wp-option-b-1440.png', fullPage: true });
});

test('Option A: the Elementor starter renders inside the template', async ({ page }) => {
  await openWp(page, PAGES.optionA);
  await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
  // Facts, Steps and Table are our Elementor widgets (editable lists), styled by blog.css.
  const facts = page.locator('.elementor-widget-gtatx-facts dl.gtatx-facts');
  expect(await css(facts, 'background-color')).toBe('rgb(240, 244, 248)');
  expect(await css(facts.getByText('75+ across Austin'), 'font-size')).toBe('22px');
  await expect(page.locator('.elementor-widget-gtatx-steps').getByRole('heading', { name: 'Step 1: Find a station' })).toBeVisible();
  const table = page.locator('.elementor-widget-gtatx-table table');
  await expect(table.getByRole('columnheader')).toHaveCount(3);
  await expect(table.getByRole('rowheader', { name: 'Row label' })).toHaveCount(3);
  // Step numbers: Figma's 40px navy squares, at desktop and phone width.
  for (const size of [DESKTOP, PHONE]) {
    await openWp(page, PAGES.optionA, size);
    const square = await box(page.locator('.gtatx-step-number').first());
    expect([square.width, square.height]).toEqual([40, 40]);
  }
  await openWp(page, PAGES.optionA);
  await page.screenshot({ path: 'e2e/__screenshots__/wp-option-a-1440.png', fullPage: true });
});

test('Option A: every block keeps Figma\'s 32px spacing on its own (24px on phones)', async ({ page }) => {
  for (const [size, space] of [[DESKTOP, 32], [PHONE, 24]] as const) {
    await openWp(page, PAGES.optionA, size);
    // Paragraph → Tip: the paragraph's own bottom margin is the only space between them.
    const para = await box(page.getByText(/^Body paragraph/));
    const tip = await box(page.locator('.e-con', { has: page.getByText('Tip', { exact: true }) }).last());
    expect(Math.round(tip.y - (para.y + para.height))).toBe(space);
  }
});

test('Post body blocks: each block in the Figma style', async ({ page }) => {
  await openWp(page, PAGES.blocks);
  const body = page.locator('.gtatx-classic');
  expect(await css(body.getByText('75+ across Austin'), 'font-size')).toBe('22px');
  expect(await css(body.locator('dl.gtatx-facts'), 'background-color')).toBe('rgb(240, 244, 248)');
  expect(await css(body.getByRole('heading', { name: 'How it works' }), 'font-size')).toBe('32px');
  expect(await css(body.locator('blockquote'), 'border-left-width')).toBe('4px');
  expect(await body.locator('blockquote').evaluate((el) => getComputedStyle(el, '::before').textTransform)).toBe('uppercase');
  // The picture is never wider than the column, never enlarged past its own size, at most 400px tall.
  const img = await box(body.locator('figure img'));
  expect(img.width).toBeLessThanOrEqual((await box(body.locator('dl.gtatx-facts'))).width);
  expect(img.height).toBeLessThanOrEqual(400);
  const square = await box(body.locator('.gtatx-step-number').first());
  expect([square.width, square.height]).toEqual([40, 40]);
  await expect(body.getByRole('heading', { name: 'Step 1: Find a station' })).toBeVisible();
  await expect(body.getByRole('columnheader', { name: 'Column one' })).toBeVisible();
  await expect(body.getByRole('rowheader', { name: 'Row label' }).first()).toBeVisible();
  await expect(body.getByText('Caption describing the image')).toBeVisible();
  expect(await css(body.getByRole('link', { name: 'Primary action' }), 'background-color')).toBe('rgb(116, 171, 96)');
  await page.screenshot({ path: 'e2e/__screenshots__/wp-blocks-1440.png', fullPage: true });
  await openWp(page, PAGES.blocks, PHONE);
  const stations = await box(body.getByText('75+ across Austin'));
  expect((await box(body.getByText('Open 24/7'))).y).toBeGreaterThan(stations.y);
});

test('event times are Austin time', async ({ page }) => {
  await openWp(page, PAGES.event);
  await expect(page.getByRole('complementary', { name: 'Event details' })).toContainText('1:00 PM – 5:00 PM');
});

test('helmet post: video in the hero', async ({ page }) => {
  await openWp(page, PAGES.helmet);
  // Click to play: no YouTube player until someone presses play.
  await expect(page.locator('.gtatx-hero iframe')).toHaveCount(0);
  await page.getByRole('button', { name: /Play video/ }).click();
  await expect(page.locator('.gtatx-hero iframe')).toHaveAttribute('src', /GdiiVwK9rZg/);
});

test('event: details card, live facts only, More events', async ({ page }) => {
  await openWp(page, PAGES.event);
  const card = page.getByRole('complementary', { name: 'Event details' });
  expect((await box(card)).width).toBe(384);
  await expect(card.getByText('$300')).toBeVisible();
  await expect(card.getByText('Ages', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Hosted by' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Accessibility' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'More events' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add to calendar' })).toHaveAttribute('href', /ical/);

  await openWp(page, PAGES.sampleEvent);
  for (const t of ['What to bring/What you will gain', 'Hosted by', 'Accessibility', 'Getting there']) {
    await expect(page.getByRole('heading', { name: t })).toBeVisible();
  }
  // Getting there is a list staff add to: the sample's 4th way (Scooter) starts a new row.
  const bus = await box(page.getByText('Route and stop'));
  const parking = await box(page.getByText('Parking details'));
  const scooter = await box(page.getByText('Where to find and park scooters'));
  expect(parking.y).toBe(bus.y);
  expect(scooter.y).toBeGreaterThan(bus.y);
  await page.screenshot({ path: 'e2e/__screenshots__/wp-event-1440.png', fullPage: true });
  await openWp(page, PAGES.sampleEvent, PHONE);
  const c = await box(page.getByRole('complementary', { name: 'Event details' }));
  expect(c.y).toBeLessThan((await box(page.getByRole('heading', { name: 'What to bring/What you will gain' }))).y);
  await page.screenshot({ path: 'e2e/__screenshots__/wp-event-375.png', fullPage: true });
});

for (const [name, path] of Object.entries(PAGES)) {
  test(`${name}: no sideways scroll, accessible, no stretched images`, async ({ page }) => {
    for (const width of WIDTHS) {
      await openWp(page, path, { width, height: 900 });
      await expectNoSideScroll(page);
    }
    for (const size of [PHONE, DESKTOP]) {
      await openWp(page, path, size);
      await expectAccessible(page);
      await expectImagesNotStretched(page);
    }
  });
}
