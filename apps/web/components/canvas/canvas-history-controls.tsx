"use client";

import {
  useCallback,
  useState
} from "react";

import {
  useCanvasCanRedo,
  useCanvasCanUndo
} from "@/stores/canvas/canvas-selectors";

import {
  useCanvasStore
} from "@/stores/canvas/canvas-store";

export function CanvasHistoryControls() {
  const canUndo =
    useCanvasCanUndo();

  const canRedo =
    useCanvasCanRedo();

  const undo =
    useCanvasStore(
      (store) => store.undo
    );

  const redo =
    useCanvasStore(
      (store) => store.redo
    );

  const clear =
    useCanvasStore(
      (store) => store.clear
    );

  const [
    isClearConfirmationOpen,
    setIsClearConfirmationOpen
  ] = useState(false);

  const [
    isClearing,
    setIsClearing
  ] = useState(false);

  const handleUndo =
    useCallback(() => {
      void undo();
    }, [undo]);

  const handleRedo =
    useCallback(() => {
      void redo();
    }, [redo]);

  const handleOpenClearConfirmation =
    useCallback(() => {
      setIsClearConfirmationOpen(true);
    }, []);

  const handleCloseClearConfirmation =
    useCallback(() => {
      if (isClearing) {
        return;
      }

      setIsClearConfirmationOpen(false);
    }, [isClearing]);

  const handleClear =
    useCallback(async () => {
      setIsClearing(true);

      try {
        await clear();

        setIsClearConfirmationOpen(
          false
        );
      } catch (error) {
        console.error(
          "Unable to clear canvas:",
          error
        );
      } finally {
        setIsClearing(false);
      }
    }, [clear]);

  return (
    <>
      <div
        className="canvas-history-controls"
        aria-label="Canvas controls"
      >
        <button
          type="button"
          className="canvas-history-button"
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label="Undo last change"
          title="Undo"
        >
          <span aria-hidden="true">
            ↶
          </span>
        </button>

        <button
          type="button"
          className="canvas-history-button"
          onClick={handleRedo}
          disabled={!canRedo}
          aria-label="Redo last change"
          title="Redo"
        >
          <span aria-hidden="true">
            ↷
          </span>
        </button>

        <span
          className="canvas-history-divider"
          aria-hidden="true"
        />

        <button
          type="button"
          className="canvas-history-button canvas-clear-button"
          onClick={
            handleOpenClearConfirmation
          }
          disabled={
            !canUndo &&
            !canRedo
          }
          aria-label="Clear canvas"
          title="Clear canvas"
        >
          <span aria-hidden="true">
            ♲
          </span>
        </button>
      </div>

      {isClearConfirmationOpen && (
        <div
          className="canvas-clear-dialog-backdrop"
          role="presentation"
          onPointerDown={
            handleCloseClearConfirmation
          }
        >
          <section
            className="canvas-clear-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="canvas-clear-title"
            aria-describedby="canvas-clear-description"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="canvas-clear-dialog-icon">
              <span aria-hidden="true">
                ♲
              </span>
            </div>

            <h2
              id="canvas-clear-title"
              className="canvas-clear-dialog-title"
            >
              Clear canvas?
            </h2>

            <p
              id="canvas-clear-description"
              className="canvas-clear-dialog-description"
            >
              This will remove all drawings
              from this canvas. This action
              can still be reversed with Undo.
            </p>

            <div className="canvas-clear-dialog-actions">
              <button
                type="button"
                className="canvas-dialog-button canvas-dialog-cancel"
                onClick={
                  handleCloseClearConfirmation
                }
                disabled={isClearing}
              >
                Cancel
              </button>

              <button
                type="button"
                className="canvas-dialog-button canvas-dialog-confirm"
                onClick={() => {
                  void handleClear();
                }}
                disabled={isClearing}
              >
                {isClearing
                  ? "Clearing…"
                  : "Clear"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}