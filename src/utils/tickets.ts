const TICKET_PATTERN = /\b([A-Z]{2,}-\d+)\b/g;

/**
 * Detect ticket-style patterns (e.g., PROJ-1234, BUG-42) in text.
 * Returns deduplicated array of ticket numbers found.
 */
export function detectTicketPatterns(text: string): string[] {
  const matches = text.match(TICKET_PATTERN);
  if (!matches) return [];
  return [...new Set(matches)];
}

/**
 * Returns true if a string looks like a ticket number.
 */
export function isTicketTag(tag: string): boolean {
  return /^[A-Z]{2,}-\d+$/.test(tag.toUpperCase());
}

/**
 * Format tags array with ticket-pattern tags highlighted in brackets.
 * Example: ["arch", "PROJ-1234"] → "arch, [PROJ-1234]"
 */
export function formatTagsWithTickets(tags: string[]): string {
  if (tags.length === 0) return "(none)";
  return tags
    .map((t) => (isTicketTag(t) ? `[${t}]` : t))
    .join(", ");
}
