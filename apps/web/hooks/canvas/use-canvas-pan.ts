"use client";

import {
  useCallback,
  useEffect,
  useRef
} from "react";

interface CanvasPanOptions {
  readonly onPan?: (
    deltaX: number,
    deltaY: number
  ) => void;
}

interface CanvasPanResult {
  readonly elementRef: (
    element: HTMLElement | null
  ) => void;
}

export function useCanvasPan(
  options: CanvasPanOptions = {}
): CanvasPanResult {
  const optionsRef =
    useRef(options);

  const elementRefValue =
    useRef<HTMLElement | null>(
      null
    );

  const isPanningRef =
    useRef(false);

  const activePointerIdRef =
    useRef<number | null>(
      null
    );

  const lastXRef =
    useRef(0);

  const lastYRef =
    useRef(0);

  const spacePressedRef =
    useRef(false);

  useEffect(() => {
    optionsRef.current =
      options;
  }, [options]);

  const handleKeyDown =
    useCallback(
      (event: KeyboardEvent) => {
        if (
          event.code ===
          "Space"
        ) {
          spacePressedRef.current =
            true;
        }
      },
      []
    );

  const handleKeyUp =
    useCallback(
      (event: KeyboardEvent) => {
        if (
          event.code ===
          "Space"
        ) {
          spacePressedRef.current =
            false;
        }
      },
      []
    );

  useEffect(() => {
    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "keyup",
      handleKeyUp
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "keyup",
        handleKeyUp
      );
    };
  }, [
    handleKeyDown,
    handleKeyUp
  ]);

  const handlePointerDown =
    useCallback(
      (event: PointerEvent) => {
        const element =
          elementRefValue.current;

        if (!element) {
          return;
        }

        const shouldPan =
          event.pointerType ===
            "mouse" &&
          (
            spacePressedRef.current ||
            event.button === 1
          );

        if (!shouldPan) {
          return;
        }

        event.preventDefault();

        isPanningRef.current =
          true;

        activePointerIdRef.current =
          event.pointerId;

        lastXRef.current =
          event.clientX;

        lastYRef.current =
          event.clientY;

        try {
          element.setPointerCapture(
            event.pointerId
          );
        } catch {
          // Pointer capture may not
          // be available.
        }
      },
      []
    );

  const handlePointerMove =
    useCallback(
      (event: PointerEvent) => {
        if (
          !isPanningRef.current
        ) {
          return;
        }

        if (
          activePointerIdRef.current !==
          event.pointerId
        ) {
          return;
        }

        const deltaX =
          event.clientX -
          lastXRef.current;

        const deltaY =
          event.clientY -
          lastYRef.current;

        lastXRef.current =
          event.clientX;

        lastYRef.current =
          event.clientY;

        if (
          deltaX === 0 &&
          deltaY === 0
        ) {
          return;
        }

        optionsRef.current
          .onPan?.(
            deltaX,
            deltaY
          );
      },
      []
    );

  const stopPanning =
    useCallback(
      (event: PointerEvent) => {
        if (
          activePointerIdRef.current !==
          event.pointerId
        ) {
          return;
        }

        const element =
          elementRefValue.current;

        isPanningRef.current =
          false;

        activePointerIdRef.current =
          null;

        if (element) {
          try {
            element.releasePointerCapture(
              event.pointerId
            );
          } catch {
            // Pointer capture may already
            // have been released.
          }
        }
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
            "pointerdown",
            handlePointerDown
          );

          previous.removeEventListener(
            "pointermove",
            handlePointerMove
          );

          previous.removeEventListener(
            "pointerup",
            stopPanning
          );

          previous.removeEventListener(
            "pointercancel",
            stopPanning
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
          stopPanning
        );

        element.addEventListener(
          "pointercancel",
          stopPanning
        );
      },
      [
        handlePointerDown,
        handlePointerMove,
        stopPanning
      ]
    );

  return {
    elementRef
  };
}