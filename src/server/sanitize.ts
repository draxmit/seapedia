/**
 * Defense-in-depth text sanitizer for user-generated content.
 *
 * The primary XSS defense is that React escapes every string it renders and
 * we never use dangerouslySetInnerHTML — so a stored `<script>` shows up as
 * harmless literal text. This helper adds a second layer at the input
 * boundary: it strips control characters and collapses whitespace so stored
 * content stays clean and can never break layout, while still preserving the
 * literal text (including angle brackets) for the "displayed safely" case.
 */

/** True for control characters we drop (C0/C1 and DEL), keeping tab and LF. */
function isStrippableControlChar(code: number): boolean {
  const isTabOrNewline = code === 0x09 || code === 0x0a;
  if (isTabOrNewline) return false;
  const isC0 = code <= 0x1f;
  const isDelOrC1 = code >= 0x7f && code <= 0x9f;
  return isC0 || isDelOrC1;
}

export function sanitizeText(input: string): string {
  let cleaned = "";
  for (const ch of input) {
    if (!isStrippableControlChar(ch.codePointAt(0)!)) cleaned += ch;
  }
  return cleaned
    // Collapse horizontal whitespace runs into single spaces
    .replace(/[^\S\n]+/g, " ")
    // Cap consecutive blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
