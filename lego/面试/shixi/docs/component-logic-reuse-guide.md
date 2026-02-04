# 组件逻辑复用重构指南

本文档总结了将 Vue 组件中的业务逻辑抽取为可复用模块的规则和最佳实践。

## 一、复用模块设计模式

### 目录结构

```
utils/resource/
├── useBasicInfo.js      # 基础信息模块 ✅ 已完成
├── useOrderTime.js      # 接单时间模块 ✅ 已完成
├── useDomainTool.js     # 领域工具模块 ✅ 已完成
├── useLanguageLevel.js  # 语言水平模块 ✅ 已完成
├── useServicePrice.js   # 服务价格模块 ✅ 已完成
├── useResume.js         # 简历模块 (待抽取)
├── formatters.js        # 格式化工具函数 ✅ 已完成
├── transformers.js      # 数据转换工具 ✅ 已完成
├── validators.js        # 验证工具 ✅ 已完成
├── businessRules.js     # 业务规则 ✅ 已完成
└── index.js             # 统一导出
```

### 模块导出规范

每个模块导出三个函数：

| 函数 | 说明 |
|------|------|
| `createXxxData()` | 返回 data 对象，包含该模块所需的响应式数据 |
| `createXxxMethods(context, options)` | 返回方法对象，context 为 Vue 组件 this |
| `createXxxWatchers(context, methods)` | 返回 watch 配置（可选） |

### 模块示例

```javascript
// utils/resource/useBasicInfo.js

export function createBasicInfoData() {
  return {
    basicInfo: {},
    basicInfoEditing: { /* 初始字段 */ },
    isBasicInfoSaved: false,
    cityOptions: [],
    countryList: Object.freeze(countryList)
  }
}

export function createBasicInfoMethods(context, options = {}) {
  const { onSaveSuccess, onTimezoneUpdate, addOperationRecord } = options
  
  return {
    onBasicInfoModeChange(mode) { /* ... */ },
    saveBasicInfo() { /* ... */ },
    cancelBasicInfo() { /* ... */ },
    clearBasicInfo() { /* ... */ },
    updateCityOptions(country) { /* ... */ },
    handleCitySearch: debounce(async function(value) { /* ... */ }, 500)
  }
}

export function createBasicInfoWatchers(context, methods) {
  return {
    'basicInfo.province': { handler(newVal, oldVal) { /* ... */ } },
    'basicInfoEditing.province': { handler(newVal, oldVal) { /* ... */ } }
  }
}
```

---

## 二、分步执行规则

重构大型文件时，必须分步执行，每步完成后等待用户确认再执行下一步。

| 步骤 | 内容 | 说明 |
|------|------|------|
| 第一步 | 添加导入语句 | 在 import 区域添加新模块导入 |
| 第二步 | 修改 data() | 使用 `...createXxxData()` 展开数据 |
| 第三步 | 添加 created() | 初始化方法对象 |
| 第四步 | 修改 methods | 将原方法改为代理调用（可能需要再分步） |
| 第五步 | 清理导入 | 删除不再需要的 import |
| 第六步 | 验证检查 | 使用 getDiagnostics 检查语法错误 |

### 第四步细分规则

当 methods 中有多个方法需要修改时，按方法逐个替换：

- 第四步-1：替换 `onXxxModeChange`
- 第四步-2：替换 `saveXxx`
- 第四步-3：替换 `cancelXxx`
- 第四步-4：替换 `clearXxx`
- ...

---

## 三、代码替换规则

### 1. 最小修改原则

当替换大段代码失败时，采用最小修改策略：

```javascript
// ❌ 错误做法：尝试一次替换 20+ 行代码
// 这种方式容易因为空白字符、格式化等问题导致失败

// ✅ 正确做法：只替换方法签名和开头，标记旧代码让用户手动删除
onBasicInfoModeChange(mode) {
  this.basicInfoMethods.onBasicInfoModeChange(mode)
},
// 原 onBasicInfoModeChange 逻辑已移至 useBasicInfo.js
_onBasicInfoModeChangeOld(mode) {
  // 原有大量代码...（让用户手动删除）
}
```

### 2. 替换失败处理流程

当 strReplace 失败时：

1. **重新读取文件** - IDE 可能自动格式化导致内容变化
2. **缩小替换范围** - 尝试用更短的唯一字符串片段
3. **检查空白字符** - 注意缩进、换行符差异
4. **请求用户协助** - 如果多次失败，让用户手动删除旧代码

### 3. 导入清理检查

删除导入前必须用 grepSearch 检查该依赖是否在其他地方使用：

```javascript
// 检查 debounce 是否在其他地方使用
grepSearch({ query: 'debounce', includePattern: 'xxx.vue' })

// 结果分析：
// - 只在导入处出现 → 可以删除
// - 在其他地方也有使用 → 必须保留
```

---

## 四、方法代理模式

### 在 created() 中初始化

```javascript
created() {
  this.basicInfoMethods = createBasicInfoMethods(this, {
    // 保存成功回调
    onSaveSuccess: (type) => {
      console.log('保存成功:', type)
    },
    // 时区更新回调（调用组件内其他方法）
    onTimezoneUpdate: () => this.persistOrderTimeTimezone(),
    // 操作记录回调
    addOperationRecord: (action) => this.addOperationRecord(action)
  })
}
```

### 在 methods 中代理

```javascript
methods: {
  // 基础信息操作（代理到可复用模块）
  onBasicInfoModeChange(mode) {
    this.basicInfoMethods.onBasicInfoModeChange(mode)
  },
  saveBasicInfo() {
    this.basicInfoMethods.saveBasicInfo()
  },
  cancelBasicInfo() {
    this.basicInfoMethods.cancelBasicInfo()
  },
  clearBasicInfo() {
    this.basicInfoMethods.clearBasicInfo()
  },
  updateCityOptions(countryNameOrCode) {
    this.basicInfoMethods.updateCityOptions(countryNameOrCode)
  },
  handleCitySearch(value) {
    this.basicInfoMethods.handleCitySearch(value)
  }
}
```

---

## 五、在其他页面复用

### 译员平台复用示例

```javascript
// pages/translator/profile.vue
import {
  createBasicInfoData,
  createBasicInfoMethods
} from '~/utils/resource/useBasicInfo'
import BasicInfoCard from '~/components/ResourceDetail/Cards/BasicInfoCard.vue'

export default {
  components: { BasicInfoCard },

  data() {
    return {
      ...createBasicInfoData(),
      resourceId: null,
      isNewResource: false,
      basicForm: this.$form.createForm(this)
    }
  },

  created() {
    this.basicInfoMethods = createBasicInfoMethods(this, {
      onSaveSuccess: () => {
        // 译员平台特有的成功处理
      }
    })
  },

  methods: {
    onBasicInfoModeChange(mode) {
      this.basicInfoMethods.onBasicInfoModeChange(mode)
    },
    saveBasicInfo() {
      this.basicInfoMethods.saveBasicInfo()
    },
    cancelBasicInfo() {
      this.basicInfoMethods.cancelBasicInfo()
    },
    clearBasicInfo() {
      this.basicInfoMethods.clearBasicInfo()
    },
    handleCitySearch(value) {
      this.basicInfoMethods.handleCitySearch(value)
    }
  }
}
```

---

## 六、注意事项

### 1. 文件格式化问题

IDE 可能自动格式化文件（如 Prettier），导致替换字符串不匹配。

**解决方案**：替换失败时重新读取文件获取最新内容。

### 2. 中文注释编码

PowerShell 读取文件时中文可能显示乱码。

**解决方案**：使用 readFile 工具代替 PowerShell 命令。

### 3. watch 保留原则

如果 watch 中的逻辑涉及其他模块（如时区更新），应保留在原组件中，不要移入复用模块。

```javascript
// 这个 watch 涉及时区更新，保留在原组件
'basicInfoEditing.province': {
  handler(newCountry, oldCountry) {
    if (newCountry && newCountry !== oldCountry) {
      this.autoUpdateTimezoneByCountry(newCountry)  // 时区逻辑
      this.updateCityOptions(newCountry)             // 城市逻辑（代理）
    }
  }
}
```

### 4. 依赖检查

清理导入前必须检查该依赖是否在文件其他位置使用。

### 5. 回调函数设计

模块方法通过 options 参数接收回调，保持模块独立性，不直接依赖组件内的其他方法。

### 6. 长方法分步替换

单个方法超过 10 行时，考虑：
- 分步替换
- 使用最小修改原则
- 让用户手动处理

### 7. 工具函数导入路径（重要）

抽取模块时，必须确认原组件中使用的工具函数的**实际导入路径**，不要想当然地使用看似合理的路径。

**典型错误案例**：

```javascript
// ❌ 错误：假设 transformLanguageLevel 在 utils/resource/transformers.js
import { transformLanguageLevel } from '~/utils/resource/transformers'

// ✅ 正确：先检查原组件的实际导入路径
// 原组件 _id.vue 中的导入：
// import { transformLanguageLevel } from '~/utils/resourceDetailTransform'
import { transformLanguageLevel } from '~/utils/resourceDetailTransform'
```

**检查步骤**：
1. 在原组件中搜索该函数的导入语句
2. 确认实际的文件路径
3. 在新模块中使用相同的导入路径

**后果**：导入路径错误会导致数据转换函数未定义或使用错误版本，表现为保存/编辑后数据不更新。

---

## 七、检查清单

重构完成后，确认以下事项：

- [ ] 新模块文件已创建（`utils/resource/useXxx.js`）
- [ ] 导入语句已添加
- [ ] data() 使用 `...createXxxData()` 展开
- [ ] created() 中初始化了方法对象
- [ ] methods 中的方法已改为代理调用
- [ ] 不再需要的导入已清理
- [ ] getDiagnostics 检查无语法错误
- [ ] 功能测试通过
