# StatCards 前端面试问答

## 前端面试官：你是如何实现 StatCards 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：统计卡片同样写在 `pages/resourceManagement/resourceReport.vue` 页面中（无单独组件），属于页面级“展示模块”，数据由接口统一驱动。
- **模板（HTML/组件）结构**：`stat-cards` 容器内两张卡片（`stat-card`），每张卡片由 label + value 两块组成；value 直接插值渲染 `stats.*`。
- **响应式数据与单向数据流**：`stats` 在 `data()` 初始化为 `0`，接口返回后在 `processData(data)` 中更新 `developingCount/storedCount`；模板层只读渲染，不反向修改。
- **表单校验实现（JS）**：无表单输入与校验。
- **输入约束与联动**：
  - 统计值默认 `0`，避免首屏空白或 `undefined`。
  - 与筛选条件联动：点击“筛选/重置”触发 `fetchData()` 后，`processData()` 重新计算并渲染。
  - 与图表联动：同一次接口返回同时刷新卡片与图表（统一数据源，避免多接口不一致）。
- **异步搜索下拉（Vue 事件 + 父子通信）**：无。
- **权限/状态驱动 UI（如有）**：无独立权限控制；全页由 `middleware: 'checkPermission'` 负责入口权限。
- **性能与体验细节（如有）**：统计卡片只在 `processData()` 更新时触发一次渲染；不做动画与额外计算，开销很小。
- **CSS/布局**：
  - `display: flex` 平分两张卡片（`flex: 1`）。
  - 固定高度 `60px`，居中展示数字，保证信息密度与一致性。
  - 与页面其他卡片（图表卡片）保持统一白底与圆角风格。
- **可扩展性与复用**：要新增统计项时，增加 `stats.xxx` 字段 + `processData()` 赋值 + 模板追加 `stat-card`，不影响现有图表逻辑。

（在此填写追问补充句，保持此段落位置不变）

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

```text
页面（如有）：pages/resourceManagement/resourceReport.vue
组件：pages/resourceManagement/resourceReport.vue（页面内模块：StatCards）
相关：无（统计值来自 `fetchData()` 的接口返回）
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```js
data() {
  return {
    stats: {
      developingCount: 0,
      storedCount: 0,
    },
  }
},
processData(data) {
  this.stats.developingCount = data.developingCount || 0
  this.stats.storedCount = data.storedCount || 0
  ...
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```vue
<div class="stat-cards">
  <div class="stat-card">
    <div class="stat-label">开发中资源：</div>
    <div class="stat-value">{{ stats.developingCount }}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">已入库资源：</div>
    <div class="stat-value stored">{{ stats.storedCount }}</div>
  </div>
</div>
```

### 4）关键交互与业务规则（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```js
async fetchData() {
  this.loading = true
  try {
    const res = await this.$http.post(path.getResourceDataStats, params)
    if (res.errorCode === 200) {
      this.processData(res.data)
    }
  } finally {
    this.loading = false
  }
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

文件：`pages/resourceManagement/resourceReport.vue`

```js
// 该模块没有父子组件通信；数据来自页面内 API 调用（fetchData -> processData）。
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```scss
.stat-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;

  .stat-card {
    flex: 1;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color_bg_white;
    border-radius: 4px;
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
