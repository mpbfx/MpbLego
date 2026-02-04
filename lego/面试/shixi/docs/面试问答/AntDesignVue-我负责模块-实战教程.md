# Ant Design Vue（Vue2）使用教程-我负责模块版（big-customer，面向面试）

> 目标：把你在项目里“真实落地过”的 Ant Design Vue（1.x，Vue2）用法整理成可复述教程：**如何接入、常用组件怎么用、常见坑怎么解释**，并配 `file:line` 作为举证点。

我负责模块入口（举例页面）：
- 资源开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:1`
- 资源在场列表：`pages/resourceManagement/onSite.vue:1`
- 资源详情页：`pages/resourceManagement/resourceDetail/_id.vue:1`
- 订单管理列表：`pages/orderManagement/orderList.vue:1`
- 订单详情页：`pages/orderManagement/orderDetail.vue:1`
- 译员平台：`pages/translator/index.vue:1`

---

## 1. 项目里是怎么接入 Ant Design Vue 的（你要能讲“为什么这么配”）

### 1.1 全局注册（按需 `Vue.use`）

项目通过 Nuxt 插件注册 AntD 组件，并把 message/confirm 等挂到 `Vue.prototype`：
- `plugins/antd-ui.js:1`

关键点：
- `Vue.use(Table/Modal/Form/Select/DatePicker/Tooltip/...)`
- `Vue.prototype.$message = message`
- `Vue.prototype.$confirm = Modal.confirm`

这让你在页面里可以直接写：
- 组件标签：`<a-table /> <a-modal /> <a-select /> ...`
- JS 调用：`this.$message.success(...)`、`this.$confirm({ ... })`

### 1.2 Nuxt 配置（CSS + 插件 + SSR 兼容）

- 全局样式引入：`nuxt.config.js:59`（`ant-design-vue/dist/antd.css`）
- 插件加载：`nuxt.config.js:67`（`@/plugins/antd-ui`）
- SSR/构建兼容：`nuxt.config.js:136`
  - `babel-plugin-import` 使用 `libraryDirectory: 'lib'`（CJS）避免服务端 ESM 报错
  - `transpile: [/^ant-design-vue/]` 确保 SSR bundle 不缺依赖

面试讲法：
“Nuxt2 SSR 下，UI 库如果发布形态含 ESM/需要转译，经常遇到服务端运行时报错，所以这里明确：**按需引入走 CJS + SSR 侧 transpile**。”

---

## 2. `a-table`：列表页的核心（列定义、插槽渲染、选择行、横向滚动）

### 2.1 columns 配置 + `scopedSlots.customRender`

订单列表把 columns 抽成常量数组，并通过 `scopedSlots` 指定自定义渲染：
- `pages/orderManagement/orderList.vue:624`

```js
const columns = [
  { title: '订单号', dataIndex: 'id', key: 'id', width: 100, scopedSlots: { customRender: 'id' } },
  { title: '订单名称', dataIndex: 'orderName', key: 'orderName', width: 160, scopedSlots: { customRender: 'orderName' } },
]
```

对应模板里用 Vue2 的 `slot-scope="text, row"` 接收 AntD Table 传进来的 `text/record`：
- `pages/orderManagement/orderList.vue:331`

```vue
<a-table :columns="columns" :data-source="orderList" rowKey="id">
  <span slot="orderName" slot-scope="text, row">
    <a-tooltip>
      <template slot="title">{{ row.orderName }}</template>
      {{ row.orderName }}
    </a-tooltip>
  </span>
</a-table>
```

面试追问怎么答：
- `slot-scope` 的参数来自 Table 内部调用 scoped slot 时传的 slotProps（record/text/index）。
- 为什么 columns 不写 render function：Vue 模板更直观，也更容易组合 tooltip/权限指令/点击事件。

### 2.2 行选择（rowSelection）

订单列表使用 `:row-selection="{ selectedRowKeys, onChange }"` 实现批量操作：
- `pages/orderManagement/orderList.vue:319`

```vue
<a-table
  :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
/>
```

常见追问：
- 批量操作为什么用 `selectedRowKeys`：只存 key，不存整行对象，避免引用过大/数据过期。

### 2.3 横向滚动 + 固定列（体验：列多不挤压）

订单列表设置横向滚动：
- `pages/orderManagement/orderList.vue:329`（`:scroll="{ x: 1000 }"`）

订单列表还在 columns 里把 “订单状态” 固定到右侧：
- `pages/orderManagement/orderList.vue:756`

资源开发列表/在场列表使用：
- `:scroll="{ x: 'max-content', y: 'calc(100vh)' }"`（表格内容多时保证可用）
- `pages/resourceManagement/interpreterAndSuppliers.vue:38`
- `pages/resourceManagement/onSite.vue:31`

---

## 3. `a-pagination`：分页与页面状态（v-model + 回调）

订单列表使用 `v-model="currentPage"` 绑定当前页，并通过事件触发请求：
- `pages/orderManagement/orderList.vue:303`

```vue
<a-pagination
  v-model="currentPage"
  :total="orderListPageNum"
  :page-size="orderListPageSize"
  @change="handleCurrentChange"
  @showSizeChange="onShowSizeChange"
  show-size-changer
/>
```

面试讲法：
- `v-model` 管“当前页状态”
- `@change/@showSizeChange` 管“副作用”（发请求、刷新列表）

---

## 4. `a-form`：Vue2 时代的表单实例（`this.$form.createForm` + `validateFields`）

资源详情页会创建多个表单实例分别管理不同卡片/区块：
- `pages/resourceManagement/resourceDetail/_id.vue:1199`

```js
data() {
  return {
    basicForm: this.$form.createForm(this),
    developmentForm: this.$form.createForm(this),
    testForm: this.$form.createForm(this),
  }
}
```

校验提交使用 `validateFields`（校验通过后再走保存逻辑）：
- `pages/resourceManagement/resourceDetail/_id.vue:3062`

面试追问怎么答：
- 为什么不是每个卡片一个 form：拆成多个 form 可以控制校验范围，避免保存某一块时触发全页校验。
- Vue2 响应式注意点：表单字段更新通常走 AntD 的 form API（或 v-model + 手动校验），不要混用造成“校验值不是最新”。

---

## 5. `a-modal`：弹窗（受控 visible、footer、自定义 bodyStyle、SSR client-only）

### 5.1 业务弹窗（订单详情“新增评价”）

订单详情页里有 `a-modal + a-date-picker + a-select` 的组合表单：
- `pages/orderManagement/orderDetail.vue:83`

### 5.2 工具弹窗（PDF 预览）

PDF 预览弹窗是“受控组件”：
- props：`visible/pdfUrl/fileName`（`components/PdfPreviewModal.vue:59`）
- 关闭：`this.$emit('update:visible', false)`（`components/PdfPreviewModal.vue:125`）

对应代码摘录：

```js
// components/PdfPreviewModal.vue:52
export default {
  props: {
    visible: { type: Boolean, default: false },
    pdfUrl: { type: String, default: '' },
    fileName: { type: String, default: '' }
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false)
      this.$emit('close')
    }
  }
}
```

并且用 `<client-only>` 包住只在浏览器可运行的 pdf 组件：
- `components/PdfPreviewModal.vue:28`

面试讲法：
- Nuxt SSR 下，依赖 window/document 的组件必须 client-only，否则服务端渲染会报错。

---

## 6. `a-select` / `a-select-option`：枚举选择、动态列表、联动

典型用法：
- `v-model` 绑定值
- `v-for` 渲染 options

订单详情评价打分：
- `pages/orderManagement/orderDetail.vue:120`

资源详情表单里也大量用到 select（包含 disabled 受字段权限控制）：
- `pages/resourceManagement/resourceDetail/_id.vue:438`

常见追问：
- 下拉浮层被遮挡怎么办：用 `:getPopupContainer="getPopupContainer"` 把浮层挂到指定容器（你资源开发列表编辑状态就有类似处理：`pages/resourceManagement/interpreterAndSuppliers.vue:122`）。

---

## 7. `a-tooltip`：长文本不挤布局（hover 看全量）

订单列表、资源开发列表都把长字段做 tooltip（表格里尤其常见）：
- 订单列表：`pages/orderManagement/orderList.vue:350`
- 资源开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:41`

面试讲法：
- Table 单元格宽度有限，tooltip 是“信息密度 vs 可读性”的折中。

---

## 8. `message / confirm / notification`：统一交互反馈

全局挂载位置：
- `plugins/antd-ui.js:46`（`$message/$confirm/$notification`）

你在业务里常见用法：
- 成功/失败提示：`this.$message.success('保存成功')`
- 二次确认：`this.$confirm({ title, content, onOk })`（订单列表/资源列表都有）

面试讲法：
- 统一反馈能减少“静默失败”的排查成本；并且把危险操作（删除/清除日期/入库）全部加 confirm，降低误操作风险。

---

## 9. 权限指令与 AntD 组件的组合（工程细节）

你项目里权限控制大量叠加在 AntD 组件上：
- 包一层 `<span v-checkPermission>...</span>` 再放按钮（批量操作区）：`pages/orderManagement/orderList.vue:260`
- 或者直接把指令挂到 `<a-icon>` 上：`pages/orderManagement/orderList.vue:395`

指令实现：
- `plugins/checkPermission.js:9`

面试讲法（取舍）：
- 让“没有权限的控件”在 DOM 层直接不存在（comment 替换），比仅仅 `disabled` 更安全（防止点击事件或热键误触发）。
