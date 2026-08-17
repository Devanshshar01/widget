"use client";

import {
  useCallback
} from "react";

import {
  useCanvasCamera
} from "@/stores/canvas/canvas-selectors";

import {
  useCanvasCameraStore
} from "@/stores/canvas/canvas-camera-store";

import {
  MAX_CANVAS_ZOOM,
  MIN_CANVAS_ZOOM
} from "@/types/canvas-camera";

const ZOOM_STEP = 1.2;

export function CanvasCameraControls() {
  const camera =
    useCanvasCamera();

  const zoom =
    useCanvasCameraStore(
      (store) =>
        store.zoom
    );

  const reset =
    useCanvasCameraStore(
      (store) =>
        store.reset
    );

  const handleZoomIn =
    useCallback(() => {
      zoom(
        Math.min(
          camera.scale *
            ZOOM_STEP,
          MAX_CANVAS_ZOOM
        ),
        0,
        0
      );
    }, [
      camera.scale,
      zoom
    ]);

  const handleZoomOut =
    useCallback(() => {
      zoom(
        Math.max(
          camera.scale /
            ZOOM_STEP,
          MIN_CANVAS_ZOOM
        ),
        0,
        0
      );
    }, [
      camera.scale,
      zoom
    ]);

  const handleReset =
    useCallback(() => {
      reset();
    }, [reset]);

  return (
    <div
      className="canvas-camera-controls"
      aria-label="Canvas camera controls"
    >
      <button
        type="button"
        className="canvas-camera-button"
        onClick={
          handleZoomIn
        }
        disabled={
          camera.scale >=
          MAX_CANVAS_ZOOM
        }
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>

      <button
        type="button"
        className="canvas-camera-button"
        onClick={
          handleZoomOut
        }
        disabled={
          camera.scale <=
          MIN_CANVAS_ZOOM
        }
        aria-label="Zoom out"
        title="Zoom out"
      >
        −
      </button>

      <button
        type="button"
        className="canvas-camera-button"
        onClick={
          handleReset
        }
        aria-label="Reset canvas view"
        title="Reset view"
      >
        ⌂
      </button>
    </div>
  );
}