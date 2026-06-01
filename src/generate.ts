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
 * Generate a token from a caller-supplied 16-bit entropy source.
 *
 * This is the seam {@link generate} is built on: `generate(options)` is exactly
 * `generateFrom(secureUint16, options)`. Each symbol is drawn from the
 * 104-symbol vocabulary via the same rejection sampling as `generate`
 * (see {@link randomIndexFrom}), so the no-modulo-bias guarantee holds for
 * whatever source you supply.
 *
 * Use it when you need a *deterministic* token derived from your own bytes — a
 * hash digest, a UUID, a row id — rather than fresh CSPRNG output. elemtok
 * stays out of the business of which hash you use or what the seed means; it
 * only maps a uniform 16-bit stream to symbols.
 *
 * Contract for `next16`: each call must return an integer in `[0, 65536)` (two
 * bytes of a 16-bit value). Because rejection sampling resamples on the rare
 * reject (~0.024% per draw for 104 symbols), the number of calls per token is
 * variable and, in the worst case, unbounded — so `next16` must be an
 * inexhaustible stream, not a finite buffer. A deterministic caller deriving a
 * token from a fixed-size digest should *expand* that digest (e.g. counter-mode
 * re-hashing) rather than hand over a slice that can run dry; see the README.
 *
 * Entropy caveat: the token inherits the entropy of `next16`, NOT `104^length`.
 * Driving this from a low-entropy or guessable seed yields a low-entropy,
 * guessable token. The `104^length` search space stated for {@link generate}
 * holds only because its source is a CSPRNG.
 *
 * @throws {RangeError} if `length` is not an integer in `[1, 65536]` (the upper
 *   bound guards against unbounded-allocation denial of service).
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
