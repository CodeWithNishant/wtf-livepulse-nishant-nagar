import { test, expect } from "@playwright/test";

const APP_URL = "http://localhost:3000";

test.describe("LivePulse Operations Dashboard", () => {
  test("Dashboard loads and displays core brand", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page).toHaveTitle(/WTF LivePulse/);
    await expect(page.locator("h1")).toContainText("WTF LivePulse");
  });

  test("Global Telemetry feed and Simulator mount successfully", async ({
    page,
  }) => {
    await page.goto(APP_URL);

    // Verify Network Users summary bar renders
    await expect(page.getByText("TOTAL ACTIVE")).toBeVisible();

    // Verify Simulator Controls
    await expect(page.getByText("SIMULATOR ENGINE")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();

    // Verify Main Widgets
    await expect(page.getByText("System Telemetry")).toBeVisible();
    await expect(page.getByText("Live Occupancy")).toBeVisible();
  });

  test("Analytics module renders charts", async ({ page }) => {
    await page.goto(APP_URL);

    // Wait for API data to populate
    await page.waitForTimeout(1000);

    await expect(page.getByText("30-Day Revenue by Plan")).toBeVisible();
    await expect(page.getByText("New vs Renewal Ratio")).toBeVisible();
    await expect(page.getByText("Network Leaderboard")).toBeVisible();
  });
});
