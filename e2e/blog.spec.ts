import { expect, test } from '@playwright/test';
import { box, css, DESKTOP, expectAccessible, expectFocusRings, expectImagesNotStretched, expectNoSideScroll, open, PHONE, WIDTHS } from './helpers';

// Blog template vs Figma "Article/blog Master template": desktop 980:1883 (1440px),
// mobile 981:2335 (393px frame; checked at 375). /dev/templates/blog is the
// template filled with Figma's own placeholder text, so every block is present.

const TEMPLATE = '/dev/templates/blog';
const REAL = ['/guides/transit-101', '/guides/5-steps-of-a-helmet-fitting', '/guides/biking-101'];

test.describe('blog template matches Figma: desktop 1440', () => {
  test.beforeEach(({ page }) => open(page, TEMPLATE, DESKTOP));

  test('hero 360px tall, full width', async ({ page }) => {
    const hero = await box(page.locator('article > div').first());
    expect(hero.height).toBe(360);
    expect(hero.width).toBe(1440);
  });

  test('header: back link, 72px title at the 128px margin, 22px description, 14px meta with no date', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeVisible();
    const h1 = page.locator('h1');
    expect(await css(h1, 'font-size')).toBe('72px');
    expect(await css(h1, 'font-weight')).toBe('700');
    expect((await box(h1)).x).toBe(128);
    expect(await css(page.getByText(/one or two sentence summary/), 'font-size')).toBe('22px');
    const meta = page.getByText(/min read/);
    expect(await css(meta, 'font-size')).toBe('14px');
    await expect(meta).not.toContainText('Updated');
  });

  test('body blocks: 32px headings, 18/28.8px text, facts in a row, steps, table, button', async ({ page }) => {
    const h2 = page.getByRole('heading', { level: 2, name: 'How it works' });
    expect(await css(h2, 'font-size')).toBe('32px');
    const p = page.getByText(/^Body paragraph/);
    expect(await css(p, 'font-size')).toBe('18px');
    expect(await css(p, 'line-height')).toBe('28.8px');
    // Facts: three in one row, values 22px bold.
    const values = page.locator('dd');
    expect(await css(values.first(), 'font-size')).toBe('22px');
    const tops = await Promise.all([0, 1, 2].map(async (i) => (await box(values.nth(i))).y));
    expect(new Set(tops).size).toBe(1);
    // Steps: 40px navy squares.
    const square = page.locator('ol li > span').first();
    expect((await box(square)).width).toBe(40);
    expect(await css(square, 'background-color')).toBe('rgb(23, 50, 77)');
    // Tip: 4px navy bar on mist.
    const tip = page.getByText('Tip', { exact: true }).locator('xpath=../..');
    expect(await css(tip, 'background-color')).toBe('rgb(240, 244, 248)');
    // Image: inside Figma's media box, at most 400px tall, never stretched.
    expect((await box(page.locator('figure img'))).height).toBeLessThanOrEqual(400);
    // Table header: 2px rule.
    expect(await css(page.locator('thead tr'), 'border-bottom-width')).toBe('2px');
    // Button: leaf green, not full width on desktop.
    const button = page.getByRole('link', { name: 'Primary action' });
    expect(await css(button, 'background-color')).toBe('rgb(116, 171, 96)');
    expect((await box(button)).width).toBeLessThan(400);
  });

  test('Keep reading: 42px title, three cards in a row', async ({ page }) => {
    const section = page.getByRole('region', { name: 'Keep reading' });
    expect(await css(section.getByRole('heading'), 'font-size')).toBe('42px');
    const cards = section.getByRole('link');
    await expect(cards).toHaveCount(3);
    const tops = await Promise.all([0, 1, 2].map(async (i) => (await box(cards.nth(i))).y));
    expect(new Set(tops).size).toBe(1);
  });

  test('Ready to plan your trip: 52px title, illustration beside the text', async ({ page }) => {
    const cta = page.getByRole('region', { name: 'Ready to plan your trip?' });
    expect(await css(cta, 'background-color')).toBe('rgb(99, 172, 86)');
    expect(await css(cta.getByRole('heading'), 'font-size')).toBe('52px');
    const art = await box(cta.locator('img[src*="mascots"]'));
    const title = await box(cta.getByRole('heading'));
    expect(art.x).toBeGreaterThan(title.x + title.width);
  });

  test('screenshot', async ({ page }) => {
    await page.screenshot({ path: 'e2e/__screenshots__/blog-1440.png', fullPage: true });
  });
});

test.describe('blog template matches Figma: phone 375', () => {
  test.beforeEach(({ page }) => open(page, TEMPLATE, PHONE));

  test('hero 200px, no back link, 44px title at the 24px margin, 17px description', async ({ page }) => {
    expect((await box(page.locator('article > div').first())).height).toBe(200);
    await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeHidden();
    const h1 = page.locator('h1');
    expect(await css(h1, 'font-size')).toBe('44px');
    expect((await box(h1)).x).toBe(24);
    expect(await css(page.getByText(/one or two sentence summary/), 'font-size')).toBe('17px');
    expect(await css(page.getByText(/min read/), 'font-size')).toBe('13px');
  });

  test('facts stack; button full width; cards stack; CTA stacks', async ({ page }) => {
    const values = page.locator('dd');
    const [a, b] = [await box(values.nth(0)), await box(values.nth(1))];
    expect(b.y).toBeGreaterThan(a.y);
    expect((await box(page.getByRole('link', { name: 'Primary action' }))).width).toBe(375 - 48);
    const cards = page.getByRole('region', { name: 'Keep reading' }).getByRole('link');
    expect((await box(cards.nth(1))).y).toBeGreaterThan((await box(cards.nth(0))).y);
    const cta = page.getByRole('region', { name: 'Ready to plan your trip?' });
    expect(await css(cta.getByRole('heading'), 'font-size')).toBe('36px');
    expect((await box(cta.getByRole('link'))).width).toBe(375 - 48 - 48);
  });

  test('screenshot', async ({ page }) => {
    await page.screenshot({ path: 'e2e/__screenshots__/blog-375.png', fullPage: true });
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

test('real posts show no date', async ({ page }) => {
  for (const path of REAL) {
    await open(page, path, DESKTOP);
    await expect(page.getByText(/min read/)).not.toContainText('Updated');
  }
});

test('keyboard: every tab stop shows a focus ring', async ({ page }) => {
  await open(page, TEMPLATE, DESKTOP);
  await expectFocusRings(page, 30);
});
