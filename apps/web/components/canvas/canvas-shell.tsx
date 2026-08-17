"use client";

import { CanvasHeader } from "@/components/canvas/canvas-header";
import { CanvasHistoryControls } from "@/components/canvas/canvas-history-controls";
import { CanvasViewport } from "@/components/canvas/canvas-viewport";

import {
  useCanvasHydration,
  useCanvasState
} from "@/stores/canvas/canvas-selectors";

import {
  useCanvasRealtime
} from "@/lib/realtime/use-canvas-realtime";

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

  const {
    realtime,
    partnerPresence,
    partnerCursor
  } = useCanvasRealtime(
    roomId
  );

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
            Restoring your space...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="canvas-app">
      <CanvasHeader />

      <div
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          pointerEvents: "none"
        }}
      >
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background:
              realtime?.authenticated
                ? "#dcfce7"
                : "#fef3c7",
            color:
              realtime?.authenticated
                ? "#166534"
                : "#92400e",
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {realtime?.authenticated
            ? "? Realtime connected"
            : "? Connecting..."}
        </div>

        {partnerPresence && (
          <div
            style={{
              padding: "5px 9px",
              borderRadius: 999,
              background: "#f3f4f6",
              color: "#374151",
              fontSize: 11
            }}
          >
            Partner: {partnerPresence.status}
          </div>
        )}

        {partnerCursor && (
          <div
            style={{
              padding: "5px 9px",
              borderRadius: 999,
              background: "#f3f4f6",
              color: "#374151",
              fontSize: 11
            }}
          >
            Partner cursor:{" "}
            {Math.round(partnerCursor.x)},
            {" "}
            {Math.round(partnerCursor.y)}
          </div>
        )}
      </div>

      <CanvasViewport />

      <CanvasHistoryControls />
    </main>
  );
}
