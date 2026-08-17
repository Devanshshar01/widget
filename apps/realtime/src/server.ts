import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

import {
  WebSocketServer,
  type WebSocket
} from "ws";

import {
  parseClientMessage,
  REALTIME_PROTOCOL_VERSION,
  type ClientHelloMessage,
  type ServerWelcomeMessage
} from "./protocol.js";

import {
  verifyRealtimeAuthToken
} from "./auth.js";

import {
  RoomManager,
  type RoomConnection
} from "./room-manager.js";

const PORT = Number(
  process.env.PORT ?? 8787
);

const httpServer =
  createServer(
    (_request, response) => {
      response.writeHead(200, {
        "content-type": "text/plain"
      });

      response.end(
        "Couple Space realtime server is running.\n"
      );
    }
  );

const websocketServer =
  new WebSocketServer({
    server: httpServer
  });

const rooms =
  new RoomManager();

function send(
  socket: WebSocket,
  message: unknown
): void {
  if (
    socket.readyState ===
    socket.OPEN
  ) {
    socket.send(
      JSON.stringify(message)
    );
  }
}

function sendError(
  socket: WebSocket,
  code: string,
  message: string,
  requestId: string | null = null
): void {
  send(socket, {
    type: "ERROR",
    protocolVersion:
      REALTIME_PROTOCOL_VERSION,
    code,
    message,
    requestId,
    timestamp: Date.now()
  });
}

websocketServer.on(
  "connection",
  (socket) => {
    const connectionId =
      `connection_${randomUUID()}`;

    let authenticated = false;

    let authenticatedUserId:
      string | null = null;

    let authenticatedRoomId:
      string | null = null;

    let authenticatedMemberId:
      string | null = null;

    let authenticatedSlot:
      "A" | "B" | null = null;

    console.log(
      "[REALTIME] Client connected:",
      connectionId
    );

    socket.on(
      "message",
      (data) => {
        let rawMessage: unknown;

        /*
         * Parse JSON.
         */
        try {
          rawMessage =
            JSON.parse(
              data.toString()
            );
        } catch {
          sendError(
            socket,
            "INVALID_JSON",
            "Invalid JSON message."
          );

          return;
        }

        /*
         * Validate against the realtime protocol.
         */
        const parsed =
          parseClientMessage(
            rawMessage
          );

        if (!parsed.success) {
          console.error(
            "[REALTIME] Invalid message:",
            parsed.error
          );

          sendError(
            socket,
            "INVALID_MESSAGE",
            "Message failed protocol validation."
          );

          return;
        }

        const message =
          parsed.data;

        /*
         * HELLO
         */
        if (
          message.type ===
          "HELLO"
        ) {
          const hello:
            ClientHelloMessage =
            message;

          if (
            hello.protocolVersion !==
            REALTIME_PROTOCOL_VERSION
          ) {
            sendError(
              socket,
              "UNSUPPORTED_PROTOCOL",
              "Unsupported protocol version."
            );

            socket.close(
              1002,
              "Unsupported protocol"
            );

            return;
          }

          const welcome:
            ServerWelcomeMessage = {
              type: "WELCOME",

              protocolVersion:
                REALTIME_PROTOCOL_VERSION,

              serverTime:
                Date.now(),

              connectionId
            };

          send(
            socket,
            welcome
          );

          console.log(
            "[REALTIME] HELLO accepted:",
            hello.clientId
          );

          return;
        }

        /*
         * AUTHENTICATE
         */
        if (
          message.type ===
          "AUTHENTICATE"
        ) {
          if (
            message.protocolVersion !==
            REALTIME_PROTOCOL_VERSION
          ) {
            sendError(
              socket,
              "UNSUPPORTED_PROTOCOL",
              "Unsupported protocol version."
            );

            return;
          }

          const payload =
            verifyRealtimeAuthToken(
              message.authenticationToken
            );

          if (!payload) {
            send(
              socket,
              {
                type:
                  "AUTHENTICATION_RESULT",

                protocolVersion:
                  REALTIME_PROTOCOL_VERSION,

                authenticated:
                  false,

                roomId:
                  null,

                userId:
                  null,

                timestamp:
                  Date.now()
              }
            );

            return;
          }

          /*
           * Never trust userId/roomId from the client.
           * They must match the signed token.
           */
          if (
            message.userId !==
            payload.userId
          ) {
            send(
              socket,
              {
                type:
                  "AUTHENTICATION_RESULT",

                protocolVersion:
                  REALTIME_PROTOCOL_VERSION,

                authenticated:
                  false,

                roomId:
                  null,

                userId:
                  null,

                timestamp:
                  Date.now()
              }
            );

            return;
          }

          if (
            message.roomId !==
            payload.roomId
          ) {
            send(
              socket,
              {
                type:
                  "AUTHENTICATION_RESULT",

                protocolVersion:
                  REALTIME_PROTOCOL_VERSION,

                authenticated:
                  false,

                roomId:
                  null,

                userId:
                  null,

                timestamp:
                  Date.now()
              }
            );

            return;
          }

          /*
           * Prevent the same user from joining
           * the same room twice.
           */
          const connection:
            RoomConnection = {
              connectionId,

              userId:
                payload.userId,

              memberId:
                payload.memberId,

              slot:
                payload.slot,

              socket
            };

          const joined =
            rooms.joinRoom(
              payload.roomId,
              connection
            );

          if (!joined) {
            sendError(
              socket,
              "ROOM_FULL",
              "This Couple Space already has two connected participants."
            );

            return;
          }

          authenticated = true;

          authenticatedUserId =
            payload.userId;

          authenticatedRoomId =
            payload.roomId;

          authenticatedMemberId =
            payload.memberId;

          authenticatedSlot =
            payload.slot;

          /*
           * Tell client authentication succeeded.
           */
          send(
            socket,
            {
              type:
                "AUTHENTICATION_RESULT",

              protocolVersion:
                REALTIME_PROTOCOL_VERSION,

              authenticated:
                true,

              roomId:
                payload.roomId,

              userId:
                payload.userId,

              timestamp:
                Date.now()
            }
          );

          /*
           * Tell this client who is currently
           * connected to the room.
           */
          send(
            socket,
            {
              type:
                "ROOM_STATE",

              protocolVersion:
                REALTIME_PROTOCOL_VERSION,

              roomId:
                payload.roomId,

              participants:
                rooms.getParticipants(
                  payload.roomId
                ),

              timestamp:
                Date.now()
            }
          );

          /*
           * Tell the existing partner that
           * this participant joined.
           */
          rooms.broadcast(
            payload.roomId,
            {
              type:
                "PRESENCE_JOINED",

              protocolVersion:
                REALTIME_PROTOCOL_VERSION,

              participant: {
                userId:
                  payload.userId,

                memberId:
                  payload.memberId,

                slot:
                  payload.slot
              },

              timestamp:
                Date.now()
            },
            payload.userId
          );

          console.log(
            "[REALTIME] AUTHENTICATED:",
            {
              connectionId,

              userId:
                payload.userId,

              roomId:
                payload.roomId,

              memberId:
                payload.memberId,

              slot:
                payload.slot,

              roomSize:
                rooms.getRoomSize(
                  payload.roomId
                )
            }
          );

          return;
        }

        /*
         * PING
         */
        if (
          message.type ===
          "PING"
        ) {
          send(
            socket,
            {
              type: "PONG",

              protocolVersion:
                REALTIME_PROTOCOL_VERSION,

              timestamp:
                Date.now()
            }
          );

          return;
        }

        /*
         * Everything below this point
         * requires authentication.
         */
        if (
          !authenticated ||
          !authenticatedUserId ||
          !authenticatedRoomId
        ) {
          sendError(
            socket,
            "NOT_AUTHENTICATED",
            "Authenticate before sending realtime events."
          );

          return;
        }

        /*
         * CURSOR_UPDATE
         */
        if (
          message.type ===
          "CURSOR_UPDATE"
        ) {
          if (
            message.roomId !==
              authenticatedRoomId ||
            message.userId !==
              authenticatedUserId
          ) {
            sendError(
              socket,
              "UNAUTHORIZED",
              "Cursor identity does not match authenticated connection."
            );

            return;
          }

          rooms.broadcast(
            authenticatedRoomId,
            {
              type:
                "CURSOR_UPDATE",

              protocolVersion:
                REALTIME_PROTOCOL_VERSION,

              roomId:
                authenticatedRoomId,

              userId:
                authenticatedUserId,

              x:
                message.x,

              y:
                message.y,

              timestamp:
                Date.now()
            },
            authenticatedUserId
          );

          return;
        }

        /*
         * PRESENCE_UPDATE
         */
        if (
          message.type ===
          "PRESENCE_UPDATE"
        ) {
          if (
            message.roomId !==
              authenticatedRoomId ||
            message.userId !==
              authenticatedUserId
          ) {
            sendError(
              socket,
              "UNAUTHORIZED",
              "Presence identity does not match authenticated connection."
            );

            return;
          }

          rooms.broadcast(
            authenticatedRoomId,
            {
              type:
                "PRESENCE_UPDATE",

              protocolVersion:
                REALTIME_PROTOCOL_VERSION,

              roomId:
                authenticatedRoomId,

              userId:
                authenticatedUserId,

              status:
                message.status,

              timestamp:
                Date.now()
            },
            authenticatedUserId
          );

          return;
        }

        /*
         * CANVAS_OPERATION
         */
        if (
          message.type ===
          "CANVAS_OPERATION"
        ) {
          if (
            message.roomId !==
              authenticatedRoomId ||
            message.userId !==
              authenticatedUserId
          ) {
            sendError(
              socket,
              "UNAUTHORIZED",
              "Canvas identity does not match authenticated connection.",
              message.operationId
            );

            return;
          }

          /*
           * For now the realtime server is only
           * responsible for transporting the operation.
           *
           * Persistent canvas versioning will be
           * added after the transport layer works.
           */
          rooms.broadcast(
            authenticatedRoomId,
            {
              type:
                "CANVAS_OPERATION",

              protocolVersion:
                REALTIME_PROTOCOL_VERSION,

              operationId:
                message.operationId,

              roomId:
                authenticatedRoomId,

              userId:
                authenticatedUserId,

              version:
                message.baseVersion + 1,

              operation:
                message.operation,

              timestamp:
                Date.now()
            },
            authenticatedUserId
          );

          console.log(
            "[REALTIME] Canvas operation:",
            {
              roomId:
                authenticatedRoomId,

              userId:
                authenticatedUserId,

              operationId:
                message.operationId,

              operation:
                message.operation.type
            }
          );

          return;
        }

        /*
         * Unknown message.
         */
        sendError(
          socket,
          "UNKNOWN_MESSAGE_TYPE",
          "Unknown message type."
        );
      }
    );

    /*
     * CONNECTION CLOSED
     */
    socket.on(
      "close",
      () => {
        if (
          authenticated &&
          authenticatedUserId &&
          authenticatedRoomId
        ) {
          const roomId =
            authenticatedRoomId;

          const userId =
            authenticatedUserId;

          rooms.leaveRoom(
            roomId,
            userId
          );

          rooms.broadcast(
            roomId,
            {
              type:
                "PRESENCE_LEFT",

              protocolVersion:
                REALTIME_PROTOCOL_VERSION,

              userId,

              timestamp:
                Date.now()
            }
          );

          console.log(
            "[REALTIME] User left room:",
            {
              userId,

              roomId,

              roomSize:
                rooms.getRoomSize(
                  roomId
                )
            }
          );
        }

        console.log(
          "[REALTIME] Client disconnected:",
          connectionId
        );
      }
    );

    socket.on(
      "error",
      (error) => {
        console.error(
          "[REALTIME] WebSocket error:",
          error
        );
      }
    );
  }
);

httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[REALTIME] Server listening on http://localhost:${PORT}`
    );

    console.log(
      `[REALTIME] WebSocket endpoint: ws://localhost:${PORT}`
    );
  }
);


