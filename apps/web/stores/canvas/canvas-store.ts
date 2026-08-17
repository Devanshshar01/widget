"use client";

import { create } from "zustand";

import type {
  CanvasElement,
  CanvasState,
  DrawingPoint
} from "@/types/canvas";

import {
  loadCanvas,
  saveCanvas
} from "@/lib/storage/canvas-storage";

import {
  recordCanvasHistory,
  undoCanvas,
  redoCanvas,
  clearCanvasHistory
} from "@/lib/canvas/canvas-history";

type CanvasElementChanges =
  | {
      readonly type: "text";
      readonly content?: string;
      readonly position?: {
        readonly x: number;
        readonly y: number;
      };
      readonly width?: number;
      readonly rotation?: number;
      readonly zIndex?: number;
    }
  | {
      readonly type: "drawing";
      readonly points?: readonly DrawingPoint[];
      readonly strokeWidth?: number;
      readonly color?: string;
      readonly zIndex?: number;
    }
  | {
      readonly type: "sticky";
      readonly content?: string;
      readonly position?: {
        readonly x: number;
        readonly y?: number;
      };
      readonly width?: number;
      readonly height?: number;
      readonly rotation?: number;
      readonly zIndex?: number;
    }
  | {
      readonly type: "image";
      readonly src?: string;
      readonly position?: {
        readonly x: number;
        readonly y: number;
      };
      readonly width?: number;
      readonly height?: number;
      readonly rotation?: number;
      readonly zIndex?: number;
    };

interface CanvasStore {
  roomId: string | null;

  state: CanvasState | null;

  isHydrated: boolean;

  isSaving: boolean;

  lastSavedAt: number | null;

  setRoomId: (
    roomId: string | null
  ) => void;

  hydrate: (
    roomId: string
  ) => Promise<void>;

  replaceState: (
    state: CanvasState
  ) => Promise<void>;

  addElement: (
    element: CanvasElement
  ) => Promise<void>;

  updateElement: (
    elementId: string,
    changes: CanvasElementChanges
  ) => Promise<void>;

  removeElement: (
    elementId: string
  ) => Promise<void>;

  clear: () => Promise<void>;

  undo: () => Promise<void>;

  redo: () => Promise<void>;
}

function createEmptyCanvas(
  canvasId: string
): CanvasState {
  return {
    id: canvasId,
    version: 0,
    elements: [],
    updatedAt: Date.now()
  };
}

async function persistState(
  state: CanvasState
): Promise<number> {
  await saveCanvas(
    state.id,
    state
  );

  return Date.now();
}

async function persistWithoutHistory(
  state: CanvasState,
  set: (
    partial:
      | Partial<CanvasStore>
      | (
          (
            state: CanvasStore
          ) =>
            | Partial<CanvasStore>
            | CanvasStore
        )
  ) => void
): Promise<void> {
  set({
    state,
    isSaving: true
  });

  try {
    const savedAt =
      await persistState(
        state
      );

    set({
      lastSavedAt:
        savedAt,

      isSaving: false
    });
  } catch (error) {
    console.error(
      "Unable to persist canvas state:",
      error
    );

    set({
      isSaving: false
    });

    throw error;
  }
}

export const useCanvasStore =
  create<CanvasStore>(
    (set, get) => ({
      roomId: null,

      state: null,

      isHydrated: false,

      isSaving: false,

      lastSavedAt: null,

      setRoomId: (
        roomId
      ) => {
        clearCanvasHistory();

        set({
          roomId,

          state: null,

          isHydrated: false,

          isSaving: false,

          lastSavedAt: null
        });
      },

      hydrate: async (
        roomId
      ) => {
        clearCanvasHistory();

        set({
          roomId,

          isHydrated: false,

          isSaving: false
        });

        try {
          const storedState =
            await loadCanvas(
              roomId
            );

          const state =
            storedState ??
            createEmptyCanvas(
              roomId
            );

          set({
            state,

            isHydrated: true,

            lastSavedAt:
              storedState?.updatedAt ??
              null
          });
        } catch (error) {
          console.error(
            "Unable to hydrate canvas:",
            error
          );

          set({
            state:
              createEmptyCanvas(
                roomId
              ),

            isHydrated: true,

            lastSavedAt: null
          });
        }
      },

      replaceState:
        async (state) => {
          const currentState =
            get().state;

          if (
            currentState &&
            currentState !==
              state
          ) {
            recordCanvasHistory(
              currentState
            );
          }

          await persistWithoutHistory(
            state,
            set
          );
        },

      addElement:
        async (
          element
        ) => {
          const currentState =
            get().state;

          if (!currentState) {
            throw new Error(
              "Cannot add an element before the canvas is hydrated."
            );
          }

          if (
            currentState.elements.some(
              (existing) =>
                existing.id ===
                element.id
            )
          ) {
            return;
          }

          const nextState: CanvasState =
            {
              ...currentState,

              elements: [
                ...currentState.elements,
                element
              ],

              version:
                currentState.version +
                1,

              updatedAt:
                Date.now()
            };

          await get().replaceState(
            nextState
          );
        },

      updateElement:
        async (
          elementId,
          changes
        ) => {
          const currentState =
            get().state;

          if (!currentState) {
            throw new Error(
              "Cannot update an element before the canvas is hydrated."
            );
          }

          const elementIndex =
            currentState.elements.findIndex(
              (element) =>
                element.id ===
                elementId
            );

          if (
            elementIndex < 0
          ) {
            return;
          }

          const currentElement =
            currentState.elements.at(
              elementIndex
            );

          if (
            !currentElement
          ) {
            return;
          }

          if (
            currentElement.type !==
            changes.type
          ) {
            throw new Error(
              "Canvas element update type does not match the target element."
            );
          }

          const updatedElement =
            createUpdatedElement(
              currentElement,
              changes
            );

          const elements = [
            ...currentState.elements
          ];

          elements[
            elementIndex
          ] = updatedElement;

          const nextState: CanvasState =
            {
              ...currentState,

              elements,

              version:
                currentState.version +
                1,

              updatedAt:
                Date.now()
            };

          await get().replaceState(
            nextState
          );
        },

      removeElement:
        async (
          elementId
        ) => {
          const currentState =
            get().state;

          if (!currentState) {
            throw new Error(
              "Cannot remove an element before the canvas is hydrated."
            );
          }

          const elements =
            currentState.elements.filter(
              (element) =>
                element.id !==
                elementId
            );

          if (
            elements.length ===
            currentState.elements.length
          ) {
            return;
          }

          const nextState: CanvasState =
            {
              ...currentState,

              elements,

              version:
                currentState.version +
                1,

              updatedAt:
                Date.now()
            };

          await get().replaceState(
            nextState
          );
        },

      clear: async () => {
        const currentState =
          get().state;

        if (!currentState) {
          return;
        }

        if (
          currentState.elements
            .length === 0
        ) {
          return;
        }

        const nextState: CanvasState =
          {
            ...currentState,

            elements: [],

            version:
              currentState.version +
              1,

            updatedAt:
              Date.now()
          };

        await get().replaceState(
          nextState
        );
      },

      undo: async () => {
        const currentState =
          get().state;

        if (!currentState) {
          return;
        }

        const previousState =
          undoCanvas(
            currentState
          );

        if (!previousState) {
          return;
        }

        await persistWithoutHistory(
          {
            ...previousState,

            updatedAt:
              Date.now()
          },
          set
        );
      },

      redo: async () => {
        const currentState =
          get().state;

        if (!currentState) {
          return;
        }

        const nextState =
          redoCanvas(
            currentState
          );

        if (!nextState) {
          return;
        }

        await persistWithoutHistory(
          {
            ...nextState,

            updatedAt:
              Date.now()
          },
          set
        );
      }
    })
  );

function createUpdatedElement(
  currentElement: CanvasElement,
  changes: CanvasElementChanges
): CanvasElement {
  const properties =
    Object.fromEntries(
      Object.entries(
        changes
      ).filter(
        ([key]) =>
          key !== "type"
      )
    );

  return {
    ...currentElement,

    ...properties,

    updatedAt: Date.now()
  } as CanvasElement;
}