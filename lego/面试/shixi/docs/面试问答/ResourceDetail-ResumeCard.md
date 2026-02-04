# ResumeCard 前端面试问答

## 前端面试官：你是如何实现 ResumeCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：`ResumeCard` 定位是“聚合型展示组件”，把「简历文件 / 学历 / 工作经历 / 项目经历」组织到同一张卡片里；真正的 CRUD、上传下载、路由跳转等业务逻辑统一放在父页面 `pages/resourceManagement/resourceDetail/_id.vue`，并通过 `utils/resource/*` 的可复用方法（`createResumeFileMethods/createEducationMethods/...`）下沉，保证资源详情页与译员平台可复用同一套能力。
- **模板（HTML/组件）结构**：卡片内以 `section-block` 分块，每块都有 header（标题 + 添加/保存/取消/清空入口）和 content（列表态 / 编辑态表单）。文件区用 `a-upload` + 按钮组合，文件列表用 `v-for` 展示；学历/工作/项目都采用“查看态列表 + 编辑态卡片表单”的切换，避免复杂表单常驻同屏。
- **响应式数据与单向数据流**：组件只通过 props 接收 `resumeFiles/educationList/workList/projectResumeList` 等状态，不在卡片内维护业务数据；所有变更都通过 props 形式的“行为函数”回调（如 `onUploadResume/saveEducation/saveWork/saveProjectResume`）交给父页面处理，实现单向数据流：父页拉取/转换/落库 → 下发到卡片 → 卡片仅渲染。
- **表单校验实现（JS）**：该卡片的校验更偏“前置约束 + 必填提示”，核心校验放在可复用模块里完成（例如上传文件类型校验在 `utils/resource/useResumeFile.js` 的 `FILE_TYPE_CONFIG`）；不在卡片内部重复维护一套规则引擎，避免分散与重复。
- **输入约束与联动**：
  - 文件上传：按类型限制后缀（简历仅 pdf；BVC 仅 doc/docx/pdf；作品集允许多种但限制 1 个文件）。
  - 作品集：如果已存在作品集文件，上传按钮置灰（`hasPortfolioFile`），并在上传逻辑里再次拦截，避免重复上传（UI + 逻辑双保险）。
  - 项目经历：语言对通过两个 `a-select` + 箭头组合；服务用 `mode="multiple"` 支持多选；标签通过弹窗选择（父页控制 modal 与回填 tags）。
- **异步搜索下拉（Vue 事件 + 父子通信）**：这里的下拉（专业/行业/职位、语言等）主要来自本地配置或父页注入（`majorList/industryData/languageList`），组件统一复用 `:filter-option="filterOption"`；如果后续某一块改为远程搜索，也可以沿用“卡片触发 → 父页请求 → props 回传”的链路扩展。
- **权限/状态驱动 UI（如有）**：资源详情页在“新建资源”流程里会先保存基础信息，之后才渲染简历卡（`v-if="!isNewResource || isBasicInfoSaved"`）；并且译员平台不显示 BVC 上传入口（`showBvcUpload`），同一套卡片通过 props 控制差异。
- **性能与体验细节（如有）**：上传/删除成功后只刷新对应模块数据（如 `loadResumeFiles()`），避免整页重刷；预览/下载对文件名做 `encodeURIComponent`，避免中文文件名导致 URL 不可用；下载使用 `fetch -> blob -> a[download]`，确保保存文件名正确。
- **CSS/布局**：
  - 文件区用 flex 对齐按钮与提示，按钮统一宽高；作品集“已存在”状态下按钮置灰并禁用 hover。
  - 列表/表单区以 `section-block` 分割，内部用 grid/flex 组合保证字段对齐。
  - 通过 `scoped scss` + `/deep/` 覆盖 Ant Design Vue 按钮/表单控件关键样式（高度、边框、hover），保证卡片间 UI 一致。
- **可扩展性与复用**：四个子模块都以 createData/createMethods 形式封装在 `utils/resource/`，父页按需组合；未来若要在其它页面复用“简历文件上传”或“项目经历编辑”，只需复用对应模块与 `ResumeCard` 的组装方式，无需复制业务逻辑。

补充：为了把“Vue / HTML / CSS / JS”讲清楚（且不改变上面条目结构），我会从以下前端点回答追问：

1) Vue（Nuxt + Vue2）
- “聚合型组件”拆分：`ResumeCard` 负责把多个 section 组装成统一 UI，每块 section 的编辑态由父页的 `*EditingIndex/*Editing` 驱动，避免组件内部状态爆炸且难复用。
- 父子通信：props 下发列表数据与行为函数（`onUploadResume/saveEducation/...`），卡片触发意图，父页统一管理接口、权限、埋点与路由（资源详情页/译员平台复用更容易）。
- 列表 key：优先使用后端 id，其次 index 兜底，避免切换编辑态时出现 DOM 复用错位。

2) JavaScript（上传/下载/编辑流）
- `a-upload` 的 `before-upload` 返回 `false`：阻止组件库默认上传，统一走项目上传接口（拿 `keyName`），再把 `{fileName,keyName}` 作为业务字段保存，保证“文件服务”与“业务落库”解耦。
- 下载/预览：`encodeURIComponent(file.name)` 处理中文文件名；下载常用 `fetch -> blob -> a[download]` 确保保存文件名正确。
- 编辑一致性：进入编辑态先拷贝当前项到 `*Editing`，取消/清空时回滚并重置表单/输入，避免“未保存也污染列表”。

3) HTML（表单与列表语义）
- 文件区：`accept`、`multiple` 等属性让“允许的文件类型/数量”在 UI 层可见，再由 JS 二次兜底（双保险）。
- section header/action：把“新增/保存/取消/清空”放在每块 header，用户能明确当前在编辑哪一块，降低多块表单的心智负担。

4) CSS（布局与一致性）
- flex 用于文件按钮组对齐，grid 用于表单字段对齐（密度更高且更稳定）。
- `scoped` 控制影响范围，`/deep/` 只用于覆盖 AntD 内部样式并加父级前缀，避免样式污染其它卡片。

（如果面试官追问“为什么卡片不自己发请求？”：我会补充卡片保持纯展示 + 回调，能让接口聚合、权限控制、缓存与埋点策略统一在父页管理，也更利于在资源详情页与译员平台复用同一套 UI。）

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

讲解要点（前端视角）：
- `ResumeCard` 是 UI 聚合层；可复用的业务能力拆在 `utils/resource/use*.js`，父页负责把它们组合成“上传/保存/刷新/记录操作”的闭环。
- 标签选择抽成 `TagSelectorModal`，卡片只展示结果并触发打开/回填，避免多处重复实现弹窗选择交互。

```text
页面：pages/resourceManagement/resourceDetail/_id.vue（资源详情页）
组件：components/ResourceDetail/Cards/ResumeCard.vue
相关：utils/resource/useResumeFile.js、utils/resource/useEducation.js、utils/resource/useWorkExperience.js、utils/resource/useProjectResume.js、components/ResourceDetail/TagSelectorModal.vue
```

### 2）组件入口：props / emits / data / computed / watch（节选）

讲解要点（Vue）：
- props 同时承载“数据”（`resumeFiles/*List/*Editing`）与“行为函数”（`onUploadResume/saveWork/...`），使卡片成为受控组件，利于跨页面复用。
- `computed.hasPortfolioFile` 这种“纯展示派生状态”放 computed，更清晰且避免模板里堆逻辑。

文件：`components/ResourceDetail/Cards/ResumeCard.vue`

```js
export default {
  props: {
    resumeFiles: Object,
    educationList: Array,
    educationEditing: Object,
    educationEditingIndex: Number,
    majorList: Array,
    workList: Array,
    workEditing: Object,
    workEditingIndex: Number,
    industryList: Array,
    industryData: Array,
    projectResumeList: Array,
    projectResumeEditing: Object,
    projectResumeEditingIndex: Number,

    // 行为函数（由父页注入，卡片只负责触发）
    onUploadResume: Function,
    previewResumeFile: Function,
    downloadResumeFile: Function,
    removeResumeFile: Function,
    addEducation: Function,
    editEducation: Function,
    deleteEducation: Function,
    saveEducation: Function,
    cancelEducation: Function,
    clearEducation: Function,
    addWork: Function,
    editWork: Function,
    deleteWork: Function,
    saveWork: Function,
    cancelWork: Function,
    clearWork: Function,
    getOccupations: Function,
    addProjectResume: Function,
    editProjectResume: Function,
    deleteProjectResume: Function,
    saveProjectResume: Function,
    cancelProjectResume: Function,
    clearProjectResume: Function,
    removeProjectTagEditing: Function,
    openProjectTagModalEditing: Function,
    formatLanguagePair: Function,

    // 差异化控制
    showBvcUpload: Boolean,
    loading: Boolean
  },
  computed: {
    hasPortfolioFile() {
      return !!(this.resumeFiles.portfolio && (this.resumeFiles.portfolio.name || this.resumeFiles.portfolio.keyName))
    }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

讲解要点（HTML/Vue 模板）：
- 多块 section 的关键是“每块只有一个编辑入口 + 明确的编辑态”，通常用 `*EditingIndex` 控制分支，避免同屏多表单常驻导致混乱。
- 文件区用 `v-for` 渲染文件项，并把预览/下载/删除拆成独立 action，减少误触与复用成本。

文件：`components/ResourceDetail/Cards/ResumeCard.vue`

```vue
<template>
  <card-wrapper title="简历项目" :editable="false" :loading="loading">
    <template v-slot="{ mode }">
      <!-- 简历文件：a-upload + 文件列表 -->
      <a-upload
        :before-upload="file => onUploadResume('resume', file)"
        :show-upload-list="false"
        accept=".pdf"
        :multiple="false"
      >
        <a-button type="primary" class="upload-btn">上传简历</a-button>
      </a-upload>

      <div v-for="(file, index) in resumeFiles.resume" :key="file.id || index" class="file-info-item">
        <span class="file-name">{{ file.name }}</span>
        <div class="file-actions">
          <a-button @click="previewResumeFile(file)">预览</a-button>
          <a-button @click="downloadResumeFile(file)">下载</a-button>
          <a-button @click="removeResumeFile(file)">删除</a-button>
        </div>
      </div>

      <!-- 学历/工作/项目：查看态 list + 编辑态 form（由 *EditingIndex 驱动） -->
      <div v-if="educationEditingIndex === null" class="info-list">...</div>
      <a-form v-else class="edit-form">...</a-form>
    </template>
  </card-wrapper>
</template>
```

### 4）关键交互与业务规则（节选）

讲解要点（JS/业务流）：
- 先前置校验（后缀、数量、禁用态）→ 上传拿 `keyName` → 业务保存 → `loadResumeFiles()` 刷新，是“文件上传 + 业务落库”更稳的通用链路。
- `before-upload` 返回 `false` 是关键：阻止默认上传，统一走项目鉴权/代理/错误处理。

文件：`utils/resource/useResumeFile.js`

```js
const FILE_TYPE_CONFIG = {
  resume: { allowedExtensions: ['pdf'], errorMsg: '简历仅支持PDF格式' },
  bvc: { allowedExtensions: ['doc', 'docx', 'pdf'], errorMsg: 'BVC仅支持Word或PDF格式' },
  portfolio: { allowedExtensions: ['doc', 'docx', 'pdf', 'rar', 'zip', 'mp4', 'mov', 'ass', 'srt', 'jpg', 'png', 'jpeg'], maxCount: 1 }
}

async onUploadResume(type, file) {
  // 1) 前置校验（后缀/数量限制）
  // 2) axios 上传文件 -> 拿到 keyName
  // 3) http 保存文件记录到资源简历表
  // 4) 重新 loadResumeFiles 刷新 UI
  // 5) 写入操作记录（可选）
  return false // 阻止 a-upload 默认上传
}

previewResumeFile(file) {
  const encoded = encodeURIComponent(file.name)
  const url = `${path.baseURL}${path.downloadFile}?keyName=${file.keyName}&fileName=${encoded}`
  // 根据路由前缀（/translator or /resourceManagement）跳转不同预览页
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

讲解要点（页面职责）：
- 父页注入 `addOperationRecord` 等回调，让保存成功后既能更新 UI，也能写审计日志；卡片本身保持“无副作用”。
- 方法代理（`onUploadResume/previewResumeFile/...`）让 template 更干净，也便于在父页统一做权限/异常兜底。

文件：`pages/resourceManagement/resourceDetail/_id.vue`

```js
// 父页创建可复用 methods，并把行为函数注入给 ResumeCard
this.resumeFileMethods = createResumeFileMethods(this, {
  addOperationRecord: () => this.loadOperationRecords()
})

onUploadResume(type, file) {
  return this.resumeFileMethods.onUploadResume(type, file)
},
previewResumeFile(file) {
  return this.resumeFileMethods.previewResumeFile(file)
},
downloadResumeFile(file) {
  return this.resumeFileMethods.downloadResumeFile(file)
},
removeResumeFile(file) {
  return this.resumeFileMethods.removeResumeFile(file)
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

讲解要点（CSS）：
- flex 适合按钮组横向排布与对齐；grid 适合表单字段密集对齐（尤其有跨行/跨列需求时）。
- 覆盖组件库样式时用父级 class 限定作用域（如 `.file-content`），避免改动扩散到其它卡片。

文件：`components/ResourceDetail/Cards/ResumeCard.vue`

```scss
.file-content {
  .file-upload-area {
    display: flex;
    align-items: center;
    gap: 12px;

    /deep/ .ant-btn-primary {
      height: 32px;
      padding: 0 15px;

      &.upload-btn {
        min-width: 100px;
        text-align: center;
      }

      &.portfolio-disabled,
      &.portfolio-disabled[disabled] {
        background: #d9d9d9 !important;
        border-color: #d9d9d9 !important;
        cursor: not-allowed !important;
      }
    }
  }
}
```
