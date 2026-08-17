"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  CoupleSpaceRealtimeClient
} from "@/lib/websocket/realtime-client";

import type {
  RealtimeClient
} from "@/lib/websocket/realtime-types";

import type {
  ServerMessage
} from "@/types/protocol";

import type {
  ConnectionState
} from "@/types/session";

interface RealtimeAuthResponse {
  readonly authenticated: boolean;

  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  };

  readonly membership: {
    readonly spaceId: string;
    readonly memberId: string;
    readonly slot: "A" | "B";
  };

  readonly authenticationToken: string;
}

export interface RealtimeSession {
  readonly client: RealtimeClient;
  readonly userId: string;
  readonly roomId: string;
  readonly slot: "A" | "B";
  readonly connectionState: ConnectionState;
  readonly authenticated: boolean;
}

export function useRealtime(
  externalMessageHandler?: (
    message: ServerMessage,
    client: RealtimeClient
  ) => void
): RealtimeSession | null {
  const clientRef =
    useRef<CoupleSpaceRealtimeClient | null>(null);

  const authRef =
    useRef<RealtimeAuthResponse | null>(null);

  const [session, setSession] =
    useState<RealtimeSession | null>(null);

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  const [authenticated, setAuthenticated] =
    useState(false);

  const handleMessage =
    useCallback(
      (
        message: ServerMessage
      ) => {
        const client =
          clientRef.current;

        if (!client) {
          return;
        }

        const auth =
          authRef.current;

        if (
          message.type === "WELCOME" &&
          auth
        ) {
          client.send({
            type: "AUTHENTICATE",
            protocolVersion: 1,
            roomId:
              auth.membership.spaceId,
            userId:
              auth.user.id,
            authenticationToken:
              auth.authenticationToken,
            timestamp:
              Date.now()
          });
        }

        if (
          message.type ===
          "AUTHENTICATION_RESULT"
        ) {
          setAuthenticated(
            message.authenticated
          );
        }

        externalMessageHandler?.(
          message,
          client
        );
      },
      [
        externalMessageHandler
      ]
    );

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const response =
          await fetch(
            "/api/realtime-auth",
            {
              credentials: "include"
            }
          );

        if (!response.ok) {
          throw new Error(
            "Realtime authentication endpoint failed."
          );
        }

        const auth =
          await response.json() as
            RealtimeAuthResponse;

        if (
          cancelled ||
          !auth.authenticated
        ) {
          return;
        }

        authRef.current =
          auth;

        const realtimeUrl =
          process.env[
            "NEXT_PUBLIC_REALTIME_URL"
          ];

        if (!realtimeUrl) {
          throw new Error(
            "NEXT_PUBLIC_REALTIME_URL is not configured."
          );
        }

        const client =
          new CoupleSpaceRealtimeClient({
            url:
              realtimeUrl,

            clientId:
              crypto.randomUUID(),

            onMessage:
              handleMessage,

            onStateChange:
              setConnectionState,

            onError:
              (error) => {
                console.error(
                  "[REALTIME]",
                  error
                );
              },

            onReconnect:
              (attempt) => {
                console.log(
                  "[REALTIME] reconnect:",
                  attempt
                );
              }
          });

        clientRef.current =
          client;

        if (cancelled) {
          client.disconnect();
          return;
        }

        setSession({
          client,
          userId:
            auth.user.id,
          roomId:
            auth.membership.spaceId,
          slot:
            auth.membership.slot,
          connectionState:
            "connecting",
          authenticated:
            false
        });

        client.connect();
      } catch (error) {
        console.error(
          "[REALTIME] Failed to start:",
          error
        );
      }
    }

    void start();

    return () => {
      cancelled = true;

      clientRef.current?.disconnect();

      clientRef.current =
        null;

      authRef.current =
        null;

      setSession(null);
      setAuthenticated(false);
    };
  }, [
    handleMessage
  ]);

  if (!session) {
    return null;
  }

  return {
    ...session,
    connectionState,
    authenticated
  };
}
