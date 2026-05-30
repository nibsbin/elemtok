/**
 * Cryptographically secure, unbiased index sampling.
 *
 * Built entirely on `globalThis.crypto.getRandomValues` (the Web Crypto API):
 * present in browsers, Web Workers, Deno, Bun, Cloudflare Workers, and Node.js
 * >= 24 — a single isomorphic code path with no Node-only imports, so the bundle
 * stays browser-safe. (`globalThis.crypto` is a default global only since Node
 * 19; we require Node >= 24 so the entropy source is unconditionally present.)
 * `Math.random` is never used.
 */

/** Size of the sampling window: a 16-bit value drawn from two random bytes. */
const DRAW_SPACE = 1 << 16; // 65536

/**
 * Read one cryptographically secure 16-bit value in [0, 65536).
 *
 * Both bytes come from a single `getRandomValues` call, so each draw costs one
 * CSPRNG invocation regardless of the rejection-sampling retry rate (which is
 * vanishingly small at this width — see {@link randomIndexFrom}).
 *
 * Throws if no secure source is available rather than silently degrading.
 */
function secureUint16(): number {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    throw new Error(
      "elemental-tokens: no secure random source available " +
        "(globalThis.crypto.getRandomValues is required).",
    );
  }
  const buffer = new Uint8Array(2);
  cryptoObj.getRandomValues(buffer);
  return (buffer[0] << 8) | buffer[1];
}

/**
 * Uniformly sample an integer in [0, n) for 1 <= n <= 65536 from an injectable
 * 16-bit source, using rejection sampling. The source is injectable so tests
 * can drive it with a deterministic stream and prove the no-bias property
 * exactly.
 *
 * Why rejection sampling: 65536 is not a multiple of most n, so a naive
 * `value % n` over-represents the low residues (modulo bias). We accept only
 * values in [0, max), where `max` is the largest multiple of n that fits the
 * 16-bit window; within that window every residue class is equally populated.
 *
 * Why a 16-bit window: the rejection zone is `65536 - max`, always < n out of
 * 65536, so the reject rate is at most ~0.4% for any n in range — and just
 * 16 / 65536 ≈ 0.024% for the 104-symbol vocabulary (max = 65520). Sampling a
 * single byte instead would reject up to ~50% (48 / 256 ≈ 18.75% at n = 104),
 * forcing far more resampling for the same result.
 */
export function randomIndexFrom(n: number, next16: () => number): number {
  if (!Number.isInteger(n) || n < 1 || n > DRAW_SPACE) {
    throw new RangeError(
      `elemental-tokens: n must be an integer in [1, ${DRAW_SPACE}], got ${n}`,
    );
  }

  const max = Math.floor(DRAW_SPACE / n) * n;
  for (;;) {
    const v = next16();
    if (v < max) return v % n;
    // otherwise reject and resample
  }
}

/**
 * Uniformly sample an integer in [0, n) from the platform CSPRNG, free of
 * modulo bias.
 */
export function randomIndex(n: number): number {
  return randomIndexFrom(n, secureUint16);
}
