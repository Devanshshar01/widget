export interface CanvasPoint {
  readonly x: number;
  readonly y: number;
}

export interface CanvasViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface CanvasPointerPosition {
  readonly screen: CanvasPoint;
  readonly canvas: CanvasPoint;
}

export interface CanvasTransform {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}