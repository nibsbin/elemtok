import { describe, it, expect } from "vitest";
import { validate } from "../src/validate.js";

describe("validate", () => {
  it("accepts a canonical token", () => {
    expect(validate("FeAuRnCuXe")).toBe(true);
    expect(validate("Fe")).toBe(true);
  });

  it("rejects an empty token", () => {
    expect(validate("")).toBe(false);
  });

  it("rejects a token that is not a whole number of symbols", () => {
    expect(validate("Fea")).toBe(false);
    expect(validate("FeAuR")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(validate("feau")).toBe(false);
    expect(validate("FEAU")).toBe(false);
    expect(validate("FeAU")).toBe(false);
  });

  it("rejects well-formed but unknown symbols", () => {
    expect(validate("XxFe")).toBe(false);
  });

  it("rejects excluded single-letter symbols", () => {
    expect(validate("U")).toBe(false);
  });

  it("rejects surrounding whitespace (no implicit trim)", () => {
    expect(validate(" FeAu")).toBe(false);
    expect(validate("FeAu ")).toBe(false);
  });

  it("accepts the hyphenated form with the hyphen delimiter", () => {
    expect(validate("Fe-Au-Rn-Cu-Xe", { delimiter: "-" })).toBe(true);
    expect(validate("Fe-Au-Rn-Cu-Xe")).toBe(false); // default has no delimiter
  });

  it("rejects leading, trailing, or doubled delimiters", () => {
    expect(validate("Fe-", { delimiter: "-" })).toBe(false);
    expect(validate("-Fe", { delimiter: "-" })).toBe(false);
    expect(validate("Fe--Au", { delimiter: "-" })).toBe(false);
  });

  it("respects a custom delimiter and rejects mismatches", () => {
    expect(validate("Fe.Au", { delimiter: "." })).toBe(true);
    expect(validate("Fe.Au")).toBe(false); // default has no delimiter, "Fe.Au" is odd-width
  });

  it("respects a custom symbol set", () => {
    const symbols = ["aa", "bb", "cc"];
    expect(validate("aabbcc", { symbols })).toBe(true);
    expect(validate("aabbcc")).toBe(false);
  });

  it("requires an explicit delimiter for mixed-width vocabularies", () => {
    const symbols = ["a", "bb", "ccc"];
    expect(validate("abbccc", { symbols })).toBe(false); // ambiguous without a delimiter
    expect(validate("a.bb.ccc", { symbols, delimiter: "." })).toBe(true);
  });
});
