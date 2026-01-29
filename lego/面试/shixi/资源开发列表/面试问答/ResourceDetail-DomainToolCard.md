# DomainToolCard 前端面试问答

## 前端面试官：你是如何实现 DomainToolCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：`DomainToolCard` 只负责渲染“擅长领域 + 标签 + 备注”的卡片 UI（checkbox 领域选择、tag 列表、添加按钮、view/edit 切换），业务逻辑（加载/保存、后端字段拼接/拆分、权限约束校验、标签弹窗开关与回填）抽到 `utils/resource/useDomainTool.js`，父页 `pages/resourceManagement/resourceDetail/_id.vue` 统一创建 methods 并注入，保持资源详情页与译员平台复用。
- **模板（HTML/组件）结构**：
  - edit：用 `a-checkbox-group` 选择擅长领域（游戏/影视/其他）；根据所选领域条件渲染对应 tag 区块（游戏标签/影视标签/其他备注）；工具标签常驻。tag 区块用 `a-tag + closable + @close` 删除，`a-button` 触发“添加”打开弹窗。
  - view：将各类 tags 直接 `join('，')` 展示；不同领域的区块按 `goodDomains` 条件显隐。
- **响应式数据与单向数据流**：父页持有 `domainToolInfo/domainToolInfoEditing`，卡片通过 props 接收并通过 `@save/@cancel/@clear/@mode-change` 驱动父页动作；tag 的添加/删除通过 props 形式的行为函数（`showTagInput/removeTag`）回到父页，避免子组件持有弹窗/业务状态。
- **表单校验实现（JS）**：保存前会做业务级校验：如果处于“资源在场阶段”，根据权限配置禁止删除已选择的擅长领域（`goodDomains` 只能增不能减），否则直接 `this.$message.error` 阻止保存；其余字段以“可选填”为主，不用 AntD Form rules 堆叠复杂校验。
- **输入约束与联动**：
  - 领域选择驱动 UI：`goodDomains` 变化会影响哪些标签区块展示；例如未选“游戏”就不展示游戏标签编辑区。
  - 删除约束：`isFieldDeletable` 控制 tag 是否可关闭（以及领域是否允许删除），实现“同一 UI 在不同阶段/权限下行为不同”。
  - 清空：`clearDomainTool` 保留 `id/_raw`，其余字段置空，避免误清造成无法区分新建/更新。
- **异步搜索下拉（Vue 事件 + 父子通信）**：该卡主要是标签弹窗选择，不涉及远程搜索；复杂选择交互由父页统一的 `TagSelectorModal` 完成（多 tab/分类/标签体系）。
- **权限/状态驱动 UI（如有）**：`isFieldEditable` 决定是否显示“添加”按钮/textarea 是否可编辑；`isFieldDeletable` 决定 tag 是否可删除以及擅长领域是否允许删除；同时卡片在新建资源基础信息未保存前由父页隐藏（`v-if="!isNewResource || isBasicInfoSaved"`）。
- **性能与体验细节（如有）**：
  - 编辑态进入时复制数组（`goodDomains/gameTags/...`）到 editing，避免引用同一数组导致“未保存也污染展示态”。
  - 保存成功后重新 `loadDomainToolInfo()` 确保和后端一致，并切回 view。
  - 标签选择弹窗复用统一组件，避免在卡片内重复实现复杂标签分类 UI。
- **CSS/布局**：
  - 使用 grid + `grid-span-all` 让各 tag 区块占整行，便于标签横向排列与换行。
  - tag 区块用 flex-wrap 排列，交互按钮与标签视觉一致。
  - `/deep/` 覆盖 AntD 表单控件对齐/高度，保持资源详情页卡片一致。
- **可扩展性与复用**：领域/标签结构天然易扩展：新增一个领域只需补充 `goodDomains` 选项 + 对应 tags 字段 + TagSelectorModal 配置；后端字段通过 join/split 统一在 `useDomainTool` 处理，组件协议稳定。

补充：为了把“Vue / HTML / CSS / JS”讲清楚（且不改变上面条目结构），我会从以下前端点回答追问：

1) Vue（Nuxt + Vue2）
- 模式协议：`CardWrapper` 通过 `v-slot="{ mode }"` 把 view/edit 协议统一，卡片内部只按 `mode` 切换渲染分支。
- 单向数据流：父页持有 `domainToolInfo/domainToolInfoEditing`，卡片只抛 `@save/@cancel/@clear/@mode-change`，标签弹窗与回填也通过父页统一的 `TagSelectorModal` 管理，避免子组件内部状态膨胀。
- 动态渲染：`goodDomains` 变化决定哪些 tag 区块展示（`v-if="includes('游戏')"`），属于“数据驱动 UI”的典型。

2) JavaScript（join/split + 业务约束）
- 字段序列化：后端通常用逗号分隔字符串存 tags（`join(',')/split(',')`），在 `useDomainTool` 统一处理，避免组件里散落字符串处理细节。
- 阶段约束：在“资源在场阶段”不允许删除已选领域（只增不减），属于业务规则而非 UI 规则，放在保存逻辑里集中校验更稳。

3) HTML（checkbox + tag 交互）
- `a-checkbox-group` 适合“多选领域”；tag 列表用 `a-tag closable` 直观表达“可删除”，并通过 `:closable` 绑定权限/阶段。
- “添加标签”触发弹窗选择，而不是自由输入，能从交互层降低脏数据概率（分类选择、去重、统一文案）。

4) CSS（grid + wrap）
- grid 用于布局分区（每块占整行），flex-wrap 用于 tag 自动换行；两者组合能在标签数量变化时保持布局稳定。
- `/deep/` 覆盖 AntD 时加卡片根节点前缀，避免影响其它表单。

（如果面试官追问“为什么标签选择做成弹窗而不是输入框？”：我会说明标签来源是预置分类（游戏类型/主题、影视分类、工具分类），弹窗能提供结构化选择与去重，减少自由输入导致的数据脏乱，并且同一套 TagSelectorModal 可跨卡片复用。）

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

讲解要点（前端视角）：
- 卡片只负责“领域/标签 UI”，标签体系与字段权限配置放在 `config`，保存/加载与字符串转换放在 `useDomainTool`，父页负责“弹窗编排 + 权限注入 + 刷新”。

```text
页面：pages/resourceManagement/resourceDetail/_id.vue（资源详情页）
组件：components/ResourceDetail/Cards/DomainToolCard.vue
相关：utils/resource/useDomainTool.js、components/ResourceDetail/TagSelectorModal.vue、config/resourceFieldPermission.js（字段权限）、config/resourceDetailConfig.js（游戏/影视/工具标签分类配置）
```

### 2）组件入口：props / emits / data / computed / watch（节选）

讲解要点（Vue）：
- props 同时注入“数据”（`domainToolInfo/domainToolInfoEditing`）与“能力”（`removeTag/showTagInput/isFieldEditable/isFieldDeletable`），组件可复用且不耦合后端接口。
- `setMode` 暴露给父页，便于新建流程或保存成功后统一切回 view。

文件：`components/ResourceDetail/Cards/DomainToolCard.vue`

```js
export default {
  props: {
    domainToolInfo: Object,
    domainToolInfoEditing: Object,
    isFieldEditable: Function,
    isFieldDeletable: Function,
    removeTag: Function,
    showTagInput: Function
  },
  methods: {
    handleSave() { this.$emit('save') },
    handleCancel() { this.$emit('cancel') },
    handleClear() { this.$emit('clear') },
    handleModeChange(mode) { this.$emit('mode-change', mode) },
    setMode(mode) { this.$refs.domainToolCard?.setMode?.(mode) }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

讲解要点（HTML/Vue 模板）：
- edit：checkbox 选择领域 → 条件渲染对应 tag 区块 → tag 列表渲染 + closable 删除 → 按钮触发弹窗选标签。
- view：按领域条件展示各区块，把数组 `join('，')` 输出为可读文本，保持展示层简洁。

文件：`components/ResourceDetail/Cards/DomainToolCard.vue`

```vue
<template>
  <card-wrapper title="领域工具" @save="handleSave" @mode-change="handleModeChange">
    <template v-slot="{ mode }">
      <a-form v-if="mode === 'edit'" class="edit-form">
        <a-form-item label="擅长领域" class="grid-span-all">
          <a-checkbox-group v-model="domainToolInfoEditing.goodDomains" :disabled="!isFieldEditable('domainTool', 'goodDomains')" />
        </a-form-item>

        <a-form-item v-if="(domainToolInfoEditing.goodDomains || []).includes('游戏')" label="游戏标签" class="grid-span-all">
          <a-tag v-for="tag in (domainToolInfoEditing.gameTags || [])" :key="tag" :closable="isFieldDeletable('domainTool', 'gameTags')" @close="removeTag('gameTags', tag)">{{ tag }}</a-tag>
          <a-button v-if="isFieldEditable('domainTool', 'gameTags')" @click="showTagInput('game')">添加</a-button>
        </a-form-item>
      </a-form>

      <div v-else class="field-view grid-view">
        <div class="field-item"><span class="label">擅长领域</span><span class="value">{{ (domainToolInfo.goodDomains || []).join('，') }}</span></div>
      </div>
    </template>
  </card-wrapper>
</template>
```

### 4）关键交互与业务规则（节选）

讲解要点（JS/业务流）：
- 进入编辑态深拷贝数组，避免引用共享导致“未保存也污染查看态”。
- 保存时先做阶段/权限校验，再组装 requestData（join），调用 create/update，成功后 `loadDomainToolInfo()` 并切回 view。

文件：`utils/resource/useDomainTool.js`

```js
onDomainToolModeChange(mode) {
  if (mode !== 'edit') return
  context.domainToolInfoEditing = {
    ...context.domainToolInfo,
    goodDomains: [...(context.domainToolInfo.goodDomains || [])],
    gameTags: [...(context.domainToolInfo.gameTags || [])],
    filmTags: [...(context.domainToolInfo.filmTags || [])],
    toolTags: [...(context.domainToolInfo.toolTags || [])]
  }
},

async saveDomainTool() {
  // 在场阶段：禁止删除已选择领域（只能新增）
  if (isFieldDeletable && !isFieldDeletable('domainTool', 'goodDomains')) {
    const original = context.domainToolInfo.goodDomains || []
    const editing = context.domainToolInfoEditing.goodDomains || []
    const deleted = original.filter(d => !editing.includes(d))
    if (deleted.length) return context.$message.error(`资源在场阶段不可删除已选择的领域：${deleted.join('、')}`)
  }

  const requestData = {
    resourceId: context.resourceId,
    domain: (context.domainToolInfoEditing.goodDomains || []).join(','),
    gameTags: (context.domainToolInfoEditing.gameTags || []).join(','),
    filmTags: (context.domainToolInfoEditing.filmTags || []).join(','),
    toolTags: (context.domainToolInfoEditing.toolTags || []).join(','),
    otherNotes: context.domainToolInfoEditing.note || ''
  }

  // create / update -> loadDomainToolInfo -> setMode('view')
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

讲解要点（页面职责）：
- 父页统一管理 `TagSelectorModal` 的打开/确认回填（game/film/tool），卡片只触发 `showTagInput(type)`；回填后更新 `domainToolInfoEditing.*Tags`，保存时一起提交。
- 通过注入 `isFieldDeletable` 让“阶段限制（只增不减）”与“权限限制（能删/不能删）”都能在 UI 与保存逻辑中保持一致。

文件：`pages/resourceManagement/resourceDetail/_id.vue`

```js
this.domainToolMethods = createDomainToolMethods(this, {
  addOperationRecord: () => this.loadOperationRecords(),
  isFieldDeletable: (card, field) => this.isFieldDeletable(card, field)
})

onDomainToolModeChange(mode) { this.domainToolMethods.onDomainToolModeChange(mode) }
saveDomainTool() { return this.domainToolMethods.saveDomainTool() }
cancelDomainTool() { return this.domainToolMethods.cancelDomainTool() }
clearDomainTool() { return this.domainToolMethods.clearDomainTool() }
loadDomainToolInfo() { return this.domainToolMethods.loadDomainToolInfo() }
showTagInput(type) { return this.domainToolMethods.showTagInput(type) }
handleGameTagConfirm(tags) { return this.domainToolMethods.handleGameTagConfirm(tags) }
handleFilmTagConfirm(tags) { return this.domainToolMethods.handleFilmTagConfirm(tags) }
handleToolTagConfirm(tags) { return this.domainToolMethods.handleToolTagConfirm(tags) }
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

讲解要点（CSS）：
- grid 控制区块占位，flex-wrap 控制 tag 换行，避免标签多时把布局挤乱。
- 覆盖组件库样式时以卡片 class 作为作用域前缀，避免影响其它卡片。

文件：`components/ResourceDetail/Cards/DomainToolCard.vue`

```scss
.edit-form {
  .grid-form {
    display: grid;
    grid-auto-flow: row dense;
    column-gap: 16px;
    .grid-span-all { grid-column: 1 / -1; }
  }

  /deep/ .ant-form-item {
    display: flex;
    margin-bottom: 16px;
  }
}
```
