const WebSocket = require("ws");

let wssInstance = null;

const initWebSocket = (server) => {
  wssInstance = new WebSocket.Server({ server });

  wssInstance.on("connection", (ws) => {
    console.log("New client connected to LivePulse WS");
    ws.on("close", () => console.log("Client disconnected"));
  });

  return wssInstance;
};

const broadcast = (data) => {
  if (!wssInstance) return;
  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

module.exports = { initWebSocket, broadcast };
