# OrderTimeCard 前端面试问答

## 前端面试官：你是如何实现 OrderTimeCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

OrderTimeCard 解决的是“资源可接单时间”这类跨页面复用信息：在 ResourceDetail（运营后台）和 Translator（译员端）都要展示/编辑同一份结构化数据。实现上拆成两层：卡片组件只做 UI（view/edit 切换、表单项与禁用态）；保存/加载/数据规整放到 `utils/resource/useOrderTime.js` 作为可复用业务模块。

- **Vue 组件分层**：页面层 `pages/resourceManagement/resourceDetail/_id.vue`、`pages/translator/index.vue` 负责数据加载、权限注入、事件绑定；展示层 `components/ResourceDetail/Cards/OrderTimeCard.vue` 负责渲染与交互；通用壳 `components/ResourceDetail/CardWrapper.vue` 负责卡片标题、编辑态按钮、折叠、skeleton。
- **模板（HTML/组件）结构**：`CardWrapper` 通过 slot 暴露 `mode`；`mode==='edit'` 用 AntD 表单渲染（时区/职业状态/可接单时间/不接时间/备注）；`mode!=='edit'` 用 grid view 做只读展示（数组 join、日期区间格式化）。
- **响应式数据与单向数据流**：父页维护 `orderTimeInfo`（展示态）和 `orderTimeInfoEditing`（编辑态）；进入 edit 时由父页复制/补齐默认值；子组件用 `v-model` 修改 `orderTimeInfoEditing` 字段，保存时 `$emit('save')` 由父页调 `orderTimeMethods.saveOrderTime()` 落库并刷新展示态。
- **表单校验实现（JS）**：校验放在复用模块 `utils/resource/useOrderTime.js`：当“不接时间”同时填写起止日期时，强制 `end > start`，否则阻止保存并提示。
- **输入约束与联动**：
  - 时区：输入框 disabled 只显示；进入编辑态若 timezone 为空，按基础信息国家自动推导（`timezoneMap + getCountryCode/getCountryMainTimezone`），默认兜底 `Asia/Shanghai`。
  - 可接单时间：多选（`mode="multiple"`），前端以数组保存，提交时 join 成后端字段 `workingTimeSlot`。
  - 不接时间：`valueFormat="YYYY/MM/DD"`，提交时统一转成 `YYYY-MM-DD 00:00:00`，保持接口格式一致。
- **异步搜索下拉（Vue 事件 + 父子通信）**：无（都是枚举/日期输入）。
- **权限/状态驱动 UI（如有）**：字段禁用由父页注入 `isFieldEditable('orderTime', fieldKey)` 控制，不同字段映射到不同 key（`jobStatus/workingTime/unavailableTime/remark`），实现字段级权限。
- **性能与体验细节（如有）**：新建资源时用 `v-if="!isNewResource || isBasicInfoSaved"` 控制卡片出现时机（先保存基础信息再补接单时间）；加载中显示 skeleton（`skeleton-rows=3`）；保存成功仅局部刷新接单时间信息。
- **CSS/布局**：
  - 查看态用 CSS Grid（两列）+ label 固定宽度，长文本（备注）自动换行且不挤压 label。
  - 编辑态也用 Grid 表单，减少纵向滚动；“不接时间”用一行两个 date-picker 的 flex 组合。
  - `scoped` + `/deep/` 覆盖 AntD `a-form-item` 布局，让 label/控件对齐更稳定。
- **可扩展性与复用**：业务逻辑集中在 `createOrderTimeData/createOrderTimeMethods`，ResourceDetail 与 Translator 复用同一套保存/加载/规整；格式化函数（时区显示、日期区间显示）通过 props 注入，保证卡片 UI 纯粹可复用。

追问：为什么要把保存逻辑抽到 `useOrderTime.js`？因为这张卡在两个页面复用，且“前端字段 ↔ 后端字段”的映射（join、日期格式、create/update 分流）属于业务规则，抽出来能避免两处实现漂移，也更利于维护。

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

```text
页面（如有）：pages/resourceManagement/resourceDetail/_id.vue
         pages/translator/index.vue
组件：components/ResourceDetail/Cards/OrderTimeCard.vue
相关：utils/resource/useOrderTime.js
     utils/resource/formatters.js
     components/ResourceDetail/CardWrapper.vue
     config/resourceDetailConfig.js
     config/countryData.js
     config/path.js
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`components/ResourceDetail/Cards/OrderTimeCard.vue`

```js
export default {
  props: {
    orderTimeInfo: { type: Object, required: true },
    orderTimeInfoEditing: { type: Object, required: true },
    gridStyles: { type: Object, required: true },
    isFieldEditable: { type: Function, required: true },
    isFieldDeletable: { type: Function, required: true },
    formatTimezoneLabel: { type: Function, required: true },
    formatUnavailableTime: { type: Function, required: true }
  },
  methods: {
    handleSave() { this.$emit('save') },
    handleCancel() { this.$emit('cancel') },
    handleClear() { this.$emit('clear') },
    handleModeChange(mode) { this.$emit('mode-change', mode) },
    setMode(mode) { this.$refs.orderTimeCard?.setMode(mode) }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`components/ResourceDetail/Cards/OrderTimeCard.vue`

```vue
<card-wrapper title="接单时间" :editable="true" :loading="loading" @save="handleSave" @cancel="handleCancel" @clear="handleClear" @mode-change="handleModeChange">
  <template v-slot="{ mode }">
    <a-form v-if="mode === 'edit'" class="edit-form">
      <div class="grid-form" :style="gridStyles.two">
        <a-form-item label="时区">
          <a-input :value="formatTimezoneLabel(orderTimeInfoEditing.timezone)" disabled />
        </a-form-item>
        <a-form-item label="职业状态">
          <a-select v-model="orderTimeInfoEditing.jobStatus" :disabled="!isFieldEditable('orderTime', 'jobStatus')">
            <a-select-option value="自由职业">自由职业</a-select-option>
            <a-select-option value="全职工作">全职工作</a-select-option>
            <a-select-option value="学生在读">学生在读</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="接单时间">
          <a-select mode="multiple" v-model="orderTimeInfoEditing.availableSlots" :disabled="!isFieldEditable('orderTime', 'workingTime')">
            <a-select-option value="周中白天">周中白天</a-select-option>
            <a-select-option value="周末晚上">周末晚上</a-select-option>
          </a-select>
        </a-form-item>
      </div>
    </a-form>

    <div v-else class="field-view grid-view" :style="gridStyles.two">
      <div class="field-item"><span class="label">接单时间</span><span class="value">{{ (orderTimeInfo.availableSlots || []).join('，') }}</span></div>
      <div class="field-item"><span class="label">不接时间</span><span class="value">{{ formatUnavailableTime(orderTimeInfo.notAcceptStart, orderTimeInfo.notAcceptEnd) }}</span></div>
    </div>
  </template>
</card-wrapper>
```

### 4）关键交互与业务规则（节选）

文件：`utils/resource/useOrderTime.js`

```js
onOrderTimeModeChange(mode) {
  if (mode !== 'edit') return
  context.orderTimeInfoEditing = {
    ...context.orderTimeInfo,
    availableSlots: [...(context.orderTimeInfo.availableSlots || [])]
  }
  if (!context.orderTimeInfoEditing.timezone) {
    const country = getBasicInfoCountry?.() || ''
    context.orderTimeInfoEditing.timezone = this.getTimezoneByCountry(country)
  }
},

async saveOrderTime() {
  const { notAcceptStart: startDate, notAcceptEnd: endDate } = context.orderTimeInfoEditing
  if (startDate && endDate && new Date(endDate.replace(/\//g, '-')) <= new Date(startDate.replace(/\//g, '-'))) {
    context.$message.error('不接结束时间必须大于开始时间')
    return
  }

  const requestData = {
    resourceId: context.resourceId,
    workingTimeSlot: (context.orderTimeInfoEditing.availableSlots || []).join(','),
    professionalStatus: context.orderTimeInfoEditing.jobStatus || '',
    timezone: context.orderTimeInfoEditing.timezone || '',
    unavailableStart: startDate ? `${startDate.replace(/\//g, '-')} 00:00:00` : null,
    unavailableEnd: endDate ? `${endDate.replace(/\//g, '-')} 00:00:00` : null,
    workingTimeNotes: context.orderTimeInfoEditing.note || ''
  }

  const isUpdate = !!context.orderTimeInfoEditing.id
  const apiPath = isUpdate ? path.updateResourceWorkingTime : path.createResourceWorkingTime
  await context.$http.post(isUpdate ? `${apiPath}?id=${context.orderTimeInfoEditing.id}` : apiPath, requestData)
  await this.loadOrderTimeInfo()
  context.$refs.orderTimeCard?.setMode('view')
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

文件：`pages/resourceManagement/resourceDetail/_id.vue`

```js
// 模板绑定：@save/@cancel/@clear/@mode-change
async saveOrderTime() { await this.orderTimeMethods.saveOrderTime() },
cancelOrderTime() { this.orderTimeMethods.cancelOrderTime() },
clearOrderTime() { this.orderTimeMethods.clearOrderTime() },
onOrderTimeModeChange(mode) { this.orderTimeMethods.onOrderTimeModeChange(mode) }
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`components/ResourceDetail/Cards/OrderTimeCard.vue`

```scss
.order-time-card {
  .field-view.grid-view {
    display: grid;
    grid-template-columns: repeat(var(--cols, 3), 1fr);
    column-gap: 24px;
    row-gap: 8px;
    .grid-span-all { grid-column: 1 / -1; }
  }

  .field-item {
    display: flex;
    align-items: flex-start;
    .label { flex: 0 0 120px; max-width: 120px; }
    .value { flex: 1; word-break: break-all; }
  }

  .edit-form {
    /deep/ .ant-form-item { display: flex; margin-bottom: 16px; }
  }
}
```
