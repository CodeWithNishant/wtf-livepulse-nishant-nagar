const express = require("express");
const pool = require("../db/pool");
const { broadcast } = require("../websocket");
const router = express.Router();

// GET /api/anomalies - Fetch active AND recently resolved anomalies (last 24h)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, g.name as gym_name 
      FROM anomalies a
      JOIN gyms g ON a.gym_id = g.id
      WHERE a.resolved = FALSE 
         OR (a.resolved = TRUE AND a.resolved_at >= NOW() - INTERVAL '24 hours')
      ORDER BY a.detected_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/anomalies/:id/dismiss - Manually dismiss a warning
router.post("/:id/dismiss", async (req, res) => {
  try {
    const { id } = req.params;
    // PRD constraint: Only warning-level anomalies can be manually dismissed
    const result = await pool.query(
      `
      UPDATE anomalies 
      SET resolved = TRUE, resolved_at = NOW(), status = 'manually_dismissed'
      WHERE id = $1 AND severity = 'warning' AND resolved = FALSE
      RETURNING *
    `,
      [id],
    );

    if (result.rowCount > 0) {
      broadcast({ type: "ANOMALY_RESOLVED", anomaly_id: id });
      res.json({ success: true, message: "Anomaly dismissed" });
    } else {
      res
        .status(400)
        .json({ error: "Cannot dismiss critical anomaly or already resolved" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
