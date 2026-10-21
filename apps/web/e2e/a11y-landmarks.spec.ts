/**
 * Covers issue #405: skip link, single `main` landmark, and no h1->h3
 * heading-level skip on the primary app routes.
 */
import { expect, test, type Page } from "@playwright/test";
import { ALPHA_ID, installPublicFixtures } from "./fixtures";

const AUDITED_PATHS = ["/communities", `/communities/${ALPHA_ID}`, "/proposals", "/community"];

async function headingLevels(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((el) =>
      Number(el.tagName.slice(1)),
    ),
  );
}

test.beforeEach(async ({ page }) => {
  await installPublicFixtures(page);
});

for (const path of AUDITED_PATHS) {
  test(`skip link focuses the single main landmark on ${path}`, async ({ page }) => {
    await page.goto(path);

    const mains = page.getByRole("main");
    await expect(mains).toHaveCount(1);

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await skipLink.focus();
    await expect(skipLink).toBeVisible();

    await skipLink.press("Enter");
    const isMainFocused = await page.evaluate(
      () => document.activeElement?.id === "main-content",
    );
    expect(isMainFocused, `${path} should focus #main-content`).toBe(true);
  });

  test(`heading levels never skip from h1 to h3+ on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    const levels = await headingLevels(page);
    expect(levels[0], `${path} should start with an h1`).toBe(1);

    for (let i = 1; i < levels.length; i += 1) {
      const jump = levels[i] - levels[i - 1];
      expect(
        jump,
        `${path}: heading jumped from h${levels[i - 1]} to h${levels[i]} at position ${i}`,
      ).toBeLessThanOrEqual(1);
    }
  });
}
