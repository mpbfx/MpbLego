# 组件化/复用体系-`utils/resource/*` 详解（big-customer，面向面试）

> 目标：讲清楚为什么项目在 Nuxt2/Vue2 里用 `utils/resource/*` 做“可复用业务模块”，这些模块的拆分边界是什么，如何被 `resourceDetail/_id.vue` 与 `translator/index.vue` 复用，并能指到代码。

## 1. 一句话概括（面试开场）

项目用 `utils/resource/*` 把“资源详情页”与“译员平台”共同的业务逻辑抽成 **模块工厂函数**：

- `createXxxData()`：返回该模块需要的 data 初始结构（由页面 `data()` 展开进组件实例）
- `createXxxMethods(this, options)`：返回该模块的方法集合（封装 API 调用、校验、UI 状态切换、回调通知）
-（部分模块）`createXxxWatchers()`：返回 watcher 定义，交给页面统一挂载

这是一种 Vue2 时代的“组合式复用”（替代 mixin），核心价值是：**同一套业务能力可以在 ResourceDetail（后台）与 Translator（自助端）共用，但 API/权限差异通过 options/专用模块隔离**。

---

## 2. 目录结构与职责边界（你可以直接背）

`utils/resource/`（按“单卡单职责 + 横切工具”拆分）：

- `useBasicInfo.js`：基础信息（后台资源）数据/保存/加载/城市联动（`utils/resource/useBasicInfo.js:15`）
- `useTranslatorBasicInfo.js`：基础信息（译员平台专用 API，隔离后台接口）（`utils/resource/useTranslatorBasicInfo.js:14`）
- `useOrderTime.js`：接单时间（时区推断、校验、保存）（`utils/resource/useOrderTime.js:13`）
- `useDomainTool.js`：领域工具（标签、工具列表）
- `useLanguageLevel.js`：语言水平 + 证书附件上传/下载
- `useServicePrice.js`：服务价格（新增/编辑/无效、缓存上次输入、确认文案可配置）（`utils/resource/useServicePrice.js:12`）
- `useResumeFile.js`：简历文件上传/预览/下载/删除（含三种 fileType）
- `useEducation.js` / `useWorkExperience.js` / `useProjectResume.js`：简历模块子表
- `useResume.js`：聚合简历模块（把 4 个子模块合并，提供 `loadAllResumeData/resetAllResumeData`）（`utils/resource/useResume.js:37`）
- `useOperationRecord.js`：操作记录
- 横切工具：
  - `formatters.js`：时区/日期/语言对等格式化与 filterOption（实现：`utils/resource/formatters.js:1`；统一导出：`utils/resource/index.js:76`）
  - `transformers.js`：编辑态 ↔ API DTO 的转换（字段改名/拼接 JSON 等）
  - `validators.js`：校验规则（数字/重复等）
  - `businessRules.js`：纯业务规则（可选状态、速度选项、重复价格等）

统一出口：`utils/resource/index.js:1`（barrel export，便于页面按需引入）。

---

## 3. 复用模式：为什么不用 mixin，而用“工厂函数 + context 注入”

### A) 工厂函数的签名：把“依赖”变成 options

以基础信息模块为例：

来源：`utils/resource/useBasicInfo.js:55`

```js
export function createBasicInfoMethods(context, options = {}) {
  const { onSaveSuccess, onTimezoneUpdate, addOperationRecord } = options
  return {
    onBasicInfoModeChange(mode) { /* ... */ },
    async saveBasicInfo() { /* ... */ },
  }
}
```

面试讲法：

- 模块内部依赖的不是“全局变量”，而是 `context`（Vue 实例）与 `options`（回调/策略）。
- 这样同一个模块可以在不同页面以不同策略运行：比如保存后是否刷新进度条、是否写操作记录、是否弹 PDF 预览等。

### B) data 也抽象：页面按需 `...createXxxData()`

译员平台首页就是典型用法（把多个模块 data 合并进一个页面）：

来源：`pages/translator/index.vue:277`

```js
data() {
  return {
    ...createTranslatorBasicInfoData(),
    ...createOrderTimeData(),
    ...createDomainToolData(),
    ...createLanguageLevelData(),
    ...createServicePriceData(),
    ...createResumeData(),
    ...createOperationRecordData(),
  }
}
```

面试讲法：

- `data` 展开是为了让模板/子卡片还能用 `this.basicInfo/this.orderTimeInfo` 这种直观字段，不需要再套一层对象。
- 这是“组合式复用”在 Vue2 的常见落地方式。

---

## 4. ResourceDetail（后台）如何复用：按“卡片”引入模块能力

ResourceDetail 主页面既要做 UI 编排，又要承载大量业务逻辑，因此它把可复用部分抽走，主页面主要负责：

- 组装数据（data）
- 在 `created`/`mounted` 初始化各模块 methods
- 把方法作为 props 传给卡片组件
- 或者把模块方法代理为页面 methods（便于模板/子组件调用）

### A) 直接引入模块（有的用单文件引入，有的用 barrel）

来源：`pages/resourceManagement/resourceDetail/_id.vue:1115`

- 单文件引入（更明确）：`useBasicInfo/useOrderTime/useDomainTool/useLanguageLevel/useServicePrice`
- barrel 引入（聚合简历子模块）：`from '~/utils/resource'`（`pages/resourceManagement/resourceDetail/_id.vue:1141`）

对应代码摘录：

```js
// pages/resourceManagement/resourceDetail/_id.vue:1138
import {
  createResumeFileData,
  createResumeFileMethods,
  createEducationData,
  createEducationMethods,
  createWorkExperienceData,
  createWorkExperienceMethods,
  createProjectResumeData,
  createProjectResumeMethods
} from '~/utils/resource'
```

### B) 页面方法代理：把模块方法当成“服务对象”

资源详情页对简历文件相关方法做了代理（模板里只调用页面 methods）：

- 代理入口：`pages/resourceManagement/resourceDetail/_id.vue:2350`
- 真正实现：`utils/resource/useResumeFile.js:74`

这种写法的好处：

- 页面/卡片不关心实现在哪个模块里，只要调用 `onUploadResume/previewResumeFile` 即可；
- 将来模块调整（比如把简历文件迁移到独立服务）时，改动面更小。

---

## 5. Translator（译员平台）如何复用：同卡片 UI + 不同 API

译员平台主页复用的“卡片组件”几乎和 ResourceDetail 一致（BasicInfoCard/OrderTimeCard/.../ResumeCard），但 **基础信息 API、部分可编辑能力、预览方式**不同。

### A) 基础信息：必须走译员平台专用模块

原因：译员平台要和后台系统隔离接口、并把资源 id/status 写入 store 供其它模块使用。

来源：`utils/resource/useTranslatorBasicInfo.js:109`

```js
const res = await context.$http.get(path.translatorGetResourceBase)
context.resourceId = data.id
context.$store.commit('userinfo/UPDATE_USERINFO', { resourceStatus: data.status, resourceId: data.id })
```

在页面 created 中初始化并链式加载其它模块：

来源：`pages/translator/index.vue:364`

```js
this.basicInfoMethods = createTranslatorBasicInfoMethods(this, {
  onLoadSuccess: () => {
    this.basicInfoLoading = false
    this.loadOtherModulesData()
  }
})
this.basicInfoMethods.loadBasicInfo()
```

### B) 同一模块不同策略：用 options 注入差异

以简历模块为例，译员平台用弹窗预览 PDF（并不跳路由）：

来源：`pages/translator/index.vue:399`

```js
this.resumeMethods = createResumeMethods(this, {
  onPreview: (url, fileName) => {
    this.pdfPreviewUrl = url
    this.pdfPreviewFileName = fileName
    this.pdfPreviewVisible = true
  }
})
```

而后台资源详情页同一能力可能选择跳转到 `resumePreview` 路由（两端策略不同，逻辑通过 options/上下文决定）。

---

## 6. useResume.js：为什么要做“聚合模块”，以及如何避免循环依赖

简历模块由 4 个子表组成（文件/学历/工作/项目）。为了让页面“一个模块就能加载/重置全部简历相关数据”，提供了 `createResumeData/createResumeMethods` 聚合：

来源：`utils/resource/useResume.js:37`

并且用 `require` 延迟导入来避免循环依赖：

来源：`utils/resource/useResume.js:104`

```js
const { createResumeFileMethods } = require('./useResumeFile')
```

面试讲法：

- 子模块互相引用/又被 index.js re-export 时，ESM import 容易出现循环依赖初始化顺序问题；
- 延迟 require 能把依赖解析推迟到运行期，避免加载阶段就互相引用导致 undefined。

---

## 7. 这套复用体系的优点/缺点（面试官追问的标准答案）

### 优点

1) **去 mixin 化**：比 mixin 更可控（不会把一堆 methods/data 隐式注入到 this 上）。
2) **显式依赖**：模块需要什么，通过 options 显式传入（回调、文案、策略）。
3) **跨页面复用**：后台与译员平台共享业务能力，但可在关键点替换 API（`useTranslatorBasicInfo`）。
4) **易测**：业务规则/转换器是纯函数（`businessRules/transformers`），更容易单测。

### 缺点（以及你可以怎么改进）

1) `context` 强耦合 Vue 实例：模块内部大量调用 `context.$http/$message/$refs`，测试需要 mock。  
   改进：把 I/O（http/message/router/store）抽成依赖注入对象，或把纯逻辑进一步下沉到 `businessRules/transformers`。
2) 字段命名要保持一致：`createXxxData` 展开到页面 data 后，字段名冲突会难排查。  
   改进：约定模块命名空间，或在合并时显式前缀（例如 `basicInfoState`）。
3) 重复导出方式（单文件 import vs barrel import）会造成团队习惯不一致。  
   改进：统一约定“页面只从 `~/utils/resource` 引入”，或按“核心模块直接引入、聚合模块走 barrel”约定。

---

## 8. 新增一个可复用模块的模板（你可以按这个讲“我怎么扩展的”）

1) 新建 `utils/resource/useXxx.js`：
   - `createXxxData()`：只放该卡片/子域需要的数据
   - `createXxxMethods(context, options)`：封装 load/save/delete + modeChange
2) 在 `utils/resource/index.js:1` 导出
3) 在 `resourceDetail/_id.vue` 与 `translator/index.vue`：
   - `data()`：`...createXxxData()`
   - `created()`：`this.xxxMethods = createXxxMethods(this, { onSaveSuccess: ... })`
   - 卡片 props/事件：用 `@save="saveXxx"` 或 `:xxx-methods="..."` 方式接入

---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「架构抽象与复用模式」这部分，我主导完成了：方案拆解、风险评估、核心代码落地、联调上线与复盘沉淀。主导范围覆盖：模式选型、抽象边界、复用落地。

### 量化结果（请按真实数据替换）

- 关键指标：重复代码占比、接入时长、回归缺陷率 从 X 优化到 Y。
- 交付效率：同类需求交付周期从 X 天 缩短到 Y 天。
- 稳定性：相关线上问题从 X 个/迭代下降到 Y 个/迭代。
- 可维护性：重复逻辑与临时补丁占比下降 X%。

### 故障复盘卡片（与本文主题相关）

1) 现象：抽象层不清导致复用失败。  
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
  这部分是我主导落地的，核心目标是把「架构抽象与复用模式」做到稳定、可扩展、可复用，重点解决一致性和线上可维护性。

- 90 秒：
  我按“问题-方案-结果”推进：先定义边界与关键风险，再做结构化改造和统一约定，最后用测试、监控和流程门禁固化成果，确保同类问题不反复出现。

- 3 分钟：
  按“背景、挑战、方案、落地、结果、复盘”展开：
  1) 业务背景与约束。  
  2) 当前痛点与失败案例。  
  3) 方案选择与取舍依据。  
  4) 实施路径与跨团队配合。  
  5) 指标结果与后续优化计划。
