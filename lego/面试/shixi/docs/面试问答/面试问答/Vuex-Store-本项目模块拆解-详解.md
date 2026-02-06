# Vuex Store：本项目模块拆解详解（big-customer，面向面试）

> 目标：在已有“Vuex 状态管理总览”之外，进一步把本项目的每个 store 模块（auth/userinfo/userinterface/currency/message）职责、初始化时机、以及与 layout/middleware/plugin 的联动关系讲清楚，并能指到关键代码（`file:line`）。

## 1. 一句话概括（面试开场）

本项目的 Vuex 不是“随便放点状态”，而是围绕两件事组织：

1) **同构登录态（SSR 首屏就要有结论）**：用 `store/index.js` 的 `authUser` + `nuxtServerInit` 统一初始化（`store/index.js:14`）。  
2) **全局基础数据与 UI 状态**：用户信息、侧边栏折叠、汇率等都集中在模块里，配合 cookie 持久化减少刷新抖动（`plugins/persistedstate.js:6`）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- Root store（authUser + nuxtServerInit）：`store/index.js:1`
- 用户信息模块（roleType/isValid/resourceStatus 等）：`store/userinfo.js:1`
- UI 状态模块（layoutCollapsed）：`store/userinterface.js:2`
- 汇率模块（currency）：`store/currency.js:1`
- 消息模块（占位）：`store/message.js:1`
- Vuex 持久化（cookie）：`plugins/persistedstate.js:6`
- 译员平台退出标记与 SSR 兜底：`store/index.js:26`、`layouts/translator.vue:167`

## 3. Root：authUser（登录态单一来源）

来源：`store/index.js:1`

Root state 里只有一个核心字段：

- `authUser`：代表“是否已登录/可访问”（`null/true/false` 三态）

对应 mutation：

- `SET_AUTH_USER`（`store/index.js:8`）

面试讲法：

“我们把登录态收敛成一个全局布尔结论，页面/布局只依赖这个结论，而不是到处判断 token/cookie。”

## 4. nuxtServerInit：SSR 首屏初始化（大客户系统 vs 译员平台分流）

来源：`store/index.js:14`

### 4.1 为什么要 nuxtServerInit

- SSR 首屏必须决定：当前用户是否登录、是否有权限，否则页面会出现“先渲染后闪烁隐藏”的问题。  

### 4.2 两套入口：/translator 与非 /translator

来源：`store/index.js:22`

- **译员平台**：调用 `path.isValidUser`，回填 `userinfo.userName/roleName/isValid`（`store/index.js:36`）。  
- **大客户系统**：调用 `path.getUserInfo`，回填 `userinfo`（`store/index.js:50`），并拉取汇率 `getExchangeRate` 写入 `currency`（`store/index.js:54`、`store/index.js:56`）。

### 4.3 退出标记：logged_out=1（只对译员平台生效）

来源：`store/index.js:26`、`layouts/translator.vue:167`

译员平台退出后会写 cookie `logged_out=1`。SSR 初始化如果检测到该标记会直接 `SET_AUTH_USER(false)` 并 return，避免出现“退出后刷新又被 SSR 判定为已登录”的体验问题。

### 4.4 超时兜底：15s Promise.race

来源：`store/index.js:15`

`nuxtServerInit` 用 `Promise.race` 加超时，保证后端异常时不会卡住 SSR。

## 5. userinfo 模块：用户信息 + 权限源数据

来源：`store/userinfo.js:1`

这个模块承载“权限判断所需的最小集合”：

- `roleType`：用于 `v-checkPermission` 的 label->role 显隐（`plugins/checkPermission.js:5`）  
- `isValid`：译员平台是否开通权限（layout 三态渲染依赖它，`layouts/translator.vue:37`）  
- `resourceStatus/resourceId`：译员平台菜单过滤、资源模块状态展示等

更新方式：

- `UPDATE_USERINFO` 支持“部分更新”（仅更新传入字段），适配多处入口（SSR 初始化、登录后回填、后续接口补字段）。

## 6. userinterface 模块：布局级 UI 状态

来源：`store/userinterface.js:2`、`layouts/default.vue:49`

目前只维护一项：

- `layoutCollapsed`：侧边栏折叠状态，由 `layouts/default.vue` 通过 computed getter/setter 读写。

面试讲法：

“这类状态的特点是：跨页面共享、刷新后最好能恢复，所以放 Vuex + cookie 持久化。”

## 7. currency 模块：全局基础数据（汇率）

来源：`store/currency.js:1`、`store/index.js:54`

大客户系统在 SSR 初始化时会请求汇率并写入 `currency`，供页面统一消费（例如价格换算/展示）。

注意点（面试加分）：

- `UPDATE_CURRENCY` 里有 `console.log`（`store/currency.js:6`），SSR 侧会打印到服务端日志，建议移除或加环境开关。

## 8. message 模块：占位（可扩展为全局通知中心）

来源：`store/message.js:1`

当前只有 `text: 'info'`，更像脚手架遗留；如果后续要做全局消息中心，可以把 toast/全局公告/轮询状态放这里，并配合持久化或服务端拉取。

## 9. Vuex 持久化：vuex-persistedstate 写 cookie（同构）

来源：`plugins/persistedstate.js:6`

持久化 key 为 `vuexnuxt`（`plugins/persistedstate.js:7`），并且在 SSR/CSR 下使用不同的读写方式：

- CSR：`js-cookie`  
- SSR：解析 `req.headers.cookie` 读取，写入用 `cookie-universal-nuxt` 的 `app.$cookies`

面试讲法：

“我们用 cookie 做同构持久化，让 SSR 首屏和 CSR 切换都能拿到一致状态；但要注意不要把敏感信息放进 cookie。”

## 10. 面试题库（Q&A 速记）

### Q1：为什么要把登录态放在 Vuex，而不是每个页面自己调接口？

因为 SSR 首屏需要全局统一结论；集中在 `nuxtServerInit` 可以避免每个页面都写一遍登录校验、也避免页面之间结论不一致（`store/index.js:14`）。

### Q2：为什么译员平台要有 logged_out 这种标记？

SSR 场景下，cookie 仍然存在，服务端可能会在刷新时重新判定为已登录；用 `logged_out=1` 显式表达“用户主动退出”可以避免误回放（`store/index.js:26`）。

### Q3：Vuex 持久化为什么用 cookie 而不是 localStorage？

因为 localStorage 只有客户端有，SSR 取不到；cookie 更适合做同构状态恢复（`plugins/persistedstate.js:6`）。

