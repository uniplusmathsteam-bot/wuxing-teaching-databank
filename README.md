# 五行教學資料庫

Notion Gallery 風格的靜態教學網站，以 Uni+ 2.0「三維動態教學系統」的五行戰術模組整理真實教學影片及戰術說明文章。

- 金 Metal：架構師／裁判
- 木 Wood：園丁／導航員
- 水 Water：說書人／治療師
- 火 Fire：表演者／啦啦隊
- 土 Earth：建築師／守護者

網站沒有套件、建置步驟或後端。直接開啟 `index.html` 即可在本機瀏覽，也可直接部署到 GitHub Pages。

## 專案結構

```text
index.html
data/
  content.js                 所有五行與卡片資料
assets/
  css/styles.css             網站樣式
  js/app.js                  路由、搜尋、篩選、顯示
  js/markdown.js             文章 Markdown 轉換器
  js/media.js                影片嵌入與圖片燈箱
media/
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

## 新增一張卡片

編輯 `data/content.js`，在 `items` 陣列加入物件。每個 `id` 必須唯一，`element` 必須是 `metal`、`wood`、`water`、`fire` 或 `earth`。

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
  level: "中層水",
  tla: "T + L",
  duration: "6:30",
  date: "2026-08-08"
}
```

支援的 `type`：

- `video`：影片
- `image`：圖片集
- `article`：文章
- `tool`：互動工具

一張卡片可以同時包含 `video`、`images`、`body` 與 `tool`。`type` 只決定卡片顯示的主要類型。

## 嵌入 Vimeo 或 YouTube

Vimeo 影片網址：

```text
https://vimeo.com/76979871
```

其中 `76979871` 是影片 ID：

```js
video: { provider: "vimeo", id: "76979871" }
```

YouTube 也受支援：

```js
video: { provider: "youtube", id: "dQw4w9WgXcQ" }
```

影片採用「點擊後才載入播放器」，避免首頁一次載入多個 iframe。請確認 Vimeo 影片的私隱設定允許在你的 GitHub Pages 網域嵌入。

目前資料庫只顯示 4 段本機教學影片及 5 篇根據 V12 PDF 整理的五行戰術文章；Vimeo／YouTube 支援保留供日後新增內容使用。

## 新增圖片或圖片集

1. 把圖片放到對應元素資料夾，例如 `media/water/emotion-demo.jpg`。
2. 使用相對路徑設定封面：

```js
cover: "media/water/emotion-demo.jpg"
```

3. 圖片集使用：

```js
images: [
  { src: "media/water/page-1.jpg", alt: "第一頁：情緒承接流程" },
  { src: "media/water/page-2.jpg", alt: "第二頁：提問範例" }
]
```

建議：

- 封面比例使用 16:9，例如 1600 × 900。
- 相片使用 JPG 或 WebP；有透明背景的圖解使用 PNG 或 SVG。
- 每張圖片都填寫清楚的 `alt`，方便無障礙閱讀。
- 不要提交學生姓名、樣貌或其他個人資料，除非已取得適當同意。

## 新增文章

使用反引號包住 Markdown 內容：

```js
{
  id: "new-article",
  element: "metal",
  type: "article",
  title: "新文章",
  subtitle: "文章摘要",
  tags: ["#SOP"],
  cover: "media/metal/cover.svg",
  body: `
## 小標題

一般段落支援 **粗體**、*斜體*、清單、連結、引用、程式碼及表格。

> 這是一段引用。
`
}
```

內置 Markdown 轉換器支援標題、粗體、斜體、刪除線、連結、圖片、引用、清單、程式碼區塊、分隔線及表格。

## 新增互動工具

每個工具是一個自包含的 HTML 頁面：

```text
tools/my-tool/index.html
```

在卡片加入：

```js
type: "tool",
tool: "tools/my-tool/index.html"
```

詳情頁會以 iframe 顯示工具，並提供「全螢幕開啟」連結。工具應使用相對路徑載入自己的資源，並在手機寬度下保持可用。

## 發布到 GitHub Pages

1. 在 GitHub 建立新的 repository。
2. 把這個資料夾的內容提交並推送到 `main` branch。
3. 前往 repository 的 **Settings → Pages**。
4. 在 **Build and deployment** 選擇 **Deploy from a branch**。
5. Branch 選 `main`，folder 選 `/ (root)`，按 **Save**。
6. 等待 GitHub 顯示公開網址，通常是：

```text
https://你的帳號.github.io/repository名稱/
```

專案包含 `.nojekyll`，GitHub Pages 會原樣發布所有靜態檔案。Hash 路由（例如 `#/fire/area-volume-demo`）不需要額外的 404 或 rewrite 設定。

## 內容維護檢查

新增或修改內容後：

1. 開啟首頁，確認卡片封面正常。
2. 測試元素頁的類型及 hashtag 篩選。
3. 用右上方搜尋輸入標題、科目及標籤。
4. 開啟詳情頁，測試影片、圖片燈箱、文章及工具。
5. 在手機寬度下檢查排版。
6. 確認瀏覽器 Console 沒有錯誤。
