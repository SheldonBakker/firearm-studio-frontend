import { test, expect } from "@playwright/test";
import { waitForOtp } from "./fixtures/waha";

test("login with two-factor completes end to end", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL ?? "";
  const password = process.env.E2E_TEST_PASSWORD ?? "";
  const phone = process.env.E2E_TEST_PHONE_E164 ?? "";

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);

  const sinceMs = Date.now();
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Enter your code" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /resend/i })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start over" }),
  ).toBeVisible();

  const code = await waitForOtp({
    phoneE164: phone,
    match: /login code is (\d{6})/,
    sinceMs,
  });

  await page.getByLabel("Verification code").fill(code);
  await page.getByRole("button", { name: "Verify and sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
});
