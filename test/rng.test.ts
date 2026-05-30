import { describe, it, expect } from "vitest";
import { randomIndex, randomIndexFrom } from "../src/rng.js";

/** Build a 16-bit source that yields the given values in order, then throws. */
function wordsFrom(...values: number[]): () => number {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error("word source exhausted");
    return values[i++];
  };
}

describe("randomIndex", () => {
  it("always returns an integer within [0, n)", () => {
    for (const n of [2, 3, 16, 100, 104, 128, 200, 256]) {
      for (let i = 0; i < 2000; i++) {
        const v = randomIndex(n);
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(n);
      }
    }
  });

  it("rejects out-of-range / non-integer n", () => {
    expect(() => randomIndex(0)).toThrow(RangeError);
    expect(() => randomIndex(-5)).toThrow(RangeError);
    expect(() => randomIndex(2.5)).toThrow(RangeError);
    expect(() => randomIndex(65537)).toThrow(RangeError);
  });
});

describe("randomIndexFrom rejection sampling", () => {
  it("skips values in the reject zone and uses the next accepted value", () => {
    // For n=104, max=65520: values >= 65520 are rejected.
    const src = wordsFrom(65530, 5); // 65530 rejected, 5 accepted -> 5 % 104
    expect(randomIndexFrom(104, src)).toBe(5);
  });

  it("maps an accepted value via modulo", () => {
    // 150 < 65520, so 150 % 104 = 46.
    expect(randomIndexFrom(104, wordsFrom(150))).toBe(46);
  });

  it("is provably unbiased: enumerating all 65536 values hits each index exactly 630 times", () => {
    const counts = new Array(104).fill(0);
    let rejected = 0;
    for (let v = 0; v < 65536; v++) {
      if (v >= 65520) {
        // The reject zone: feeding only this value must throw (exhausted
        // source), proving it is never accepted.
        expect(() => randomIndexFrom(104, wordsFrom(v))).toThrow();
        rejected++;
        continue;
      }
      counts[randomIndexFrom(104, wordsFrom(v))]++;
    }
    expect(rejected).toBe(16); // 65536 - 65520
    for (const c of counts) expect(c).toBe(630); // 65520 / 104
  });
});
