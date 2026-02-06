# 资源模块：ResourceDetail 总览（big-customer，面向面试）

> 目标：把资源详情页（`pages/resourceManagement/resourceDetail/_id.vue`）的结构、数据流、复用点与关键难点（状态机/字段权限/文件流/性能）一次讲清楚，并配关键代码摘录（含文件:行号）。

## 1. 一句话概括（面试开场）

`ResourceDetail` 是资源管理的核心页面：以“Tab 导航 + 卡片模块（Basic/Development/Test/Contract/OrderTime/DomainTool/Language/ServicePrice/Resume/OperationRecord）”组织复杂业务；通过可复用的 `utils/resource` 工厂模块承载 CRUD 逻辑；通过 `resourceStatus` 状态机和字段权限矩阵实现“不同阶段字段可编辑/必填/可删除”；并用 IntersectionObserver 驱动 tab 高亮与滚动定位做性能优化。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- 主页面：`pages/resourceManagement/resourceDetail/_id.vue:1`
- Tab/列配置：`config/resourceDetailConfig.js:1`（tabs、columns 等）
- 状态机（code/text 映射 + 可流转 nextStates）：`config/resourceStatus.js:5`
- 字段权限矩阵（development/onsite）：`config/resourceFieldPermission.js:61`
- 可复用业务模块（data+methods 工厂）：`utils/resource/useBasicInfo.js:15`、`utils/resource/useLanguageLevel.js:12`、`utils/resource/useServicePrice.js:12`、`utils/resource/useResumeFile.js:64`
- 转换层（后端 -> 前端模型）：`utils/resourceDetailTransform.js:13`

## 3. 页面结构：Tab 导航 + 卡片区域（“页面只做编排”）

来源：`pages/resourceManagement/resourceDetail/_id.vue:1`

```vue
<tab-nav :tabs="tabs" :active-tab="activeTab" @tab-change="handleTabChange" />

<div class="cards-container">
  <div ref="basicRef" class="card-section">
    <basic-info-card :basic-info="basicInfo" :is-field-editable="isFieldEditable" ... />
  </div>
  <div ref="developmentRef" class="card-section">
    <development-info-card :is-field-editable="isFieldEditable" :is-field-deletable="isFieldDeletable" ... />
  </div>
  <!-- test/contract/orderTime/domainTool/languageLevel/servicePrice/resume/operationRecord... -->
</div>
```

面试讲法：

- 页面负责“路由、Tab、滚动、loading 编排、权限判断”；
- 每张卡片只负责 UI/交互，数据读写由对应 methods 模块负责（见下一节）。

## 4. 模块化复用：createXxxData/createXxxMethods（工厂 + 组合）

### A) 在 ResourceDetail 中引入多个可复用模块

来源：`pages/resourceManagement/resourceDetail/_id.vue:1121`

```js
import { createOrderTimeData, createOrderTimeMethods } from '~/utils/resource/useOrderTime'
import { createDomainToolData, createDomainToolMethods } from '~/utils/resource/useDomainTool'
import { createLanguageLevelData, createLanguageLevelMethods } from '~/utils/resource/useLanguageLevel'
import { createServicePriceData, createServicePriceMethods } from '~/utils/resource/useServicePrice'
import { createResumeFileData, createResumeFileMethods } from '~/utils/resource'
```

### B) 页面 data 直接展开模块 data（降低本组件体积）

来源：`pages/resourceManagement/resourceDetail/_id.vue:1182`

```js
data() {
  return {
    ...createBasicInfoData(),
    ...createOrderTimeData(),
    ...createDomainToolData(),
    ...createLanguageLevelData(),
    ...createServicePriceData(),
    ...createResumeFileData(),
  }
}
```

### C) BasicInfo 模块（示例）：新建/编辑分支、表单校验、创建后 replace 路由

来源：`utils/resource/useBasicInfo.js:55`

```js
export function createBasicInfoMethods(context, options = {}) {
  return {
    async saveBasicInfo() {
      context.basicForm.validateFields(async (err, values) => {
        const formData = this.buildBasicInfoFormData(values)
        if (context.isNewResource) await this.createBasicInfo(formData)
        else await this.updateBasicInfo(formData, context.isBasicInfoSaved)
      })
    },
    async createBasicInfo(formData) {
      const res = await context.$http.post(path.addResourceBase, formData)
      context.resourceId = res.data.id || res.data
      context.$router.replace({ path: `/resourceManagement/resourceDetail/${context.resourceId}` })
    }
  }
}
```

面试讲法：

- 典型“页面编排 + 模块承载 CRUD”，把复杂逻辑从 Vue SFC 里剥离出来；
- `create` 完成后 `router.replace` 到真实 `_id`，避免“新建态”与“详情态”混在一个 URL 下。

## 5. 动态 Tabs：根据模式与模块条件过滤（可见性编排）

来源：`pages/resourceManagement/resourceDetail/_id.vue:1326`

```js
tabs() {
  return this.allTabs.filter(tab => {
    if (this.isNewResource) return tab.key === 'basic'
    if (tab.key === 'contract') return this.shouldShowContractModule
    return true
  })
}
```

面试讲法：

- “新建资源”只允许填基础信息；其他卡片依赖 resourceId；
- 合同模块受业务条件控制（例如资源状态/流程到达某阶段才开放）。

## 6. 资源状态机：code/text 映射 + nextStates（决定可流转状态）

来源：`config/resourceStatus.js:5`

```js
export const statusMap = { 0: '新开发', 50: '测试中', 80: '测试通过', 120: '已入库', '-30': '已解约' }
export const statusReverseMap = { '新开发': 0, '测试中': 50, '已入库': 120 }

export const statusMachine = {
  '测试中': { editable: true, nextStates: ['测试不通过', '测试通过'] },
  '已入库': { editable: true, nextStates: ['已解约'] }
}
export function isStatusEditable(status) { return statusMachine[status]?.editable || false }
export function getNextStates(status) { return statusMachine[status]?.nextStates || [] }
```

页面如何消费（生成“可选状态”）：

来源：`pages/resourceManagement/resourceDetail/_id.vue:2945`

```js
getAvailableStatusOptions(currentStatusText) {
  const options = [{ label: currentStatusText, value: currentStatusText }]
  if (isStatusEditable(currentStatusText)) {
    getNextStates(currentStatusText).forEach(text => options.push({ label: text, value: text }))
  }
  return options
}
```

面试讲法：

- 不是“随便改状态”，而是状态机约束流转，避免非法跳转；
- `statusMap/reverseMap` 保证展示层与保存层都稳定（中文展示，数字保存）。

## 7. 字段级权限矩阵：development vs onsite（编辑/删除/必填）

来源：`config/resourceFieldPermission.js:330`

```js
export function getFieldPermission(category, fieldName, resourceStatus) {
  const fieldPermission = fieldPermissions[category]?.[fieldName]
  const stage = isDevelopmentStage(resourceStatus) ? 'development' : 'onsite'
  return fieldPermission[stage] || { editable: true, deletable: true, required: false }
}
```

页面如何消费（统一入口：isFieldEditable/isFieldDeletable）：

来源：`pages/resourceManagement/resourceDetail/_id.vue:2976`

```js
getFieldPermission(category, fieldName) {
  const resourceStatus = this.developmentInfo.status || '新开发'
  return getFieldPermission(category, fieldName, resourceStatus)
},
isFieldEditable(category, fieldName) {
  // 特例：loginAccount 一旦保存不可改
  if (category === 'basicInfo' && fieldName === 'loginAccount') return !this.basicInfo.loginAccount
  // 特例：resource manager 首次保存后不可改
  if (category === 'development' && fieldName === 'manager') return !this.isDevelopmentInfoSaved
  return this.getFieldPermission(category, fieldName).editable
}
```

面试讲法：

- 配置表解决“字段在不同阶段的可编辑性差异”，页面只调用统一接口；
- 仍保留少量“业务特例”在页面层兜底（loginAccount/manager），保证体验与后端约束一致。

## 8. 文件流（上传/下载/预览）：统一 URL 规范 + credentials

来源：`utils/resource/useResumeFile.js:104`

```js
const uploadRes = await context.$axios.post(path.uploadFile, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
const res = await context.$http.post(path.createResourceResume, { resourceId: context.resourceId, keyName: fileInfo.keyName })
```

下载/预览的 URL 规范：

来源：`utils/resource/useResumeFile.js:162`

```js
const url = `${path.baseURL}${path.downloadFile}?keyName=${file.keyName}&fileName=${encodeURIComponent(file.name)}`
```

面试讲法：

- 上传通常走网关（`path.uploadFile`），保存元数据走业务接口；
- 下载使用 `fetch(..., { credentials: 'include' })` 处理鉴权与文件名（详见 `docs/面试问答/项目难点-总结.md:1` 的文件难点）。

## 9. 性能优化：IntersectionObserver 驱动 Tab 高亮（替代 scroll 监听）

来源：`pages/resourceManagement/resourceDetail/_id.vue:2713`

```js
initSectionObserver() {
  this.sectionObserver = new IntersectionObserver((entries) => {
    // 计算最佳 activeTab
  })
  this.tabs.forEach((tab) => {
    const el = this.$refs[`${tab.key}Ref`]
    if (el) this.sectionObserver.observe(el)
  })
}
```

面试讲法：

- 资源详情页很长，scroll 监听易导致频繁计算与卡顿；
- IntersectionObserver 把工作交给浏览器优化路径，结合阈值/可见比例做 activeTab 更稳。

## 10. 面试题库（Q&A 速记）

### Q1：为什么要把业务拆成多个 createXxxMethods？

降低单个页面复杂度，支持跨页面复用（资源详情页 + 译员平台），并让每个模块可以独立演进与测试。

### Q2：字段权限为什么要做成“矩阵”，而不是写一堆 if？

因为它是规则系统：可审计、可扩展、变更成本低；页面只调用 `isFieldEditable()`。

### Q3：ResourceDetail 最难的点是什么？

把“状态机 + 字段权限 + 文件流 + 长页面性能 + 多模块编排”同时做到可维护，避免页面组件失控膨胀。


---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「资源模块建模与状态流转」这部分，我主导完成了：方案拆解、风险评估、核心代码落地、联调上线与复盘沉淀。主导范围覆盖：字典枚举治理、字段权限、状态机联动。

### 量化结果（请按真实数据替换）

- 关键指标：字段映射错误率、状态流转异常数、页面回归缺陷 从 X 优化到 Y。
- 交付效率：同类需求交付周期从 X 天 缩短到 Y 天。
- 稳定性：相关线上问题从 X 个/迭代下降到 Y 个/迭代。
- 可维护性：重复逻辑与临时补丁占比下降 X%。

### 故障复盘卡片（与本文主题相关）

1) 现象：字典映射错误导致展示/提交异常。  
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
  这部分是我主导落地的，核心目标是把「资源模块建模与状态流转」做到稳定、可扩展、可复用，重点解决一致性和线上可维护性。

- 90 秒：
  我按“问题-方案-结果”推进：先定义边界与关键风险，再做结构化改造和统一约定，最后用测试、监控和流程门禁固化成果，确保同类问题不反复出现。

- 3 分钟：
  按“背景、挑战、方案、落地、结果、复盘”展开：
  1) 业务背景与约束。  
  2) 当前痛点与失败案例。  
  3) 方案选择与取舍依据。  
  4) 实施路径与跨团队配合。  
  5) 指标结果与后续优化计划。
