import { ELEMENT_SYMBOLS, SYMBOL_COUNT } from "./symbols.js";
import { randomIndex } from "./rng.js";

/** Default number of symbols in a token: 5 symbols ≈ 33.5 bits of entropy. */
const DEFAULT_LENGTH = 5;

/**
 * Maximum number of symbols in a token (2^16). A defensive upper bound so an
 * unbounded or attacker-influenced `length` cannot turn one call into an
 * out-of-memory / unbounded-loop denial of service. 65536 symbols is already
 * ~439 kbits of entropy, so this never constrains real use. Internal: not part
 * of the public API, exported only so the test suite can assert the boundary.
 */
export const MAX_LENGTH = 65536;

/** Options for {@link generate}. */
export interface GenerateOptions {
  /** Number of symbols in the token. Default 5. Must be an integer in `[1, 65536]`. */
  length?: number;
}

/**
 * Generate a token from element symbols.
 *
 * Returns `length` symbols (default 5) concatenated with no delimiter, e.g.
 * `"FeAuRnCuXe"`. Each symbol is drawn uniformly from the 104-symbol vocabulary
 * using a CSPRNG with rejection sampling, contributing ~6.7 bits of entropy.
 *
 * @throws {RangeError} if `length` is not an integer in `[1, 65536]` (the upper
 *   bound guards against unbounded-allocation denial of service).
 */
export function generate(options: GenerateOptions = {}): string {
  const { length = DEFAULT_LENGTH } = options;

  if (!Number.isInteger(length) || length < 1 || length > MAX_LENGTH) {
    throw new RangeError(
      `elemental-tokens: length must be an integer in [1, ${MAX_LENGTH}], got ${length}`,
    );
  }

  const symbols = new Array<string>(length);
  for (let i = 0; i < length; i++) {
    symbols[i] = ELEMENT_SYMBOLS[randomIndex(SYMBOL_COUNT)];
  }
  return symbols.join("");
}
