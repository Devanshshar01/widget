import type {
  CanvasState
} from "@/types/canvas";

import {
  useCanvasHistoryStore
} from "@/stores/canvas/canvas-history-store";

export function recordCanvasHistory(
  previousState: CanvasState
): void {
  useCanvasHistoryStore
    .getState()
    .record(previousState);
}

export function undoCanvas(
  currentState: CanvasState
): CanvasState | null {
  return useCanvasHistoryStore
    .getState()
    .undo(currentState);
}

export function redoCanvas(
  currentState: CanvasState
): CanvasState | null {
  return useCanvasHistoryStore
    .getState()
    .redo(currentState);
}

export function clearCanvasHistory(): void {
  useCanvasHistoryStore
    .getState()
    .clear();
}