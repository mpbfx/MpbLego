# JSON 化封装 & 配置驱动 UI 体系详解（big-customer，面向面试）

> 目标：把项目里把"表格列、弹窗表单、Tab 导航、下拉选项、状态机规则"等 **从硬编码提取到 JSON 配置** 的设计思路讲清楚，说明这么做的业务收益和工程价值。

## 1. 一句话概括（面试开场）

本项目把原本散落在各页面组件中的 UI 逻辑（表格列定义、Tab 配置、下拉选项、状态流转规则、字段权限矩阵等）**统一抽取到 `config/` 目录的 JS 配置文件中**，页面组件通过 import 消费配置并渲染，达到"**改配置即改 UI**"的效果——新增一列、一个 Tab 或一组下拉选项，只需修改配置文件，不动组件代码。

对应 README 原文：

> 将 UI 层和逻辑层解剖出来，将原有的 elementUI 以及 antd UI 的使用，比如弹窗等，需要多次使用的组件，进行 JSON 化的封装处理，只需要使用自建方式，调用不同 JSON 即可完成不同功能的配置，减少 UI 层的复杂度，减小未来开发过程中的成本。

---

## 2. 关键文件索引

| 配置文件                              | 内容                                                  | 行数    |
| ------------------------------------- | ----------------------------------------------------- | ------- |
| `config/resourceDetailConfig.js:1`    | 资源详情页全量配置（Tab、表格列、下拉选项、标签分类） | 421 行  |
| `config/resourceFieldPermission.js:1` | 字段权限矩阵（按角色 × 状态 → 可编辑/可删除/可见）    | 330+ 行 |
| `config/resourceStatus.js:1`          | 资源状态机（状态流转规则）                            | 100+ 行 |
| `config/path.js:1`                    | 接口路径枚举（200+ 个接口地址）                       | 200+ 行 |
| `config/permission.js:1`              | 页面/功能权限配置                                     | 60+ 行  |
| `config/status.js:1`                  | 订单状态码映射                                        | 30+ 行  |
| `config/errorCodeMsg.js:1`            | 错误码 → 提示文案映射                                 | 10+ 行  |
| `config/langOption.js:1`              | 语言下拉选项                                          | 60+ 行  |
| `config/currencyOption.js:1`          | 币种下拉选项                                          | 20+ 行  |

---

## 3. 配置驱动 UI 的五大模式

### 模式 A：表格列配置化（最直观）

来源：`config/resourceDetailConfig.js:33`

```js
// 测试表格列定义——纯 JSON 配置
export const testColumns = [
  {
    title: '测试时间',
    dataIndex: 'testTime',
    key: 'testTime',
    width: 120,
    ellipsis: true,
    scopedSlots: { customRender: 'testTime' }
  },
  {
    title: '测试类型',
    dataIndex: 'testType',
    key: 'testType',
    width: 80,
    scopedSlots: { customRender: 'testType' }
  }
  // ...11 列
]
```

组件中消费：

```vue
<template>
  <a-table :columns="testColumns" :dataSource="testList" ... />
</template>

<script>
import { testColumns } from '~/config/resourceDetailConfig'
export default {
  data() {
    return { testColumns }
  }
}
</script>
```

**面试讲法**：

- 表格列配置（`title/width/fixed/ellipsis/scopedSlots`）从组件中抽离到配置文件。
- **新增一列** = 在 `testColumns` 数组中加一个对象，前端框架自动渲染，不动 template。
- 项目中共有 **8 张表格**（测试、领域工具、语言水平、服务价格、简历项目、订单数据、评价记录、沟通管理），每张表格都用这种方式配置化。

### 模式 B：Tab / 导航配置化

来源：`config/resourceDetailConfig.js:6`

```js
export const tabs = [
  { key: 'basic', name: '基础信息', ref: 'basicRef' },
  { key: 'development', name: '资源开发', ref: 'developmentRef' },
  { key: 'test', name: '资源测试', ref: 'testRef' }
  // ...共 13 个 Tab
]
```

组件中消费：

```vue
<template>
  <div v-for="tab in tabs" :key="tab.key" @click="scrollToRef(tab.ref)">
    {{ tab.name }}
  </div>
</template>
```

**面试讲法**：

- Tab 列表不硬编码在 template 里，而是从配置驱动。
- 新增/隐藏一个 Tab = 修改 `tabs` 数组。
- `ref` 字段关联对应卡片的 DOM 引用，用于点击 Tab 时滚动定位。

### 模式 C：下拉选项 / 枚举配置化

来源：`config/resourceDetailConfig.js:277-356`

```js
export const resourceStatusList = ['新开发', '沟通中', '不合作', '备选库', ...]
export const serviceTypeList = ['翻译', 'MTPE', '审校', '脚本家', ...]
export const languageLevelList = ['母语', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1']
export const currencyList = ['人民币', '美元', '加元', '港元', ...]
export const unitList = ['字', '分钟', '小时', '天', '份']
```

**面试讲法**：

- 所有下拉选项**单一来源**在 config 文件，页面/组件/弹窗共享同一份数据。
- 避免"列表页用了一套选项、详情页用了另一套"的不一致。
- 新增选项 = 改配置文件 → 全部消费方自动生效。

### 模式 D：状态机规则配置化

来源：`config/resourceStatus.js:54`

```js
// 资源状态流转规则：每个状态可以流转到哪些目标状态
export const statusTransitions = {
  0: [10, 30, 40], // 新开发 → 沟通中/不合作/备选库
  10: [0, 30, 40, 50], // 沟通中 → 新开发/不合作/备选库/测试中
  50: [60, 70], // 测试中 → 测试不通过/测试通过
  70: [80], // 测试通过 → 签约中
  100: [120], // 签约完成 → 已入库
  120: [130] // 已入库 → 已解约
  // ...
}
```

组件中消费：

```js
import { statusTransitions } from '~/config/resourceStatus'

getAvailableStatusOptions(currentStatus) {
  return statusTransitions[currentStatus] || []
}
```

**面试讲法**：

- 状态机的"可流转目标"是纯配置。UI 根据配置决定下拉框里展示哪些选项。
- 新增状态 / 修改流转规则 = 改配置，UI 自动适应。
- 和后端**保持契约一致**：配置文件就是前后端的"状态机协议"。

### 模式 E：字段权限矩阵配置化

来源：`config/resourceFieldPermission.js:330`

```js
// 字段权限矩阵: [角色][资源状态][字段] → { editable, deletable, visible }
export const fieldPermissionMatrix = {
  // 运营角色（roleType: 10）
  10: {
    // 新开发状态（status: 0）
    0: {
      basicInfo: { editable: true, deletable: false, visible: true },
      developmentInfo: { editable: true, deletable: false, visible: true }
      // ...
    }
  }
}
```

组件中消费：

```js
isFieldEditable(fieldName) {
  const matrix = fieldPermissionMatrix[this.roleType]
  if (!matrix) return false
  const statusRules = matrix[this.resourceStatus]
  if (!statusRules) return false
  return statusRules[fieldName]?.editable || false
}
```

**面试讲法**：

- 字段权限 = f(角色, 状态, 字段)，这个三维矩阵用 JSON 配置，UI 查表即可。
- 权限变更 = 改配置文件 → 不动组件逻辑。
- 这是典型的**数据驱动 UI** + **关注点分离**的设计模式。

---

## 4. 自定义列可见性持久化（CustomColumnDropdown）

来源：`components/Table/CustomColumnDropdown.vue:1`

```vue
<a-checkbox-group :value="value" @change="handleChange">
  <div v-for="col in columns" :key="col.key" class="column-item">
    <a-checkbox :value="col.key">{{ col.title }}</a-checkbox>
  </div>
</a-checkbox-group>
```

```js
handleChange(selectedKeys) {
  this.$emit('input', selectedKeys)
  if (this.storageKey) {
    localStorage.setItem(this.storageKey, JSON.stringify(selectedKeys))
  }
}
```

**面试讲法**：

- 用户在"自定义表头"中勾选想看的列。
- 配置化列定义 + `localStorage` 持久化 = 用户下次打开还是上次的列选择。
- 不同页面用不同 `storageKey`（如 `'development_columns'` / `'onsite_columns'`），互不干扰。

---

## 5. 弹窗组件化（Dialog 封装模式）

来源：`components/ResourceDialog/CommunicationDialog.vue:1`

```vue
<!-- 弹窗组件 -->
<a-modal v-model="visible" title="添加沟通管理" :width="600">
  <div class="communication-form">
    <!-- 表单内容 -->
  </div>
</a-modal>
```

```js
// 父组件通过 ref 调用 open() 打开弹窗
open(row) {
  this.form = {
    translatorId: row.id,
    communicationTime: `${yyyy}/${mm}/${dd}`,
    communicator: this.$store.state.userinfo.userName || ''
  }
  this.visible = true
}
```

**面试讲法**：

- 弹窗不再在每个页面内联写 `<a-modal>` + 表单逻辑，而是封装为独立组件（`CommunicationDialog`、`EvaluationDialog`）。
- 父组件只需 `this.$refs.dialog.open(row)` 即可打开——**调用方一行代码**。
- 表单校验、提交、状态重置都在 Dialog 内部闭环，父组件只关心 `@saved` 事件。

---

## 6. 配置驱动的整体架构图

```
config/
├── resourceDetailConfig.js     ← 表格列、Tab、下拉选项、标签分类
├── resourceStatus.js           ← 状态流转规则
├── resourceFieldPermission.js  ← 字段权限矩阵
├── path.js                     ← 接口路径枚举
├── status.js                   ← 订单状态码
├── permission.js               ← 页面权限
├── langOption.js               ← 语言选项
├── currencyOption.js           ← 币种选项
└── errorCodeMsg.js             ← 错误码文案

      ↓ import

components/ResourceDetail/     ← 卡片组件消费配置渲染 UI
components/OrderDetail/        ← 订单卡片同理
components/Table/              ← 通用表格组件
components/ResourceDialog/     ← 弹窗组件

      ↓ import

pages/                         ← 页面组件组装卡片 + 弹窗
```

---

## 7. 面试题库（Q&A 速记）

### Q1：为什么要把 UI 逻辑提取到配置文件？

三个收益：1) **可维护**——新增列/选项只改配置，不动组件；2) **一致性**——多个页面共享同一份数据源；3) **可审查**——权限矩阵、状态机规则在一个文件里就能看完整，方便 Code Review。

### Q2：这和"写一个通用组件"有什么区别？

通用组件解决的是"UI 复用"，配置化解决的是"业务规则复用"。比如表格列定义是业务规则（这张表要显示哪些字段），不是 UI 组件本身的职责。把业务规则和 UI 组件分离，两者可以**独立变化**。

### Q3：`config/resourceDetailConfig.js` 有 420+ 行，会不会太大？

是的，这个文件承载了整个资源详情页的所有配置。改进方向是按模块拆分：`testConfig.js`、`domainToolConfig.js` 等，每个文件只管一个卡片的配置。但当前阶段"一个文件看完所有配置"在团队中更方便。

### Q4：下拉选项为什么不从后端接口获取？

部分选项确实应从后端获取（如"经理列表"已改为接口 `getSalesManagerNameList`）。但语言水平、币种、服务类型等**变化频率极低**的枚举，前端配置更合理——减少请求数、避免数据不一致。

### Q5：状态机配置和后端的怎么保持一致？

目前靠**人工约定 + Code Review** 保证。改进方向：1) 从后端接口获取状态机配置；2) 在 CI 中加检查脚本对比前后端状态码定义。

---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「配置驱动 UI 体系」这部分，我主导完成了：`resourceDetailConfig.js` 设计与拆分、字段权限矩阵、状态机配置、弹窗组件化封装。

### 量化结果（请按真实数据替换）

- 新增功能成本：新增一个卡片从 X 人天降到 Y 人天（只需配置 + 复用组件）。
- 代码重复率：列表页/详情页间的重复逻辑减少 X%。
- Bug 率：因配置不一致引发的 bug 从 X 个/迭代降到 Y 个/迭代。

### 分时长回答（背诵版）

- 30 秒：  
  把表格列、Tab、下拉选项、状态机、权限矩阵全部提取到 config 目录的 JSON 配置文件，页面组件只负责渲染，实现"改配置即改 UI"。

- 90 秒：  
  五大模式：表格列配置化（8 张表格共用）、Tab 配置化（13 个 Tab 驱动渲染）、下拉选项单一来源（30+ 枚举）、状态机配置化（12 种状态 × 流转规则）、字段权限矩阵（角色 × 状态 × 字段 → 可编辑/可见）。同时弹窗组件化，父组件一行 `open()` 即可调用。

- 3 分钟：
  1. 痛点：UI 逻辑散落在各页面、选项不一致、权限判断到处写。2) 方案：config 目录集中管理、组件消费配置。3) 五大模式 + 代码示例。4) CustomColumnDropdown + localStorage 持久化。5) 收益与后续改进方向。
