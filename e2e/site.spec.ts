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

test('nav: Figma page-frame tabs (22/28px, current page sky), 76px tall, no rule', async ({ page }) => {
  await open(page, '/resources', DESKTOP);
  const nav = page.getByRole('navigation', { name: 'Main' });
  expect((await box(nav)).height).toBe(76);
  const current = nav.getByRole('link', { name: 'Resources' });
  expect(await css(current, 'font-size')).toBe('22px');
  expect(await css(current, 'background-color')).toBe('rgb(191, 227, 248)');
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

test('Figma type sizes: Home poster 128 / 45, Resources and Community titles 36 / 28', async ({ page }) => {
  await open(page, '/', DESKTOP);
  expect(await css(page.locator('h1'), 'font-size')).toBe('128px');
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
  await filters.getByRole('combobox', { name: 'Location' }).selectOption('Yellow Bike Project');
  await expect(page.getByText('Ride to the Future: Youth Bike Mechanic Program')).toBeVisible();
  await expect(page.getByText('Bicycle Repair Clinic @ Central APL')).toHaveCount(0);
});
