# CSS 手写面试题库-我负责模块（big-customer，面向面试）

> 目标：从你负责模块里“真实出现过的 CSS 场景”抽题，面试时可以现场手写（或口述）并能顺带讲出工程取舍。

关联页面/组件入口（便于你举例）：
- 资源开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:1`
- 资源在场列表：`pages/resourceManagement/onSite.vue:1`
- 资源详情页：`pages/resourceManagement/resourceDetail/_id.vue:4539`
- 订单管理列表：`pages/orderManagement/orderList.vue:1830`
- 译员平台：`pages/translator/index.vue:873`
- 卡片主题色（CSS 变量）：`components/OrderDetail/CardWrapper.vue:137`、`components/ResourceDetail/CardWrapper.vue:191`
- PDF 预览弹窗（flex 布局）：`components/PdfPreviewModal.vue:1`

---

## 1) 手写题：单行省略号（ellipsis）

题目：
实现一个宽度固定的文本容器，超过一行显示 `...`，并且不换行。

答案（手写）：

```css
.ellipsis-1 {
  width: 240px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

加分点（工程坑）：
- 如果父容器是 `display: flex`，想让子项 ellipsis 生效，通常需要给文本项加 `min-width: 0`（否则 flex item 默认最小内容宽度会撑开）。
- 你项目里就用过这个坑的解决方式：`pages/translator/index.vue:946`（`.main-content { min-width: 0; }`）、`pages/resourceManagement/resourceDetail/_id.vue:4631`（`min-width: 0`）。

---

## 2) 手写题：多行省略号（4 行 line-clamp）

题目：
实现一个段落文本最多显示 4 行，超过显示省略号。

答案（手写，WebKit 方案）：

```css
.ellipsis-4 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}
```

项目例子：
- `pages/resourceManagement/onSite.vue:897`（`.wrap-cell` 就是 4 行省略方案）

追问怎么答：
- `line-clamp` 不是统一标准实现，主流仍以 `-webkit-line-clamp` 为主；如果要更通用，需要 JS 量测或“渐隐遮罩”方案（成本更高）。

---

## 3) 手写题：`position: sticky` 侧栏（滚动吸附）

题目：
实现一个侧栏：页面向下滚动时，侧栏在距离顶部 `84px` 的位置吸附（不脱离文档流）。

答案：

```css
.sidebar {
  position: sticky;
  top: 84px;
}
```

项目例子：
- `pages/translator/index.vue:880`（`.sidebar { position: sticky; top: 84px; }`）

高频追问（必须会）：
1) sticky 什么时候会失效？
   - 祖先元素有 `overflow: hidden/auto/scroll` 且形成滚动容器时，sticky 以该容器为参照；如果你以为它对 viewport 吸附，会“看起来失效”。
   - 祖先元素有 `transform/filter/perspective` 等创建新的 containing block/stacking context 时，也可能出现层级/定位异常，需要检查。
2) sticky vs fixed 怎么选？
   - sticky 不脱离文档流，更适合“侧栏跟随”；fixed 适合全局悬浮（但容易遮挡内容，需要 padding 占位）。

---

## 4) 手写题：Flex 两列布局（左侧固定宽，右侧自适应且可收缩）

题目：
左侧侧栏 `160px` 固定，右侧内容自适应，占满剩余空间，并且右侧内容允许缩小（例如内部长表格不会把布局撑爆）。

答案：

```css
.layout {
  display: flex;
  gap: 20px;
}
.sidebar {
  width: 160px;
  flex-shrink: 0;
}
.content {
  flex: 1;
  min-width: 0;
}
```

项目例子：
- `pages/translator/index.vue:874`（`.translator-page` + `.sidebar` + `.main-content`）

追问怎么答：
- `min-width: 0` 是关键：否则 flex item 的最小宽度是内容宽度，导致右侧区域不收缩，出现横向溢出或 ellipsis 失效。

---

## 5) 手写题：CSS Grid + CSS 变量动态列数（`--cols`）

题目：
实现一个表单布局，默认 3 列；支持通过内联 style 设置 `--cols`，从而动态切换 1/2/3/4 列。

答案：

```css
.grid-form {
  display: grid;
  grid-template-columns: repeat(var(--cols, 3), 1fr);
  column-gap: 16px;
  row-gap: 8px;
}
```

项目例子：
- 资源详情页：`pages/resourceManagement/resourceDetail/_id.vue:4623`
- 译员平台也用同一套思路：`pages/translator/index.vue:315`

加分追问：
- 为什么用 CSS 变量而不是写多套 class？
  - 变量让“列数”成为数据驱动（组件/页面可传参），可复用更高；你在多个卡片/页面复用同一套 grid 规则（对齐 `utils/resource` 的复用理念）。

---

## 6) 手写题：Grid “回填空位”（`grid-auto-flow: row dense`）

题目：
当某些表单项跨列（span 2 / span 3）时，希望后续项能自动回填前面空隙，减少大片留白。

答案：

```css
.grid-form {
  display: grid;
  grid-auto-flow: row dense;
}
```

项目例子：
- `pages/resourceManagement/resourceDetail/_id.vue:4564`、`pages/resourceManagement/resourceDetail/_id.vue:4626`

追问怎么答：
- `dense` 可能改变“视觉顺序”和 DOM 顺序不一致；表单这种“强顺序语义”场景，要控制好跨列项数量与布局，避免可用性问题。

---

## 7) 手写题：在 Vue2 `scoped` 样式里覆盖第三方组件（Ant Design Vue）

题目：
在 `scoped` 的 `<style>` 内，覆盖 `ant-table` 表头/单元格 padding。

答案（Vue2 常见写法）：

```scss
.inner-table {
  & /deep/ .ant-table-thead > tr > th { padding: 20px 4px; }
  & /deep/ .ant-table-tbody > tr > td { padding: 10px 4px; }
}
```

项目例子：
- `pages/orderManagement/orderList.vue:1845`

追问怎么答：
- 为什么需要 `/deep/`：`scoped` 会给选择器加属性选择器，导致无法命中子组件/第三方库内部 DOM；`/deep/` 让规则穿透。
- 替代方案：去掉 scoped、提高选择器层级、或给组件提供 `className`/`bodyStyle` 等官方入口（能不用 deep 就不用，deep 会让样式边界变“软”）。

---

## 8) 手写题：表头吸顶（两种实现思路：CSS sticky vs JS + fixed）

题目：
实现表格滚动到一定高度后，表头吸顶。

答案 A（CSS 方案，优先）：

```css
thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
}
```

答案 B（JS + fixed，项目实际用法）：
- 通过 JS 给表头加 class：`pages/orderManagement/orderList.vue:1000`
- 对 class 做 fixed：`pages/orderManagement/orderList.vue:1851`

```css
.fix-header {
  position: fixed;
  top: 0;
  z-index: 2;
  width: 100%;
}
```

追问怎么答（为什么项目用 B）：
- Ant Table 结构复杂（双表头/滚动容器/固定列），直接 sticky 可能和内部滚动冲突；JS+fixed 更可控，但要处理宽度对齐、z-index、滚动容器等细节。

---

## 9) 手写题：`calc(100vh - X)` 做自适应高度容器

题目：
实现一个区域高度始终为视口高度减去 200px，用于 PDF 预览/列表可视区。

答案：

```css
.panel {
  height: calc(100vh - 200px);
  overflow: auto;
}
```

项目例子：
- `pages/translator/resumePreview.vue:258`（`height: calc(100vh - 200px);`）
- 表格滚动高度也有类似（在组件 props 里）：`pages/resourceManagement/interpreterAndSuppliers.vue:38`

追问怎么答：
- 移动端 `100vh` 受地址栏影响可能抖动，严谨方案用 `dvh` 或 JS 写入 `--vh` 变量（但桌面后台系统一般可接受 `vh`）。

---

## 10) 手写题：主题色可配置（CSS 变量 + fallback）

题目：
实现一个卡片标题左侧竖条，颜色来自 `--theme-primary`，未设置时默认蓝色。

答案：

```css
.title::before {
  background: var(--theme-primary, #1890ff);
}
```

项目例子：
- `components/OrderDetail/CardWrapper.vue:137`

追问怎么答：
- 为什么用 CSS 变量：不改组件代码就能换主题（运营/不同子系统），并且支持运行时覆盖（例如在 body 上设置变量）。

---

## 11) 手写题：固定列滚动阴影（根据滚动位置 class 切换）

题目：
当表格横向滚动到中间/右侧时，左固定列出现阴影；当滚到中间/左侧时，右固定列出现阴影。

答案（依赖表格组件自动加的 class）：

```css
.ant-table-scroll-position-middle .ant-table-fixed-left,
.ant-table-scroll-position-right .ant-table-fixed-left {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
}

.ant-table-scroll-position-middle .ant-table-fixed-right,
.ant-table-scroll-position-left .ant-table-fixed-right {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
}
```

项目例子：
- `pages/resourceManagement/onSite.vue:960`（左侧阴影）
- `pages/resourceManagement/onSite.vue:1037`（右侧阴影）

追问怎么答：
- 阴影是“滚动提示”，解决固定列与可滚动区的边界感；属于 UX 提升点。

---

## 12) 手写题：为什么 `table-layout: fixed` 常和省略号一起出现？

题目：
解释 `table-layout: fixed` 的作用，并写出一段常见组合样式。

答案：
- `table-layout: fixed` 让列宽计算更稳定（按表格宽度/列宽），不会因为内容长短导致 reflow；更适合大量数据表格、固定列、ellipsis 场景。

手写示例：

```css
table {
  table-layout: fixed;
  width: 100%;
}
td .cell {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

项目例子：
- `pages/resourceManagement/onSite.vue:878`（`table-layout: fixed;`）

---

## 13) 手写题：弹窗内容区“上操作栏 + 中预览区 + 下翻页栏”三段式布局

题目：
实现一个固定高度的弹窗 body：顶部操作栏固定高度，中间内容区自适应占满可用高度并可滚动，底部翻页栏固定高度。

答案（flex 列布局）：

```css
.modal-body {
  height: 80vh;
  display: flex;
  flex-direction: column;
}
.toolbar { flex: 0 0 auto; }
.viewer { flex: 1; overflow: auto; }
.footer { flex: 0 0 auto; }
```

项目例子：
- 你项目里用的是“内联 bodyStyle + 内部容器类名”组合：`components/PdfPreviewModal.vue:7`

追问怎么答：
- 为什么不用 `position: fixed`：弹窗内部布局用 flex 更干净；fixed 会引入层级与滚动穿透问题。

---

## 14) 手写题：`z-index` 的“生效条件”和 sticky/fixed 的叠层规则

题目：
解释 `z-index` 什么时候不生效，并给一个 sticky/fixed 场景的正确写法。

答案要点：
- `z-index` 只对**定位元素**（`position` 不是 `static`）或 flex/grid item（在特定条件）生效。
- 叠层上下文（stacking context）由 `position + z-index`、`transform`、`opacity<1` 等创建；跨上下文比较 z-index 无意义。

手写示例：

```css
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
}
```

项目关联：
- 表头 fixed：`pages/orderManagement/orderList.vue:1851`（`z-index: 2`）
- 侧栏 sticky：`pages/translator/index.vue:886`（如果被遮挡，通常要查父级 stacking context）

---

## 15) 手写题：如何把“主题色覆盖”限制在某个模块内部（避免全局污染）

题目：
在 `scoped` 样式里，把某个卡片组件的主题色从蓝改成红，但只在当前页面生效。

答案：
- 做法：外层模块容器加 class（如 `.card-section`），在其下用 `/deep/` 精确命中组件内部关键节点。

项目例子（译员平台覆盖卡片主题色）：
- `pages/translator/index.vue:1019`

```scss
.card-section {
  /deep/ .card-wrapper .card-title::before {
    background: #ff4d4f;
  }
}
```

追问怎么答：
- 覆盖链路要“越短越稳”：能用组件暴露的 class/变量就别 deep；deep 是最后手段。

---

# 布局专项补充（我负责模块）

下面这些题更偏“布局能力/工程落地”，都是你负责模块里真实出现过的写法（固定头部、卡片布局、表格行内编辑布局、空状态居中等）。

---

## 16) 手写题：固定 Header（position: fixed）+ 内容区顶内边距避让

题目：
实现一个顶部固定的 Header（高度 64px），页面内容不被 Header 盖住（内容区需要下移/留白）。

答案（手写）：

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  z-index: 100;
  background: #fff;
}

.content {
  padding-top: 84px; /* header(64) + 间距(20) */
}
```

项目例子：
- 固定头部：`layouts/translator.vue:467`
- 内容区避让：`layouts/translator.vue:577`

追问怎么答：
- 为什么不是 `margin-top`：`padding-top` 让内容区内部整体下移，常配合 `box-sizing: border-box` 更好控；如果内容区本身要做背景/滚动，padding 更直观。

---

## 17) 手写题：居中容器（max-width + margin auto）+ 自适应 padding

题目：
实现一个页面容器：最大宽 1400，居中显示，小屏时保持左右 padding。

答案：

```css
.container {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
}
```

项目例子：
- header 内容区：`layouts/translator.vue:479`
- 页面内容区：`layouts/translator.vue:577`

---

## 18) 手写题：Header 三段式布局（左 Logo / 中导航 / 右操作）

题目：
写一个 header：左侧 logo 固定，中间导航居中，右侧用户操作靠右；中间区域随宽度拉伸。

答案（核心是：中间 `flex: 1` + `justify-content: center`，右侧 `margin-left: auto`）：

```css
.header-content {
  display: flex;
  align-items: center;
}
.nav {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 60px;
}
.actions {
  margin-left: auto;
  display: flex;
  gap: 20px;
}
```

项目例子：
- `layouts/translator.vue:479`（`.header-content`）
- `layouts/translator.vue:498`（`.nav-container`）
- `layouts/translator.vue:550`（`.user-actions`）

---

## 19) 手写题：卡片列表纵向布局（flex column + gap）

题目：
实现一个卡片容器：卡片纵向排列，每个卡片间距 16px，并且容器能在右侧自适应扩展。

答案：

```css
.main {
  flex: 1;
  min-width: 0;
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

项目例子：
- 右侧内容可收缩：`pages/translator/index.vue:945`
- 卡片容器：`pages/translator/index.vue:1007`

---

## 20) 手写题：标签/按钮列表自动换行（flex-wrap + gap）

题目：
一行里有很多 tag/按钮，空间不够要自动换行，且行/列都有统一间距。

答案：

```css
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
```

项目例子：
- `pages/resourceManagement/resourceDetail/_id.vue:4696`（`.tags-select`）

---

## 21) 手写题：两列“标签-值”布局（左固定宽，右自适应，左边可省略）

题目：
实现一个“字段查看态”：左侧 label 固定 120px，超长省略；右侧 value 自动占满剩余空间，多行可换行。

答案：

```css
.field-item {
  display: flex;
  align-items: flex-start;
}
.label {
  flex: 0 0 120px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.value {
  flex: 1;
  word-break: break-all;
}
```

项目例子：
- `pages/resourceManagement/resourceDetail/_id.vue:4577`

---

## 22) 手写题：行内编辑态的布局（输入框高度统一 + 复杂单元格 flex 伸缩）

题目：
表格某一行进入“编辑态”时：
1) 单元格背景固定为白色
2) 输入框/选择框高度统一 32px
3) 某个复杂单元格（语言对：两个 Select + 箭头）要能伸缩，避免撑爆

答案（核心思路）：

```scss
/* 编辑行：背景与 padding */
.editing-row > td {
  background: #fff;
}

/* 编辑行：控件高度统一 */
.editing-row .ant-input,
.editing-row .ant-select-selection--single,
.editing-row .ant-input-number {
  height: 32px;
}

/* 语言对：左右 select 自适应，中间箭头不压缩 */
.editing-row .language-pair {
  display: flex;
  align-items: center;
  gap: 6px;
}
.editing-row .language-pair .ant-select {
  flex: 1;
  min-width: 50px;
}
.editing-row .language-pair .arrow {
  flex-shrink: 0;
}
```

项目例子（完整实现可直接背）：
- `pages/resourceManagement/resourceDetail/_id.vue:4906`（编辑行背景/控件高度）
- `pages/resourceManagement/resourceDetail/_id.vue:4927`（语言对编辑态 flex）

---

## 23) 手写题：表格斑马纹（zebra-row）+ hover + 固定列背景一致

题目：
实现一个表格斑马纹：偶数行浅灰；hover 行高亮；并且固定列（fixed columns）背景也要跟随一致。

答案（手写要点）：

```css
/* 斑马纹 */
.zebra-row:nth-child(even) td {
  background: #fafafa;
}
/* hover 高亮 */
.ant-table-tbody > tr:hover > td {
  background: #e6f7ff !important;
}
/* fixed 列继承斑马纹与 hover */
.ant-table-tbody > tr.zebra-row:nth-child(even) > td.ant-table-fixed-columns-in-body {
  background: #fafafa;
}
.ant-table-tbody > tr:hover > td.ant-table-fixed-columns-in-body {
  background: #e6f7ff !important;
}
```

项目例子：
- `pages/resourceManagement/resourceDetail/_id.vue:4970`（斑马纹/hover）
- `pages/resourceManagement/resourceDetail/_id.vue:4993`（fixed 列背景继承）

---

## 24) 手写题：圆角卡片容器裁切（overflow: hidden）避免内部元素溢出

题目：
一个页面整体是“卡片”风格：有 border-radius，内部表格/分割线不能溢出圆角外。

答案：

```css
.card {
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
```

项目例子：
- 资源在场列表：`pages/resourceManagement/onSite.vue:861`
- 资源开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:1956`

---

## 25) 手写题：操作区按钮排列（横向/纵向两套布局）

题目：
同一页面里会遇到两种操作区：
1) 顶部工具条：左右两端对齐（左侧多个按钮，右侧分页/操作）
2) 表格操作列：按钮纵向排列，行间距固定

答案：

```css
/* 顶部工具条：左右分布 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.toolbar .left-actions {
  display: flex;
  gap: 12px;
}

/* 操作列：纵向 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
```

项目例子：
- 顶部工具条：`pages/resourceManagement/interpreterAndSuppliers.vue:1970`
- 操作列纵向：`pages/resourceManagement/interpreterAndSuppliers.vue:2025`
- 在场列表也同类：`pages/resourceManagement/onSite.vue:876`

---

## 26) 手写题：相对容器内“绝对铺满”子层（inset: 0）

题目：
实现一个预览区：外层相对定位；内部 PDF 容器绝对铺满；同时外层还能显示 loading/空态等居中元素。

答案：

```css
.wrapper {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.host {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}
.canvas {
  flex: 1;
  overflow: auto;
}
```

项目例子：
- `components/PdfPreviewModal.vue:226`（`.viewer-wrapper`）
- `components/PdfPreviewModal.vue:235`（`.pdf-host` + `inset: 0`）
- `components/PdfPreviewModal.vue:243`（`.pdf-canvas`）

---

## 27) 手写题：空状态垂直水平居中（flex column）

题目：
实现一个“无权限提示”区域：垂直/水平居中，最小高度 400，文本居中。

答案：

```css
.empty-state {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
```

项目例子：
- `layouts/translator.vue:587`

---

## 28) 手写题：下划线居中定位（absolute + transform）

题目：
导航项 active 时显示一条下划线，要求始终水平居中（不依赖具体文字宽度）。

答案：

```css
.nav-item { position: relative; }
.active-bar {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  height: 3px;
}
```

项目例子：
- `layouts/translator.vue:528`

---

## 29) 手写题：防止滚动条出现/消失导致布局抖动（scrollbar-gutter）

题目：
页面切换时如果有的页面有滚动条、有的没有，会导致整体横向抖动。如何解决？

答案（现代浏览器）：

```css
html {
  scrollbar-gutter: stable;
}
```

项目例子：
- `layouts/translator.vue:180`

追问怎么答：
- 老浏览器兼容：可以用 `overflow-y: scroll` 强制一直显示滚动条占位（但会让所有页面都出现滚动条）。

---

## 30) 手写题：sticky 侧栏在 flex 容器里“只包内容高度”

题目：
在 `display: flex` 的两列布局中，左侧侧栏要 sticky，并且不要被拉伸成和右侧同高（只包住自身内容高度）。

答案：

```css
.sidebar {
  position: sticky;
  top: 84px;
  align-self: flex-start; /* 防止被 stretch 拉满高度 */
  flex-shrink: 0;        /* 宽度不被压缩 */
}
```

项目例子：
- `pages/translator/index.vue:880`

---

## 31) 手写题：资源开发列表“信息密度”表格布局（固定行高 + 顶部对齐 + 单元格内纵向操作）

题目：
资源开发列表是一个“信息密度很高”的表格：
1) 每行固定高度（例如 115px）
2) 单元格内容顶部对齐（适配多行文本）
3) 操作列按钮纵向排列，行间距固定
请写出核心 CSS。

答案：

```css
/* 统一行高 */
.ant-table-tbody > tr,
.ant-table-tbody > tr > td {
  height: 115px;
}

/* 多行内容更适合顶部对齐 */
.ant-table-tbody > tr > td {
  vertical-align: top;
  line-height: 1.6;
}

/* 操作列：纵向按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
```

项目例子：
- 固定行高 + 顶部对齐：`pages/resourceManagement/interpreterAndSuppliers.vue:2004`
- 操作列纵向布局：`pages/resourceManagement/interpreterAndSuppliers.vue:2025`

---

## 32) 手写题：资源开发列表固定列与主表列“padding 对齐”问题

题目：
Ant Table 有固定列时，主表区域和 fixed-left/right 区域是两套 DOM。如何让 fixed 列的 padding 和主表一致（否则会出现“列错位”视觉问题）？

答案（思路：分别覆盖 fixed 区域 th/td 的 padding）：

```css
/* 主表区 */
.ant-table-thead > tr > th { padding: 12px 2px; }
.ant-table-tbody > tr > td { padding: 12px 2px; }

/* fixed-left/fixed-right 区：单独覆盖 */
.ant-table-fixed-left .ant-table-thead > tr > th,
.ant-table-fixed-left .ant-table-tbody > tr > td,
.ant-table-fixed-right .ant-table-thead > tr > th,
.ant-table-fixed-right .ant-table-tbody > tr > td {
  padding: 12px 16px;
}
```

项目例子：
- 主表 padding：`pages/resourceManagement/interpreterAndSuppliers.vue:1992`
- fixed-left padding：`pages/resourceManagement/interpreterAndSuppliers.vue:2059`
- fixed-right padding：`pages/resourceManagement/interpreterAndSuppliers.vue:2112`

追问怎么答：
- 为什么要分开写：fixed 区域是独立表格结构，继承不到主表区的选择器。

---

## 33) 手写题：资源开发列表“横向滚动条美化”（webkit scrollbar）

题目：
表格横向滚动条默认很粗/很难看，如何在 WebKit 内核（Chrome）里把滚动条变成更细、更符合后台系统的风格？

答案：

```css
.ant-table-body {
  overflow-x: auto;
}
.ant-table-body::-webkit-scrollbar { height: 8px; }
.ant-table-body::-webkit-scrollbar-track { background: #f5f5f5; border-radius: 4px; }
.ant-table-body::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 4px; }
.ant-table-body::-webkit-scrollbar-thumb:hover { background: #bfbfbf; }
```

项目例子：
- `pages/resourceManagement/interpreterAndSuppliers.vue:2163`

---

## 34) 手写题：资源开发列表底部分页条布局（右对齐 + 上分割线）

题目：
列表底部分页器需要固定在右侧，并与表格区用分割线隔开，写出 CSS。

答案：

```css
.pagination-bottom {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
```

项目例子：
- `pages/resourceManagement/interpreterAndSuppliers.vue:2186`

---

## 35) 手写题：资源详情页“吸顶 Tab 导航”（sticky + 可配置 top）

题目：
资源详情页 Tab 导航需要吸顶，并且 top 不是写死值（要能从外部传入，适配不同 header 高度）。

答案（CSS + 解释）：

```css
.tab-nav {
  position: sticky;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}
```

其中 `top` 通常通过 inline style/变量注入（例如 `:style="{ top: stickyTop + 'px' }"`）。

项目例子：
- top 由 props 注入：`components/ResourceDetail/TabNav.vue:2`
- sticky 样式：`components/ResourceDetail/TabNav.vue:29`

---

## 36) 手写题：资源详情页“灰底 + 白卡片”背景与内容内边距

题目：
实现后台详情页常见的“灰色页面背景 + 内容区白色卡片列表”，并给卡片内容区左右 padding。

答案（示例）：

```css
.page {
  min-height: 100vh;
  background: #f9fafb;
}
.cards {
  padding: 0 24px 24px;
}
```

项目例子：
- 页面背景：`pages/resourceManagement/resourceDetail/_id.vue:4542`
- 内容区 padding：`pages/resourceManagement/resourceDetail/_id.vue:4547`

---

## 37) 手写题：资源详情页卡片间距（最后一张不留空）

题目：
卡片列表每张卡片之间有 16px 间距，但最后一张卡片不需要 margin-bottom，怎么写？

答案：

```css
.card-section { margin-bottom: 16px; }
.card-section:last-child { margin-bottom: 0; }
```

项目例子：
- `pages/resourceManagement/resourceDetail/_id.vue:4551`

---

## 38) 手写题：资源详情页编辑表单的“Grid 三列 + AntD FormItem 对齐”（label 固定宽 + 控件可收缩）

题目：
资源详情页编辑态使用 Ant Design Vue 的 `a-form-item`，同时外层用 Grid 做三列布局。要求：
1) label 宽度固定（比如 96px），每列对齐
2) control 区域占满剩余空间，且在窄屏/长内容时不会把网格撑爆（需要允许收缩）

答案（核心思路：给 label/control 设定 flex-basis，并给 control 加 `min-width: 0`）：

```scss
.grid-form {
  display: grid;
  grid-template-columns: repeat(var(--cols, 3), 1fr);
  column-gap: 16px;
}

/* 穿透 AntD 内部结构，固定 label 宽度 */
.grid-form /deep/ .ant-form-item-label {
  flex: 0 0 96px;
  max-width: 96px;
}

/* 关键：允许控件在 grid/flex 中收缩，否则会溢出/ellipsis 失效 */
.grid-form /deep/ .ant-form-item-control-wrapper {
  flex: 1;
  min-width: 0;
}
```

项目例子：
- `pages/resourceManagement/resourceDetail/_id.vue:4623`（`.grid-form`）
- `pages/resourceManagement/resourceDetail/_id.vue:4630`（label 固定宽）
- `pages/resourceManagement/resourceDetail/_id.vue:4631`（control `min-width: 0`）

---

## 39) 手写题：资源详情卡片头部布局（标题左/操作右，间距统一）

题目：
写一个可复用卡片组件的头部样式：
- 左侧标题
- 右侧一排操作（按钮/链接），水平居中对齐、间距统一
- 头部和内容区有分割线，收起时去掉分割线

答案：

```scss
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e8e8e8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.is-collapsed .card-header {
  border-bottom: none;
}
```

项目例子：
- `components/ResourceDetail/CardWrapper.vue:162`（`.card-header`）
- `components/ResourceDetail/CardWrapper.vue:196`（`.header-actions`）
- `components/ResourceDetail/CardWrapper.vue:234`（收起态去掉边框）

---

## 40) 手写题：`position: sticky` 在“非 window 滚动容器”里为什么会看起来不生效？

题目：
资源详情页的主内容区域并不是 window 在滚动，而是在 layout 的内容容器里 `overflow-y: auto` 滚动。
请解释 `position: sticky` 的参照系是什么，并写出一个“吸顶 TabNav”在滚动容器内稳定工作的最小写法。

答案（核心结论）：
- `sticky` 的参照系是**最近的可滚动祖先**（`overflow: auto/scroll` 的那个容器），不是一定相对 viewport。
- 所以当页面整体由某个容器滚动时，sticky 也会相对这个容器吸附；如果你以为是相对 window，就会觉得“不生效”。

手写最小示例：

```css
/* 滚动容器 */
.scroll-container {
  height: 100vh;
  overflow-y: auto;
}

/* 吸顶条：相对 scroll-container 吸顶 */
.sticky-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
}
```

项目例子：
- default layout 的滚动容器：`layouts/default.vue:24`（`overflowY: 'auto'`）
- 资源详情 TabNav 的 sticky：`components/ResourceDetail/TabNav.vue:29`
- 资源详情页还专门“找滚动容器”来做滚动定位/高亮：`pages/resourceManagement/resourceDetail/_id.vue:2656`

高频追问（必会）：
- sticky 还会被什么影响？祖先元素的 `transform`、`filter`、`perspective`、`contain` 等可能创建新的 containing block/stacking context，导致层级/定位异常；以及祖先 `overflow: hidden` 可能改变你预期的吸附参照系。

---

## 41) 手写题：页内导航滚动到锚点时，被 sticky 导航遮挡怎么办？

题目：
资源详情页点击 Tab 会滚动到对应 card section；但如果顶部有 sticky TabNav（以及 layout 自己的固定元素），容易出现“滚动到位后标题被遮挡”的问题。你有哪些 CSS/JS 解决方案？

答案（项目现状：JS 方案）：
- 通过滚动时做 offset（例如 `-100px`），避免被导航遮挡。

项目例子（资源详情点击 Tab 计算 offset）：`pages/resourceManagement/resourceDetail/_id.vue:2676`

答案（纯 CSS 方案，面试加分）：
- 让目标元素自带“滚动偏移”：

```css
.card-section {
  scroll-margin-top: 100px;
}
```

然后用：
- `element.scrollIntoView({ behavior: 'smooth' })`

追问怎么答：
- CSS 方案更“声明式”，适合统一处理锚点偏移；但如果滚动容器不是 window、且不同页面 sticky 高度不一致，仍可能需要 JS 动态计算（项目里就是用 JS 做了统一 `-100`）。

---

## 42) 手写题：固定侧边栏 + 右侧内容独立滚动（后台系统经典布局）

题目：
实现一个后台 layout：左侧 sider 固定（不跟随滚动），右侧内容区独立滚动；侧边栏收起时右侧内容自动左移并带过渡动画。

答案（核心要点）：

```css
/* 侧边栏固定 */
.sider {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

/* 右侧内容区独立滚动 */
.content {
  height: 100vh;
  overflow-y: auto;
  transition: margin-left 0.2s;
}
```

项目例子（layout 直接把这些写在内联 style 里）：
- 固定 sider：`layouts/default.vue:15`
- 内容区滚动 + margin-left 动画：`layouts/default.vue:24`
