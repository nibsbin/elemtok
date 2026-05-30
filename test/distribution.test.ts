import { describe, it, expect } from "vitest";
import { randomIndex } from "../src/rng.js";
import { SYMBOL_COUNT } from "../src/symbols.js";

/**
 * Integration-level no-bias check: a chi-square goodness-of-fit test on a large
 * sample of real CSPRNG draws. The exact, non-flaky proof of uniformity lives
 * in rng.test.ts (the 65536-value enumeration); this complements it end-to-end.
 *
 * df = 103. Critical value at alpha = 0.001 is ~149.4, chosen loose so a correct
 * implementation effectively never flakes while a biased one fails reliably.
 */
describe("randomIndex distribution", () => {
  it("passes a chi-square goodness-of-fit test", () => {
    const n = SYMBOL_COUNT; // 104
    const samples = n * 5000; // ~520k draws
    const counts = new Array(n).fill(0);
    for (let i = 0; i < samples; i++) counts[randomIndex(n)]++;

    const expected = samples / n;
    let chiSquare = 0;
    for (const observed of counts) {
      const diff = observed - expected;
      chiSquare += (diff * diff) / expected;
    }

    expect(chiSquare).toBeLessThan(149.4);
  });
});
