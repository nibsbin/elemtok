import { describe, it, expect } from "vitest";
import { validate } from "../src/validate.js";

describe("validate", () => {
  it("accepts a canonical token", () => {
    expect(validate("Fe-Au-Rn-Cu-Xe")).toBe(true);
    expect(validate("Fe")).toBe(true);
  });

  it("rejects an empty token", () => {
    expect(validate("")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(validate("fe-au")).toBe(false);
    expect(validate("FE-AU")).toBe(false);
    expect(validate("Fe-AU")).toBe(false);
  });

  it("rejects well-formed but unknown symbols", () => {
    expect(validate("Xx-Fe")).toBe(false);
  });

  it("rejects excluded single-letter symbols", () => {
    expect(validate("H-Fe")).toBe(false);
    expect(validate("U")).toBe(false);
  });

  it("rejects leading, trailing, or doubled delimiters", () => {
    expect(validate("Fe-")).toBe(false);
    expect(validate("-Fe")).toBe(false);
    expect(validate("Fe--Au")).toBe(false);
  });

  it("rejects surrounding whitespace (no implicit trim)", () => {
    expect(validate(" Fe-Au")).toBe(false);
    expect(validate("Fe-Au ")).toBe(false);
  });

  it("respects a custom delimiter and rejects mismatches", () => {
    expect(validate("Fe.Au", { delimiter: "." })).toBe(true);
    expect(validate("Fe.Au")).toBe(false); // default delimiter "-" sees one bad segment
  });

  it("respects a custom symbol set", () => {
    const symbols = ["aa", "bb", "cc"];
    expect(validate("aa-bb-cc", { symbols })).toBe(true);
    expect(validate("aa-bb-cc")).toBe(false);
  });
});
