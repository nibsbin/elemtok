/**
 * Cryptographically secure, unbiased index sampling.
 *
 * Everything here is built on `globalThis.crypto.getRandomValues`, the Web
 * Crypto API. It is present in browsers, Web Workers, Deno, Bun, Cloudflare
 * Workers, and Node.js >= 18 — a single isomorphic code path with no Node-only
 * imports, so the bundle stays browser-safe. `Math.random` is never used.
 */

/** Largest number of bytes we read in one go before refilling the pool. */
const POOL_SIZE = 256;

/**
 * Fill the given buffer with cryptographically secure random bytes.
 * Throws if no secure source is available rather than silently degrading.
 */
function fillRandomBytes(buffer: Uint8Array): void {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    throw new Error(
      "elemental-tokens: no secure random source available " +
        "(globalThis.crypto.getRandomValues is required).",
    );
  }
  cryptoObj.getRandomValues(buffer);
}

/**
 * A self-refilling stream of cryptographically secure bytes. Reading one byte
 * at a time keeps the rejection-sampling loop simple while still amortizing the
 * cost of each `getRandomValues` call across a whole pool.
 */
function createByteSource(): () => number {
  const pool = new Uint8Array(POOL_SIZE);
  let offset = pool.length; // force a fill on first read
  return () => {
    if (offset >= pool.length) {
      fillRandomBytes(pool);
      offset = 0;
    }
    return pool[offset++];
  };
}

/**
 * Uniformly sample an integer in [0, n) from an injectable byte source using
 * rejection sampling. Exposed (internally) so tests can drive it with a
 * deterministic byte stream and prove the no-bias property exactly.
 *
 * Why rejection sampling: 256 is not a multiple of most n, so a naive
 * `byte % n` over-represents the low residues (modulo bias). We accept only
 * bytes in [0, max) where `max` is the largest multiple of n that fits the
 * byte range; within that window every residue class is equally populated.
 */
export function randomIndexFrom(n: number, nextByte: () => number): number {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`elemental-tokens: n must be a positive integer, got ${n}`);
  }
  if (n === 1) return 0;

  if (n <= POOL_SIZE) {
    const max = Math.floor(POOL_SIZE / n) * n; // e.g. n=104 -> 208
    for (;;) {
      const b = nextByte();
      if (b < max) return b % n;
      // otherwise reject and resample
    }
  }

  // Multi-byte path: only reachable via a custom `symbols` list larger than 256.
  const bytesNeeded = Math.ceil(Math.log2(n) / 8);
  if (bytesNeeded <= 6) {
    // Stays within Number.MAX_SAFE_INTEGER (2^48 < 2^53).
    const range = Math.pow(POOL_SIZE, bytesNeeded);
    const max = Math.floor(range / n) * n;
    for (;;) {
      let value = 0;
      for (let i = 0; i < bytesNeeded; i++) value = value * POOL_SIZE + nextByte();
      if (value < max) return value % n;
    }
  }

  // Very large custom vocabularies: use BigInt to stay exact.
  const bigN = BigInt(n);
  const bigRange = BigInt(POOL_SIZE) ** BigInt(bytesNeeded);
  const bigMax = (bigRange / bigN) * bigN;
  for (;;) {
    let value = 0n;
    for (let i = 0; i < bytesNeeded; i++) value = value * BigInt(POOL_SIZE) + BigInt(nextByte());
    if (value < bigMax) return Number(value % bigN);
  }
}

/** Process-wide CSPRNG byte stream backing the public sampler. */
const secureByteSource = createByteSource();

/**
 * Uniformly sample an integer in [0, n) from the platform CSPRNG, free of
 * modulo bias.
 */
export function randomIndex(n: number): number {
  return randomIndexFrom(n, secureByteSource);
}
