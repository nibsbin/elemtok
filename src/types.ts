/** Default number of symbols in a token: 5 symbols ≈ 33.5 bits of entropy. */
export const DEFAULT_LENGTH = 5;

/** Default delimiter between symbols. */
export const DEFAULT_DELIMITER = "-";

/** Options for {@link generate}. */
export interface GenerateOptions {
  /** Number of symbols in the token. Default 5. Must be a positive integer. */
  length?: number;
  /** String placed between symbols. Default "-". */
  delimiter?: string;
  /**
   * Override the symbol vocabulary entirely. Must be a non-empty array.
   * To round-trip with {@link validate}, pass the same array there.
   */
  symbols?: readonly string[];
}

/** Options for {@link validate}. Must mirror the options used to generate. */
export interface ValidateOptions {
  /** Delimiter the token was joined with. Default "-". */
  delimiter?: string;
  /** Vocabulary the token was drawn from. Default: the element symbols. */
  symbols?: readonly string[];
}
