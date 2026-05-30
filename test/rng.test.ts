import { describe, it, expect } from "vitest";
import { randomIndex, randomIndexFrom } from "../src/rng.js";

/** Build a byte source that yields the given bytes in order, then throws. */
function bytesFrom(...values: number[]): () => number {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error("byte source exhausted");
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

  it("returns 0 for n === 1 without consuming randomness", () => {
    expect(randomIndex(1)).toBe(0);
  });

  it("rejects non-positive / non-integer n", () => {
    expect(() => randomIndex(0)).toThrow(RangeError);
    expect(() => randomIndex(-5)).toThrow(RangeError);
    expect(() => randomIndex(2.5)).toThrow(RangeError);
  });
});

describe("randomIndexFrom rejection sampling", () => {
  it("skips bytes in the reject zone and uses the next accepted byte", () => {
    // For n=104, max=208: bytes >= 208 are rejected.
    const src = bytesFrom(250, 5); // 250 rejected, 5 accepted -> 5 % 104
    expect(randomIndexFrom(104, src)).toBe(5);
  });

  it("maps an accepted byte via modulo", () => {
    // 150 < 208, so 150 % 104 = 46.
    expect(randomIndexFrom(104, bytesFrom(150))).toBe(46);
  });

  it("is provably unbiased: enumerating all 256 bytes hits each index exactly twice", () => {
    const counts = new Array(104).fill(0);
    let rejected = 0;
    for (let b = 0; b < 256; b++) {
      if (b >= 208) {
        // The reject zone: feeding only this byte must throw (exhausted source),
        // proving it is never accepted.
        expect(() => randomIndexFrom(104, bytesFrom(b))).toThrow();
        rejected++;
        continue;
      }
      counts[randomIndexFrom(104, bytesFrom(b))]++;
    }
    expect(rejected).toBe(48); // 256 - 208
    for (const c of counts) expect(c).toBe(2);
  });
});
