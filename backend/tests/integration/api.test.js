const request = require("supertest");

const API_URL = "http://localhost:3001";

describe("LivePulse Backend Integration Tests", () => {
  it("GET /api/gyms - should return 200 and an array of gyms", async () => {
    const res = await request(API_URL).get("/api/gyms");
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("capacity");
  });

  it("GET /api/anomalies - should return 200 and anomaly data", async () => {
    const res = await request(API_URL).get("/api/anomalies");
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it("GET /api/gyms/analytics - should return 200 and cross-gym ranking", async () => {
    const res = await request(API_URL).get("/api/gyms/analytics");
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("total_revenue");
    }
  });
});
