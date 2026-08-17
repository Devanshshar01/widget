import type {
  ClientMessage,
  ServerMessage
} from "@/types/protocol";

import type {
  ConnectionState
} from "@/types/session";

export interface RealtimeClientOptions {
  readonly url: string;

  readonly clientId: string;

  readonly onMessage?: (
    message: ServerMessage
  ) => void;

  readonly onStateChange?: (
    state: ConnectionState
  ) => void;

  readonly onError?: (
    error: Error
  ) => void;

  readonly onReconnect?: (
    attempt: number
  ) => void;
}

export interface RealtimeClient {
  connect(): void;

  disconnect(): void;

  send(
    message: ClientMessage
  ): boolean;

  getState(): ConnectionState;

  isConnected(): boolean;
}