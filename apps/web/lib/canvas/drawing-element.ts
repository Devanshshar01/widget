import type {
  CanvasElementId,
  DrawingElement,
  DrawingPoint
} from "@/types/canvas";

import {
  cloneDrawingPoints
} from "@/lib/canvas/drawing-geometry";

const LOCAL_USER_ID =
  "local-user";

const DEFAULT_STROKE_WIDTH = 3;

const DEFAULT_STROKE_COLOR =
  "#f4f4f5";

const DEFAULT_Z_INDEX = 1;

export interface CreateDrawingElementOptions {
  readonly points: readonly DrawingPoint[];
  readonly strokeWidth?: number;
  readonly color?: string;
  readonly zIndex?: number;
  readonly id?: CanvasElementId;
  readonly createdBy?: string;
  readonly createdAt?: number;
}

export function createDrawingElement({
  points,
  strokeWidth =
    DEFAULT_STROKE_WIDTH,
  color =
    DEFAULT_STROKE_COLOR,
  zIndex =
    DEFAULT_Z_INDEX,
  id =
    createCanvasElementId(),
  createdBy =
    LOCAL_USER_ID,
  createdAt =
    Date.now()
}: CreateDrawingElementOptions): DrawingElement {
  if (points.length === 0) {
    throw new Error(
      "Cannot create a drawing element without points."
    );
  }

  return {
    id,
    type: "drawing",
    createdBy,
    createdAt,
    updatedAt: createdAt,
    zIndex,
    points:
      cloneDrawingPoints(
        points
      ),
    strokeWidth,
    color
  };
}

export function createCanvasElementId(): CanvasElementId {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    "canvas",
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2, 10)
  ].join("-");
}