import { z } from "zod";

export const REALTIME_PROTOCOL_VERSION = 1 as const;

const timestampSchema =
  z.number().int().nonnegative();

const idSchema =
  z.string().min(1).max(128);

const protocolVersionSchema =
  z.literal(
    REALTIME_PROTOCOL_VERSION
  );

const canvasPointSchema =
  z.object({
    x: z.number().finite(),
    y: z.number().finite()
  });

const insertTextOperationSchema =
  z.object({
    type: z.literal("INSERT_TEXT"),
    elementId: idSchema,
    index: z.number().int().nonnegative(),
    text: z.string().min(1).max(10_000)
  });

const deleteTextOperationSchema =
  z.object({
    type: z.literal("DELETE_TEXT"),
    elementId: idSchema,
    index: z.number().int().nonnegative(),
    length: z.number().int().positive().max(10_000)
  });

const updateElementOperationSchema =
  z.object({
    type: z.literal("UPDATE_ELEMENT"),
    elementId: idSchema,
    changes: z.record(
      z.string(),
      z.unknown()
    )
  });

const createElementOperationSchema =
  z.object({
    type: z.literal("CREATE_ELEMENT"),
    element: z.unknown()
  });

const deleteElementOperationSchema =
  z.object({
    type: z.literal("DELETE_ELEMENT"),
    elementId: idSchema
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

export const ClientMessageSchema =
  z.discriminatedUnion(
    "type",
    [
      z.object({
        type: z.literal("HELLO"),
        protocolVersion:
          protocolVersionSchema,
        clientId: idSchema,
        timestamp: timestampSchema
      }),

      z.object({
        type: z.literal("AUTHENTICATE"),
        protocolVersion:
          protocolVersionSchema,
        roomId: idSchema,
        userId: idSchema,
        authenticationToken:
          z.string().min(1).max(4096),
        timestamp: timestampSchema
      }),

      z.object({
        type: z.literal("CANVAS_OPERATION"),
        protocolVersion:
          protocolVersionSchema,
        operationId: idSchema,
        roomId: idSchema,
        userId: idSchema,
        baseVersion:
          z.number().int().nonnegative(),
        operation:
          canvasOperationSchema,
        timestamp: timestampSchema
      }),

      z.object({
        type: z.literal("CURSOR_UPDATE"),
        protocolVersion:
          protocolVersionSchema,
        roomId: idSchema,
        userId: idSchema,
        x: z.number().finite(),
        y: z.number().finite(),
        timestamp: timestampSchema
      }),

      z.object({
        type: z.literal("PRESENCE_UPDATE"),
        protocolVersion:
          protocolVersionSchema,
        roomId: idSchema,
        userId: idSchema,
        status: z.enum([
          "online",
          "away",
          "offline"
        ]),
        timestamp: timestampSchema
      }),

      z.object({
        type: z.literal("PING"),
        protocolVersion:
          protocolVersionSchema,
        timestamp: timestampSchema
      })
    ]
  );

export const ServerMessageSchema =
  z.discriminatedUnion(
    "type",
    [
      z.object({
        type: z.literal("WELCOME"),
        protocolVersion:
          protocolVersionSchema,
        serverTime:
          timestampSchema,
        connectionId:
          idSchema
      }),

      z.object({
        type:
          z.literal(
            "AUTHENTICATION_RESULT"
          ),
        protocolVersion:
          protocolVersionSchema,
        authenticated:
          z.boolean(),
        roomId:
          idSchema.nullable(),
        userId:
          idSchema.nullable(),
        timestamp:
          timestampSchema
      }),

      z.object({
        type:
          z.literal("CANVAS_STATE"),
        protocolVersion:
          protocolVersionSchema,
        roomId:
          idSchema,
        state:
          z.unknown(),
        timestamp:
          timestampSchema
      }),

      z.object({
        type:
          z.literal("CANVAS_OPERATION"),
        protocolVersion:
          protocolVersionSchema,
        operationId:
          idSchema,
        roomId:
          idSchema,
        userId:
          idSchema,
        version:
          z.number().int().nonnegative(),
        operation:
          canvasOperationSchema,
        timestamp:
          timestampSchema
      }),

      z.object({
        type:
          z.literal("CURSOR_UPDATE"),
        protocolVersion:
          protocolVersionSchema,
        roomId:
          idSchema,
        userId:
          idSchema,
        x: z.number().finite(),
        y: z.number().finite(),
        timestamp:
          timestampSchema
      }),

      z.object({
        type:
          z.literal("PRESENCE_UPDATE"),
        protocolVersion:
          protocolVersionSchema,
        roomId:
          idSchema,
        userId:
          idSchema,
        status: z.enum([
          "online",
          "away",
          "offline"
        ]),
        timestamp:
          timestampSchema
      }),

      z.object({
        type: z.literal("ERROR"),
        protocolVersion:
          protocolVersionSchema,
        code: z.string(),
        message: z.string(),
        requestId:
          idSchema.nullable(),
        timestamp:
          timestampSchema
      }),

      z.object({
        type: z.literal("PONG"),
        protocolVersion:
          protocolVersionSchema,
        timestamp:
          timestampSchema
      })
    ]
  );

export type ClientMessage =
  z.infer<
    typeof ClientMessageSchema
  >;

export type ServerMessage =
  z.infer<
    typeof ServerMessageSchema
  >;

export type ClientHelloMessage =
  Extract<
    ClientMessage,
    { type: "HELLO" }
  >;

export type ServerWelcomeMessage =
  Extract<
    ServerMessage,
    { type: "WELCOME" }
  >;

export function parseClientMessage(
  input: unknown
) {
  return ClientMessageSchema.safeParse(
    input
  );
}
