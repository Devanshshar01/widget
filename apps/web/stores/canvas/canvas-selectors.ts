import {
  useCanvasStore
} from "@/stores/canvas/canvas-store";

import {
  useCanvasHistoryStore
} from "@/stores/canvas/canvas-history-store";

import {
  useCanvasCameraStore
} from "@/stores/canvas/canvas-camera-store";

export const useCanvasState =
  () =>
    useCanvasStore(
      (store) =>
        store.state
    );

export const useCanvasElements =
  () =>
    useCanvasStore(
      (store) =>
        store.state
          ?.elements ?? []
    );

export const useCanvasVersion =
  () =>
    useCanvasStore(
      (store) =>
        store.state
          ?.version ?? 0
    );

export const useCanvasHydration =
  () =>
    useCanvasStore(
      (store) =>
        store.isHydrated
    );

export const useCanvasSaving =
  () =>
    useCanvasStore(
      (store) =>
        store.isSaving
    );

export const useCanvasRoomId =
  () =>
    useCanvasStore(
      (store) =>
        store.roomId
    );

export const useCanvasCanUndo =
  () =>
    useCanvasHistoryStore(
      (store) =>
        store.canUndo
    );

export const useCanvasCanRedo =
  () =>
    useCanvasHistoryStore(
      (store) =>
        store.canRedo
    );

export const useCanvasCamera =
  () =>
    useCanvasCameraStore(
      (store) =>
        store.camera
    );

export const useCanvasZoom =
  () =>
    useCanvasCameraStore(
      (store) =>
        store.camera.scale
    );