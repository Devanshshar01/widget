export interface NormalizedError {
  readonly name: string;
  readonly message: string;
  readonly stack: string | null;
}

export function normalizeError(
  error: unknown
): NormalizedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return {
      name: "UnknownError",
      message: error.message,
      stack: null
    };
  }

  if (typeof error === "string") {
    return {
      name: "UnknownError",
      message: error,
      stack: null
    };
  }

  return {
    name: "UnknownError",
    message: "An unknown error occurred.",
    stack: null
  };
}