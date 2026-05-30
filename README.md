# elemental-tokens

**Human-transcribable, LLM-stable tokens built from chemical element symbols.**

```
FeAuRnCuXe
```

Five symbols off the periodic table. Easy to read aloud, easy to type, easy for
a language model to echo back without mangling — and backed by a cryptographically
secure RNG. Each symbol is worth a clean **6.7 bits** of entropy, so the whole
token is just `length × 6.7` bits of unpredictability with nothing to memorize.

## Why element symbols?

A good short identifier has to survive being spoken, typed, dictated to a phone,
or round-tripped through an LLM. Random base32 (`q7f2k9`) and UUIDs fail that test:
`l`/`1`/`I` and `0`/`O` collide, and a model has no prior for an arbitrary string.

Element symbols are different:

- **A closed, formally specified set.** No synonyms, no spelling variants, no
  "correct" value a model would prefer. `Rn` means `Rn`.
- **Strong LLM priors.** The periodic table is learned as a single complete
  artifact — including the superheavy elements — so models reproduce symbols
  reliably and detect typos against a known vocabulary.
- **Invalid symbols are detectable before any database lookup.** `Xx` is simply
  not an element.
- **Uniform two-character width.** Every symbol is exactly two characters, giving
  a transcriber positional anchors and removing drop/merge errors.

The vocabulary is the **104 two-letter symbols** only. All 14 single-letter
symbols (H, B, C, N, O, F, P, S, K, V, W, Y, I, U) are excluded — a lone `C`
floating next to `Fe` is exactly the kind of thing that gets dropped or merged.
104 symbols is `log2(104) ≈ 6.7` bits apiece.

## Install

```bash
npm install elemental-tokens
```

Ships ESM + CommonJS + TypeScript types. Runs on Node.js ≥ 24 and in the browser
(uses the Web Crypto API via `globalThis.crypto`). Node 24 is the floor because
`globalThis.crypto` is only a default global from Node 19 onward; requiring 24
keeps the entropy source unconditionally present with no flags or polyfills.

## Quick start

```ts
import { generate, validate } from "elemental-tokens";

const token = generate();        // "FeAuRnCuXe"
validate(token);                 // true
validate("feaurncuxe");          // false  (case-sensitive)
validate("XxAuRnCuXe");          // false  (Xx is not an element)

generate({ length: 8 });         // 8 symbols ≈ 53.6 bits
```

CommonJS:

```js
const { generate, validate } = require("elemental-tokens");
```

## API

### `generate(options?): string`

Generates a token. Each symbol is drawn uniformly from the 104-symbol
vocabulary with a CSPRNG and rejection sampling — that's the full 6.7 bits per
symbol, no modulo bias shaving anything off.

| Option   | Type     | Default | Description                          |
| -------- | -------- | ------- | ------------------------------------ |
| `length` | `number` | `5`     | Number of symbols. Integer in `[1, 65536]`. |

```ts
generate();              // "MgScPbReNd"
generate({ length: 8 }); // 8 symbols ≈ 53.6 bits
```

Throws `RangeError` if `length` is not an integer in `[1, 65536]`. The upper
bound (`MAX_LENGTH`) is a denial-of-service guard so an unbounded or
attacker-influenced length can't turn one call into an out-of-memory loop;
65536 symbols is already ~439 kbits, far past any real need. The token is a bare
concatenation of two-character symbols; if you want a hyphenated form, split it
yourself: `token.match(/../g).join("-")`.

### `validate(token): boolean`

Returns `true` only if the token is a concatenation of known symbols. Strict and
**case-sensitive** — `"FeAu"` is valid, `"feau"` is not. No trimming, no
checksum. The token is split into fixed-width 2-char chunks, so an empty token,
a token whose length is not a whole number of symbols, or any chunk that is not
an element symbol all return `false`.

`validate` is a **syntax gate, not authentication.** A `true` result means the
token is well-formed against the public vocabulary — not that it is authorized.
Verifying authorization is the caller's job: look the token up and compare the
stored secret in constant time. (Because `validate` only inspects public,
syntactic structure, its early-out leaks nothing secret.)

```ts
validate("FeAuRnCuXe"); // true
validate("feaurncuxe"); // false  (case-sensitive)
validate("XxFe");       // false  (Xx is not an element)
validate("Fe-Au");      // false  (no delimiters)
```

### Exported constants

```ts
import { ELEMENT_SYMBOLS, SYMBOL_COUNT, MAX_LENGTH } from "elemental-tokens";

SYMBOL_COUNT;          // 104
ELEMENT_SYMBOLS[0];    // "He"
MAX_LENGTH;            // 65536  (generate length cap)
```

## Entropy math

The unit of account is one symbol = `log2(104) ≈ **6.7 bits**`. A token is just a
stack of these 6.7-bit quanta, so picking a length is picking a strength:

| Length | Entropy        | Notes                                          |
| ------ | -------------- | ---------------------------------------------- |
| 4      | ≈ 26.8 bits    |                                                |
| **5**  | **≈ 33.5 bits**| default — `5 × 6.7`                             |
| 6      | ≈ 40.2 bits    |                                                |
| 8      | ≈ 53.6 bits    |                                                |
| 12     | ≈ 80.4 bits    |                                                |
| 20     | ≈ 134 bits     | ~128-bit-class secret                          |

To hit a target strength, divide by 6.7: 128 bits ÷ 6.7 ≈ 20 symbols.

## Threat model

`elemental-tokens` is designed as a **security-load-bearing identifier for
short-lived tokens under aggressive rate limiting** — think a token that's valid
for five minutes and gets at most a few dozen guesses before lockout.

- **CSPRNG only.** Randomness comes from `crypto.getRandomValues` (Web Crypto,
  present in Node ≥ 24 and browsers). `Math.random` is never used.
- **No modulo bias.** Sampling uses rejection sampling over a 16-bit window, so
  each of the 104 symbols is equally likely and the per-symbol entropy really is
  the full 6.7 bits — not "6.7 bits minus a sliver." (The 65536-value
  enumeration test proves each symbol is reachable from exactly 630 of the
  65536 values, with only 16 rejected — a ~0.024% resample rate.)
- **The whole vocabulary is public.** Observing tokens teaches an attacker
  nothing; the search space is fixed at `104^length`.
- **No checksum, by design.** Error detection is the database lookup — an unknown
  or malformed token fails immediately. If you need offline typo detection, use a
  longer token or add your own check digit.
- **Pick length for your threat model.** The default 33.5 bits is comfortable for
  rate-limited, short-lived tokens (100 guesses in 5 minutes is ~`100 / 2^33.5` ≈ 1
  in 121 million per window). It is **not** sized for offline brute force — for
  secrets that must resist that, use length ≥ 12 (≈ 80 bits) or ≥ 20 (≈ 128 bits).

## Comparison to a BIP39 wordlist

BIP39 is the closest well-known relative: a fixed vocabulary mapped to entropy.

|                          | BIP39                        | elemental-tokens                  |
| ------------------------ | ---------------------------- | --------------------------------- |
| Vocabulary size          | 2048 words                   | 104 symbols                       |
| Entropy per unit         | 11 bits/word                 | **6.7 bits/symbol**               |
| Unit length              | 3–8 letters                  | exactly 2 characters              |
| Checksum                 | yes (built into seed phrase) | no (lookup is the check)          |
| Designed for             | 128–256-bit seed phrases     | short, dictation-friendly tokens  |
| Units to reach ~128 bits | ~12 words                    | ~20 symbols                       |
| Autocorrect risk         | high (real English words)    | low (not dictionary words)        |

BIP39 trades shorter sequences for a much larger, English-word vocabulary and a
checksum. `elemental-tokens` trades that for shorter, two-character atoms that are
faster to read aloud, internationally recognizable, and stable through an LLM —
at a tidy 6.7 bits each.

## TypeScript

Types ship with the package:

```ts
import { generate, type GenerateOptions } from "elemental-tokens";

const opts: GenerateOptions = { length: 8 };
const token = generate(opts);
```

## License

MIT © Nibs
