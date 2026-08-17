"use client";

import {
  create
} from "zustand";

import type {
  CanvasCamera
} from "@/types/canvas-camera";

import {
  DEFAULT_CANVAS_CAMERA,
  clampCanvasZoom,
  MAX_CANVAS_ZOOM,
  MIN_CANVAS_ZOOM
} from "@/types/canvas-camera";

interface CanvasCameraStore {
  camera: CanvasCamera;

  setCamera: (
    camera: CanvasCamera
  ) => void;

  pan: (
    deltaX: number,
    deltaY: number
  ) => void;

  zoom: (
    scale: number,
    anchorX: number,
    anchorY: number
  ) => void;

  reset: () => void;
}

export const useCanvasCameraStore =
  create<CanvasCameraStore>(
    (set) => ({
      camera:
        DEFAULT_CANVAS_CAMERA,

      setCamera: (
        camera
      ) => {
        set({
          camera: {
            ...camera,

            scale:
              clampCanvasZoom(
                camera.scale
              )
          }
        });
      },

      pan: (
        deltaX,
        deltaY
      ) => {
        set(
          (current) => ({
            camera: {
              ...current.camera,

              x:
                current.camera.x -
                deltaX /
                  current.camera.scale,

              y:
                current.camera.y -
                deltaY /
                  current.camera.scale
            }
          })
        );
      },

      zoom: (
        scale,
        anchorX,
        anchorY
      ) => {
        set(
          (current) => {
            const camera =
              current.camera;

            const nextScale =
              clampCanvasZoom(
                scale
              );

            const worldX =
              camera.x +
              anchorX /
                camera.scale;

            const worldY =
              camera.y +
              anchorY /
                camera.scale;

            return {
              camera: {
                x:
                  worldX -
                  anchorX /
                    nextScale,

                y:
                  worldY -
                  anchorY /
                    nextScale,

                scale:
                  nextScale
              }
            };
          }
        );
      },

      reset: () => {
        set({
          camera:
            DEFAULT_CANVAS_CAMERA
        });
      }
    })
  );

export {
  MIN_CANVAS_ZOOM,
  MAX_CANVAS_ZOOM
};