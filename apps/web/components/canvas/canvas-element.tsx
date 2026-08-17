import {
  CanvasDrawingElement
} from "@/components/canvas/elements/canvas-drawing-element";

import {
  CanvasImageElement
} from "@/components/canvas/elements/canvas-image-element";

import {
  CanvasStickyElement
} from "@/components/canvas/elements/canvas-sticky-element";

import type {
  CanvasElement
} from "@/types/canvas";

interface CanvasElementProps {
  readonly element: CanvasElement;
}

export function CanvasElementRenderer({
  element
}: CanvasElementProps) {
  switch (element.type) {
    case "text":
      return null;

    case "drawing":
      return (
        <CanvasDrawingElement
          element={element}
        />
      );

    case "sticky":
      return (
        <CanvasStickyElement
          element={element}
        />
      );

    case "image":
      return (
        <CanvasImageElement
          element={element}
        />
      );

    default:
      return assertNever(element);
  }
}

function assertNever(
  value: never
): never {
  throw new Error(
    `Unsupported canvas element type: ${String(
      value
    )}`
  );
}