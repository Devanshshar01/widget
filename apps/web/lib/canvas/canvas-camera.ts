import type {
  CanvasCamera,
  CanvasCameraPoint
} from "@/types/canvas-camera";

export function worldToScreen(
  point: CanvasCameraPoint,
  camera: CanvasCamera
): CanvasCameraPoint {
  return {
    x:
      (point.x - camera.x) *
      camera.scale,

    y:
      (point.y - camera.y) *
      camera.scale
  };
}

export function screenToWorld(
  point: CanvasCameraPoint,
  camera: CanvasCamera
): CanvasCameraPoint {
  return {
    x:
      point.x /
        camera.scale +
      camera.x,

    y:
      point.y /
        camera.scale +
      camera.y
  };
}

export function zoomCameraAtPoint(
  camera: CanvasCamera,
  point: CanvasCameraPoint,
  nextScale: number
): CanvasCamera {
  const clampedScale =
    Math.min(
      4,
      Math.max(
        0.25,
        nextScale
      )
    );

  const worldPoint =
    screenToWorld(
      point,
      camera
    );

  return {
    x:
      worldPoint.x -
      point.x /
        clampedScale,

    y:
      worldPoint.y -
      point.y /
        clampedScale,

    scale:
      clampedScale
  };
}