import { expect, test } from "@playwright/test";
import { loginAsManager, tinyJpeg } from "./helpers/login";

const SEARCH = "Search by name or SKU...";

test.describe("products management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test("list, search, create with image, inline stock, delete", async ({
    page,
  }) => {
    const unique = Date.now().toString();
    const name = `E2E Product ${unique}`;

    await page.goto("/products");
    await expect(page.getByPlaceholder(SEARCH)).toBeVisible();

    await page.getByRole("button", { name: "New product" }).first().click();
    await expect(page).toHaveURL(/\/products\/new/);

    await page.locator("#product-name").fill(name);
    await page.locator("#product-sku").fill(`SKU-${unique}`);
    await page.locator("#product-price").fill("199.99");
    await page.locator("#product-stock").fill("7");
    await page.locator('input[type="file"]').setInputFiles({
      name: "sample.jpg",
      mimeType: "image/jpeg",
      buffer: tinyJpeg(),
    });
    await page.getByRole("button", { name: "Create product" }).click();

    await expect(page).toHaveURL(/\/products(\?.*)?$/, { timeout: 30_000 });
    await page.getByPlaceholder(SEARCH).fill(name);
    const row = page.locator("tr", { hasText: name });
    await expect(row).toBeVisible({ timeout: 30_000 });

    await row.getByRole("button", { name: "Increase stock" }).click();
    await expect(row.getByLabel("Stock quantity")).toHaveValue("8");

    await page.reload();
    await page.getByPlaceholder(SEARCH).fill(name);
    const reloadedRow = page.locator("tr", { hasText: name });
    await expect(reloadedRow.getByLabel("Stock quantity")).toHaveValue("8");

    await reloadedRow.getByRole("button", { name: "Product actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(page.locator("tr", { hasText: name })).toHaveCount(0, {
      timeout: 30_000,
    });
  });
});
