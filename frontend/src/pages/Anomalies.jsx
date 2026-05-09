import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([]);

  const fetchAnomalies = () => {
    fetch("http://localhost:3001/api/anomalies")
      .then((res) => res.json())
      .then(setAnomalies)
      .catch(() => {});
  };

  useEffect(() => {
    fetchAnomalies();
    // Poll every 5 seconds to keep the table fresh
    const interval = setInterval(fetchAnomalies, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (id) => {
    await fetch(`http://localhost:3001/api/anomalies/${id}/dismiss`, {
      method: "POST",
    });
    fetchAnomalies(); // Refresh list immediately after dismissing
  };

  return (
    <div className="glass-panel" style={{ marginTop: "2rem" }}>
      <div className="widget-header">
        <div className="widget-header-left">
          <AlertTriangle size={16} color="#FF3333" />
          <h3>System Anomalies & Alerts</h3>
        </div>
        <span
          className="widget-header-badge"
          style={{
            color: "#FF3333",
            background: "rgba(255,51,51,0.08)",
            border: "1px solid rgba(255,51,51,0.2)",
          }}
        >
          MONITORING
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            textAlign: "left",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid rgba(100,116,139,0.2)",
                color: "#64748B",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                letterSpacing: "1px",
              }}
            >
              <th style={{ padding: "12px 16px" }}>LOCATION</th>
              <th style={{ padding: "12px 16px" }}>TYPE</th>
              <th style={{ padding: "12px 16px" }}>SEVERITY</th>
              <th style={{ padding: "12px 16px" }}>DETECTED</th>
              <th style={{ padding: "12px 16px" }}>STATUS</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((a) => (
              <tr
                key={a.id}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.02)",
                  opacity: a.resolved ? 0.5 : 1,
                  transition: "opacity 0.3s",
                }}
              >
                <td
                  style={{
                    padding: "12px 16px",
                    color: "#E2E8F0",
                    fontWeight: "600",
                  }}
                >
                  {a.gym_name}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    color: "#00E5FF",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.8rem",
                  }}
                >
                  {a.type.replace("_", " ").toUpperCase()}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      color: a.severity === "critical" ? "#FF3333" : "#FFCC00",
                      fontWeight: "700",
                      background:
                        a.severity === "critical"
                          ? "rgba(255,51,51,0.1)"
                          : "rgba(255,204,0,0.1)",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      letterSpacing: "1px",
                    }}
                  >
                    {a.severity.toUpperCase()}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    color: "#64748B",
                    fontSize: "0.85rem",
                  }}
                >
                  {new Date(a.detected_at).toLocaleString("en-IN", {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {a.resolved ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#00FF66",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                      }}
                    >
                      <CheckCircle size={14} /> RESOLVED
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#FF3333",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                      }}
                    >
                      <XCircle size={14} /> ACTIVE
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  {!a.resolved && a.severity === "warning" && (
                    <button
                      onClick={() => handleDismiss(a.id)}
                      style={{
                        background: "transparent",
                        color: "#00E5FF",
                        border: "1px solid rgba(0, 229, 255, 0.3)",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.75rem",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "rgba(0, 229, 255, 0.1)";
                        e.target.style.borderColor = "#00E5FF";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.borderColor = "rgba(0, 229, 255, 0.3)";
                      }}
                    >
                      DISMISS
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {anomalies.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#64748B",
                  }}
                >
                  System nominal. No anomalies detected in the last 24 hours.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
