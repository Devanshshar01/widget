import type {
  CanvasElement,
  CanvasState,
  CanvasVersion
} from "@/types/canvas";

import type {
  PresenceStatus
} from "@/types/session";

/**
 * Every realtime message carries a protocol version.
 *
 * This allows the server and clients to reject incompatible messages
 * instead of silently interpreting different versions of the protocol.
 */
export const REALTIME_PROTOCOL_VERSION = 1 as const;

export type RealtimeProtocolVersion =
  typeof REALTIME_PROTOCOL_VERSION;

export type ClientMessage =
  | ClientHelloMessage
  | ClientAuthenticateMessage
  | ClientCanvasOperationMessage
  | ClientCursorUpdateMessage
  | ClientPresenceUpdateMessage
  | ClientPingMessage;

export type ServerMessage =
  | ServerWelcomeMessage
  | ServerAuthenticationResultMessage
  | ServerCanvasStateMessage
  | ServerCanvasOperationMessage
  | ServerCursorUpdateMessage
  | ServerPresenceUpdateMessage
  | ServerErrorMessage
  | ServerPongMessage;

/* -------------------------------------------------------------------------- */
/* Client → Server                                                            */
/* -------------------------------------------------------------------------- */

export interface ClientHelloMessage {
  readonly type: "HELLO";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly clientId: string;
  readonly timestamp: number;
}

export interface ClientAuthenticateMessage {
  readonly type: "AUTHENTICATE";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly roomId: string;
  readonly userId: string;
  readonly authenticationToken: string;
  readonly timestamp: number;
}

export interface ClientCanvasOperationMessage {
  readonly type: "CANVAS_OPERATION";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly operationId: string;
  readonly roomId: string;
  readonly userId: string;
  readonly baseVersion: CanvasVersion;
  readonly operation: CanvasOperation;
  readonly timestamp: number;
}

export type CanvasOperation =
  | InsertTextOperation
  | DeleteTextOperation
  | UpdateElementOperation
  | CreateElementOperation
  | DeleteElementOperation;

export interface InsertTextOperation {
  readonly type: "INSERT_TEXT";
  readonly elementId: string;
  readonly index: number;
  readonly text: string;
}

export interface DeleteTextOperation {
  readonly type: "DELETE_TEXT";
  readonly elementId: string;
  readonly index: number;
  readonly length: number;
}

export interface UpdateElementOperation {
  readonly type: "UPDATE_ELEMENT";
  readonly elementId: string;
  readonly changes: Readonly<Record<string, unknown>>;
}

export interface CreateElementOperation {
  readonly type: "CREATE_ELEMENT";
  readonly element: CanvasElement;
}

export interface DeleteElementOperation {
  readonly type: "DELETE_ELEMENT";
  readonly elementId: string;
}

export interface ClientCursorUpdateMessage {
  readonly type: "CURSOR_UPDATE";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly roomId: string;
  readonly userId: string;
  readonly x: number;
  readonly y: number;
  readonly timestamp: number;
}

export interface ClientPresenceUpdateMessage {
  readonly type: "PRESENCE_UPDATE";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly roomId: string;
  readonly userId: string;
  readonly status: PresenceStatus;
  readonly timestamp: number;
}

export interface ClientPingMessage {
  readonly type: "PING";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly timestamp: number;
}

/* -------------------------------------------------------------------------- */
/* Server → Client                                                            */
/* -------------------------------------------------------------------------- */

export interface ServerWelcomeMessage {
  readonly type: "WELCOME";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly serverTime: number;
  readonly connectionId: string;
}

export interface ServerAuthenticationResultMessage {
  readonly type: "AUTHENTICATION_RESULT";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly authenticated: boolean;
  readonly roomId: string | null;
  readonly userId: string | null;
  readonly timestamp: number;
}

export interface ServerCanvasStateMessage {
  readonly type: "CANVAS_STATE";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly roomId: string;
  readonly state: CanvasState;
  readonly timestamp: number;
}

export interface ServerCanvasOperationMessage {
  readonly type: "CANVAS_OPERATION";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly operationId: string;
  readonly roomId: string;
  readonly userId: string;
  readonly version: CanvasVersion;
  readonly operation: CanvasOperation;
  readonly timestamp: number;
}

export interface ServerCursorUpdateMessage {
  readonly type: "CURSOR_UPDATE";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly roomId: string;
  readonly userId: string;
  readonly x: number;
  readonly y: number;
  readonly timestamp: number;
}

export interface ServerPresenceUpdateMessage {
  readonly type: "PRESENCE_UPDATE";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly roomId: string;
  readonly userId: string;
  readonly status: PresenceStatus;
  readonly timestamp: number;
}

export type ServerErrorCode =
  | "INVALID_MESSAGE"
  | "UNSUPPORTED_PROTOCOL"
  | "UNAUTHENTICATED"
  | "UNAUTHORIZED"
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "INVALID_OPERATION"
  | "VERSION_CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ServerErrorMessage {
  readonly type: "ERROR";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly code: ServerErrorCode;
  readonly message: string;
  readonly requestId: string | null;
  readonly timestamp: number;
}

export interface ServerPongMessage {
  readonly type: "PONG";
  readonly protocolVersion: RealtimeProtocolVersion;
  readonly timestamp: number;
}