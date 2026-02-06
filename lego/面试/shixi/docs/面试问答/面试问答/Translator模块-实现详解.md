# Translator 模块（译员平台）实现详解（big-customer，面向面试）

> 目标：按“模块边界/路由结构/登录态与权限差异/页面数据流/组件复用”的角度，总结 `pages/translator/*` 这一整套译员平台，并配对应代码摘录（含文件:行号）。

## 1. 一句话概括（面试开场）

项目在同一套 Nuxt SSR 里做了一个独立的 `/translator` 子站：它有自己的 `layouts/translator.vue` 头部导航和登录态展示；SSR 首屏通过 `nuxtServerInit` 根据访问路径走“译员平台专用用户校验接口”；核心页面（我的简历）复用“资源详情页”的卡片组件与逻辑模块（`utils/resource/*`），并通过 `resourceStatus` 控制合同等菜单可见性（`layouts/translator.vue:78`、`utils/resource/useTranslatorBasicInfo.js:109`）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- 路由页面：
  - 我的简历：`pages/translator/index.vue:228`
  - 我的订单：`pages/translator/orders.vue:107`
  - 我的薪资：`pages/translator/salary.vue:53`
  - 我的合同：`pages/translator/contract.vue:199`
  - 简历/合同 PDF 预览：`pages/translator/resumePreview.vue:63`
- Layout（译员平台外壳 + 登录/权限挡板 + 顶部导航）：`layouts/translator.vue:1`
- SSR 登录态初始化（translator 分支逻辑）：`store/index.js:14`
- 全局权限 middleware 对 translator 的特殊处理：`middleware/checkPermission.js:9`
- 译员平台 API 路径枚举：`config/path.js:103`
- 译员“基础信息”模块（决定 resourceId/resourceStatus）：`utils/resource/useTranslatorBasicInfo.js:45`
- HTTP 封装（未登录错误码对 translator 的特判）：`plugins/http.js:34`

## 3. 模块边界：为什么 translator 不走“大客户权限体系”

来源：`middleware/checkPermission.js:4`

```js
// 译员平台页面不做权限检查，不跳转到大客户系统
if (path.startsWith('/translator')) {
  return
}
```

面试讲法：

- 同项目双子站：`/translator` 属于译员自助平台，权限/菜单由“译员资源状态 + 是否开通权限”决定；
- 大客户系统的 `roleType + permission label`（`v-checkPermission`）体系在这里不适用，所以 middleware 直接放行。

## 4. 登录态与“开通权限”挡板（Layout 层）

### A) Layout 负责三态渲染：未登录 / 已登录但未开通 / 已开通

来源：`layouts/translator.vue:30`

```vue
<a-layout-content class="content">
  <!-- 未登录：显示空白 -->
  <template v-if="!isLoggedIn"></template>

  <!-- 已登录但无权限 -->
  <template v-else-if="!isValid">
    <div class="no-permission">...</div>
  </template>

  <!-- 已登录且有权限 -->
  <template v-else>
    <nuxt />
  </template>
</a-layout-content>
```

### B) 顶部导航按 `resourceStatus` 过滤（合同需要达到某个状态）

来源：`layouts/translator.vue:75`

```js
allNavItems: [
  { label: '我的简历', path: '/translator', minStatus: null },
  { label: '我的合同', path: '/translator/contract', minStatus: 80 },
  { label: '我的订单', path: '/translator/orders', minStatus: null },
  { label: '我的薪资', path: '/translator/salary', minStatus: null },
],

navItems() {
  return this.allNavItems.filter(item => {
    if (item.minStatus === null) return true
    return this.resourceStatus !== null && this.resourceStatus >= item.minStatus
  })
}
```

面试讲法：

- `resourceStatus` 来自后端“译员资源基本信息”接口（见 `utils/resource/useTranslatorBasicInfo.js:109`），属于业务状态机；
- 前端用它做“菜单入口 gating”，比纯前端 roleType 更贴近译员业务流程（比如签约完成后才出现合同页）。

### C) 退出登录：清 Vuex + 清持久化 Cookie + 打 logged_out 标记避免自动登录

来源：`layouts/translator.vue:152`

```js
handleLogout() {
  this.$store.commit('SET_AUTH_USER', false)
  this.$store.commit('userinfo/UPDATE_USERINFO', { isValid: false, resourceStatus: null, resourceId: null })
  Cookies.remove('vuexnuxt')
  Cookies.set('logged_out', '1', { expires: 1 })
  if (this.$route.path !== '/translator') this.$router.push('/translator')
}
```

面试讲法：

- `logged_out=1` 是“主动退出”的客户端标记，SSR 初始化时会优先识别它（见下一节），防止刷新页面又被服务端判定为已登录。

## 5. SSR 初始化（nuxtServerInit）：按路径选择不同的“用户校验接口”

来源：`store/index.js:14`

```js
const cookieStr = req && req.headers && req.headers.cookie || ''
const requestUrl = req && req.url || ''
const isTranslatorPage = requestUrl.startsWith('/translator')

if (isTranslatorPage && cookieStr.includes('logged_out=1')) {
  store.commit('SET_AUTH_USER', false)
  return
}

if (isTranslatorPage) {
  const validUserRes = await app.$http.get(path.isValidUser)
  if (validUserRes.errorCode === 200 && validUserRes.data) {
    const { valid, role, username } = validUserRes.data
    store.commit('userinfo/UPDATE_USERINFO', { userName: username, roleName: role, isValid: valid })
    store.commit('SET_AUTH_USER', true)
  } else {
    store.commit('SET_AUTH_USER', false)
  }
}
```

面试讲法：

- 同构 SSR 最大坑是“首屏必须知道用户是谁”，这里通过 `nuxtServerInit` 做首屏登录态判定；
- translator 使用 `isValidUser` 返回 `{ valid, role, username }`，并用 `isValid` 驱动 layout 的“未开通提示”。

## 6. 我的简历（/translator）：卡片组件复用 + 逻辑模块组合（核心亮点）

### A) 页面由多个卡片组成，复用 ResourceDetail 的 Cards

来源：`pages/translator/index.vue:176`

```js
import BasicInfoCard from '~/components/ResourceDetail/Cards/BasicInfoCard.vue'
import OrderTimeCard from '~/components/ResourceDetail/Cards/OrderTimeCard.vue'
import DomainToolCard from '~/components/ResourceDetail/Cards/DomainToolCard.vue'
import LanguageLevelCard from '~/components/ResourceDetail/Cards/LanguageLevelCard.vue'
import ServicePriceCard from '~/components/ResourceDetail/Cards/ServicePriceCard.vue'
import ResumeCard from '~/components/ResourceDetail/Cards/ResumeCard.vue'
```

### B) 页面数据/方法不是“堆在一个组件里”，而是用 `utils/resource` 的模块化工厂组合

来源：`pages/translator/index.vue:188`

```js
import {
  createTranslatorBasicInfoData,
  createTranslatorBasicInfoMethods,
  createOrderTimeData,
  createOrderTimeMethods,
  // ... DomainTool/LanguageLevel/ServicePrice/Resume/OperationRecord
} from '~/utils/resource'
```

初始化（created）时把每个模块的 methods 绑定到页面实例：

来源：`pages/translator/index.vue:364`

```js
this.basicInfoMethods = createTranslatorBasicInfoMethods(this, {
  onSaveSuccess: () => this.updateProgress(),
  onLoadSuccess: () => {
    this.basicInfoLoading = false
    this.loadOtherModulesData()
  }
})

this.basicInfoMethods.loadBasicInfo()
```

加载其它卡片数据：先拿到 `resourceId`，再并行加载各模块：

来源：`pages/translator/index.vue:452`

```js
loadOtherModulesData() {
  if (!this.resourceId) return
  const orderTimePromise = this.orderTimeMethods.loadOrderTimeInfo().finally(() => { this.orderTimeLoading = false })
  const domainToolPromise = this.domainToolMethods.loadDomainToolInfo().finally(() => { this.domainToolLoading = false })
  // ... languageLevel/servicePrice/resume/operationRecord
  Promise.all([orderTimePromise, domainToolPromise /* ... */]).finally(() => this.updateProgress())
}
```

面试讲法：

- 这是“业务卡片化 + 逻辑模块化”的典型：页面负责 orchestrate（编排、loading、进度条、滚动定位），每张卡的 CRUD 由独立模块负责；
- 复用成本低：同一套卡片既能服务大客户资源管理页，也能服务译员自助页（只要替换基础信息 API）。

### C) 译员基础信息模块：用“译员专用 API”获取 resourceId，并写回 store（驱动导航与合同页）

来源：`utils/resource/useTranslatorBasicInfo.js:109`

```js
const res = await context.$http.get(path.translatorGetResourceBase)
if (res.errorCode === 200 && res.data) {
  if (data.id) context.resourceId = data.id
  context.$store.commit('userinfo/UPDATE_USERINFO', {
    resourceStatus: data.status !== undefined ? data.status : null,
    resourceId: data.id || null
  })
}
```

对应接口枚举：

来源：`config/path.js:103`

```js
translatorGetResourceBase: '/sales/user/getResourceBase',
translatorUpdateResourceBase: '/sales/user/updateResourceBase',
```

## 7. 我的薪资（/translator/salary）：列表页 + 跳转联动到订单页

来源：`pages/translator/salary.vue:84`

```js
async fetchSalaryData() {
  const res = await this.$http.get(path.translatorMonthlySalary)
  if (res && res.errorCode === 200 && res.data) {
    this.allData = res.data.map((item, index) => ({
      monthValue: item.month,
      orderCount: item.orderCount || 0,
      totalSalary: Number(item.totalAmount || 0),
      currencyType: item.currencyType
    }))
    this.loadData()
  }
}

viewOrders(record) {
  this.$router.push({ path: '/translator/orders', query: { month: record.monthValue } })
}
```

对应接口：

来源：`config/path.js:189`

```js
translatorMonthlySalary: '/sales/user/monthlySalary',
translatorExportSalary: '/sales/user/exportSalary',
```

## 8. 我的订单（/translator/orders）：筛选 + 并行请求列表/统计 + 汇总展示

来源：`pages/translator/orders.vue:183`

```js
const [listRes, countRes] = await Promise.all([
  this.$http.get(path.searchTranslatorOrderRecords, params),
  this.$http.get(path.countTranslatorOrderRecords, countParams),
])
```

月度筛选的业务规则（上月 16 日到本月 15 日）：

来源：`pages/translator/orders.vue:170`

```js
this.query.startDate = moment(value).subtract(1, 'month').date(16).format('YYYY-MM-DD')
this.query.endDate = moment(value).date(15).format('YYYY-MM-DD')
```

对应接口：

来源：`config/path.js:186`

```js
searchTranslatorOrderRecords: '/sales/user/searchResourceOrderRecords',
countTranslatorOrderRecords: '/sales/user/countResourceOrderRecords',
```

## 9. 我的合同（/translator/contract）：资源状态 + 结算信息 + 合同 PDF 预览/下载

### A) 先刷新资源状态（同步 resourceStatus 到 store）

来源：`pages/translator/contract.vue:308`

```js
const res = await this.$http.get(path.translatorGetResourceBase)
this.$store.commit('userinfo/UPDATE_USERINFO', {
  resourceStatus: res.data.status !== undefined ? res.data.status : null,
  resourceId: res.data.id || null
})
```

### B) 加载合同结算信息并拼出下载/预览 URL（带 cookie 下载）

来源：`pages/translator/contract.vue:333`

```js
const [contractRes, baseRes] = await Promise.all([
  this.$http.get(path.getResourceContractByResourceId, { resourceId: this.resourceId }),
  this.$http.get(path.translatorGetResourceBase)
])

this.pdfPreviewUrl = `${path.baseURL}${path.translatorDownloadFile}?keyName=${this.sealedContractFile}&fileName=${encodeURIComponent(this.sealedContractFileName)}`
```

下载使用 `fetch(..., { credentials: 'include' })`：

来源：`pages/translator/contract.vue:406`

```js
fetch(url, { credentials: 'include' })
  .then(response => response.blob())
  .then(blob => { /* 创建 a 标签下载 */ })
```

## 10. PDF 预览页（/translator/resumePreview）：client-only 渲染 + blobUrl + 自适应缩放

来源：`pages/translator/resumePreview.vue:61`

```js
const VuePdfEmbed = () => import('vue-pdf-embed/dist/vue2-pdf-embed')
```

拉取 PDF 用 `fetch` 并带 cookie：

来源：`pages/translator/resumePreview.vue:167`

```js
const resp = await fetch(url, { credentials: 'include' })
const raw = await resp.blob()
const pdfBlob = raw.type && raw.type.includes('pdf') ? raw : new Blob([raw], { type: 'application/pdf' })
this.blobUrl = URL.createObjectURL(pdfBlob)
```

缩放自适应容器：

来源：`pages/translator/resumePreview.vue:194`

```js
const page = await this.pdfDoc.getPage(this.currentPage || 1)
const viewport = page.getViewport({ scale: 1 })
const fitScale = Math.min(availW / viewport.width, availH / viewport.height) * 0.95
this.scale = parseFloat(Math.max(0.1, fitScale).toFixed(3))
```

面试讲法：

- PDF 预览属于强 client 能力（canvas/web worker），所以用 `client-only` + 动态 import；
- 同时为了避免跨域/鉴权问题，先 fetch 成 blob，再用 `ObjectURL` 作为 viewer source。

## 11. 面试题库（Q&A 速记）

### Q1：为什么 translator 要单独一个 layout？

为了把“顶栏导航 + 登录/开通挡板 + 主题样式”封装成模块外壳，业务页面只关注自己的内容（`layouts/translator.vue:30`）。

### Q2：SSR 下 translator 如何判断“是否登录/是否开通”？

`nuxtServerInit` 通过 `req.url` 判断是否 `/translator`，然后调用 `isValidUser`，写入 `authUser + userinfo.isValid`（`store/index.js:24`、`store/index.js:31`）。

### Q3：为什么简历页能做成“多卡片 + 逻辑模块组合”？

卡片 UI 放在 `components/ResourceDetail/Cards/*`，CRUD 逻辑拆在 `utils/resource/*` 的 `createXxxData/createXxxMethods`，页面只负责 orchestrate（`pages/translator/index.vue:188`、`pages/translator/index.vue:364`）。

### Q4：resourceStatus 在 translator 里有什么用？

它是译员业务流程状态机的一个缩影：决定合同菜单是否出现、合同页是否可用等（`utils/resource/useTranslatorBasicInfo.js:118`、`layouts/translator.vue:118`）。

## 12. 坑点与改进建议（面试加分项）

1) `middleware/checkPermission.js` 放行 translator 后，页面级权限完全依赖后端与 layout 挡板；如果希望更强一致性，可考虑为 translator 单独的 middleware（只做登录/开通检查）。  
2) 合同下载/简历预览用 `fetch + credentials` 与 `$http` 并存，工程上可以抽一个“文件下载/预览”工具函数统一处理（`pages/translator/contract.vue:406`、`pages/translator/resumePreview.vue:167`）。  
3) translator 简历页非常大，建议继续保持“逻辑模块化”，避免页面组件继续膨胀（已经在做了，`pages/translator/index.vue:188`）。  

