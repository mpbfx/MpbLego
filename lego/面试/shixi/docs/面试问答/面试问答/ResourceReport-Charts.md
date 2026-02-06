# Charts 前端面试问答

## 前端面试官：你是如何实现 Charts 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：图表区写在 `pages/resourceManagement/resourceReport.vue` 页面内；每个图表用一个 `ref` 容器承载 ECharts 实例，所有实例集中存放在 `this.charts[refName]`，便于统一 `resize/dispose`。
- **模板（HTML/组件）结构**：页面上用多块 `.chart-card`（部分 `full-width`，部分在 `.charts-row` 内两列）组织图表；每个图表容器是 `<div ref="xxxChart" class="chart-container" />`。
- **响应式数据与单向数据流**：接口返回后 `processData(data)` 统一生成 `chartConfigs`，先存入 `pendingChartConfigs`，再通过 `IntersectionObserver` 在进入视口时调用 `renderChart()` 渲染；已渲染的图表仅 `setOption()` 更新数据，不重复 init。
- **表单校验实现（JS）**：无。
- **输入约束与联动**：
  - 数据顺序：大部分图表用配置表（如 `resourceStatusList/developmentChannelList/...`）生成固定顺序的 `*_ORDER`，确保柱状图顺序稳定（并显式加上 “空”）。
  - 展示格式：`transformStats()` 统一计算 `value` 与 `percent`（可选），并把 “空/空值” 归一化且移动到最后。
  - 点击联动：点击某个柱子会进入 `handleChartClick()`，根据图表类型构建 query 并跳转到资源相关列表页（部分图表如质量/配合/时效评分不跳转）。
- **异步搜索下拉（Vue 事件 + 父子通信）**：无（图表为纯展示 + 点击跳转）。
- **权限/状态驱动 UI（如有）**：点击跳转前会用 `checkPermission(label)` 结合 `permissionTable` 和当前 `roleType` 校验权限，没权限直接 return（避免无权限路由跳转）。
- **性能与体验细节（如有）**：
  - ECharts 懒加载：`ensureEcharts()` 用动态 import 按需加载 `echarts/lib/*`，避免一次性引入大包。
  - 渲染懒加载：`IntersectionObserver` + `rootMargin: '400px'` 提前加载，且用 `requestAnimationFrame` 分散渲染压力。
  - 自适应：`window.resize` + `ResizeObserver`（侧边栏展开/收起）触发 `resize()`，并用 `lodash.debounce` 降噪。
  - 点击体验：既绑定 ECharts `on('click')`，也绑定容器 click 并用 `containPixel('grid')` 限制只在 grid 区域生效，减少误触。
- **CSS/布局**：
  - `.chart-container` 统一高度 `260px`，宽度 100%，并提供 hover 背景提示 + `cursor: pointer`。
  - `.charts-row` 用 flex 两列布局，`min-width: 0` 防止收缩溢出。
  - 卡片标题 `.chart-header` 与其他区域复用同一套字体/分割线规范。
- **可扩展性与复用**：新增图表的改动点集中且可预期：模板新增一个 `ref` 容器 → `getRefNameByDom()` 的 ref 列表加一项 → `processData()` 的 `chartConfigs` 加配置 → `handleChartClick()`（如需跳转）新增 case。

（在此填写追问补充句，保持此段落位置不变）

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

```text
页面（如有）：pages/resourceManagement/resourceReport.vue
组件：pages/resourceManagement/resourceReport.vue（页面内模块：Charts）
相关：echarts（动态 import），lodash.debounce，~/config/resourceDetailConfig，~/config/permission，~/config/languageOption
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```js
data() {
  return {
    charts: {},                         // refName -> echarts instance
    pendingChartConfigs: {},            // refName -> {ref,data,order,showPercent,isLanguage}
    chartObserver: null,                // IntersectionObserver
    initializedCharts: new Set(),       // 已 init 的 refName
    echarts: null,
    echartsPromise: null,
    containerResizeObserver: null,      // ResizeObserver
  }
},
beforeDestroy() {
  if (this.chartObserver) this.chartObserver.disconnect()
  if (this.containerResizeObserver) this.containerResizeObserver.disconnect()
  Object.values(this.charts).forEach((chart) => chart && chart.dispose())
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```vue
<!-- 全宽卡片 -->
<div class="chart-card full-width">
  <div class="chart-header">资源状态</div>
  <div ref="statusChart" class="chart-container"></div>
</div>

<!-- 两列排列 -->
<div class="charts-row">
  <div class="chart-card">
    <div class="chart-header">译员级别</div>
    <div ref="levelChart" class="chart-container"></div>
  </div>
  <div class="chart-card">
    <div class="chart-header">质量平均分</div>
    <div ref="qualityChart" class="chart-container"></div>
  </div>
</div>
```

### 4）关键交互与业务规则（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```js
async ensureEcharts() {
  if (this.echarts) return this.echarts
  if (this.echartsPromise) return this.echartsPromise
  this.echartsPromise = Promise.all([
    import('echarts/lib/echarts'),
    import('echarts/lib/chart/bar'),
    import('echarts/lib/component/grid'),
    import('echarts/lib/component/tooltip'),
    import('echarts/lib/component/axisPointer'),
  ]).then(([echarts]) => {
    this.echarts = echarts && echarts.default ? echarts.default : echarts
    return this.echarts
  })
  return this.echartsPromise
},

processData(data) {
  const chartConfigs = [
    { ref: 'statusChart', data: data.developingStatusStats, order: STATUS_ORDER, showPercent: true },
    { ref: 'channelChart', data: data.developmentChannelStats, order: CHANNEL_ORDER, showPercent: true },
    ...
  ]

  this.$nextTick(() => {
    chartConfigs.forEach((config) => {
      this.pendingChartConfigs[config.ref] = config
      const chartDom = this.$refs[config.ref]
      if (!chartDom) return

      if (this.initializedCharts.has(config.ref) && this.charts[config.ref]) {
        const chartData = this.transformStats(config.data, config.order, config.showPercent, ...)
        this.charts[config.ref].setOption(this.getChartOption(chartData, config.showPercent, config.ref))
      } else {
        this.chartObserver.observe(chartDom)
      }
    })
  })
},

initChartObserver() {
  this.chartObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const chartDom = entry.target
      const refName = this.getRefNameByDom(chartDom)
      if (!refName || this.initializedCharts.has(refName)) return

      this.initializedCharts.add(refName)
      const config = this.pendingChartConfigs[refName]
      if (config) {
        requestAnimationFrame(() => {
          this.renderChart(config.ref, config.data, config.order, config.showPercent, ...)
        })
      }
      this.chartObserver.unobserve(chartDom)
    })
  }, { root: null, rootMargin: '400px', threshold: 0.1 })
},

async renderChart(refName, statsObj, orderList, showPercent, nameFormatter) {
  const chartDom = this.$refs[refName]
  if (!chartDom) return

  const echarts = await this.ensureEcharts()
  if (!this.charts[refName]) {
    this.charts[refName] = echarts.init(chartDom)
    this.charts[refName].on('click', (params) => {
      this.handleChartClick(refName, params.dataIndex, this.transformStats(statsObj, orderList, showPercent, nameFormatter))
    })
  }

  const chartData = this.transformStats(statsObj, orderList, showPercent, nameFormatter)
  this.charts[refName].setOption(this.getChartOption(chartData, showPercent, refName))
},

transformStats(statsObj, orderList, showPercent, nameFormatter) {
  const entries = Object.entries(statsObj || {})
  const total = entries.reduce((sum, [, val]) => sum + val, 0)
  ...
},

handleChartClick(chartType, dataIndex, data) {
  const item = data[dataIndex]
  if (!item || item.value === 0) return

  const query = {}
  let targetPath = '/resourceManagement/interpreterAndSuppliers'
  let permissionLabel = 'resourcemanagement-developmentPage'

  switch (chartType) {
    case 'statusChart':
      query.resourceStatus = statusReverseMap[item.name] || ''
      break
    case 'levelChart':
      targetPath = '/resourceManagement/onSite'
      permissionLabel = 'resourcemanagement-searchResource'
      query.translatorLevel = item.name === '空' ? '' : item.name
      break
    case 'qualityChart':
    case 'cooperationChart':
    case 'timelinessChart':
      return
    ...
  }

  if (!this.checkPermission(permissionLabel)) return
  this.$router.push({ path: targetPath, query })
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

文件：`pages/resourceManagement/resourceReport.vue`

```js
// 该模块没有子组件；“局部刷新”体现为：接口返回后对已初始化图表直接 setOption 更新数据。
if (this.initializedCharts.has(refName) && this.charts[refName]) {
  this.charts[refName].setOption(this.getChartOption(chartData, showPercent, refName))
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`pages/resourceManagement/resourceReport.vue`

```scss
.chart-card {
  background: $color_bg_white;
  margin-bottom: 16px;

  .chart-header {
    padding: 12px 16px;
    border-bottom: 1px solid $color_divider_1;
  }

  .chart-container {
    width: 100%;
    height: 260px;
    padding: 8px;
    cursor: pointer;
  }
}

.charts-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;

  .chart-card {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
  }
}
```
