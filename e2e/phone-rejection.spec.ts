import { test, expect } from "@playwright/test";

test("rejects a phone number invalid for the selected country", async ({ page }) => {
  let registerCalled = false;
  await page.route("**/api/v1/auth/register", async (route) => {
    registerCalled = true;
    await route.abort();
  });

  await page.goto("/signup");
  await page.getByLabel("Email").fill("e2e-reject@example.com");
  await page.getByLabel("Password", { exact: true }).fill("correcthorsebattery");
  await page.getByLabel("Phone number (optional)").fill("12345");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText(/valid phone number/i)).toBeVisible();
  expect(registerCalled).toBe(false);
});
