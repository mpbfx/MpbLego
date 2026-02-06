# CustomerSettlementCard 前端面试问答

## 前端面试官：你是如何实现 CustomerSettlementCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

这张卡的目标是把“客户结算节点日期（交付/提单/确认/回款）”做成独立的、只负责日期确认/清除的 UI：每个节点一行 `date-picker + action-icon`，并根据订单状态和前置节点是否完成来决定可编辑性；真正的确认/取消接口调用仍由父页处理。

注意：当前版本 `pages/orderManagement/orderDetail.vue` 里该卡片被注释掉（结算日期入口并入了 `CustomerInfoCard`），但这张卡仍可作为“独立结算卡”保留，面试时可以说“我们把高风险结算节点拆成独立卡，后来为了减少入口重复合并到客户信息卡”。

- **Vue 组件分层**：父页 `pages/orderManagement/orderDetail.vue` 提供 `saveSettlementDate/cancelSettlementDate`；卡片 `components/OrderDetail/Cards/CustomerSettlementCard.vue` 只维护本地日期输入与交互；通用 `components/OrderDetail/CardWrapper.vue` 提供骨架与 loading。
- **模板（HTML/组件）结构**：2 列 grid（4 个节点 = 4 行）；每行：`a-date-picker` + `a-icon(save|delete)`；图标显示条件区分“已有确认日期（显示 delete）”与“未确认但已选择（显示 save）”。
- **响应式数据与单向数据流**：`orderInfo` props 输入；watch `orderInfo` 同步到 `localDatetime`（避免直接修改 props）；点击保存 `$emit('save-date', dateType, localDatetime[dateType])`，点击清除走确认弹窗后 `$emit('cancel-date', dateType)`。
- **表单校验实现（JS）**：日期保存前只做“是否选择日期”的轻校验（未选则提示）。
- **输入约束与联动**：
  - 链路约束：`canEditSendBill` 依赖 `translateFinishTime`，`canEditIncomeFinish` 依赖 `sendBillTime`，`canEditRebateFinish` 依赖 `incomeFinishTime`，保证结算链路单向推进。
  - 日期范围：`disabledDate` 规则与其他卡保持一致（每月 20 日前不能选上月 21 日前的日期）。
  - 清除确认：`showCancelConfirm` 显示“清除后订单将回滚到上一个状态”的提示，避免误删导致状态回退。
- **异步搜索下拉（Vue 事件 + 父子通信）**：无。
- **权限/状态驱动 UI（如有）**：保存/删除图标通过 `v-checkPermission` label 控制（例如 `ordermanagement-editFinishAndSendBillOrderDate`）；不同节点使用不同 label，权限更精细。
- **性能与体验细节（如有）**：保存/取消成功后父页只刷新客户信息与操作记录（局部刷新）；弹窗 `closable=false` 防止误点关闭导致“不知道是否成功”。
- **CSS/布局**：
  - `.settlement-grid` 用 CSS Grid 两列排版，信息密度高但仍可读。
  - `.settlement-item` 内用 flex 对齐 label/date/icon，操作区域稳定。
  - 图标 hover 高亮，提示“可点击”。
- **可扩展性与复用**：节点配置（dateType→文案/权限 label）集中在 `cancelDateMap` 等对象里，新增节点时可复用同一套交互（选择→保存、已保存→删除）。

追问：为什么要二次确认清除？因为清除结算日期不仅是字段回退，会触发订单状态回滚（例如清除交付日期后回到“翻译中”），属于高风险操作，必须防误触。

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

```text
页面（如有）：pages/orderManagement/orderDetail.vue（目前注释了该卡片的渲染）
组件：components/OrderDetail/Cards/CustomerSettlementCard.vue
相关：components/OrderDetail/CardWrapper.vue
     middleware/checkPermission.js（指令）
     plugins/checkPermission.js（指令注册/逻辑）
     config/path.js
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`components/OrderDetail/Cards/CustomerSettlementCard.vue`

```js
export default {
  props: { orderInfo: { type: Object, default: () => ({}) } },
  data() {
    return {
      localDatetime: { translateFinishTime: '', sendBillTime: '', incomeFinishTime: '', rebateFinishTime: '' },
      cancelModal: { visible: false, title: '', content: '', dateType: '' }
    }
  },
  computed: {
    canEditTranslateFinish() { return this.orderInfo.statusStr === '翻译中' },
    canEditSendBill() { return !this.orderInfo.sendBillTime && this.orderInfo.translateFinishTime },
    canEditIncomeFinish() { return !this.orderInfo.incomeFinishTime && this.orderInfo.sendBillTime },
    canEditRebateFinish() { return !this.orderInfo.rebateFinishTime && this.orderInfo.incomeFinishTime }
  },
  watch: {
    orderInfo: {
      handler(val) {
        this.localDatetime = {
          translateFinishTime: val.translateFinishTime || '',
          sendBillTime: val.sendBillTime || '',
          incomeFinishTime: val.incomeFinishTime || '',
          rebateFinishTime: val.rebateFinishTime || ''
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    saveDate(dateType) {
      if (!this.localDatetime[dateType]) return this.$message.warning('请选择日期')
      this.$emit('save-date', dateType, this.localDatetime[dateType])
    },
    handleCancelModalOk() {
      this.$emit('cancel-date', this.cancelModal.dateType)
      this.resetCancelModal()
    }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`components/OrderDetail/Cards/CustomerSettlementCard.vue`

```vue
<div class="settlement-item">
  <label>交付日期</label>
  <a-date-picker v-model="localDatetime.translateFinishTime" :disabled="!canEditTranslateFinish" :disabled-date="disabledDate" />
  <template v-if="orderInfo.translateFinishTime">
    <a-icon v-if="orderInfo.statusStr === '已交付'" type="delete" class="date-action" @click="showCancelConfirm('translateFinishTime')" />
  </template>
  <template v-else>
    <a-icon v-if="orderInfo.statusStr === '翻译中' && localDatetime.translateFinishTime" type="save" class="date-action" @click="saveDate('translateFinishTime')" />
  </template>
</div>
```

### 4）关键交互与业务规则（节选）

文件：`components/OrderDetail/Cards/CustomerSettlementCard.vue`

```js
showCancelConfirm(dateType) {
  const cancelDateMap = {
    translateFinishTime: { title: '交付清除', content: '清除该订单的已交付日期后，订单将流转回翻译中状态，是否确认清除？' },
    sendBillTime: { title: '提单清除', content: '清除该订单的提单日期后，订单将流转回已交付状态，是否确认清除？' },
    incomeFinishTime: { title: '确认清除', content: '清除该订单的确认日期后，订单将流转回已提单状态，是否确认清除？' },
    rebateFinishTime: { title: '回款清除', content: '清除该订单的回款日期后，订单将流转回已确认状态，是否确认清除？' }
  }
  const config = cancelDateMap[dateType]
  if (config) this.cancelModal = { visible: true, ...config, dateType }
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

文件：`pages/orderManagement/orderDetail.vue`

```js
// （当前 CustomerSettlementCard 渲染被注释，但父页接口编排仍保留）
async saveSettlementDate(dateType, dateValue) {
  const apiMap = {
    translateFinishTime: path.confirmFileTranslated,
    sendBillTime: path.confirmOrderSendBill,
    incomeFinishTime: path.confirmOrderIncome,
    rebateFinishTime: path.confirmOrderRebate
  }
  await this.$http.post(apiMap[dateType], { id: this.orderId, confirmDate: dateValue }, 'query')
  await this.refreshCustomerInfo()
  await this.refreshOperationRecord()
},

async cancelSettlementDate(dateType) {
  const apiMap = {
    translateFinishTime: path.cancelOrderTranslateFinish,
    sendBillTime: path.cancelOrderSendBill,
    incomeFinishTime: path.cancelOrderIncome,
    rebateFinishTime: path.cancelConfirmOrderRebate
  }
  await this.$http.post(apiMap[dateType], { id: this.orderId }, 'query')
  await this.refreshCustomerInfo()
  await this.refreshOperationRecord()
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`components/OrderDetail/Cards/CustomerSettlementCard.vue`

```scss
.customer-settlement-card {
  .settlement-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 40px;
  }

  .settlement-item {
    display: flex;
    align-items: center;
    gap: 12px;

    label { flex: 0 0 70px; color: #8c8c8c; }
    .date-action { color: #1890ff; cursor: pointer; }
  }
}
```
