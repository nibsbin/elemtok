# elemtok

Tokens built from chemical element symbols, designed for use in LLM contexts.

```
FeAuRnCuXeNdCsPbBiTh
```

Two-letter element symbols are frequently encoded as single BPE tokens by major
tokenizers (GPT, Claude, Llama), because they appear densely in chemistry
training text. An N-symbol elemtok is typically N LLM tokens. The model sees
each symbol as an atomic unit rather than a character sequence, which is why
LLMs transcribe them accurately. Each symbol contributes `log2(104) ≈ 6.7 bits`
of CSPRNG entropy.

## Design

**Vocabulary:** 104 two-letter IUPAC element symbols (elements 1–118, canonical
casing). The 14 single-letter symbols (H, B, C, N, O, F, P, S, K, V, W, Y, I,
U) are excluded. Mixed-width identifiers break uniform positional structure:
a lone `C` adjacent to `Fe` tokenizes inconsistently and is where LLM
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

## Entropy and LLM token cost

One symbol = `log2(104) ≈ 6.7 bits`. When tokenization is 1-for-1, symbol
count equals LLM token count, so length controls both entropy and context cost:

| Length | Entropy     | LLM tokens (typical) |
| ------ | ----------- | -------------------- |
| 4      | ≈ 26.8 bits | 4                    |
| 6      | ≈ 40.2 bits | 6                    |
| 8      | ≈ 53.6 bits | 8                    |
| **10** | **≈ 67.1 bits** | **10** (default)  |
| 12     | ≈ 80.4 bits | 12                   |
| 20     | ≈ 134 bits  | 20                   |

Target entropy ÷ 6.7 = required length (e.g. 128 bits → 20 symbols).

Compared to BIP39: BIP39 yields 11 bits per word from a 2048-word vocabulary
and includes a checksum. elemtok yields 6.7 bits per two-character atom with
no checksum. The tradeoff is entropy density vs. the per-atom LLM tokenizer
stability that two-character symbols provide.

## Threat model

Rate-limited, short-lived identifiers. Not intended for offline-attack scenarios.

- Randomness from `crypto.getRandomValues`; `Math.random` is never used.
- Rejection sampling over a 16-bit window; no modulo bias; all 104 symbols
  equiprobable. Search space is `104^length`.
- No checksum. The database lookup is the validity check. For offline typo
  detection, increase length or add a check digit externally.
- Default (length 10, ≈ 67.1 bits) is sized for rate-limited tokens. For
  offline-attack resistance use length ≥ 12 (≈ 80 bits) or ≥ 20 (≈ 128 bits).

## License

MIT © Nibs
