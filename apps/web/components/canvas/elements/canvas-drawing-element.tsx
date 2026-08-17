import type {
  DrawingElement
} from "@/types/canvas";

import {
  createDrawingPath
} from "@/lib/canvas/drawing-geometry";

interface CanvasDrawingElementProps {
  readonly element: DrawingElement;
}

export function CanvasDrawingElement({
  element
}: CanvasDrawingElementProps) {
  if (
    element.points.length ===
    0
  ) {
    return null;
  }

  const firstPoint =
    element.points[0];

  if (!firstPoint) {
    return null;
  }

  const pathData =
    createDrawingPath(
      element.points
    );

  /*
   * A single-point stroke cannot be
   * represented by a visible SVG path
   * with stroke alone. Render it as a
   * small circle instead.
   */
  if (
    element.points.length === 1
  ) {
    return (
      <svg
        className="canvas-rendered-drawing"
        data-element-id={
          element.id
        }
        data-element-type={
          element.type
        }
        aria-hidden="true"
        style={{
          zIndex:
            element.zIndex
        }}
      >
        <circle
          cx={firstPoint.x}
          cy={firstPoint.y}
          r={
            element.strokeWidth /
            2
          }
          fill={
            element.color
          }
        />
      </svg>
    );
  }

  return (
    <svg
      className="canvas-rendered-drawing"
      data-element-id={
        element.id
      }
      data-element-type={
        element.type
      }
      aria-hidden="true"
      style={{
        zIndex:
          element.zIndex
      }}
    >
      <path
        d={pathData}
        fill="none"
        stroke={element.color}
        strokeWidth={
          element.strokeWidth
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}