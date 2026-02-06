# ProductionInfoCard 前端面试问答

## 前端面试官：你是如何实现 ProductionInfoCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

这张卡的定位是“订单的生产记录工作台”：查看态用 table 展示生产记录；新增/编辑态用表单收敛复杂联动（译员→服务→语言对→自动带价），并把“行内日期单独编辑 + 二次确认”等高风险操作做成卡片内闭环；真正的接口调用与局部刷新留在父页。

- **Vue 组件分层**：父页 `pages/orderManagement/orderDetail.vue` 拉取 `orderTranslateRecordList` 并实现 `saveProductionRow/deleteProductionRow/saveProductionDate`；卡片 `components/OrderDetail/Cards/ProductionInfoCard.vue` 负责 UI/交互/校验；通用壳 `components/OrderDetail/CardWrapper.vue` 管理 mode 与按钮。
- **模板（HTML/组件）结构**：`CardWrapper` + slot；`mode==='add'|'edit'` 渲染 grid-form 表单；`mode==='view'` 渲染 `a-table`（列配置 `columns`，部分列用 `scopedSlots` 自定义渲染：译员链接、币种 label、日期行内编辑、备注截断等）。
- **响应式数据与单向数据流**：`records` 作为 props 输入；watch `records` 生成 `dataSource`，并给每条记录补 `translateRecordConfig`（edit/onlyDateEditable/tmpRow），避免污染父页原始数据；编辑态使用独立的 `editingRecord`。
- **表单校验实现（JS）**：编辑态用 `validateErrors` 做字段级校验（必填 + 两位小数）；保存前 `validateForm()`，不通过则提示并阻止 `$emit('save-row')`。
- **输入约束与联动**：
  - 译员选择：新增时必须从下拉选择有效译员（校验 `translatorId`），避免只输入名称导致后端无法关联。
  - 服务/语言对联动：`fetchTranslatorServiceTypes` 拉取译员服务价格；`availableSourceLanguages/availableTargetLanguages` 根据 service+源语言过滤；切换服务/源语言会清空下游并重置价格。
  - 自动填充价格：`autoFillPriceInfo()` 根据 service+语言对匹配服务价格，自动填充 `unitPrice/unit/currencyType`；同时支持 `calculateTotal()` 计算总价。
- **异步搜索下拉（Vue 事件 + 父子通信）**：译员名称下拉 `@search="(val)=>$emit('translator-search', val)"`，父页 debounce 搜索并回填 `translatorOptions`；选择后组件内 `onTranslatorSelect` 绑定 `translatorId` 并触发“拉取服务类型”。
- **权限/状态驱动 UI（如有）**：父页控制整张卡是否显示（销售角色隐藏）；行内日期编辑按钮按 `statusStr` 判定（交付日期：翻译中/已交付/待结算；结算日期：已交付/待结算）。
- **性能与体验细节（如有）**：高风险动作二次确认：删除“待结算”记录、修改已有结算日期都会弹窗并要求输入确认文案；日期单独编辑用 `tmpRow` 保留原值，取消时可回滚 UI。
- **CSS/布局**：
  - 表单：grid（4 列）+ dense，提升信息密度。
  - 表格：日期列使用小宽度 `inline-date-picker`，操作图标靠近输入框。
  - 译员链接：`.translator-link` hover 高亮，支持快速跳转资源详情。
- **可扩展性与复用**：列配置 `columns` 可集中维护；服务/语言/币种等 options 来自 `config/`；日期“单独编辑”能力通过 `translateRecordConfig` 可复用到其他 table 场景。

追问：为什么新增生产记录要“先新增再补日期”？因为后端新增接口返回后才能拿到 `translateRecordId`，日期确认接口又按 recordId 维度确认；父页用“两段式”（add -> 刷新拿 id -> update/confirm 日期）保证链路稳定。

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

```text
页面（如有）：pages/orderManagement/orderDetail.vue
组件：components/OrderDetail/Cards/ProductionInfoCard.vue
相关：components/OrderDetail/CardWrapper.vue
     config/path.js
     config/resourceDetailConfig.js
     config/languageOption.js
     config/currencyOption.js
     utils/reg.js
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`components/OrderDetail/Cards/ProductionInfoCard.vue`

```js
export default {
  props: {
    records: { type: Array, default: () => [] },
    translatorOptions: { type: Array, default: () => [] },
    showAdd: { type: Boolean, default: true },
    showAddButton: { type: Boolean, default: true },
    loading: { type: Boolean, default: false },
    orderLanguagePair: { type: Object, default: () => ({ srcLang: '', desLang: '' }) }
  },
  data() {
    return {
      dataSource: [],
      editingRecord: { isNew: true, translateRecordConfig: { edit: false } },
      translatorServicePrices: [],
      availableServiceOptions: [],
      validateErrors: {},
      confirmModal: { visible: false, textConfirmAnswer: '', callback: null }
    }
  },
  computed: {
    availableSourceLanguages() {
      if (!this.editingRecord.service || !this.translatorServicePrices.length) return this.languageOptions
      // ...
    }
  },
  watch: {
    records: {
      handler(val) {
        this.dataSource = (val || []).map(r => ({
          ...r,
          translateRecordConfig: r.translateRecordConfig || { edit: false, onlyTranslateFinishDateEditable: false, onlyIncomeFinishDateEditable: false, tmpRow: null }
        }))
      },
      immediate: true,
      deep: true
    }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`components/OrderDetail/Cards/ProductionInfoCard.vue`

```vue
<card-wrapper
  title="生产信息"
  :editable="false"
  :show-add="showAdd"
  :show-add-button="showAddButton"
  @save="handleFormSave"
  @cancel="handleFormCancel"
  @clear="handleFormClear"
>
  <template v-slot="{ mode }">
    <a-form v-if="mode === 'add' || mode === 'edit'">
      <a-form-item class="required" label="资源名称" :validate-status="getValidateStatus('translatorName')" :help="getValidateHelp('translatorName')">
        <a-select
          v-if="editingRecord.isNew"
          show-search
          v-model="editingRecord.translatorName"
          :filter-option="false"
          @search="(val) => $emit('translator-search', val)"
          @change="onTranslatorSelect"
        >
          <a-select-option v-for="item in translatorOptions" :key="item.translatorName">
            {{ item.translatorName }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <!-- service / 语言对 / 单价 / 量级 / 总价 ... -->
    </a-form>

    <a-table v-else :columns="columns" :data-source="dataSource" rowKey="id">
      <template slot="translatorName" slot-scope="text, record">
        <a class="translator-link" @click="goToResourceDetail(record)">{{ truncateName(text) }}</a>
      </template>
      <!-- 日期列：行内编辑 -->
    </a-table>
  </template>
</card-wrapper>
```

### 4）关键交互与业务规则（节选）

文件：`components/OrderDetail/Cards/ProductionInfoCard.vue`

```js
async fetchTranslatorServiceTypes(translatorId) {
  const res = await this.$http.get(path.getResourceServicePriceByResourceId, { resourceId: translatorId })
  this.translatorServicePrices = Array.isArray(res.data) ? res.data : []
  this.availableServiceOptions = [...new Set(this.translatorServicePrices.map(item => item.service).filter(Boolean))]
},

onServiceChange(service) {
  if (!service) return this.resetPrice()
  // 当前语言对无效 -> 清空语言对 + 价格信息
  // 当前语言对有效 -> autoFillPriceInfo()
},

saveSingleDate(record, dateType) {
  if (dateType === 'incomeFinishDate' && record.translateRecordConfig.tmpRow?.incomeFinishDate) {
    this.confirmModal = {
      visible: true,
      content: '您修改了生产结算日期后，该生产任务将变更结算月，请确认是否修改？',
      textConfirmAnswer: '确认修改已告知运营',
      row: record,
      dateType: 'incomeFinishDate',
      callback: () => this.$emit('save-date', record, 'incomeFinishDate')
    }
    return
  }
  this.$emit('save-date', record, dateType)
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

文件：`pages/orderManagement/orderDetail.vue`

```js
// 子组件触发：
// @save-row="saveProductionRow" @delete-row="deleteProductionRow" @save-date="saveProductionDate"
// @translator-search="searchTranslator" @evaluate-row="openEvaluationDialog" @go-to-resource="goToResourceDetail"
async saveProductionRow(record) {
  if (record.isNew) {
    await this.$http.post(`${path.addSalesOrderTranslateRecord}?id=${this.orderId}`, payload)
    // 新增后如果填写了日期：先刷新拿到新记录 id，再二次 update 日期字段
    await this.refreshProductionInfo()
    // ...
    await this.refreshProfitInfo()
    this.$refs.productionInfoCard?.setMode('view')
    this.checkProfitMargin()
    return
  }

  // 更新：先 update 基础字段，再按状态处理日期（必要时二次确认）
  await this.$http.post(path.updateSalesOrderTranslateRecord, basePayload)
  // ...
},

async saveProductionDate(record, dateType) {
  const apiPath = dateType === 'translateFinishDate' ? path.confirmRecordTranslated : path.confirmTranslateRecordIncome
  await this.$http.post(apiPath, { id: this.orderId, translateRecordId: record.id, confirmDate: record[dateType] }, 'query')
  await this.refreshProductionInfo()
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`components/OrderDetail/Cards/ProductionInfoCard.vue`

```scss
.production-info-card {
  .translator-link {
    color: #1890ff;
    cursor: pointer;
    &:hover { color: #40a9ff; }
  }

  .inline-date-picker {
    width: 100px !important;
  }

  .date-action-icon {
    margin-left: 4px;
    color: #1890ff;
    cursor: pointer;
  }
}
```

---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「订单详情与卡片协作」这部分，我主导完成了：方案拆解、风险评估、核心代码落地、联调上线与复盘沉淀。主导范围覆盖：详情页编排、卡片状态管理、提交链路与回滚。

### 量化结果（请按真实数据替换）

- 关键指标：首屏可用时间、卡片保存成功率、联动回归缺陷数 从 X 优化到 Y。
- 交付效率：同类需求交付周期从 X 天 缩短到 Y 天。
- 稳定性：相关线上问题从 X 个/迭代下降到 Y 个/迭代。
- 可维护性：重复逻辑与临时补丁占比下降 X%。

### 故障复盘卡片（与本文主题相关）

1) 现象：卡片联动导致数据不一致。  
- 影响：核心流程可用性或数据一致性受影响。  
- 定位：通过日志、埋点、接口返回与代码链路回溯定位到根因。  
- 止血：快速回滚/降级并加兜底判断。  
- 长期修复：补充边界校验、自动化测试与发布前检查项。

2) 现象：改造后出现跨模块联动异常。  
- 影响：上下游模块结果不一致。  
- 定位：接口契约、状态同步或配置项存在偏差。  
- 止血：统一契约并临时加兼容转换。  
- 长期修复：把契约收敛为单一来源并补文档与门禁。

3) 现象：高峰期下性能或失败率波动。  
- 影响：用户体验下降，工单增加。  
- 定位：识别瓶颈点（请求并发、渲染、缓存或鉴权链路）。  
- 止血：限流/重试/懒加载或拆分重任务。  
- 长期修复：建立持续监控与阈值告警，按周复盘。

### 分时长回答（背诵版）

- 30 秒：
  这部分是我主导落地的，核心目标是把「订单详情与卡片协作」做到稳定、可扩展、可复用，重点解决一致性和线上可维护性。

- 90 秒：
  我按“问题-方案-结果”推进：先定义边界与关键风险，再做结构化改造和统一约定，最后用测试、监控和流程门禁固化成果，确保同类问题不反复出现。

- 3 分钟：
  按“背景、挑战、方案、落地、结果、复盘”展开：
  1) 业务背景与约束。  
  2) 当前痛点与失败案例。  
  3) 方案选择与取舍依据。  
  4) 实施路径与跨团队配合。  
  5) 指标结果与后续优化计划。
