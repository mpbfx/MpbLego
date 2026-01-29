# DevelopmentInfoCard 前端面试问答

## 前端面试官：你是如何实现 DevelopmentInfoCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：`DevelopmentInfoCard` 负责“资源开发”卡片的 UI（表单/展示、字段显隐、关联项目 tags 编辑、setMode 暴露），而核心业务逻辑（加载/保存、状态码映射、入库前必填校验、默认值填充、关联项目增删）集中在父页 `pages/resourceManagement/resourceDetail/_id.vue` 统一处理，避免在卡片里耦合接口与跨模块校验。
- **模板（HTML/组件）结构**：通过 `CardWrapper` 的 `mode` 槽位实现 view/edit：
  - edit：`a-form + grid-form` 栅格表单，资源状态/资源经理等字段用 `v-decorator` 接入 AntD Form 校验；开发渠道/开发时间/资源类型/KP 联系人等字段走 `v-model` 绑定到 `developmentInfoEditing`。
  - view：`grid-view` 直接展示字段，关联项目用 `join('，')` 合并输出；供应商类型才展示 KP 联系人。
- **响应式数据与单向数据流**：父页持有 `developmentInfo/developmentInfoEditing/developmentForm` 等状态并通过 props 下发；卡片通过 `@save/@cancel/@clear/@mode-change` 通知父页执行保存/回滚/清空/模式切换；关联项目输入框通过 `relatedProjectInput` + `update:relatedProjectInput` 做受控输入，避免子组件自己维护冗余状态。
- **表单校验实现（JS）**：保存时走 `developmentForm.validateFields`；更关键的校验是“状态切换到已入库(120)前的跨卡片必填校验”：父页调用 `validateOnSiteRequired(resourceId)` 并提示缺失字段，阻止入库操作，保证业务链路正确。
- **输入约束与联动**：
  - 状态/经理下拉 change 时，父页同步写回 `developmentInfoEditing`（`onDevelopmentStatusChange/onDevelopmentManagerChange`），保证即时渲染与提交一致。
  - 资源类型切换：若不是供应商类型，清空 `kpContact`，避免残留无效数据。
  - 关联项目：以 tag 形式维护 `relatedProjects`，添加时去重（Set），删除时按值过滤；清空时保留核心字段（状态/经理/开发时间）避免误清。
- **异步搜索下拉（Vue 事件 + 父子通信）**：资源经理下拉开启 `show-search` 并复用 `filterOption`；数据来源是父页加载的 `managerList`（后端接口返回），卡片只负责渲染选项与触发 change。
- **权限/状态驱动 UI（如有）**：字段级权限通过 `isFieldEditable/isFieldDeletable` 控制 disabled 与 tag closable；`showKpContact` 由父页根据资源类型判断（供应商才显示）；并且在新建资源基础信息未保存前，父页通过 `v-if="!isNewResource || isBasicInfoSaved"` 隐藏该卡片。
- **性能与体验细节（如有）**：
  - 进入编辑态时填充默认值：资源经理为空时默认 `currentUserName`；开发时间为空时使用创建时间或当前日期。
  - 保存成功后只刷新必要数据（例如 `loadTestRecords()`、必要时 `loadDevelopmentInfo()`），并切回 view，避免整页重刷。
  - `loadDevelopmentInfo` 做“是否已填写开发信息”的判断，避免新建资源时展示后端默认值导致误解。
- **CSS/布局**：
  - 编辑态使用 CSS Grid（`grid-form` + `grid-span-all`）让“关联项目”跨整行，便于 tags 编辑。
  - 查看态同样用 grid 对齐展示，label 做截断省略，value 支持换行。
  - `/deep/` 覆盖 AntD 表单控件高度/对齐，保证卡片风格统一。
- **可扩展性与复用**：这张卡的核心复杂点是“状态驱动 + 跨模块校验”，放在父页更容易统一维护（例如后续入库规则变更，只需改 `validateOnSiteRequired` 的校验维度，不必改卡片 UI）；卡片保持“输入输出协议稳定”，未来可被其它页面复用。

补充：为了把“Vue / HTML / CSS / JS”讲清楚（且不改变上面条目结构），我会从以下前端点回答追问：

1) Vue（Nuxt + Vue2）
- `CardWrapper` + 作用域插槽：用 `v-slot="{ mode }"` 统一 view/edit 模式协议，卡片内部只关心渲染分支与事件抛出。
- 单向数据流：父页持有 `developmentInfo/developmentInfoEditing/developmentForm`，卡片只 `@save/@cancel/@clear/@mode-change`，避免在卡片里耦合接口与跨卡片校验。
- 受控输入：`relatedProjectInput` 通过 `update:relatedProjectInput` 实现受控，便于父页统一做去重、清空与校验提示。

2) JavaScript（校验/映射/跨模块规则）
- `developmentForm.validateFields` 负责字段级校验；“入库前必填”属于页面级规则，需要聚合多卡片数据，所以放在父页 `validateOnSiteRequired(resourceId)` 集中校验更合理。
- 状态/类型映射（如 `statusMap/statusReverseMap`、`RESOURCE_TYPE_MAP`）统一在父页/工具层处理，能降低提交错误与维护成本。
- tags 编辑：关联项目用 `Set` 去重、按值删除，保证输入幂等；清空时保留关键字段避免误清。

3) HTML（表单结构与可用性）
- 编辑态用 `a-form-item` 保持 label/错误提示一致；下拉 `show-search` + `filterOption` 提升可用性。
- 关联项目用 tag + input 的组合更适合“少量、可增删、可视化”的数据形态，比多行 textarea 更清晰。

4) CSS（grid + 动态内容）
- grid 负责字段对齐；`grid-span-all` 给 tags 区块跨行，避免挤压其它字段。
- `/deep/` 覆盖 AntD 控件高度/对齐要加父级前缀，控制影响范围，避免误伤其它卡片。

（如果面试官追问“为什么入库校验不放在卡片里？”：我会说明入库校验需要聚合基础信息/测试/合同/领域工具/语言水平/服务价格/级别等多卡片数据，属于页面级业务规则，放在父页集中校验更合理，也避免卡片之间相互依赖。）

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

讲解要点（前端视角）：
- 这张卡的复杂点集中在“状态/类型映射 + 跨模块入库校验 + tags 受控输入”，因此把逻辑集中在父页/工具层，卡片只保留 UI 协议。

```text
页面：pages/resourceManagement/resourceDetail/_id.vue（资源详情页）
组件：components/ResourceDetail/Cards/DevelopmentInfoCard.vue
相关：config/resourceStatus.js（statusMap/statusReverseMap）、utils/resourceDetailTransform.js（RESOURCE_TYPE_MAP/RESOURCE_TYPE_REVERSE_MAP/formatTimestamp）、config/resourceFieldPermission.js（字段权限）
```

### 2）组件入口：props / emits / data / computed / watch（节选）

讲解要点（Vue）：
- props 同时传“数据”（`developmentInfo/developmentInfoEditing/...`）与“能力”（`getAvailableStatusOptions/onDevelopmentStatusChange/...`），让卡片可复用且不耦合接口。
- tags 输入用 `relatedProjectInput + update:relatedProjectInput` 做受控，避免卡片内部残留状态。

文件：`components/ResourceDetail/Cards/DevelopmentInfoCard.vue`

```js
export default {
  props: {
    developmentInfo: Object,
    developmentInfoEditing: Object,
    developmentForm: Object,
    managerList: Array,
    showKpContact: Boolean,
    relatedProjectInput: String,

    isFieldEditable: Function,
    isFieldDeletable: Function,
    getAvailableStatusOptions: Function,
    filterOption: Function,

    // 行为由父页注入
    onDevelopmentStatusChange: Function,
    onDevelopmentManagerChange: Function,
    onResourceTypeChange: Function,
    addRelatedProject: Function,
    removeRelatedProject: Function
  },
  methods: {
    handleSave() { this.$emit('save') },
    handleCancel() { this.$emit('cancel') },
    handleClear() { this.$emit('clear') },
    handleModeChange(mode) { this.$emit('mode-change', mode) },
    handleAddRelatedProject() {
      this.addRelatedProject?.(this.relatedProjectInput)
      this.$emit('update:relatedProjectInput', '')
    },
    setMode(mode) { this.$refs.developmentInfoCard?.setMode?.(mode) }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

讲解要点（HTML/Vue 模板）：
- view/edit 通过 `mode` 分支切换：编辑态表单由 AntD Form 接管校验与错误展示；查看态用 grid 对齐输出。
- 关联项目的 tag 需要稳定 key，并根据权限控制 `closable`，保证“能删/不能删”在 UI 层直观体现。

文件：`components/ResourceDetail/Cards/DevelopmentInfoCard.vue`

```vue
<template>
  <card-wrapper title="资源开发" @save="handleSave" @mode-change="handleModeChange">
    <template v-slot="{ mode }">
      <a-form v-if="mode === 'edit'" :form="developmentForm" class="edit-form">
        <div class="grid-form" :style="gridStyles.four">
          <a-form-item label="资源状态">
            <a-select v-decorator="['status', { initialValue: developmentInfoEditing.status, rules: [{ required: true }] }]" @change="onDevelopmentStatusChange">
              <a-select-option v-for="opt in getAvailableStatusOptions(developmentInfo.status)" :key="opt.value" :value="opt.value">{{ opt.label }}</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="资源经理">
            <a-select v-decorator="['manager', { initialValue: developmentInfoEditing.manager, rules: [{ required: true }] }]" show-search :filter-option="filterOption" @change="onDevelopmentManagerChange">
              <a-select-option v-for="m in managerList" :key="m" :value="m">{{ m }}</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item class="grid-span-all" label="关联项目">
            <a-tag v-for="p in (developmentInfoEditing.relatedProjects || [])" :key="p" :closable="isFieldDeletable('development', 'relatedProjects')" @close="removeRelatedProject(p)">{{ p }}</a-tag>
            <a-input :value="relatedProjectInput" @input="$emit('update:relatedProjectInput', $event.target.value)" @pressEnter="handleAddRelatedProject" />
          </a-form-item>
        </div>
      </a-form>

      <div v-else class="field-view grid-view" :style="gridStyles.four">
        <div class="field-item"><span class="label">资源状态</span><span class="value">{{ developmentInfo.status }}</span></div>
        <div class="field-item"><span class="label">资源经理</span><span class="value">{{ developmentInfo.manager }}</span></div>
      </div>
    </template>
  </card-wrapper>
</template>
```

### 4）关键交互与业务规则（节选）

讲解要点（JS/业务流）：
- 进入编辑态：拷贝数据到 editing，并填充默认值（经理/时间），让用户少填、少踩坑。
- 保存：字段级校验 → 计算新状态码 →（如入库）跨卡片校验 → 组装 requestData → 提交 → 刷新必要数据并切回 view。

文件：`pages/resourceManagement/resourceDetail/_id.vue`

```js
onDevelopmentInfoModeChange(mode) {
  if (mode !== 'edit') return
  this.developmentInfoEditing = { ...this.developmentInfo }
  this.isDevelopmentInfoSaved = !!this.developmentInfo.manager

  // 默认资源经理 / 开发时间
  if (!this.developmentInfoEditing.manager) this.developmentInfoEditing.manager = this.currentUserName
  if (!this.developmentInfoEditing.developmentTime) {
    const createTime = this.developmentInfo._raw?.createTime
    this.developmentInfoEditing.developmentTime = createTime ? formatTimestamp(createTime).split(' ')[0] : this.getCurrentDateTime()
  }
},

async saveDevelopmentInfo() {
  this.developmentForm.validateFields(async (err, values) => {
    if (err) return this.$message.error('请检查表单填写')

    const newStatus = values.status || this.developmentInfoEditing.status
    const newStatusCode = statusReverseMap[newStatus]

    // 入库(120)前：跨卡片必填校验
    if (newStatusCode === 120) {
      const missing = await this.validateOnSiteRequired(this.resourceId)
      if (missing.length) return this.$message.error(`入库信息不完整，请补充 ${missing.map(n => `【${n}】`).join(' ')}`)
    }

    const requestData = {
      resourceId: this.resourceId,
      status: newStatusCode,
      resourceManager: values.manager || this.developmentInfoEditing.manager || '',
      associatedProjectName: (this.developmentInfoEditing.relatedProjects || []).join(','),
      translatorType: RESOURCE_TYPE_REVERSE_MAP[this.developmentInfoEditing.resourceType],
      contactName: this.developmentInfoEditing.kpContact || ''
    }

    const res = await this.$http.post(path.updateResourceContact, requestData)
    if (res.errorCode === 200) {
      this.developmentInfo = { ...this.developmentInfoEditing }
      await this.loadTestRecords()
      this.$refs.developmentInfoCard?.setMode?.('view')
    }
  })
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

讲解要点（状态管理）：
- `addRelatedProject/removeRelatedProject/clearDevelopmentInfo` 放父页能统一约束输入、去重与清空策略，并避免卡片之间互相引用。

文件：`pages/resourceManagement/resourceDetail/_id.vue`

```js
addRelatedProject(name) {
  const value = (typeof name === 'string' ? name : this.relatedProjectInput).trim()
  if (!value) return
  if (!this.developmentInfoEditing.relatedProjects) this.$set(this.developmentInfoEditing, 'relatedProjects', [])
  this.developmentInfoEditing.relatedProjects = Array.from(new Set([...(this.developmentInfoEditing.relatedProjects || []), value]))
  this.relatedProjectInput = ''
},
removeRelatedProject(project) {
  this.developmentInfoEditing.relatedProjects = (this.developmentInfoEditing.relatedProjects || []).filter(p => p !== project)
},
clearDevelopmentInfo() {
  const { id, _raw, status, manager, developmentTime } = this.developmentInfoEditing
  this.developmentInfoEditing = { id, _raw, status, manager, developmentTime, channel: undefined, relatedProjects: [], resourceType: undefined, kpContact: '' }
  this.relatedProjectInput = ''
  this.developmentForm?.resetFields?.()
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

讲解要点（CSS）：
- grid 负责“多字段对齐”，flex 负责“label/control 对齐”（通过覆盖 AntD form-item 结构实现）。
- 动态内容区（tags）要考虑换行与溢出，避免在窄屏下挤压其它字段。

文件：`components/ResourceDetail/Cards/DevelopmentInfoCard.vue`

```scss
.edit-form {
  .grid-form {
    display: grid;
    grid-template-columns: repeat(var(--cols, 3), 1fr);
    column-gap: 16px;
    .grid-span-all { grid-column: 1 / -1; }
  }

  /deep/ .ant-form-item {
    display: flex;
    margin-bottom: 16px;
  }
}
```
