"use client";

import {
  useCallback,
  useEffect,
  useRef
} from "react";

interface TouchPoint {
  readonly x: number;
  readonly y: number;
}

interface CanvasTouchGestureOptions {
  readonly onPan?: (
    deltaX: number,
    deltaY: number
  ) => void;

  readonly onZoom?: (
    scale: number,
    anchorX: number,
    anchorY: number
  ) => void;
}

interface CanvasTouchGestureResult {
  readonly elementRef: (
    element: HTMLElement | null
  ) => void;
}

function getTouchPoint(
  touch: Touch
): TouchPoint {
  return {
    x: touch.clientX,
    y: touch.clientY
  };
}

function getDistance(
  first: TouchPoint,
  second: TouchPoint
): number {
  const dx =
    second.x - first.x;

  const dy =
    second.y - first.y;

  return Math.sqrt(
    dx * dx +
      dy * dy
  );
}

function getMidpoint(
  first: TouchPoint,
  second: TouchPoint
): TouchPoint {
  return {
    x:
      (first.x +
        second.x) /
      2,

    y:
      (first.y +
        second.y) /
      2
  };
}

export function useCanvasTouchGesture(
  options: CanvasTouchGestureOptions = {}
): CanvasTouchGestureResult {
  const optionsRef =
    useRef(options);

  const elementRefValue =
    useRef<HTMLElement | null>(
      null
    );

  const previousTouchesRef =
    useRef<
      readonly TouchPoint[]
    >([]);

  const previousDistanceRef =
    useRef<number | null>(
      null
    );

  useEffect(() => {
    optionsRef.current =
      options;
  }, [options]);

  const handleTouchStart =
    useCallback(
      (event: TouchEvent) => {
        if (
          event.touches.length !==
          2
        ) {
          return;
        }

        event.preventDefault();

        const first =
          getTouchPoint(
            event.touches[0]!
          );

        const second =
          getTouchPoint(
            event.touches[1]!
          );

        previousTouchesRef.current =
          [first, second];

        previousDistanceRef.current =
          getDistance(
            first,
            second
          );
      },
      []
    );

  const handleTouchMove =
    useCallback(
      (event: TouchEvent) => {
        if (
          event.touches.length !==
          2
        ) {
          return;
        }

        event.preventDefault();

        const first =
          getTouchPoint(
            event.touches[0]!
          );

        const second =
          getTouchPoint(
            event.touches[1]!
          );

        const previous =
          previousTouchesRef.current;

        const previousFirst =
          previous[0];

        const previousSecond =
          previous[1];

        if (
          !previousFirst ||
          !previousSecond
        ) {
          previousTouchesRef.current =
            [first, second];

          previousDistanceRef.current =
            getDistance(
              first,
              second
            );

          return;
        }

        /*
         * ----------------------------------------------------------------------
         * Two-finger pan
         * ----------------------------------------------------------------------
         */

        const currentMidpoint =
          getMidpoint(
            first,
            second
          );

        const previousMidpoint =
          getMidpoint(
            previousFirst,
            previousSecond
          );

        const deltaX =
          currentMidpoint.x -
          previousMidpoint.x;

        const deltaY =
          currentMidpoint.y -
          previousMidpoint.y;

        if (
          deltaX !== 0 ||
          deltaY !== 0
        ) {
          optionsRef.current
            .onPan?.(
              deltaX,
              deltaY
            );
        }

        /*
         * ----------------------------------------------------------------------
         * Pinch zoom
         * ----------------------------------------------------------------------
         */

        const currentDistance =
          getDistance(
            first,
            second
          );

        const previousDistance =
          previousDistanceRef.current;

        if (
          previousDistance !==
            null &&
          previousDistance > 0 &&
          currentDistance > 0
        ) {
          const scale =
            currentDistance /
            previousDistance;

          optionsRef.current
            .onZoom?.(
              scale,
              currentMidpoint.x,
              currentMidpoint.y
            );
        }

        previousTouchesRef.current =
          [first, second];

        previousDistanceRef.current =
          currentDistance;
      },
      []
    );

  const handleTouchEnd =
    useCallback(
      (event: TouchEvent) => {
        if (
          event.touches.length <
          2
        ) {
          previousTouchesRef.current =
            [];

          previousDistanceRef.current =
            null;
        }
      },
      []
    );

  const handleTouchCancel =
    useCallback(() => {
      previousTouchesRef.current =
        [];

      previousDistanceRef.current =
        null;
    }, []);

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
            "touchstart",
            handleTouchStart
          );

          previous.removeEventListener(
            "touchmove",
            handleTouchMove
          );

          previous.removeEventListener(
            "touchend",
            handleTouchEnd
          );

          previous.removeEventListener(
            "touchcancel",
            handleTouchCancel
          );
        }

        elementRefValue.current =
          element;

        if (!element) {
          return;
        }

        element.addEventListener(
          "touchstart",
          handleTouchStart,
          {
            passive: false
          }
        );

        element.addEventListener(
          "touchmove",
          handleTouchMove,
          {
            passive: false
          }
        );

        element.addEventListener(
          "touchend",
          handleTouchEnd,
          {
            passive: false
          }
        );

        element.addEventListener(
          "touchcancel",
          handleTouchCancel,
          {
            passive: false
          }
        );
      },
      [
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        handleTouchCancel
      ]
    );

  return {
    elementRef
  };
}