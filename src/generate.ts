import { ELEMENT_SYMBOLS, SYMBOL_COUNT } from "./symbols.js";
import { randomIndex } from "./rng.js";
import { DEFAULT_LENGTH, MAX_LENGTH, type GenerateOptions } from "./types.js";

/**
 * Generate a token from element symbols.
 *
 * Returns `length` symbols (default 5) concatenated with no delimiter, e.g.
 * `"FeAuRnCuXe"`. Each symbol is drawn uniformly from the 104-symbol vocabulary
 * using a CSPRNG with rejection sampling, contributing ~6.7 bits of entropy.
 *
 * @throws {RangeError} if `length` is not an integer in `[1, {@link MAX_LENGTH}]`
 *   (the upper bound is a denial-of-service guard — see {@link MAX_LENGTH}).
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
