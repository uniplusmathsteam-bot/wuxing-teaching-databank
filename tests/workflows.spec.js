const fs = require("fs");
const http = require("http");
const path = require("path");
const { test, expect } = require("@playwright/test");

const rootPath = path.resolve(__dirname, "..");
const rootUrl = "file:///" + rootPath.replace(/\\/g, "/") + "/";
const originalSource = fs.readFileSync(path.join(rootPath, "data", "content.js"), "utf8");
const fakeToken = "github_pat_AUTOMATED_TEST_ONLY";
let server;
let httpRoot;

test.beforeAll(async () => {
  server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = path.resolve(rootPath, relativePath);

    if (!filePath.startsWith(rootPath) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const contentTypes = {
      ".css": "text/css; charset=utf-8",
      ".html": "text/html; charset=utf-8",
      ".jpg": "image/jpeg",
      ".js": "text/javascript; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml"
    };
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    fs.createReadStream(filePath).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  httpRoot = `http://127.0.0.1:${server.address().port}/`;
});

test.afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function mockSetupApi(page, canWrite) {
  await page.route("https://api.github.com/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === "/user") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ login: "teacher-workflow-test" })
      });
      return;
    }
    if (pathname.endsWith("/collaborators")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            login: "teacher-workflow-test",
            type: "User",
            html_url: "https://github.com/teacher-workflow-test",
            avatar_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
            permissions: { push: canWrite },
            role_name: canWrite ? "write" : "read"
          }
        ])
      });
      return;
    }
    if (pathname === "/repos/uniplusmathsteam-bot/wuxing-teaching-databank") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ permissions: { push: canWrite, admin: false, maintain: false } })
      });
      return;
    }
    await route.fulfill({ status: 500, body: "Unexpected setup API request" });
  });
}

async function createValidArticle(page, id, title) {
  await page.locator("#new-item").click();
  await page.locator("#f-type").selectOption("article");
  await page.locator("#f-title").fill(title);
  await page.locator("#f-id").fill(id);
  await page.locator("#f-subject").selectOption("highschool-math");
  await page.locator("#f-form").fill("S4");
  await page.locator("#f-topic").fill("Functions");
  await page.locator("#f-cover").fill("media/metal/tactical-module-cover.png");
  await page.locator("#f-body").fill("## Verified content\n\nA temporary browser-test article.");
}

test("public dashboard exposes clear navigation and accessible controls", async ({ page }) => {
  await page.goto(rootUrl + "index.html");

  await expect(page.locator(".site-nav")).toContainText("導師投稿");
  await expect(page.locator(".subject-grid .subject-card")).toHaveCount(2);
  await expect(page.locator(".subject-note")).toContainText("5 個科目正在準備");

  const metalLink = page.locator('a[href="#/metal"]').first();
  await metalLink.click();
  await expect(page.locator("main")).toBeFocused();
  await expect(page.locator("[data-type]").first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-view]").first()).toHaveAttribute("aria-pressed", "true");

  await page.goto(rootUrl + "index.html");
  const overviewButton = page.locator("[data-lightbox-src]").first();
  await overviewButton.click();
  await expect(page.locator("#lightbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#lightbox")).toBeHidden();
  await expect(overviewButton).toBeFocused();
});

test("public and teacher guides remain usable on mobile over localhost", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(httpRoot + "index.html");

  await expect(page.locator(".site-nav")).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.goto(httpRoot + "teacher-setup.html");
  await expect(page.locator('[aria-labelledby="content-guide-title"]')).toBeVisible();
  await expect(page.locator('[aria-labelledby="it-setup-title"]')).toBeVisible();
});

test("teacher setup verifies write access and hands off an opted-in token", async ({ page }) => {
  await mockSetupApi(page, true);
  await page.goto(rootUrl + "teacher-setup.html");

  await expect(page.locator("#remember-token")).not.toBeChecked();
  await page.locator("#setup-token").fill(fakeToken);
  await page.locator("#remember-token").check();
  await page.locator("#token-form").evaluate((form) => form.requestSubmit());

  await expect(page.locator("#token-status")).toContainText("可以發佈內容");
  await expect(page.locator("#record-account")).toContainText("Write · 可以發佈");

  await page.locator('.setup-nav a[href="admin.html"]').click();
  await page.locator("#open-publish").click();
  await expect(page.locator("#gh-token")).toHaveValue(fakeToken);
  await expect(page.locator("#remember-token")).toBeChecked();
});

test("teacher setup rejects a read-only token", async ({ page }) => {
  await mockSetupApi(page, false);
  await page.goto(rootUrl + "teacher-setup.html");

  await page.locator("#setup-token").fill(fakeToken);
  await page.locator("#remember-token").check();
  await page.locator("#token-form").evaluate((form) => form.requestSubmit());

  await expect(page.locator("#token-status")).toContainText("沒有足夠權限");
  const saved = await page.evaluate(() => localStorage.getItem("wuxing-admin-token"));
  expect(saved).toBeNull();
});

test("editor blocks publishing while any item is invalid", async ({ page }) => {
  await page.goto(rootUrl + "admin.html");
  await page.locator("#new-item").click();
  await page.locator("#f-title").fill("Incomplete workflow item");
  await page.locator("#open-publish").click();

  await expect(page.locator("#publish-validation")).toBeVisible();
  await expect(page.locator("#publish-validation")).toContainText("封面圖");
  await expect(page.locator("#publish-direct-btn")).toBeDisabled();
});

test("editor fails closed when the remote catalog cannot be read safely", async ({ page }) => {
  let writeAttempted = false;
  await page.route("https://api.github.com/**", async (route) => {
    if (route.request().method() === "PUT") writeAttempted = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sha: "unreadable-content-sha",
        content: Buffer.from("this is not valid JavaScript", "utf8").toString("base64")
      })
    });
  });

  await page.goto(rootUrl + "admin.html");
  await createValidArticle(page, "unreadable-remote-safety-test", "Unreadable Remote Safety Test");
  await page.locator("#open-publish").click();
  await page.locator("#gh-token").fill(fakeToken);
  await page.locator("#commit-message").fill("Verify unreadable remote protection");
  await page.locator("#publish-direct-btn").click();

  await expect(page.locator("#publish-status")).toContainText("無法安全讀取");
  expect(writeAttempted).toBe(false);
});

test("editor safely publishes valid content and clears local secrets and draft", async ({ page }) => {
  let publishedSource = "";
  let authorization = "";

  await page.route("https://api.github.com/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (!pathname.endsWith("/contents/data/content.js")) {
      await route.fulfill({ status: 500, body: "Unexpected publish API request" });
      return;
    }
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sha: "original-content-sha",
          content: Buffer.from(originalSource, "utf8").toString("base64")
        })
      });
      return;
    }

    authorization = request.headers().authorization || "";
    const payload = request.postDataJSON();
    publishedSource = Buffer.from(payload.content, "base64").toString("utf8");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ content: { sha: "published-content-sha" } })
    });
  });

  await page.goto(rootUrl + "admin.html");
  await createValidArticle(page, "teacher-publishing-safety-test", "Teacher Publishing Safety Test");

  await page.locator("#open-publish").click();
  await expect(page.locator("#publish-validation")).toBeHidden();
  await page.locator("#gh-token").fill(fakeToken);
  await expect(page.locator("#remember-token")).not.toBeChecked();
  await page.locator("#commit-message").fill("Verify safe teacher publishing");
  await page.locator("#publish-direct-btn").click();

  await expect(page.locator("#publish-status")).toContainText("發佈成功");
  expect(authorization).toBe(`Bearer ${fakeToken}`);
  expect(publishedSource).toContain('id: "teacher-publishing-safety-test"');
  expect(publishedSource).toContain('subject: "highschool-math"');
  const storage = await page.evaluate(() => ({
    token: localStorage.getItem("wuxing-admin-token"),
    draft: localStorage.getItem("wuxing-admin-draft")
  }));
  expect(storage).toEqual({ token: null, draft: null });
});
