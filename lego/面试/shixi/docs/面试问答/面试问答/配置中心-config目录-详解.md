# 配置中心：config/ 目录详解（big-customer，面向面试）

> 目标：把项目里“接口路径/权限表/枚举字典/资源状态机/资源详情页配置”这些‘单一数据源（SSOT）’集中在哪里、怎么被页面/组件/工具函数消费”讲清楚，并能指到关键代码（`file:line`）。

## 1. 一句话概括（面试开场）

本项目把“容易在多人协作中乱掉的常量和规则”集中在 `config/`：

- 后端接口路径统一在 `config/path.js`（避免散落 magic string）。  
- 权限 label 与可见角色表统一在 `config/permission.js`（供指令/路由守卫使用）。  
- 资源状态、状态机、字段权限这些“业务规则”以枚举/配置表形式沉淀（`config/resourceStatus.js`、`config/resourceFieldPermission.js`）。  
- ResourceDetail 的 Tab/表格列/选项列表是配置驱动（`config/resourceDetailConfig.js`）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- API 路径枚举：`config/path.js:1`
- 错误码文案：`config/errorCodeMsg.js:1`
- 权限表：`config/permission.js:1`
- 路由别名（少量使用）：`config/routeUrl.js:1`
- 资源状态与状态机：`config/resourceStatus.js:5`
- 资源字段权限（按开发/在场阶段）：`config/resourceFieldPermission.js:61`
- 资源详情页配置（Tab/列/选项）：`config/resourceDetailConfig.js:1`
- 构建环境（注意：在根目录，不在 config/）：`env.js:5`、`version.js:1`

## 3. config/path.js：接口路径的“单一来源”

来源：`config/path.js:1`

`path.js` 维护了：

- 登录跳转地址：`loginUrl`（`config/path.js:2`）
- 后端 baseURL（来自 `process.env.API_HOST`）：`baseURL`（`config/path.js:3`）
- 业务接口路径：如 `getUserInfo`、`isValidUser`、`getExchangeRate` 等（`config/path.js:4`、`config/path.js:5`、`config/path.js:170`）

面试讲法：

- 统一维护能避免页面里散落 `'/sales/xxx/yyy'`；
- 配合 `$http` 封装（`plugins/http.js:57`），调用方只关心 `path.xxx`。

## 4. config/errorCodeMsg.js：错误码文案字典（但要注意“是否真的用上了”）

来源：`config/errorCodeMsg.js:1`

这里把常见错误码对应的中文文案集中维护。注意项目里有一个 `$errorCodeHandler` 注入（`plugins/errorCodeHandler.js:3`），但目前实现只做了 `errorCode !== 200` 的检测，并未使用 `errorCodeMsg`（属于可改进点）。

面试讲法：

“协议层 errorCode 的业务动作（比如 1003 跳转登录）在 HTTP 层做，提示文案可以在 UI 层做统一映射；当前项目这块有历史遗留，属于可以优化的工程点。”

## 5. config/permission.js：权限 label 与角色映射

来源：`config/permission.js:1`

核心是 `permissionTable`：`label -> [roleType]`，供 UI 指令做按钮级显隐（`plugins/checkPermission.js:5`）。

但同时要注意：`checkPermission(roleType, label)` 当前 **固定返回 true**（`config/permission.js:49`），这会导致路由级 middleware 的拦截被“降级关闭”（详见：`docs/面试问答/中间件-路由守卫-auth&checkPermission-详解.md:1`）。

## 6. config/resourceStatus.js：状态枚举 + 状态机（规则可读、可复用）

来源：`config/resourceStatus.js:5`

这份配置解决两个典型痛点：

1) **后端数字 <-> 前端中文** 的双向映射（`statusMap`/`statusReverseMap`）。  
2) **状态流转规则** 以 `statusMachine` 描述，业务侧只需要调用 `getNextStates()`（`config/resourceStatus.js:54`、`config/resourceStatus.js:131`）。

面试讲法：

“把流程规则从组件里抽成配置表，能让‘改规则’变成改一处，避免每个页面都写 if/else。”

## 7. config/resourceFieldPermission.js：字段权限（按阶段）配置化

来源：`config/resourceFieldPermission.js:61`

项目把“开发阶段 vs 在场阶段”对字段的 `editable/deletable/required` 差异写成配置表，并用 `getFieldPermission(category, fieldName, resourceStatus)` 统一取权限（`config/resourceFieldPermission.js:330`）。

面试讲法：

- 优点：字段权限是典型“规则密集型”需求，配置化更可维护；  
- 风险：配置表体量大，要做好分类命名与覆盖兜底（当前兜底策略是 `console.warn + 默认可编辑`）。

## 8. config/resourceDetailConfig.js：ResourceDetail 的“配置驱动 UI”

来源：`config/resourceDetailConfig.js:1`

这里包含：

- Tab 配置（key/name/ref）  
- 各类表格列定义（测试/语言水平/服务价格/简历等）  
- 各种下拉选项列表（币种/单位/译员级别/报表区间等）

面试讲法：

“表格列和选项是典型的‘静态结构’；抽到配置文件后，组件代码就更偏向‘渲染与交互’，降低复杂度。”

## 9. 一个容易踩坑的点：config/env.js 是空文件，真正用的是根目录 env.js

来源：`nuxt.config.js:4`、`env.js:1`

`nuxt.config.js` 里用的是根目录 `env.js`（用于生成 `BUILD_PUBLIC_PATH`），而 `config/env.js` 目前为空（长度为 0）。面试/交接时建议把这点说清楚，避免新人误以为“环境配置在 config/env.js”。

## 10. 面试题库（Q&A 速记）

### Q1：为什么要把 path/权限/枚举放到 config/，而不是散落在页面里？

因为这些是跨页面共享的“单一来源数据”，分散会造成重复、口径不一致和回归风险；集中后更易测试、易审查、易变更。

### Q2：状态机/字段权限为什么用配置表而不是写 if/else？

规则会频繁改、还会被多个页面复用。配置表让规则更可读也更可维护，并且能被单元测试覆盖（只测配置与取值函数即可）。


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
