import React, { useState } from "react";
import { Play, Square, RotateCcw } from "lucide-react";

export default function SimulatorControls() {
  const [status, setStatus] = useState("paused");
  const [speed, setSpeed] = useState(1);

  const handleStart = async (s) => {
    await fetch("http://localhost:3001/api/simulator/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speed: s }),
    });
    setStatus("running");
    setSpeed(s);
  };

  const handleStop = async () => {
    await fetch("http://localhost:3001/api/simulator/stop", {
      method: "POST",
    });
    setStatus("paused");
  };

  const handleReset = async () => {
    await fetch("http://localhost:3001/api/simulator/reset", {
      method: "POST",
    });
    setStatus("paused");
  };

  return (
    <div className="simulator-panel">
      <span className="simulator-label">Simulator</span>

      {status === "paused" ? (
        <button onClick={() => handleStart(speed)} className="btn-accent">
          <Play size={13} /> Start
        </button>
      ) : (
        <button onClick={handleStop} className="btn-danger">
          <Square size={13} /> Stop
        </button>
      )}

      <select
        className="speed-selector"
        value={speed}
        onChange={(e) => {
          const s = parseInt(e.target.value);
          if (status === "running") handleStart(s);
          else setSpeed(s);
        }}
      >
        <option value={1}>1x</option>
        <option value={5}>5x</option>
        <option value={10}>10x</option>
      </select>

      <button onClick={handleReset} className="btn-warning">
        <RotateCcw size={13} /> Reset
      </button>
    </div>
  );
}
