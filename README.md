# elemtok

**Human-transcribable, LLM-stable tokens built from chemical element symbols.**

```
FeAuRnCuXe
```

Five symbols off the periodic table: easy to read aloud, type, or have a
language model echo back unmangled — and drawn from a cryptographically secure
RNG. Each symbol carries a clean **6.7 bits** of entropy, so a token is worth
`length × 6.7` bits with nothing to memorize.

## Why element symbols?

A good short identifier has to survive being spoken, typed, dictated to a phone,
or round-tripped through an LLM. Random base32 (`q7f2k9`) and UUIDs fail that
test: `l`/`1`/`I` and `0`/`O` collide, and a model has no prior for an arbitrary
string. Element symbols are different:

- **A closed, formally specified set.** No synonyms, no spelling variants, no
  "correct" value a model would rather emit. `Rn` means `Rn`.
- **Strong LLM priors.** The periodic table is learned as a single complete
  artifact — superheavy elements included — so a model reproduces symbols
  reliably and flags typos against a vocabulary it already knows.
- **Tokenizer-stable.** Short, title-cased, and frequent in training text,
  element symbols get encoded by BPE tokenizers as stable whole units rather
  than scattered byte fragments. That round-trip is lossless and consistent, so
  a model echoing a token back doesn't shed or duplicate characters the way it
  can with a random string like `q7f2k9`.
- **Invalid symbols are detectable before any lookup.** `Xx` is simply not an
  element.
- **Uniform two-character width.** Every symbol is exactly two characters,
  giving a transcriber positional anchors and removing drop/merge errors.

The vocabulary is the **104 two-letter symbols** only. All 14 single-letter
symbols (H, B, C, N, O, F, P, S, K, V, W, Y, I, U) are excluded — a lone `C`
next to `Fe` is exactly what gets dropped or merged. 104 symbols is
`log2(104) ≈ 6.7` bits apiece.

## Install

```bash
npm install elemtok
```

Ships ESM + CommonJS + TypeScript types. Requires Node.js ≥ 24 or any modern
browser; entropy comes from the Web Crypto API (`globalThis.crypto`).

## Quick start

```ts
import { generate, validate } from "elemtok";

const token = generate();        // "FeAuRnCuXe"
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
| `length` | `number` | `5`     | Number of symbols. Integer in `[1, 65536]`.  |

```ts
generate();              // "MgScPbReNd"
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

The unit of account is one symbol = `log2(104) ≈ 6.7 bits`. Picking a length is
picking a strength:

| Length | Entropy        | Notes                          |
| ------ | -------------- | ------------------------------ |
| 4      | ≈ 26.8 bits    |                                |
| **5**  | **≈ 33.5 bits**| default — `5 × 6.7`            |
| 6      | ≈ 40.2 bits    |                                |
| 8      | ≈ 53.6 bits    |                                |
| 12     | ≈ 80.4 bits    |                                |
| 20     | ≈ 134 bits     | ~128-bit-class secret          |

To hit a target strength, divide by 6.7: 128 bits ÷ 6.7 ≈ 20 symbols.

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
- **Pick length for your threat model.** The default 33.5 bits is comfortable for
  rate-limited, short-lived tokens (~100 guesses in 5 minutes is ≈ 1 in 121
  million per window). It is **not** sized for offline brute force — for that use
  length ≥ 12 (≈ 80 bits) or ≥ 20 (≈ 128 bits).

## License

MIT © Nibs
