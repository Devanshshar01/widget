"use client";

import { create } from "zustand";

import type {
  CanvasState
} from "@/types/canvas";

const MAX_HISTORY_SIZE = 100;

interface CanvasHistoryStore {
  past: readonly CanvasState[];

  future: readonly CanvasState[];

  canUndo: boolean;

  canRedo: boolean;

  record: (
    previousState: CanvasState
  ) => void;

  undo: (
    currentState: CanvasState
  ) => CanvasState | null;

  redo: (
    currentState: CanvasState
  ) => CanvasState | null;

  clear: () => void;
}

function trimHistory(
  states: readonly CanvasState[]
): readonly CanvasState[] {
  if (
    states.length <=
    MAX_HISTORY_SIZE
  ) {
    return states;
  }

  return states.slice(
    states.length -
      MAX_HISTORY_SIZE
  );
}

export const useCanvasHistoryStore =
  create<CanvasHistoryStore>(
    (set, get) => ({
      past: [],

      future: [],

      canUndo: false,

      canRedo: false,

      record: (
        previousState
      ) => {
        set(
          (current) => {
            const past =
              trimHistory([
                ...current.past,
                previousState
              ]);

            return {
              past,

              future: [],

              canUndo:
                past.length > 0,

              canRedo: false
            };
          }
        );
      },

      undo: (
        currentState
      ) => {
        const {
          past,
          future
        } = get();

        const previousState =
          past[
            past.length - 1
          ];

        if (
          !previousState
        ) {
          return null;
        }

        const nextPast =
          past.slice(
            0,
            -1
          );

        const nextFuture = [
          currentState,
          ...future
        ];

        set({
          past: nextPast,

          future:
            nextFuture,

          canUndo:
            nextPast.length > 0,

          canRedo: true
        });

        return previousState;
      },

      redo: (
        currentState
      ) => {
        const {
          past,
          future
        } = get();

        const nextState =
          future[0];

        if (!nextState) {
          return null;
        }

        const nextFuture =
          future.slice(1);

        const nextPast =
          trimHistory([
            ...past,
            currentState
          ]);

        set({
          past: nextPast,

          future:
            nextFuture,

          canUndo: true,

          canRedo:
            nextFuture.length >
            0
        });

        return nextState;
      },

      clear: () => {
        set({
          past: [],

          future: [],

          canUndo: false,

          canRedo: false
        });
      }
    })
  );