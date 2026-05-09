const express = require("express");
const pool = require("../db/pool");
const { broadcast } = require("../websocket");
const router = express.Router();

let simInterval = null;

router.post("/start", (req, res) => {
  const speed = req.body.speed || 1;
  const tickRate = Math.max(2000 / speed, 200); // Base 2 seconds, scales with speed

  if (simInterval) clearInterval(simInterval);

  simInterval = setInterval(async () => {
    // Generate a random check-in, check-out, or payment
    const gym = await pool.query(
      "SELECT id FROM gyms ORDER BY RANDOM() LIMIT 1",
    );
    if (!gym.rows.length) return;
    const gymId = gym.rows[0].id;

    const currentHour = new Date().getHours();

    // PRD Realistic Curve Simulation
    let activityMultiplier = 1.0;
    if (currentHour >= 6 && currentHour <= 9)
      activityMultiplier = 2.5; // Morning Rush
    else if (currentHour >= 17 && currentHour <= 20)
      activityMultiplier = 3.0; // Evening Rush
    else if (currentHour >= 23 || currentHour <= 4)
      activityMultiplier = 0.1; // Overnight Deadzone
    else activityMultiplier = 0.8; // Midday

    // Only fire an event if it beats the probability multiplier
    if (Math.random() > 0.4 * activityMultiplier) return;

    const action = Math.random();

    if (action < 0.6) {
      // 60% check-in
      const member = await pool.query(
        "SELECT id, name FROM members WHERE gym_id = $1 AND status = 'active' ORDER BY RANDOM() LIMIT 1",
        [gymId],
      );
      if (member.rows.length) {
        await pool.query(
          "INSERT INTO checkins (member_id, gym_id) VALUES ($1, $2)",
          [member.rows[0].id, gymId],
        );
        const occ = await pool.query(
          "SELECT COUNT(*) as c FROM checkins WHERE gym_id = $1 AND checked_out IS NULL",
          [gymId],
        );
        broadcast({
          type: "CHECKIN_EVENT",
          gym_id: gymId,
          member_name: member.rows[0].name,
          current_occupancy: parseInt(occ.rows[0].c),
          timestamp: new Date(),
        });
      }
    } else if (action < 0.9) {
      // 30% check-out
      const active = await pool.query(
        "SELECT id, member_id FROM checkins WHERE gym_id = $1 AND checked_out IS NULL ORDER BY RANDOM() LIMIT 1",
        [gymId],
      );
      if (active.rows.length) {
        await pool.query(
          "UPDATE checkins SET checked_out = NOW() WHERE id = $1",
          [active.rows[0].id],
        );
        const occ = await pool.query(
          "SELECT COUNT(*) as c FROM checkins WHERE gym_id = $1 AND checked_out IS NULL",
          [gymId],
        );
        broadcast({
          type: "CHECKOUT_EVENT",
          gym_id: gymId,
          current_occupancy: parseInt(occ.rows[0].c),
          timestamp: new Date(),
        });
      }
    } else {
      // 10% payment
      const member = await pool.query(
        "SELECT id, name FROM members WHERE gym_id = $1 ORDER BY RANDOM() LIMIT 1",
        [gymId],
      );
      if (member.rows.length) {
        // Map the exact amounts to their correct plan types
        const plans = [
          { amount: 1499, type: "monthly" },
          { amount: 3999, type: "quarterly" },
          { amount: 11999, type: "annual" },
        ];
        const selectedPlan = plans[Math.floor(Math.random() * plans.length)];

        await pool.query(
          "INSERT INTO payments (member_id, gym_id, amount, plan_type) VALUES ($1, $2, $3, $4)",
          [member.rows[0].id, gymId, selectedPlan.amount, selectedPlan.type],
        );
        broadcast({
          type: "PAYMENT_EVENT",
          gym_id: gymId,
          amount: selectedPlan.amount,
          member_name: member.rows[0].name,
          timestamp: new Date(),
        });
      }
    }
  }, tickRate);

  res.json({ status: "running", speed });
});

router.post("/stop", (req, res) => {
  if (simInterval) clearInterval(simInterval);
  res.json({ status: "paused" });
});

router.post("/reset", async (req, res) => {
  if (simInterval) clearInterval(simInterval);
  await pool.query(
    "UPDATE checkins SET checked_out = NOW() WHERE checked_out IS NULL",
  );
  broadcast({ type: "SYSTEM_RESET" });
  res.json({ status: "reset" });
});

module.exports = router;
