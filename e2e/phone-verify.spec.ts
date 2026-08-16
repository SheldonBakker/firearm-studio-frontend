import { test, expect } from "@playwright/test";
import { waitForOtp } from "./fixtures/waha";

test("add and verify a phone number end to end", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL ?? "";
  const password = process.env.E2E_TEST_PASSWORD ?? "";
  const phone = process.env.E2E_TEST_PHONE_E164 ?? "";
  const national = phone.replace(/^\+27/, "");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const loginSinceMs = Date.now();
  await page.getByRole("button", { name: "Sign in" }).click();
  const loginCode = await waitForOtp({
    phoneE164: phone,
    match: /login code is (\d{6})/,
    sinceMs: loginSinceMs,
  });
  await page.getByLabel("Verification code").fill(loginCode);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/settings");
  await page
    .getByRole("button", { name: /Change number|Add a phone number|Verify number/ })
    .click();
  await page.getByLabel("Phone number").fill(national);

  const phoneSinceMs = Date.now();
  await page.getByRole("button", { name: "Send code" }).click();
  const phoneCode = await waitForOtp({
    phoneE164: phone,
    match: /phone verification code is (\d{6})/,
    sinceMs: phoneSinceMs,
  });

  await page.getByLabel("Verification code").fill(phoneCode);
  await page.getByRole("button", { name: "Confirm number" }).click();

  await expect(page.getByText("Confirmed")).toBeVisible();
});
