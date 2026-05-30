import { ELEMENT_SYMBOLS } from "./symbols.js";

/** Width of every element symbol, in characters. */
const SYMBOL_WIDTH = 2;

/** The accepted vocabulary, as a Set for O(1) membership checks. */
const KNOWN = new Set(ELEMENT_SYMBOLS);

/**
 * Validate that a token is a concatenation of known element symbols.
 *
 * This is a syntax gate, not authentication: it confirms the token is
 * well-formed against the public vocabulary, nothing more. A `true` result
 * does not mean the token is authorized — verifying that is the caller's job
 * (look the token up and compare the stored secret in constant time). Because
 * it only inspects public, syntactic structure, its early return leaks nothing
 * secret.
 *
 * Validation is strict and case-sensitive: only canonical chemical casing is
 * accepted (`"FeAu"` is valid; `"feau"` and `"FEAU"` are not). There is no
 * trimming and no checksum — an unknown segment fails before any database
 * lookup. Every element symbol is exactly two characters, so the token is split
 * into 2-character chunks; an empty token, a token whose length is not a whole
 * number of symbols, or any chunk that is not an element symbol all return
 * `false`.
 */
export function validate(token: string): boolean {
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length % SYMBOL_WIDTH !== 0
  ) {
    return false;
  }

  for (let i = 0; i < token.length; i += SYMBOL_WIDTH) {
    if (!KNOWN.has(token.slice(i, i + SYMBOL_WIDTH))) return false;
  }
  return true;
}
