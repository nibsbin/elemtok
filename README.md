# elemtok

**LLM-transcribable tokens built from chemical element symbols.**

```
FeAuRnCuXeNdCsPbBiTh
```

Element symbols are LLM-tokenizer-native. Most BPE tokenizers (GPT, Claude,
Llama) encode each two-letter symbol as a **single token**, so a 10-symbol
elemtok costs exactly 10 LLM tokens — no fragmentation, no merging. That 1-for-1
mapping makes transcription reliable and token usage predictable, unlike random
strings where `q7f2k9` may encode as 4–7 tokens and emerge subtly mangled. Each
symbol carries a clean **6.7 bits** of entropy, drawn from a CSPRNG.

## Why element symbols?

LLMs process text by first breaking it into tokens. Random identifiers like
`q7f2k9` or UUIDs tokenize unpredictably — the same string may fragment
differently across model versions or surrounding context. Element symbols don't
have this problem:

- **1-for-1 LLM tokenization.** Short, title-cased, and saturated in chemistry
  training text, two-letter element symbols are often encoded as a single BPE
  token each. A 10-symbol elemtok is typically 10 LLM tokens — predictable
  cost, no character-level splitting that causes silent drop or duplication.
- **Strong LLM priors.** The periodic table is learned as a single complete
  artifact — superheavy elements included — so a model reproduces symbols
  reliably and flags typos against a vocabulary it already knows.
- **A closed, formally specified set.** No synonyms, no spelling variants, no
  "correct" value a model would rather emit. `Rn` means `Rn`.
- **Invalid symbols are detectable before any lookup.** `Xx` is simply not an
  element.
- **Uniform two-character width.** Every symbol is exactly two characters,
  providing positional anchors that prevent the drop/merge errors common with
  mixed-width identifiers.

The vocabulary is the **104 two-letter symbols** only. All 14 single-letter
symbols (H, B, C, N, O, F, P, S, K, V, W, Y, I, U) are excluded — a lone `C`
next to `Fe` is what gets fragmented by tokenizers and dropped or merged by
models. 104 symbols = `log2(104) ≈ 6.7` bits apiece.

## Install

```bash
npm install elemtok
```

Ships ESM + CommonJS + TypeScript types. Requires Node.js ≥ 22 or any modern
browser; entropy comes from the Web Crypto API (`globalThis.crypto`).

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

Draws each symbol uniformly from the 104-symbol vocabulary with a CSPRNG and
rejection sampling — the full 6.7 bits per symbol, no modulo bias.

| Option   | Type     | Default | Description                                  |
| -------- | -------- | ------- | -------------------------------------------- |
| `length` | `number` | `10`    | Number of symbols. Integer in `[1, 65536]`.  |

```ts
generate();              // "FeAuRnCuXeNdCsPbBiTh"
generate({ length: 8 }); // 8 symbols ≈ 53.6 bits
```

Throws `RangeError` if `length` is not an integer in `[1, 65536]`. The upper
bound guards against an attacker-influenced length turning one call into an
out-of-memory loop. Tokens are a bare concatenation of two-character symbols;
hyphenate yourself if you want: `token.match(/../g).join("-")`.

### `validate(token): boolean`

Returns `true` only if the token is a concatenation of known symbols. Strict and
**case-sensitive** — `"FeAu"` is valid, `"feau"` is not; no trimming, no
checksum. An empty token, a length that isn't a whole number of symbols, or any
unknown 2-char chunk all return `false`.

`validate` is a **syntax gate, not authentication.** A `true` result means the
token is well-formed against the public vocabulary — not that it is authorized.
Verifying authorization is the caller's job: look the token up and compare the
stored secret in constant time. (Because `validate` inspects only public
structure, its early-out leaks nothing secret.)

```ts
validate("FeAuRnCuXe"); // true
validate("feaurncuxe"); // false  (case-sensitive)
validate("XxFe");       // false  (Xx is not an element)
validate("Fe-Au");      // false  (no delimiters)
```

The vocabulary itself is exported as `ELEMENT_SYMBOLS` (and `SYMBOL_COUNT`, 104).

## Entropy math

The unit of account is one symbol = `log2(104) ≈ 6.7 bits`. Because element
symbols are often tokenized 1-for-1, LLM token cost equals symbol count —
picking a length sets both entropy and LLM overhead in one decision:

| Length | Entropy        | LLM tokens (typical) | Notes                          |
| ------ | -------------- | -------------------- | ------------------------------ |
| 4      | ≈ 26.8 bits    | 4                    |                                |
| 6      | ≈ 40.2 bits    | 6                    |                                |
| 8      | ≈ 53.6 bits    | 8                    |                                |
| **10** | **≈ 67.1 bits**| **10**               | default — `10 × 6.7`           |
| 12     | ≈ 80.4 bits    | 12                   |                                |
| 20     | ≈ 134 bits     | 20                   | ~128-bit-class secret          |

To hit a target strength, divide by 6.7: 128 bits ÷ 6.7 ≈ 20 symbols.

The closest well-known relative is a BIP39 wordlist — also a fixed vocabulary
mapped to entropy. BIP39 packs more bits per unit (2048 words, 11 bits each) and
adds a checksum; elemtok trades that for two-character atoms that are often a
single LLM token each, making them stable and cheap to round-trip through a
model.

## Threat model

`elemtok` is built for **security-load-bearing identifiers under aggressive rate
limiting** — a token valid for five minutes that gets at most a few dozen
guesses before lockout.

- **CSPRNG only.** Randomness is `crypto.getRandomValues`; `Math.random` is never
  used.
- **No modulo bias.** Rejection sampling over a 16-bit window keeps all 104
  symbols equally likely, so per-symbol entropy is the full 6.7 bits.
- **The whole vocabulary is public.** Observing tokens teaches an attacker
  nothing; the search space is fixed at `104^length`.
- **No checksum, by design.** The database lookup is the error check — unknown or
  malformed tokens fail immediately. Need offline typo detection? Use a longer
  token or add your own check digit.
- **Pick length for your threat model.** The default 67.1 bits is comfortable for
  rate-limited, short-lived tokens. It is **not** sized for offline brute force —
  for that use length ≥ 12 (≈ 80 bits) or ≥ 20 (≈ 128 bits).

## License

MIT © Nibs
