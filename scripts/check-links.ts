// npm run check-links
// Requests every URL in the content files and reports any that don't return a
// page. Run it the day before a client demo. Exits 1 on broken links.
//
// Some sites block scripts (403/429/503) even though the page works in a
// browser; those are listed as "check by hand" and don't fail the run.
import { load, FILES } from './content';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const BLOCKED = new Set([401, 403, 429, 503]);
const TIMEOUT_MS = 20_000;
const CONCURRENCY = 6;

/** Every http(s) string value in the content, with where it came from. */
function collect(): Map<string, string[]> {
  const urls = new Map<string, string[]>();
  const walk = (value: unknown, where: string) => {
    if (typeof value === 'string') {
      if (/^https?:\/\//.test(value) && !value.includes('{')) {
        urls.set(value, [...(urls.get(value) ?? []), where]);
      }
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${where}[${i}]`));
    } else if (value && typeof value === 'object') {
      const id = (value as { id?: string }).id;
      for (const [k, v] of Object.entries(value))
        walk(v, id ? `${where.replace(/\[\d+\]$/, '')}:${id}.${k}` : `${where}.${k}`);
    }
  };
  for (const file of FILES) walk(load(file), file);
  return urls;
}

async function check(url: string): Promise<number | string> {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      // Some servers reject HEAD; retry those with GET.
      if (method === 'HEAD' && (res.status === 405 || res.status >= 400)) continue;
      return res.status;
    } catch (err) {
      if (method === 'GET') return err instanceof Error ? err.message : String(err);
    }
  }
  return 'no response';
}

const urls = collect();
const queue = [...urls.keys()];
const broken: string[] = [];
const blocked: string[] = [];
let ok = 0;

console.log(`Checking ${queue.length} links…\n`);
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      const status = await check(url);
      const line = `  ${status}  ${url}\n        used in ${urls.get(url)!.join(', ')}`;
      if (typeof status === 'number' && status < 400) ok++;
      else if (typeof status === 'number' && BLOCKED.has(status)) blocked.push(line);
      else broken.push(line);
    }
  }),
);

console.log(`✓ ${ok} links OK`);
if (blocked.length)
  console.log(`\n? ${blocked.length} blocked scripted requests (check by hand in a browser):\n${blocked.join('\n')}`);
if (broken.length) {
  console.error(`\n✗ ${broken.length} broken:\n${broken.join('\n')}`);
  process.exit(1);
}
