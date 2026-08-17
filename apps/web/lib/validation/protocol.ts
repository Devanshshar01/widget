import { z } from "zod";

import {
  REALTIME_PROTOCOL_VERSION
} from "@/types/protocol";

/* -------------------------------------------------------------------------- */
/* Shared primitives                                                          */
/* -------------------------------------------------------------------------- */

const protocolVersionSchema = z.literal(
  REALTIME_PROTOCOL_VERSION
);

const timestampSchema = z
  .number()
  .int()
  .nonnegative();

const userIdSchema = z
  .string()
  .min(1)
  .max(128);

const roomIdSchema = z
  .string()
  .min(1)
  .max(128);

const clientIdSchema = z
  .string()
  .min(1)
  .max(128);

const connectionIdSchema = z
  .string()
  .min(1)
  .max(128);

const operationIdSchema = z
  .string()
  .min(1)
  .max(128);

const elementIdSchema = z
  .string()
  .min(1)
  .max(128);

/* -------------------------------------------------------------------------- */
/* Canvas primitives                                                          */
/* -------------------------------------------------------------------------- */

const canvasPointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
});

const canvasElementBaseSchema = z.object({
  id: elementIdSchema,
  createdBy: userIdSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  zIndex: z.number().int()
});

const textElementSchema =
  canvasElementBaseSchema.extend({
    type: z.literal("text"),
    content: z.string().max(10_000),
    position: canvasPointSchema,
    width: z.number().positive().finite(),
    rotation: z.number().finite()
  });

const drawingElementSchema =
  canvasElementBaseSchema.extend({
    type: z.literal("drawing"),
    points: z
      .array(canvasPointSchema)
      .max(10_000),
    strokeWidth: z.number().positive().finite(),
    color: z.string().min(1).max(64)
  });

const stickyElementSchema =
  canvasElementBaseSchema.extend({
    type: z.literal("sticky"),
    content: z.string().max(2_000),
    position: canvasPointSchema,
    width: z.number().positive().finite(),
    height: z.number().positive().finite(),
    rotation: z.number().finite()
  });

const imageElementSchema =
  canvasElementBaseSchema.extend({
    type: z.literal("image"),
    src: z.string().min(1).max(2_000),
    position: canvasPointSchema,
    width: z.number().positive().finite(),
    height: z.number().positive().finite(),
    rotation: z.number().finite()
  });

const canvasElementSchema = z.discriminatedUnion(
  "type",
  [
    textElementSchema,
    drawingElementSchema,
    stickyElementSchema,
    imageElementSchema
  ]
);

const canvasStateSchema = z.object({
  id: z.string().min(1).max(128),
  version: z.number().int().nonnegative(),
  elements: z.array(canvasElementSchema).max(2_000),
  updatedAt: timestampSchema
});

/* -------------------------------------------------------------------------- */
/* Canvas operations                                                          */
/* -------------------------------------------------------------------------- */

const insertTextOperationSchema = z.object({
  type: z.literal("INSERT_TEXT"),
  elementId: elementIdSchema,
  index: z.number().int().nonnegative(),
  text: z.string().min(1).max(10_000)
});

const deleteTextOperationSchema = z.object({
  type: z.literal("DELETE_TEXT"),
  elementId: elementIdSchema,
  index: z.number().int().nonnegative(),
  length: z.number().int().positive().max(10_000)
});

const updateElementOperationSchema = z.object({
  type: z.literal("UPDATE_ELEMENT"),
  elementId: elementIdSchema,
  changes: z
    .object({
      position: canvasPointSchema.optional(),
      width: z.number().positive().finite().optional(),
      height: z.number().positive().finite().optional(),
      rotation: z.number().finite().optional(),
      content: z.string().max(10_000).optional(),
      color: z.string().min(1).max(64).optional(),
      strokeWidth: z.number().positive().finite().optional(),
      zIndex: z.number().int().optional()
    })
    .strict()
    .refine(
      (changes) =>
        Object.keys(changes).length > 0,
      {
        message:
          "Element update must contain at least one change."
      }
    )
});

const createElementOperationSchema = z.object({
  type: z.literal("CREATE_ELEMENT"),
  element: canvasElementSchema
});

const deleteElementOperationSchema = z.object({
  type: z.literal("DELETE_ELEMENT"),
  elementId: elementIdSchema
});

const canvasOperationSchema =
  z.discriminatedUnion(
    "type",
    [
      insertTextOperationSchema,
      deleteTextOperationSchema,
      updateElementOperationSchema,
      createElementOperationSchema,
      deleteElementOperationSchema
    ]
  );

/* -------------------------------------------------------------------------- */
/* Client → Server                                                            */
/* -------------------------------------------------------------------------- */

const clientHelloSchema = z.object({
  type: z.literal("HELLO"),
  protocolVersion: protocolVersionSchema,
  clientId: clientIdSchema,
  timestamp: timestampSchema
});

const clientAuthenticateSchema = z.object({
  type: z.literal("AUTHENTICATE"),
  protocolVersion: protocolVersionSchema,
  roomId: roomIdSchema,
  userId: userIdSchema,
  authenticationToken: z
    .string()
    .min(1)
    .max(4_096),
  timestamp: timestampSchema
});

const clientCanvasOperationSchema = z.object({
  type: z.literal("CANVAS_OPERATION"),
  protocolVersion: protocolVersionSchema,
  operationId: operationIdSchema,
  roomId: roomIdSchema,
  userId: userIdSchema,
  baseVersion: z
    .number()
    .int()
    .nonnegative(),
  operation: canvasOperationSchema,
  timestamp: timestampSchema
});

const clientCursorUpdateSchema = z.object({
  type: z.literal("CURSOR_UPDATE"),
  protocolVersion: protocolVersionSchema,
  roomId: roomIdSchema,
  userId: userIdSchema,
  x: z.number().finite(),
  y: z.number().finite(),
  timestamp: timestampSchema
});

const clientPresenceUpdateSchema = z.object({
  type: z.literal("PRESENCE_UPDATE"),
  protocolVersion: protocolVersionSchema,
  roomId: roomIdSchema,
  userId: userIdSchema,
  status: z.enum([
    "online",
    "away",
    "offline"
  ]),
  timestamp: timestampSchema
});

const clientPingSchema = z.object({
  type: z.literal("PING"),
  protocolVersion: protocolVersionSchema,
  timestamp: timestampSchema
});

export const clientMessageSchema =
  z.discriminatedUnion(
    "type",
    [
      clientHelloSchema,
      clientAuthenticateSchema,
      clientCanvasOperationSchema,
      clientCursorUpdateSchema,
      clientPresenceUpdateSchema,
      clientPingSchema
    ]
  );

/* -------------------------------------------------------------------------- */
/* Server → Client                                                            */
/* -------------------------------------------------------------------------- */

const serverWelcomeSchema = z.object({
  type: z.literal("WELCOME"),
  protocolVersion: protocolVersionSchema,
  serverTime: timestampSchema,
  connectionId: connectionIdSchema
});

const serverAuthenticationResultSchema =
  z.object({
    type: z.literal("AUTHENTICATION_RESULT"),
    protocolVersion: protocolVersionSchema,
    authenticated: z.boolean(),
    roomId: roomIdSchema.nullable(),
    userId: userIdSchema.nullable(),
    timestamp: timestampSchema
  });

const serverCanvasStateSchema = z.object({
  type: z.literal("CANVAS_STATE"),
  protocolVersion: protocolVersionSchema,
  roomId: roomIdSchema,
  state: canvasStateSchema,
  timestamp: timestampSchema
});

const serverCanvasOperationSchema =
  z.object({
    type: z.literal("CANVAS_OPERATION"),
    protocolVersion: protocolVersionSchema,
    operationId: operationIdSchema,
    roomId: roomIdSchema,
    userId: userIdSchema,
    version: z.number().int().nonnegative(),
    operation: canvasOperationSchema,
    timestamp: timestampSchema
  });

const serverCursorUpdateSchema = z.object({
  type: z.literal("CURSOR_UPDATE"),
  protocolVersion: protocolVersionSchema,
  roomId: roomIdSchema,
  userId: userIdSchema,
  x: z.number().finite(),
  y: z.number().finite(),
  timestamp: timestampSchema
});

const serverPresenceUpdateSchema = z.object({
  type: z.literal("PRESENCE_UPDATE"),
  protocolVersion: protocolVersionSchema,
  roomId: roomIdSchema,
  userId: userIdSchema,
  status: z.enum([
    "online",
    "away",
    "offline"
  ]),
  timestamp: timestampSchema
});

const serverErrorSchema = z.object({
  type: z.literal("ERROR"),
  protocolVersion: protocolVersionSchema,
  code: z.enum([
    "INVALID_MESSAGE",
    "UNSUPPORTED_PROTOCOL",
    "UNAUTHENTICATED",
    "UNAUTHORIZED",
    "ROOM_NOT_FOUND",
    "ROOM_FULL",
    "INVALID_OPERATION",
    "VERSION_CONFLICT",
    "RATE_LIMITED",
    "INTERNAL_ERROR"
  ]),
  message: z.string().min(1).max(1_000),
  requestId: z.string().max(128).nullable(),
  timestamp: timestampSchema
});

const serverPongSchema = z.object({
  type: z.literal("PONG"),
  protocolVersion: protocolVersionSchema,
  timestamp: timestampSchema
});

export const serverMessageSchema =
  z.discriminatedUnion(
    "type",
    [
      serverWelcomeSchema,
      serverAuthenticationResultSchema,
      serverCanvasStateSchema,
      serverCanvasOperationSchema,
      serverCursorUpdateSchema,
      serverPresenceUpdateSchema,
      serverErrorSchema,
      serverPongSchema
    ]
  );

/* -------------------------------------------------------------------------- */
/* Public parsing helpers                                                     */
/* -------------------------------------------------------------------------- */

export function parseClientMessage(
  input: unknown
) {
  return clientMessageSchema.safeParse(input);
}

export function parseServerMessage(
  input: unknown
) {
  return serverMessageSchema.safeParse(input);
}