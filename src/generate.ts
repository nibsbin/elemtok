import { ELEMENT_SYMBOLS } from "./symbols.js";
import { randomIndex } from "./rng.js";
import { DEFAULT_DELIMITER, DEFAULT_LENGTH, type GenerateOptions } from "./types.js";

/**
 * Generate a token from element symbols.
 *
 * Defaults to 5 symbols concatenated with no delimiter, e.g. `"FeAuRnCuXe"`.
 * Pass `delimiter: "-"` for the hyphenated form `"Fe-Au-Rn-Cu-Xe"`. Each symbol
 * is drawn uniformly from the 104-symbol vocabulary using a CSPRNG with
 * rejection sampling, contributing ~6.7 bits of entropy.
 *
 * @throws {RangeError} if `length` is not a positive integer, or if `symbols`
 * is provided but is not a non-empty array.
 */
export function generate(options: GenerateOptions = {}): string {
  const { length = DEFAULT_LENGTH, delimiter = DEFAULT_DELIMITER, symbols = ELEMENT_SYMBOLS } =
    options;

  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError(
      `elemental-tokens: length must be a positive integer, got ${length}`,
    );
  }
  if (!Array.isArray(symbols) || symbols.length < 1) {
    throw new RangeError("elemental-tokens: symbols must be a non-empty array");
  }

  const out = new Array<string>(length);
  for (let i = 0; i < length; i++) {
    out[i] = symbols[randomIndex(symbols.length)];
  }
  return out.join(delimiter);
}
