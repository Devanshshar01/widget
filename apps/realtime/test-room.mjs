import WebSocket from "ws";

const AUTH_URL =
  "http://localhost:3000/api/realtime-auth";

async function createClient(name) {
  const response =
    await fetch(AUTH_URL);

  const auth =
    await response.json();

  if (
    !response.ok ||
    !auth.authenticated
  ) {
    throw new Error(
      `${name}: authentication endpoint failed`
    );
  }

  const ws =
    new WebSocket(
      "ws://localhost:8787"
    );

  ws.on("open", () => {
    console.log(
      `[${name}] CONNECTED`
    );

    ws.send(
      JSON.stringify({
        type: "HELLO",
        protocolVersion: 1,
        clientId: name,
        timestamp: Date.now()
      })
    );
  });

  ws.on("message", (raw) => {
    const message =
      JSON.parse(
        raw.toString()
      );

    console.log(
      `[${name}] ?`,
      message
    );

    if (
      message.type ===
      "WELCOME"
    ) {
      ws.send(
        JSON.stringify({
          type:
            "AUTHENTICATE",

          protocolVersion: 1,

          roomId:
            auth.membership
              .spaceId,

          userId:
            auth.user.id,

          authenticationToken:
            auth.authenticationToken,

          timestamp:
            Date.now()
        })
      );
    }

    if (
      message.type ===
      "AUTHENTICATION_RESULT" &&
      message.authenticated
    ) {
      console.log(
        `[${name}] AUTHENTICATED`
      );

      setTimeout(() => {
        ws.send(
          JSON.stringify({
            type:
              "PRESENCE_UPDATE",

            protocolVersion: 1,

            roomId:
              auth.membership
                .spaceId,

            userId:
              auth.user.id,

            status:
              "online",

            timestamp:
              Date.now()
          })
        );

        console.log(
          `[${name}] ? PRESENCE_UPDATE`
        );
      }, 500);

      setTimeout(() => {
        ws.send(
          JSON.stringify({
            type:
              "CURSOR_UPDATE",

            protocolVersion: 1,

            roomId:
              auth.membership
                .spaceId,

            userId:
              auth.user.id,

            x: 420,

            y: 240,

            timestamp:
              Date.now()
          })
        );

        console.log(
          `[${name}] ? CURSOR_UPDATE`
        );
      }, 1000);
    }
  });

  ws.on("error", (error) => {
    console.error(
      `[${name}] ERROR`,
      error
    );
  });

  return ws;
}

const clientA =
  await createClient(
    "CLIENT-A"
  );

setTimeout(
  async () => {
    await createClient(
      "CLIENT-B"
    );
  },
  1500
);

setTimeout(() => {
  clientA.close();
}, 10000);
