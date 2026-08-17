"use client";

import {
  useMemo
} from "react";

import {
  CanvasElementRenderer
} from "@/components/canvas/canvas-element";

import type {
  CanvasElement
} from "@/types/canvas";

interface CanvasRendererProps {
  readonly elements: readonly CanvasElement[];
}

export function CanvasRenderer({
  elements
}: CanvasRendererProps) {
  const sortedElements =
    useMemo(
      () =>
        [...elements].sort(
          compareCanvasElements
        ),
      [elements]
    );

  return (
    <div
      className="canvas-renderer"
      aria-label="Canvas elements"
    >
      {sortedElements.map(
        (element) => (
          <CanvasElementRenderer
            key={element.id}
            element={element}
          />
        )
      )}
    </div>
  );
}

function compareCanvasElements(
  first: CanvasElement,
  second: CanvasElement
): number {
  if (
    first.zIndex !==
    second.zIndex
  ) {
    return (
      first.zIndex -
      second.zIndex
    );
  }

  if (
    first.createdAt !==
    second.createdAt
  ) {
    return (
      first.createdAt -
      second.createdAt
    );
  }

  return first.id.localeCompare(
    second.id
  );
}