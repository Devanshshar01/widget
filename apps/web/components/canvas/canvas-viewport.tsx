"use client";

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  CanvasCameraControls
} from "@/components/canvas/canvas-camera-controls";

import {
  CanvasSurface
} from "@/components/canvas/canvas-surface";

interface CanvasViewportProps {
  readonly className?: string;
}

interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

const DEFAULT_SIZE: ViewportSize = {
  width: 0,
  height: 0
};

export function CanvasViewport({
  className
}: CanvasViewportProps) {
  const viewportRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    viewportSize,
    setViewportSize
  ] = useState(
    DEFAULT_SIZE
  );

  useEffect(() => {
    const element =
      viewportRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const rect =
        element.getBoundingClientRect();

      setViewportSize({
        width: Math.round(
          rect.width
        ),
        height: Math.round(
          rect.height
        )
      });
    };

    updateSize();

    if (
      typeof ResizeObserver !==
      "undefined"
    ) {
      const observer =
        new ResizeObserver(
          updateSize
        );

      observer.observe(
        element
      );

      return () => {
        observer.disconnect();
      };
    }

    window.addEventListener(
      "resize",
      updateSize
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateSize
      );
    };
  }, []);

  return (
    <section
      ref={viewportRef}
      className={[
        "canvas-viewport-container",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      data-viewport-width={
        viewportSize.width
      }
      data-viewport-height={
        viewportSize.height
      }
      aria-label="Canvas viewport"
    >
      <div className="canvas-viewport-stage">
        <CanvasSurface />

        <div
          className="canvas-viewport-overlay"
          aria-label="Canvas controls"
        >
          <CanvasCameraControls />
        </div>
      </div>
    </section>
  );
}