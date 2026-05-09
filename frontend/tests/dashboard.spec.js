import { test, expect } from "@playwright/test";

const APP_URL = "http://localhost:3000";

test.describe("LivePulse Operations Dashboard", () => {
  test("Dashboard loads and displays core brand", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page).toHaveTitle(/WTF LivePulse/i);
    await expect(page.locator("h1")).toContainText("WTF LivePulse");
  });

  test("Global Telemetry feed and Simulator mount successfully", async ({
    page,
  }) => {
    await page.goto(APP_URL);

    // Give the React components and WebSocket a moment to mount and fetch data
    await page.waitForTimeout(1500);

    // Verify Network Users summary bar renders
    await expect(page.getByText(/TOTAL ACTIVE/i)).toBeVisible();

    // Verify Simulator Controls by targeting the Start button
    await expect(page.getByRole("button", { name: /Start/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Reset/i })).toBeVisible();

    // Verify Main Widgets - UPDATED TO MATCH NEW UI
    await expect(page.getByText(/Global Telemetry/i)).toBeVisible();
    await expect(page.getByText(/Live Occupancy/i)).toBeVisible();
  });

  test("Analytics module renders charts", async ({ page }) => {
    await page.goto(APP_URL);

    // Wait for the analytical API to populate the charts
    await page.waitForTimeout(1500);

    // Use forgiving regex for widget headers
    await expect(page.getByText(/30-Day Revenue/i)).toBeVisible();
    await expect(page.getByText(/New vs Renewal/i)).toBeVisible();
    await expect(page.getByText(/Network Leaderboard/i)).toBeVisible();
  });
});
