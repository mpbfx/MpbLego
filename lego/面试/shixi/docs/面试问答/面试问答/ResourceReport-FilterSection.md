# FilterSection 前端面试问答

## 前端面试官：你是如何实现 FilterSection 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：筛选区直接写在 `pages/resourceManagement/resourceReport.vue` 页面内（无独立子组件）；筛选状态集中在 `data().filters`，由 `resetFilters/searchData` 触发 `fetchData()` 刷新整页数据。
- **模板（HTML/组件）结构**：用 Ant Design Vue 的 `a-select/a-range-picker/a-button` 拼出筛选栏；`资源经理` 用 `v-for` 读取 `managerList` 生成选项；按钮区用 `filter-buttons` 右对齐。
- **响应式数据与单向数据流**：筛选项全部 `v-model` 到 `filters`；请求参数由 `fetchData()` 把空值统一转成后端可接受的默认值（`''` / `0`），避免出现 `undefined` 造成接口歧义。
- **表单校验实现（JS）**：这里是“可选筛选”，不做强校验；重点是时间范围值的健壮性：`a-range-picker` 返回 moment 对象数组，组参时用 `?.valueOf()` 并对空数组兜底为 `0`。
- **输入约束与联动**：
  - 枚举筛选：领域/开发渠道用 `a-select-option` 固定枚举，配合 `allowClear` 让用户快速清空。
  - 动态筛选：资源经理列表通过 `loadManagerList()` 接口拉取；`show-search` + `option-filter-prop="children"` 做本地检索。
  - 时间筛选：开发时间/入库时间分别映射到 `startTime/endTime/storeStartTime/storeEndTime`，统一用时间戳传参。
- **异步搜索下拉（Vue 事件 + 父子通信）**：资源经理下拉是页面内异步数据源（无父子组件通信），通过 `mounted()` 调 `loadManagerList()` 写入 `managerList`，模板自动刷新渲染。
- **权限/状态驱动 UI（如有）**：页面声明 `middleware: 'checkPermission'` 作为路由级拦截；筛选区本身不按权限分支渲染，只负责生成筛选条件。
- **性能与体验细节（如有）**：不会在 `v-model` 变更时自动请求，避免输入过程频繁刷新图表；只在点击“筛选/重置”时拉取数据，加载态统一由外层 `a-spin` 控制。
- **CSS/布局**：
  - `.filter-row` 用 `grid` + `auto-fit/minmax`，在不同宽度下自动换行并保持列宽下限。
  - `.filter-item` 用 `flex` 保证 label 与控件同一行，`min-width: 0` 避免 grid 子项溢出。
  - `/deep/` 覆盖 antd 控件的布局，让 select/日期选择器 `flex: 1` 吃满剩余空间。
- **可扩展性与复用**：新增筛选项只需 3 步：`filters` 加字段 → 模板增加控件 → `fetchData()` 增加参数映射；整体成本低且可维护。

（在此填写追问补充句，保持此段落位置不变）

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

```text
页面（如有）：pages/resourceManagement/resourceReport.vue
组件：pages/resourceManagement/resourceReport.vue（页面内模块：FilterSection）
相关：~/config/path，~/config/permission，~/config/resourceDetailConfig
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```js
data() {
  return {
    filters: {
      domain: undefined,
      channel: undefined,
      manager: undefined,
      developTime: [],
      storageTime: [],
    },
    managerList: [],
    loading: false,
  }
},
mounted() {
  this.loadManagerList()
  this.fetchData()
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```vue
<div class="filter-section">
  <div class="filter-row">
    <div class="filter-item">
      <label>领域</label>
      <a-select v-model="filters.domain" placeholder="请选择" allowClear show-search option-filter-prop="children">
        <a-select-option value="游戏">游戏</a-select-option>
        <a-select-option value="影视">影视</a-select-option>
        <a-select-option value="其他">其他</a-select-option>
      </a-select>
    </div>
    <div class="filter-item">
      <label>资源经理</label>
      <a-select v-model="filters.manager" placeholder="请选择" allowClear show-search option-filter-prop="children">
        <a-select-option v-for="manager in managerList" :key="manager" :value="manager">
          {{ manager }}
        </a-select-option>
      </a-select>
    </div>
    <div class="filter-item">
      <label>开发时间</label>
      <a-range-picker v-model="filters.developTime" :placeholder="['开始', '结束']" />
    </div>
  </div>
  <div class="filter-buttons">
    <a-button @click="resetFilters">重置</a-button>
    <a-button type="primary" @click="searchData">筛选</a-button>
  </div>
</div>
```

### 4）关键交互与业务规则（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```js
resetFilters() {
  this.filters = {
    domain: undefined,
    channel: undefined,
    manager: undefined,
    developTime: [],
    storageTime: [],
  }
  this.fetchData()
},
searchData() {
  this.fetchData()
},
async fetchData() {
  const params = {
    domain: this.filters.domain || '',
    developmentChannel: this.filters.channel || '',
    resourceManager: this.filters.manager || '',
    startTime: this.filters.developTime[0]?.valueOf() || 0,
    endTime: this.filters.developTime[1]?.valueOf() || 0,
    storeStartTime: this.filters.storageTime[0]?.valueOf() || 0,
    storeEndTime: this.filters.storageTime[1]?.valueOf() || 0,
  }
  const res = await this.$http.post(path.getResourceDataStats, params)
  ...
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

文件：`pages/resourceManagement/resourceReport.vue`

```js
async loadManagerList() {
  try {
    const res = await this.$http.get(path.getVmNameList)
    if (res.errorCode === 200 && Array.isArray(res.data)) {
      this.managerList = res.data
    }
  } catch (error) {
    console.error('加载资源经理列表失败:', error)
  }
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```scss
.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px 24px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  /deep/ .ant-select,
  /deep/ .ant-calendar-picker {
    flex: 1;
    min-width: 0;
  }
}
```

---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「资源报表与统计可视化」这部分，我主导完成了：方案拆解、风险评估、核心代码落地、联调上线与复盘沉淀。主导范围覆盖：筛选条件、统计口径、图表渲染与导出。

### 量化结果（请按真实数据替换）

- 关键指标：查询耗时、图表渲染耗时、统计口径一致性缺陷 从 X 优化到 Y。
- 交付效率：同类需求交付周期从 X 天 缩短到 Y 天。
- 稳定性：相关线上问题从 X 个/迭代下降到 Y 个/迭代。
- 可维护性：重复逻辑与临时补丁占比下降 X%。

### 故障复盘卡片（与本文主题相关）

1) 现象：统计口径不一致引发数据争议。  
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
  这部分是我主导落地的，核心目标是把「资源报表与统计可视化」做到稳定、可扩展、可复用，重点解决一致性和线上可维护性。

- 90 秒：
  我按“问题-方案-结果”推进：先定义边界与关键风险，再做结构化改造和统一约定，最后用测试、监控和流程门禁固化成果，确保同类问题不反复出现。

- 3 分钟：
  按“背景、挑战、方案、落地、结果、复盘”展开：
  1) 业务背景与约束。  
  2) 当前痛点与失败案例。  
  3) 方案选择与取舍依据。  
  4) 实施路径与跨团队配合。  
  5) 指标结果与后续优化计划。
