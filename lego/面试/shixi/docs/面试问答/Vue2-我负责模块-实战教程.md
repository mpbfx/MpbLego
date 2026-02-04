# Vue2（Nuxt2）实战教程-我负责模块版（big-customer，面向面试）

> 目标：把你在该项目中“用 Vue2/Nuxt2 真正落地过”的关键能力点，整理成一份可以直接复述的教程：**讲清楚为什么这么写、怎么写、追问怎么答**，并且每个点都能指到代码。

适用范围（我负责模块入口）：
- 资源开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:1`
- 资源在场列表：`pages/resourceManagement/onSite.vue:1`
- 资源详情页：`pages/resourceManagement/resourceDetail/_id.vue:1`
- 订单管理列表：`pages/orderManagement/orderList.vue:1`
- 订单详情页：`pages/orderManagement/orderDetail.vue:1`
- 译员平台：`pages/translator/index.vue:1`（含合同/简历预览：`pages/translator/contract.vue:1`、`pages/translator/resumePreview.vue:1`）

---

## 1. 一句话概括（面试开场）

这是一个 Nuxt2（SSR）+ Vue2（Options API）项目：列表页用“筛选组件 + 表格 + URL 状态持久化”保证可用性；详情页用“卡片化 + SSR 并发拉取 + 客户端懒加载”控制复杂度；跨页面复用用 `utils/resource/*` 的“工厂函数 + context 注入”替代 mixin，把同一套业务能力复用到后台资源详情与译员自助端。

---

## 2. 你必须能讲清楚的 Vue2/Nuxt2 生命周期（SSR vs CSR）

### 2.1 `asyncData`：为什么要用（SSR 首屏、路由直达、SEO/首屏性能）

你负责的几个核心页都在用 `asyncData`（Nuxt2 特性）做 SSR 预取：
- 订单列表：`pages/orderManagement/orderList.vue:863`
- 订单详情：`pages/orderManagement/orderDetail.vue:257`
- 资源详情：`pages/resourceManagement/resourceDetail/_id.vue:1578`

典型讲法（订单详情：并发拉取，减少首屏等待）：
- 代码：`pages/orderManagement/orderDetail.vue:310`

```js
const [
  sellerNameListRes,
  orderListRes,
  orderInfoRes,
  orderOperationRecordListRes,
  orderTranslateRecordListRes,
  salesOrderProfitRes
] = await Promise.all([
  app.$http.get(path.getSalesManagerNameList),
  app.$http.get(path.getSalesOrderById, payload),
  app.$http.get(path.getSalesUserByOrderId, payload, 'query'),
  app.$http.get(path.getOrderOperationRecordList, payload),
  app.$http.get(path.getOrderTranslateRecordList, payload),
  app.$http.get(path.getSalesOrderProfit, payload, 'query')
])
```

追问回答要点：
- 为什么不是 `created` 里请求：`asyncData` 在服务端先跑，首屏就有数据（并且可避免“先空白再闪一下”）。
- SSR 报错怎么处理：`asyncData` 可以用 `error({ statusCode, message })` 返回 404 等（见 `pages/orderManagement/orderDetail.vue:327`）。

### 2.2 `created/mounted`：什么时候必须放到客户端

你负责模块里，“只能在浏览器跑”的逻辑统一放在 `mounted`（或更靠后的时机），典型包括：
- `localStorage`：自定义列配置（`pages/resourceManagement/interpreterAndSuppliers.vue:1094`、`pages/resourceManagement/onSite.vue:537`）
- `IntersectionObserver`：滚动定位/高亮（`pages/translator/index.vue:415`；资源详情也有类似实现：`pages/resourceManagement/resourceDetail/_id.vue:1960`）
- `window.onscroll`：表头吸顶（`pages/orderManagement/orderList.vue:1000`）

同时要能讲清“资源释放”：
- `window.onscroll = null`：`pages/orderManagement/orderList.vue:1025`
- `IntersectionObserver.disconnect()`：`pages/translator/index.vue:420`、`pages/resourceManagement/resourceDetail/_id.vue:2003`

---

## 3. 路由与状态：把“页面状态”塞进 URL（可复制、可回放）

### 3.1 列表页：用 `query` 承载筛选条件

订单列表 `asyncData` 会把 URL query 解析成搜索参数（支持从外部直达带筛选）：
- `pages/orderManagement/orderList.vue:863`

```js
if (query.type) {
  Object.assign(searchOrderListObjContainer, {
    status: salesManagerTypeMatchStatusMap[query.type],
  })
  Object.assign(playload, {
    status: searchOrderListObjContainer.status.join(','),
  })
  searchDetailVisible = true
}
```

资源开发/在场列表也有同样思路：从 `$route.query` 反推筛选表单，并用 `ref` 同步到筛选组件：
- 开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:1108`
- 在场列表：`pages/resourceManagement/onSite.vue:554`

### 3.2 组件间同步：`$refs + $nextTick` 的“工程化用法”

列表页为了把 URL query 同步回筛选组件的表单对象，采用了：
- `this.$nextTick(() => Object.assign(this.$refs.xxx.form, filterParams))`
- 代码：`pages/resourceManagement/interpreterAndSuppliers.vue:1133`、`pages/resourceManagement/onSite.vue:582`

面试讲法（取舍）：
- 优点：不引入 Vuex 也能做“页面级状态回放”；筛选组件保持单向输入输出（事件 + props）。
- 代价：需要明确 `ref` 存在时机，且要防止和默认初始化流程互相覆盖（所以一般放在 mounted 且 return 掉默认加载）。

---

## 4. Vue2 复用：不用 mixin，用“工厂函数 + context 注入”（你需要背下来）

核心思想：把“同一套业务能力”从页面里抽到 `utils/resource/*`，对外暴露三类能力：
- `createXxxData()`：返回 data 初始结构（页面 `data()` 里展开）
- `createXxxMethods(this, options)`：返回方法集（页面 `created()` 初始化一次）
- （可选）`createXxxWatchers()`：返回 watcher 定义（页面合并挂载）

入口文档建议配合一起看：
- `docs/面试问答/组件化-复用体系-utils-resource-详解.md:1`

译员平台的典型用法（data 合并 + created 初始化方法）：
- `pages/translator/index.vue:244`
- `pages/translator/index.vue:364`

```js
data() {
  return {
    ...createTranslatorBasicInfoData(),
    ...createOrderTimeData(),
    ...createResumeData(),
  }
},
created() {
  this.basicInfoMethods = createTranslatorBasicInfoMethods(this, {
    onLoadSuccess: () => this.loadOtherModulesData(),
  })
}
```

工厂函数签名示例（把依赖变成 options，而不是“隐式耦合”）：
- `utils/resource/useBasicInfo.js:55`

```js
export function createBasicInfoMethods(context, options = {}) {
  const { onSaveSuccess, onTimezoneUpdate, addOperationRecord } = options
  return { async saveBasicInfo() { /* ... */ } }
}
```

面试追问怎么答：
- 为什么不用 mixin：mixin 依赖隐式合并、命名冲突、可读性差；工厂函数把依赖显式化（`options`），更像“可注入的 service”。
- 为什么不用 Composition API：项目是 Vue2 时代方案（未引入 `@vue/composition-api`），用工厂函数实现“组合式复用”的落地。

---

## 5. 组件化拆分：列表页与详情页两种典型结构

### 5.1 列表页：筛选组件下沉，主页面只做“参数 → 请求 → 渲染”

你负责的资源列表页在页面层做了“薄控制器”：
- mounted：读取 localStorage / 读取 URL query / 初始化请求
- methods：`applyFiltersWithParams` 统一把筛选参数拼到接口 payload
- computed：`visibleColumns` 由用户配置驱动（见下一节）

典型代码（开发列表：列显隐由 `selectedColumns` 决定）：
- `pages/resourceManagement/interpreterAndSuppliers.vue:1081`

```js
visibleColumns() {
  return this.allColumns.filter(col => {
    if (col.key === 'operation') return true
    return this.selectedColumns.includes(col.key)
  })
}
```

### 5.2 详情页：卡片化（单卡单职责）+ `ref` 驱动编辑态

订单详情页是卡片化拆分的典型：在 SSR 拿到数据后，`mounted` 再通过 `ref` 控制子卡片进入编辑态：
- `pages/orderManagement/orderDetail.vue:374`

```js
if (this.$refs.customerInfoCard && !this.orderId) {
  this.$refs.customerInfoCard.setMode('edit')
}
```

资源详情页的卡片更多，主页面会把“复用模块 methods”代理成页面 methods，保证模板调用一致：
- 例如简历相关：`pages/resourceManagement/resourceDetail/_id.vue:2350`

---

## 6. 表单与校验：Ant Design Vue 的 Vue2 落地方式

你需要能说清楚这套“表单实例 + validateFields + UI 状态”的链路：
- 表单实例：`pages/translator/index.vue:258`（`this.$form.createForm(this)`）
- 校验提交：`utils/resource/useBasicInfo.js:81`（`context.basicForm.validateFields(...)`）
- 资源详情页也有同样模式：`pages/resourceManagement/resourceDetail/_id.vue:3062`

面试讲法：
- Vue2 下推荐把“校验 + DTO 转换 + API 调用 + 成功回调”收敛进可复用 methods（`utils/resource/*`），页面只负责 wiring（初始化 methods、传回调）。

---

## 7. 列表交互：自定义列/批量操作/局部更新（体现工程经验）

### 7.1 自定义列：localStorage 做“用户偏好持久化”

- 开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:1094`
- 在场列表：`pages/resourceManagement/onSite.vue:537`

```js
const savedColumns = localStorage.getItem('resource_custom_columns')
if (savedColumns) this.selectedColumns = JSON.parse(savedColumns)
```

你要能讲清楚两点：
- 为什么放 mounted：SSR 环境没有 localStorage。
- 为什么 try/catch：历史数据或手动改 localStorage 会导致 JSON 解析失败。

### 7.2 局部更新：避免“全量刷新导致用户焦点丢失”

订单列表提交确认日期后，成功回调里只更新当前行数据：
- `pages/orderManagement/orderList.vue:1141`

```js
if (res.errorCode === 200) {
  this.updateOrderList({ id: playload.id, confirmDate: playload.confirmDate, type: pathKey }, 'single')
}
```

---

## 8. 性能与体验：你做过的“Vue2 能落地的优化”

### 8.1 IntersectionObserver 替代 scroll 监听（更省）

- 译员平台：`pages/translator/index.vue:523`
- 资源详情页：`pages/resourceManagement/resourceDetail/_id.vue:2717`

讲法（面试官爱问“为什么不用 scroll”）：
- scroll 频繁触发，容易导致主线程压力；IntersectionObserver 由浏览器调度，更省且更稳定。

### 8.2 SSR 并发 + 容错（Promise.allSettled）

资源详情页在 `asyncData` 用 `Promise.allSettled` 并发拉取首屏数据，减少串行等待，并允许非关键接口失败不阻塞：
- `pages/resourceManagement/resourceDetail/_id.vue:1645`

---

## 9. 面试追问清单（背诵版）

1) 为什么 `asyncData` 里不用 `this`？
   - `asyncData` 在组件实例创建前执行，只有 `app/store/route` 等上下文（见 `pages/orderManagement/orderDetail.vue:257`）。
2) 为什么 localStorage/IntersectionObserver 放在 mounted？
   - SSR 没有浏览器 API；放 mounted 能避免服务端渲染报错（见 `pages/resourceManagement/onSite.vue:537`、`pages/translator/index.vue:415`）。
3) Vue2 复用为什么不用 mixin？
   - mixin 依赖隐式合并、冲突难排；工厂函数把依赖通过 `options` 明确注入（`utils/resource/useBasicInfo.js:55`）。
4) 列表为什么要把筛选写到 URL？
   - 可复制、可回放、可从报表/外部入口直达，并且刷新不丢（`pages/orderManagement/orderList.vue:863`）。
5) 为什么做局部更新而不是重刷列表？
   - 用户滚动位置/选择态/筛选面板状态不丢，体验更好（`pages/orderManagement/orderList.vue:1141`）。

---

## 10. 建议你在面试中怎么串起来讲（30 秒故事线）

先说“我负责的 6 个核心入口页”，再用 3 个关键词把 Vue2 能力串起来：
- SSR（`asyncData` 并发拉取，首屏更快、更可直达）
- 复用（`utils/resource/*` 工厂函数，让后台资源详情和译员平台复用同一套业务能力）
- 体验/性能（IntersectionObserver、localStorage 列偏好、列表局部更新）

