/**
 * The closed vocabulary for elemtok.
 *
 * The 104 two-letter IUPAC element symbols (elements 1–118), canonical casing.
 *
 * Two-letter title-cased strings appear densely in chemistry training data and
 * are typically encoded as single BPE tokens by major LLM tokenizers. This
 * means an N-symbol token costs N LLM tokens and the model processes each
 * symbol as an atomic unit, reducing transcription errors.
 *
 * The 14 single-letter symbols (H, B, C, N, O, F, P, S, K, V, W, Y, I, U)
 * are excluded. Mixed-width tokens break positional uniformity and cause
 * inconsistent tokenization at symbol boundaries.
 *
 * The vocabulary is public and fixed; the search space is always 104^length.
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

/** Size of the vocabulary. 104 — there is no thirteenth period. */
export const SYMBOL_COUNT = ELEMENT_SYMBOLS.length;
