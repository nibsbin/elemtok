/**
 * Cryptographically secure, unbiased index sampling.
 *
 * Built entirely on `globalThis.crypto.getRandomValues` (the Web Crypto API):
 * present in browsers, Web Workers, Deno, Bun, Cloudflare Workers, and Node.js
 * >= 18 — a single isomorphic code path with no Node-only imports, so the bundle
 * stays browser-safe. `Math.random` is never used.
 */

/**
 * Read one cryptographically secure random byte.
 * Throws if no secure source is available rather than silently degrading.
 */
function secureByte(): number {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    throw new Error(
      "elemental-tokens: no secure random source available " +
        "(globalThis.crypto.getRandomValues is required).",
    );
  }
  const buffer = new Uint8Array(1);
  cryptoObj.getRandomValues(buffer);
  return buffer[0];
}

/**
 * Uniformly sample an integer in [0, n) for 1 <= n <= 256 from an injectable
 * byte source, using rejection sampling. The byte source is injectable so tests
 * can drive it with a deterministic stream and prove the no-bias property
 * exactly.
 *
 * Why rejection sampling: 256 is not a multiple of most n, so a naive `byte % n`
 * over-represents the low residues (modulo bias). We accept only bytes in
 * [0, max), where `max` is the largest multiple of n that fits a byte; within
 * that window every residue class is equally populated. (For n = 104,
 * max = 208, so 48 of the 256 byte values are rejected.)
 */
export function randomIndexFrom(n: number, nextByte: () => number): number {
  if (!Number.isInteger(n) || n < 1 || n > 256) {
    throw new RangeError(
      `elemental-tokens: n must be an integer in [1, 256], got ${n}`,
    );
  }

  const max = Math.floor(256 / n) * n;
  for (;;) {
    const b = nextByte();
    if (b < max) return b % n;
    // otherwise reject and resample
  }
}

/**
 * Uniformly sample an integer in [0, n) from the platform CSPRNG, free of
 * modulo bias.
 */
export function randomIndex(n: number): number {
  return randomIndexFrom(n, secureByte);
}
