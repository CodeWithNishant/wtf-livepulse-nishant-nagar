const pool = require("../db/pool");
const { broadcast } = require("../websocket");

const evaluateAnomalies = async () => {
  const gyms = await pool.query(
    "SELECT id, name, capacity FROM gyms WHERE status = $1",
    ["active"],
  );

  for (let gym of gyms.rows) {
    // 1. Capacity Breach Check & Auto-Resolve
    const occRes = await pool.query(
      "SELECT COUNT(*) as count FROM checkins WHERE gym_id = $1 AND checked_out IS NULL",
      [gym.id],
    );
    const occupancy = parseInt(occRes.rows[0].count);

    if (occupancy > gym.capacity * 0.9) {
      await logAnomaly(
        gym.id,
        gym.name,
        "capacity_breach",
        "critical",
        `Occupancy at ${occupancy} (Cap: ${gym.capacity})`,
      );
    } else if (occupancy < gym.capacity * 0.85) {
      await resolveAnomaly(gym.id, "capacity_breach"); // Auto-resolve condition met
    }

    // 2. Revenue Drop Check (30% vs last week)
    const revTodayRes = await pool.query(
      "SELECT SUM(amount) as total FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE",
      [gym.id],
    );
    const revLastWeekRes = await pool.query(
      "SELECT SUM(amount) as total FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE - INTERVAL '7 days' AND paid_at < CURRENT_DATE - INTERVAL '6 days'",
      [gym.id],
    );

    const revToday = parseFloat(revTodayRes.rows[0].total || 0);
    const revLastWeek = parseFloat(revLastWeekRes.rows[0].total || 1); // Avoid div by zero

    if (revToday < revLastWeek * 0.7 && revLastWeek > 1000) {
      await logAnomaly(
        gym.id,
        gym.name,
        "revenue_drop",
        "warning",
        `Revenue down >30% vs last week`,
      );
    }
  }
};

const resolveAnomaly = async (gymId, type) => {
  const res = await pool.query(
    "UPDATE anomalies SET resolved = TRUE, resolved_at = NOW() WHERE gym_id = $1 AND type = $2 AND resolved = FALSE RETURNING id",
    [gymId, type],
  );
  if (res.rowCount > 0)
    broadcast({ type: "ANOMALY_RESOLVED", anomaly_id: res.rows[0].id });
};

const logAnomaly = async (gymId, gymName, type, severity, message) => {
  const existing = await pool.query(
    "SELECT id FROM anomalies WHERE gym_id = $1 AND type = $2 AND resolved = FALSE",
    [gymId, type],
  );
  if (existing.rowCount === 0) {
    const res = await pool.query(
      "INSERT INTO anomalies (gym_id, type, severity, message) VALUES ($1, $2, $3, $4) RETURNING id",
      [gymId, type, severity, message],
    );
    broadcast({
      type: "ANOMALY_DETECTED",
      anomaly_id: res.rows[0].id,
      gym_id: gymId,
      gym_name: gymName,
      anomaly_type: type,
      severity,
      message,
    });
  }
};

module.exports = { evaluateAnomalies };
