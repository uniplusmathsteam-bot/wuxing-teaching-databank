(function () {
  "use strict";

  const REPO = "uniplusmathsteam-bot/wuxing-teaching-databank";
  const API_ROOT = "https://api.github.com";
  const TOKEN_KEY = "wuxing-admin-token";

  const dom = {};
  [
    "token-form",
    "setup-token",
    "remember-token",
    "verify-token",
    "token-status",
    "refresh-collaborators",
    "clear-token",
    "collaborator-empty",
    "collaborator-record",
    "record-account",
    "record-updated",
    "stat-total",
    "stat-admin",
    "stat-write",
    "stat-read",
    "collaborator-list"
  ].forEach(function (id) {
    dom[id] = document.getElementById(id);
  });

  function readSavedToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function saveToken(token) {
    try {
      if (dom["remember-token"].checked) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function showStatus(message, kind) {
    dom["token-status"].hidden = false;
    dom["token-status"].textContent = message;
    dom["token-status"].className = "token-status" + (kind ? " is-" + kind : "");
  }

  async function apiFetch(url, token) {
    const response = await fetch(url, {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    if (response.ok) {
      return { data: await response.json(), response: response };
    }

    const detail = await response.json().catch(function () {
      return {};
    });
    const error = new Error(detail.message || response.statusText);
    error.status = response.status;
    throw error;
  }

  function nextPage(response) {
    const links = response.headers.get("Link") || "";
    const match = links.match(/<([^>]+)>;\s*rel="next"/);
    return match ? match[1] : "";
  }

  async function loadAllCollaborators(token) {
    let url = API_ROOT + "/repos/" + REPO + "/collaborators?affiliation=all&per_page=100";
    const collaborators = [];

    while (url) {
      const page = await apiFetch(url, token);
      collaborators.push.apply(collaborators, page.data);
      url = nextPage(page.response);
    }
    return collaborators;
  }

  function accessLevel(collaborator) {
    const permissions = collaborator.permissions || {};
    const role = collaborator.role_name || "";
    if (permissions.admin || role === "admin") return "admin";
    if (permissions.maintain || permissions.push || role === "maintain" || role === "write") return "write";
    return "read";
  }

  function roleLabel(collaborator) {
    const role = collaborator.role_name;
    if (role) {
      if (role === "admin") return "Admin";
      if (role === "maintain") return "Maintain";
      if (role === "write") return "Write";
      if (role === "triage") return "Triage";
      if (role === "read") return "Read";
      return role;
    }
    const level = accessLevel(collaborator);
    return level === "admin" ? "Admin" : level === "write" ? "Write" : "Read";
  }

  function createCollaboratorRow(collaborator) {
    const row = document.createElement("a");
    row.className = "collaborator-row";
    row.href = collaborator.html_url;
    row.target = "_blank";
    row.rel = "noopener";

    const avatar = document.createElement("img");
    avatar.src = collaborator.avatar_url;
    avatar.alt = "";
    avatar.width = 40;
    avatar.height = 40;
    avatar.loading = "lazy";
    avatar.referrerPolicy = "no-referrer";

    const identity = document.createElement("span");
    identity.className = "collaborator-identity";

    const login = document.createElement("strong");
    login.textContent = collaborator.login;

    const accountType = document.createElement("span");
    accountType.textContent =
      (collaborator.type === "User" ? "GitHub 個人帳戶" : collaborator.type || "GitHub 帳戶") +
      (collaborator.site_admin ? " · GitHub staff" : "");

    const role = document.createElement("span");
    const level = accessLevel(collaborator);
    role.className = "collaborator-role is-" + level;
    role.textContent = roleLabel(collaborator);

    identity.appendChild(login);
    identity.appendChild(accountType);
    row.appendChild(avatar);
    row.appendChild(identity);
    row.appendChild(role);
    return row;
  }

  function renderCollaborators(account, collaborators) {
    const rank = { admin: 0, write: 1, read: 2 };
    collaborators.sort(function (left, right) {
      const difference = rank[accessLevel(left)] - rank[accessLevel(right)];
      return difference || left.login.localeCompare(right.login);
    });

    const totals = collaborators.reduce(
      function (result, collaborator) {
        const level = accessLevel(collaborator);
        result[level] += 1;
        if (level === "admin" || level === "write") result.publish += 1;
        return result;
      },
      { admin: 0, write: 0, read: 0, publish: 0 }
    );

    dom["stat-total"].textContent = collaborators.length;
    dom["stat-admin"].textContent = totals.admin;
    dom["stat-write"].textContent = totals.publish;
    dom["stat-read"].textContent = totals.read;
    dom["record-account"].textContent = "已驗證帳戶：@" + account.login;
    dom["record-updated"].textContent = "更新時間：" + new Date().toLocaleString("zh-HK");

    dom["collaborator-list"].replaceChildren();
    collaborators.forEach(function (collaborator) {
      dom["collaborator-list"].appendChild(createCollaboratorRow(collaborator));
    });

    dom["collaborator-empty"].hidden = true;
    dom["collaborator-record"].hidden = false;
  }

  function describeError(error) {
    if (error.status === 401) return "權杖無效或已過期。請重新建立權杖並再試。";
    if (error.status === 403) {
      return "這個帳戶沒有足夠權限。請確認它已接受 collaborator 邀請，且權杖可存取這個 repository。";
    }
    if (error.status === 404) {
      return "找不到 repository 或帳戶未獲授權。請先接受 collaborator 邀請，再檢查權杖的 Repository access。";
    }
    if (error.status) return "GitHub 回覆錯誤（" + error.status + "）：" + error.message;
    return "無法連線到 GitHub。請檢查網絡後再試。";
  }

  async function verifyAndLoad() {
    const token = dom["setup-token"].value.trim();
    if (!token) {
      showStatus("請先貼上 GitHub 存取權杖。", "error");
      dom["setup-token"].focus();
      return;
    }

    dom["verify-token"].disabled = true;
    dom["refresh-collaborators"].disabled = true;
    dom["verify-token"].textContent = "正在驗證…";
    showStatus("正在驗證 GitHub 帳戶及讀取協作者記錄…");

    try {
      const results = await Promise.all([
        apiFetch(API_ROOT + "/user", token),
        loadAllCollaborators(token)
      ]);
      const account = results[0].data;
      const collaborators = results[1];
      const remembered = saveToken(token);
      renderCollaborators(account, collaborators);
      showStatus(
        "驗證成功：@" +
          account.login +
          " 可以存取 repository。已載入 " +
          collaborators.length +
          " 位協作者。" +
          (dom["remember-token"].checked && !remembered ? " 但瀏覽器無法儲存權杖。" : ""),
        "ok"
      );
    } catch (error) {
      showStatus(describeError(error), "error");
    } finally {
      dom["verify-token"].disabled = false;
      dom["refresh-collaborators"].disabled = false;
      dom["verify-token"].textContent = "驗證並載入名單";
    }
  }

  function clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (_) {
      // The visible input and record can still be cleared when storage is unavailable.
    }
    dom["setup-token"].value = "";
    dom["collaborator-record"].hidden = true;
    dom["collaborator-empty"].hidden = false;
    dom["collaborator-list"].replaceChildren();
    showStatus("已從這部電腦清除儲存的權杖。", "ok");
    dom["setup-token"].focus();
  }

  function init() {
    const saved = readSavedToken();
    if (saved) {
      dom["setup-token"].value = saved;
      showStatus("已找到這部電腦儲存的權杖。按「驗證並載入名單」查看最新記錄。");
    }

    dom["token-form"].addEventListener("submit", function (event) {
      event.preventDefault();
      verifyAndLoad();
    });

    dom["refresh-collaborators"].addEventListener("click", verifyAndLoad);
    dom["clear-token"].addEventListener("click", clearToken);
  }

  init();
})();
