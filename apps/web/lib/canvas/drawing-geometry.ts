import type {
  CanvasPoint,
  DrawingPoint
} from "@/types/canvas";

export const DEFAULT_PRESSURE = 0.5;

export const MIN_PRESSURE = 0;

export const MAX_PRESSURE = 1;

export function normalizePressure(
  pressure: number,
  fallback =
    DEFAULT_PRESSURE
): number {
  if (
    !Number.isFinite(pressure)
  ) {
    return fallback;
  }

  return clamp(
    pressure,
    MIN_PRESSURE,
    MAX_PRESSURE
  );
}

export function distanceBetween(
  first: CanvasPoint,
  second: CanvasPoint
): number {
  const dx =
    second.x - first.x;

  const dy =
    second.y - first.y;

  return Math.hypot(dx, dy);
}

export function createDrawingPath(
  points: readonly DrawingPoint[]
): string {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    const point = points[0];

    if (!point) {
      return "";
    }

    return `M ${point.x} ${point.y}`;
  }

  if (points.length === 2) {
    const first = points[0];
    const second = points[1];

    if (!first || !second) {
      return "";
    }

    return [
      `M ${first.x} ${first.y}`,
      `L ${second.x} ${second.y}`
    ].join(" ");
  }

  const commands: string[] = [];

  const firstPoint = points[0];

  if (!firstPoint) {
    return "";
  }

  commands.push(
    `M ${firstPoint.x} ${firstPoint.y}`
  );

  for (
    let index = 0;
    index < points.length - 1;
    index += 1
  ) {
    const p0 =
      points[index - 1] ??
      points[index];

    const p1 =
      points[index];

    const p2 =
      points[index + 1];

    const p3 =
      points[index + 2] ??
      p2;

    if (
      !p0 ||
      !p1 ||
      !p2 ||
      !p3
    ) {
      continue;
    }

    const controlPoint1 = {
      x:
        p1.x +
        (p2.x - p0.x) /
          6,
      y:
        p1.y +
        (p2.y - p0.y) /
          6
    };

    const controlPoint2 = {
      x:
        p2.x -
        (p3.x - p1.x) /
          6,
      y:
        p2.y -
        (p3.y - p1.y) /
          6
    };

    commands.push(
      [
        "C",
        controlPoint1.x,
        controlPoint1.y,
        controlPoint2.x,
        controlPoint2.y,
        p2.x,
        p2.y
      ].join(" ")
    );
  }

  return commands.join(" ");
}

export function cloneDrawingPoints(
  points: readonly DrawingPoint[]
): readonly DrawingPoint[] {
  return points.map(
    (point) => ({
      x: point.x,
      y: point.y,
      ...(point.pressure ===
      undefined
        ? {}
        : {
            pressure:
              point.pressure
          })
    })
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}