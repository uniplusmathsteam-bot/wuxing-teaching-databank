(function () {
  "use strict";

  const data = window.DATABANK || { elements: [], items: [] };
  const main = document.getElementById("main");
  const searchInput = document.getElementById("global-search");
  const themeToggle = document.getElementById("theme-toggle");
  const escapeHtml = window.WuxingMarkdown.escape;

  const typeLabels = {
    video: "影片",
    image: "圖片",
    article: "文章",
    tool: "互動工具"
  };

  const typeIcons = {
    video: "▶",
    image: "▧",
    article: "¶",
    tool: "◇"
  };

  const state = {
    tag: "",
    type: "",
    form: "",
    topic: "",
    sort: "newest",
    view: readStorage("wuxing-view") || "grid",
    currentElement: ""
  };

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {
      // The site remains fully usable when browser storage is unavailable.
    }
  }

  function elementById(id) {
    return data.elements.find(function (element) {
      return element.id === id;
    });
  }

  function itemById(id) {
    return data.items.find(function (item) {
      return item.id === id;
    });
  }

  function itemElement(item) {
    return elementById(item.element) || data.elements[0];
  }

  function setAccent(element) {
    const root = document.documentElement;
    root.style.setProperty("--accent", element ? element.accent : "#db9f3a");
    root.style.setProperty("--accent-rgb", element ? element.rgb : "219, 159, 58");
  }

  function styleVars(element, prefix) {
    return (
      "--" + prefix + "-accent:" + element.accent + ";" +
      "--" + prefix + "-rgb:" + element.rgb
    );
  }

  function formatDate(date) {
    if (!date) return "";
    try {
      return new Intl.DateTimeFormat("zh-Hant", {
        year: "numeric",
        month: "short",
        day: "numeric"
      }).format(new Date(date + "T00:00:00"));
    } catch (_) {
      return date;
    }
  }

  function typeLabel(type) {
    return typeLabels[type] || type;
  }

  function renderTags(tags, limit) {
    return (tags || [])
      .slice(0, limit || tags.length)
      .map(function (tag) {
        return '<span class="tag">' + escapeHtml(tag) + "</span>";
      })
      .join("");
  }

  function card(item) {
    const element = itemElement(item);
    return [
      '<article class="content-card" style="' + styleVars(element, "item") + '">',
      '  <a href="#/' + escapeHtml(item.element) + "/" + encodeURIComponent(item.id) + '">',
      '    <div class="card-cover">',
      '      <img src="' + escapeHtml(item.cover) + '" alt="" loading="lazy">',
      '      <span class="card-type">' + typeIcons[item.type] + " " + typeLabel(item.type) + "</span>",
      item.duration ? '      <span class="duration">' + escapeHtml(item.duration) + "</span>" : "",
      "    </div>",
      '    <div class="card-body">',
      '      <p class="card-kicker">' + escapeHtml(element.zh + " · " + element.en) + "</p>",
      "      <h3>" + escapeHtml(item.title) + "</h3>",
      '      <p class="card-subtitle">' + escapeHtml(item.subtitle || "") + "</p>",
      '      <div class="tag-list">' + renderTags(item.tags, 3) + "</div>",
      '      <div class="card-footer">',
      "        <span>" +
        escapeHtml([item.form, item.topic].filter(Boolean).join(" · ") || item.subject || "綜合") +
        "</span>",
      "        <span>" + escapeHtml(formatDate(item.date)) + "</span>",
      "      </div>",
      "    </div>",
      "  </a>",
      "</article>"
    ].join("");
  }

  function cards(items, extraClass) {
    if (!items.length) {
      return [
        '<div class="empty-state">',
        "  <h2>找不到相符內容</h2>",
        "  <p>試試其他標籤、類型或搜尋字詞。</p>",
        "</div>"
      ].join("");
    }
    return '<div class="gallery-grid ' + (extraClass || "") + '">' + items.map(card).join("") + "</div>";
  }

  function renderHome() {
    setAccent(null);
    document.title = data.site.title + " · " + data.site.subtitle;
    searchInput.value = "";

    const featured = data.items
      .filter(function (item) {
        return item.featured;
      })
      .slice(0, 6);
    const contentTypeCount = new Set(
      data.items.map(function (item) {
        return item.type;
      })
    ).size;

    const elementCards = data.elements
      .map(function (element) {
        const count = data.items.filter(function (item) {
          return item.element === element.id;
        }).length;
        return [
          '<article class="element-card" style="' + styleVars(element, "card") + '">',
          '  <a href="#/' + element.id + '">',
          '    <div class="element-card-top">',
          '      <span class="element-symbol" aria-hidden="true">' + element.zh + "</span>",
          '      <span class="item-count">' + count + " 項內容</span>",
          "    </div>",
          '    <div class="element-card-content">',
          "      <h3>" + element.zh + " · " + element.en + "</h3>",
          '      <p class="role">' + escapeHtml(element.role) + "</p>",
          '      <p class="function">' + escapeHtml(element.functions.join("、")) + "</p>",
          "    </div>",
          '    <span class="arrow" aria-hidden="true">→</span>',
          "  </a>",
          "</article>"
        ].join("");
      })
      .join("");

    main.innerHTML = [
      '<section class="hero">',
      "  <div>",
      '    <p class="eyebrow">Uni+ 2.0 Teaching Arsenal</p>',
      "    <h1>以五種能量，<br>啟動<em>立體教學</em></h1>",
      "  </div>",
      "  <div>",
      '    <p class="hero-copy">把真實教學影片與五行戰術文章，依照金、木、水、火、土整理成可搜尋的教學武器庫。</p>',
      '    <div class="hero-stats">',
      '      <div class="stat"><strong>5</strong><span>戰術模組</span></div>',
      '      <div class="stat"><strong>' + data.items.length + '</strong><span>教學資源</span></div>',
      '      <div class="stat"><strong>' + contentTypeCount + '</strong><span>內容類型</span></div>',
      "    </div>",
      "  </div>",
      "</section>",
      '<section class="overview-section">',
      '  <div class="section-heading">',
      "    <div><h2>五行總覽</h2><p>一張圖看懂五種能量的角色、武器與相生相剋</p></div>",
      '    <a class="button" href="media/overview/wuxing-overview.svg" target="_blank" rel="noopener">開啟大圖 ↗</a>',
      "  </div>",
      '  <figure class="overview-figure">',
      '    <button type="button" data-lightbox-src="media/overview/wuxing-overview.svg"',
      '            data-lightbox-alt="五行總覽圖：金木水火土的角色、功能、戰術武器與相生相剋關係">',
      '      <img src="media/overview/wuxing-overview.svg" alt="五行總覽圖：金木水火土的角色、功能、戰術武器與相生相剋關係">',
      "    </button>",
      "    <figcaption>點擊放大 · 相生（實線）代表能量流轉，相剋（虛線）代表平衡制衡</figcaption>",
      "  </figure>",
      "</section>",
      "<section>",
      '  <div class="section-heading">',
      "    <div><h2>五行戰術模組</h2><p>選擇一種能量風格，進入教學資源庫</p></div>",
      "  </div>",
      '  <div class="element-grid">' + elementCards + "</div>",
      "</section>",
      '<section class="recent-section">',
      '  <div class="section-heading">',
      "    <div><h2>精選教學資源</h2><p>由五行武器庫挑選的示範內容</p></div>",
      "  </div>",
      cards(featured),
      "</section>"
    ].join("");
  }

  function getFilteredElementItems(elementId) {
    let items = data.items.filter(function (item) {
      return item.element === elementId;
    });
    if (state.tag) {
      items = items.filter(function (item) {
        return (item.tags || []).includes(state.tag);
      });
    }
    if (state.type) {
      items = items.filter(function (item) {
        return item.type === state.type;
      });
    }
    if (state.form) {
      items = items.filter(function (item) {
        return item.form === state.form;
      });
    }
    if (state.topic) {
      items = items.filter(function (item) {
        return item.topic === state.topic;
      });
    }

    items.sort(function (a, b) {
      if (state.sort === "oldest") return (a.date || "").localeCompare(b.date || "");
      if (state.sort === "title") return a.title.localeCompare(b.title, "zh-Hant");
      return (b.date || "").localeCompare(a.date || "");
    });
    return items;
  }

  function renderElement(element, preserveFilters) {
    if (!preserveFilters || state.currentElement !== element.id) {
      state.tag = "";
      state.type = "";
      state.form = "";
      state.topic = "";
      state.sort = "newest";
    }
    state.currentElement = element.id;
    setAccent(element);
    searchInput.value = "";
    document.title = element.zh + " · " + element.en + " | " + data.site.title;

    const allItems = data.items.filter(function (item) {
      return item.element === element.id;
    });
    const tags = Array.from(
      new Set(
        allItems.reduce(function (all, item) {
          return all.concat(item.tags || []);
        }, [])
      )
    );
    const forms = Array.from(
      new Set(
        allItems
          .map(function (item) {
            return item.form;
          })
          .filter(Boolean)
      )
    ).sort(function (a, b) {
      return a.localeCompare(b, "en", { numeric: true });
    });
    const topics = Array.from(
      new Set(
        allItems
          .filter(function (item) {
            return !state.form || item.form === state.form;
          })
          .map(function (item) {
            return item.topic;
          })
          .filter(Boolean)
      )
    ).sort(function (a, b) {
      return a.localeCompare(b, "en", { numeric: true });
    });
    if (state.topic && !topics.includes(state.topic)) {
      state.topic = "";
    }
    const visibleItems = getFilteredElementItems(element.id);

    const tagButtons = [
      '<button class="tag-filter ' + (!state.tag ? "is-active" : "") + '" type="button" data-tag="">全部</button>'
    ]
      .concat(
        tags.map(function (tag) {
          return (
            '<button class="tag-filter ' +
            (state.tag === tag ? "is-active" : "") +
            '" type="button" data-tag="' +
            escapeHtml(tag) +
            '">' +
            escapeHtml(tag) +
            "</button>"
          );
        })
      )
      .join("");

    const availableTypes = ["video", "image", "article", "tool"].filter(function (type) {
      return allItems.some(function (item) {
        return item.type === type;
      });
    });
    const typeButtons = [""].concat(availableTypes)
      .map(function (type) {
        return (
          '<button class="type-filter ' +
          (state.type === type ? "is-active" : "") +
          '" type="button" data-type="' +
          type +
          '">' +
          (type ? typeLabel(type) : "所有類型") +
          "</button>"
        );
      })
      .join("");
    const formOptions = ['<option value="">全部年級</option>']
      .concat(
        forms.map(function (form) {
          return (
            '<option value="' +
            escapeHtml(form) +
            '"' +
            (state.form === form ? " selected" : "") +
            ">" +
            escapeHtml(form) +
            "</option>"
          );
        })
      )
      .join("");
    const topicOptions = ['<option value="">全部主題</option>']
      .concat(
        topics.map(function (topic) {
          return (
            '<option value="' +
            escapeHtml(topic) +
            '"' +
            (state.topic === topic ? " selected" : "") +
            ">" +
            escapeHtml(topic) +
            "</option>"
          );
        })
      )
      .join("");

    main.innerHTML = [
      '<nav class="breadcrumb" aria-label="頁面路徑">',
      '  <a href="#/">首頁</a><span class="separator">/</span><span aria-current="page">' +
        element.zh +
        " · " +
        element.en +
        "</span>",
      "</nav>",
      '<section class="element-hero" data-symbol="' + element.zh + '" style="' + styleVars(element, "element") + '">',
      '  <div class="element-hero-main">',
      '    <span class="element-label">X-Axis · Style Module</span>',
      "    <h1><span>" + element.zh + "</span> · " + element.en + "</h1>",
      '    <p class="element-role">' + escapeHtml(element.role) + "</p>",
      "  </div>",
      '  <div class="element-notes">',
      '    <div class="note-block"><strong>功能 FUNCTION</strong><p>' +
        escapeHtml(element.functions.join(" · ")) +
        "</p></div>",
      '    <div class="note-block"><strong>戰術武器 TACTICS</strong><p>' +
        escapeHtml(element.weapons.join(" · ")) +
        "</p></div>",
      '    <div class="note-block caution"><strong>平衡提醒</strong><p>' +
        escapeHtml(element.caution) +
        "</p></div>",
      "  </div>",
      "</section>",
      "<section>",
      '  <div class="gallery-toolbar">',
      '    <div class="filter-group" aria-label="內容類型">' + typeButtons + "</div>",
      '    <div class="view-controls">',
      '      <label class="select-wrap"><select id="form-filter" aria-label="按年級篩選">' +
        formOptions +
        "</select></label>",
      '      <label class="select-wrap"><select id="topic-filter" aria-label="按主題篩選">' +
        topicOptions +
        "</select></label>",
      '      <label class="select-wrap"><select id="sort-select" aria-label="排序內容">',
      '        <option value="newest"' + (state.sort === "newest" ? " selected" : "") + ">最新加入</option>",
      '        <option value="oldest"' + (state.sort === "oldest" ? " selected" : "") + ">最早加入</option>",
      '        <option value="title"' + (state.sort === "title" ? " selected" : "") + ">標題排序</option>",
      "      </select></label>",
      '      <div class="segmented" aria-label="檢視方式">',
      '        <button type="button" data-view="grid" class="' +
        (state.view === "grid" ? "is-active" : "") +
        '" aria-label="圖庫檢視">▦</button>',
      '        <button type="button" data-view="list" class="' +
        (state.view === "list" ? "is-active" : "") +
        '" aria-label="列表檢視">☷</button>',
      "      </div>",
      "    </div>",
      "  </div>",
      '  <div class="filter-group" aria-label="標籤篩選">' + tagButtons + "</div>",
      '  <p class="results-meta">' + visibleItems.length + " / " + allItems.length + " 項內容</p>",
      cards(visibleItems, state.view === "list" ? "is-list" : ""),
      "</section>"
    ].join("");
  }

  function searchableText(item) {
    const element = itemElement(item);
    return [
      item.title,
      item.subtitle,
      item.subject,
      item.form,
      item.topic,
      item.level,
      item.tla,
      item.body,
      (item.tags || []).join(" "),
      element.zh,
      element.en,
      element.role,
      element.functions.join(" "),
      element.weapons.join(" ")
    ]
      .join(" ")
      .toLocaleLowerCase();
  }

  function renderSearch(query) {
    setAccent(null);
    const normalized = (query || "").trim().toLocaleLowerCase();
    searchInput.value = query || "";
    document.title = "搜尋「" + query + "」 | " + data.site.title;

    const terms = normalized.split(/\s+/).filter(Boolean);
    const results = terms.length
      ? data.items.filter(function (item) {
          const haystack = searchableText(item);
          return terms.every(function (term) {
            return haystack.includes(term);
          });
        })
      : [];

    main.innerHTML = [
      '<nav class="breadcrumb" aria-label="頁面路徑"><a href="#/">首頁</a><span class="separator">/</span><span aria-current="page">搜尋</span></nav>',
      '<section class="detail-header">',
      '  <p class="detail-type">Search the databank</p>',
      "  <h1>搜尋結果</h1>",
      '  <p class="detail-lead">' +
        (normalized
          ? "「" + escapeHtml(query) + "」找到 " + results.length + " 項內容"
          : "在上方輸入主題、科目或標籤。") +
        "</p>",
      "</section>",
      cards(results),
    ].join("");
  }

  function property(label, value) {
    if (!value) return "";
    return '<div class="property"><dt>' + label + '</dt><dd>' + value + "</dd></div>";
  }

  function renderDetail(element, item) {
    setAccent(element);
    searchInput.value = "";
    document.title = item.title + " | " + data.site.title;

    const media = [];
    if (item.video) {
      media.push(window.WuxingMedia.video(item.video, item.cover, item.title));
    }
    if (item.images) {
      media.push(window.WuxingMedia.images(item.images, item.imageLayout));
    }

    const article = item.body
      ? '<article class="article">' + window.WuxingMarkdown.render(item.body) + "</article>"
      : "";

    const tool = item.tool
      ? [
          '<section class="related-section">',
          '  <div class="section-heading"><div><h2>互動教學工具</h2><p>拖動、切換及調整數值，探索概念</p></div>',
          '  <a class="button" href="' + escapeHtml(item.tool) + '" target="_blank" rel="noopener">全螢幕開啟 ↗</a></div>',
          '  <div class="media-frame"><iframe class="tool-frame" src="' +
            escapeHtml(item.tool) +
            '" title="' +
            escapeHtml(item.title) +
            '互動工具" loading="lazy"></iframe></div>',
          "</section>"
        ].join("")
      : "";

    const related = data.items
      .filter(function (candidate) {
        return candidate.element === item.element && candidate.id !== item.id;
      })
      .slice(0, 3);

    main.innerHTML = [
      '<nav class="breadcrumb" aria-label="頁面路徑">',
      '  <a href="#/">首頁</a><span class="separator">/</span>',
      '  <a href="#/' + element.id + '">' + element.zh + " · " + element.en + "</a>",
      '  <span class="separator">/</span><span aria-current="page">' + escapeHtml(item.title) + "</span>",
      "</nav>",
      '<header class="detail-header">',
      '  <p class="detail-type">' + typeIcons[item.type] + " " + typeLabel(item.type) + " · " + element.zh + " " + element.en + "</p>",
      "  <h1>" + escapeHtml(item.title) + "</h1>",
      '  <p class="detail-lead">' + escapeHtml(item.subtitle || "") + "</p>",
      "</header>",
      '<div class="detail-layout">',
      '  <div class="detail-main">' + media.join("") + article + tool + "</div>",
      '  <aside class="detail-sidebar">',
      "    <h2>資源資料</h2>",
      '    <dl class="property-list">',
      property("五行", element.zh + " · " + element.en),
      property("類型", typeLabel(item.type)),
      property("科目", escapeHtml(item.subject)),
      property("年級", escapeHtml(item.form)),
      property("主題", escapeHtml(item.topic)),
      property("深度", escapeHtml(item.level)),
      property("TLA", escapeHtml(item.tla)),
      property("時長", escapeHtml(item.duration)),
      property("日期", escapeHtml(formatDate(item.date))),
      property("標籤", renderTags(item.tags)),
      "    </dl>",
      "  </aside>",
      "</div>",
      related.length
        ? [
            '<section class="related-section">',
            '  <div class="section-heading"><div><h2>同屬 ' +
              element.zh +
              " 的資源</h2><p>繼續探索 " +
              escapeHtml(element.role) +
              "</p></div></div>",
            cards(related),
            "</section>"
          ].join("")
        : ""
    ].join("");
  }

  function renderAbout() {
    setAccent(null);
    searchInput.value = "";
    document.title = "關於 | " + data.site.title;
    main.innerHTML = [
      '<nav class="breadcrumb" aria-label="頁面路徑"><a href="#/">首頁</a><span class="separator">/</span><span aria-current="page">關於</span></nav>',
      '<section class="about">',
      '  <div class="about-symbol" aria-hidden="true">五</div>',
      "  <h1>一個立體的<br>教學武器庫</h1>",
      "  <p>本資料庫依據 Uni+ 2.0 三維動態教學系統建立。導師在三維坐標中精準協同：Z 軸回答何時做什麼，Y 軸決定教到什麼深度，X 軸以五行戰術選擇互動風格。</p>",
      '  <div class="axis-grid">',
      '    <div class="axis-card"><strong>Z 軸 · Process</strong><span>宏觀教學週期：課前設計、課堂管理、課後檢討</span></div>',
      '    <div class="axis-card"><strong>Y 軸 · Depth</strong><span>動態深層螺旋：表層水、中層水、深層水</span></div>',
      '    <div class="axis-card"><strong>X 軸 · Style</strong><span>五行戰術模組：金、木、水、火、土</span></div>',
      "  </div>",
      "</section>"
    ].join("");
  }

  function renderNotFound() {
    setAccent(null);
    document.title = "找不到頁面 | " + data.site.title;
    main.innerHTML = [
      '<section class="empty-state">',
      "  <h1>找不到這項內容</h1>",
      "  <p>它可能已移動、改名或尚未加入資料庫。</p>",
      '  <a class="button" href="#/">返回首頁</a>',
      "</section>"
    ].join("");
  }

  function parseRoute() {
    const raw = (location.hash || "#/").replace(/^#\/?/, "");
    const split = raw.split("?");
    const path = split[0];
    const params = new URLSearchParams(split[1] || "");
    return {
      parts: path.split("/").filter(Boolean).map(decodeURIComponent),
      params: params
    };
  }

  function route() {
    const current = parseRoute();
    const parts = current.parts;

    if (!parts.length) {
      renderHome();
    } else if (parts[0] === "about") {
      renderAbout();
    } else if (parts[0] === "search") {
      renderSearch(current.params.get("q") || "");
    } else {
      const element = elementById(parts[0]);
      if (!element) {
        renderNotFound();
      } else if (parts.length === 1) {
        renderElement(element, false);
      } else {
        const item = itemById(parts[1]);
        if (!item || item.element !== element.id) renderNotFound();
        else renderDetail(element, item);
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function updateElementView() {
    const element = elementById(state.currentElement);
    if (element) renderElement(element, true);
  }

  function initTheme() {
    const saved = readStorage("wuxing-theme");
    const preferredLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    const theme = saved || (preferredLight ? "light" : "dark");
    document.documentElement.dataset.theme = theme;
    themeToggle.querySelector("span").textContent = theme === "light" ? "☾" : "☼";
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    themeToggle.querySelector("span").textContent = next === "light" ? "☾" : "☼";
    writeStorage("wuxing-theme", next);
  }

  function updateSearchHash(query) {
    const hash = "#/search?q=" + encodeURIComponent(query);
    try {
      history.replaceState(null, "", hash);
    } catch (_) {
      location.hash = hash;
    }
  }

  document.addEventListener("click", function (event) {
    const tagButton = event.target.closest("[data-tag]");
    if (tagButton) {
      state.tag = tagButton.dataset.tag;
      updateElementView();
      return;
    }

    const typeButton = event.target.closest("[data-type]");
    if (typeButton) {
      state.type = typeButton.dataset.type;
      updateElementView();
      return;
    }

    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      state.view = viewButton.dataset.view;
      writeStorage("wuxing-view", state.view);
      updateElementView();
    }
  });

  document.addEventListener("change", function (event) {
    if (event.target.id === "form-filter") {
      state.form = event.target.value;
      state.topic = "";
      updateElementView();
      return;
    }
    if (event.target.id === "topic-filter") {
      state.topic = event.target.value;
      updateElementView();
      return;
    }
    if (event.target.id === "sort-select") {
      state.sort = event.target.value;
      updateElementView();
    }
  });

  searchInput.addEventListener("input", function () {
    const query = searchInput.value;
    if (!query.trim()) {
      location.hash = "#/";
      return;
    }
    updateSearchHash(query);
    renderSearch(query);
  });

  document.addEventListener("keydown", function (event) {
    if (
      event.key === "/" &&
      document.activeElement !== searchInput &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  themeToggle.addEventListener("click", toggleTheme);
  window.addEventListener("hashchange", route);

  initTheme();
  window.WuxingMedia.init();
  route();
})();
