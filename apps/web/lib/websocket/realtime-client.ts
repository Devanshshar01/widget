import {
  parseServerMessage
} from "@/lib/validation/protocol";

import {
  safeJsonParse,
  safeJsonStringify
} from "@/lib/utils/json";

import {
  normalizeError
} from "@/lib/utils/errors";

import {
  now
} from "@/lib/utils/time";

import {
  REALTIME_CONFIG
} from "@/lib/websocket/realtime-config";

import type {
  RealtimeClient,
  RealtimeClientOptions
} from "@/lib/websocket/realtime-types";

import type {
  ClientMessage
} from "@/types/protocol";

import type {
  ConnectionState
} from "@/types/session";

export class CoupleSpaceRealtimeClient
  implements RealtimeClient
{
  private readonly url: string;

  private readonly clientId: string;

  private readonly onMessage:
    RealtimeClientOptions["onMessage"];

  private readonly onStateChange:
    RealtimeClientOptions["onStateChange"];

  private readonly onError:
    RealtimeClientOptions["onError"];

  private readonly onReconnect:
    RealtimeClientOptions["onReconnect"];

  private socket: WebSocket | null = null;

  private state: ConnectionState =
    "disconnected";

  private reconnectTimer:
    ReturnType<typeof setTimeout> | null =
    null;

  private connectionTimeoutTimer:
    ReturnType<typeof setTimeout> | null =
    null;

  private heartbeatTimer:
    ReturnType<typeof setInterval> | null =
    null;

  private reconnectAttempt = 0;

  private manuallyDisconnected = false;

  private connectionGeneration = 0;

  public constructor(
    options: RealtimeClientOptions
  ) {
    this.url = options.url;
    this.clientId = options.clientId;

    this.onMessage =
      options.onMessage;

    this.onStateChange =
      options.onStateChange;

    this.onError =
      options.onError;

    this.onReconnect =
      options.onReconnect;
  }

  public connect(): void {
    if (
      this.manuallyDisconnected
    ) {
      this.manuallyDisconnected =
        false;
    }

    if (
      this.state === "connecting" ||
      this.state === "connected"
    ) {
      return;
    }

    this.clearReconnectTimer();

    this.setState(
      this.reconnectAttempt > 0
        ? "reconnecting"
        : "connecting"
    );

    this.createSocket();
  }

  public disconnect(): void {
    this.manuallyDisconnected =
      true;

    this.clearReconnectTimer();
    this.clearConnectionTimeout();
    this.clearHeartbeat();

    this.reconnectAttempt = 0;

    const socket = this.socket;

    this.socket = null;

    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (
        socket.readyState ===
          WebSocket.OPEN ||
        socket.readyState ===
          WebSocket.CONNECTING
      ) {
        socket.close(
          1000,
          "Client disconnected"
        );
      }
    }

    this.setState(
      "disconnected"
    );
  }

  public send(
    message: ClientMessage
  ): boolean {
    if (
      !this.socket ||
      this.socket.readyState !==
        WebSocket.OPEN
    ) {
      return false;
    }

    const serialized =
      safeJsonStringify(message);

    if (!serialized) {
      this.reportError(
        new Error(
          "Unable to serialize realtime message."
        )
      );

      return false;
    }

    try {
      this.socket.send(serialized);

      return true;
    } catch (error) {
      this.reportError(
        this.toError(error)
      );

      return false;
    }
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public isConnected(): boolean {
    return (
      this.state === "connected" &&
      this.socket?.readyState ===
        WebSocket.OPEN
    );
  }

  private createSocket(): void {
    if (
      typeof window === "undefined"
    ) {
      this.reportError(
        new Error(
          "WebSocket connections can only be created in a browser environment."
        )
      );

      this.setState(
        "disconnected"
      );

      return;
    }

    this.connectionGeneration += 1;

    const generation =
      this.connectionGeneration;

    let socket: WebSocket;

    try {
      socket = new WebSocket(
        this.url
      );
    } catch (error) {
      this.reportError(
        this.toError(error)
      );

      this.scheduleReconnect();

      return;
    }

    this.socket = socket;

    this.startConnectionTimeout(
      generation
    );

    socket.onopen = () => {
      if (
        generation !==
        this.connectionGeneration
      ) {
        return;
      }

      this.clearConnectionTimeout();

      this.reconnectAttempt = 0;

      this.setState(
        "connected"
      );

      this.startHeartbeat();

      this.sendHello();
    };

    socket.onmessage = (
      event
    ) => {
      if (
        generation !==
        this.connectionGeneration
      ) {
        return;
      }

      this.handleMessage(
        event.data
      );
    };

    socket.onerror = () => {
      if (
        generation !==
        this.connectionGeneration
      ) {
        return;
      }

      this.reportError(
        new Error(
          "Realtime connection encountered an error."
        )
      );
    };

    socket.onclose = () => {
      if (
        generation !==
        this.connectionGeneration
      ) {
        return;
      }

      this.clearConnectionTimeout();
      this.clearHeartbeat();

      this.socket = null;

      if (
        this.manuallyDisconnected
      ) {
        this.setState(
          "disconnected"
        );

        return;
      }

      this.setState(
        "disconnected"
      );

      this.scheduleReconnect();
    };
  }

  private handleMessage(
    rawData: unknown
  ): void {
    if (
      typeof rawData !== "string"
    ) {
      this.reportError(
        new Error(
          "Realtime server sent a non-text message."
        )
      );

      return;
    }

    const parsed =
      safeJsonParse(rawData);

    if (parsed === null) {
      this.reportError(
        new Error(
          "Realtime server sent invalid JSON."
        )
      );

      return;
    }

    const result =
      parseServerMessage(parsed);

    if (!result.success) {
      this.reportError(
        new Error(
          "Realtime server sent an invalid protocol message."
        )
      );

      return;
    }

    this.onMessage?.(
      result.data
    );
  }

  private sendHello(): void {
    const message: ClientMessage = {
      type: "HELLO",
      protocolVersion: 1,
      clientId: this.clientId,
      timestamp: now()
    };

    this.send(message);
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();

    this.heartbeatTimer =
      setInterval(() => {
        if (
          !this.isConnected()
        ) {
          return;
        }

        const message: ClientMessage =
          {
            type: "PING",
            protocolVersion: 1,
            timestamp: now()
          };

        this.send(message);
      }, REALTIME_CONFIG.heartbeatIntervalMs);
  }

  private clearHeartbeat(): void {
    if (
      this.heartbeatTimer
    ) {
      clearInterval(
        this.heartbeatTimer
      );

      this.heartbeatTimer = null;
    }
  }

  private startConnectionTimeout(
    generation: number
  ): void {
    this.clearConnectionTimeout();

    this.connectionTimeoutTimer =
      setTimeout(() => {
        if (
          generation !==
          this.connectionGeneration
        ) {
          return;
        }

        if (
          this.socket?.readyState ===
          WebSocket.OPEN
        ) {
          return;
        }

        this.socket?.close();

        this.reportError(
          new Error(
            "Realtime connection timed out."
          )
        );
      }, REALTIME_CONFIG.connectionTimeoutMs);
  }

  private clearConnectionTimeout(): void {
    if (
      this.connectionTimeoutTimer
    ) {
      clearTimeout(
        this.connectionTimeoutTimer
      );

      this.connectionTimeoutTimer =
        null;
    }
  }

  private scheduleReconnect(): void {
    if (
      this.manuallyDisconnected
    ) {
      return;
    }

    if (
      this.reconnectAttempt >=
      REALTIME_CONFIG.maxReconnectAttempts
    ) {
      return;
    }

    this.clearReconnectTimer();

    const delay =
      this.calculateReconnectDelay();

    this.reconnectAttempt += 1;

    this.onReconnect?.(
      this.reconnectAttempt
    );

    this.reconnectTimer =
      setTimeout(() => {
        this.reconnectTimer =
          null;

        if (
          this.manuallyDisconnected
        ) {
          return;
        }

        this.setState(
          "reconnecting"
        );

        this.createSocket();
      }, delay);
  }

  private calculateReconnectDelay(): number {
    const exponentialDelay =
      Math.min(
        REALTIME_CONFIG.reconnectMaxDelayMs,
        REALTIME_CONFIG
          .reconnectInitialDelayMs *
          Math.pow(
            REALTIME_CONFIG
              .reconnectBackoffMultiplier,
            this.reconnectAttempt
          )
      );

    const jitterRange =
      exponentialDelay *
      REALTIME_CONFIG.reconnectJitterRatio;

    const jitter =
      (Math.random() * 2 - 1) *
      jitterRange;

    return Math.max(
      0,
      Math.round(
        exponentialDelay + jitter
      )
    );
  }

  private clearReconnectTimer(): void {
    if (
      this.reconnectTimer
    ) {
      clearTimeout(
        this.reconnectTimer
      );

      this.reconnectTimer = null;
    }
  }

  private setState(
    state: ConnectionState
  ): void {
    if (
      this.state === state
    ) {
      return;
    }

    this.state = state;

    this.onStateChange?.(
      state
    );
  }

  private reportError(
    error: Error
  ): void {
    console.error(
      "Couple Space realtime error:",
      error
    );

    this.onError?.(
      error
    );
  }

  private toError(
    error: unknown
  ): Error {
    const normalized =
      normalizeError(error);

    return new Error(
      normalized.message
    );
  }
}