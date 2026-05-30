import { describe, it, expect } from "vitest";
import { generate } from "../src/generate.js";
import { validate } from "../src/validate.js";
import { ELEMENT_SYMBOLS } from "../src/symbols.js";

describe("generate", () => {
  it("produces 5 concatenated canonical symbols by default", () => {
    for (let i = 0; i < 200; i++) {
      const token = generate();
      expect(token).toMatch(/^([A-Z][a-z]){5}$/);
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
  });

  it("round-trips through validate", () => {
    for (const length of [1, 5, 12]) {
      expect(validate(generate({ length }))).toBe(true);
    }
  });
});
