/** Turn a list of records into a lookup by id: `byId.get('google-maps')`. */
export function indexBy<T extends { id: string }>(list: T[]): Map<string, T> {
  return new Map(list.map((item) => [item.id, item]));
}
