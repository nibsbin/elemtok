import { describe, it, expect } from "vitest";
import { generate } from "../src/generate.js";
import { validate } from "../src/validate.js";
import { ELEMENT_SYMBOLS } from "../src/symbols.js";

describe("generate", () => {
  it("produces 5 hyphen-joined canonical symbols by default", () => {
    for (let i = 0; i < 200; i++) {
      const token = generate();
      expect(token).toMatch(/^[A-Z][a-z](-[A-Z][a-z]){4}$/);
    }
  });

  it("draws every segment from the vocabulary", () => {
    const known = new Set(ELEMENT_SYMBOLS);
    for (let i = 0; i < 200; i++) {
      for (const segment of generate().split("-")) {
        expect(known.has(segment)).toBe(true);
      }
    }
  });

  it("respects the length option", () => {
    for (const length of [1, 3, 8, 32]) {
      const segments = generate({ length }).split("-");
      expect(segments.length).toBe(length);
    }
  });

  it("respects a custom delimiter", () => {
    expect(generate({ length: 3, delimiter: "." })).toMatch(/^[A-Z][a-z](\.[A-Z][a-z]){2}$/);
    expect(generate({ length: 2, delimiter: "" })).toMatch(/^[A-Z][a-z][A-Z][a-z]$/);
  });

  it("honors a custom symbol set", () => {
    const symbols = ["aa", "bb", "cc"];
    const token = generate({ length: 6, delimiter: " ", symbols });
    for (const segment of token.split(" ")) {
      expect(symbols).toContain(segment);
    }
  });

  it("throws on invalid options", () => {
    expect(() => generate({ length: 0 })).toThrow(RangeError);
    expect(() => generate({ length: -1 })).toThrow(RangeError);
    expect(() => generate({ length: 1.5 })).toThrow(RangeError);
    expect(() => generate({ symbols: [] })).toThrow(RangeError);
  });

  it("round-trips through validate for arbitrary options", () => {
    const cases = [
      {},
      { length: 1 },
      { length: 12 },
      { delimiter: "." },
      { delimiter: "_", length: 7 },
      { symbols: ["Zz", "Qq", "Xx"], length: 9 },
      { symbols: ["aa", "bb"], delimiter: "/", length: 4 },
    ];
    for (const opts of cases) {
      expect(validate(generate(opts), opts)).toBe(true);
    }
  });
});
