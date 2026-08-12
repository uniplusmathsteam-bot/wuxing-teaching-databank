window.DATABANK = {
  site: {
    title: "五行教學資料庫",
    subtitle: "Wuxing Teaching Databank",
    description: "以五行戰術整理教學影片與教學方法文章。",
    version: "Uni+ 2.0 · 三維動態教學系統 V12.0"
  },

  elements: [
    {
      id: "metal",
      zh: "金",
      en: "Metal",
      role: "架構師 / 裁判",
      functions: ["建立標準", "拆解難題", "除錯 Debug"],
      weapons: ["SOP 手術刀", "陷阱雷達"],
      caution: "全堂使用會太高壓，需搭配火／水調節。",
      accent: "#d4a94e",
      rgb: "212, 169, 78"
    },
    {
      id: "wood",
      zh: "木",
      en: "Wood",
      role: "園丁 / 導航員",
      functions: ["構建知識體系", "激發聯想", "舉一反三"],
      weapons: ["思維導圖", "鷹架 Scaffolding"],
      caution: "發散過度會離題，需用金來修剪。",
      accent: "#66a86f",
      rgb: "102, 168, 111"
    },
    {
      id: "water",
      zh: "水",
      en: "Water",
      role: "說書人 / 治療師",
      functions: ["處理情緒", "建立共情", "價值重塑"],
      weapons: ["故事掛鉤", "情緒緩衝墊"],
      caution: "太溫柔會導致散漫，需用土來立規矩。",
      accent: "#559fcb",
      rgb: "85, 159, 203"
    },
    {
      id: "fire",
      zh: "火",
      en: "Fire",
      role: "表演者 / 啦啦隊",
      functions: ["搶奪注意力", "點燃動機", "打破沉悶"],
      weapons: ["高頻互動", "視覺衝擊"],
      caution: "過度亢奮會只玩不學，需接土來靜心。",
      accent: "#eb6a45",
      rgb: "235, 106, 69"
    },
    {
      id: "earth",
      zh: "土",
      en: "Earth",
      role: "建築師 / 守護者",
      functions: ["鞏固基礎", "建立習慣", "提供安全感"],
      weapons: ["刻意練習", "錯題本"],
      caution: "太沉悶會厭學，需插播木／火來鬆土。",
      accent: "#ad8151",
      rgb: "173, 129, 81"
    }
  ],

  subjects: [
    { id: "mathematics", zh: "數學", en: "Mathematics" },
    { id: "physics", zh: "物理", en: "Physics" },
    { id: "chemistry", zh: "化學", en: "Chemistry" },
    { id: "biology", zh: "生物", en: "Biology" },
    { id: "integrated-science", zh: "綜合科學", en: "Integrated Science" },
    { id: "chinese", zh: "中文", en: "Chinese" }
  ],

  items: [
    {
      id: "metal-tactical-module",
      element: "metal",
      type: "article",
      title: "五行戰術模組：金 Metal",
      subtitle: "架構師與裁判：建立標準、拆解難題，讓解題過程可以追蹤及除錯。",
      tags: ["#五行戰術模組", "#金", "#Metal", "#SOP", "#SystematicSolving"],
      cover: "media/metal/tactical-module-cover.png",
      level: "戰術說明",
      tla: "動態切換",
      date: "2026-08-09",
      body: `
## 金：架構師 / 裁判

金元素負責建立清晰標準、拆解難題及除錯（Debug）。它像課堂中的架構師，把複雜任務整理成學生可以跟隨的路徑；也像裁判，指出答案與過程是否符合標準。

### 核心功能

- **建立標準：** 先說清楚成功條件、書寫格式及檢查點。
- **拆解難題：** 把一個大問題切成 Step 1、Step 2、Step 3。
- **除錯：** 找出錯誤發生在哪一步，而不是只判斷最終答案。

### 戰術武器

1. **SOP 手術刀：** 將題目切分為固定步驟，讓每一步都可重複、可檢查。
2. **陷阱雷達：** 指出 Past Paper 常見的扣分位，例如漏寫單位、跳步或符號錯誤。

### 課堂應用

當學生答案正確但步驟缺失，金可要求學生補回完整過程，再配合土進行刻意練習。顏色編碼、對齊格式及逐步驗算都屬於金的結構化工具。

### 平衡提醒

> 全堂只使用金會帶來過高壓力。完成標準建立與除錯後，應搭配火重新點燃動機，或用水承接挫敗感。

五行不與 TLA 階段固定綁定；導師應按學生的即時狀態切換戰術。
`
    },
    {
      id: "s2-jm12-identities-factorization-colour-structure",
      element: "metal",
      type: "video",
      title: "S2 JM12 Identities and Factorization：Colour-Coded Systematic Solving",
      subtitle: "以一致的顏色區分係數、代數項、運算符號與指數，再按固定步驟完成恆等式及因式分解。",
      tags: ["#ColourCoding", "#ColorCoding", "#S2", "#JM12", "#Identities", "#Factorization", "#SystematicSolving", "#Gold", "#金"],
      cover: "media/metal/s2-jm12-identities-factorization-colour-structure-thumbnail.jpg",
      video: { provider: "local", src: "media/metal/s2-jm12-identities-factorization-colour-structure.mp4" },
      subject: "mathematics",
      form: "S2",
      topic: "JM12 · Identities and Factorization",
      level: "中層水",
      tla: "T + L",
      duration: "1:13",
      date: "2026-08-09",
      featured: true,
      body: `
## 金元素：用顏色建立解題結構

影片以固定顏色標示不同角色：外層係數、第一個代數項、第二個代數項、運算符號與指數各自保持一致。學生可以先看見結構，再開始運算，減少漏項、錯號及指數處理錯誤。

### 系統化解題流程

1. **辨認外層：** 先圈出括號外的係數與指數。
2. **拆分內層：** 用不同顏色標示兩個代數項及中間符號。
3. **配對恆等式：** 判斷題目符合哪一個標準公式。
4. **逐層處理：** 一次只展開一層，保留所有顏色對應。
5. **最後檢查：** 核對符號、係數、次數及同類項。

顏色不是裝飾，而是一套可重複使用的視覺 SOP。這正是金元素的架構師角色：把每道題整理成可追蹤、可檢查的解題路徑。
`
    },
    {
      id: "s3-jm29-quadrilaterals-structural-lesson-plan",
      element: "metal",
      type: "image",
      title: "S3 JM29 Quadrilaterals：Structural Lesson Plan",
      subtitle: "以四個 TLA 循環編排四邊形性質、證明框架、DSE 題型與分層延伸，形成清晰可執行的課堂結構。",
      tags: ["#S3", "#JM29", "#Quadrilaterals", "#LessonPlan", "#TLA", "#StructuralPlanning", "#Gold", "#金"],
      cover: "media/metal/s3-jm29-quadrilaterals-lesson-plan/page-1.jpg",
      imageLayout: "document",
      images: [
        {
          src: "media/metal/s3-jm29-quadrilaterals-lesson-plan/page-1.jpg",
          alt: "S3 JM29 Quadrilaterals structural lesson plan page 1：first and second TLA cycles"
        },
        {
          src: "media/metal/s3-jm29-quadrilaterals-lesson-plan/page-2.jpg",
          alt: "S3 JM29 Quadrilaterals structural lesson plan page 2：third and fourth TLA cycles"
        }
      ],
      subject: "mathematics",
      form: "S3",
      topic: "JM29 · Quadrilaterals",
      level: "結構化教案",
      tla: "4 TLA cycles",
      duration: "120 mins",
      date: "2026-08-09",
      featured: true,
      body: `
## 金元素：把整課編排成可執行結構

這份 S3 JM29 四邊形精讀教案以四個 TLA 循環分配約 120 分鐘，將概念輸入、指定練習與應用題清楚分段。

### 課堂結構

1. **第一循環（約 25 分鐘）：** 平行四邊形證明與四項性質，配合角度、判斷及 DSE 題型。
2. **第二循環（約 40 分鐘）：** 菱形、長方形與正方形，加入面積、作圖、邏輯流程及分層延伸。
3. **第三循環（約 10 分鐘）：** 中點定理與截線定理，訓練加輔助線及考試題型辨認。
4. **第四循環（約 45 分鐘）：** 平行四邊形證明答題框架，集中處理常見 DSE 與校本題型。

彩色標記把 T、L、A、時間、必做題及快生延伸分開，讓導師可以快速掌握課堂節奏，亦方便課後檢討每個環節的完成度。
`
    },

    {
      id: "wood-tactical-module",
      element: "wood",
      type: "article",
      title: "五行戰術模組：木 Wood",
      subtitle: "園丁與導航員：建立知識體系、激發聯想，引導學生舉一反三。",
      tags: ["#五行戰術模組", "#木", "#Wood", "#MindMap", "#Scaffolding"],
      cover: "media/wood/tactical-module-cover.png",
      level: "戰術說明",
      tla: "動態切換",
      date: "2026-08-09",
      body: `
## 木：園丁 / 導航員

木元素負責構建知識體系、激發聯想及舉一反三。它像園丁，讓一個核心概念長出分支；也像導航員，幫助學生看見新知識與既有經驗之間的路線。

### 核心功能

- **構建體系：** 把零散知識整理成有層次的網絡。
- **激發聯想：** 連接生活例子、舊概念及其他學科。
- **舉一反三：** 改變條件或情境，測試學生能否遷移方法。

### 戰術武器

1. **思維導圖：** 畫出知識樹，顯示核心概念、公式、例子及常見迷思。
2. **鷹架 Scaffolding：** 使用填空式筆記或分段提示，再逐步撤走支援。

### 課堂應用

當學生眼神呆滯或缺乏關聯感，可以先用火奪回注意力，再用木重新建立概念連接。當全班掉入同一陷阱，可先用水承接挫折，再用木把公式拆開重建。

### 平衡提醒

> 木若過度發散，課堂會離題。建立足夠聯想後，要用金訂立邊界、修剪枝節並整理成可檢查的結論。

五行不與 TLA 階段固定綁定；導師應按學生的即時狀態切換戰術。
`
    },

    {
      id: "water-tactical-module",
      element: "water",
      type: "article",
      title: "五行戰術模組：水 Water",
      subtitle: "說書人與治療師：處理情緒、建立共情，透過故事完成價值重塑。",
      tags: ["#五行戰術模組", "#水", "#Water", "#Storytelling", "#Empathy"],
      cover: "media/water/tactical-module-cover.png",
      level: "戰術說明",
      tla: "動態切換",
      date: "2026-08-09",
      body: `
## 水：說書人 / 治療師

水元素負責處理情緒、建立共情及價值重塑。它像說書人，以情境和軼事把抽象知識變得可感受；也像治療師，先承接學生的挫敗，再引導其返回問題。

### 核心功能

- **處理情緒：** 先降低防禦心，讓學生願意繼續嘗試。
- **建立共情：** 準確說出學生正在面對的困難。
- **價值重塑：** 把錯誤由失敗改寫成可用的學習線索。

### 戰術武器

1. **故事掛鉤：** 用軼事、角色或生活情境軟化枯燥知識。
2. **情緒緩衝墊：** 先承接挫敗感，再分析問題及重建方法。

### 課堂應用

當錯誤率突然上升，先用水表示理解，再用木提煉錯誤中的合理邏輯，說明該邏輯在另一情境下為何可能成立，最後引導學生回到當前條件。

### 平衡提醒

> 水若過度溫柔，學生可能失去節奏與規矩。情緒穩定後，要接土建立界線、完成練習及鞏固習慣。

五行不與 TLA 階段固定綁定；導師應按學生的即時狀態切換戰術。
`
    },
    {
      id: "comic-demo-water",
      element: "water",
      type: "video",
      title: "S3 JM27 Percentages：Comic Demo",
      subtitle: "透過漫畫情境探索百分比、折扣與售價，建立數學概念和故事的連結。",
      tags: ["#Comics", "#S3", "#JM27", "#Percentages", "#Discounts", "#Mathematics", "#水"],
      cover: "media/water/comic-demo-water-thumbnail.jpg",
      video: { provider: "local", src: "media/water/comic-demo-water-element.mp4" },
      subject: "mathematics",
      form: "S3",
      topic: "JM27 · Percentages",
      level: "中層水",
      tla: "T + L",
      duration: "2:00",
      date: "2026-08-08",
      featured: true
    },

    {
      id: "fire-tactical-module",
      element: "fire",
      type: "article",
      title: "五行戰術模組：火 Fire",
      subtitle: "表演者與啦啦隊：搶奪注意力、點燃動機，以高頻互動打破沉悶。",
      tags: ["#五行戰術模組", "#火", "#Fire", "#Interaction", "#VisualImpact"],
      cover: "media/fire/tactical-module-cover.png",
      level: "戰術說明",
      tla: "動態切換",
      date: "2026-08-09",
      body: `
## 火：表演者 / 啦啦隊

火元素負責搶奪注意力、點燃動機及打破沉悶。它像表演者，以節奏和視覺刺激重新聚焦全班；也像啦啦隊，把學生的微小勝利放大，形成正向增益。

### 核心功能

- **搶奪注意力：** 在認知疲勞時快速重置課堂焦點。
- **點燃動機：** 讓學生願意立即參與及嘗試。
- **打破沉悶：** 改變語調、節奏及互動方式。

### 戰術武器

1. **高頻互動：** 快問快答、Kahoot!、即時投票及短回合挑戰。
2. **視覺衝擊：** 動畫、震撼演示、誇張語調及清晰的畫面變化。

### 課堂應用

學生出現認知疲勞時，先用火要求全班放下筆、望向畫面或參與快速挑戰，再接木重新建立概念關聯。學生完成關鍵動作時，可用火大聲宣告微小勝利。

### 平衡提醒

> 火若過度亢奮，學生可能只玩不學。完成互動後要接土安定節奏，把發現寫成公式、筆記或練習成果。

五行不與 TLA 階段固定綁定；導師應按學生的即時狀態切換戰術。
`
    },
    {
      id: "s2-jm13-algebraic-fractions-interactive-tools",
      element: "fire",
      type: "video",
      title: "S2 JM13 Algebraic Fractions：Interactive Tools",
      subtitle: "透過可切換解釋、逐步動畫與即時操作，把代數分式約簡變成高參與度的視覺探索。",
      tags: ["#InteractiveTools", "#S2", "#JM13", "#AlgebraicFractions", "#Mathematics", "#VisualLearning", "#火"],
      cover: "media/fire/s2-jm13-algebraic-fractions-interactive-tools-thumbnail.jpg",
      video: { provider: "local", src: "media/fire/s2-jm13-algebraic-fractions-interactive-tools.mp4" },
      subject: "mathematics",
      form: "S2",
      topic: "JM13 · Algebraic Fractions",
      level: "中層水",
      tla: "T + L",
      duration: "3:17",
      date: "2026-08-09",
      featured: true
    },
    {
      id: "s3-jm26-inequalities-animation",
      element: "fire",
      type: "video",
      title: "S3 JM26 Inequalities：Animation Demo",
      subtitle: "以動態視覺呈現不等號、數線與不等式概念，快速吸引學生注意力。",
      tags: ["#Animation", "#S3", "#JM26", "#Inequalities", "#Mathematics", "#VisualLearning", "#火"],
      cover: "media/fire/s3-jm26-inequalities-animation-thumbnail.jpg",
      video: { provider: "local", src: "media/fire/s3-jm26-inequalities-animation.mp4" },
      subject: "mathematics",
      form: "S3",
      topic: "JM26 · Inequalities",
      level: "中層水",
      tla: "T + L",
      duration: "4:00",
      date: "2026-08-09",
      featured: true
    },
    {
      id: "s3-jm26-inequalities-gamification",
      element: "fire",
      type: "video",
      title: "S3 JM26 Inequalities：Gamification Demo",
      subtitle: "透過互動挑戰、即時回饋與數線操作，把不等式練習轉化為遊戲化學習。",
      tags: ["#Gamification", "#S3", "#JM26", "#Inequalities", "#Mathematics", "#InteractiveLearning", "#火"],
      cover: "media/fire/s3-jm26-inequalities-gamification-thumbnail.jpg",
      video: { provider: "local", src: "media/fire/s3-jm26-inequalities-gamification.mp4" },
      subject: "mathematics",
      form: "S3",
      topic: "JM26 · Inequalities",
      level: "中層水",
      tla: "L + A",
      duration: "2:50",
      date: "2026-08-09",
      featured: true
    },

    {
      id: "earth-tactical-module",
      element: "earth",
      type: "article",
      title: "五行戰術模組：土 Earth",
      subtitle: "建築師與守護者：鞏固基礎、建立習慣，為學生提供穩定與安全感。",
      tags: ["#五行戰術模組", "#土", "#Earth", "#DeliberatePractice", "#MistakeNotebook"],
      cover: "media/earth/tactical-module-cover.png",
      level: "戰術說明",
      tla: "動態切換",
      date: "2026-08-09",
      body: `
## 土：建築師 / 守護者

土元素負責鞏固基礎、建立習慣及提供安全感。它像建築師，以穩固步驟建立可持續的學習結構；也像守護者，用清晰界線和可預測節奏維持課堂秩序。

### 核心功能

- **鞏固基礎：** 讓學生重複正確方法，直至穩定。
- **建立習慣：** 把畫圖、對齊、寫單位及驗算變成固定動作。
- **提供安全感：** 以一致規則和節奏降低不確定性。

### 戰術武器

1. **刻意練習：** 反覆操練同類題型，每一輪集中修正一個弱點。
2. **錯題本：** 累積原題、錯因、修正方法及變式，讓錯誤成為學習資產。

### 課堂應用

當學生答題過快、錯誤率高或氣氛浮躁，先用土穩住陣腳，再用金重新建立三個可執行標準。火所宣告的微小勝利，也可由土固化為全班 SOP。

### 平衡提醒

> 土若過度沉悶，學生會失去動機。基礎穩定後，應插播木來建立新關聯，或用火提升能量及參與度。

五行不與 TLA 階段固定綁定；導師應按學生的即時狀態切換戰術。
`
    }
  ]
};
