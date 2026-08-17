export function now(): number {
  return Date.now();
}

export function isTimestampRecent(
  timestamp: number,
  maxAgeMs: number,
  currentTime = now()
): boolean {
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) {
    return false;
  }

  const age = currentTime - timestamp;

  return age >= 0 && age <= maxAgeMs;
}

export function clampTimestamp(
  timestamp: number,
  minimum: number,
  maximum: number
): number {
  if (!Number.isFinite(timestamp)) {
    return minimum;
  }

  return Math.min(
    Math.max(timestamp, minimum),
    maximum
  );
}