import { expect, test } from "@playwright/test";

test("home page shows the app name and a way to start a round", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Medisc" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a round" })).toBeVisible();
});

test("app is installable as a PWA (manifest + service worker registered)", async ({
  page,
}) => {
  await page.goto("/");

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestHref).toBeTruthy();

  const manifestResponse = await page.request.get(
    new URL(manifestHref!, page.url()).toString(),
  );
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("Medisc");
  expect(manifest.display).toBe("standalone");

  await page.waitForFunction(() =>
    navigator.serviceWorker.getRegistration().then((reg) => Boolean(reg)),
  );
});
