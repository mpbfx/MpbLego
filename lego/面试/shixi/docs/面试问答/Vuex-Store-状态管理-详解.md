# Vuex Store 状态管理详解（big-customer，面向面试）

> 目标：把本项目里 Vuex（Nuxt2 store）是如何承载“登录态 / 用户信息 / 权限与 UI 状态 / 持久化”的实现讲清楚，并能指到关键代码（`file:line`）。

## 1. 一句话概括（面试开场）

这个项目把 Vuex 当成“SSR 首屏同步 + 全局状态单一来源”：

- **登录态**：根 store 的 `authUser` 代表“是否已登录/可访问”，在 `nuxtServerInit` 阶段初始化，接口返回 `errorCode === 1003` 时也会被动置为 `false`（`store/index.js:14`、`plugins/http.js:28`）。
- **用户信息/权限**：`store/userinfo.js` 维护 `roleType/isValid/resourceStatus` 等关键字段，配合 `v-checkPermission` 与页面级 middleware 做鉴权（`store/userinfo.js:1`、`plugins/checkPermission.js:1`、`middleware/checkPermission.js:1`）。
- **可持久化 UI 状态**：例如侧边栏折叠 `layoutCollapsed` 走 `store/userinterface.js`，并通过 `vuex-persistedstate` 写到 cookie，刷新后可恢复（`store/userinterface.js:1`、`plugins/persistedstate.js:6`）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- Root store + SSR 初始化：`store/index.js:1`
- 用户信息模块：`store/userinfo.js:1`
- UI 状态模块（侧边栏折叠）：`store/userinterface.js:1`、`layouts/default.vue:49`
- 汇率缓存：`store/currency.js:1`
- Vuex 持久化（cookie）：`plugins/persistedstate.js:1`、`nuxt.config.js:71`
- HTTP 拦截联动登录态：`plugins/http.js:28`
- 译员平台登出与“退出标记”：`layouts/translator.vue:154`、`store/index.js:27`

## 3. Store 结构：本项目具体有哪些 state/module

### 3.1 Root state：`authUser`

来源：`store/index.js:1`

```js
export const state = () => ({
  authUser: null
})

export const mutations = {
  SET_AUTH_USER(state, user) {
    state.authUser = user
  },
}
```

面试讲法：

- `authUser` 不是 JWT token，而是“是否通过认证/可渲染业务页”的布尔标志（`true/false/null` 三态）。
- `null` 通常表示“尚未初始化完成”（首屏 SSR 之前或极端异常），项目里最终会被设置为 `true/false`。

### 3.2 模块：`userinfo`

来源：`store/userinfo.js:1`

```js
export const state = () => ({
  userName: '',
  roleName: '',
  roleType: '',
  isValid: false,
  resourceStatus: null,
  resourceId: null,
})

export const mutations = {
  UPDATE_USERINFO(state, data) {
    if (!data) return
    if (data.roleType !== undefined) state.roleType = data.roleType
    if (data.isValid !== undefined) state.isValid = data.isValid
    if (data.resourceStatus !== undefined) state.resourceStatus = data.resourceStatus
    // ...
  }
}
```

面试讲法：

- 这个模块是“权限/业务入口”的数据来源：大量页面/按钮显示逻辑依赖 `roleType`（例如 `pages/orderManagement/orderDetail.vue:223`、`pages/resourceManagement/resourceReport.vue:633`）。
- `UPDATE_USERINFO` 采用“部分更新”，便于在 SSR 初始化、登录校验、登出清空等多个入口复用同一个 mutation。

### 3.3 模块：`userinterface`（UI 状态）

来源：`store/userinterface.js:1`、`layouts/default.vue:49`

```js
// store/userinterface.js
export const state = () => ({
  layoutCollapsed: true,
})

export const mutations = {
  UPDATE_LAYOUT(state, { layoutCollapsed }) {
    state.layoutCollapsed = layoutCollapsed
  }
}
```

```js
// layouts/default.vue
computed: {
  collapsed: {
    get() { return this.$store.state.userinterface.layoutCollapsed },
    set(val) { this.$store.commit('userinterface/UPDATE_LAYOUT', { layoutCollapsed: val }) }
  }
}
```

面试讲法：

- 把“布局折叠”放 Vuex 而不是组件 local state，是为了支持“跨页面保持一致”以及配合持久化恢复。

## 4. SSR 初始化：`nuxtServerInit` 为什么要做、怎么做

来源：`store/index.js:14`

### 4.1 两套入口：大客户系统 vs 译员平台

```js
const requestUrl = req && req.url || ''
const isTranslatorPage = requestUrl.startsWith('/translator')

if (isTranslatorPage) {
  const validUserRes = await app.$http.get(path.isValidUser)
  // commit userinfo + SET_AUTH_USER(true/false)
} else {
  const userinfoRes = await app.$http.get(path.getUserInfo)
  // commit userinfo + SET_AUTH_USER(true/false)
}
```

面试讲法：

- `nuxtServerInit` 在 SSR 首屏执行一次，目的是让首屏渲染时就能拿到 `userinfo/roleType`，避免按钮“闪一下再消失”。
- 项目里有两个“产品入口”：`/translator`（译员平台）与非 `/translator`（大客户系统），所以初始化逻辑分流。

### 4.2 译员平台的“退出标记”兜底

来源：`store/index.js:27`、`layouts/translator.vue:167`

- 退出时设置 `logged_out=1` cookie（防止刷新触发 SSR 又被 `isValidUser` 认定为已登录）。
- SSR 初始化如果发现 `logged_out=1`，直接 `SET_AUTH_USER(false)` 并 return。

### 4.3 超时兜底：避免 SSR 卡死

来源：`store/index.js:15`

项目对初始化请求加了 15s 超时（`Promise.race`），超时或异常统一落到 `SET_AUTH_USER(false)`，保证 SSR 不会无限挂住。

## 5. 持久化：为什么用 cookie 存 Vuex、如何 SSR/CSR 兼容

来源：`plugins/persistedstate.js:6`

```js
createPersistedState({
  key: 'vuexnuxt',
  storage: {
    getItem: key => process.client ? Cookies.getJSON(key) : cookie.parse(req.headers.cookie || '')[key],
    setItem: (key, value) => process.client ? Cookies.set(key, value, { expires: 365 }) : app.$cookies?.set(key, value, { maxAge: 60 * 60 * 24 * 365, path: '/' }),
    removeItem: key => process.client ? Cookies.remove(key) : app.$cookies?.remove(key)
  }
})(store)
```

面试讲法：

- 这是为了“刷新后不丢状态”（比如侧边栏折叠、已登录/用户信息等）。
- SSR 侧不能用 `document.cookie`，所以用 `cookie-universal-nuxt` 的 `app.$cookies` 写 cookie（`nuxt.config.js:92`）。

注意点（可作为加分项）：

- Cookie 里不要存敏感信息（token/密码），项目里主要存的是“登录态布尔 + 用户基本信息 + UI 状态”。
- `vuex-persistedstate` 默认会持久化整个 store；如果后续有敏感字段，建议加 `paths` 白名单。

## 6. 与鉴权/权限的联动：store 是“权限单一来源”

### 6.1 HTTP 返回 1003：被动踢下线

来源：`plugins/http.js:28`

- 当后端返回 `errorCode === 1003`，会 `store.commit('SET_AUTH_USER', false)`，并在非译员平台路由下跳统一登录页。

### 6.2 UI 级权限：`v-checkPermission` 读 `roleType`

使用方式在大量页面/组件里出现（例如 `pages/orderManagement/orderList.vue:56`、`components/Nav/Nav.vue:27`），核心依赖 `store.state.userinfo.roleType`。

### 6.3 路由级权限：middleware 读取 store 并 redirect

来源：`middleware/checkPermission.js:1`

- 页面切换时按 `route.path -> permission label` 判定是否可访问，不可访问就 `redirect('/')`。

## 7. 面试官可能追问的点（标准回答方向）

1) 为什么不把用户信息放 localStorage？
- 因为 SSR 首屏需要在服务端拿到状态来渲染，cookie 更适合做同构；而 localStorage 只有客户端有。

2) 为什么要区分 `orderTimeInfo` 和 `orderTimeInfoEditing` 这种“view/edit 双份数据”？
- 避免编辑态直接污染展示态，支持“取消编辑还原”，并且便于做权限字段禁用（示例可看 `utils/resource/useOrderTime.js:52` 的模式切换逻辑）。

3) 目前 mutation type 形如 `userinfo/UPDATE_USERINFO`，如何保证模块隔离？
- 项目以“模块前缀”方式使用（见 `store/index.js:37`），如果要更显式，建议在模块里补 `export const namespaced = true`，避免团队误解。

