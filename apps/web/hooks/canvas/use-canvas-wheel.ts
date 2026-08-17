"use client";

import {
  useCallback,
  useEffect,
  useRef
} from "react";

interface CanvasWheelOptions {
  readonly onZoom?: (
    scale: number,
    anchorX: number,
    anchorY: number
  ) => void;

  readonly onPan?: (
    deltaX: number,
    deltaY: number
  ) => void;
}

interface CanvasWheelResult {
  readonly elementRef: (
    element: HTMLElement | null
  ) => void;
}

const ZOOM_SENSITIVITY = 0.0015;

export function useCanvasWheel(
  options: CanvasWheelOptions = {}
): CanvasWheelResult {
  const optionsRef =
    useRef(options);

  const elementRefValue =
    useRef<HTMLElement | null>(
      null
    );

  useEffect(() => {
    optionsRef.current =
      options;
  }, [options]);

  const handleWheel =
    useCallback(
      (event: WheelEvent) => {
        const element =
          elementRefValue.current;

        if (!element) {
          return;
        }

        const rect =
          element.getBoundingClientRect();

        const anchorX =
          event.clientX -
          rect.left;

        const anchorY =
          event.clientY -
          rect.top;

        /*
         * Browsers commonly expose trackpad
         * pinch gestures as wheel events with
         * ctrlKey=true.
         *
         * Ctrl + wheel therefore becomes zoom.
         */
        if (
          event.ctrlKey ||
          event.metaKey
        ) {
          event.preventDefault();

          const zoomFactor =
            Math.exp(
              -event.deltaY *
                ZOOM_SENSITIVITY
            );

          optionsRef.current
            .onZoom?.(
              zoomFactor,
              anchorX,
              anchorY
            );

          return;
        }

        /*
         * Normal two-finger trackpad scrolling
         * arrives here.
         *
         * Instead of scrolling the webpage,
         * move the canvas camera.
         */
        event.preventDefault();

        optionsRef.current
          .onPan?.(
            event.deltaX,
            event.deltaY
          );
      },
      []
    );

  const elementRef =
    useCallback(
      (
        element: HTMLElement | null
      ) => {
        const previous =
          elementRefValue.current;

        if (
          previous === element
        ) {
          return;
        }

        if (previous) {
          previous.removeEventListener(
            "wheel",
            handleWheel
          );
        }

        elementRefValue.current =
          element;

        if (!element) {
          return;
        }

        element.addEventListener(
          "wheel",
          handleWheel,
          {
            passive: false
          }
        );
      },
      [handleWheel]
    );

  return {
    elementRef
  };
}