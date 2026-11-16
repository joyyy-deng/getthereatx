import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

export const PHONE = { width: 375, height: 812 };
export const DESKTOP = { width: 1440, height: 900 };
export const WIDTHS = [320, 375, 768, 1024, 1440];

/** Open a page and wait until the content (not the loading state) is there. */
export async function open(page: Page, path: string, size = DESKTOP) {
  await page.setViewportSize(size);
  await page.goto(path);
  await expect(page.locator('h1')).toBeVisible();
  // Web fonts change text widths; wait so layout checks measure the final page.
  await page.evaluate(() => document.fonts.ready);
}

export async function css(l: Locator, prop: string): Promise<string> {
  return l.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
}

export async function box(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('element is not visible');
  return b;
}

/** No sideways scrolling: the page is never wider than the window. */
export async function expectNoSideScroll(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll, `page is ${scroll}px wide in a ${client}px window`).toBeLessThanOrEqual(client);
}

/** axe: WCAG 2.0/2.1/2.2 A and AA, no violations. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary).toEqual([]);
}

/** Tab through the page: every stop shows the focus outline. */
export async function expectFocusRings(page: Page, stops = 25) {
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  for (let i = 0; i < stops; i++) {
    await page.keyboard.press('Tab');
    const ring = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return 'none-focused';
      const s = getComputedStyle(el);
      return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 ? 'ok' : `${el.tagName} ${el.textContent?.trim().slice(0, 40)}`;
    });
    if (ring === 'none-focused') break;
    expect(ring, `focus ring on tab stop ${i + 1}`).toBe('ok');
  }
}

/**
 * Images are never stretched: an image drawn without object-fit keeps its own
 * shape (within 2%), and pictures in the post body (<figure>) are never drawn
 * bigger than the file itself.
 */
export async function expectImagesNotStretched(page: Page) {
  await page.evaluate(async () => {
    // Lazy images below the fold would never load on their own here.
    for (const img of document.images) img.loading = 'eager';
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => img.addEventListener('load', r, { once: true })))));
  });
  const problems = await page.evaluate(() =>
    [...document.images]
      .filter((img) => img.naturalWidth > 0 && img.getBoundingClientRect().width > 0)
      .flatMap((img) => {
        const r = img.getBoundingClientRect();
        const fit = getComputedStyle(img).objectFit;
        const name = img.currentSrc.split('/').pop();
        const out: string[] = [];
        if (fit === 'fill' || fit === '') {
          const drift = Math.abs(r.width / r.height - img.naturalWidth / img.naturalHeight) / (img.naturalWidth / img.naturalHeight);
          if (drift > 0.02) out.push(`${name} stretched (${Math.round(r.width)}×${Math.round(r.height)} vs ${img.naturalWidth}×${img.naturalHeight})`);
        }
        if (img.closest('figure') && r.width > img.naturalWidth + 1) out.push(`${name} enlarged past its size (${Math.round(r.width)} > ${img.naturalWidth})`);
        return out;
      }),
  );
  expect(problems).toEqual([]);
}
