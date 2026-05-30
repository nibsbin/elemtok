import { ELEMENT_SYMBOLS } from "./symbols.js";
import { DEFAULT_DELIMITER, type ValidateOptions } from "./types.js";

/**
 * Validate that every segment of a token is a known symbol.
 *
 * Validation is strict and case-sensitive: only canonical chemical casing is
 * accepted (`"FeAu"` is valid; `"feau"` and `"FEAU"` are not). There is no
 * trimming and no checksum — an unknown segment fails before any database
 * lookup. To validate a token built with a custom delimiter or vocabulary, pass
 * the same options used to generate it.
 *
 * With the default empty delimiter the token is a bare concatenation of
 * fixed-width symbols, so it is split into chunks the width of the vocabulary's
 * symbols (2 for the element symbols). A token whose length is not a whole
 * number of symbols therefore fails. (Splitting with no delimiter requires a
 * uniform symbol width; a vocabulary of mixed-width symbols can only be
 * validated with an explicit delimiter.)
 *
 * Returns `false` for an empty token, or — when an explicit delimiter is used —
 * any empty segment (e.g. leading, trailing, or doubled delimiters).
 */
export function validate(token: string, options: ValidateOptions = {}): boolean {
  const { delimiter = DEFAULT_DELIMITER, symbols = ELEMENT_SYMBOLS } = options;

  if (typeof token !== "string" || token.length === 0) return false;

  const known = new Set(symbols);
  const segments = delimiter === "" ? splitFixedWidth(token, symbols) : token.split(delimiter);
  if (segments === null) return false;

  for (const segment of segments) {
    if (segment.length === 0 || !known.has(segment)) return false;
  }
  return true;
}

/**
 * Split a delimiter-less token into fixed-width segments matching the symbol
 * vocabulary. Returns `null` if the symbols are not all the same width, or if
 * the token length is not a whole multiple of that width.
 */
function splitFixedWidth(token: string, symbols: readonly string[]): string[] | null {
  const widths = new Set(symbols.map((s) => s.length));
  if (widths.size !== 1) return null;

  const width = widths.values().next().value as number;
  if (width === 0 || token.length % width !== 0) return null;

  const segments: string[] = [];
  for (let i = 0; i < token.length; i += width) {
    segments.push(token.slice(i, i + width));
  }
  return segments;
}
