const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

// GET /api/gyms - Fetch all gyms with real-time occupancy
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        g.id, g.name, g.city, g.capacity, g.status,
        (SELECT COUNT(*) FROM checkins c WHERE c.gym_id = g.id AND c.checked_out IS NULL) as current_occupancy
      FROM gyms g
      ORDER BY g.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching gyms:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/gyms/analytics - Benchmark Query for Cross-Gym Revenue
router.get("/analytics", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT gym_id, SUM(amount) as total_revenue 
      FROM payments 
      WHERE paid_at >= NOW() - INTERVAL '30 days' 
      GROUP BY gym_id 
      ORDER BY total_revenue DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
