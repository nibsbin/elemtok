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

  it("rejects delimiters (the token is a bare concatenation)", () => {
    expect(validate("Fe-Au")).toBe(false);
    expect(validate("Fe.Au")).toBe(false);
  });
});
