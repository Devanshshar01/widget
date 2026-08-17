"use client";

import { CanvasHeader } from "@/components/canvas/canvas-header";
import { CanvasHistoryControls } from "@/components/canvas/canvas-history-controls";
import { CanvasViewport } from "@/components/canvas/canvas-viewport";

import {
  useCanvasHydration,
  useCanvasState
} from "@/stores/canvas/canvas-selectors";

interface CanvasShellProps {
  readonly roomId: string;
}

export function CanvasShell({
  roomId
}: CanvasShellProps) {
  const isHydrated =
    useCanvasHydration();

  const canvasState =
    useCanvasState();

  void roomId;

  if (
    !isHydrated ||
    !canvasState
  ) {
    return (
      <main
        className="canvas-app"
        aria-busy="true"
      >
        <div className="canvas-loading-screen">
          <div
            className="canvas-loading-indicator"
            aria-hidden="true"
          />

          <p className="canvas-loading-text">
            Restoring your space…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="canvas-app">
      <CanvasHeader />

      <CanvasViewport />

      <CanvasHistoryControls />
    </main>
  );
}