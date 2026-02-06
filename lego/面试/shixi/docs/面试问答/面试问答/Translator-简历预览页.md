# 简历预览页 前端面试问答

## 前端面试官：你是如何实现 简历预览页 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：页面组件负责“解析路由参数 -> 拉取/构造 PDF 源 -> 渲染 PDF -> 分页/缩放适配 -> 下载”；PDF 渲染交给第三方组件 `vue-pdf-embed`（client-only 懒加载），页面只维护状态与交互。  
- **模板（HTML/组件）结构**：面包屑提供返回入口；内容卡片包含操作区（下载）、中间 viewer 区（空态/loading/error/pdf 宿主容器）、底部翻页按钮组。  
- **响应式数据与单向数据流**：`pdfUrl` 从 route query 计算得到，`blobUrl` 是“带认证 fetch 后的本地对象 URL”，viewerSource 优先使用 blobUrl；页码 `currentPage` 与 `pageCount` 驱动翻页按钮禁用状态。  
- **表单校验实现（JS）**：无表单校验；主要对 query 参数做兜底（无 url/file 时展示 empty），并对 fetch 失败设置错误状态。  
- **输入约束与联动**：  
  - 路由参数联动：监听 `$route.query.url/$route.query.file`，参数变化时重置页码并重新加载 PDF。  
  - 容器适配联动：监听 `currentPage` 以及 window resize，在 nextTick 后执行 `fitToContainer()`，根据容器宽高与 PDF 页面 viewport 计算 scale。  
  - backPath 联动：根据 `from` 参数（`contract/resume`）决定返回路径与面包屑文案，做到一套预览页同时复用给“合同预览/简历预览”。  
- **异步搜索下拉（Vue 事件 + 父子通信）**：该页无下拉搜索；异步逻辑主要是 `fetch(url)` 拉取 PDF，并使用 `credentials: 'include'` 保持鉴权。  
- **权限/状态驱动 UI（如有）**：登录/权限拦截由 `layouts/translator.vue` 处理；下载按钮 `:disabled="!pdfUrl"` 避免空链接误点。  
- **性能与体验细节（如有）**：  
  - PDF 组件用 dynamic import + client-only，避免 SSR 阶段报错并减小首屏体积。  
  - fetch 成功后把数据转成 `application/pdf` Blob 并 `URL.createObjectURL`，提升兼容性（后端返回 content-type 不正确时也能预览）。  
  - 离开页面时 `URL.revokeObjectURL` 释放内存，避免长时间预览导致泄漏。  
- **CSS/布局**：  
  - viewer 区固定高度 `calc(100vh - 200px)`，保证翻页区稳定在底部。  
  - canvas 最大宽高限制为 100%，搭配 `fitToContainer` 动态 scale，兼顾不同分辨率。  
  - 操作区与主题色覆盖统一为译员平台红色。  
- **可扩展性与复用**：该页以“URL 驱动”模式实现，未来可扩展为支持多文件、目录跳页（hash 参数）或增加缩放/旋转控件；并且通过 fromType 实现跨模块复用。
（在此填写追问补充句，保持此段落位置不变）
---

## 对应代码（节选/伪码）
> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）
```text
页面（如有）：pages/translator/resumePreview.vue
组件：pages/translator/resumePreview.vue
相关：layouts/translator.vue
相关：pages/translator/contract.vue（from=contract 的来源）
相关：pages/translator/index.vue（from=resume 的来源）
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`pages/translator/resumePreview.vue`

```js
const VuePdfEmbed = () => import('vue-pdf-embed/dist/vue2-pdf-embed')

export default {
  layout: 'translator',
  components: { VuePdfEmbed },
  data() {
    return { currentPage: 1, loading: false, blobUrl: '', error: '', scale: 1, pageCount: 0, pdfDoc: null }
  },
  computed: {
    pdfUrl() { return this.$route.query.url || this.$route.query.file || '' },
    viewerSource() { return this.blobUrl || (this.pdfUrl ? this.pdfUrl.split('#')[0] : '') },
    fromType() { return this.$route.query.from || 'resume' },
    backPath() { return this.fromType === 'contract' ? '/translator/contract' : '/translator' }
  },
  watch: {
    '$route.query.url'() { this.currentPage = 1; this.loadPdf() },
    '$route.query.file'() { this.currentPage = 1; this.loadPdf() },
    currentPage() { this.$nextTick(() => this.fitToContainer()) }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`pages/translator/resumePreview.vue`

```vue
<div class="resume-preview">
  <a-breadcrumb>
    <a-breadcrumb-item><n-link :to="backPath">{{ backLabel }}</n-link></a-breadcrumb-item>
    <a-breadcrumb-item>{{ pageTitle }}</a-breadcrumb-item>
  </a-breadcrumb>

  <div class="viewer-wrapper">
    <a-empty v-if="!pdfUrl && !loading" />
    <a-spin v-else-if="loading" tip="加载中..." />
    <a-result v-else-if="error" status="warning" title="PDF 加载失败" :sub-title="error" />
    <div v-else class="pdf-host" ref="pdfHost">
      <client-only>
        <vue-pdf-embed :source="viewerSource" :page="currentPage" :scale="scale" @loaded="onPdfLoaded" />
      </client-only>
    </div>
  </div>
</div>
```

### 4）关键交互与业务规则（节选）

文件：`pages/translator/resumePreview.vue`

```js
async loadPdf() {
  // 释放旧 URL
  if (this.blobUrl) URL.revokeObjectURL(this.blobUrl)
  this.blobUrl = ''
  this.error = ''

  const url = this.pdfUrl
  if (!url) return

  this.loading = true
  try {
    const resp = await fetch(url, { credentials: 'include' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const raw = await resp.blob()
    const pdfBlob = raw.type.includes('pdf') ? raw : new Blob([raw], { type: 'application/pdf' })
    this.blobUrl = URL.createObjectURL(pdfBlob)
  } catch (e) {
    this.error = '内嵌加载失败，已尝试直链显示。如仍空白请点击右上角下载。'
  } finally {
    this.loading = false
  }
}

async fitToContainer() {
  // 根据容器与页面 viewport 计算 scale（适配不同分辨率）
  const host = this.$refs.pdfHost
  const page = await this.pdfDoc.getPage(this.currentPage || 1)
  const viewport = page.getViewport({ scale: 1 })
  this.scale = Math.min(host.clientWidth / viewport.width, host.clientHeight / viewport.height) * 0.95
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）
文件：`pages/translator/resumePreview.vue`

```js
mounted() {
  // 支持 hash 传 page：url#page=3
  const hash = (this.$route.query.url || this.$route.query.file || '').split('#')[1]
  if (hash) {
    const params = new URLSearchParams(hash)
    const page = Number(params.get('page') || '1')
    if (page > 0) this.currentPage = page
  }
  this.loadPdf()
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`pages/translator/resumePreview.vue`

```scss
.viewer-wrapper {
  height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;

  /deep/ canvas {
    max-width: 100% !important;
    max-height: 100% !important;
  }
}
```
