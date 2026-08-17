import {
  eq
} from "drizzle-orm";

import {
  db
} from "@/lib/db";

import {
  canvasState
} from "@/lib/db/app-schema";

import type {
  CanvasState
} from "@/types/canvas";

function createCanvasId(
  spaceId: string
): string {
  return `canvas_${spaceId}`;
}

export async function getCanvasState(
  spaceId: string
): Promise<CanvasState> {
  const rows =
    await db
      .select()
      .from(canvasState)
      .where(
        eq(
          canvasState.spaceId,
          spaceId
        )
      )
      .limit(1);

  const existing =
    rows[0];

  if (existing) {
    return existing.state as CanvasState;
  }

  const now =
    Date.now();

  const initialState:
    CanvasState = {
      id:
        createCanvasId(
          spaceId
        ),

      version: 0,

      elements: [],

      updatedAt:
        now
    };

  await db
    .insert(canvasState)
    .values({
      id:
        initialState.id,

      spaceId,

      version: 0,

      state:
        initialState
    })
    .onConflictDoNothing();

  return initialState;
}

export async function saveCanvasState(
  spaceId: string,
  state: CanvasState
): Promise<void> {
  await db
    .insert(canvasState)
    .values({
      id:
        createCanvasId(
          spaceId
        ),

      spaceId,

      version:
        state.version,

      state,

      updatedAt:
        new Date()
    })
    .onConflictDoUpdate({
      target:
        canvasState.spaceId,

      set: {
        version:
          state.version,

        state,

        updatedAt:
          new Date()
      }
    });
}
