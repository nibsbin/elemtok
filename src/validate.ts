import { ELEMENT_SYMBOLS } from "./symbols.js";
import { DEFAULT_DELIMITER, type ValidateOptions } from "./types.js";

/**
 * Validate that every segment of a token is a known symbol.
 *
 * Validation is strict and case-sensitive: only canonical chemical casing is
 * accepted (`"Fe-Au"` is valid; `"fe-au"` and `"FE-AU"` are not). There is no
 * trimming and no checksum — an unknown segment fails before any database
 * lookup. To validate a token built with a custom delimiter or vocabulary, pass
 * the same options used to generate it.
 *
 * Returns `false` for an empty token or any empty segment (e.g. leading,
 * trailing, or doubled delimiters).
 */
export function validate(token: string, options: ValidateOptions = {}): boolean {
  const { delimiter = DEFAULT_DELIMITER, symbols = ELEMENT_SYMBOLS } = options;

  if (typeof token !== "string" || token.length === 0) return false;

  const known = new Set(symbols);
  const segments = token.split(delimiter);

  for (const segment of segments) {
    if (segment.length === 0 || !known.has(segment)) return false;
  }
  return true;
}
