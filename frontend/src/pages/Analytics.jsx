import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  UserX,
  PieChart as PieIcon,
  BarChart2,
} from "lucide-react";

const CustomTooltip = ({ active, payload, label, prefix = "₹" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1A1A2E",
        border: "1px solid rgba(0, 229, 255, 0.3)",
        borderRadius: "6px",
        padding: "0.6rem 1rem",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.72rem",
      }}
    >
      <div style={{ color: "#64748B", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: "#00E5FF" }}>
        {prefix}
        {payload[0].value?.toLocaleString("en-IN")}
      </div>
    </div>
  );
};

export default function Analytics({ activeGymId }) {
  const [data, setData] = useState({
    revenue: [],
    churnRisk: [],
    crossGym: [],
    newVsRenewal: [],
  });

  useEffect(() => {
    if (!activeGymId) return;

    // Fetch individual gym analytics
    fetch(
      `http://localhost:3001/api/gyms/${activeGymId}/analytics?dateRange=30d`,
    )
      .then((res) => res.json())
      .then((gymData) => {
        // Fallback mock for New vs Renewal until backend fully populates A-04
        const newVsRenewal = gymData.newVsRenewal || [
          { name: "New", value: 42 },
          { name: "Renewal", value: 58 },
        ];
        setData((prev) => ({ ...prev, ...gymData, newVsRenewal }));
      })
      .catch(() => {});

    // Fetch cross-gym analytics (PRD A-05)
    fetch(`http://localhost:3001/api/gyms/analytics`)
      .then((res) => res.json())
      .then((crossData) => {
        setData((prev) => ({ ...prev, crossGym: crossData }));
      })
      .catch(() => {});
  }, [activeGymId]);

  const PIE_COLORS = ["#00E5FF", "#FF00FF"];

  return (
    <div className="widget-grid" style={{ marginTop: "2rem" }}>
      {/* ── REVENUE CHART (PRD A-02) ── */}
      <div className="glass-panel">
        <div className="widget-header">
          <div className="widget-header-left">
            <TrendingUp size={16} color="#00E5FF" />
            <h3>30-Day Revenue by Plan</h3>
          </div>
          <span className="widget-header-badge">30D</span>
        </div>
        <div className="chart-container" style={{ height: "250px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.revenue}
              barCategoryGap="35%"
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <XAxis
                dataKey="plan_type"
                stroke="#64748B"
                tick={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fill: "#64748B",
                }}
                axisLine={{ stroke: "rgba(100,116,139,0.15)" }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748B"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0, 229, 255, 0.04)" }}
              />
              <Bar
                dataKey="total"
                fill="#00E5FF"
                radius={[3, 3, 0, 0]}
                fillOpacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── NEW VS RENEWAL DONUT (PRD A-04) ── */}
      <div className="glass-panel">
        <div className="widget-header">
          <div className="widget-header-left">
            <PieIcon size={16} color="#FF00FF" />
            <h3>New vs Renewal Ratio</h3>
          </div>
          <span className="widget-header-badge">30D</span>
        </div>
        <div className="chart-container" style={{ height: "250px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.newVsRenewal}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.newVsRenewal.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip prefix="" />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── CROSS-GYM REVENUE RANKING (PRD A-05) ── */}
      <div className="glass-panel" style={{ gridColumn: "1 / -1" }}>
        <div className="widget-header">
          <div className="widget-header-left">
            <BarChart2 size={16} color="#00E5FF" />
            <h3>Network Leaderboard</h3>
          </div>
          <span className="widget-header-badge">CROSS-GYM</span>
        </div>
        <div className="chart-container" style={{ height: "200px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.crossGym.slice(0, 5)} // Show top 5 to fit UI beautifully
              layout="vertical"
              margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="gym_id"
                type="category"
                stroke="#64748B"
                tick={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fill: "#E2E8F0",
                }}
                axisLine={false}
                tickLine={false}
                width={150}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0, 229, 255, 0.04)" }}
              />
              <Bar
                dataKey="total_revenue"
                fill="#00E5FF"
                radius={[0, 4, 4, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── CHURN RISK (PRD A-03) ── */}
      <div className="glass-panel" style={{ gridColumn: "1 / -1" }}>
        <div className="widget-header">
          <div className="widget-header-left">
            <UserX size={16} color="#FF3333" />
            <h3>Churn Risk</h3>
          </div>
          <span
            className="widget-header-badge"
            style={{
              color: "#FF3333",
              background: "rgba(255,51,51,0.08)",
              border: "1px solid rgba(255,51,51,0.2)",
            }}
          >
            45+ DAYS
          </span>
        </div>

        <div
          className="feed-list"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          {data.churnRisk?.length > 0 ? (
            data.churnRisk.map((member) => (
              <div
                key={member.id}
                className="feed-item churn-item"
                style={{ borderLeft: "4px solid #FF3333" }}
              >
                <span className="highlight-teal" style={{ color: "#FF3333" }}>
                  AT RISK
                </span>
                <span className="event-name">{member.name}</span>
                <span className="churn-days">
                  {new Date(member.last_checkin_at).toLocaleDateString(
                    "en-IN",
                    { day: "2-digit", month: "short" },
                  )}
                </span>
              </div>
            ))
          ) : (
            <p className="feed-empty">No high-risk members detected.</p>
          )}
        </div>
      </div>
    </div>
  );
}
