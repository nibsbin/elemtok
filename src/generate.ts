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
 * @throws {RangeError} if `length` is not an integer in [1, {@link MAX_LENGTH}].
 *   The upper bound is a denial-of-service guard: a single call with an
 *   unbounded length (e.g. `2**53`) would otherwise loop and allocate without
 *   limit. 65536 symbols is already ~439 kbits of entropy — far past any real
 *   need — so the cap never constrains legitimate use.
 */
export function generate(options: GenerateOptions = {}): string {
  const { length = DEFAULT_LENGTH } = options;

  if (!Number.isInteger(length) || length < 1 || length > MAX_LENGTH) {
    throw new RangeError(
      `elemental-tokens: length must be an integer in [1, ${MAX_LENGTH}], got ${length}`,
    );
  }

  let out = "";
  for (let i = 0; i < length; i++) {
    out += ELEMENT_SYMBOLS[randomIndex(SYMBOL_COUNT)];
  }
  return out;
}
