/** Default number of symbols in a token: 5 symbols ≈ 33.5 bits of entropy. */
export const DEFAULT_LENGTH = 5;

/** Options for {@link generate}. */
export interface GenerateOptions {
  /** Number of symbols in the token. Default 5. Must be a positive integer. */
  length?: number;
}
