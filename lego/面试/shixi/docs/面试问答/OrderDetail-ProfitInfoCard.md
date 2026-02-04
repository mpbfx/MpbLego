# ProfitInfoCard 前端面试问答

## 前端面试官：你是如何实现 ProfitInfoCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

这张卡的职责是“只读展示收益结果 + 低毛利提示的入口”：前端不做复杂计算，只负责表格展示与格式化（百分比），数据来源与阈值提示逻辑放在父页，避免 UI 组件变成“业务计算中心”。

- **Vue 组件分层**：父页 `pages/orderManagement/orderDetail.vue` 拉取 `orderProfitList` 并在保存生产信息后触发 `checkProfitMargin()`；卡片 `components/OrderDetail/Cards/ProfitInfoCard.vue` 只做展示；通用壳 `components/OrderDetail/CardWrapper.vue` 统一卡片骨架。
- **模板（HTML/组件）结构**：`CardWrapper` + `a-table`，`scopedSlots` 只处理 `profitMargin` 的展示格式。
- **响应式数据与单向数据流**：`profitData` 从父页 props 输入；组件内 computed `dataSource` 只做“补 id”处理，保证 `rowKey` 稳定。
- **表单校验实现（JS）**：无（纯展示）。
- **输入约束与联动**：
  - 数字格式：利润率统一走 `formatNumberToPercentage`，避免手写 `*100 + '%'` 导致精度/空值问题。
  - 表格 key：无 id 时使用 index 兜底，避免 AntD table warning。
  - 父页提示：保存生产信息后触发 `checkProfitMargin()`，低于阈值弹 info modal（业务提醒而非强约束）。
- **异步搜索下拉（Vue 事件 + 父子通信）**：无。
- **权限/状态驱动 UI（如有）**：父页按 `orderId` 控制是否渲染该卡（新建订单不显示）。
- **性能与体验细节（如有）**：父页刷新收益信息只调用 `getSalesOrderProfit`，不联动刷新其他卡；表格关闭分页 `:pagination="false"`，信息密度高、滚动少。
- **CSS/布局**：
  - table cell padding 统一，阅读更像“摘要表”而不是业务列表。
  - 表头背景 `#fafafa`，强调数据列名称。
  - scoped 样式用 `/deep/` 覆盖 AntD 默认 table padding。
- **可扩展性与复用**：columns 抽成常量，后续新增字段只改列配置与后端返回即可；格式化函数集中在 `utils/formatNum`，其他模块可复用。

追问：利润率阈值为什么放在父页而不是卡片？因为阈值属于业务策略（可能随角色/版本变化），放在父页更容易结合“保存生产信息/刷新收益信息”的时机统一触发，且卡片保持纯展示更易复用与测试。

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

```text
页面（如有）：pages/orderManagement/orderDetail.vue
组件：components/OrderDetail/Cards/ProfitInfoCard.vue
相关：components/OrderDetail/CardWrapper.vue
     utils/formatNum.js
     config/path.js
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`components/OrderDetail/Cards/ProfitInfoCard.vue`

```js
const columns = [
  { title: '订单收入（元）', dataIndex: 'orderIncome', key: 'orderIncome' },
  { title: '订单成本（元）', dataIndex: 'orderCost', key: 'orderCost' },
  { title: '订单毛利润（元）', dataIndex: 'orderProfit', key: 'orderProfit' },
  { title: '毛利率', dataIndex: 'profitMargin', key: 'profitMargin', scopedSlots: { customRender: 'profitMargin' } }
]

export default {
  props: { profitData: { type: Array, default: () => [] } },
  computed: {
    dataSource() {
      return this.profitData.map((item, index) => ({ ...item, id: item.id || index }))
    }
  },
  methods: {
    formatPercentage(value) { return formatNumberToPercentage(value) }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`components/OrderDetail/Cards/ProfitInfoCard.vue`

```vue
<card-wrapper title="收益信息" :editable="false">
  <template v-slot="{ mode }">
    <a-table :columns="columns" :data-source="dataSource" :pagination="false" rowKey="id">
      <template slot="profitMargin" slot-scope="text">
        {{ formatPercentage(text) }}
      </template>
    </a-table>
  </template>
</card-wrapper>
```

### 4）关键交互与业务规则（节选）

文件：`pages/orderManagement/orderDetail.vue`

```js
async refreshProfitInfo() {
  const payload = { id: this.orderId }
  const res = await this.$http.get(path.getSalesOrderProfit, payload, 'query')
  this.orderProfitList = res.data ? [res.data] : []
},

async checkProfitMargin() {
  const res = await this.$http.get(path.getSalesOrderProfit, { id: this.orderId }, 'query')
  if (res.data?.profitMargin < 0.2) {
    this.$info({ title: '利润率过低提示', content: '当前订单利润率已低于20%，请注意控制成本！' })
  }
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

文件：`（按需填写）`

```js
// 在此粘贴/编写代码（可省略非关键细节）
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`components/OrderDetail/Cards/ProfitInfoCard.vue`

```scss
.profit-info-card {
  /deep/ .ant-table-thead > tr > th {
    padding: 12px 8px;
    background: #fafafa;
  }

  /deep/ .ant-table-tbody > tr > td {
    padding: 12px 8px;
  }
}
```
