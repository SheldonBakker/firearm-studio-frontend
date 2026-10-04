import { expect, type Page } from "@playwright/test";

export async function loginAsManager(page: Page) {
  const email = process.env.E2E_MANAGER_EMAIL;
  const password = process.env.E2E_MANAGER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "E2E_MANAGER_EMAIL and E2E_MANAGER_PASSWORD must be set (Manager with 2FA off).",
    );
  }
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}

export function tinyJpeg(): Buffer {
  const header = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46];
  const padding = new Array<number>(512).fill(0x00);
  const footer = [0xff, 0xd9];
  return Buffer.from([...header, ...padding, ...footer]);
}
