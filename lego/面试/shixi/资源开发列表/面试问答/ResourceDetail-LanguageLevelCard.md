# LanguageLevelCard 前端面试问答

## 前端面试官：你是如何实现 LanguageLevelCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：`LanguageLevelCard` 负责语言水平的 UI（查看态表格、添加/编辑态表单、证书 tags、附件上传/下载入口），业务逻辑（加载/保存/删除、附件上传到文件服务、证书字符串拼接、后端字段映射）抽到 `utils/resource/useLanguageLevel.js`，父页 `pages/resourceManagement/resourceDetail/_id.vue` 统一创建 methods 并注入，复用到资源详情页与译员平台。
- **模板（HTML/组件）结构**：
  - view：`a-table` 展示语言水平列表，slot 里把 `language` 映射为 label（`getLabelByValue`），附件列提供“下载”，操作列提供“编辑/删除”。
  - add/edit：`a-form + grid-form` 表单，包含语言/水平/证书/证书附件；证书用 `a-tag closable` + 输入框 + 添加按钮；附件用 `a-upload(before-upload)` 自定义上传并在下方渲染附件列表（下载/删除）。
- **响应式数据与单向数据流**：父页持有 `languageLevels/languageLevelEditing/languageLevelAttachments/certificateInput` 等状态；卡片通过 props 接收，所有操作通过 props 形式方法回到父页（`onClickEditLanguageLevel/beforeLanguageLevelUpload/saveLanguageLevel/...`）。证书输入用 `.sync`（`certificateInputLocal` -> `update:certificateInput`）保证输入受控且不卡顿。
- **表单校验实现（JS）**：保存时做“必要字段校验”，例如必须选择语言；其余字段为可选项。相比把 rules 堆在组件里，`useLanguageLevel.saveLanguageLevel()` 里集中做校验、请求与错误处理（`$message`）。
- **输入约束与联动**：
  - 证书：`addCertificate` 会 trim + 去重（Set），删除证书按值过滤。
  - 附件：上传使用 `beforeLanguageLevelUpload` 拦截默认上传流程，先调用 `uploadFile` 拿 `keyName`，再把 `{fileName,keyName}` push 到 `languageLevelAttachments`；删除附件按索引移除。
  - 编辑态：点击编辑会深拷贝证书数组与附件数组到 editing，避免引用共享导致未保存也污染查看态。
- **异步搜索下拉（Vue 事件 + 父子通信）**：语言下拉开启 `show-search`，选项来自父页注入的 `languageList`，过滤逻辑统一复用 `filterOption`；语言展示统一走 `getLabelByValue`，避免在卡片内重复维护语言映射。
- **权限/状态驱动 UI（如有）**：该卡默认 `show-add=true`，编辑/删除入口由 UI 固定提供；如果后续需要按权限禁用，可沿用父页的 `isFieldEditable` 模式把按钮显隐下沉到 props（同资源详情页其它卡片一致）。
- **性能与体验细节（如有）**：
  - 保存/删除成功后只 `loadLanguageLevels()` 刷新列表，不做整页刷新。
  - 下载附件采用 `fetch -> blob -> a[download]`，确保下载文件名正确；文件名用 `encodeURIComponent` 避免中文导致 URL 异常。
  - 切换模式时重置 editingIndex/附件/输入框，避免残留上次编辑状态。
- **CSS/布局**：
  - 查看态表格用 zebra row、`scroll: { x: 'max-content' }` 提升可读性与横向字段适配。
  - 编辑态用 grid 布局，证书/附件区块跨整行（`grid-span-all`），便于多 tag/多文件换行展示。
  - `/deep/` 覆盖 AntD 表单控件高度/对齐与按钮样式，保持卡片一致。
- **可扩展性与复用**：`useLanguageLevel` 把“列表 + 编辑态 + 附件上传/下载”完整封装；未来新增字段（如口语/笔译能力维度）主要改 `transformLanguageLevel` 与 `saveLanguageLevel` 的 requestData 组装，卡片协议保持稳定。

补充：为了把“Vue / HTML / CSS / JS”讲清楚（且不改变上面条目结构），我会从以下前端点回答追问：

1) Vue（Nuxt + Vue2）
- 作用域插槽：`CardWrapper` 通过 `v-slot="{ mode }"` 把模式传下来，卡片按 `mode` 渲染 table 或 form，模式切换协议统一。
- 受控输入：证书输入用 `.sync`（`update:certificateInput`）保持输入框受控，避免卡片内部维护重复状态导致卡顿/不同步。
- 列表与编辑态隔离：编辑时深拷贝证书数组/附件数组到 `languageLevelEditing/languageLevelAttachments`，避免引用共享导致“未保存也污染列表”。

2) JavaScript（上传/保存/映射）
- 附件上传用 `before-upload` 拦截默认上传：`FormData` 上传拿 `keyName`，再把 `{fileName,keyName}` 维护在附件列表里，最终作为业务字段提交（保存/编辑一致）。
- 保存前最小校验：至少保证 `language` 必填，其它字段可选；错误提示集中在方法里统一处理（`$message`）。
- 字段转换：证书数组 `join(',')`、附件列表 `JSON.stringify`，让前端结构和后端契约对齐。

3) HTML（表格/表单语义）
- 查看态用 `a-table`，通过 slot 自定义语言 label/附件/操作列，保持列配置与业务展示解耦。
- 编辑态用 `a-tag closable` 展示证书，多 tag 自动换行；附件区展示文件名并提供“下载/删除”。

4) CSS（grid + 覆盖组件库）
- grid 用于表单对齐；`grid-span-all` 让证书/附件这类“可变高度块”跨整行，避免挤压其它字段。
- `scoped` 控制范围，`/deep/` 只用于覆盖 AntD 控件高度/对齐并加父级前缀，避免全局污染。

（如果面试官追问“为什么附件上传不用 a-upload 的 action？”：我会说明需要把上传与业务表单（语言/证书）解耦，并统一走带 cookie 的 `axios` 与项目约定的 `uploadFile` 接口拿 `keyName`，再把附件列表作为表单一部分提交到语言能力接口，才能保证保存/编辑的一致性。）

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

讲解要点（前端视角）：
- 这张卡的关键复用点是“语言 label 映射 + 附件上传/下载链路 + 列表/编辑态切换协议”，分别落在 config/utils/父页注入能力里。

```text
页面：pages/resourceManagement/resourceDetail/_id.vue（资源详情页）
组件：components/ResourceDetail/Cards/LanguageLevelCard.vue
相关：utils/resource/useLanguageLevel.js、utils/resourceDetailTransform.js（transformLanguageLevel）、config/languageOption.js（getLabelByValue）、config/resourceDetailConfig.js（languageLevelColumns）
```

### 2）组件入口：props / emits / data / computed / watch（节选）

讲解要点（Vue）：
- props 同时包含“数据”（`languageLevels/languageLevelEditing/...`）与“能力”（`beforeLanguageLevelUpload/onClickEdit...`），使组件保持纯展示与可组合。
- `.sync`（`certificateInput`）让输入框受控，避免多处维护输入状态。

文件：`components/ResourceDetail/Cards/LanguageLevelCard.vue`

```js
export default {
  props: {
    languageLevels: Array,
    languageLevelColumns: Array,
    languageLevelEditing: Object,
    languageLevelAttachments: Array,
    certificateInput: String,

    languageList: Array,
    filterOption: Function,
    getLabelByValue: Function,

    // 行为由父页注入
    onClickEditLanguageLevel: Function,
    onClickDeleteLanguageLevel: Function,
    addCertificate: Function,
    removeCertificate: Function,
    beforeLanguageLevelUpload: Function,
    downloadLanguageLevelAttachment: Function,
    downloadSingleLanguageLevelAttachment: Function,
    removeLanguageLevelAttachment: Function
  },
  computed: {
    certificateInputLocal: {
      get() { return this.certificateInput },
      set(v) { this.$emit('update:certificateInput', v) }
    }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

讲解要点（HTML/Vue 模板）：
- view：`a-table` + slots（languageName/attachments/action）把展示逻辑集中在模板层，列配置仍可复用。
- edit：表单里证书与附件是“动态列表”，适合用 tag/列表渲染而不是复杂的嵌套表单。

文件：`components/ResourceDetail/Cards/LanguageLevelCard.vue`

```vue
<template>
  <card-wrapper title="语言水平" :show-add="true" @save="handleSave" @mode-change="handleModeChange">
    <template v-slot="{ mode }">
      <a-table v-if="mode === 'view'" :columns="languageLevelColumns" :data-source="languageLevels" :pagination="false">
        <template slot="languageName" slot-scope="text, record">
          {{ getLabelByValue(record.language) || record.language }}
        </template>
        <template slot="attachments" slot-scope="text, record">
          <a v-if="record.attachments?.length" @click="downloadLanguageLevelAttachment(record)">下载</a>
          <span v-else>－</span>
        </template>
        <template slot="action" slot-scope="text, record, index">
          <a @click="onClickEditLanguageLevel(record, index)">编辑</a>
          <a @click="onClickDeleteLanguageLevel(record, index)">删除</a>
        </template>
      </a-table>

      <a-form v-else class="edit-form">
        <a-form-item label="证书">
          <a-tag v-for="cert in (languageLevelEditing.certificates || [])" :key="cert" closable @close="removeCertificate(cert)">{{ cert }}</a-tag>
          <a-input v-model="certificateInputLocal" @pressEnter="addCertificate" />
        </a-form-item>

        <a-form-item label="证书附件">
          <a-upload :before-upload="beforeLanguageLevelUpload" :show-upload-list="false" :multiple="true">
            <a-button type="primary" size="small">添加附件</a-button>
          </a-upload>
          <div v-for="(file, idx) in languageLevelAttachments" :key="idx" class="attachment-item">
            <span>{{ file.fileName }}</span>
            <a @click="downloadSingleLanguageLevelAttachment(file)">下载</a>
            <a @click="removeLanguageLevelAttachment(idx)">删除</a>
          </div>
        </a-form-item>
      </a-form>
    </template>
  </card-wrapper>
</template>
```

### 4）关键交互与业务规则（节选）

讲解要点（JS/业务流）：
- `beforeLanguageLevelUpload` 负责“上传文件拿 keyName 并落到附件列表”，`saveLanguageLevel` 负责“把编辑态结构打包成后端需要的 requestData 并提交”。
- “上传成功 ≠ 业务保存成功”：附件列表只是编辑态的一部分，真正落库发生在保存时。

文件：`utils/resource/useLanguageLevel.js`

```js
async beforeLanguageLevelUpload(file) {
  const formData = new FormData()
  formData.append('file', file)

  const uploadRes = await context.$axios.post(path.uploadFile, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  if (uploadRes.data.errorCode === 200 && uploadRes.data.fileInfo) {
    context.languageLevelAttachments = [
      ...context.languageLevelAttachments,
      { fileName: file.name, keyName: uploadRes.data.fileInfo.keyName }
    ]
    context.$message.success('上传成功')
  }

  return false // 阻止默认上传
}

async saveLanguageLevel() {
  if (!context.languageLevelEditing.language) return context.$message.error('请选择语言')

  const certificateFilesJson = (context.languageLevelAttachments || []).map(att => ({
    fileName: att.fileName,
    keyName: att.keyName
  }))

  const requestData = {
    resourceId: context.resourceId,
    language: context.languageLevelEditing.language,
    proficiency: context.languageLevelEditing.level,
    certificates: (context.languageLevelEditing.certificates || []).join(','),
    certificateFiles: JSON.stringify(certificateFilesJson),
    certificateFilesJson
  }

  // create/update -> loadLanguageLevels -> setMode('view')
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

讲解要点（页面职责）：
- 父页通过 `createLanguageLevelMethods(this, ...)` 统一封装加载/保存/删除/下载，并把方法注入卡片；卡片只触发意图，便于复用与权限收口。

文件：`pages/resourceManagement/resourceDetail/_id.vue`

```js
this.languageLevelMethods = createLanguageLevelMethods(this, {
  addOperationRecord: () => this.loadOperationRecords()
})

onLanguageLevelModeChange(mode) { this.languageLevelMethods.onLanguageLevelModeChange(mode) }
onClickEditLanguageLevel(record, index) { this.languageLevelMethods.onClickEditLanguageLevel(record, index) }
onClickDeleteLanguageLevel(record, index) { this.languageLevelMethods.onClickDeleteLanguageLevel(record, index) }
beforeLanguageLevelUpload(file) { return this.languageLevelMethods.beforeLanguageLevelUpload(file) }
saveLanguageLevel() { return this.languageLevelMethods.saveLanguageLevel() }
clearLanguageLevel() { return this.languageLevelMethods.clearLanguageLevel() }
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

讲解要点（CSS）：
- grid 对齐字段，flex 对齐 label/control（通过覆盖 AntD 的 form-item 结构实现）。
- 动态内容（tag/附件列表）需要 `min-width: 0` 与换行策略，避免撑破布局。

文件：`components/ResourceDetail/Cards/LanguageLevelCard.vue`

```scss
.edit-form {
  .grid-form {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), 1fr);
    column-gap: 16px;
    .grid-span-all { grid-column: 1 / -1; }
  }

  /deep/ .ant-form-item {
    display: flex;
    margin-bottom: 16px;
  }
}
```
