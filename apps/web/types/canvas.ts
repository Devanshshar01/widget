/**
 * Core types representing the shared Couple Space canvas.
 *
 * The canvas is modeled as a collection of typed elements.
 * Drawing data is stored as points rather than raster pixels so
 * strokes can be persisted, synchronized, transformed, and
 * rendered independently.
 */

export type CanvasElementId = string;

export type UserId = string;

export type CanvasVersion = number;

export interface CanvasPoint {
  readonly x: number;
  readonly y: number;
}

export interface DrawingPoint extends CanvasPoint {
  /**
   * Normalized pointer pressure.
   *
   * 0 means no measurable pressure.
   * 1 means maximum pressure.
   *
   * Finger and mouse input may use a fallback value when the
   * browser does not expose meaningful pressure.
   */
  readonly pressure?: number;
}

export interface CanvasDimensions {
  readonly width: number;
  readonly height: number;
}

export interface BaseCanvasElement {
  readonly id: CanvasElementId;
  readonly type: CanvasElementType;
  readonly createdBy: UserId;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly zIndex: number;
}

export type CanvasElementType =
  | "text"
  | "drawing"
  | "sticky"
  | "image";

export interface TextElement
  extends BaseCanvasElement {
  readonly type: "text";
  readonly content: string;
  readonly position: CanvasPoint;
  readonly width: number;
  readonly rotation: number;
}

export interface DrawingElement
  extends BaseCanvasElement {
  readonly type: "drawing";
  readonly points: readonly DrawingPoint[];
  readonly strokeWidth: number;
  readonly color: string;
}

export interface StickyElement
  extends BaseCanvasElement {
  readonly type: "sticky";
  readonly content: string;
  readonly position: CanvasPoint;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
}

export interface ImageElement
  extends BaseCanvasElement {
  readonly type: "image";
  readonly src: string;
  readonly position: CanvasPoint;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
}

export type CanvasElement =
  | TextElement
  | DrawingElement
  | StickyElement
  | ImageElement;

export interface CanvasState {
  readonly id: string;
  readonly version: CanvasVersion;
  readonly elements: readonly CanvasElement[];
  readonly updatedAt: number;
}

export interface CanvasSnapshot {
  readonly version: CanvasVersion;
  readonly state: CanvasState;
  readonly generatedAt: number;
}