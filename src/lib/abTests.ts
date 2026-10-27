// A/B tests for user testing (Figma page "A/B Testing"). Each version has its
// own link: /go=a, /go=b, /learn=a, /learn=b. Opening one starts that test for
// the browser tab (only one test at a time) and goes to the page being tested.
// Version "a" is the current site; any page outside a test shows version "a".

export const AB_TESTS = {
  go: {
    page: '/',
    versions: ['a', 'b'],
    label: 'Go [1] · Decrease interaction on Home',
    question:
      'Does simplifying the plan your trip section on the homepage encourage users to scroll through the rest of the site?',
    change: 'B: a shorter hero with a “Plan your trip” button instead of the From / To fields.',
  },
  learn: {
    page: '/resources',
    versions: ['a', 'b'],
    label: 'Learn [1] · Change Bus / Bike / Drive',
    question:
      'Does removing the transport and student buttons make it easier for people to understand how to navigate through resources?',
    change: 'B: no mode cards or “Which sounds most like you?” cards; the directory comes right after the title.',
  },
} as const;

export type AbTest = keyof typeof AB_TESTS;
export type AbVersion = (typeof AB_TESTS)[AbTest]['versions'][number];

const KEY = 'gtatx:ab-test';

/** Start one test in this tab, replacing any other. */
export function startAbTest(test: AbTest, version: AbVersion): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ test, version }));
  } catch {
    // Storage blocked: the page still opens, in version "a".
  }
}

/** The running test in this tab, if any. */
export function currentAbTest(): { test: AbTest; version: AbVersion } | undefined {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    return saved && saved.test in AB_TESTS ? saved : undefined;
  } catch {
    return undefined;
  }
}

/** Which version of `test` to show: the running test's version, else "a". */
export function abVersion(test: AbTest): AbVersion {
  const running = currentAbTest();
  return running?.test === test ? running.version : 'a';
}
