export interface CanvasCamera {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export interface CanvasViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface CanvasCameraPoint {
  readonly x: number;
  readonly y: number;
}

export const DEFAULT_CANVAS_CAMERA: CanvasCamera = {
  x: 0,
  y: 0,
  scale: 1
};

export const MIN_CANVAS_ZOOM = 0.25;

export const MAX_CANVAS_ZOOM = 4;

export function clampCanvasZoom(
  scale: number
): number {
  return Math.min(
    MAX_CANVAS_ZOOM,
    Math.max(
      MIN_CANVAS_ZOOM,
      scale
    )
  );
}