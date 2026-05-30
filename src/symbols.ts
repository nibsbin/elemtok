/**
 * The closed vocabulary for elemental-tokens.
 *
 * These are the 104 two-letter IUPAC element symbols (elements 1–118), in
 * canonical chemical casing (uppercase-first). All 14 single-letter symbols
 * — H, B, C, N, O, F, P, S, K, V, W, Y, I, U — are deliberately excluded:
 * uniform two-character width gives a transcriber (human or LLM) a positional
 * anchor and removes the dropping/merging errors that single-character symbols
 * invite.
 *
 * The list is public and fixed. Observing tokens teaches an attacker nothing
 * about the token space — the whole space is the periodic table.
 */
export const ELEMENT_SYMBOLS: readonly string[] = Object.freeze([
  // Period 1–3
  "He", "Li", "Be", "Ne", "Na", "Mg", "Al", "Si", "Cl", "Ar",
  // Period 4
  "Ca", "Sc", "Ti", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
  "Ga", "Ge", "As", "Se", "Br", "Kr",
  // Period 5
  "Rb", "Sr", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag",
  "Cd", "In", "Sn", "Sb", "Te", "Xe",
  // Period 6
  "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd",
  "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf", "Ta", "Re",
  "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At",
  "Rn",
  // Period 7
  "Fr", "Ra", "Ac", "Th", "Pa", "Np", "Pu", "Am", "Cm", "Bk",
  "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh",
  "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts",
  "Og",
]);

/** Size of the default vocabulary. 104 — there is no thirteenth period. */
export const SYMBOL_COUNT = ELEMENT_SYMBOLS.length;

/**
 * Entropy contributed by a single symbol: log2(104) ≈ 6.7 bits.
 *
 * Six-point-seven bits is the atomic quantum of this scheme — every symbol you
 * read off a token is worth exactly that much, and a token's strength is just
 * `length × 6.7` bits.
 */
export const BITS_PER_SYMBOL = Math.log2(SYMBOL_COUNT);
