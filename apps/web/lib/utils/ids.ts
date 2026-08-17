const UUID_LENGTH = 36;

export function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  throw new Error(
    "Secure UUID generation is not available in this environment."
  );
}

export function isValidId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === UUID_LENGTH &&
    UUID_REGEX.test(value)
  );
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;