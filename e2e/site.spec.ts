import { expect, test } from '@playwright/test';
import { box, css, DESKTOP, expectAccessible, expectImagesNotStretched, expectNoSideScroll, open, PHONE, WIDTHS } from './helpers';

// Home, Plan Your Trip, Resources and Community after the round-4 pass:
// Figma's exact type sizes, ↗ arrows, the page-frame nav and footer, the
// phone menu, and Figma's Resources and Community filters.

const PAGES = ['/', '/plan', '/plan?from=downtown&to=ut-austin&mode=bike', '/resources', '/community'];

for (const path of PAGES) {
  test(`${path}: no sideways scroll at any width`, async ({ page }) => {
    for (const width of WIDTHS) {
      await open(page, path, { width, height: 900 });
      await expectNoSideScroll(page);
    }
  });
  for (const size of [PHONE, DESKTOP]) {
    test(`${path}: accessible, no stretched images at ${size.width}px`, async ({ page }) => {
      await open(page, path, size);
      await expectAccessible(page);
      await expectImagesNotStretched(page);
    });
  }
}

test('nav: Figma Nav component (16px Demibold tabs, current page sky), 72px tall, no rule', async ({ page }) => {
  await open(page, '/resources', DESKTOP);
  const nav = page.getByRole('navigation', { name: 'Main' });
  expect((await box(nav)).height).toBe(72);
  const current = nav.getByRole('link', { name: 'Resources' });
  expect(await css(current, 'font-size')).toBe('16px');
  expect(await css(current, 'font-weight')).toBe('600');
  expect(await css(current, 'background-color')).toBe('rgb(217, 232, 244)');
  await expect(nav.getByRole('link', { name: 'Plan your trip' })).toBeVisible();
});

test('footer: 32px invitation, 22px Demibold links; Contact and Privacy go to getthereatx.com', async ({ page }) => {
  await open(page, '/community', DESKTOP);
  const footer = page.locator('footer');
  expect(await css(footer.getByText('Keep Austin'), 'font-size')).toBe('32px');
  const plan = footer.getByRole('link', { name: 'Plan Your Trip' });
  expect(await css(plan, 'font-size')).toBe('22px');
  expect(await css(plan, 'font-weight')).toBe('600');
  await expect(footer.getByRole('link', { name: /Contact/ })).toHaveAttribute('href', 'https://www.getthereatx.com/contact/');
  await expect(footer.getByRole('link', { name: /Privacy Policy/ })).toHaveAttribute('href', 'https://www.getthereatx.com/privacy-policy/');
});

test('Figma type sizes: Home poster 96 / 45, Resources and Community titles 36 / 28', async ({ page }) => {
  await open(page, '/', DESKTOP);
  expect(await css(page.locator('h1'), 'font-size')).toBe('96px');
  expect(await page.locator('h1').textContent()).toBe('Austin, your way.');
  await open(page, '/', PHONE);
  expect(await css(page.locator('h1'), 'font-size')).toBe('45px');
  await open(page, '/resources', DESKTOP);
  expect(await css(page.getByRole('heading', { name: 'Resources', exact: true }), 'font-size')).toBe('36px');
  await open(page, '/community', PHONE);
  expect(await css(page.getByRole('heading', { name: /Trade a little/ }), 'font-size')).toBe('28px');
});

test('phone menu: opens full screen, focus on the first link, Escape closes and returns focus', async ({ page }) => {
  await open(page, '/community', PHONE);
  const button = page.getByRole('button', { name: 'Open menu' });
  await button.click();
  const menu = page.locator('#mobile-menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Plan your trip' })).toBeFocused();
  expect(await css(menu.getByRole('link', { name: 'Community' }), 'background-color')).toBe('rgb(191, 227, 248)');
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  // Following a link closes it too.
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.locator('#mobile-menu').getByRole('link', { name: 'Resources' }).click();
  await expect(page).toHaveURL(/\/resources$/);
  await expect(page.locator('#mobile-menu')).toHaveCount(0);
});

test('Resources filters: search, checkboxes across groups, all in the address', async ({ page }) => {
  await open(page, '/resources', DESKTOP);
  // "Ways of getting around" starts open on desktop.
  await page.getByRole('checkbox', { name: 'Biking' }).click();
  await expect(page).toHaveURL(/mode=Biking/);
  await expect(page.getByRole('checkbox', { name: 'Biking' })).toBeChecked();
  // A label with a comma in it works too.
  await page.getByRole('checkbox', { name: 'Carpooling, Van or Car/Rideshare' }).click();
  await expect(page.getByRole('checkbox', { name: 'Carpooling, Van or Car/Rideshare' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Biking' })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Carpooling, Van or Car/Rideshare' }).click();
  const eyebrows = await page.locator('#directory article p').filter({ hasText: /^[A-Z]/ }).allTextContents();
  expect(eyebrows.length).toBeGreaterThan(0);
  // Type of info → Guides only: a Ways-of-getting-around tick shows no guides, so clear it first.
  await page.getByRole('checkbox', { name: 'Biking' }).click();
  await expect(page.getByRole('checkbox', { name: 'Biking' })).not.toBeChecked();
  await page.getByRole('button', { name: /Type of info/ }).click();
  await page.getByRole('checkbox', { name: 'Guides' }).click();
  await expect(page).toHaveURL(/type=guides/);
  await expect(page.getByRole('link', { name: /Read the guide|Watch the video/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Visit website/ })).toHaveCount(0);
  // Search narrows further and is kept in the address.
  await page.getByRole('searchbox', { name: 'Search' }).fill('helmet');
  await expect(page).toHaveURL(/q=helmet/);
  await expect(page.getByRole('heading', { name: '5 Steps of a Helmet Fitting' })).toBeVisible();
  // A shared link opens with the same filters.
  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue('helmet');
});

test('Community filters: Event type, Date, Location', async ({ page }) => {
  await open(page, '/community', DESKTOP);
  const filters = page.getByRole('group', { name: 'Filter events' });
  await expect(filters.getByRole('combobox')).toHaveCount(3);
  // Events come and go with the calendar; the one still running is the repair clinic.
  await filters.getByRole('combobox', { name: 'Date' }).selectOption('next30');
  await expect(page.getByText('Bicycle Repair Clinic @ Central APL')).toBeVisible();
  await filters.getByRole('combobox', { name: 'Date' }).selectOption('week');
  await expect(page.getByText('Bicycle Repair Clinic @ Central APL')).toHaveCount(0);
});

test('Explore Austin opens Resources filtered to community events', async ({ page }) => {
  await open(page, '/community', DESKTOP);
  await page.getByRole('link', { name: /Explore\s*Austin/ }).click();
  await expect(page).toHaveURL(/\/resources\?type=events#directory$/);
  await page.getByRole('button', { name: /Type of info/ }).click();
  await expect(page.getByRole('checkbox', { name: 'Community events' })).toBeChecked();
  const viewEvent = page.getByRole('link', { name: /View event/ }).first();
  await expect(viewEvent).toBeVisible();
  await expect(page.getByRole('link', { name: /Visit website/ })).toHaveCount(0);
  await viewEvent.click();
  await expect(page).toHaveURL(/\/community\/events\//);
});

test('Resources: community programs (Ride with seniors, …) are a type of resource', async ({ page }) => {
  await open(page, '/resources?type=programs', DESKTOP);
  for (const t of ['Student Carpooling', 'Senior Citizens', 'Families']) await expect(page.getByRole('heading', { name: t })).toBeVisible();
});

test('Resources: external links show their own share image where the site has one', async ({ page }) => {
  await open(page, '/resources?type=websites', DESKTOP);
  await expect(page.locator('#directory img[src*="/images/resources/sites/"]').first()).toBeVisible();
});

test('Plan: Figma\'s five cards with cost pills, "Go" on desktop', async ({ page }) => {
  await open(page, '/plan?from=downtown&to=mueller&mode=bike', DESKTOP);
  const cards = page.getByRole('region', { name: /Compare ways/ }).getByRole('button');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toContainText('Walking');
  await expect(page.getByText('$1.25 fare', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go' })).toBeVisible();
});

test('guides: the live articles are copied in full', async ({ page }) => {
  await open(page, '/guides/biking-101', DESKTOP);
  await expect(page.getByRole('link', { name: /Read the full post on getthereatx.com/ })).toHaveCount(0);
  await open(page, '/guides/parent-back-to-school-transportation-guide', DESKTOP);
  await expect(page.getByRole('heading', { name: 'Carpooling' })).toBeVisible();
});
