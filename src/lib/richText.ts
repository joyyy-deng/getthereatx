// Post text is plain words plus [label](url) links and **bold**, nothing else
// (see PostBlock in content/schema.ts).

/** Matches one [label](url) link or one **bold** run. */
export const RICH_TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;

/** The words only, for counting (read time) and for summaries. */
export function plainText(text: string): string {
  return text.replace(RICH_TOKEN, (_, label, _href, bold) => label ?? bold);
}
