const PREFIX = "BN-";

export function formatOrderCode(number: number): string {
  return `${PREFIX}${number}`;
}

/** Parses `BN-1042` (case-insensitive, surrounding spaces allowed). Returns null when not a code. */
export function parseOrderCode(input: string): number | null {
  const match = /^BN-?(\d{1,9})$/i.exec(input.trim());
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}
