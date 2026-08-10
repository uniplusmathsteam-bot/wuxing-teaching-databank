# 五行教學資料庫

Notion Gallery 風格的靜態教學網站，以 Uni+ 2.0「三維動態教學系統」的五行戰術模組整理真實教學影片、教案及戰術說明文章。

- 金 Metal：架構師／裁判
- 木 Wood：園丁／導航員
- 水 Water：說書人／治療師
- 火 Fire：表演者／啦啦隊
- 土 Earth：建築師／守護者

網站沒有套件、建置步驟或後端。直接開啟 `index.html` 即可在本機瀏覽，也可直接部署到 GitHub Pages。

- 公開網站：<https://uniplusmathsteam-bot.github.io/wuxing-teaching-databank/>
- 內容編輯器：<https://uniplusmathsteam-bot.github.io/wuxing-teaching-databank/admin.html>
- 五行總覽圖：`media/overview/wuxing-overview.svg`（首頁「五行總覽」區塊）

---

# 第一部分：給導師與 KOC（不需要程式基礎）

**你不需要開啟任何程式碼。** 所有新增、修改、刪除都在「內容編輯器」網頁完成，最後把結果貼回 GitHub 就會自動更新網站。

## 一次過看完的流程

1. 先把影片、圖片上載到 GitHub（見下面「上載檔案」）。
2. 開啟 [內容編輯器](https://uniplusmathsteam-bot.github.io/wuxing-teaching-databank/admin.html)。
3. 新增／修改／刪除內容，編輯器會自動存成瀏覽器草稿。
4. 按 **完成，準備發佈 →**，再按 **直接發佈到 GitHub**。
5. 等一至兩分鐘，網站就更新了。

> **重要：** 在編輯器入面打字並不會即時更新網站。所有修改只存在你自己的瀏覽器，一定要按 **完成，準備發佈 →** 再發佈，網站先會改變。

## 上載檔案（影片、圖片、教案）

1. 開啟 GitHub 的 [media 資料夾](https://github.com/uniplusmathsteam-bot/wuxing-teaching-databank/upload/main/media)。
2. 選對應的五行資料夾：`metal`（金）、`wood`（木）、`water`（水）、`fire`（火）、`earth`（土）。
3. 把檔案拖進去，按 **Commit changes**。
4. 記下路徑，例如 `media/fire/my-demo.mp4`，稍後在編輯器要填。

檔名建議只用小寫英文、數字和 `-`，例如 `s3-jm29-quadrilaterals-page-1.jpg`。中文檔名或空格容易出問題。

> GitHub 單一檔案上限是 100 MB。長片建議放 Vimeo 或 YouTube，在編輯器選對應來源再填影片 ID 就可以。

## 使用內容編輯器

| 想做的事 | 做法 |
| --- | --- |
| 新增內容 | 左上角按 **＋ 新增內容**，然後由上而下填表 |
| 修改內容 | 左邊清單點一下該項內容，右邊即可修改 |
| 刪除內容 | 開啟該項內容，右上角按 **刪除** |
| 複製舊內容當範本 | 開啟相似的內容，按 **複製一份**，再改標題和路徑 |
| 找回某項內容 | 用左上角搜尋框，或按五行分頁篩選 |
| 放棄所有未發佈的修改 | 右上角按 **捨棄草稿** |

填表時要注意的欄位：

- **五行分類**：決定內容放在哪一張大卡入面。
- **內容類型**：影片、圖片／教案、文章、互動工具。選了類型，下面就只會顯示相關欄位。
- **網址代號 ID**：這項內容的網址，只可以用小寫英文、數字和 `-`。不肯定就按 **由標題自動產生**。
- **封面圖**：卡片上的縮圖，一定要填，建議 16:9（例如 1600 × 900）。
- **年級 Form** 和 **主題 Topic**：首頁的篩選器就是用這兩個欄位，填了才可以被篩選出來。
- **標籤**：用空格分隔，不用自己打 `#`。
- **內文**：支援簡單 Markdown：`## 小標題`、`- 項目`、`1. 步驟`、`**粗體**`、`> 引言`。

右下角有 **卡片預覽**，可即時看到卡片效果。如果預覽顯示「找不到封面圖」，即是路徑打錯了。

## 發佈

按 **完成，準備發佈 →** 之後有兩個方法。

### 方法一：一鍵發佈（推薦）

1. 第一次使用時，把 GitHub 存取權杖貼進去（見下一節）。之後這部電腦會記住，不用再貼。
2. 可以在下面填一句更新說明，例如「新增 S4 三角學示範」。留空也可以。
3. 按 **直接發佈到 GitHub**。
4. 見到「發佈成功」就完成了，等一至兩分鐘網站就會更新。

如果其他人在你編輯期間發佈過新內容，編輯器會先警告你，避免無意中覆蓋別人的修改。

### 方法二：手動複製貼上（不需要權杖）

1. 展開 **方法二**，按 **複製全部內容**。
2. 按 **在 GitHub 開啟 content.js**（需要登入有寫入權限的 GitHub 帳號）。
3. 在編輯框內按 <kbd>Ctrl</kbd>+<kbd>A</kbd> 全選，再 <kbd>Ctrl</kbd>+<kbd>V</kbd> 貼上。
4. 按綠色的 **Commit changes**。

發佈後請開一次網站，確認新卡片的封面、影片和篩選都正常。

## 如何取得 GitHub 存取權杖

權杖等於一條「代你提交內容」的鎖匙，只需要做一次。

1. 用有這個 repository 寫入權限的帳號登入 GitHub。
2. 開啟 [Fine-grained personal access tokens](https://github.com/settings/personal-access-tokens/new)。
3. **Token name**：隨便填，例如 `wuxing-databank-editor`。
4. **Expiration**：建議 90 天或 1 年，到期後重新產生一個即可。
5. **Repository access**：選 **Only select repositories**，然後揀 `wuxing-teaching-databank`。
6. **Permissions → Repository permissions → Contents**：設為 **Read and write**。
7. 按 **Generate token**，複製出現的那串字（離開頁面後就看不到了）。
8. 回到編輯器，貼進 **一鍵發佈** 的欄位，按一次 **直接發佈到 GitHub** 即可。

注意事項：

- 權杖只儲存在你自己的瀏覽器（`localStorage`），不會上傳到網站，其他人看不到。
- 不要在公用或共用電腦儲存權杖。用完可按 **清除權杖**。
- 不要把權杖貼在 WhatsApp、電郵或任何檔案入面。每人自己產生一個就可以。
- 如果你的帳號只是 collaborator 而不是 repository 擁有者，fine-grained 權杖可能無法選到這個 repository。這種情況請改用 [classic token](https://github.com/settings/tokens/new) 並勾選 `repo` 權限，或者請管理員把 repository 轉到 organization。
- 萬一權杖不小心外洩，到 GitHub 的 Settings → Developer settings 刪除它，再產生一個新的。

## 常見問題

**改完之後網站沒有變？**
GitHub Pages 需要一至兩分鐘重新發佈。之後按 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> 強制重新載入。

**卡片是空白的？**
多數是封面圖路徑打錯。路徑要由 `media/` 開始，並且完全對應 GitHub 上的檔名（英文大小寫也要一樣）。

**不小心關了編輯器？**
草稿會存在同一部電腦、同一個瀏覽器裡面，重新開啟編輯器就會自動載回。換電腦或清除瀏覽器資料就會消失，所以建議一次做完就發佈。發佈後網站追上了草稿的內容，編輯器下次開啟時會自動清走那份草稿。

**一鍵發佈說「沒有權限」？**
權杖的 Contents 權限要設為 **Read and write**，而且 Repository access 要包含這個 repository。改完之後要重新產生一個權杖，舊的不會自動更新權限。

**兩個人同時改？**
編輯器的草稿是各自獨立的，後發佈的一方會覆蓋先發佈的一方。一鍵發佈會在偵測到 GitHub 上的內容有變時先警告你，但最安全還是同一時間只由一人負責發佈。

---

# 第二部分：給開發者

## 專案結構

```text
index.html                   網站外殼
admin.html                   內容編輯器（無需程式基礎）
data/
  content.js                 所有五行與卡片資料（唯一內容來源）
assets/
  css/styles.css             網站樣式
  css/admin.css              編輯器樣式
  js/app.js                  路由、搜尋、篩選、顯示
  js/admin.js                編輯器邏輯與 content.js 產生器
  js/markdown.js             文章 Markdown 轉換器
  js/media.js                影片嵌入與圖片燈箱
media/
  overview/                  五行總覽圖
  metal/ wood/ water/ fire/ earth/
tools/
  area-volume/index.html     面積與體積 3D 探索器
```

## 本機預覽

雙擊 `index.html`。內容使用 `data/content.js` 載入，所以即使網址以 `file://` 開頭也能正常運作。

若要模擬網站伺服器，可在專案目錄執行：

```powershell
python -m http.server 8000
```

然後開啟 `http://localhost:8000`。

## 內容資料格式

`data/content.js` 匯出單一 `window.DATABANK` 物件，包含 `site`、`elements` 及 `items`。每個 `id` 必須唯一，`element` 必須是 `metal`、`wood`、`water`、`fire` 或 `earth`。

```js
{
  id: "my-teaching-demo",
  element: "fire",
  type: "video",
  title: "教學示範標題",
  subtitle: "一行簡介",
  tags: ["#數學", "#視覺衝擊"],
  cover: "media/fire/my-cover.jpg",
  video: { provider: "vimeo", id: "123456789" },
  subject: "數學",
  form: "S2",
  topic: "JM13 · Algebraic Fractions",
  level: "中層水",
  tla: "T + L",
  duration: "6:30",
  date: "2026-08-08"
}
```

支援的 `type`：`video`、`image`、`article`、`tool`。一張卡片可以同時包含 `video`、`images`、`body` 與 `tool`，`type` 只決定卡片顯示的主要類型。

`form` 與 `topic` 會自動變成元素頁的篩選下拉選單，因此同一主題請使用一致的寫法。

## 影片

```js
video: { provider: "local", src: "media/fire/demo.mp4" }
video: { provider: "vimeo", id: "76979871" }
video: { provider: "youtube", id: "dQw4w9WgXcQ" }
```

影片採用「點擊後才載入播放器」，避免首頁一次載入多個 iframe。請確認 Vimeo 影片的私隱設定允許在 GitHub Pages 網域嵌入。

## 圖片集

```js
images: [
  { src: "media/water/page-1.jpg", alt: "第一頁：情緒承接流程" },
  { src: "media/water/page-2.jpg", alt: "第二頁：提問範例" }
],
imageLayout: "document"
```

`imageLayout: "document"` 會完整顯示整頁（適合教案掃描件）；省略則裁切成一致高度（適合相片）。

## 互動工具

每個工具是一個自包含的 HTML 頁面，例如 `tools/my-tool/index.html`，然後在卡片加入：

```js
type: "tool",
tool: "tools/my-tool/index.html"
```

詳情頁會以 iframe 顯示工具，並提供「全螢幕開啟」連結。工具應使用相對路徑載入自己的資源，並在手機寬度下保持可用。

## 五行總覽圖

`media/overview/wuxing-overview.svg` 是手寫的 SVG（1600 × 900），首頁「五行總覽」區塊會直接引用。修改元素角色或武器時，記得同步更新這張圖與 `data/content.js` 的 `elements`。

## 編輯器如何產生 content.js

`assets/js/admin.js` 讀取已載入的 `window.DATABANK`，把修改存在 `localStorage`（key：`wuxing-admin-draft`），發佈時用內建序列化器輸出格式一致的 JavaScript：字串用 `JSON.stringify`，`body` 用樣板字串以保留 Markdown 換行。因此手動編輯與編輯器輸出可以互換使用。

開啟編輯器時，如果草稿序列化後與已發佈的 `content.js` 完全相同，該草稿會自動清除，所以發佈成功並待 Pages 重建後不會殘留舊草稿。

## 一鍵發佈的運作方式

「直接發佈到 GitHub」使用 GitHub Contents API，全部在瀏覽器完成，沒有任何後端：

1. `GET /repos/{REPO}/contents/data/content.js?ref=main` 取得目前的 `sha` 及內容。
2. 把回傳內容以 `new Function` 求值，與載入編輯器時的 `window.DATABANK` 做正規化比較；不一致代表期間有人發佈過，會先要求確認。
3. `PUT` 同一路徑，附上新的 base64 內容與剛取得的 `sha`。

權杖存在 `localStorage`（key：`wuxing-admin-token`），只留在使用者的瀏覽器。HTTP 401／403／404／409 會翻譯成中文提示，見 `describeError()`。

如果 repository 搬家，請更新 `assets/js/admin.js` 頂部的 `REPO`、`BRANCH` 及 `SITE_URL` 常數。

## 發布到 GitHub Pages

1. 把這個資料夾的內容提交並推送到 `main` branch。
2. 前往 repository 的 **Settings → Pages**。
3. 在 **Build and deployment** 選擇 **Deploy from a branch**。
4. Branch 選 `main`，folder 選 `/ (root)`，按 **Save**。

專案包含 `.nojekyll`，GitHub Pages 會原樣發布所有靜態檔案。Hash 路由（例如 `#/fire/area-volume-demo`）不需要額外的 404 或 rewrite 設定。

## 內容維護檢查

新增或修改內容後：

1. 開啟首頁，確認總覽圖與卡片封面正常。
2. 測試元素頁的年級、主題、類型及 hashtag 篩選。
3. 用右上方搜尋輸入標題、科目及標籤。
4. 開啟詳情頁，測試影片、圖片燈箱、文章及工具。
5. 在手機寬度下檢查排版。
6. 確認瀏覽器 Console 沒有錯誤。
