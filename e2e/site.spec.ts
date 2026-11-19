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

test('footer: 32px invitation, 22px Demibold links; Contact goes to getthereatx.com, Privacy to the City privacy notice', async ({ page }) => {
  await open(page, '/community', DESKTOP);
  const footer = page.locator('footer');
  expect(await css(footer.getByText('Keep Austin'), 'font-size')).toBe('32px');
  const plan = footer.getByRole('link', { name: 'Plan Your Trip' });
  expect(await css(plan, 'font-size')).toBe('22px');
  expect(await css(plan, 'font-weight')).toBe('600');
  await expect(footer.getByRole('link', { name: /Contact/ })).toHaveAttribute('href', 'https://www.getthereatx.com/contact/');
  await expect(footer.getByRole('link', { name: /Privacy Policy/ })).toHaveAttribute('href', 'https://www.austintexas.gov/privacy-notice');
  await expect(footer.getByRole('link', { name: /Join our mailing list/ })).toHaveAttribute('href', /campaign-archive\.com\/home\/\?u=da7c8480d321984a479109412/);
});

test('Type sizes: Home poster 80 / 45 (shortened from Figma 96 at Joy\'s request), Resources and Community titles 36 / 28', async ({ page }) => {
  await open(page, '/', DESKTOP);
  expect(await css(page.locator('h1'), 'font-size')).toBe('80px');
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

test('Resources filters: the list\'s tag groups, parents contain their children, all in the address', async ({ page }) => {
  await open(page, '/resources', DESKTOP);
  // "Ways of getting around" starts open on desktop; children sit under their parent.
  await expect(page.getByRole('checkbox', { name: 'Rolling', exact: true })).toBeVisible();
  const countFor = async () => page.locator('#directory article').count();
  await page.getByRole('checkbox', { name: 'Biking', exact: true }).click();
  await expect(page).toHaveURL(/mode=Biking/);
  await expect(page.getByRole('checkbox', { name: 'Biking', exact: true })).toBeChecked();
  await page.getByRole('searchbox', { name: 'Search' }).fill('yellow bike');
  await expect(page.getByRole('heading', { name: 'Yellow Bike Project' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search' }).fill('');
  // The parent also finds what is tagged with its children: Rolling includes everything Biking has.
  await page.getByRole('checkbox', { name: 'Biking', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Rolling', exact: true }).click();
  await expect(page).toHaveURL(/mode=Rolling/);
  expect(await countFor()).toBeGreaterThan(0);
  // Eyebrows are the tag labels joined with a dot.
  await expect(page.locator('#directory article p').filter({ hasText: /^(Biking|Rolling|Bikeshare)/ }).first()).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search' }).fill('capmetro bikeshare');
  await expect(page.getByRole('heading', { name: 'CapMetro bikeshare' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search' }).fill('');
  // A second group narrows further.
  await page.getByRole('button', { name: /Who are you/ }).click();
  await page.getByRole('checkbox', { name: 'Seniors', exact: true }).click();
  await expect(page).toHaveURL(/who=Seniors/);
  await expect(page.getByRole('heading', { name: 'Golden Rollers' })).toBeVisible();
  // Search narrows further and is kept in the address.
  await page.getByRole('searchbox', { name: 'Search' }).fill('golden');
  await expect(page).toHaveURL(/q=golden/);
  await expect(page.getByRole('heading', { name: 'Golden Rollers' })).toBeVisible();
  // A shared link opens with the same filters.
  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue('golden');
});

test('Resources: guides carry the list\'s tags', async ({ page }) => {
  await open(page, '/resources?type=Howtos%2Fguides&q=helmet', DESKTOP);
  await expect(page.getByRole('heading', { name: '5 Steps of a Helmet Fitting' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Read the guide|Watch the video/ }).first()).toBeVisible();
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

test('Explore Austin opens Resources filtered to Happening in Austin (community events)', async ({ page }) => {
  await open(page, '/community', DESKTOP);
  await page.getByRole('link', { name: /Explore\s*Austin/ }).click();
  await expect(page).toHaveURL(/\/resources\?type=HappeninginAustin#directory$/);
  await page.getByRole('button', { name: /Type of info/ }).click();
  await expect(page.getByRole('checkbox', { name: 'Happening in Austin' })).toBeChecked();
  // Events follow the listed resources (A-Z), so search for the one still running.
  await page.getByRole('searchbox', { name: 'Search' }).fill('repair clinic');
  const viewEvent = page.getByRole('link', { name: /View event/ }).first();
  await expect(viewEvent).toBeVisible();
  await viewEvent.click();
  await expect(page).toHaveURL(/\/community\/events\//);
});

test('Resources: community programs (Ride with seniors, …) are tagged Community / getting involved', async ({ page }) => {
  await open(page, '/resources?type=Community%2Fgettinginvolved&q=Citizens', DESKTOP);
  await expect(page.getByRole('heading', { name: 'Senior Citizens' })).toBeVisible();
});

test('Resources: every card shows a picture of the site or a plain panel, never a mascot', async ({ page }) => {
  for (const [size, url] of [[DESKTOP, '/resources'], [PHONE, '/resources?page=3']] as const) {
    await open(page, url, size);
    const srcs = await page.locator('#directory article img').evaluateAll((els) => els.map((e) => (e as HTMLImageElement).getAttribute('src') ?? ''));
    for (const src of srcs) expect(src).not.toContain('/images/mascots/');
  }
  await open(page, '/resources?q=waymo', DESKTOP);
  const img = page.locator('#directory img[src*="/images/resources/sites/"]').first();
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('loading', 'lazy');
  await expect(img).toHaveAttribute('alt', '');
});

test('Plan: four cards (Bus + walk removed, Joy 2026-11-17) with cost pills, "Go" on desktop', async ({ page }) => {
  await open(page, '/plan?from=downtown&to=mueller&mode=bike', DESKTOP);
  const cards = page.getByRole('region', { name: /Compare ways/ }).getByRole('button');
  await expect(cards).toHaveCount(4);
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
