"use client";

import {
  useCallback,
  useEffect,
  useRef
} from "react";

import type {
  CanvasPoint,
  CanvasPointerPosition,
  CanvasTransform
} from "@/types/canvas-pointer";

interface UseCanvasPointerOptions {
  readonly transform?: CanvasTransform;

  readonly onPointerDown?: (
    position: CanvasPointerPosition,
    event: PointerEvent
  ) => void;

  readonly onPointerMove?: (
    position: CanvasPointerPosition,
    event: PointerEvent
  ) => void;

  readonly onPointerUp?: (
    position: CanvasPointerPosition,
    event: PointerEvent
  ) => void;

  readonly onPointerCancel?: (
    position: CanvasPointerPosition,
    event: PointerEvent
  ) => void;
}

interface UseCanvasPointerResult {
  readonly elementRef: (
    element: HTMLElement | null
  ) => void;
}

const DEFAULT_TRANSFORM: CanvasTransform = {
  x: 0,
  y: 0,
  scale: 1
};

function getLocalPoint(
  element: HTMLElement,
  event: PointerEvent
): CanvasPoint {
  const rect =
    element.getBoundingClientRect();

  return {
    x:
      event.clientX -
      rect.left,

    y:
      event.clientY -
      rect.top
  };
}

function screenToCanvas(
  point: CanvasPoint,
  transform: CanvasTransform
): CanvasPoint {
  return {
    x:
      (point.x - transform.x) /
      transform.scale,

    y:
      (point.y - transform.y) /
      transform.scale
  };
}

function createPointerPosition(
  element: HTMLElement,
  event: PointerEvent,
  transform: CanvasTransform
): CanvasPointerPosition {
  const screen =
    getLocalPoint(
      element,
      event
    );

  const canvas =
    screenToCanvas(
      screen,
      transform
    );

  return {
    screen,
    canvas
  };
}

export function useCanvasPointer(
  options: UseCanvasPointerOptions = {}
): UseCanvasPointerResult {
  const optionsRef =
    useRef(options);

  const elementRefValue =
    useRef<HTMLElement | null>(
      null
    );

  const activePointerId =
    useRef<number | null>(
      null
    );

  /*
   * Tracks active touch pointers.
   *
   * One touch:
   *   drawing is allowed.
   *
   * Two or more touches:
   *   drawing is cancelled.
   */
  const activeTouchPointers =
    useRef<Set<number>>(
      new Set()
    );

  const multiTouchActive =
    useRef(false);

  const transform =
    options.transform ??
    DEFAULT_TRANSFORM;

  const transformRef =
    useRef(transform);

  useEffect(() => {
    optionsRef.current =
      options;
  }, [options]);

  useEffect(() => {
    transformRef.current =
      transform;
  }, [transform]);

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
            "pointerdown",
            handlePointerDown
          );

          previous.removeEventListener(
            "pointermove",
            handlePointerMove
          );

          previous.removeEventListener(
            "pointerup",
            handlePointerUp
          );

          previous.removeEventListener(
            "pointercancel",
            handlePointerCancel
          );

          previous.removeEventListener(
            "lostpointercapture",
            handleLostPointerCapture
          );
        }

        elementRefValue.current =
          element;

        if (!element) {
          return;
        }

        element.addEventListener(
          "pointerdown",
          handlePointerDown
        );

        element.addEventListener(
          "pointermove",
          handlePointerMove
        );

        element.addEventListener(
          "pointerup",
          handlePointerUp
        );

        element.addEventListener(
          "pointercancel",
          handlePointerCancel
        );

        element.addEventListener(
          "lostpointercapture",
          handleLostPointerCapture
        );
      },
      []
    );

  return {
    elementRef
  };

  function handlePointerDown(
    event: PointerEvent
  ): void {
    const element =
      elementRefValue.current;

    if (!element) {
      return;
    }

    /*
     * Track touch pointers separately.
     */
    if (
      event.pointerType === "touch"
    ) {
      activeTouchPointers.current.add(
        event.pointerId
      );

      /*
       * A second finger means we are
       * entering a gesture/pan mode.
       *
       * Cancel the active drawing stroke
       * immediately.
       */
      if (
        activeTouchPointers.current.size >=
        2
      ) {
        multiTouchActive.current =
          true;

        const drawingPointerId =
          activePointerId.current;

        if (
          drawingPointerId !== null
        ) {
          const position =
            createPointerPosition(
              element,
              event,
              transformRef.current
            );

          optionsRef.current
            .onPointerCancel?.(
              position,
              event
            );

          activePointerId.current =
            null;
        }

        return;
      }

      /*
       * Once a multi-touch gesture has
       * started, don't start drawing again
       * until all fingers have left.
       */
      if (
        multiTouchActive.current
      ) {
        return;
      }
    }

    if (
      activePointerId.current !==
      null
    ) {
      return;
    }

    activePointerId.current =
      event.pointerId;

    try {
      element.setPointerCapture(
        event.pointerId
      );
    } catch {
      // Pointer capture is not available
      // in every browser environment.
    }

    const position =
      createPointerPosition(
        element,
        event,
        transformRef.current
      );

    optionsRef.current
      .onPointerDown?.(
        position,
        event
      );
  }

  function handlePointerMove(
    event: PointerEvent
  ): void {
    const element =
      elementRefValue.current;

    if (!element) {
      return;
    }

    /*
     * Never draw while multiple touch
     * pointers are active.
     */
    if (
      event.pointerType === "touch" &&
      (
        multiTouchActive.current ||
        activeTouchPointers.current.size >=
          2
      )
    ) {
      return;
    }

    if (
      activePointerId.current !==
      event.pointerId
    ) {
      return;
    }

    const events =
      event.getCoalescedEvents?.();

    const moveEvents =
      events &&
      events.length > 0
        ? events
        : [event];

    for (
      const moveEvent of moveEvents
    ) {
      const position =
        createPointerPosition(
          element,
          moveEvent,
          transformRef.current
        );

      optionsRef.current
        .onPointerMove?.(
          position,
          moveEvent
        );
    }
  }

  function handlePointerUp(
    event: PointerEvent
  ): void {
    const element =
      elementRefValue.current;

    if (!element) {
      return;
    }

    /*
     * Remove touch pointer from the
     * active-touch set first.
     */
    if (
      event.pointerType === "touch"
    ) {
      activeTouchPointers.current.delete(
        event.pointerId
      );

      /*
       * Don't create a new drawing when
       * ending a multi-touch gesture.
       */
      if (
        activeTouchPointers.current.size ===
        0
      ) {
        multiTouchActive.current =
          false;
      }
    }

    if (
      activePointerId.current !==
      event.pointerId
    ) {
      return;
    }

    const position =
      createPointerPosition(
        element,
        event,
        transformRef.current
      );

    activePointerId.current =
      null;

    try {
      element.releasePointerCapture(
        event.pointerId
      );
    } catch {
      // Pointer capture may already
      // have been released.
    }

    optionsRef.current
      .onPointerUp?.(
        position,
        event
      );
  }

  function handlePointerCancel(
    event: PointerEvent
  ): void {
    const element =
      elementRefValue.current;

    if (!element) {
      return;
    }

    if (
      event.pointerType === "touch"
    ) {
      activeTouchPointers.current.delete(
        event.pointerId
      );

      if (
        activeTouchPointers.current.size ===
        0
      ) {
        multiTouchActive.current =
          false;
      }
    }

    if (
      activePointerId.current !==
      event.pointerId
    ) {
      return;
    }

    const position =
      createPointerPosition(
        element,
        event,
        transformRef.current
      );

    activePointerId.current =
      null;

    optionsRef.current
      .onPointerCancel?.(
        position,
        event
      );
  }

  function handleLostPointerCapture(
    event: PointerEvent
  ): void {
    if (
      activePointerId.current !==
      event.pointerId
    ) {
      return;
    }

    activePointerId.current =
      null;
  }
}