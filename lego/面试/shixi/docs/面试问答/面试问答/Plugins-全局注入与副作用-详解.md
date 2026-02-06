# Plugins：全局注入与副作用详解（big-customer，面向面试）

> 目标：把本项目 Nuxt2 `plugins/` 的“全局注入（inject）+ 全局副作用（Vue.use / Vue.prototype / 指令 / store 持久化）”讲清楚，并配关键代码摘录与踩坑点。

## 1. 一句话概括（面试开场）

本项目的插件分两类：

1) **全局能力注入**：通过 Nuxt plugin 的 `inject` 把通用能力挂到 `context/app` 与 Vue 实例（例如 `$http/$validateForm`），让页面/组件统一调用（`plugins/http.js:5`、`plugins/validateForm.js:1`）。  
2) **全局副作用**：UI 框架组件全局注册、Vue 原型挂载弹窗/消息、Vuex 持久化写 cookie、权限指令直接改 DOM（`plugins/antd-ui.js:1`、`plugins/persistedstate.js:1`、`plugins/checkPermission.js:1`）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- 插件注册入口：`nuxt.config.js:64`
- UI 框架注册（全局组件 + prototype）：`plugins/antd-ui.js:1`、`plugins/element-ui.js:1`
- HTTP 注入（项目主用）：`plugins/http.js:1`
- 表单校验注入（Element Form）：`plugins/validateForm.js:1`
- Vuex 持久化（cookie，SSR/CSR 兼容）：`plugins/persistedstate.js:1`
- 权限指令（UI 级授权）：`plugins/checkPermission.js:1`
- 另一套 HTTP 注入（历史/局部页使用）：`plugins/axios.js:1`

## 3. Nuxt2 插件机制：这项目里怎么用

### 3.1 插件在 `nuxt.config.js` 的加载顺序很关键

来源：`nuxt.config.js:64`

- UI 插件（Element/AntD）先加载：确保页面渲染时组件已注册。
- `$http` 在 SSR 也必须可用：`store/index.js` 的 `nuxtServerInit` 里会用 `app.$http` 拉用户信息（`store/index.js:14`）。
- **只在 client 执行**的插件要用 `mode: 'client'`：例如权限指令需要 `document`，不能 SSR 跑（`plugins/checkPermission.js:1`）。

### 3.2 一个“真实踩坑”：plugins 配置里重复 key 会导致插件被覆盖

当前 `nuxt.config.js` 的 `plugins` 数组里有一段对象字面量同时写了两次 `src`，后面的会覆盖前面的，所以实际上只会加载 `checkPermission`，`errorCodeHandler` 不会生效：

- `nuxt.config.js:76`

面试讲法（加分点）：

“Nuxt 的 plugins 配置是普通 JS 对象，重复 key 最后一个生效；如果发现某个 `$xxx` 注入不存在，先检查是否被配置覆盖。”

建议写法（示意）：

```js
plugins: [
  { src: '@/plugins/errorCodeHandler', mode: 'client' },
  { src: '@/plugins/checkPermission', mode: 'client' }
]
```

## 4. UI 框架插件：全局注册 + 全局原型方法

### 4.1 Ant Design Vue：按需注册 + `Vue.prototype` 挂载

来源：`plugins/antd-ui.js:1`

```js
import Vue from 'vue'
import { Button, Form, Modal, message } from 'ant-design-vue'

Vue.use(Button)
Vue.use(Form)
Vue.use(Modal)

Vue.prototype.$message = message
Vue.prototype.$confirm = Modal.confirm
Vue.prototype.$info = Modal.info
```

面试讲法：

- 好处：组件里可以直接 `this.$message.success(...)`，避免每个组件重复 import。
- 风险：全局原型是“隐式依赖”，需要在文档里说清楚来源；另外也要避免在 SSR 环境调用依赖 DOM 的 API。

### 4.2 Element UI：按需注册 + 全局语言包

来源：`plugins/element-ui.js:1`

```js
import ElementLocale from 'element-ui/lib/locale'
import locale from 'element-ui/lib/locale/lang/zh-CN'

ElementLocale.use(locale)
Vue.use(Form)
Vue.use(Table)
```

面试讲法：

“项目同时用 AntD + Element，是历史包袱型项目的典型场景。为了避免 bundle 过大，我们配合 `nuxt.config.js` 的 babel 插件做按需引入。”

## 5. `$http` 注入：SSR/CSR 同构的接口层

来源：`plugins/http.js:1`

### 5.1 注入形态：`inject('http', http)` -> `this.$http` / `app.$http`

```js
export default function ({ $axios }, inject) {
  const instance = $axios.create({ withCredentials: true, timeout: 30000 })
  const http = {
    get: (url, params) => instance({ method: 'get', url, params }),
    post: (url, data, type) => { /* query/json/formData */ }
  }
  inject('http', http)
}
```

### 5.2 副作用：响应拦截里会联动 Vuex 登录态并跳转

来源：`plugins/http.js:28`

- 后端返回 `errorCode === 1003`：`store.commit('SET_AUTH_USER', false)`，并在非译员平台路由跳登录页。

面试讲法：

“我们把‘协议层错误码’在 HTTP 层统一收敛，这样页面逻辑更纯粹；同时 Vuex 的 `authUser` 作为全局登录态来源，能驱动布局/权限逻辑。”

## 6. `$validateForm` 注入：统一 Element Form 校验

来源：`plugins/validateForm.js:1`

```js
export default function ({ app }, inject) {
  const validateForm = (formName, vm) => {
    return new Promise(resolve => {
      vm.$refs[formName].validate(valid => resolve(valid))
    })
  }
  inject('validateForm', validateForm)
}
```

使用示例（页面里大量使用）：

- `pages/index.vue:965`

面试讲法：

- 好处：把 Element 的 `this.$refs.form.validate` 统一成 promise，用起来更一致。
- 风险：这是强约定：必须确保 `ref` 存在且是 Element Form；否则会报错。严格场景建议先做空值保护或在组件内封装而不是全局注入。

## 7. Vuex 持久化：`vuex-persistedstate` 写 cookie（同构）

来源：`plugins/persistedstate.js:1`

关键点：

- key：`vuexnuxt`
- CSR：用 `js-cookie` 读写
- SSR：用 `cookie.parse(req.headers.cookie)` 读，用 `app.$cookies` 写（依赖 `cookie-universal-nuxt`）

面试讲法：

“cookie 持久化能让 SSR/CSR 都拿到同一份状态（比如布局折叠、登录态）。同时要注意不要把敏感信息放进 cookie；需要时用白名单 `paths` 控制持久化范围。”

## 8. 权限指令：`v-checkPermission` 的 DOM 副作用

来源：`plugins/checkPermission.js:1`

实现特征：

- 指令直接把不允许的元素替换成注释节点（相当于从 DOM 移除），从而做到 UI 级授权。
- 权限判断依赖 `permissionTable[label]` 与当前 `roleType`。

面试讲法：

“这是前端做‘按钮级权限’的典型实现：好处是接入成本低，模板里一行就能控制显示；代价是副作用很强（会改 vnode/DOM），更适合‘纯展示权限’，不适合‘仅禁用点击’这类交互权限。”

## 9. 另一个注入：`$api`（历史/并存实现）

来源：`plugins/axios.js:1`、示例页：`pages/resourceManagement/interpreter.vue:33`

项目里存在另一套注入 `$api`（axios instance），但它当前没有被 `nuxt.config.js` 的 plugins 列表加载，属于“历史并存/未启用”的实现。面试时可以说明：

- 主链路用 `$http`（封装了 `query/json/formData` + 1003 处理 + SSR cookie 透传）。
- `$api` 更接近“直接 axios instance”，适合简单页面，但需要保证被正确注册。


---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「Nuxt 工程架构与运行时治理」这部分，我主导完成了：方案拆解、风险评估、核心代码落地、联调上线与复盘沉淀。主导范围覆盖：插件注入、构建配置、运行入口与配置管理。

### 量化结果（请按真实数据替换）

- 关键指标：构建时长、首屏体积、发布成功率 从 X 优化到 Y。
- 交付效率：同类需求交付周期从 X 天 缩短到 Y 天。
- 稳定性：相关线上问题从 X 个/迭代下降到 Y 个/迭代。
- 可维护性：重复逻辑与临时补丁占比下降 X%。

### 故障复盘卡片（与本文主题相关）

1) 现象：插件或构建配置变更引发回归。  
- 影响：核心流程可用性或数据一致性受影响。  
- 定位：通过日志、埋点、接口返回与代码链路回溯定位到根因。  
- 止血：快速回滚/降级并加兜底判断。  
- 长期修复：补充边界校验、自动化测试与发布前检查项。

2) 现象：改造后出现跨模块联动异常。  
- 影响：上下游模块结果不一致。  
- 定位：接口契约、状态同步或配置项存在偏差。  
- 止血：统一契约并临时加兼容转换。  
- 长期修复：把契约收敛为单一来源并补文档与门禁。

3) 现象：高峰期下性能或失败率波动。  
- 影响：用户体验下降，工单增加。  
- 定位：识别瓶颈点（请求并发、渲染、缓存或鉴权链路）。  
- 止血：限流/重试/懒加载或拆分重任务。  
- 长期修复：建立持续监控与阈值告警，按周复盘。

### 分时长回答（背诵版）

- 30 秒：
  这部分是我主导落地的，核心目标是把「Nuxt 工程架构与运行时治理」做到稳定、可扩展、可复用，重点解决一致性和线上可维护性。

- 90 秒：
  我按“问题-方案-结果”推进：先定义边界与关键风险，再做结构化改造和统一约定，最后用测试、监控和流程门禁固化成果，确保同类问题不反复出现。

- 3 分钟：
  按“背景、挑战、方案、落地、结果、复盘”展开：
  1) 业务背景与约束。  
  2) 当前痛点与失败案例。  
  3) 方案选择与取舍依据。  
  4) 实施路径与跨团队配合。  
  5) 指标结果与后续优化计划。
