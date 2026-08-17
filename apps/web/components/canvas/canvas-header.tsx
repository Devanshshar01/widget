"use client";

import type { ReactNode } from "react";

interface CanvasHeaderProps {
  readonly children?: ReactNode;
}

export function CanvasHeader({
  children
}: CanvasHeaderProps) {
  return (
    <header className="canvas-header">
      <div className="canvas-header-left">
        <div
          className="canvas-brand"
          aria-label="Couple Space"
        >
          <span
            className="canvas-brand-mark"
            aria-hidden="true"
          >
            ♡
          </span>

          <span className="canvas-brand-name">
            Couple Space
          </span>
        </div>
      </div>

      <div className="canvas-header-right">
        {children}
      </div>
    </header>
  );
}