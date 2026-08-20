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
  const MAX_UPLOAD = 100 * 1024 * 1024;
  const WARN_UPLOAD = 40 * 1024 * 1024;
  const DEPLOY_TIMEOUT = 5 * 60 * 1000;
  const DEPLOY_POLL_INTERVAL = 5000;

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
    "pending-uploads",
    "pending-summary",
    "file-picker",
    "gh-token",
    "forget-token",
    "commit-message",
    "publish-direct-btn",
    "publish-status",
    "publish-validation",
    "publish-review",
    "site-link",
    "remember-token",
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
    "level-list",
    "list-subject",
    "manage-subjects",
    "subject-overlay",
    "subject-rows",
    "add-subject",
    "close-subjects",
    "done-subjects"
  ].forEach(function (id) {
    dom[id] = document.getElementById(id);
  });

  const escapeHtml = window.WuxingMarkdown.escape;

  let db = normalise(window.DATABANK);
  let selected = null;
  let filterElement = "";
  let filterSubject = "";
  let searchText = "";
  let dirty = false;
  let imageRows = [];
  let pickTarget = null;

  // Files chosen from the computer, keyed by their target path, uploaded when publishing.
  const pending = {};

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // Drafts saved before subjects existed still have to open without breaking.
  function normalise(source) {
    const next = clone(source);
    if (!Array.isArray(next.subjects)) next.subjects = [];
    if (!Array.isArray(next.items)) next.items = [];
    return next;
  }

  function elementById(id) {
    return db.elements.find(function (element) {
      return element.id === id;
    });
  }

  function subjectById(id) {
    return db.subjects.find(function (subject) {
      return subject.id === id;
    });
  }

  function subjectLabel(id) {
    const subject = subjectById(id);
    return subject ? subject.zh + " " + subject.en : "";
  }

  function subjectUsage(id) {
    return db.items.filter(function (item) {
      return item.subject === id;
    }).length;
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
      db = normalise(parsed);
      if (buildSource() === publishedSource) {
        // The live site has caught up with this draft, so there is nothing left to restore.
        db = normalise(window.DATABANK);
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
      subjects: db.subjects,
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
      if (filterSubject && (item.subject || "") !== (filterSubject === "none" ? "" : filterSubject)) return;
      if (needle) {
        const haystack = [
          item.title,
          item.subtitle,
          item.topic,
          item.form,
          subjectLabel(item.subject),
          (item.tags || []).join(" ")
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (haystack.indexOf(needle) === -1) return;
      }
      const element = elementById(item.element);
      const subject = subjectById(item.subject);
      rows.push(
        [
          '<button type="button" data-index="' + index + '" aria-current="' + (item === selected) + '">',
          "  <strong>" + escapeHtml(item.title || "（未命名）") + "</strong>",
          '  <span><i class="dot" style="--dot:' + escapeHtml(element ? element.accent : "#888888") + '"></i>',
          escapeHtml(
            [element ? element.zh : "？", subject ? subject.zh : "", TYPE_LABELS[item.type] || item.type, item.form]
              .filter(Boolean)
              .join(" · ")
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

  function subjectOptionsHtml() {
    return db.subjects
      .map(function (subject) {
        return (
          '<option value="' + escapeHtml(subject.id) + '">' + escapeHtml(subject.zh + " " + subject.en) + "</option>"
        );
      })
      .join("");
  }

  function fillSubjectControls() {
    dom["f-subject"].innerHTML = '<option value="">（未分類）</option>' + subjectOptionsHtml();
    dom["list-subject"].innerHTML =
      '<option value="">全部科目</option>' + subjectOptionsHtml() + '<option value="none">未分類</option>';
    dom["list-subject"].value = filterSubject;
  }

  // Keeps a subject that no longer exists visible instead of silently reassigning the item.
  function setSubjectValue(value) {
    fillSubjectControls();
    if (value && !subjectById(value)) {
      dom["f-subject"].insertAdjacentHTML(
        "beforeend",
        '<option value="' + escapeHtml(value) + '">（未知科目：' + escapeHtml(value) + "）</option>"
      );
    }
    dom["f-subject"].value = value || "";
  }

  /* ---------- subject manager ---------- */

  function subjectSlug(subject) {
    const base = String(subject.en || subject.zh || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const stem = base || "subject";
    let candidate = stem;
    let counter = 2;
    while (subjectById(candidate)) {
      candidate = stem + "-" + counter;
      counter += 1;
    }
    return candidate;
  }

  function renderSubjectRows() {
    if (!db.subjects.length) {
      dom["subject-rows"].innerHTML = '<p class="repeater-empty">還未有科目，按下面「＋ 新增科目」開始。</p>';
      return;
    }
    dom["subject-rows"].innerHTML = db.subjects
      .map(function (subject, index) {
        const used = subjectUsage(subject.id);
        return [
          '<div class="subject-row">',
          '  <input type="text" data-subject-field="zh" data-index="' +
            index +
            '" value="' +
            escapeHtml(subject.zh || "") +
            '" placeholder="中文名，例：初中數學">',
          '  <input type="text" data-subject-field="en" data-index="' +
            index +
            '" value="' +
            escapeHtml(subject.en || "") +
            '" placeholder="English, e.g. Junior Maths">',
          '  <span class="subject-count">' + (used ? used + " 項" : "未有內容") + "</span>",
          '  <button type="button" data-subject-move="up" data-index="' +
            index +
            '" aria-label="上移"' +
            (index === 0 ? " disabled" : "") +
            ">↑</button>",
          '  <button type="button" data-subject-move="down" data-index="' +
            index +
            '" aria-label="下移"' +
            (index === db.subjects.length - 1 ? " disabled" : "") +
            ">↓</button>",
          '  <button type="button" data-subject-remove="' + index + '">刪除</button>',
          "</div>"
        ].join("");
      })
      .join("");
  }

  function afterSubjectChange() {
    const current = selected ? selected.subject || "" : "";
    saveDraft();
    fillSubjectControls();
    setSubjectValue(current);
    renderSubjectRows();
    renderList();
    renderPreview();
  }

  function addSubject() {
    const subject = { id: "", zh: "新科目", en: "New Subject" };
    subject.id = subjectSlug(subject);
    db.subjects.push(subject);
    afterSubjectChange();
    const inputs = dom["subject-rows"].querySelectorAll('input[data-subject-field="zh"]');
    if (inputs.length) {
      inputs[inputs.length - 1].focus();
      inputs[inputs.length - 1].select();
    }
  }

  function removeSubject(index) {
    const subject = db.subjects[index];
    if (!subject) return;
    const used = subjectUsage(subject.id);
    const question = used
      ? "有 " + used + " 項內容使用「" + subject.zh + "」。\n刪除科目後這些內容會變成「未分類」，內容本身不會被刪走。要繼續嗎？"
      : "確定要刪除科目「" + subject.zh + "」嗎？";
    if (!window.confirm(question)) return;

    db.items.forEach(function (item) {
      if (item.subject === subject.id) delete item.subject;
    });
    db.subjects.splice(index, 1);
    if (filterSubject === subject.id) filterSubject = "";
    afterSubjectChange();
  }

  function moveSubject(index, direction) {
    const target = index + (direction === "up" ? -1 : 1);
    if (target < 0 || target >= db.subjects.length) return;
    const moved = db.subjects.splice(index, 1)[0];
    db.subjects.splice(target, 0, moved);
    afterSubjectChange();
  }

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
    setSubjectValue(selected.subject);
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
    renderErrors(validate(readForm(), selected));
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
      subject: dom["f-subject"].value,
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

  function validate(item, currentItem) {
    const problems = [];
    if (!item.title) problems.push("請填寫標題。");
    if (!item.id) problems.push("請填寫網址代號 ID。");
    else if (!/^[a-z0-9][a-z0-9-]*$/.test(item.id)) problems.push("網址代號 ID 只可以用小寫英文字母、數字和「-」。");
    if (!elementById(item.element)) problems.push("請選擇有效的五行分類。");
    if (!TYPE_LABELS[item.type]) problems.push("請選擇有效的內容類型。");
    if (!item.cover) problems.push("請填寫封面圖路徑，否則卡片會顯示空白。");
    if (item.type === "video" && !item.video) problems.push("類型是影片，請選擇影片來源並填上路徑或 ID。");
    if (item.type === "image" && !item.images) problems.push("類型是圖片，請至少加入一張圖片。");
    if (item.type === "tool" && !item.tool) problems.push("類型是互動工具，請填上工具網頁路徑。");
    if (item.subject && !subjectById(item.subject)) {
      problems.push("科目「" + item.subject + "」已經不存在，請在科目選單重新選擇。");
    }

    const duplicate = db.items.some(function (other) {
      return other !== (currentItem || item) && other.id && other.id === item.id;
    });
    if (duplicate) problems.push("網址代號 ID 已經有其他內容使用，請改一個。");
    return problems;
  }

  function validateAll() {
    const results = [];
    const subjectIds = {};

    db.subjects.forEach(function (subject, index) {
      const problems = [];
      if (!subject.id || !/^[a-z0-9][a-z0-9-]*$/.test(subject.id)) problems.push("科目 ID 格式無效。");
      if (!String(subject.zh || "").trim()) problems.push("請填寫科目中文名。");
      if (!String(subject.en || "").trim()) problems.push("請填寫科目英文名。");
      if (subject.id && subjectIds[subject.id]) problems.push("科目 ID 重複。");
      subjectIds[subject.id] = true;
      if (problems.length) {
        results.push({ label: "科目 " + (subject.zh || subject.en || index + 1), problems: problems });
      }
    });

    db.items.forEach(function (item, index) {
      const problems = validate(item, item);
      if (problems.length) {
        results.push({ label: item.title || "未命名內容 " + (index + 1), problems: problems });
      }
    });
    return results;
  }

  function renderPublishValidation(results) {
    dom["publish-validation"].hidden = !results.length;
    dom["publish-validation"].innerHTML = results.length
      ? "<strong>發佈前請先修正 " +
        results.length +
        " 項問題：</strong><ul>" +
        results
          .map(function (result) {
            return "<li><strong>" + escapeHtml(result.label) + "：</strong>" + escapeHtml(result.problems.join("、")) + "</li>";
          })
          .join("") +
        "</ul>"
      : "";
  }

  function commitForm() {
    if (!selected) return;

    const next = readForm();
    renderErrors(validate(next, selected));

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
          '  <button type="button" data-pick="image" data-accept="image/*" data-index="' + index + '">從電腦選擇</button>',
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
    const subject = subjectById(dom["f-subject"].value);
    const cover = dom["f-cover"].value.trim();
    const meta = [dom["f-form"].value.trim(), dom["f-topic"].value.trim()].filter(Boolean).join(" · ");
    const kicker = [element ? element.zh + " · " + element.en : "", subject ? subject.zh : ""]
      .filter(Boolean)
      .join(" · ");

    dom["preview-card"].innerHTML = [
      '<div class="preview-cover">' + (cover ? "" : "尚未設定封面圖") + "</div>",
      '<div class="preview-body">',
      '  <p class="preview-kicker">' + escapeHtml(kicker) + "</p>",
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
    image.src = localUrl(cover);
    holder.appendChild(image);
  }

  /* ---------- picking files from the computer ---------- */

  function formatSize(bytes) {
    return bytes >= 1024 * 1024
      ? (bytes / 1024 / 1024).toFixed(1) + " MB"
      : Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function safeFileName(name) {
    const dot = name.lastIndexOf(".");
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot).toLowerCase() : "";
    const cleaned = stem
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return (cleaned || "file-" + Date.now().toString(36)) + extension;
  }

  function pathInUse(path) {
    return db.items.some(function (item) {
      if (item === selected) return false;
      if (item.cover === path || item.tool === path) return true;
      if (item.video && item.video.src === path) return true;
      return (item.images || []).some(function (image) {
        return image.src === path;
      });
    });
  }

  function targetPath(fileName) {
    const folder = "media/" + dom["f-element"].value + "/";
    const name = safeFileName(fileName);
    let candidate = folder + name;
    let counter = 2;
    while (pathInUse(candidate)) {
      const dot = name.lastIndexOf(".");
      candidate =
        folder + (dot > 0 ? name.slice(0, dot) + "-" + counter + name.slice(dot) : name + "-" + counter);
      counter += 1;
    }
    return candidate;
  }

  function acceptFile(file) {
    if (file.size > MAX_UPLOAD) {
      window.alert(
        "「" + file.name + "」有 " + formatSize(file.size) + "，超過 GitHub 的 100 MB 上限。\n" +
          "長片請上載到 Vimeo 或 YouTube，然後在「影片來源」選 Vimeo／YouTube 並填影片 ID。"
      );
      return false;
    }
    if (file.size > WARN_UPLOAD) {
      return window.confirm(
        "「" + file.name + "」有 " + formatSize(file.size) + "，會令 repository 永久變大，網頁載入亦會較慢。\n" +
          "建議先壓縮，或改用 Vimeo／YouTube。仍要加入嗎？"
      );
    }
    return true;
  }

  function queueUpload(file, apply) {
    if (!acceptFile(file)) return;
    const path = targetPath(file.name);
    if (pending[path]) URL.revokeObjectURL(pending[path].url);
    pending[path] = { file: file, url: URL.createObjectURL(file) };
    apply(path);
    renderPending();
    commitForm();
  }

  function renderPending() {
    const paths = Object.keys(pending);
    dom["pending-uploads"].hidden = !paths.length;
    if (!paths.length) return;
    dom["pending-uploads"].innerHTML =
      "<strong>發佈時會自動上載 " + paths.length + " 個檔案：</strong>" +
      paths
        .map(function (path) {
          return (
            '<span class="pending-file">' +
            escapeHtml(path) +
            "（" +
            formatSize(pending[path].file.size) +
            '）<button type="button" data-cancel-upload="' + escapeHtml(path) + '">取消</button></span>'
          );
        })
        .join("");
  }

  function clearPending() {
    Object.keys(pending).forEach(function (path) {
      URL.revokeObjectURL(pending[path].url);
      delete pending[path];
    });
    renderPending();
  }

  function localUrl(path) {
    return pending[path] ? pending[path].url : path;
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const result = String(reader.result);
        resolve(result.slice(result.indexOf(",") + 1));
      };
      reader.onerror = function () {
        reject(new Error("無法讀取「" + file.name + "」"));
      };
      reader.readAsDataURL(file);
    });
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
    clearPending();
    db = normalise(window.DATABANK);
    dirty = false;
    dom["draft-banner"].hidden = true;
    dom["draft-state"].textContent = "草稿：尚未修改";
    dom["draft-state"].classList.remove("is-dirty");
    filterSubject = "";
    selectItem(null);
    renderTabs();
    fillSubjectControls();
    renderDatalists();
  }

  function openPublish() {
    const validation = validateAll();
    const uploadCount = Object.keys(pending).length;
    const selectedLabel = selected
      ? "目前內容：「" + (selected.title || "未命名") + "」· " + (subjectLabel(selected.subject) || "未分類")
      : "目前沒有選取個別內容；將發佈整份資料庫的修改。";
    dom["publish-source"].value = buildSource();
    dom["github-link"].href = EDIT_URL;
    dom["site-link"].href = SITE_URL;
    dom["site-link"].textContent = selected ? "預覽目前內容 ↗" : "開啟網站 ↗";
    if (selected) dom["site-link"].href = publicItemUrl(selected);
    dom["gh-token"].value = readToken();
    dom["remember-token"].checked = Boolean(dom["gh-token"].value);
    dom["publish-status"].hidden = true;
    dom["publish-review"].innerHTML =
      "<strong>最後確認</strong><span>" +
      escapeHtml(selectedLabel) +
      "</span><span>內容資料" +
      (uploadCount ? "及 " + uploadCount + " 個媒體檔案" : "") +
      "會合併成一個 GitHub commit，避免觸發多次網站部署。</span>" +
      (dirty ? "" : "<span>目前沒有未發佈的修改。</span>");
    renderPublishValidation(validation);
    dom["publish-direct-btn"].disabled = validation.length > 0 || !dirty;

    const waiting = Object.keys(pending);
    dom["pending-summary"].hidden = !waiting.length;
    dom["pending-summary"].textContent = waiting.length
      ? "一併上載 " + waiting.length + " 個檔案：" + waiting.join("、") +
        "（方法二不會上載檔案，需要自己在 GitHub 上傳）"
      : "";

    dom["publish-overlay"].hidden = false;
    (validation.length ? dom["publish-validation"] : dom["gh-token"].value ? dom["publish-direct-btn"] : dom["gh-token"]).focus();
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
      if (!shim.DATABANK) return null;
      return JSON.stringify(canonical(shim.DATABANK)) === JSON.stringify(canonical(window.DATABANK));
    } catch (_) {
      return null;
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
    if (error.status === 409 || error.status === 422) {
      return "GitHub 上的內容剛剛被其他人更新。請重新載入編輯器並核對最新內容，不要直接重試覆蓋。";
    }
    if (error.status) return "GitHub 回覆錯誤（" + error.status + "）：" + error.message;
    return "無法連線到 GitHub，請檢查網絡後再試。";
  }

  function contentsUrl(path) {
    return "https://api.github.com/repos/" + REPO + "/contents/" + path;
  }

  function gitUrl(path) {
    return "https://api.github.com/repos/" + REPO + "/git/" + path;
  }

  function publicItemUrl(item, cacheKey) {
    const version = cacheKey ? "?v=" + encodeURIComponent(cacheKey) : "";
    if (!item || !item.element || !item.id) return SITE_URL + version;
    return SITE_URL + version + "#/" + encodeURIComponent(item.element) + "/" + encodeURIComponent(item.id);
  }

  function sleep(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  async function createBlob(content) {
    return githubFetch(gitUrl("blobs"), {
      method: "POST",
      body: JSON.stringify({ content: content, encoding: "base64" })
    });
  }

  async function createAtomicCommit(headSha, note, publishedSource) {
    const paths = Object.keys(pending);
    const headCommit = await githubFetch(gitUrl("commits/" + headSha));
    const entries = [];

    for (let i = 0; i < paths.length; i += 1) {
      const path = paths[i];
      const file = pending[path].file;
      status("正在準備檔案 " + (i + 1) + "／" + paths.length + "：" + file.name + "（" + formatSize(file.size) + "）…");
      const blob = await createBlob(await fileToBase64(file));
      entries.push({ path: path, mode: "100644", type: "blob", sha: blob.sha });
    }

    status("正在把內容和媒體合併成一個 commit…");
    const contentBlob = await createBlob(encodeBase64(publishedSource));
    entries.push({ path: CONTENT_PATH, mode: "100644", type: "blob", sha: contentBlob.sha });

    const tree = await githubFetch(gitUrl("trees"), {
      method: "POST",
      body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: entries })
    });
    const commit = await githubFetch(gitUrl("commits"), {
      method: "POST",
      body: JSON.stringify({
        message: "Update content: " + note,
        tree: tree.sha,
        parents: [headSha]
      })
    });
    await githubFetch(gitUrl("refs/heads/" + BRANCH), {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false })
    });
    return commit.sha;
  }

  async function waitForDeployment(commitSha, publishedSource) {
    const started = Date.now();
    let attempt = 0;

    while (Date.now() - started < DEPLOY_TIMEOUT) {
      attempt += 1;
      status(
        "GitHub 已接受單一 commit。正在確認公開網站部署完成" +
          (attempt > 1 ? "（已等候約 " + Math.round((Date.now() - started) / 1000) + " 秒）" : "") +
          "…"
      );
      try {
        const response = await fetch(
          SITE_URL + "data/content.js?deploy=" + encodeURIComponent(commitSha) + "&check=" + Date.now(),
          { cache: "no-store" }
        );
        if (response.ok && (await response.text()).trim() === publishedSource.trim()) return true;
      } catch (_) {
        // A temporary Pages or network error is expected while deployment is in progress.
      }
      await sleep(DEPLOY_POLL_INTERVAL);
    }
    return false;
  }

  async function publishDirect() {
    const validation = validateAll();
    renderPublishValidation(validation);
    if (validation.length) {
      status("發佈已暫停：請先修正上面列出的內容問題。", "error");
      return;
    }

    const token = dom["gh-token"].value.trim();
    if (!token) {
      status("請先貼上 GitHub 存取權杖。", "error");
      dom["gh-token"].focus();
      return;
    }
    const note = dom["commit-message"].value.trim();
    if (!note) {
      status("請填寫這次更新的說明，方便其他導師在 GitHub 記錄中辨認改動。", "error");
      dom["commit-message"].focus();
      return;
    }

    dom["publish-direct-btn"].disabled = true;

    const uploaded = Object.keys(pending).length;
    const publishedItem = selected ? clone(selected) : null;
    const publishedSource = buildSource();
    let commitCreated = false;

    try {
      status("正在檢查 GitHub 上的最新內容…");
      const branch = await githubFetch(gitUrl("ref/heads/" + BRANCH));
      const headSha = branch.object.sha;
      const current = await githubFetch(contentsUrl(CONTENT_PATH) + "?ref=" + encodeURIComponent(headSha));
      const versionMatch = matchesLoadedVersion(decodeBase64(current.content));

      if (versionMatch === null) {
        status("無法安全讀取 GitHub 上的 content.js，為免覆蓋現有資料，發佈已停止。請聯絡管理員。", "error");
        return;
      }
      if (!versionMatch) {
        status(
          "發佈已停止：其他人已更新 GitHub 內容。請重新載入編輯器，核對最新內容後再修改；系統不會容許覆蓋對方的更新。",
          "error"
        );
        return;
      }

      const confirmed = window.confirm(
        "最後確認發佈：\n\n" +
          (publishedItem ? "內容：「" + (publishedItem.title || "未命名") + "」\n" : "內容：整份資料庫修改\n") +
          "媒體檔案：" +
          uploaded +
          " 個\n" +
          "更新說明：" +
          note +
          "\n\n內容和媒體會合併成一個 commit，然後等待公開網站部署完成。確定繼續嗎？"
      );
      if (!confirmed) {
        status("已取消發佈，草稿和待上載檔案仍然保留。");
        return;
      }

      const commitSha = await createAtomicCommit(headSha, note, publishedSource);
      commitCreated = true;

      try {
        if (dom["remember-token"].checked) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
      } catch (_) {
        // Publishing already succeeded; only the local token preference failed.
      }
      window.DATABANK = clone(db);
      clearDraft();
      clearPending();
      dirty = false;
      dom["commit-message"].value = "";
      dom["draft-state"].textContent = "已發佈到 GitHub";
      dom["draft-state"].classList.remove("is-dirty");
      dom["draft-banner"].hidden = true;
      dom["pending-summary"].hidden = true;
      dom["site-link"].href = publicItemUrl(publishedItem, commitSha.slice(0, 12));
      dom["site-link"].textContent = publishedItem ? "開啟新內容 ↗" : "開啟已更新網站 ↗";

      const deployed = await waitForDeployment(commitSha, publishedSource);
      if (deployed) {
        dom["draft-state"].textContent = "已發佈並部署";
        status(
          (uploaded ? "已上載 " + uploaded + " 個檔案，" : "") +
            "發佈及網站部署完成！可按「" +
            (publishedItem ? "開啟新內容" : "開啟已更新網站") +
            "」查看。",
          "ok"
        );
      } else {
        status(
          "內容已安全發佈到 GitHub，但五分鐘內仍未能確認公開網站更新。請稍後按右邊連結查看，或請管理員檢查 GitHub Pages deployment。",
          "warning"
        );
      }
    } catch (error) {
      status(
        commitCreated
          ? "內容已提交到 GitHub，但檢查網站部署時遇到問題：" + describeError(error)
          : describeError(error),
        commitCreated ? "warning" : "error"
      );
    } finally {
      dom["publish-direct-btn"].disabled = validateAll().length > 0 || !dirty;
    }
  }

  function forgetToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (_) {
      // Nothing to clean up when storage is unavailable.
    }
    dom["gh-token"].value = "";
    dom["remember-token"].checked = false;
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
    fillSubjectControls();
    renderTabs();
    renderList();
    renderDatalists();
    renderPending();
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

    dom["list-subject"].addEventListener("change", function (event) {
      filterSubject = event.target.value;
      renderList();
    });

    dom["manage-subjects"].addEventListener("click", function () {
      renderSubjectRows();
      dom["subject-overlay"].hidden = false;
      dom["add-subject"].focus();
    });

    dom["subject-rows"].addEventListener("input", function (event) {
      const field = event.target.dataset.subjectField;
      if (!field) return;
      db.subjects[Number(event.target.dataset.index)][field] = event.target.value;
      saveDraft();
      fillSubjectControls();
      setSubjectValue(selected ? selected.subject : "");
      renderList();
      renderPreview();
    });

    dom["subject-rows"].addEventListener("click", function (event) {
      const move = event.target.closest("button[data-subject-move]");
      if (move) {
        moveSubject(Number(move.dataset.index), move.dataset.subjectMove);
        return;
      }
      const remove = event.target.closest("button[data-subject-remove]");
      if (remove) removeSubject(Number(remove.dataset.subjectRemove));
    });

    dom["add-subject"].addEventListener("click", addSubject);

    [dom["close-subjects"], dom["done-subjects"]].forEach(function (button) {
      button.addEventListener("click", function () {
        dom["subject-overlay"].hidden = true;
      });
    });

    dom["subject-overlay"].addEventListener("click", function (event) {
      if (event.target === dom["subject-overlay"]) dom["subject-overlay"].hidden = true;
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

    dom["admin-form"].addEventListener("click", function (event) {
      const button = event.target.closest("button[data-pick]");
      if (!button) return;
      pickTarget = { kind: button.dataset.pick, index: Number(button.dataset.index) };
      dom["file-picker"].accept = button.dataset.accept || "";
      dom["file-picker"].click();
    });

    dom["file-picker"].addEventListener("change", function (event) {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file || !pickTarget) return;
      const target = pickTarget;
      pickTarget = null;

      queueUpload(file, function (path) {
        if (target.kind === "cover") {
          dom["f-cover"].value = path;
        } else if (target.kind === "video") {
          dom["f-video-provider"].value = "local";
          dom["f-video-value"].value = path;
          syncTypeBlocks();
        } else if (target.kind === "image") {
          imageRows[target.index].src = path;
          renderImageRows();
        }
      });
    });

    dom["pending-uploads"].addEventListener("click", function (event) {
      const button = event.target.closest("button[data-cancel-upload]");
      if (!button) return;
      const path = button.dataset.cancelUpload;
      URL.revokeObjectURL(pending[path].url);
      delete pending[path];
      renderPending();
      renderPreview();
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
      if (event.key !== "Escape") return;
      dom["publish-overlay"].hidden = true;
      dom["subject-overlay"].hidden = true;
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
