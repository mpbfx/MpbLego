# CustomerInfoCard 前端面试问答

## 前端面试官：你是如何实现 CustomerInfoCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

我把“订单基础信息编辑 + 客户结算关键日期”放在一张卡里，核心是：用 `CardWrapper` 统一 view/edit 模式与操作按钮；组件内部维护 `formData` 做“编辑草稿”，通过 `$emit` 把保存/搜索/清除日期等动作交给父页调用接口，并在父页做局部刷新，避免整页重拉。

- **Vue 组件分层**：父页 `pages/orderManagement/orderDetail.vue` 负责数据拉取与接口编排；卡片 `components/OrderDetail/Cards/CustomerInfoCard.vue` 负责表单渲染、校验、交互细节；通用壳 `components/OrderDetail/CardWrapper.vue` 提供 mode（view/edit/add）与按钮区。
- **模板（HTML/组件）结构**：`CardWrapper` + `v-slot="{ mode }"`；`mode==='edit'` 渲染 AntD 表单（`a-form/a-form-item/a-input/a-select/a-date-picker`）；`mode!=='edit'` 渲染只读的 grid view（label/value）。
- **响应式数据与单向数据流**：`orderInfo` 作为 props 输入；watch `orderInfo`（deep + immediate）把值复制到 `formData`，避免直接改 props；保存时 `$emit('save', formData)` 由父页提交并刷新 `orderInfo`。
- **表单校验实现（JS）**：用 `validateErrors` 维护每个字段的错误信息，配合 `a-form-item` 的 `:validate-status` / `:help` 实现“字段级红框 + 文案”；保存时先 `validateForm()` 再触发 `$emit('save')`。
- **输入约束与联动**：
  - 语言方向：`onSrcLangChange/onDesLangChange` 防止源语言与目标语言相同（相同则清空另一侧）。
  - 金额/字数：`checkTwoDigitNumber` 做“两位小数”约束，`isNumer` 做数字判定；不满足时提示“不会计算总价”。
  - 总价联动：`calculateTotalPrice()` 支持“重复量级 + 权重”加成，统一保留两位小数（`roundDecimal`）。
- **异步搜索下拉（Vue 事件 + 父子通信）**：客户名称 `a-select` 的 `@search/@change` 通过 `$emit('user-search'|'user-change')` 交给父页做 debounce 搜索与“带出历史订单信息预填”（`getPmAndUserLastOrderInfo`）。
- **权限/状态驱动 UI（如有）**：结算节点日期（交付/提单/确认/回款）的“可编辑/可删除”由 `orderInfo.statusStr + 各日期字段` 推导；删除按钮还叠加 `v-checkPermission` label 控制（例如 `ordermanagement-deleteFinishAndSendBillOrderDate`）。
- **性能与体验细节（如有）**：父页保存成功后只刷新“客户信息 + 操作记录”，不刷新整个页面；日期删除走二次确认 modal，避免误操作导致订单状态回滚。
- **CSS/布局**：
  - 编辑态：`grid-form` 用 CSS Grid 排版（4 列），密集布局但字段对齐。
  - 查看态：`field-view.grid-view` 同样用 grid（label/value），保持“资源详情页一致”的阅读体验。
  - 行内日期：`.inline-date` + 删除图标贴近输入框，减少视线跳转。
- **可扩展性与复用**：通过 `CardWrapper` 抽掉“卡片标题 + 操作按钮 + 折叠 + loading skeleton”的重复；业务字段配置（币种/语言/单位/服务）从 `config/` 读取，保证全局一致。

追问：为什么结算日期放在客户信息卡里？因为保存订单基础信息时，结算节点需要按链路做“先取消后确认”的编排（回款→确认→提单→交付），放在父页统一处理能保证一致性与可回滚。

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

```text
页面（如有）：pages/orderManagement/orderDetail.vue
组件：components/OrderDetail/Cards/CustomerInfoCard.vue
相关：components/OrderDetail/CardWrapper.vue
     config/currencyOption.js
     config/languageOption.js
     config/resourceDetailConfig.js
     utils/reg.js
     utils/project.js
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`components/OrderDetail/Cards/CustomerInfoCard.vue`

```js
export default {
  props: {
    orderInfo: { type: Object, default: () => ({}) },
    sellerNameOptions: { type: Array, default: () => [] },
    userNameOptions: { type: Array, default: () => [] },
    editable: { type: Boolean, default: true },
    showEdit: { type: Boolean, default: true },
    loading: { type: Boolean, default: false }
  },
  data() {
    return {
      formData: {},
      validateErrors: {},
      cancelModal: { visible: false, title: '', content: '', dateType: '' }
    }
  },
  computed: {
    canEditTranslateFinish() { return this.orderInfo.statusStr === '翻译中' },
    canEditSendBill() { return !this.orderInfo.sendBillTime && this.orderInfo.translateFinishTime },
    canCancelSendBill() { return !!this.orderInfo.sendBillTime && !this.orderInfo.incomeFinishTime }
    // ...
  },
  watch: {
    orderInfo: {
      handler(val) { this.formData = { ...val } },
      immediate: true,
      deep: true
    }
  },
  methods: {
    handleSave() {
      if (!this.validateForm()) return
      this.$emit('save', this.formData)
    },
    onUserNameSearch(value) { this.$emit('user-search', value) },
    onUserNameChange(value, option) { this.$emit('user-change', value, option) },
    handleCancelModalOk() {
      this.$emit('cancel-date', this.cancelModal.dateType)
      this.resetCancelModal()
    }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`components/OrderDetail/Cards/CustomerInfoCard.vue`

```vue
<card-wrapper
  title="客户信息"
  :editable="editable"
  :show-edit="showEdit"
  @save="handleSave"
  @cancel="handleCancel"
  @clear="handleClear"
  @mode-change="handleModeChange"
>
  <template v-slot="{ mode }">
    <a-form v-if="mode === 'edit'">
      <a-form-item class="required" label="客户名称" :validate-status="getValidateStatus('userName')" :help="getValidateHelp('userName')">
        <a-select
          show-search
          v-model="formData.userName"
          :filter-option="false"
          @search="onUserNameSearch"
          @change="onUserNameChange"
        >
          <a-select-option v-for="item in userNameOptions" :key="item.userName" :id="item.id">
            {{ item.userName }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="交付日期">
        <div class="inline-date">
          <a-date-picker v-model="formData.translateFinishTime" :disabled="!canEditTranslateFinish" />
          <a-icon v-if="canCancelTranslateFinish" type="delete" @click="showCancelConfirm('translateFinishTime')" />
        </div>
      </a-form-item>
    </a-form>

    <div v-else class="view-box">
      <div class="field-view grid-view">
        <div class="field-item">
          <span class="label">客户名称</span>
          <span class="value">{{ formatViewValue(orderInfo.userName) }}</span>
        </div>
        <!-- ... -->
      </div>
    </div>
  </template>
</card-wrapper>
```

### 4）关键交互与业务规则（节选）

文件：`components/OrderDetail/Cards/CustomerInfoCard.vue`

```js
validateForm() {
  this.validateErrors = {}
  let isValid = true
  const requiredFields = [
    { field: 'userName', label: '客户名称' },
    { field: 'addOrderTime', label: '下单日期' },
    { field: 'sellerName', label: '销售经理' }
    // ...
  ]

  requiredFields.forEach(({ field, label }) => {
    const value = this.formData[field]
    if (value === undefined || value === null || (typeof value === 'string' && String(value).trim() === '')) {
      this.$set(this.validateErrors, field, `请输入${label}!`)
      isValid = false
    }
  })

  if (this.formData.wordNum && !checkTwoDigitNumber(this.formData.wordNum)) {
    this.$set(this.validateErrors, 'wordNum', '请输入数字（支持两位小数）')
    isValid = false
  }
  return isValid
},

calculateTotalPrice() {
  const { unitPrice, wordNum, duplicateWordNum, duplicateWordRate } = this.formData
  if (!isNumer(unitPrice) || !checkTwoDigitNumber(wordNum)) return
  let totalPrice = parseFloat(unitPrice) * parseFloat(wordNum)
  if (duplicateWordNum && duplicateWordRate) {
    totalPrice += (parseFloat(duplicateWordNum) * parseFloat(unitPrice) * parseFloat(duplicateWordRate)) / 100
  }
  this.formData.totalPrice = roundDecimal(totalPrice, 2)
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

文件：`pages/orderManagement/orderDetail.vue`

```js
// 子组件触发：@save="saveCustomerInfo" @user-search="handleUserSearch" @cancel-date="cancelSettlementDate"
async saveCustomerInfo(formData) {
  const settlementKeys = ['translateFinishTime', 'sendBillTime', 'incomeFinishTime', 'rebateFinishTime']

  // 1) 先更新订单基础信息（不包含结算日期）
  await this.$http.post(`${path.updateSalesOrder}?id=${this.orderId}`, strip(formData, settlementKeys))

  // 2) 同一次保存：结算日期“先取消（回滚链路）再确认（推进链路）”
  for (const key of [...settlementKeys].reverse()) {
    // prev 有值但 next 变了 -> 调 cancel 接口
  }
  for (const key of settlementKeys) {
    // next 有值且与 prev 不同 -> 调 confirm 接口
  }

  await this.refreshCustomerInfo()
  await this.refreshOperationRecord()
  this.$refs.customerInfoCard?.setMode('view')
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`components/OrderDetail/Cards/CustomerInfoCard.vue`

```scss
.customer-info-card {
  .field-view.grid-view {
    display: grid;
    grid-template-columns: repeat(var(--cols, 4), 1fr);
    column-gap: 16px;
  }

  .inline-date {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
```
