# Vue2/Nuxt2 手写面试题库-我负责模块（big-customer，面向面试）

> 目标：从你负责模块的真实 Vue2/Nuxt2 代码里抽题，面试时可以现场手写（或口述关键代码）并解释取舍。每题都给项目 `file:line` 例子，方便你“举证”。

关联入口（我负责模块）：
- 资源开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:1`
- 资源在场列表：`pages/resourceManagement/onSite.vue:1`
- 资源详情页：`pages/resourceManagement/resourceDetail/_id.vue:1`
- 订单管理列表：`pages/orderManagement/orderList.vue:1`
- 订单详情页：`pages/orderManagement/orderDetail.vue:1`
- 译员平台：`pages/translator/index.vue:1`
- PDF 预览弹窗：`components/PdfPreviewModal.vue:1`

---

## 1) 手写题：实现一个 Vue2 自定义指令 `v-checkPermission`

题目：
实现 `v-checkPermission="{ roleType, label }"`：
- 没权限时隐藏该 DOM（或禁用点击）
- 权限变化时能重新生效（至少支持 update）
- 不要让页面报错（例如 v-if / slot 场景）

项目例子（真实实现：直接把节点替换成 comment 节点）：
- `plugins/checkPermission.js:9`

答案（手写版：隐藏/可选禁用）：

```js
// plugins/checkPermission.js（简化版）
import Vue from 'vue'

function can(roleType, label, permissionTable) {
  return permissionTable[label] ? permissionTable[label].includes(roleType) : false
}

Vue.directive('checkPermission', {
  inserted(el, binding, vnode) {
    const { roleType, label, type } = binding.value || {}
    const ok = can(roleType, label, vnode.context.$store.state.permissionTable || {})
    if (ok) return

    if (type === 'click-disable') {
      el.style.pointerEvents = 'none'
      el.style.opacity = '0.5'
      return
    }
    el.parentNode && el.parentNode.removeChild(el)
  },
  update(el, binding, vnode) {
    // 简化：真实工程里一般不“恢复”已删除节点；
    // 要支持恢复，通常在 bind 时插入占位，并在 update 时切换 display/disabled
  }
})
```

面试追问怎么答（结合项目真实实现）：
- 为什么用 comment 替换而不是 `display:none`：避免组件内部仍然渲染/触发事件，且能在 VDOM 层“当作不存在”（`plugins/checkPermission.js:24`）。
- 这种写法的代价：几乎不可逆（update 很难把节点“还原”），所以项目更偏向“权限一旦不满足就永久不可见”的策略。

---

## 2) 手写题：实现 Nuxt middleware 的路由权限守卫

题目：
写一个 `middleware/checkPermission.js`：
- 读取 `store.state.userinfo.roleType`
- 根据 `route.path` 得到 label
- 无权限 `redirect('/')`
- 译员平台 `/translator` 路由不做权限校验

项目例子：
- `middleware/checkPermission.js:4`

答案（手写版）：

```js
export default function ({ store, route, redirect }) {
  const roleType = store.state.userinfo && store.state.userinfo.roleType
  const path = route.path || ''

  if (path.startsWith('/translator')) return

  const label = getLabelByPath(path)
  if (label && !checkPermission(roleType, label)) {
    redirect('/')
  }
}

function getLabelByPath(path) {
  if (path === '/workloadAccount/projectManager') return 'workloadAccount-projectManager'
  return ''
}
```

---

## 3) 手写题：Nuxt 插件注入 `$http`，并在 `asyncData` 使用

题目：
实现一个 Nuxt plugin：`inject('http', http)`，让你能在：
- 组件内用 `this.$http`
- `asyncData` 中用 `app.$http`

项目例子：
- 注入：`plugins/http.js:5`、`plugins/http.js:104`
- 使用：`pages/orderManagement/orderDetail.vue:257`（`app.$http.get(...)`）

答案（手写版骨架）：

```js
// plugins/http.js
export default function ({ $axios }, inject) {
  const http = {
    get(url, params) {
      return $axios.$get(url, { params })
    },
    post(url, data) {
      return $axios.$post(url, data)
    }
  }
  inject('http', http)
}
```

面试追问怎么答：
- 为什么 `asyncData` 里不能 `this.$http`：`asyncData` 执行时组件实例还没创建，只能用上下文参数（你项目里就是 `app.$http`）。

---

## 4) 手写题：让自定义组件支持 `v-model`（value + input）

题目：
写一个 `CustomColumnDropdown`：
- `v-model="selectedColumns"`（Array）
- 组件内部勾选变更时更新父组件，并可选写入 localStorage

项目例子（完整可抄）：
- `components/Table/CustomColumnDropdown.vue:1`
- 使用：`pages/resourceManagement/interpreterAndSuppliers.vue:25`

答案（手写关键点）：

```vue
<template>
  <a-checkbox-group :value="value" @change="onChange" />
</template>

<script>
export default {
  props: { value: { type: Array, required: true } },
  methods: {
    onChange(next) {
      this.$emit('input', next) // v-model 的默认事件
    }
  }
}
</script>
```

追问怎么答：
- Vue2 `v-model` 默认等价于 `:value="x" @input="x = $event"`。
- 你项目中同时 emit 了 `input` 和 `change`，便于父组件按需监听（`components/Table/CustomColumnDropdown.vue:38`）。

---

## 5) 手写题：实现 `update:visible`（.sync / “受控弹窗”）

题目：
写一个 `PdfPreviewModal`：
- `visible` 由父组件控制
- 子组件点击关闭时把 `visible` 改为 false（通过事件通知父组件）

项目例子：
- `components/PdfPreviewModal.vue:125`（`this.$emit('update:visible', false)`）

答案（手写版）：

```js
export default {
  props: { visible: Boolean },
  methods: {
    close() {
      this.$emit('update:visible', false)
    }
  }
}
```

追问怎么答：
- `.sync` 的本质就是监听 `update:xxx` 事件；Vue3 的 `v-model:visible` 是同一思想。

---

## 6) 手写题：scoped slot / `slot-scope`（表格自定义渲染）

题目：
在 Vue2 + Ant Design Vue 的 `a-table` 中：
- columns 配 `scopedSlots: { customRender: 'id' }`
- template 里写 `<span slot="id" slot-scope="text, row">...</span>`
解释 “slot-scope 的 text/row 从哪来”，并写一个最小可运行例子。

项目例子：
- 订单列表：`pages/orderManagement/orderList.vue:319`（table + slot-scope）
- 资源开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:41`

答案（手写思路）：

```vue
<a-table :columns="columns" :data-source="list" rowKey="id">
  <span slot="id" slot-scope="text, row">
    <a @click="go(row)">{{ row.id }}</a>
  </span>
</a-table>

<script>
export default {
  data() {
    return {
      columns: [{ dataIndex: 'id', key: 'id', scopedSlots: { customRender: 'id' } }],
      list: [{ id: 1 }]
    }
  }
}
</script>
```

追问怎么答：
- `slot-scope` 的参数来自组件内部 `scopedSlots` 调用时传出的 slotProps（这里 Ant Table 会传 `text`/`record(row)` 等）。
- Vue2 写法是 `slot-scope`，Vue2.6+ 也可以用 `v-slot`（你项目里也有 `v-slot` 用法：`components/OrderDetail/Cards/CustomerSettlementCard.vue:10`）。

---

## 7) 手写题：`<client-only>` 解决 SSR 下的 “window is not defined”

题目：
一个组件依赖浏览器 API / 第三方库只能在客户端运行（例如 pdf.js / vue-pdf-embed），你在 Nuxt2 里怎么写？

项目例子：
- `components/PdfPreviewModal.vue:28`（`<client-only>` 包住 `vue-pdf-embed`）

答案：

```vue
<client-only>
  <third-party-only-client />
</client-only>
```

追问怎么答：
- 只在客户端加载的库，最好也用动态 import（你项目里：`components/PdfPreviewModal.vue:53`）。

---

## 8) 手写题：watch + nextTick（等 props 更新后再触发逻辑）

题目：
写一个 watcher：当弹窗 `visible` 变为 true 时，如果 `pdfUrl` 已有值，等 DOM/props 更新后再加载 PDF。

项目例子：
- `components/PdfPreviewModal.vue:88`

答案（手写版）：

```js
watch: {
  visible(val) {
    if (!val) return
    this.$nextTick(() => {
      if (this.pdfUrl) this.loadPdf()
    })
  }
}
```

追问怎么答：
- 为什么要 nextTick：避免“先打开弹窗再 set pdfUrl”导致 watcher 读取到旧值/DOM 未就绪（项目里对 visible 和 pdfUrl 都加了 watcher）。

---

## 9) 手写题：computed 依赖 store（角色差异化渲染）

题目：
写一个 computed：根据 `this.$store.state.userinfo.roleType` 判断是否是销售角色，销售不展示某些卡片。

项目例子：
- `pages/orderManagement/orderDetail.vue:212`

答案：

```js
computed: {
  isSalesRole() {
    return this.$store.state.userinfo.roleType === 50
  }
}
```

追问怎么答：
- computed 会缓存：依赖不变不重新计算；适合“由 state 派生的展示开关”。

---

## 10) 手写题：ref 调子组件方法（imperative API）

题目：
父组件在某些时机需要强制子组件切换模式（view/edit），你如何在 Vue2 写？

项目例子：
- 父组件调用：`pages/orderManagement/orderDetail.vue:375`（`this.$refs.customerInfoCard.setMode('edit')`）
- 子组件暴露方法：`components/OrderDetail/Cards/CustomerInfoCard.vue:613`

答案（手写版）：

```js
// Parent
mounted() {
  this.$refs.child && this.$refs.child.setMode('edit')
}

// Child
methods: {
  setMode(mode) { this.mode = mode }
}
```

追问怎么答（工程取舍）：
- ref 是“命令式”通信，适合“需要直接控制 UI 状态”的场景（比如进入页面直接打开编辑态）。
- 但更推荐优先用 props 驱动（`mode` 下放给子组件），ref 作为补充（你项目里两种都有：订单详情的卡片和资源详情的卡片化体系）。

---

## 11) 手写题：父子通信（子组件发事件，父组件统一处理）

题目：
写一个筛选组件 `ResourceFilter`：
- 子组件内部点击“搜索”触发 `this.$emit('search', params)`
- 父组件监听 `@search="handleSearchFromFilter"`

项目例子：
- 父组件监听：`pages/resourceManagement/interpreterAndSuppliers.vue:5`

答案（手写版）：

```vue
<!-- Parent -->
<ResourceFilter @search="onSearch" />

<!-- Child -->
<script>
export default {
  methods: {
    submit() {
      this.$emit('search', { keyword: this.keyword })
    }
  }
}
</script>
```

