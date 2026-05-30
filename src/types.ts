/** Default number of symbols in a token: 5 symbols ≈ 33.5 bits of entropy. */
export const DEFAULT_LENGTH = 5;

/**
 * Maximum number of symbols in a token (2^16). A defensive upper bound so an
 * unbounded or attacker-influenced `length` cannot turn one call into an
 * out-of-memory / unbounded-loop denial of service. 65536 symbols is already
 * ~439 kbits of entropy, so this never constrains real use.
 */
export const MAX_LENGTH = 65536;

/** Options for {@link generate}. */
export interface GenerateOptions {
  /**
   * Number of symbols in the token. Default 5. Must be an integer in
   * [1, {@link MAX_LENGTH}].
   */
  length?: number;
}
