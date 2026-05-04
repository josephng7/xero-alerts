import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home page renders dashboard heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Xero Alerts Dashboard" })).toBeVisible();
  });

  test("health API returns service payload", async ({ request }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());
    const json = (await res.json()) as { service?: string };
    expect(json.service).toBe("xero-alerts");
  });
});
