export function safeJsonParse(
  value: string
): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function safeJsonStringify(
  value: unknown
): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}