import {
  applyCanvasOperation,
  type CanvasOperation
} from "@/lib/canvas/operations";

import type {
  CanvasState
} from "@/types/canvas";

import type {
  ClientCanvasOperationMessage
} from "@/types/protocol";

import type {
  RealtimeClient
} from "@/lib/websocket/realtime-types";

export interface CanvasRealtimeController {
  sendOperation(
    operation: CanvasOperation
  ): boolean;

  destroy(): void;
}

export interface CanvasRealtimeOptions {
  readonly client:
    RealtimeClient;

  readonly roomId:
    string;

  readonly userId:
    string;

  readonly getState:
    () => CanvasState;

  readonly setState:
    (
      state: CanvasState
    ) => void;
}

export function createCanvasRealtimeController(
  options: CanvasRealtimeOptions
): CanvasRealtimeController {
  const {
    client,
    roomId,
    userId,
    getState,
    setState
  } = options;

  const sendOperation = (
    operation: CanvasOperation
  ): boolean => {
    const currentState =
      getState();

    const nextState =
      applyCanvasOperation(
        currentState,
        operation
      );

    setState(
      nextState
    );

    const message:
      ClientCanvasOperationMessage = {
      type:
        "CANVAS_OPERATION",

      protocolVersion:
        1,

      operationId:
        crypto.randomUUID(),

      roomId,

      userId,

      baseVersion:
        currentState.version,

      operation,

      timestamp:
        Date.now()
    };

    return client.send(
      message
    );
  };

  return {
    sendOperation,

    destroy() {
      // Lifecycle is owned by
      // the underlying realtime client.
    }
  };
}
