const ws = new WebSocket(
  "ws://localhost:8787"
);

ws.onopen = () => {
  console.log("[TEST] CONNECTED");

  const hello = {
    type: "HELLO",
    protocolVersion: 1,
    clientId: "test-client",
    timestamp: Date.now()
  };

  console.log(
    "[TEST] Sending:",
    hello
  );

  ws.send(
    JSON.stringify(hello)
  );
};

ws.onmessage = async (event) => {
  let data = event.data;

  if (data instanceof Blob) {
    data = await data.text();
  }

  console.log(
    "[TEST] RECEIVED:",
    data
  );

  const message =
    JSON.parse(data);

  if (
    message.type === "WELCOME"
  ) {
    console.log(
      "[TEST] WELCOME received successfully"
    );

    ws.close();
  }
};

ws.onerror = (error) => {
  console.error(
    "[TEST] ERROR:",
    error
  );
};

ws.onclose = (event) => {
  console.log(
    "[TEST] CLOSED:",
    event.code,
    event.reason
  );
};