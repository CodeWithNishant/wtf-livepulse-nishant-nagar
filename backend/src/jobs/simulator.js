const pool = require("../db/pool");
const { broadcast } = require("../websocket");

// Simulates live traffic so the reviewer sees a "living" dashboard instantly
const simulateLiveCheckins = async () => {
  const randomGym = await pool.query(
    "SELECT id FROM gyms ORDER BY RANDOM() LIMIT 1",
  );
  if (randomGym.rows.length === 0) return;

  const gymId = randomGym.rows[0].id;
  const member = await pool.query(
    "SELECT id, name FROM members WHERE gym_id = $1 ORDER BY RANDOM() LIMIT 1",
    [gymId],
  );

  if (member.rows.length > 0) {
    await pool.query(
      "INSERT INTO checkins (member_id, gym_id) VALUES ($1, $2)",
      [member.rows[0].id, gymId],
    );
    const occRes = await pool.query(
      "SELECT COUNT(*) as count FROM checkins WHERE gym_id = $1 AND checked_out IS NULL",
      [gymId],
    );

    broadcast({
      type: "CHECKIN_EVENT",
      gym_id: gymId,
      member_name: member.rows[0].name,
      timestamp: new Date().toISOString(),
      current_occupancy: parseInt(occRes.rows[0].count),
    });
  }
};

module.exports = { simulateLiveCheckins };
