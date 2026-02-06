# JS 手写面试题库-我负责模块（big-customer，面向面试）

> 目标：从你负责模块里“真实写过/踩过坑”的 JS 场景抽题，面试时能现场手写（或口述）并解释取舍。每题都配项目内 `file:line` 例子，方便你举证。

关联入口（我负责模块）：
- 资源开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:1`
- 资源在场列表：`pages/resourceManagement/onSite.vue:1`
- 资源详情页：`pages/resourceManagement/resourceDetail/_id.vue:1`
- 订单管理列表：`pages/orderManagement/orderList.vue:1`
- 订单详情页：`pages/orderManagement/orderDetail.vue:1`
- 译员平台：`pages/translator/index.vue:1`
- PDF 预览弹窗：`components/PdfPreviewModal.vue:1`

---

## 1) 手写题：实现一个 `debounce`（防抖）

题目：
实现一个 `debounce(fn, wait)`，在连续触发时只在停止触发 `wait` ms 后执行一次；并支持在返回函数上挂一个 `cancel()`。

项目例子（用的是 lodash.debounce，但原理一样）：
- 订单详情：`pages/orderManagement/orderDetail.vue:525`
- 基础信息城市搜索：`utils/resource/useBasicInfo.js:356`

答案（手写版，trailing 执行）：

```js
function debounce(fn, wait = 0) {
  let timer = null
  function debounced(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return debounced
}
```

追问怎么答：
- 为什么用防抖：输入联想/搜索接口避免“每次键入都打接口”（`pages/orderManagement/orderDetail.vue:525`）。
- 为什么不用节流：搜索场景更符合“停下来再查”。

---

## 2) 手写题：`Promise.all` vs `Promise.allSettled`，并实现一个 `allSettled`

题目：
解释 `Promise.all` 和 `Promise.allSettled` 的区别，并手写一个 `allSettled(promises)`。

项目例子（首屏并发拉取，允许部分失败不阻塞）：
- 资源详情 asyncData：`pages/resourceManagement/resourceDetail/_id.vue:1654`

答案：

```js
function allSettled(promises) {
  return Promise.all(
    promises.map(p =>
      Promise.resolve(p).then(
        value => ({ status: 'fulfilled', value }),
        reason => ({ status: 'rejected', reason })
      )
    )
  )
}
```

追问怎么答：
- `all`：任何一个 reject 就整体 reject（适合“缺一不可”的数据）。
- `allSettled`：拿到每个结果状态，适合“非关键模块失败也能渲染”（资源详情页就是这种思想）。

---

## 3) 手写题：把 URL query 解析成后端 payload（带日期区间）

题目：
给一个 Nuxt 页面 `asyncData` 的 query，解析出 payload：支持
1) `sellerName` 需要 `decodeURIComponent`
2) `datetime=YYYY-MM` 需要转成当月起止日期（`YYYY-MM-01` ～ `YYYY-MM-lastDay`）
3) `type` 映射为 status 数组并 join 成字符串

项目例子：
- 订单列表 asyncData：`pages/orderManagement/orderList.vue:863`

答案（不依赖 moment 的手写版）：

```js
function getMonthRange(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number)
  const start = `${yyyyMm}-01`
  const lastDay = new Date(y, m, 0).getDate() // m 是 1-12
  const end = `${yyyyMm}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

function parseQueryToPayload(query, typeToStatuses) {
  const payload = { pageIndex: 1, pageSize: 50 }

  if (query.sellerName) {
    payload.sellerName = decodeURIComponent(query.sellerName)
  }

  if (query.datetime) {
    const { start, end } = getMonthRange(query.datetime)
    payload.translateDate1 = start
    payload.translateDate2 = end
  }

  if (query.type) {
    const statuses = typeToStatuses[query.type] || []
    payload.status = statuses.join(',')
  }

  return payload
}
```

追问怎么答：
- 为什么把筛选塞 URL：可复制、可回放、可从报表/外部入口直达（该项目资源列表与订单列表都这么做）。

---

## 4) 手写题：剪贴板复制（优先 clipboard API，降级 execCommand）

题目：
实现 `copyText(text)`：优先用 `navigator.clipboard.writeText`，失败或不支持时用 `textarea + document.execCommand('copy')` 降级。

项目例子：
- 订单列表复制订单名：`pages/orderManagement/orderList.vue:1098`

答案：

```js
async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
```

追问怎么答：
- clipboard API 需要 HTTPS/权限；企业内网/旧浏览器要兼容降级（项目里就做了降级）。

---

## 5) 手写题：带 cookie 的文件下载（fetch blob + a[download]）

题目：
实现 `downloadWithCookie(url, fileName)`：用 `fetch(url, { credentials: 'include' })` 拉 blob，创建 objectURL，触发下载，并做 URL revoke。

项目例子：
- PDF 预览弹窗下载按钮：`components/PdfPreviewModal.vue:146`
- 合同/附件下载同理：`pages/resourceManagement/resourceDetail/_id.vue:3828`、`pages/translator/contract.vue:406`

答案：

```js
async function downloadWithCookie(url, fileName = 'download') {
  const resp = await fetch(url, { credentials: 'include' })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const blob = await resp.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}
```

必会追问：
- 为什么要 `encodeURIComponent(fileName)`：避免中文/空格破坏 query（见 `pages/translator/contract.vue:403`、`pages/resourceManagement/resourceDetail/_id.vue:3802`）。

---

## 6) 手写题：安全读取 localStorage（JSON.parse 兜底）

题目：
实现 `loadJSON(key, defaultValue)`：从 localStorage 读 JSON，解析失败返回默认值。

项目例子：
- 资源开发列表自定义列：`pages/resourceManagement/interpreterAndSuppliers.vue:1096`
- 资源在场列表自定义列：`pages/resourceManagement/onSite.vue:538`

答案：

```js
function loadJSON(key, defaultValue) {
  const raw = localStorage.getItem(key)
  if (!raw) return defaultValue
  try {
    return JSON.parse(raw)
  } catch (e) {
    return defaultValue
  }
}
```

追问怎么答：
- 为什么要 try/catch：历史版本存的结构变化/用户手动改 localStorage 都会导致解析报错。

---

## 7) 手写题：列表“局部更新”而不是全量刷新（按 id 更新）

题目：
给一个订单列表数组 `list`，在接口成功后只更新对应行的几个字段（按 id），并支持批量 id。

项目例子（确认/取消日期后更新当前行或选中行）：
- `pages/orderManagement/orderList.vue:1275`

答案（手写版，返回新数组，强调不可变更新）：

```js
function updateRowsById(list, ids, patch) {
  const set = new Set(Array.isArray(ids) ? ids : [ids])
  return list.map(row => (set.has(row.id) ? { ...row, ...patch } : row))
}
```

追问怎么答（对比项目现状）：
- 项目里为了简单直接，对 `this.orderList` 做了原地赋值（`forEach` 改字段）。
- 如果在 React/严格不可变场景，就要像上面这样返回新数组；Vue2 里两种都能用，但“不可变”更利于测试与回溯。

---

## 8) 手写题：Vue2 数组/对象如何保证响应式更新（`this.$set`）

题目：
Vue2 里修改数组某项的字段，为什么有时视图不更新？怎么写才能保证更新？

项目例子（取消编辑时恢复备份字段，用 `$set` 逐字段回写）：
- `pages/resourceManagement/resourceDetail/_id.vue:4182`

答案要点：
- Vue2 对新增属性/数组索引赋值存在响应式限制；推荐用 `this.$set(target, key, value)`。

手写示例：

```js
// 对象新增字段
this.$set(this.form, 'newField', 123)

// 数组某项替换
this.$set(this.list, index, { ...this.list[index], name: 'x' })

// 数组某项的某个字段（已有字段一般可直接赋值；不确定时用 $set）
this.$set(this.list[index], 'name', 'x')
```

---

## 9) 手写题：深拷贝（编辑态备份）与它的坑

题目：
实现一个简单 `deepClone`（不考虑循环引用），并解释为什么项目里有时会用 `JSON.parse(JSON.stringify(x))`。

项目例子（编辑评价记录时备份，取消可恢复）：
- `pages/resourceManagement/resourceDetail/_id.vue:4142`

答案（手写递归版）：

```js
function deepClone(x) {
  if (x === null || typeof x !== 'object') return x
  if (Array.isArray(x)) return x.map(deepClone)
  const out = {}
  Object.keys(x).forEach(k => { out[k] = deepClone(x[k]) })
  return out
}
```

追问怎么答：
- JSON 方案的限制：会丢 `Date/Map/Set/undefined/function`，也处理不了循环引用。
- 现代方案：`structuredClone`（但旧环境需 polyfill/谨慎引入）。

---

## 10) 手写题：用 reduce 选取/抽取一组字段（“快照”对比）

题目：
给定 keys 数组，从对象里抽取这些字段形成一个新对象（缺失给空字符串），用于 prev/next 对比。

项目例子（订单详情：抽取结算日期字段，做“先取消后确认”的链路）：
- `pages/orderManagement/orderDetail.vue:388`

答案：

```js
function pickByKeys(obj, keys) {
  return keys.reduce((acc, k) => {
    acc[k] = obj && obj[k] ? obj[k] : ''
    return acc
  }, {})
}
```

---

## 11) 手写题：实现“先回滚后推进”的有序异步链路

题目：
有四个结算节点（交付/提单/确认/回款），当用户一次保存提交了新日期集合 `next`，你需要：
1) 对比 `prev`，先按 **回款→确认→提单→交付** 的顺序取消
2) 再按 **交付→提单→确认→回款** 的顺序确认
任何一步失败都要停止并报错。

项目例子：
- `pages/orderManagement/orderDetail.vue:422`

答案（手写版）：

```js
async function runSettlementFlow({ prev, next, keys, cancel, confirm }) {
  // 先取消：reverse 顺序
  for (const k of [...keys].reverse()) {
    if (prev[k] && next[k] !== prev[k]) {
      const ok = await cancel(k)
      if (!ok) return false
    }
  }
  // 再确认：正向顺序
  for (const k of keys) {
    if (next[k] && next[k] !== prev[k]) {
      const ok = await confirm(k, next[k])
      if (!ok) return false
    }
  }
  return true
}
```

追问怎么答：
- 为什么要“两段式”：结算节点是有序状态机，回滚必须从末端开始，推进必须从起点开始，避免非法状态。

---

## 12) 手写题：去重 + 衍生数据（Set / map / filter）

题目：
给一个价格数组 `servicePrices`，生成“去重后的 domain 列表”，并过滤掉空值。

项目例子：
- 译员平台 computed：`pages/translator/index.vue:353`

答案：

```js
function uniqueDomains(servicePrices) {
  return [...new Set(servicePrices.map(p => p.domain))].filter(Boolean)
}
```

---

## 13) 手写题：IntersectionObserver 做“滚动高亮”（核心思路）

题目：
实现一个“滚动时自动高亮当前 section”的算法，要求：
- 点击目录跳转时暂时禁用自动高亮
- 数据加载期间禁用
- 快速滚动时做 100ms 防抖

项目例子（译员平台）：
- `pages/translator/index.vue:518`

答案（口述/伪码也可，面试重点在思路）：

```js
function createSectionObserver({ getSections, onActiveChange, canAutoUpdate }) {
  let timer = null
  const io = new IntersectionObserver(() => {
    if (!canAutoUpdate()) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      const sections = getSections()
      // 计算每个 section 的可见高度/距顶部距离，选 score 最大者
      let best = sections[0]?.key
      let bestScore = -1
      sections.forEach(s => {
        const rect = s.el.getBoundingClientRect()
        const visible = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top))
        const nearTop = rect.top >= 0 && rect.top <= 150
        const score = nearTop ? 10000 - Math.abs(rect.top - 100) : visible
        if (score > bestScore) { bestScore = score; best = s.key }
      })
      onActiveChange(best)
    }, 100)
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] })
  return io
}
```

追问怎么答：
- 为什么不用 scroll：scroll 触发频繁，主线程压力大；IntersectionObserver 更省（项目里明确写了这个取舍）。

---

## 14) 手写题：格式化当天日期 `YYYY/MM/DD`

题目：
手写一个函数返回当天字符串 `YYYY/MM/DD`（补零）。

项目例子：
- 新增评价记录默认日期：`pages/resourceManagement/resourceDetail/_id.vue:4123`

答案：

```js
function formatToday() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}`
}
```

---

## 15) 手写题：从 URL 生成“可下载链接”（文件名需要 encode）

题目：
给定 `baseURL`、接口路径、`keyName`、`fileName`，拼一个可下载 URL（把 fileName encode）。

项目例子：
- 合同下载 URL：`pages/resourceManagement/resourceDetail/_id.vue:3802`
- 译员合同下载 URL：`pages/translator/contract.vue:393`

答案：

```js
function buildDownloadUrl(baseURL, apiPath, keyName, fileName) {
  const encoded = encodeURIComponent(fileName || '')
  return `${baseURL}${apiPath}?keyName=${keyName}&fileName=${encoded}`
}
```

