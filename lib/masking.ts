export function maskBankValue(value: string): string {
  const normalized = value.replace(/\s+/g, "").trim();

  if (normalized.length <= 4) {
    return normalized;
  }

  return `${"*".repeat(normalized.length - 4)}${normalized.slice(-4)}`;
}
