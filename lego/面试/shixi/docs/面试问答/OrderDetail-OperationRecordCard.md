# OperationRecordCard 前端面试问答

## 前端面试官：你是如何实现 OperationRecordCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

这张卡是“审计与追溯”的只读表：前端只负责把后端返回的操作记录渲染成表格（时间/内容/操作人），并在关键动作（保存客户信息、取消结算日期）后局部刷新，保证面试官追问“你如何做可追溯性”时有完整闭环。

- **Vue 组件分层**：父页 `pages/orderManagement/orderDetail.vue` 负责拉取 `orderOperationRecordList` 并提供 `refreshOperationRecord()`；卡片 `components/OrderDetail/Cards/OperationRecordCard.vue` 纯展示；外层 `components/OrderDetail/CardWrapper.vue` 统一卡片骨架（折叠/标题/loading）。
- **模板（HTML/组件）结构**：`CardWrapper` + `a-table`，关闭分页 `:pagination="false"`，一屏能看完最近操作。
- **响应式数据与单向数据流**：`records` 从父页 props 输入；组件不做深拷贝与二次加工，避免出现“排序/过滤导致父页数据变异”的副作用。
- **表单校验实现（JS）**：无（纯展示）。
- **输入约束与联动**：
  - rowKey：使用 `id`，保证渲染稳定。
  - 列宽：时间/操作人固定宽度，内容列自适应，避免长文本挤压时间字段。
  - 父页刷新时机：保存客户信息后一起刷新操作记录，形成“动作→记录”的强一致体验。
- **异步搜索下拉（Vue 事件 + 父子通信）**：无。
- **权限/状态驱动 UI（如有）**：父页按角色控制是否显示（销售角色隐藏操作记录）。
- **性能与体验细节（如有）**：操作记录属于“局部刷新即可”的数据，父页调用单独接口 `getOrderOperationRecordList`，避免拉整页数据。
- **CSS/布局**：
  - 通过 `/deep/` 覆盖 AntD table padding，让表格更像“日志摘要”。
  - 表头背景淡灰强调列名。
  - scoped 样式隔离到卡片内，避免影响其他 table。
- **可扩展性与复用**：columns 是常量配置，后续如果要补“操作类型/备注/来源”等，只需要加列和后端字段即可。

追问：为什么不在组件里做排序/过滤？因为操作记录的权威顺序一般由后端定义（按 createTime），前端如果擅自排序/截断可能影响审计；需要筛选时更适合在父页做“查询参数 + 后端分页/过滤”。

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

```text
页面（如有）：pages/orderManagement/orderDetail.vue
组件：components/OrderDetail/Cards/OperationRecordCard.vue
相关：components/OrderDetail/CardWrapper.vue
     config/path.js
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`components/OrderDetail/Cards/OperationRecordCard.vue`

```js
const columns = [
  { title: '操作时间', dataIndex: 'createTimeStr', key: 'createTimeStr', width: 180 },
  { title: '操作内容', dataIndex: 'content', key: 'content' },
  { title: '操作人', dataIndex: 'operatorName', key: 'operatorName', width: 120 }
]

export default {
  props: {
    records: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },
  data() {
    return { columns }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`components/OrderDetail/Cards/OperationRecordCard.vue`

```vue
<card-wrapper title="操作记录" :editable="false" :loading="loading">
  <template v-slot="{ mode }">
    <a-table :columns="columns" :data-source="records" :pagination="false" size="small" rowKey="id" />
  </template>
</card-wrapper>
```

### 4）关键交互与业务规则（节选）

文件：`pages/orderManagement/orderDetail.vue`

```js
async refreshOperationRecord() {
  const payload = { id: this.orderId }
  const res = await this.$http.get(path.getOrderOperationRecordList, payload)
  this.orderOperationRecordList = res.data || []
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

文件：`（按需填写）`

```js
// 在此粘贴/编写代码（可省略非关键细节）
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`components/OrderDetail/Cards/OperationRecordCard.vue`

```scss
.operation-record-card {
  /deep/ .ant-table-thead > tr > th {
    padding: 12px 8px;
    background: #fafafa;
  }

  /deep/ .ant-table-tbody > tr > td {
    padding: 12px 8px;
  }
}
```
