import { ELEMENT_SYMBOLS, SYMBOL_COUNT } from "./symbols.js";
import { randomIndexFrom, secureUint16 } from "./rng.js";

/** Default number of symbols in a token: 10 symbols ≈ 67 bits of entropy. */
const DEFAULT_LENGTH = 10;

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
  /** Number of symbols in the token. Default 10. Must be an integer in `[1, 65536]`. */
  length?: number;
}

/**
 * The seam {@link generate} is built on, exposed for deterministic derivation:
 * supply your own 16-bit source instead of the CSPRNG to derive a stable token
 * from a seed. Same rejection sampling, so no modulo bias for any source.
 *
 * `next16` must return an integer in `[0, 65536)` and be inexhaustible — a fixed
 * digest slice can run dry mid-token, since rejection sampling resamples. The
 * token inherits the entropy of `next16`, NOT `104^length`. See the README.
 *
 * @throws {RangeError} if `length` is not an integer in `[1, 65536]`.
 */
export function generateFrom(
  next16: () => number,
  options: GenerateOptions = {},
): string {
  const { length = DEFAULT_LENGTH } = options;

  if (!Number.isInteger(length) || length < 1 || length > MAX_LENGTH) {
    throw new RangeError(
      `elemtok: length must be an integer in [1, ${MAX_LENGTH}], got ${length}`,
    );
  }

  const symbols = new Array<string>(length);
  for (let i = 0; i < length; i++) {
    symbols[i] = ELEMENT_SYMBOLS[randomIndexFrom(SYMBOL_COUNT, next16)];
  }
  return symbols.join("");
}

/**
 * Generate a token from element symbols.
 *
 * Returns `length` symbols (default 10) concatenated with no delimiter, e.g.
 * `"FeAuRnCuXe"`. Each symbol is drawn uniformly from the 104-symbol vocabulary
 * using a CSPRNG with rejection sampling, contributing ~6.7 bits of entropy.
 *
 * Convenience wrapper over {@link generateFrom} with the platform CSPRNG as the
 * source; reach for `generateFrom` only when you need deterministic derivation.
 *
 * @throws {RangeError} if `length` is not an integer in `[1, 65536]` (the upper
 *   bound guards against unbounded-allocation denial of service).
 */
export function generate(options: GenerateOptions = {}): string {
  return generateFrom(secureUint16, options);
}
