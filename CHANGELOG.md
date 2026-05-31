# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-30

First stable release, and the first published under the name **`elemtok`**. It
continues the line previously published as `elemental-tokens@0.1.0`, which is now
deprecated. The API is deliberately slimmer: the token is a fixed, bare
concatenation of element symbols, and the vocabulary is closed.

### Changed

- **Renamed the package `elemental-tokens` → `elemtok`.** Update your install and
  imports: `npm install elemtok` / `import { generate, validate } from "elemtok"`.
- **Default token format is now a bare concatenation** (`"FeAuRnCuXe"`) instead of
  a hyphen-delimited string (`"Fe-Au-Rn-Cu-Xe"`). If you want a delimited form,
  split it yourself: `token.match(/../g).join("-")`.
- **`generate({ length })` now requires an integer in `[1, 65536]`.** The upper
  bound is a denial-of-service guard so an unbounded or attacker-influenced length
  cannot turn one call into an out-of-memory loop. Previously any positive integer
  was accepted.
- **Minimum Node.js is now `>=24`** (was `>=18`), so `globalThis.crypto` is
  unconditionally a default global with no flags or polyfills.

### Removed

- **`delimiter` option** on `generate`/`validate`. Tokens are always a bare
  concatenation.
- **`symbols` option** (custom vocabulary) on `generate`/`validate`. The
  vocabulary is fixed to the 104 two-letter element symbols.
- **`ValidateOptions`** — `validate(token)` now takes a single argument.
- **Exported constants `DEFAULT_LENGTH`, `DEFAULT_DELIMITER`, and
  `BITS_PER_SYMBOL`.** `ELEMENT_SYMBOLS` and `SYMBOL_COUNT` remain exported.

### Security

- Index sampling draws from a 16-bit rejection-sampling window, cutting the
  resample rate to ~0.024% for the 104-symbol vocabulary (down from up to ~18.75%
  with a single byte) while remaining provably free of modulo bias.
- Published via npm OIDC trusted publishing with provenance attestations; CI and
  release workflows pin GitHub Action versions by commit SHA.

[1.0.0]: https://github.com/nibsbin/elemtok/releases/tag/v1.0.0
