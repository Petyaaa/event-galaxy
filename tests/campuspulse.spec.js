const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.__errors = errors;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "CampusPulse" })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(page.__errors ?? []).toEqual([]);
});

test("student can search and filter the Event Galaxy", async ({ page }) => {
  const cards = page.locator(".event-card");

  await expect(cards.filter({ hasText: "Build an AI Study Buddy" })).toBeVisible();
  await page.getByPlaceholder("Event, tag, venue").fill("wellness");

  await expect(cards.filter({ hasText: "Finals Week Wellness Lab" })).toHaveCount(1);
  await expect(cards.filter({ hasText: "Build an AI Study Buddy" })).toHaveCount(0);

  await page.getByPlaceholder("Event, tag, venue").fill("");
  await page.getByRole("button", { name: "Career" }).click();

  await expect(cards.filter({ hasText: "Career Sprint: Resume Critique Pods" })).toBeVisible();
});

test("student registration uses FIFO waitlist and promotion", async ({ page }) => {
  const aiCard = page.locator(".event-card").filter({ hasText: "Build an AI Study Buddy" });

  await page.getByLabel("Active account").selectOption("kai");
  await aiCard.getByRole("button", { name: "Join waitlist" }).click();

  await expect(page.getByRole("status")).toContainText("Joined waitlist at position #2");
  await expect(page.getByText("FIFO position #2")).toBeVisible();

  await page.getByLabel("Active account").selectOption("maya");
  await aiCard.getByRole("button", { name: "Cancel registration" }).click();

  await expect(page.getByRole("status")).toContainText("Nora Patel promoted from waitlist");

  await page.getByLabel("Active account").selectOption("nora");
  await expect(page.getByText("Promoted after a confirmed seat opened")).toBeVisible();
});

test("worker marks pending notification jobs sent and records delivery", async ({ page }) => {
  const aiCard = page.locator(".event-card").filter({ hasText: "Build an AI Study Buddy" });

  await page.getByLabel("Active account").selectOption("kai");
  await aiCard.getByRole("button", { name: "Join waitlist" }).click();
  await page.getByRole("button", { name: "Run worker" }).click();

  await expect(page.getByRole("status")).toContainText("2 jobs sent");

  await page.getByRole("button", { name: "Organizer" }).click();
  await page.getByRole("tab", { name: "Notifications" }).click();

  await expect(page.locator(".job-row.sent").filter({ hasText: "REGISTRATION_WAITLISTED" }).filter({ hasText: "EMAIL" })).toBeVisible();
  await expect(page.locator(".job-row.sent").filter({ hasText: "IN_APP" }).filter({ hasText: "in-app" }).first()).toBeVisible();
});

test("organizer can publish a draft and expose it to students", async ({ page }) => {
  await page.getByRole("button", { name: "Organizer" }).click();
  await page.getByRole("button", { name: /Robotics Club: Sumo Bot Challenge/ }).click();

  await expect(page.getByText("DRAFT").first()).toBeVisible();
  await page.getByRole("button", { name: "Publish", exact: true }).click();

  await expect(page.getByRole("status")).toContainText("Event published");

  await page.getByRole("button", { name: "Student" }).click();
  await page.getByRole("button", { name: "Robotics" }).click();

  const roboticsCard = page.locator(".event-card").filter({ hasText: "Robotics Club: Sumo Bot Challenge" });
  await expect(roboticsCard).toBeVisible();
  await expect(roboticsCard.getByRole("button", { name: "Register" })).toBeVisible();
});

test("organizer console surfaces failed jobs and preview frame", async ({ page }) => {
  await page.getByRole("button", { name: "Organizer" }).click();
  await page.getByRole("button", { name: /Design Systems Crit Night/ }).click();

  await expect(page.locator(".warning-strip")).toContainText("failed notification job");

  await page.getByRole("tab", { name: "Notifications" }).click();
  await expect(page.locator(".job-row.failed").filter({ hasText: "EVENT_CANCELLED" })).toBeVisible();

  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.locator(".phone-frame").filter({ hasText: "Design Systems Crit Night" })).toBeVisible();
});
