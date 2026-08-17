"use client";

import {
  useRef,
  useState
} from "react";

export default function RealtimeTestPage() {
  const socketRef =
    useRef<WebSocket | null>(null);

  const [logs, setLogs] =
    useState<string[]>([]);

  function log(
    message: string
  ) {
    setLogs((current) => [
      ...current,
      message
    ]);
  }

  async function connect() {
    if (
      socketRef.current &&
      socketRef.current.readyState ===
        WebSocket.OPEN
    ) {
      log(
        "Already connected."
      );

      return;
    }

    log(
      "Fetching authentication..."
    );

    const response =
      await fetch(
        "/api/realtime-auth"
      );

    const auth =
      await response.json();

    if (
      !response.ok ||
      !auth.authenticated
    ) {
      log(
        `AUTH HTTP FAILED: ${auth.error}`
      );

      return;
    }

    log(
      `Authenticated as ${auth.user.id}`
    );

    const ws =
      new WebSocket(
        "ws://localhost:8787"
      );

    socketRef.current =
      ws;

    ws.onopen = () => {
      log(
        "WebSocket connected"
      );

      ws.send(
        JSON.stringify({
          type: "HELLO",

          protocolVersion: 1,

          clientId:
            crypto.randomUUID(),

          timestamp:
            Date.now()
        })
      );
    };

    ws.onmessage = async (
      event
    ) => {
      let data =
        event.data;

      if (
        data instanceof Blob
      ) {
        data =
          await data.text();
      }

      log(
        `RECEIVED: ${data}`
      );

      let message: any;

      try {
        message =
          JSON.parse(data);
      } catch {
        return;
      }

      if (
        message.type ===
        "WELCOME"
      ) {
        log(
          "Sending AUTHENTICATE..."
        );

        ws.send(
          JSON.stringify({
            type:
              "AUTHENTICATE",

            roomId:
              auth.membership
                .spaceId,

            userId:
              auth.user.id,

            authenticationToken:
              auth.authenticationToken
          })
        );

        return;
      }

      if (
        message.type ===
        "AUTHENTICATION_RESULT"
      ) {
        if (
          message.success
        ) {
          log(
            "?? REALTIME AUTHENTICATION SUCCESS"
          );
        } else {
          log(
            `? AUTH FAILED: ${message.reason}`
          );
        }

        return;
      }

      if (
        message.type ===
        "ROOM_STATE"
      ) {
        log(
          `?? ROOM PARTICIPANTS: ${message.participants.length}`
        );

        return;
      }

      if (
        message.type ===
        "PRESENCE_JOINED"
      ) {
        log(
          `?? PARTNER JOINED: ${message.participant.userId}`
        );

        return;
      }

      if (
        message.type ===
        "PRESENCE_LEFT"
      ) {
        log(
          `?? PARTNER LEFT: ${message.userId}`
        );

        return;
      }

      if (
        message.type ===
        "PONG"
      ) {
        log(
          "?? PONG"
        );
      }

      if (
        message.type ===
        "ROOM_MESSAGE"
      ) {
        log(
          `?? MESSAGE FROM ${message.userId}: ${message.message}`
        );
      }
    };

    ws.onerror = () => {
      log(
        "? WebSocket error"
      );
    };

    ws.onclose = (
      event
    ) => {
      log(
        `WebSocket closed: ${event.code}`
      );

      socketRef.current =
        null;
    };
  }

  function sendTestMessage() {
    const socket =
      socketRef.current;

    if (
      !socket ||
      socket.readyState !==
        WebSocket.OPEN
    ) {
      log(
        "Not connected."
      );

      return;
    }

    socket.send(
      JSON.stringify({
        type:
          "ROOM_MESSAGE",

        message:
          "Hello from Couple Space ??"
      })
    );

    log(
      "?? Test message sent"
    );
  }

  function disconnect() {
    socketRef.current?.close(
      1000,
      "Test disconnect"
    );

    socketRef.current =
      null;

    log(
      "Disconnected manually."
    );
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily:
          "system-ui",
        maxWidth: 800,
        margin: "0 auto"
      }}
    >
      <h1>
        Couple Space Realtime Test
      </h1>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 20
        }}
      >
        <button
          onClick={connect}
        >
          Connect
        </button>

        <button
          onClick={
            sendTestMessage
          }
        >
          Send Test Message
        </button>

        <button
          onClick={disconnect}
        >
          Disconnect
        </button>
      </div>

      <pre
        style={{
          whiteSpace:
            "pre-wrap",
          background:
            "#111",
          color:
            "#fff",
          padding: 16,
          borderRadius: 8,
          minHeight: 300
        }}
      >
        {logs.join("\n")}
      </pre>
    </main>
  );
}
