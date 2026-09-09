import { expect, test } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// Notificaciones en tiempo real vía SSE (no sólo la página /notifications).

test("the SSE stream requires auth and streams events for the signed-in user", async ({ browser, baseURL }) => {
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  const unauth = await anonPage.request.get("/api/notifications/stream");
  expect(unauth.status()).toBe(401);
  await anon.close();

  const context = await browser.newContext();
  const page = await context.newPage();
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, {
    name: "Sse",
    email: `sse-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });

  await page.goto("/app");
  // Open the stream from the browser and capture the first frames (it never ends, so read a slice).
  const frames = await page.evaluate(async () => {
    const controller = new AbortController();
    const response = await fetch("/api/notifications/stream", { signal: controller.signal });
    const contentType = response.headers.get("content-type") ?? "";
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
      if (text.includes("event: snapshot")) break;
    }
    controller.abort();
    return { contentType, text };
  });
  expect(frames.contentType).toContain("text/event-stream");
  expect(frames.text).toMatch(/retry:\s*\d+/);
  expect(frames.text).toContain("event: snapshot");

  await context.close();
});

test("the notification bell is live-wired (provider mounted in the shell)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, {
    name: "Bell",
    email: `bell-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
  await page.goto("/app");

  // The bell renders and the EventSource connection is opened from the client.
  const streamOpened = page.waitForResponse((r) => r.url().includes("/api/notifications/stream"), { timeout: 10000 });
  await expect(page.getByRole("link", { name: /Notificaciones/ }).first()).toBeVisible();
  await streamOpened;

  await context.close();
});
