/** Escapes `%`, `_` and `\` so user input is literal inside a LIKE pattern. */
export function escapeLike(query: string): string {
  return query.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export function likePattern(query: string): string {
  return `%${escapeLike(query)}%`;
}
