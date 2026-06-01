# elemtok

Tokens built from chemical element symbols, designed for use in LLM contexts.

```
FeAuRnCuXeNdCsPbBiTh
```

Element symbols are a closed, formally defined set that appears extensively in
LLM training data — chemistry textbooks, papers, Wikipedia, the periodic table
itself. Models learn the full inventory, which means they reproduce symbols
accurately and can identify invalid ones without a lookup. Each symbol
contributes `log2(104) ≈ 6.7 bits` of CSPRNG entropy.

## Design

**Vocabulary:** 104 two-letter IUPAC element symbols (elements 1–118, canonical
casing). The 14 single-letter symbols (H, B, C, N, O, F, P, S, K, V, W, Y, I,
U) are excluded. Mixed-width identifiers break uniform positional structure and
introduce boundary ambiguity; a lone `C` adjacent to `Fe` is where LLM
transcription errors occur.

**Entropy:** Each symbol is drawn uniformly via rejection sampling over a 16-bit
window, eliminating modulo bias across 104 choices. Per-symbol entropy is the
full `log2(104) ≈ 6.7 bits` with no skew.

**Validation:** The vocabulary is closed. Any two-character string either is or
is not an element symbol — no ambiguity, no variants. `validate` checks only
public structure; it is a format gate, not an authentication check.

## Install

```bash
npm install elemtok
```

ESM + CommonJS + TypeScript types. Requires Node.js ≥ 22 or any modern browser;
entropy is sourced from `globalThis.crypto`.

## Quick start

```ts
import { generate, validate } from "elemtok";

const token = generate();        // "FeAuRnCuXeNdCsPbBiTh"
validate(token);                 // true
validate("feaurncuxe");          // false  (case-sensitive)
validate("XxAuRnCuXe");          // false  (Xx is not an element)

generate({ length: 8 });         // 8 symbols ≈ 53.6 bits
```

CommonJS: `const { generate, validate } = require("elemtok");`

## API

### `generate(options?): string`

Draws each symbol uniformly from the 104-symbol vocabulary using a CSPRNG with
rejection sampling.

| Option   | Type     | Default | Description                                 |
| -------- | -------- | ------- | ------------------------------------------- |
| `length` | `number` | `10`    | Number of symbols. Integer in `[1, 65536]`. |

```ts
generate();              // "FeAuRnCuXeNdCsPbBiTh"
generate({ length: 8 }); // 8 symbols ≈ 53.6 bits
```

Throws `RangeError` if `length` is not an integer in `[1, 65536]`. The upper
bound prevents an attacker-controlled length from causing an unbounded allocation.
Tokens are a bare concatenation; split if needed: `token.match(/../g).join("-")`.

### `generateFrom(next16, options?): string`

The seam `generate` is built on. `generate(options)` is exactly
`generateFrom(secureUint16, options)`; this variant lets you supply the entropy
yourself, for **deterministic derivation** — a stable token from a hash digest,
a UUID, or a row id rather than fresh randomness.

`next16` is a function returning one integer in `[0, 65536)` per call (two bytes
of a 16-bit value). Each symbol is drawn with the same rejection sampling as
`generate`, so the no-modulo-bias guarantee holds for any source. elemtok has no
opinion on which hash you use or what the seed means — it only maps a uniform
16-bit stream to symbols.

```ts
import { createHash } from "node:crypto";
import { generateFrom } from "elemtok";

// Expand a seed into an inexhaustible 16-bit stream via counter-mode hashing.
function streamFrom(seed: string): () => number {
  let counter = 0;
  let buf = Buffer.alloc(0);
  let pos = 0;
  return () => {
    if (pos + 2 > buf.length) {
      const ctr = Buffer.from([counter & 0xff, (counter >> 8) & 0xff]);
      buf = createHash("sha256").update(seed).update(ctr).digest();
      counter++;
      pos = 0;
    }
    const v = (buf[pos] << 8) | buf[pos + 1];
    pos += 2;
    return v;
  };
}

const token = generateFrom(streamFrom("user:42"), { length: 10 });
// same seed -> same token, every time
```

**`next16` must not run dry.** Rejection sampling resamples on the rare reject
(~0.024% per draw for 104 symbols), so the number of calls per token is variable
and, worst case, unbounded. Drive it from an expandable stream (as above), not a
fixed slice of a single digest — a finite buffer can throw mid-token.

> **Entropy caveat.** A `generateFrom` token inherits the entropy of `next16`,
> **not** `104^length`. A low-entropy or guessable seed yields a low-entropy,
> guessable token. The `104^length` search space quoted for `generate` holds
> only because its source is a CSPRNG. If you don't need determinism, use
> `generate`.

Throws `RangeError` on the same `length` bounds as `generate`.

### `validate(token): boolean`

Returns `true` only if the input is a non-empty concatenation of known
two-letter symbols, case-sensitive, with no delimiters or trailing characters.
Any unknown two-character chunk, odd-length string, or empty input returns
`false`.

`validate` checks format only — a `true` result does not mean the token is
authorized. Authorization requires a constant-time lookup against a stored
secret; `validate` leaks nothing about secrets because it examines only the
public symbol vocabulary.

```ts
validate("FeAuRnCuXe"); // true
validate("feaurncuxe"); // false  (case-sensitive)
validate("XxFe");       // false  (Xx is not an element)
validate("Fe-Au");      // false  (no delimiters)
```

`ELEMENT_SYMBOLS` (string array) and `SYMBOL_COUNT` (104) are also exported.

## Entropy

One symbol = `log2(104) ≈ 6.7 bits`.

| Length | Entropy         |
| ------ | --------------- |
| 4      | ≈ 26.8 bits     |
| 6      | ≈ 40.2 bits     |
| 8      | ≈ 53.6 bits     |
| **10** | **≈ 67 bits** (default) |
| 12     | ≈ 80.4 bits     |
| 20     | ≈ 134 bits    |

Target entropy ÷ 6.7 = required length (e.g. 128 bits → 20 symbols).

Compared to BIP39: BIP39 yields 11 bits per word from a 2048-word vocabulary
and includes a checksum. elemtok yields 6.7 bits per two-character atom with
no checksum.

## Threat model

Rate-limited, short-lived identifiers. Not intended for offline-attack scenarios.

- Randomness from `crypto.getRandomValues`; `Math.random` is never used.
- Rejection sampling over a 16-bit window; no modulo bias; all 104 symbols
  equiprobable. Search space is `104^length`.
- No checksum. The database lookup is the validity check.
- Default (length 10, ≈ 67 bits) is sized for rate-limited tokens. For
  offline-attack resistance use length ≥ 12 (≈ 80 bits) or ≥ 20 (≈ 128 bits).

## License

MIT © Nibs
