import { describe, it, expect } from "vitest";
import { ELEMENT_SYMBOLS, SYMBOL_COUNT } from "../src/symbols.js";

const EXCLUDED_SINGLE_LETTERS = ["H", "B", "C", "N", "O", "F", "P", "S", "K", "V", "W", "Y", "I", "U"];

describe("ELEMENT_SYMBOLS", () => {
  it("contains exactly 104 symbols", () => {
    expect(ELEMENT_SYMBOLS.length).toBe(104);
    expect(SYMBOL_COUNT).toBe(104);
  });

  it("has no duplicates", () => {
    expect(new Set(ELEMENT_SYMBOLS).size).toBe(ELEMENT_SYMBOLS.length);
  });

  it("is entirely canonical two-letter casing", () => {
    for (const symbol of ELEMENT_SYMBOLS) {
      expect(symbol).toMatch(/^[A-Z][a-z]$/);
    }
  });

  it("excludes every single-letter element symbol", () => {
    for (const single of EXCLUDED_SINGLE_LETTERS) {
      expect(ELEMENT_SYMBOLS).not.toContain(single);
    }
  });

  it("is frozen against mutation", () => {
    expect(Object.isFrozen(ELEMENT_SYMBOLS)).toBe(true);
  });
});
