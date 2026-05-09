import React, { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { Users, Activity, Database, AlertTriangle } from "lucide-react";
import "../styles/Dashboard.css";
import SimulatorControls from "../components/SimulatorControls";
import Analytics from "../pages/Analytics";
import Anomalies from "../pages/Anomalies"; 

export default function Dashboard() {
  const [gyms, setGyms] = useState([]);
  const [activeGymId, setActiveGymId] = useState(null);
  const [feed, setFeed] = useState([]);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [networkRevenue, setNetworkRevenue] = useState(0);

  const { isConnected, lastMessage } = useWebSocket("ws://localhost:3001");

  useEffect(() => {
    fetch("http://localhost:3001/api/gyms")
      .then((res) => res.json())
      .then((data) => {
        setGyms(data);
        if (data.length > 0) setActiveGymId(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!lastMessage) return;

    if (
      lastMessage.type === "CHECKIN_EVENT" ||
      lastMessage.type === "CHECKOUT_EVENT"
    ) {
      // PRD M-05: Maintain exactly the last 20 events globally
      setFeed((prev) => [lastMessage, ...prev].slice(0, 20));
      setGyms((prevGyms) =>
        prevGyms.map((g) =>
          g.id === lastMessage.gym_id
            ? { ...g, current_occupancy: lastMessage.current_occupancy }
            : g,
        ),
      );
    }

    if (lastMessage.type === "ANOMALY_DETECTED") {
      setAnomalyCount((prev) => prev + 1);
    }

    if (lastMessage.type === "ANOMALY_RESOLVED") {
      setAnomalyCount((prev) => Math.max(0, prev - 1));
    }

    if (lastMessage.type === "PAYMENT_EVENT") {
      setFeed((prev) => [lastMessage, ...prev].slice(0, 20));
      setNetworkRevenue((prev) => prev + parseFloat(lastMessage.amount));
    }
  }, [lastMessage]);

  const activeGym = gyms.find((g) => g.id === activeGymId);
  const totalOccupancy = gyms.reduce(
    (acc, g) => acc + parseInt(g.current_occupancy || 0),
    0,
  );
  const baseRevenue = gyms.reduce(
    (acc, g) => acc + parseFloat(g.today_revenue || 0),
    0,
  );
  const occupancyPct = activeGym
    ? Math.round(
        ((activeGym.current_occupancy || 0) / (activeGym.capacity || 1)) * 100,
      )
    : 0;

  // PRD M-03: Strict Color Coding Logic
  const getCapacityColor = (pct) => {
    if (pct < 60) return "#00FF66"; // Green
    if (pct <= 85) return "#FFCC00"; // Yellow
    return "#FF3333"; // Red
  };
  const capacityColor = getCapacityColor(occupancyPct);

  const feedTypeClass = (type) => {
    if (type === "CHECKIN_EVENT") return "type-checkin";
    if (type === "CHECKOUT_EVENT") return "type-checkout";
    if (type === "PAYMENT_EVENT") return "type-payment";
    return "";
  };

  return (
    <div className="dashboard-container">
      {/* ── TOP NAV ── */}
      <nav className="glass-nav">
        <div className="brand">
          <div className="brand-icon">
            <Database size={18} color="#00E5FF" />
          </div>
          <h1>WTF LivePulse</h1>
          <span className="brand-version">v2.0</span>
        </div>

        <div className="nav-controls">
          {anomalyCount > 0 && (
            <div className="anomaly-badge">
              <AlertTriangle size={14} />
              {anomalyCount} Alert{anomalyCount !== 1 ? "s" : ""}
            </div>
          )}
          <div className="nav-divider" />
          <div className="connection-status">
            <span className={`dot ${isConnected ? "live" : "dead"}`} />
            {isConnected ? "LIVE" : "OFFLINE"}
          </div>
        </div>
      </nav>

      {/* ── SUMMARY BAR ── */}
      <div className="summary-bar">
        <div className="metric-small">
          NETWORK&nbsp;
          <span className="highlight-teal">{gyms.length} GYMS</span>
        </div>
        <div className="metric-small">
          TOTAL ACTIVE&nbsp;
          <span className="highlight-teal">{totalOccupancy}</span>
        </div>
        <div className="metric-small">
          TODAY REVENUE&nbsp;
          <span className="highlight-teal">
            ₹{(baseRevenue + networkRevenue).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        {/* ── TOOLBAR ROW ── */}
        <div className="toolbar-row">
          <select
            className="gym-selector"
            value={activeGymId || ""}
            onChange={(e) => setActiveGymId(e.target.value)}
          >
            {gyms.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.city}
              </option>
            ))}
          </select>

          <SimulatorControls />
        </div>

        {activeGym ? (
          <>
            <div className="widget-grid">
              {/* ── OCCUPANCY ── */}
              <div className="glass-panel">
                <div className="widget-header">
                  <div className="widget-header-left">
                    <Users size={16} color={capacityColor} />
                    <h3>Live Occupancy</h3>
                  </div>
                  <span className="widget-header-badge">REALTIME</span>
                </div>
                <div className="widget-body">
                  <div className="metric-block">
                    <div
                      className="metric"
                      style={{
                        color: capacityColor,
                        textShadow: `0 0 20px ${capacityColor}66`,
                      }}
                    >
                      {activeGym.current_occupancy || 0}
                    </div>
                    <div className="metric-row">
                      <span className="subtext">
                        / {activeGym.capacity} capacity
                      </span>
                      <span
                        style={{
                          color: capacityColor,
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                        }}
                      >
                        {occupancyPct}%
                      </span>
                    </div>
                  </div>
                  <div className="capacity-bar-track">
                    <div
                      className="capacity-bar-fill"
                      style={{
                        width: `${Math.min(occupancyPct, 100)}%`,
                        background: capacityColor,
                        boxShadow: `0 0 10px ${capacityColor}`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ── TELEMETRY FEED (GLOBAL) ── */}
              <div className="glass-panel">
                <div className="widget-header">
                  <div className="widget-header-left">
                    <Activity size={16} color="#00E5FF" />
                    <h3>Global Telemetry</h3>
                  </div>
                  {feed.length > 0 && (
                    <span className="widget-header-badge">ALL GYMS</span>
                  )}
                </div>

                <div className="feed-list">
                  {feed.length > 0 ? (
                    feed.map((event, idx) => {
                      const eventGym = gyms.find((g) => g.id === event.gym_id);
                      return (
                        <div
                          key={idx}
                          className={`feed-item ${feedTypeClass(event.type)}`}
                        >
                          <span className="highlight-teal">
                            {event.type.replace("_EVENT", "")}
                          </span>
                          <span className="event-name">
                            {event.member_name}
                          </span>
                          <span
                            style={{
                              color: "#64748B",
                              fontSize: "0.7rem",
                              marginRight: "10px",
                            }}
                          >
                            {eventGym?.name.split("—")[1]?.trim() ||
                              eventGym?.name}
                          </span>
                          <span className="event-time">
                            {new Date(event.timestamp).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="feed-empty">Awaiting telemetry data...</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── ANALYTICS & ANOMALIES ── */}
            <Analytics activeGymId={activeGymId} />
            <Anomalies />
          </>
        ) : (
          <div className="glass-panel init-state">
            INITIALIZING CORE SYSTEMS...
          </div>
        )}
      </main>
    </div>
  );
}
