import WebSocket from "ws";

const ws = new WebSocket(
  "wss://canvas-space.onrender.com"
);

ws.on("open", () => {
  console.log("[REMOTE TEST] CONNECTED");

  ws.send(JSON.stringify({
    type: "HELLO",
    protocolVersion: 1,
    clientId: "remote-test",
    timestamp: Date.now()
  }));
});

ws.on("message", (data) => {
  console.log(
    "[REMOTE TEST] RECEIVED:",
    data.toString()
  );

  ws.close();
});

ws.on("error", (error) => {
  console.error(
    "[REMOTE TEST] ERROR:",
    error
  );
});

ws.on("close", (code, reason) => {
  console.log(
    "[REMOTE TEST] CLOSED:",
    code,
    reason.toString()
  );
});
