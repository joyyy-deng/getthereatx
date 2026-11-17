import { expect, test } from '@playwright/test';
import { box, css, DESKTOP, expectAccessible, expectFocusRings, expectImagesNotStretched, expectNoSideScroll, open, PHONE, WIDTHS } from './helpers';

// Event template vs Figma "Community Event Detail Template": desktop 1014:2549,
// mobile 1015:277. /dev/templates/event has every field filled with Figma's text.

const TEMPLATE = '/dev/templates/event';
const REAL = ['/community/events/ride-to-the-future', '/community/events/bicycle-repair-clinic'];

test.describe('event template matches Figma: desktop 1440', () => {
  test.beforeEach(({ page }) => open(page, TEMPLATE, DESKTOP));

  test('hero 360px; back link; 72px title; 22px description', async ({ page }) => {
    expect((await box(page.locator('article > div').first())).height).toBe(360);
    await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeVisible();
    expect(await css(page.locator('h1'), 'font-size')).toBe('72px');
    expect((await box(page.locator('h1'))).x).toBe(128);
    expect(await css(page.getByText('Description', { exact: true }), 'font-size')).toBe('22px');
  });

  test('details card: 384px wide on the right, 80px from the sections', async ({ page }) => {
    const card = page.getByRole('complementary', { name: 'Event details' });
    const c = await box(card);
    expect(c.width).toBe(384);
    expect(c.x + c.width).toBe(1440 - 128);
    const main = await box(page.getByRole('heading', { name: 'Hosted by' }));
    expect(c.x - (main.x + main.width)).toBe(80);
    expect(await css(card, 'background-color')).toBe('rgb(240, 244, 248)');
    expect(await css(card.locator('dd').first(), 'font-size')).toBe('22px');
  });

  test('sections: 32px headings, 18px text, getting-there facts in a row', async ({ page }) => {
    expect(await css(page.getByRole('heading', { name: 'Getting there' }), 'font-size')).toBe('32px');
    expect(await css(page.getByText('Contact email or phone'), 'font-size')).toBe('18px');
    const bus = await box(page.getByText('Route and stop'));
    const parking = await box(page.getByText('Parking details'));
    expect(bus.y).toBe(parking.y);
  });

  test('buttons: Book now green, Add to calendar outlined, both full card width', async ({ page }) => {
    const book = page.getByRole('link', { name: /Book now/ });
    const cal = page.getByRole('link', { name: 'Add to calendar' });
    expect(await css(book, 'background-color')).toBe('rgb(116, 171, 96)');
    expect(await css(cal, 'border-top-width')).toBe('2px');
    expect((await box(book)).width).toBe(384 - 64);
  });

  test('More events: leaf band, 48px title, three cards in a row', async ({ page }) => {
    const more = page.getByRole('region', { name: 'More events' });
    expect(await css(more, 'background-color')).toBe('rgb(116, 171, 96)');
    expect(await css(more.getByRole('heading'), 'font-size')).toBe('48px');
    const cards = more.getByRole('link');
    await expect(cards).toHaveCount(3);
    expect((await box(cards.nth(0))).y).toBe((await box(cards.nth(2))).y);
  });

  test('Add to calendar downloads an .ics file', async ({ page }) => {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Add to calendar' }).click()]);
    expect(download.suggestedFilename()).toBe('sample-event.ics');
  });

  test('screenshot', async ({ page }) => {
    await page.screenshot({ path: 'e2e/__screenshots__/event-1440.png', fullPage: true });
  });
});

test.describe('event template matches Figma: phone 375', () => {
  test.beforeEach(({ page }) => open(page, TEMPLATE, PHONE));

  test('200px hero; 40px title; details card first, full width; 26px headings', async ({ page }) => {
    expect((await box(page.locator('article > div').first())).height).toBe(200);
    expect(await css(page.locator('h1'), 'font-size')).toBe('40px');
    expect(await css(page.getByText('Description', { exact: true }), 'font-size')).toBe('18px');
    const card = await box(page.getByRole('complementary', { name: 'Event details' }));
    expect(card.width).toBe(375 - 48);
    const firstSection = await box(page.getByRole('heading', { name: 'What to bring/What you will gain' }));
    expect(firstSection.y).toBeGreaterThan(card.y + card.height);
    expect(await css(page.getByRole('heading', { name: 'Hosted by' }), 'font-size')).toBe('26px');
  });

  test('getting-there facts stack; More events cards stack', async ({ page }) => {
    expect((await box(page.getByText('Parking details'))).y).toBeGreaterThan((await box(page.getByText('Route and stop'))).y);
    const more = page.getByRole('region', { name: 'More events' });
    expect(await css(more.getByRole('heading'), 'font-size')).toBe('32px');
    const cards = more.getByRole('link');
    expect((await box(cards.nth(1))).y).toBeGreaterThan((await box(cards.nth(0))).y);
  });

  test('screenshot', async ({ page }) => {
    await page.screenshot({ path: 'e2e/__screenshots__/event-375.png', fullPage: true });
  });
});

for (const path of [TEMPLATE, ...REAL]) {
  test(`${path}: no sideways scroll at any width`, async ({ page }) => {
    for (const width of WIDTHS) {
      await open(page, path, { width, height: 900 });
      await expectNoSideScroll(page);
    }
  });

  for (const size of [PHONE, DESKTOP]) {
    test(`${path}: accessible at ${size.width}px`, async ({ page }) => {
      await open(page, path, size);
      await expectAccessible(page);
    });

    test(`${path}: no stretched images at ${size.width}px`, async ({ page }) => {
      await open(page, path, size);
      await expectImagesNotStretched(page);
    });
  }
}

test('real event shows only the facts the live calendar has', async ({ page }) => {
  await open(page, '/community/events/ride-to-the-future', DESKTOP);
  const card = page.getByRole('complementary', { name: 'Event details' });
  await expect(card.getByText('$300')).toBeVisible();
  await expect(card.getByText('Ages', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Hosted by' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Accessibility' })).toHaveCount(0);
});

test('Community links to the event pages', async ({ page }) => {
  await open(page, '/community', DESKTOP);
  // Ride to the Future ended Nov 14, 2026; the repair clinic runs through Dec 31.
  await page.getByRole('link', { name: /RSVP: Bicycle Repair Clinic/ }).first().click();
  await expect(page).toHaveURL(/\/community\/events\/bicycle-repair-clinic$/);
  await expect(page.locator('h1')).toHaveText('Bicycle Repair Clinic @ Central APL');
});

test('keyboard: every tab stop shows a focus ring', async ({ page }) => {
  await open(page, TEMPLATE, DESKTOP);
  await expectFocusRings(page, 30);
});
