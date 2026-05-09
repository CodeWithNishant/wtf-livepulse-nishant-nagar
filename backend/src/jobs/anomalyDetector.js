const { evaluateAnomalies } = require("../services/anomalyService");
const { simulateLiveCheckins } = require("./simulator");

let anomalyInterval;
let simulatorInterval;

const start = (wss) => {
  console.log("Starting Background Jobs: Anomaly Engine & Simulator");

  // Run anomaly checks every 30 seconds
  anomalyInterval = setInterval(async () => {
    try {
      await evaluateAnomalies();
    } catch (err) {
      console.error("Anomaly Engine Error:", err);
    }
  }, 30000);

  // Run live simulation to keep the dashboard active (every 3 seconds)
  simulatorInterval = setInterval(async () => {
    try {
      await simulateLiveCheckins();
    } catch (err) {
      console.error("Simulator Error:", err);
    }
  }, 3000);
};

const stop = () => {
  clearInterval(anomalyInterval);
  clearInterval(simulatorInterval);
};

module.exports = { start, stop };
