/**
 * Normalize free-text bank identifiers for stable hashing and comparison.
 * Strips outer whitespace, removes common separators (spaces, dashes, dots),
 * and collapses runs of non-alphanumeric characters.
 */
export function normalizeBankDetails(value: string): string {
  const trimmed = value.trim();
  const withoutSeparators = trimmed.replace(/[\s.\-]+/g, "");
  const collapsed = withoutSeparators.replace(/[^0-9A-Za-z]+/g, "");
  return collapsed;
}
