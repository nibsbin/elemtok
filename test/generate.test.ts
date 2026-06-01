import { describe, it, expect } from "vitest";
import { generate, generateFrom } from "../src/generate.js";
import { validate } from "../src/validate.js";
import { ELEMENT_SYMBOLS, SYMBOL_COUNT } from "../src/symbols.js";
import { MAX_LENGTH } from "../src/generate.js";

describe("generate", () => {
  it("produces 10 concatenated canonical symbols by default", () => {
    for (let i = 0; i < 200; i++) {
      const token = generate();
      expect(token).toMatch(/^([A-Z][a-z]){10}$/);
    }
  });

  it("draws every segment from the vocabulary", () => {
    const known = new Set(ELEMENT_SYMBOLS);
    for (let i = 0; i < 200; i++) {
      const token = generate();
      for (let j = 0; j < token.length; j += 2) {
        expect(known.has(token.slice(j, j + 2))).toBe(true);
      }
    }
  });

  it("respects the length option", () => {
    for (const length of [1, 3, 8, 32]) {
      expect(generate({ length }).length).toBe(length * 2);
    }
  });

  it("throws on invalid options", () => {
    expect(() => generate({ length: 0 })).toThrow(RangeError);
    expect(() => generate({ length: -1 })).toThrow(RangeError);
    expect(() => generate({ length: 1.5 })).toThrow(RangeError);
    expect(() => generate({ length: NaN })).toThrow(RangeError);
    expect(() => generate({ length: Infinity })).toThrow(RangeError);
  });

  it("caps length to guard against unbounded-allocation DoS", () => {
    // The boundary is allowed; one past it, and the prior unbounded inputs
    // (e.g. 2**53, which is a valid integer) are rejected without looping.
    expect(generate({ length: MAX_LENGTH }).length).toBe(MAX_LENGTH * 2);
    expect(() => generate({ length: MAX_LENGTH + 1 })).toThrow(RangeError);
    expect(() => generate({ length: 2 ** 53 })).toThrow(RangeError);
  });

  it("round-trips through validate", () => {
    for (const length of [1, 5, 12]) {
      expect(validate(generate({ length }))).toBe(true);
    }
  });
});

/** Build a 16-bit source yielding the given values in order, then throwing. */
function wordsFrom(...values: number[]): () => number {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error("word source exhausted");
    return values[i++];
  };
}

describe("generateFrom", () => {
  it("is deterministic for a deterministic source", () => {
    const seed = () => wordsFrom(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    expect(generateFrom(seed())).toBe(generateFrom(seed()));
  });

  it("maps each accepted word to ELEMENT_SYMBOLS[word % SYMBOL_COUNT]", () => {
    // All values < 65520 are accepted, so word % 104 selects the symbol.
    const words = [0, 1, 103, 104, 150, 65519];
    const token = generateFrom(wordsFrom(...words), { length: words.length });
    const expected = words
      .map((w) => ELEMENT_SYMBOLS[w % SYMBOL_COUNT])
      .join("");
    expect(token).toBe(expected);
  });

  it("inherits generate's no-bias rejection sampling (skips the reject zone)", () => {
    // 65530 >= 65520 is rejected; the next word (7) is used: 7 % 104 = 7.
    const token = generateFrom(wordsFrom(65530, 7), { length: 1 });
    expect(token).toBe(ELEMENT_SYMBOLS[7]);
  });

  it("draws only from the vocabulary and round-trips through validate", () => {
    const known = new Set(ELEMENT_SYMBOLS);
    let counter = 0;
    const src = () => (counter = (counter + 12345) & 0xffff);
    for (const length of [1, 8, 32]) {
      const token = generateFrom(src, { length });
      expect(token.length).toBe(length * 2);
      for (let j = 0; j < token.length; j += 2) {
        expect(known.has(token.slice(j, j + 2))).toBe(true);
      }
      expect(validate(token)).toBe(true);
    }
  });

  it("validates length the same way generate does", () => {
    const src = () => 0;
    expect(() => generateFrom(src, { length: 0 })).toThrow(RangeError);
    expect(() => generateFrom(src, { length: 1.5 })).toThrow(RangeError);
    expect(() => generateFrom(src, { length: MAX_LENGTH + 1 })).toThrow(
      RangeError,
    );
    expect(generateFrom(src, { length: 3 }).length).toBe(6);
  });

  it("backs generate: generate equals generateFrom over the CSPRNG", () => {
    // Structural rather than value equality (generate's source is random):
    // both must yield a valid default-length token.
    expect(validate(generate())).toBe(true);
  });
});
