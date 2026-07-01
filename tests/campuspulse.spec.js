const { execFileSync } = require("node:child_process");
const { test, expect, request: playwrightRequest, devices } = require("@playwright/test");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://campuspulse:campuspulse_dev_password@127.0.0.1:55434/campuspulse_enterprise?schema=public";

const accounts = {
  organizer: { email: "organizer@campuspulse.test", password: "password123" },
  maya: { email: "student.maya@campuspulse.test", password: "password123" },
  sam: { email: "student.sam@campuspulse.test", password: "password123" },
};

async function apiContext(baseURL, account) {
  const context = await playwrightRequest.newContext({ baseURL });
  const response = await context.post("/api/login", { data: account });
  expect(response.ok()).toBeTruthy();
  return context;
}

async function createPublishedProofEvent(context, title = `Playwright Seat Proof ${Date.now()}`) {
  const startsAt = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString();
  const created = await context.post("/api/events", {
    data: {
      title,
      description: "Playwright verifies capacity locking, FIFO waitlists, and outbox job creation.",
      startsAt,
      capacity: 1,
      locationText: "Playwright Lab",
      tags: ["Proof", "Reliability"],
      terminal: "QA",
      prepNote: "Generated during E2E verification.",
    },
  });
  expect(created.status()).toBe(201);
  const event = (await created.json()).data.event;

  const published = await context.post(`/api/events/${event.id}/publish`);
  expect(published.ok()).toBeTruthy();
  expect((await published.json()).data.event.status).toBe("PUBLISHED");
  return event;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  execFileSync("node", ["prisma/seed.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
});

test("API lifecycle confirms, waitlists, promotes, and writes outbox jobs", async ({ baseURL }) => {
  const organizer = await apiContext(baseURL, accounts.organizer);
  const maya = await apiContext(baseURL, accounts.maya);
  const sam = await apiContext(baseURL, accounts.sam);

  const event = await createPublishedProofEvent(organizer);

  const first = await maya.post(`/api/events/${event.id}/registrations`, { data: {} });
  expect(first.status()).toBe(201);
  const firstRegistration = (await first.json()).data.registration;
  expect(firstRegistration.status).toBe("CONFIRMED");

  const second = await sam.post(`/api/events/${event.id}/registrations`, { data: {} });
  expect(second.status()).toBe(201);
  const secondRegistration = (await second.json()).data.registration;
  expect(secondRegistration.status).toBe("WAITLISTED");
  expect(secondRegistration.waitlistSequence).toBe(1);

  const cancelled = await maya.post(`/api/registrations/${firstRegistration.id}/cancel`, {
    data: { reason: "Playwright promotion check" },
  });
  expect(cancelled.ok()).toBeTruthy();
  const cancelPayload = (await cancelled.json()).data;
  expect(cancelPayload.registration.status).toBe("CANCELLED_BY_USER");
  expect(cancelPayload.promoted.id).toBe(secondRegistration.id);
  expect(cancelPayload.promoted.status).toBe("CONFIRMED");
  expect(cancelPayload.event.confirmedCount).toBe(1);
  expect(cancelPayload.event.waitlistCount).toBe(0);

  const roster = await organizer.get(`/api/events/${event.id}/registrations`);
  expect((await roster.json()).data.registrations).toHaveLength(1);

  const waitlist = await organizer.get(`/api/events/${event.id}/waitlist`);
  expect((await waitlist.json()).data.registrations).toHaveLength(0);

  const jobs = await organizer.get(`/api/notification-jobs?eventId=${event.id}`);
  const jobTypes = (await jobs.json()).data.jobs.map((job) => job.type);
  expect(jobTypes).toEqual(
    expect.arrayContaining([
      "EVENT_PUBLISHED",
      "REGISTRATION_CONFIRMED",
      "REGISTRATION_WAITLISTED",
      "REGISTRATION_CANCELLED",
      "WAITLIST_PROMOTED",
    ]),
  );
});

test("concurrency drill proves no overbooking", async ({ baseURL }) => {
  const organizer = await apiContext(baseURL, accounts.organizer);
  const response = await organizer.post("/api/ops/concurrency-drill", {
    data: { label: "Playwright Concurrency Drill", capacity: 2, attempts: 8 },
  });
  expect(response.status()).toBe(201);
  const result = (await response.json()).data.result;
  expect(result.confirmed).toBe(2);
  expect(result.waitlisted).toBe(6);
  expect(result.overbooked).toBe(0);
});

test("worker processes queued jobs and proof mode is green", async ({ baseURL }) => {
  execFileSync("node", ["src/worker/notification-worker.mjs", "--once"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl, WORKER_ID: "playwright-worker", WORKER_BATCH_SIZE: "50" },
    stdio: "inherit",
  });

  const organizer = await apiContext(baseURL, accounts.organizer);
  const proof = await organizer.get("/api/ops/proof");
  expect(proof.ok()).toBeTruthy();
  const payload = (await proof.json()).data.proof;
  expect(payload.queueSummary.failedJobs).toBe(0);
  expect(payload.queueSummary.pendingJobs).toBe(0);
  expect(payload.queueSummary.sentJobs).toBeGreaterThanOrEqual(1);
  expect(payload.checks.hasSentDeliveries).toBe(true);
  expect(payload.checks.hasWorkerHeartbeat).toBe(true);
  expect(payload.checks.hasNoFailedJobs).toBe(true);
});

test("enterprise UI renders student, organizer, proof, and terminal surfaces", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("role-switch-student").click();
  await expect(page.getByTestId("student-catalog")).toBeVisible();
  await expect(page.locator("[data-testid^='event-card-']").first()).toBeVisible();
  await page.screenshot({ path: "test-results/visual-proof/student-catalog-playwright.png", fullPage: true });

  await page.getByTestId("role-switch-organizer").click();
  await expect(page.getByTestId("organizer-command")).toBeVisible();
  await expect(page.locator("[data-testid^='job-row-']").first()).toBeVisible();
  await page.screenshot({ path: "test-results/visual-proof/organizer-command-playwright.png", fullPage: true });

  await page.getByTestId("role-switch-proof").click();
  await expect(page.locator("section[data-testid='proof-mode']")).toBeVisible();
  await expect(page.getByTestId("proof-worker-status")).toContainText("failed_jobs=0");
  await page.screenshot({ path: "test-results/visual-proof/proof-mode-playwright.png", fullPage: true });

  await page.getByRole("button", { name: /Terminal/ }).click();
  await expect(page.getByTestId("campus-terminal")).toBeVisible();
  await page.screenshot({ path: "test-results/visual-proof/campus-terminal-playwright.png", fullPage: true });
});

test("mobile student portal has no horizontal overflow", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ ...devices["Pixel 7"] });
  const page = await context.newPage();
  await page.goto(`${baseURL}/events`);
  await page.getByTestId("role-switch-student").click();
  await expect(page.locator("[data-testid^='event-card-']").first()).toBeVisible();
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBe(metrics.clientWidth);
  await page.screenshot({ path: "test-results/visual-proof/student-catalog-mobile-playwright.png", fullPage: true });
  await context.close();
});
