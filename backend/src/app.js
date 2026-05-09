const express = require("express");
const cors = require("cors");
const http = require("http");
const { initWebSocket } = require("./websocket");
const anomalyDetector = require("./jobs/anomalyDetector");

const gymRoutes = require("./routes/gyms");
const anomalyRoutes = require("./routes/anomalies");
const simulatorRoutes = require("./routes/simulator");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/gyms", gymRoutes);
app.use("/api/anomalies", anomalyRoutes);
app.use("/api/simulator", simulatorRoutes);

const server = http.createServer(app);

// Initialize WebSockets
const wss = initWebSocket(server);

// Start Background Jobs
anomalyDetector.start(wss);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`LivePulse API + WebSocket listening on port ${PORT}`);
});

module.exports = server; // Export for testing
