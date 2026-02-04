# 薪资页 前端面试问答

## 前端面试官：你是如何实现 薪资页 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：页面组件负责“拉取月度薪资列表 -> 前端分页 -> 汇总展示 -> 跳转订单页”；表格、分页、按钮等由 Ant Design Vue 组件承载，业务只聚焦数据转换与路由跳转。  
- **模板（HTML/组件）结构**：顶部汇总条展示总订单数与总金额；中部表格展示每个月结算记录；底部分页控制当前页。表格操作列提供“查看订单”，点击后带结算月参数跳到订单页。  
- **响应式数据与单向数据流**：接口返回数据先转成 `allData`（统一字段、补齐 id、把 month 解析成展示文案），再通过 `loadData()` 切片生成当前页的 `tableData`，并在同一处计算汇总 `summary`，保证口径一致。  
- **表单校验实现（JS）**：无复杂表单校验；主要是对接口返回与月份字段做空值兜底（缺 month 显示 `-`），并把金额转成 Number 后 `toFixed`。  
- **输入约束与联动**：  
  - 分页联动：页码/页大小变化都只修改分页状态并重新 `loadData()`，不重复打接口。  
  - 跳转联动：点击“查看订单”把 `record.monthValue` 作为 query.month 传到订单页，订单页负责根据该 month 计算日期区间并查询。  
  - 汇总联动：汇总值基于 `allData` 计算，避免只对“当前页”汇总造成误导。  
- **异步搜索下拉（Vue 事件 + 父子通信）**：该页没有下拉搜索；与订单页的联动通过路由 query 作为“父子通信替代”（跨页状态传递）实现。  
- **权限/状态驱动 UI（如有）**：登录/权限拦截由 `layouts/translator.vue` 处理；若接口失败则统一 message 提示。  
- **性能与体验细节（如有）**：  
  - 月度数据一次拉全并前端分页，减少翻页时的接口请求与等待。  
  - `loading` 控制表格加载态，避免快速切页造成误操作。  
  - 表格列宽固定 + 居中对齐，信息密度可控。  
- **CSS/布局**：  
  - 页面容器统一 padding + 白底 + 边框圆角，符合译员平台统一视觉。  
  - 表格 thead/tbody padding/字号统一覆盖，保证列表页一致性。  
  - 操作链接 hover 主题色一致。  
- **可扩展性与复用**：列配置集中在 `columns` 常量中，新增字段只需补列；分页逻辑独立在 `loadData`，未来如改为后端分页也能平滑迁移（把 `fetchSalaryData` 改为带 page 参数即可）。
（在此填写追问补充句，保持此段落位置不变）
---

## 对应代码（节选/伪码）
> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）
```text
页面（如有）：pages/translator/salary.vue
组件：pages/translator/salary.vue
相关：pages/translator/orders.vue（跳转目标）
相关：layouts/translator.vue
相关：config/path.js
相关：config/currencyOption.js
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`pages/translator/salary.vue`

```js
export default {
  layout: 'translator',
  data() {
    return {
      loading: false,
      allData: [],
      tableData: [],
      currentPage: 1,
      pageSize: 20,
      pageTotal: 0,
      summary: { count: 0, amount: 0 }
    }
  },
  created() {
    this.fetchSalaryData()
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`pages/translator/salary.vue`

```vue
<div class="translator-salary">
  <div class="summary-header">
    共计 {{ summary.count }} 笔订单，金额 ￥{{ summary.amount.toFixed(2) }}
  </div>

  <a-table :columns="columns" :data-source="tableData" :loading="loading" :pagination="false">
    <template slot="action" slot-scope="text, record">
      <a class="action-link" @click="viewOrders(record)">查看订单</a>
    </template>
  </a-table>

  <a-pagination v-model="currentPage" :total="pageTotal" :page-size="pageSize" @change="handleCurrentChange" />
</div>
```

### 4）关键交互与业务规则（节选）

文件：`pages/translator/salary.vue`

```js
async fetchSalaryData() {
  this.loading = true
  const res = await this.$http.get(path.translatorMonthlySalary)
  this.allData = (res.data || []).map((item, index) => ({
    id: index + 1,
    settlementMonth: this.formatMonth(item.month),
    monthValue: item.month,
    orderCount: item.orderCount || 0,
    totalSalary: Number(item.totalAmount || 0),
    currencyType: item.currencyType
  }))
  this.loadData()
  this.loading = false
}

loadData() {
  const start = (this.currentPage - 1) * this.pageSize
  this.tableData = this.allData.slice(start, start + this.pageSize)
  this.pageTotal = this.allData.length
  this.summary = {
    count: sum(this.allData.map(x => x.orderCount)),
    amount: sum(this.allData.map(x => x.totalSalary))
  }
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）
文件：`pages/translator/salary.vue`

```js
viewOrders(record) {
  // 带结算月参数跳转，订单页负责转成日期区间并查询
  this.$router.push({ path: '/translator/orders', query: { month: record.monthValue } })
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`pages/translator/salary.vue`

```scss
.translator-salary {
  padding: 16px;
  background: #fff;
  border: 1px solid #ebedf0;
  border-radius: 8px;

  .bottom-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
```
