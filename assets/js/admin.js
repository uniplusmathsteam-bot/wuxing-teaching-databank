(function () {
  "use strict";

  const REPO = "uniplusmathsteam-bot/wuxing-teaching-databank";
  const BRANCH = "main";
  const CONTENT_PATH = "data/content.js";
  const EDIT_URL = "https://github.com/" + REPO + "/edit/" + BRANCH + "/" + CONTENT_PATH;
  const UPLOAD_URL = "https://github.com/" + REPO + "/upload/" + BRANCH + "/media";
  const SITE_URL = "https://uniplusmathsteam-bot.github.io/wuxing-teaching-databank/";
  const DRAFT_KEY = "wuxing-admin-draft";
  const TOKEN_KEY = "wuxing-admin-token";

  const FIELD_ORDER = [
    "id",
    "element",
    "type",
    "title",
    "subtitle",
    "tags",
    "cover",
    "video",
    "images",
    "imageLayout",
    "tool",
    "subject",
    "form",
    "topic",
    "level",
    "tla",
    "duration",
    "date",
    "featured",
    "body"
  ];

  const TYPE_LABELS = { video: "影片", image: "圖片", article: "文章", tool: "互動工具" };

  const dom = {};
  [
    "draft-state",
    "draft-banner",
    "draft-banner-text",
    "discard-draft",
    "open-publish",
    "new-item",
    "list-search",
    "element-tabs",
    "admin-items",
    "admin-empty",
    "admin-form",
    "form-kicker",
    "form-title",
    "form-errors",
    "duplicate-item",
    "delete-item",
    "regen-id",
    "tag-preview",
    "add-image",
    "image-rows",
    "preview-card",
    "show-all-media",
    "upload-link",
    "publish-overlay",
    "close-publish",
    "copy-source",
    "download-source",
    "github-link",
    "publish-source",
    "gh-token",
    "forget-token",
    "commit-message",
    "publish-direct-btn",
    "publish-status",
    "site-link",
    "f-element",
    "f-type",
    "f-title",
    "f-subtitle",
    "f-date",
    "f-featured",
    "f-id",
    "f-form",
    "f-topic",
    "f-subject",
    "f-level",
    "f-tla",
    "f-duration",
    "f-tags",
    "f-cover",
    "f-video-provider",
    "f-video-value",
    "f-video-value-label",
    "f-image-layout",
    "f-tool",
    "f-body",
    "form-list",
    "topic-list",
    "level-list"
  ].forEach(function (id) {
    dom[id] = document.getElementById(id);
  });

  const escapeHtml = window.WuxingMarkdown.escape;

  let db = clone(window.DATABANK);
  let selected = null;
  let filterElement = "";
  let searchText = "";
  let dirty = false;
  let imageRows = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function elementById(id) {
    return db.elements.find(function (element) {
      return element.id === id;
    });
  }

  /* ---------- draft storage ---------- */

  function markSaved(message) {
    dom["draft-state"].textContent = message;
    dom["draft-state"].classList.add("is-dirty");
  }

  function saveDraft() {
    dirty = true;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(db));
      markSaved("草稿：已自動儲存（未發佈）");
    } catch (_) {
      markSaved("草稿：瀏覽器無法儲存，請盡快發佈");
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (_) {
      // Nothing to clean up when storage is unavailable.
    }
  }

  function loadDraft() {
    let raw = null;
    try {
      raw = localStorage.getItem(DRAFT_KEY);
    } catch (_) {
      return;
    }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return;

      const publishedSource = buildSource();
      db = parsed;
      if (buildSource() === publishedSource) {
        // The live site has caught up with this draft, so there is nothing left to restore.
        db = clone(window.DATABANK);
        clearDraft();
        return;
      }

      dirty = true;
      markSaved("草稿：已載入未發佈的修改");
      dom["draft-banner"].hidden = false;
      dom["draft-banner-text"].textContent =
        "已載入上次未發佈的草稿（共 " + parsed.items.length + " 項內容）。想回到網站上的版本，請按右上角「捨棄草稿」。";
    } catch (_) {
      // A corrupted draft is ignored in favour of the published content.
    }
  }

  /* ---------- serialisation ---------- */

  function formatValue(value, indent, key) {
    const pad = " ".repeat(indent);

    if (key === "body" && typeof value === "string") {
      const escaped = value
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$\{/g, "\\${");
      return "`" + escaped + "`";
    }
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value === null || value === undefined) return "null";

    if (Array.isArray(value)) {
      if (!value.length) return "[]";
      const flat = value.every(function (entry) {
        return entry === null || typeof entry !== "object";
      });
      if (flat) {
        const inline =
          "[" +
          value
            .map(function (entry) {
              return formatValue(entry, 0);
            })
            .join(", ") +
          "]";
        if (indent + inline.length <= 118) return inline;
      }
      return (
        "[\n" +
        value
          .map(function (entry) {
            return " ".repeat(indent + 2) + formatValue(entry, indent + 2);
          })
          .join(",\n") +
        "\n" +
        pad +
        "]"
      );
    }

    const keys = Object.keys(value);
    if (!keys.length) return "{}";
    const nested = keys.some(function (name) {
      return name === "body" || (value[name] && typeof value[name] === "object");
    });
    if (!nested) {
      const inline =
        "{ " +
        keys
          .map(function (name) {
            return name + ": " + formatValue(value[name], 0, name);
          })
          .join(", ") +
        " }";
      if (indent + inline.length <= 118) return inline;
    }
    return (
      "{\n" +
      keys
        .map(function (name) {
          return " ".repeat(indent + 2) + name + ": " + formatValue(value[name], indent + 2, name);
        })
        .join(",\n") +
      "\n" +
      pad +
      "}"
    );
  }

  function orderFields(item) {
    const ordered = {};
    FIELD_ORDER.forEach(function (name) {
      if (item[name] !== undefined) ordered[name] = item[name];
    });
    Object.keys(item).forEach(function (name) {
      if (ordered[name] === undefined) ordered[name] = item[name];
    });
    return ordered;
  }

  function buildSource() {
    const output = {
      site: db.site,
      elements: db.elements,
      items: db.items.map(orderFields)
    };
    return "window.DATABANK = " + formatValue(output, 0) + ";\n";
  }

  /* ---------- item list ---------- */

  function renderTabs() {
    const buttons = ['<button type="button" data-element="" aria-pressed="' + (filterElement === "") + '">全部</button>'];
    db.elements.forEach(function (element) {
      buttons.push(
        '<button type="button" data-element="' +
          escapeHtml(element.id) +
          '" aria-pressed="' +
          (filterElement === element.id) +
          '">' +
          escapeHtml(element.zh) +
          "</button>"
      );
    });
    dom["element-tabs"].innerHTML = buttons.join("");
  }

  function renderList() {
    const needle = searchText.trim().toLowerCase();
    const rows = [];

    db.items.forEach(function (item, index) {
      if (filterElement && item.element !== filterElement) return;
      if (needle) {
        const haystack = [item.title, item.subtitle, item.topic, item.form, (item.tags || []).join(" ")]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (haystack.indexOf(needle) === -1) return;
      }
      const element = elementById(item.element);
      rows.push(
        [
          '<button type="button" data-index="' + index + '" aria-current="' + (item === selected) + '">',
          "  <strong>" + escapeHtml(item.title || "（未命名）") + "</strong>",
          '  <span><i class="dot" style="--dot:' + escapeHtml(element ? element.accent : "#888888") + '"></i>',
          escapeHtml(
            (element ? element.zh : "？") +
              " · " +
              (TYPE_LABELS[item.type] || item.type || "") +
              (item.form ? " · " + item.form : "")
          ),
          "</span>",
          "</button>"
        ].join("")
      );
    });

    dom["admin-items"].innerHTML = rows.length ? rows.join("") : "<p>沒有符合的內容。</p>";
  }

  function renderDatalists() {
    const collect = function (key) {
      const seen = [];
      db.items.forEach(function (item) {
        if (item[key] && seen.indexOf(item[key]) === -1) seen.push(item[key]);
      });
      return seen.sort();
    };
    const fill = function (node, values) {
      node.innerHTML = values
        .map(function (value) {
          return '<option value="' + escapeHtml(value) + '"></option>';
        })
        .join("");
    };
    fill(dom["form-list"], collect("form"));
    fill(dom["topic-list"], collect("topic"));
    fill(dom["level-list"], collect("level"));
  }

  /* ---------- form ---------- */

  function fillElementSelect() {
    dom["f-element"].innerHTML = db.elements
      .map(function (element) {
        return (
          '<option value="' +
          escapeHtml(element.id) +
          '">' +
          escapeHtml(element.zh + " " + element.en + " · " + element.role) +
          "</option>"
        );
      })
      .join("");
  }

  function selectItem(item) {
    selected = item || null;
    if (!selected) {
      dom["admin-form"].hidden = true;
      dom["admin-empty"].hidden = false;
      renderList();
      return;
    }

    dom["admin-empty"].hidden = true;
    dom["admin-form"].hidden = false;

    dom["f-element"].value = selected.element || db.elements[0].id;
    dom["f-type"].value = selected.type || "article";
    dom["f-title"].value = selected.title || "";
    dom["f-subtitle"].value = selected.subtitle || "";
    dom["f-date"].value = selected.date || "";
    dom["f-featured"].checked = Boolean(selected.featured);
    dom["f-id"].value = selected.id || "";
    dom["f-form"].value = selected.form || "";
    dom["f-topic"].value = selected.topic || "";
    dom["f-subject"].value = selected.subject || "";
    dom["f-level"].value = selected.level || "";
    dom["f-tla"].value = selected.tla || "";
    dom["f-duration"].value = selected.duration || "";
    dom["f-tags"].value = (selected.tags || []).join(" ");
    dom["f-cover"].value = selected.cover || "";
    dom["f-video-provider"].value = selected.video ? selected.video.provider : "";
    dom["f-video-value"].value = selected.video ? selected.video.src || selected.video.id || "" : "";
    dom["f-image-layout"].value = selected.imageLayout || "";
    dom["f-tool"].value = selected.tool || "";
    dom["f-body"].value = selected.body || "";

    imageRows = (selected.images || []).map(function (image) {
      return { src: image.src || "", alt: image.alt || "" };
    });

    renderImageRows();
    syncTypeBlocks();
    renderTagPreview();
    renderHeading();
    renderPreview();
    renderErrors(validate(readForm()));
    renderList();
  }

  function renderErrors(problems) {
    dom["form-errors"].hidden = !problems.length;
    dom["form-errors"].innerHTML = problems.length
      ? "<ul>" +
        problems
          .map(function (text) {
            return "<li>" + escapeHtml(text) + "</li>";
          })
          .join("") +
        "</ul>"
      : "";
  }

  function renderHeading() {
    dom["form-title"].textContent = dom["f-title"].value.trim() || "（未命名）";
    dom["form-kicker"].textContent = "編輯內容 · " + (TYPE_LABELS[dom["f-type"].value] || dom["f-type"].value);
  }

  function parseTags(value) {
    return value
      .split(/[\s,，、]+/)
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean)
      .map(function (tag) {
        return tag.charAt(0) === "#" ? tag : "#" + tag;
      });
  }

  function readForm() {
    const item = {
      id: dom["f-id"].value.trim(),
      element: dom["f-element"].value,
      type: dom["f-type"].value,
      title: dom["f-title"].value.trim()
    };

    const optional = {
      subtitle: dom["f-subtitle"].value.trim(),
      cover: dom["f-cover"].value.trim(),
      subject: dom["f-subject"].value.trim(),
      form: dom["f-form"].value.trim(),
      topic: dom["f-topic"].value.trim(),
      level: dom["f-level"].value.trim(),
      tla: dom["f-tla"].value.trim(),
      duration: dom["f-duration"].value.trim(),
      date: dom["f-date"].value.trim(),
      body: dom["f-body"].value
    };
    Object.keys(optional).forEach(function (key) {
      if (optional[key]) item[key] = optional[key];
    });

    const tags = parseTags(dom["f-tags"].value);
    if (tags.length) item.tags = tags;
    if (dom["f-featured"].checked) item.featured = true;

    const provider = dom["f-video-provider"].value;
    const videoValue = dom["f-video-value"].value.trim();
    if (provider && videoValue) {
      item.video =
        provider === "local" ? { provider: "local", src: videoValue } : { provider: provider, id: videoValue };
    }

    const images = imageRows.filter(function (row) {
      return row.src.trim();
    });
    if (images.length) {
      item.images = images.map(function (row) {
        return { src: row.src.trim(), alt: row.alt.trim() };
      });
      if (dom["f-image-layout"].value) item.imageLayout = dom["f-image-layout"].value;
    }

    const tool = dom["f-tool"].value.trim();
    if (tool) item.tool = tool;

    return orderFields(item);
  }

  function validate(item) {
    const problems = [];
    if (!item.title) problems.push("請填寫標題。");
    if (!item.id) problems.push("請填寫網址代號 ID。");
    else if (!/^[a-z0-9][a-z0-9-]*$/.test(item.id)) problems.push("網址代號 ID 只可以用小寫英文字母、數字和「-」。");
    if (!item.cover) problems.push("請填寫封面圖路徑，否則卡片會顯示空白。");
    if (item.type === "video" && !item.video) problems.push("類型是影片，請選擇影片來源並填上路徑或 ID。");
    if (item.type === "image" && !item.images) problems.push("類型是圖片，請至少加入一張圖片。");
    if (item.type === "tool" && !item.tool) problems.push("類型是互動工具，請填上工具網頁路徑。");

    const duplicate = db.items.some(function (other) {
      return other !== selected && other.id && other.id === item.id;
    });
    if (duplicate) problems.push("網址代號 ID 已經有其他內容使用，請改一個。");
    return problems;
  }

  function commitForm() {
    if (!selected) return;

    const next = readForm();
    renderErrors(validate(next));

    // The draft always stores what was typed, even while it is still incomplete.
    Object.keys(selected).forEach(function (key) {
      delete selected[key];
    });
    Object.assign(selected, next);

    saveDraft();
    renderHeading();
    renderList();
    renderDatalists();
    renderTagPreview();
    renderPreview();
  }

  function syncTypeBlocks() {
    const type = dom["f-type"].value;
    const showAll = dom["show-all-media"].checked;
    const hasData = {
      video: Boolean(dom["f-video-provider"].value),
      image: imageRows.length > 0,
      tool: Boolean(dom["f-tool"].value)
    };
    document.querySelectorAll(".type-block").forEach(function (block) {
      const target = block.dataset.for;
      block.hidden = !(showAll || target === type || hasData[target]);
    });

    const provider = dom["f-video-provider"].value;
    dom["f-video-value-label"].textContent = provider === "local" ? "影片檔路徑" : "影片 ID";
    dom["f-video-value"].placeholder =
      provider === "local" ? "media/metal/my-video.mp4" : provider === "vimeo" ? "123456789" : "dQw4w9WgXcQ";
  }

  function renderImageRows() {
    if (!imageRows.length) {
      dom["image-rows"].innerHTML = '<p class="repeater-empty">未加入圖片。</p>';
      return;
    }
    dom["image-rows"].innerHTML = imageRows
      .map(function (row, index) {
        return [
          '<div class="repeater-row">',
          '  <input type="text" data-image-field="src" data-index="' +
            index +
            '" value="' +
            escapeHtml(row.src) +
            '" placeholder="media/metal/page-1.jpg">',
          '  <input type="text" data-image-field="alt" data-index="' +
            index +
            '" value="' +
            escapeHtml(row.alt) +
            '" placeholder="圖片說明">',
          '  <button type="button" data-remove-image="' + index + '">移除</button>',
          "</div>"
        ].join("");
      })
      .join("");
  }

  function renderTagPreview() {
    dom["tag-preview"].innerHTML = parseTags(dom["f-tags"].value)
      .map(function (tag) {
        return "<span>" + escapeHtml(tag) + "</span>";
      })
      .join("");
  }

  function renderPreview() {
    const element = elementById(dom["f-element"].value);
    const cover = dom["f-cover"].value.trim();
    const meta = [dom["f-form"].value.trim(), dom["f-topic"].value.trim()].filter(Boolean).join(" · ");

    dom["preview-card"].innerHTML = [
      '<div class="preview-cover">' + (cover ? "" : "尚未設定封面圖") + "</div>",
      '<div class="preview-body">',
      '  <p class="preview-kicker">' + escapeHtml(element ? element.zh + " · " + element.en : "") + "</p>",
      "  <h3>" + escapeHtml(dom["f-title"].value.trim() || "（未命名）") + "</h3>",
      "  <p>" + escapeHtml(dom["f-subtitle"].value.trim()) + "</p>",
      '  <div class="preview-foot">',
      "    <span>" + escapeHtml(meta || TYPE_LABELS[dom["f-type"].value] || "") + "</span>",
      "    <span>" + escapeHtml(dom["f-date"].value) + "</span>",
      "  </div>",
      "</div>"
    ].join("");

    if (!cover) return;
    const holder = dom["preview-card"].querySelector(".preview-cover");
    const image = new Image();
    image.alt = "";
    image.addEventListener("error", function () {
      // A slow reply from a path the user has since edited must not overwrite the current preview.
      if (holder.isConnected) holder.textContent = "找不到封面圖，請檢查路徑";
    });
    image.src = cover;
    holder.appendChild(image);
  }

  /* ---------- actions ---------- */

  function slugify(title, elementId) {
    const slug = String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (slug.length >= 3) return slug.slice(0, 70).replace(/-+$/, "");
    return elementId + "-" + Date.now().toString(36);
  }

  function createItem() {
    const elementId = filterElement || db.elements[0].id;
    const item = orderFields({
      id: elementId + "-" + Date.now().toString(36),
      element: elementId,
      type: "video",
      title: "未命名內容",
      cover: "",
      date: new Date().toISOString().slice(0, 10)
    });
    db.items.push(item);
    saveDraft();
    selectItem(item);
    dom["f-title"].focus();
    dom["f-title"].select();
  }

  function duplicateItem() {
    if (!selected) return;
    const copy = orderFields(clone(selected));
    copy.id = slugify(selected.id + "-copy", selected.element);
    copy.title = selected.title + "（副本）";
    delete copy.featured;
    db.items.splice(db.items.indexOf(selected) + 1, 0, copy);
    saveDraft();
    selectItem(copy);
  }

  function deleteItem() {
    if (!selected) return;
    const label = selected.title || "這項內容";
    if (!window.confirm("確定要刪除「" + label + "」嗎？\n刪除後仍要按「完成，準備發佈」才會在網站上生效。")) return;
    db.items.splice(db.items.indexOf(selected), 1);
    saveDraft();
    selectItem(null);
    renderDatalists();
  }

  function discardDraft() {
    if (!window.confirm("捨棄草稿後會回到網站上現有的內容，未發佈的修改會消失。要繼續嗎？")) return;
    clearDraft();
    db = clone(window.DATABANK);
    dirty = false;
    dom["draft-banner"].hidden = true;
    dom["draft-state"].textContent = "草稿：尚未修改";
    dom["draft-state"].classList.remove("is-dirty");
    selectItem(null);
    renderTabs();
    renderDatalists();
  }

  function openPublish() {
    dom["publish-source"].value = buildSource();
    dom["github-link"].href = EDIT_URL;
    dom["site-link"].href = SITE_URL;
    dom["gh-token"].value = readToken();
    dom["publish-status"].hidden = true;
    dom["publish-overlay"].hidden = false;
    (dom["gh-token"].value ? dom["publish-direct-btn"] : dom["gh-token"]).focus();
  }

  /* ---------- one-click publishing ---------- */

  function readToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function status(message, kind) {
    dom["publish-status"].hidden = false;
    dom["publish-status"].textContent = message;
    dom["publish-status"].className = "publish-status" + (kind ? " is-" + kind : "");
  }

  function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function decodeBase64(value) {
    const binary = atob(String(value).replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") {
      const out = {};
      Object.keys(value)
        .sort()
        .forEach(function (key) {
          out[key] = canonical(value[key]);
        });
      return out;
    }
    return value;
  }

  function matchesLoadedVersion(remoteText) {
    try {
      const shim = {};
      new Function("window", remoteText)(shim);
      return JSON.stringify(canonical(shim.DATABANK)) === JSON.stringify(canonical(window.DATABANK));
    } catch (_) {
      // An unreadable remote file is treated as a match so the publish is not blocked.
      return true;
    }
  }

  async function githubFetch(url, options) {
    const settings = options || {};
    const response = await fetch(url, {
      method: settings.method || "GET",
      headers: {
        Authorization: "Bearer " + dom["gh-token"].value.trim(),
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: settings.body
    });
    if (response.ok) return response.json();

    const detail = await response.json().catch(function () {
      return {};
    });
    const error = new Error(detail.message || response.statusText);
    error.status = response.status;
    throw error;
  }

  function describeError(error) {
    if (error.status === 401) return "權杖無效或已過期，請重新產生一個。";
    if (error.status === 403) return "權杖沒有寫入權限，請確認 Contents 設為 Read and write。";
    if (error.status === 404) return "找不到檔案或沒有這個 repository 的權限，請確認權杖已授權 " + REPO + "。";
    if (error.status === 409 || error.status === 422) return "GitHub 上的檔案剛剛被更新，請再按一次發佈。";
    if (error.status) return "GitHub 回覆錯誤（" + error.status + "）：" + error.message;
    return "無法連線到 GitHub，請檢查網絡後再試。";
  }

  async function publishDirect() {
    const token = dom["gh-token"].value.trim();
    if (!token) {
      status("請先貼上 GitHub 存取權杖。", "error");
      dom["gh-token"].focus();
      return;
    }

    const apiUrl =
      "https://api.github.com/repos/" + REPO + "/contents/" + CONTENT_PATH + "?ref=" + BRANCH;
    dom["publish-direct-btn"].disabled = true;

    try {
      status("正在讀取 GitHub 上的現有內容…");
      const current = await githubFetch(apiUrl);

      if (!matchesLoadedVersion(decodeBase64(current.content))) {
        const proceed = window.confirm(
          "GitHub 上的內容跟你開啟編輯器時不一樣，可能有其他人已經發佈了新內容。\n" +
            "繼續發佈會覆蓋他們的修改。要繼續嗎？"
        );
        if (!proceed) {
          status("已取消發佈。請重新載入編輯器，取得最新內容後再修改。", "error");
          return;
        }
      }

      status("正在發佈到 GitHub…");
      const note = dom["commit-message"].value.trim();
      await githubFetch("https://api.github.com/repos/" + REPO + "/contents/" + CONTENT_PATH, {
        method: "PUT",
        body: JSON.stringify({
          message: note ? "Update content: " + note : "Update content via editor",
          content: encodeBase64(buildSource()),
          sha: current.sha,
          branch: BRANCH
        })
      });

      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch (_) {
        // Publishing already succeeded; only remembering the token failed.
      }
      dirty = false;
      dom["commit-message"].value = "";
      dom["draft-state"].textContent = "已發佈到 GitHub";
      dom["draft-state"].classList.remove("is-dirty");
      dom["draft-banner"].hidden = true;
      status("發佈成功！GitHub Pages 會在一至兩分鐘後更新，之後重新整理網站即可看到。", "ok");
    } catch (error) {
      status(describeError(error), "error");
    } finally {
      dom["publish-direct-btn"].disabled = false;
    }
  }

  function forgetToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (_) {
      // Nothing to clean up when storage is unavailable.
    }
    dom["gh-token"].value = "";
    status("已清除這部電腦記住的權杖。", "ok");
    dom["gh-token"].focus();
  }

  function downloadSource() {
    const blob = new Blob([buildSource()], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "content.js";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function copySource() {
    const confirmCopy = function () {
      dom["copy-source"].textContent = "已複製 ✓";
      window.setTimeout(function () {
        dom["copy-source"].textContent = "複製全部內容";
      }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(dom["publish-source"].value).then(confirmCopy, function () {
        dom["publish-source"].select();
      });
      return;
    }
    dom["publish-source"].select();
    document.execCommand("copy");
    confirmCopy();
  }

  /* ---------- wiring ---------- */

  function init() {
    loadDraft();
    fillElementSelect();
    renderTabs();
    renderList();
    renderDatalists();
    dom["upload-link"].href = UPLOAD_URL;

    dom["element-tabs"].addEventListener("click", function (event) {
      const button = event.target.closest("button[data-element]");
      if (!button) return;
      filterElement = button.dataset.element;
      renderTabs();
      renderList();
    });

    dom["list-search"].addEventListener("input", function (event) {
      searchText = event.target.value;
      renderList();
    });

    dom["admin-items"].addEventListener("click", function (event) {
      const button = event.target.closest("button[data-index]");
      if (button) selectItem(db.items[Number(button.dataset.index)]);
    });

    dom["admin-form"].addEventListener("input", function (event) {
      const field = event.target.dataset.imageField;
      if (field) imageRows[Number(event.target.dataset.index)][field] = event.target.value;
      commitForm();
    });

    dom["admin-form"].addEventListener("change", function (event) {
      if (event.target === dom["f-type"] || event.target === dom["f-video-provider"]) syncTypeBlocks();
      commitForm();
    });

    dom["admin-form"].addEventListener("submit", function (event) {
      event.preventDefault();
    });

    dom["show-all-media"].addEventListener("change", syncTypeBlocks);

    dom["image-rows"].addEventListener("click", function (event) {
      const button = event.target.closest("button[data-remove-image]");
      if (!button) return;
      imageRows.splice(Number(button.dataset.removeImage), 1);
      renderImageRows();
      commitForm();
    });

    dom["add-image"].addEventListener("click", function () {
      imageRows.push({ src: "", alt: "" });
      renderImageRows();
      syncTypeBlocks();
      const inputs = dom["image-rows"].querySelectorAll('input[data-image-field="src"]');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });

    dom["regen-id"].addEventListener("click", function () {
      dom["f-id"].value = slugify(dom["f-title"].value, dom["f-element"].value);
      commitForm();
    });

    dom["new-item"].addEventListener("click", createItem);
    dom["duplicate-item"].addEventListener("click", duplicateItem);
    dom["delete-item"].addEventListener("click", deleteItem);
    dom["discard-draft"].addEventListener("click", discardDraft);
    dom["open-publish"].addEventListener("click", openPublish);
    dom["copy-source"].addEventListener("click", copySource);
    dom["download-source"].addEventListener("click", downloadSource);
    dom["publish-direct-btn"].addEventListener("click", publishDirect);
    dom["forget-token"].addEventListener("click", forgetToken);

    dom["close-publish"].addEventListener("click", function () {
      dom["publish-overlay"].hidden = true;
    });

    dom["publish-overlay"].addEventListener("click", function (event) {
      if (event.target === dom["publish-overlay"]) dom["publish-overlay"].hidden = true;
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") dom["publish-overlay"].hidden = true;
    });

    window.addEventListener("beforeunload", function (event) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  // Exposed so the serialiser can be exercised without the editor UI.
  window.WuxingAdmin = { buildSource: buildSource };

  if (dom["admin-form"]) init();
})();
