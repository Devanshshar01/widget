"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  useRealtime
} from "@/lib/realtime/use-realtime";

import {
  applyCanvasOperation,
  type CanvasOperation
} from "@/lib/canvas/operations";

import {
  useCanvasStore
} from "@/stores/canvas/canvas-store";

import type {
  CanvasElement,
  CanvasState
} from "@/types/canvas";

import type {
  ServerMessage
} from "@/types/protocol";

import type {
  RealtimeClient
} from "@/lib/websocket/realtime-types";

interface PartnerPresence {
  readonly userId: string;
  readonly status: string;
}

interface PartnerCursor {
  readonly userId: string;
  readonly x: number;
  readonly y: number;
}

function sendOperation(
  client: RealtimeClient,
  roomId: string,
  userId: string,
  baseVersion: number,
  operation: CanvasOperation
): void {
  client.send({
    type: "CANVAS_OPERATION",
    protocolVersion: 1,
    operationId:
      crypto.randomUUID(),
    roomId,
    userId,
    baseVersion,
    operation,
    timestamp:
      Date.now()
  });
}

function getElementChanges(
  previous: CanvasElement,
  next: CanvasElement
): Record<string, unknown> {
  const changes:
    Record<string, unknown> = {};

  for (
    const key of Object.keys(next)
  ) {
    if (
      key === "id" ||
      key === "type" ||
      key === "createdBy" ||
      key === "createdAt"
    ) {
      continue;
    }

    const previousValue =
      (previous as unknown as Record<string, unknown>)[key];

    const nextValue =
      (next as unknown as Record<string, unknown>)[key];

    if (
      JSON.stringify(previousValue) !==
      JSON.stringify(nextValue)
    ) {
      changes[key] =
        nextValue;
    }
  }

  return changes;
}

function syncDifference(
  previous: CanvasState,
  next: CanvasState,
  client: RealtimeClient,
  roomId: string,
  userId: string
): void {
  const previousMap =
    new Map(
      previous.elements.map(
        (element) => [
          element.id,
          element
        ]
      )
    );

  const nextMap =
    new Map(
      next.elements.map(
        (element) => [
          element.id,
          element
        ]
      )
    );

  for (
    const element of next.elements
  ) {
    const previousElement =
      previousMap.get(
        element.id
      );

    if (!previousElement) {
      sendOperation(
        client,
        roomId,
        userId,
        previous.version,
        {
          type:
            "CREATE_ELEMENT",
          element
        }
      );

      continue;
    }

    const changes =
      getElementChanges(
        previousElement,
        element
      );

    if (
      Object.keys(changes).length > 0
    ) {
      sendOperation(
        client,
        roomId,
        userId,
        previous.version,
        {
          type:
            "UPDATE_ELEMENT",
          elementId:
            element.id,
          changes
        }
      );
    }
  }

  for (
    const element of previous.elements
  ) {
    if (
      !nextMap.has(
        element.id
      )
    ) {
      sendOperation(
        client,
        roomId,
        userId,
        previous.version,
        {
          type:
            "DELETE_ELEMENT",
          elementId:
            element.id
        }
      );
    }
  }
}

export function useCanvasRealtime(
  roomId: string
) {
  const [partnerPresence, setPartnerPresence] =
    useState<PartnerPresence | null>(
      null
    );

  const [partnerCursor, setPartnerCursor] =
    useState<PartnerCursor | null>(
      null
    );

  const previousStateRef =
    useRef<CanvasState | null>(null);

  const applyingRemoteRef =
    useRef(false);

  const authenticatedRef =
    useRef(false);

  const handleMessage =
    useCallback(
      async (
        message: ServerMessage,
        client: RealtimeClient
      ) => {
        const store =
          useCanvasStore.getState();

        if (
          message.type ===
          "AUTHENTICATION_RESULT"
        ) {
          authenticatedRef.current =
            message.authenticated;

          if (
            message.authenticated
          ) {
            client.send({
              type:
                "PRESENCE_UPDATE",
              protocolVersion: 1,
              roomId,
              userId:
                store.roomId === roomId
                  ? roomId
                  : message.userId ?? "",
              status:
                "online",
              timestamp:
                Date.now()
            } as never);
          }

          return;
        }

        if (
          message.type ===
          "CANVAS_STATE"
        ) {
          const local =
            store.state;

          if (
            local &&
            local.elements.length > 0 &&
            message.state.elements.length === 0
          ) {
            for (
              const element of local.elements
            ) {
              sendOperation(
                client,
                roomId,
                message.state.id
                  ? message.state.id
                  : roomId,
                message.state.version,
                {
                  type:
                    "CREATE_ELEMENT",
                  element
                }
              );
            }

            return;
          }

          applyingRemoteRef.current =
            true;

          try {
            await store.replaceState(
              message.state
            );

            previousStateRef.current =
              message.state;
          } finally {
            applyingRemoteRef.current =
              false;
          }

          return;
        }

        if (
          message.type ===
          "CANVAS_OPERATION"
        ) {
          const current =
            store.state;

          if (!current) {
            return;
          }

          const next =
            applyCanvasOperation(
              current,
              message.operation
            );

          const syncedState: CanvasState = {
            ...next,
            version:
              message.version,
            updatedAt:
              message.timestamp
          };

          applyingRemoteRef.current =
            true;

          try {
            await store.replaceState(
              syncedState
            );

            previousStateRef.current =
              syncedState;
          } finally {
            applyingRemoteRef.current =
              false;
          }

          return;
        }

        if (
          message.type ===
          "PRESENCE_UPDATE"
        ) {
          if (
            message.userId !==
            store.roomId
          ) {
            setPartnerPresence({
              userId:
                message.userId,
              status:
                message.status
            });
          }

          return;
        }

        if (
          message.type ===
          "CURSOR_UPDATE"
        ) {
          setPartnerCursor({
            userId:
              message.userId,
            x:
              message.x,
            y:
              message.y
          });

          return;
        }
      },
      [
        roomId
      ]
    );

  const realtime =
    useRealtime(
      handleMessage
    );

  useEffect(() => {
    if (
      !realtime ||
      !realtime.authenticated
    ) {
      return;
    }

    const client =
      realtime.client;

    const initial =
      useCanvasStore.getState()
        .state;

    previousStateRef.current =
      initial;

    const unsubscribe =
      useCanvasStore.subscribe(
        (state) => {
          const next =
            state.state;

          const previous =
            previousStateRef.current;

          if (
            !next ||
            !previous ||
            applyingRemoteRef.current
          ) {
            previousStateRef.current =
              next;

            return;
          }

          if (
            next === previous
          ) {
            return;
          }

          if (
            client.isConnected()
          ) {
            syncDifference(
              previous,
              next,
              client,
              roomId,
              realtime.userId
            );
          }

          previousStateRef.current =
            next;
        }
      );

    return () => {
      unsubscribe();
    };
  }, [
    realtime,
    roomId
  ]);

  useEffect(() => {
    if (
      !realtime?.authenticated
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {
        if (
          !realtime.client.isConnected()
        ) {
          return;
        }

        const store =
          useCanvasStore.getState();

        realtime.client.send({
          type:
            "PRESENCE_UPDATE",
          protocolVersion: 1,
          roomId,
          userId:
            realtime.userId,
          status:
            "online",
          timestamp:
            Date.now()
        } as never);

        const element =
          document
            .activeElement;

        void element;
        void store;
      }, 10_000);

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    realtime,
    roomId
  ]);

  const sendCursor =
    useCallback(
      (
        x: number,
        y: number
      ) => {
        if (
          !realtime?.authenticated ||
          !realtime.client.isConnected()
        ) {
          return;
        }

        realtime.client.send({
          type:
            "CURSOR_UPDATE",
          protocolVersion: 1,
          roomId,
          userId:
            realtime.userId,
          x,
          y,
          timestamp:
            Date.now()
        } as never);
      },
      [
        realtime,
        roomId
      ]
    );

  return {
    realtime,
    partnerPresence,
    partnerCursor,
    sendCursor
  };
}
