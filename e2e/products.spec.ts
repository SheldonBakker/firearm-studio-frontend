import { expect, test, type Page } from "@playwright/test";
import { loginAsManager, makeJpeg } from "./helpers/login";

const SEARCH = "Search by name or SKU...";

async function deleteByName(page: Page, name: string) {
  await page.goto("/products");
  await page.getByPlaceholder(SEARCH).fill(name);
  const row = page.locator("tbody tr", { hasText: name });
  await expect(row.first()).toBeVisible({ timeout: 10_000 });
  await row.first().getByRole("button", { name: "Product actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.locator("tbody tr", { hasText: name })).toHaveCount(0, {
    timeout: 30_000,
  });
}

test.describe("products management", () => {
  let createdName: string | null = null;

  test.afterEach(async ({ page }) => {
    const name = createdName;
    createdName = null;
    if (!name) return;
    try {
      await deleteByName(page, name);
    } catch {
      return;
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test("list, search, create with image, inline stock, delete", async ({
    page,
  }) => {
    const unique = Date.now().toString();
    const name = `E2E Product ${unique}`;
    createdName = name;

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
      buffer: await makeJpeg(page),
    });
    await page.getByRole("button", { name: "Create product" }).click();

    await expect(page).toHaveURL(/\/products(\?.*)?$/, { timeout: 30_000 });
    await page.getByPlaceholder(SEARCH).fill(name);
    const row = page.locator("tbody tr", { hasText: name });
    await expect(row).toHaveCount(1, { timeout: 30_000 });
    await expect(row).toBeVisible();
    await expect(row.getByRole("img", { name })).toBeVisible();
    const thumb = row.getByRole("img", { name });
    await expect(thumb).toHaveAttribute("src", /.+/);
    await expect
      .poll(() =>
        thumb.evaluate((el) => (el as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);

    await page.getByPlaceholder(SEARCH).fill("");
    await expect
      .poll(() => page.locator("tbody tr").count(), { timeout: 30_000 })
      .toBeGreaterThanOrEqual(1);
    await page.getByPlaceholder(SEARCH).fill(name);
    await expect(page.locator("tbody tr")).toHaveCount(1, { timeout: 30_000 });

    const patch = page.waitForResponse(
      (r) =>
        r.request().method() === "PATCH" &&
        r.url().includes("/api/v1/products/"),
    );
    await row.getByRole("button", { name: "Increase stock" }).click();
    await patch;
    await expect(row.getByLabel("Stock quantity")).toHaveValue("8");

    await page.reload();
    await page.getByPlaceholder(SEARCH).fill(name);
    const reloadedRow = page.locator("tbody tr", { hasText: name });
    await expect(reloadedRow.getByLabel("Stock quantity")).toHaveValue("8");

    await reloadedRow.getByRole("button", { name: "Product actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(page.locator("tbody tr", { hasText: name })).toHaveCount(0, {
      timeout: 30_000,
    });
    createdName = null;
  });
});
