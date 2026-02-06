# 中间件与路由守卫：auth / checkPermission 详解（big-customer，面向面试）

> 目标：把项目里“页面级 middleware 如何做登录态/权限兜底、为什么译员平台要跳过权限检查、UI 级权限（指令）与路由级权限（middleware）分别解决什么问题”讲清楚，并配关键代码指路（`file:line`）。

## 1. 一句话概括（面试开场）

本项目有两层“权限”：

1) **路由级（middleware）**：在进入页面前做兜底跳转，避免用户直接访问无权限页面（`middleware/checkPermission.js:4`）。  
2) **UI 级（directive）**：在模板层把无权限按钮/入口直接移除（`plugins/checkPermission.js:9`）。

其中译员平台（`/translator`）是一套独立产品入口：它不走大客户系统的权限 label 体系，所以 middleware 会显式跳过（`middleware/checkPermission.js:10`）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- 登录态兜底（当前主要为占位/注释状态）：`middleware/auth.js:3`
- 页面权限检查：`middleware/checkPermission.js:4`
- UI 级权限指令：`plugins/checkPermission.js:9`
- 权限表与 label 定义：`config/permission.js:1`
- 页面声明 middleware 的位置（示例）：`pages/costSettlement/cost.vue:725`、`pages/resourceManagement/resourceReport.vue:192`

## 3. middleware 的基本运行时机（Nuxt2）

Nuxt2 的 `middleware/xxx.js` 会在页面导航前执行（SSR 首屏和 CSR 切换都会走），拿到的 `context` 中常用字段：

- `store`：拿用户信息、登录态  
- `route`：当前访问路径  
- `redirect()`：做路由跳转  
- `error()`：抛出 Nuxt 错误页（当前项目多处注释掉）

本项目没有在 `nuxt.config.js` 全局启用 router middleware（`nuxt.config.js:21`），而是以页面级 `middleware: 'checkPermission'` 为主。

## 4. auth.js：为什么看起来“没做事”

来源：`middleware/auth.js:3`

`auth.js` 目前只有一个最外层的 `if (!store.state.authUser)`，实际跳转/报错逻辑都被注释了：

```js
export default function ({ store }) {
  if (!store.state.authUser) {
    // redirect(...)
    // error(...)
  }
}
```

面试讲法（建议讲“现状 + 演进”）：

- 这个项目更依赖 **HTTP 层统一处理 1003 未登录**（`plugins/http.js:39`）+ **SSR 初始化的 authUser**（`store/index.js:14`）；
- `auth.js` 更像是早期做路由级登录守卫的尝试，后续为了兼容“译员平台允许未登录打开页面并弹登录窗”的需求，登录拦截被迁移/弱化。

## 5. checkPermission.js：路由级权限守卫怎么做

### 5.1 译员平台直接跳过：避免跳回大客户系统

来源：`middleware/checkPermission.js:10`

```js
if (path.startsWith('/translator')) {
  return
}
```

面试讲法：

- `/translator` 下的权限校验不是“roleType + label”体系；
- 译员平台主要依赖 `userinfo.isValid` 控制渲染（`layouts/translator.vue:33`），而不是这里的 label。

### 5.2 把 route.path 映射为 permission label（目前只覆盖少数页面）

来源：`middleware/checkPermission.js:15`

`getLabel(path)` 目前只对少数路径返回 label（如成本结算/工作量统计），其他路径返回空字符串：

- `/costSettlement/cost` -> `costSettlement-checkOrderInfo`
- `/workloadAccount/projectManager` -> `workloadAccount-projectManager`
- `/workloadAccount/salesManager` -> `workloadAccount-salesManager`

### 5.3 实际“路由级拦截”目前是弱化的：checkPermission 恒返回 true

来源：`config/permission.js:49`

`config/permission.js` 的 `checkPermission` 当前实现是：

- 计算了 `visible`，但最终 `return true`

这意味着 **middleware 的 `if (!checkPermission(...)) redirect('/')` 理论上永远不会触发**（`middleware/checkPermission.js:27`）。

面试讲法（加分点）：

- 这是“策略迁移中间态”：路由级拦截被弱化/关闭，避免影响线上访问；真正的按钮级权限依然由 `v-checkPermission` 指令生效（见下一节）。
- 如果要恢复路由级权限：把 `return true` 改回 `return visible`，并补全 `getLabel` 覆盖范围（或建立 route -> label 的配置表）。

### 5.4 不建议保留 `console.log`：SSR 下会污染服务端日志

来源：`middleware/checkPermission.js:7`

middleware 在 SSR 首屏也会跑，`console.log` 会进入 Node 端日志；这类日志建议用 `process.env.NODE_ENV` 做开关或移除。

## 6. UI 级权限：v-checkPermission 指令的“硬删除”策略

来源：`plugins/checkPermission.js:9`

指令的核心策略是：

- 读 `permissionTable[label]` 判断是否可见（`plugins/checkPermission.js:5`）
- 不可见则把当前 vnode 替换成注释节点，从 DOM 树中移除（`plugins/checkPermission.js:24`、`plugins/checkPermission.js:46`）

面试讲法：

- 优点：接入成本低（模板一行），能做到按钮级权限“彻底不可见”。  
- 风险：属于强副作用（直接改 vnode/DOM），更适合“是否显示”，不适合“禁用但可见”。当前代码里对 `type === 'click-disable'` 的逻辑是注释状态（`plugins/checkPermission.js:17`）。

## 7. 页面是如何启用 middleware 的（例子）

来源：`pages/costSettlement/cost.vue:725`

页面通过 option 指定 middleware：

```js
export default {
  middleware: 'checkPermission'
}
```

## 8. 面试题库（Q&A 速记）

### Q1：为什么你们既有 middleware 又有 v-checkPermission 指令？

它们解决的问题粒度不同：

- middleware 负责“能不能进这个页面”（路由级兜底）。
- 指令负责“页面里哪些按钮/入口能看到”（UI 级细粒度）。

### Q2：译员平台为什么要跳过 checkPermission middleware？

译员平台是独立入口：登录态/权限判断来自 `userinfo.isValid`，并且未登录时允许打开页面弹登录窗；如果强行用大客户系统的 label 体系，会导致跳转到错误的登录入口（`middleware/checkPermission.js:10`、`layouts/translator.vue:37`）。

### Q3：你如何解释 `config/permission.js` 里 `checkPermission` 最后 `return true`？

这是一种“线上兜底/策略降级”：避免路由级权限拦截误伤真实用户，把权限控制主要收敛到 UI 级指令；如果要恢复路由级权限，需要把返回值改为 `visible` 并完善 route->label 映射。


---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「权限鉴权与访问控制」这部分，我主导完成了：方案拆解、风险评估、核心代码落地、联调上线与复盘沉淀。主导范围覆盖：路由鉴权、按钮可见性、后端兜底。

### 量化结果（请按真实数据替换）

- 关键指标：越权入口数、误拦截率、权限相关工单 从 X 优化到 Y。
- 交付效率：同类需求交付周期从 X 天 缩短到 Y 天。
- 稳定性：相关线上问题从 X 个/迭代下降到 Y 个/迭代。
- 可维护性：重复逻辑与临时补丁占比下降 X%。

### 故障复盘卡片（与本文主题相关）

1) 现象：路由放行与按钮权限不一致。  
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
  这部分是我主导落地的，核心目标是把「权限鉴权与访问控制」做到稳定、可扩展、可复用，重点解决一致性和线上可维护性。

- 90 秒：
  我按“问题-方案-结果”推进：先定义边界与关键风险，再做结构化改造和统一约定，最后用测试、监控和流程门禁固化成果，确保同类问题不反复出现。

- 3 分钟：
  按“背景、挑战、方案、落地、结果、复盘”展开：
  1) 业务背景与约束。  
  2) 当前痛点与失败案例。  
  3) 方案选择与取舍依据。  
  4) 实施路径与跨团队配合。  
  5) 指标结果与后续优化计划。
