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

test("every catalog item opens even when optional metadata is omitted", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(rootUrl + "index.html");
  const items = await page.evaluate(() =>
    window.DATABANK.items.map((item) => ({
      title: item.title,
      hash: `#/${item.element}/${encodeURIComponent(item.id)}`
    }))
  );

  for (const item of items) {
    await page.evaluate((hash) => {
      window.location.hash = hash;
    }, item.hash);
    await expect(page.locator(".detail-header h1")).toHaveText(item.title);
  }

  expect(pageErrors).toEqual([]);
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
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() !== "GET") writeAttempted = true;
    if (pathname.endsWith("/git/ref/heads/main")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ object: { sha: "unreadable-head-sha" } })
      });
      return;
    }
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

test("editor refuses to overwrite a newer remote catalog", async ({ page }) => {
  let writeAttempted = false;
  const changedRemote = originalSource.replace("五行教學資料庫", "Remote teacher update");

  await page.route("https://api.github.com/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() !== "GET") writeAttempted = true;

    if (pathname.endsWith("/git/ref/heads/main")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ object: { sha: "newer-head-sha" } })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sha: "newer-content-sha",
        content: Buffer.from(changedRemote, "utf8").toString("base64")
      })
    });
  });

  await page.goto(rootUrl + "admin.html");
  await createValidArticle(page, "remote-conflict-test", "Remote Conflict Test");
  await page.locator("#open-publish").click();
  await page.locator("#gh-token").fill(fakeToken);
  await page.locator("#commit-message").fill("Must not overwrite");
  await page.locator("#publish-direct-btn").click();

  await expect(page.locator("#publish-status")).toContainText("其他人已更新");
  expect(writeAttempted).toBe(false);
});

test("editor atomically publishes media and content, then verifies the public deployment", async ({ page }) => {
  let publishedSource = "";
  let authorization = "";
  let treePayload = null;
  let commitPayload = null;
  let refPayload = null;
  let writeCount = 0;
  let blobCount = 0;

  await page.route("https://api.github.com/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    authorization = request.headers().authorization || authorization;

    if (pathname.endsWith("/git/ref/heads/main") && request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ object: { sha: "original-head-sha" } })
      });
      return;
    }
    if (pathname.endsWith("/contents/data/content.js") && request.method() === "GET") {
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
    if (pathname.endsWith("/git/commits/original-head-sha") && request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tree: { sha: "original-tree-sha" } })
      });
      return;
    }
    if (pathname.endsWith("/git/blobs") && request.method() === "POST") {
      writeCount += 1;
      blobCount += 1;
      const payload = request.postDataJSON();
      const decoded = Buffer.from(payload.content, "base64").toString("utf8");
      if (decoded.startsWith("window.DATABANK")) publishedSource = decoded;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ sha: "new-blob-" + blobCount })
      });
      return;
    }
    if (pathname.endsWith("/git/trees") && request.method() === "POST") {
      writeCount += 1;
      treePayload = request.postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ sha: "new-tree-sha" })
      });
      return;
    }
    if (pathname.endsWith("/git/commits") && request.method() === "POST") {
      writeCount += 1;
      commitPayload = request.postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ sha: "new-commit-sha" })
      });
      return;
    }
    if (pathname.endsWith("/git/refs/heads/main") && request.method() === "PATCH") {
      writeCount += 1;
      refPayload = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ object: { sha: "new-commit-sha" } })
      });
      return;
    }

    await route.fulfill({ status: 500, body: "Unexpected publish API request" });
  });
  await page.route("https://uniplusmathsteam-bot.github.io/wuxing-teaching-databank/data/content.js**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: publishedSource
    });
  });

  await page.goto(rootUrl + "admin.html");
  await createValidArticle(page, "teacher-publishing-safety-test", "Teacher Publishing Safety Test");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator('button[data-pick="cover"]').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "atomic-cover.png",
    mimeType: "image/png",
    buffer: Buffer.from("atomic test image")
  });

  await page.locator("#open-publish").click();
  await expect(page.locator("#publish-validation")).toBeHidden();
  await expect(page.locator("#publish-review")).toContainText("一個 GitHub commit");
  await page.locator("#gh-token").fill(fakeToken);
  await expect(page.locator("#remember-token")).not.toBeChecked();
  await page.locator("#commit-message").fill("Verify safe teacher publishing");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#publish-direct-btn").click();

  await expect(page.locator("#publish-status")).toContainText("發佈及網站部署完成");
  expect(authorization).toBe(`Bearer ${fakeToken}`);
  expect(publishedSource).toContain('id: "teacher-publishing-safety-test"');
  expect(publishedSource).toContain('subject: "highschool-math"');
  expect(writeCount).toBe(5);
  expect(treePayload.base_tree).toBe("original-tree-sha");
  expect(treePayload.tree.map((entry) => entry.path).sort()).toEqual([
    "data/content.js",
    "media/metal/atomic-cover.png"
  ]);
  expect(commitPayload.parents).toEqual(["original-head-sha"]);
  expect(refPayload).toEqual({ sha: "new-commit-sha", force: false });
  await expect(page.locator("#site-link")).toHaveAttribute(
    "href",
    /teacher-publishing-safety-test$/
  );
  const storage = await page.evaluate(() => ({
    token: localStorage.getItem("wuxing-admin-token"),
    draft: localStorage.getItem("wuxing-admin-draft")
  }));
  expect(storage).toEqual({ token: null, draft: null });
});
