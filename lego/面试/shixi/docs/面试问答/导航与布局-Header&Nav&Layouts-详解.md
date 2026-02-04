# 导航与布局：Header / Nav / Layouts 详解（big-customer，面向面试）

> 目标：把项目里“为什么会有多套导航/布局（大客户系统 vs 译员平台）、导航高亮如何保持、布局折叠状态如何跨页面保存”的实现讲清楚，并能指到关键代码（`file:line`）。

## 1. 一句话概括（面试开场）

这个项目有两套“产品形态”：

- **大客户系统**：使用 `layouts/default.vue` 的侧边栏布局（Ant Design Vue `Layout + Menu`），左侧 `components/Nav/Nav.vue` 负责路由跳转与菜单高亮，折叠状态存 Vuex（`store/userinterface.js:2`）。  
- **译员平台**：使用 `layouts/translator.vue` 的顶部 Tab 导航 + 权限占位渲染（未登录空白、无权限提示、有权限才渲染 `<nuxt />`），并通过 `logged_out` cookie 解决“退出后 SSR 又自动登录”的问题（`layouts/translator.vue:167`、`store/index.js:26`）。

同时还保留了一套历史的 Element UI 顶部菜单 `components/Header/Header.vue`，目前在 layout 里有 import 但未实际渲染，属于“演进后遗留”（`layouts/default.vue:36`、`components/Header/Header.vue:1`）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- 大客户系统默认布局：`layouts/default.vue:1`
- 译员平台布局：`layouts/translator.vue:1`
- 空布局（错误页等）：`layouts/empty.vue:2`、`pages/error/index.vue:7`
- 左侧导航（AntD Menu）：`components/Nav/Nav.vue:1`
- 历史 Header（Element Menu，现未使用）：`components/Header/Header.vue:1`
- 布局折叠状态（Vuex）：`store/userinterface.js:2`、`layouts/default.vue:47`
- 译员平台登录弹窗：`components/LoginDialog/login.vue:72`

## 3. 大客户系统（default layout）：侧边栏 + 固定内容区

### 3.1 Layout 结构：Sider 固定，内容区用 marginLeft 配合折叠宽度

来源：`layouts/default.vue:6`

核心结构是 AntD 的 `a-layout-sider` + `<Nav :collapsed="collapsed" />`，内容区通过 `marginLeft` 根据折叠状态做 40/200 的切换：

```vue
<a-layout-sider :width="200" :collapsedWidth="40" v-model="collapsed" collapsible>
  <Nav :collapsed="collapsed" />
</a-layout-sider>
<a-layout :style="{ marginLeft: collapsed ? '40px' : '200px' }">
  <nuxt />
</a-layout>
```

### 3.2 折叠状态为什么放 Vuex：跨页面保持一致 + 可持久化

来源：`layouts/default.vue:47`、`store/userinterface.js:2`

`collapsed` 不是组件本地 state，而是绑定到 Vuex：

```js
collapsed: {
  get() {
    return this.$store.state.userinterface.layoutCollapsed
  },
  set(val) {
    this.$store.commit('userinterface/UPDATE_LAYOUT', { layoutCollapsed: val })
  }
}
```

面试讲法：

- 侧边栏是全局布局的一部分，放 Vuex 能保证“换页不抖动、不丢状态”。
- 持久化由 `plugins/persistedstate.js` 写 cookie 实现（对应文档：`docs/面试问答/Vuex-Store-状态管理-详解.md:1`）。

## 4. 左侧导航（Nav.vue）：路由跳转 + 菜单高亮策略

### 4.1 菜单 key 与真实路由不一致：用 routeMap 做“归一化高亮”

来源：`components/Nav/Nav.vue:49`

项目里同一业务可能有“列表/详情/预览/历史订单”等多个路由，但菜单只希望高亮某一个入口，所以用 `routeMap` 把路由归一到菜单 key：

- 例如把 `/resourceManagement/resourceDetail/...` 的详情页也高亮到“资源开发管理 / 资源在场管理”（按 from 参数决定）。

### 4.2 点击时拼接子菜单路径：`keyPath.reverse().join('')`

来源：`components/Nav/Nav.vue:100`

AntD Menu 的 `click` 回调给的是 `e.key` 和 `e.keyPath`；项目对“子菜单项”用 `keyPath` 拼完整路径：

```js
handleClick(e) {
  this.selectedKeys = e.key
  let route = e.key
  if (e.keyPath.includes('/resourceManagement') || e.keyPath.includes('/workloadAccount')) {
    route = e.keyPath.reverse().join('')
  }
  this.turnToPage(route)
}
```

面试讲法：

- 这种写法的好处是模板里 key 很短（`/onSite`、`/resourceReport`），但最终导航仍能跳到完整路径（`/resourceManagement/onSite` 等）。
- 风险是强依赖 keyPath 结构；如果菜单层级变更，拼接逻辑要同步调整。

### 4.3 折叠时收起 openKeys：记忆展开状态（UX 细节）

来源：`components/Nav/Nav.vue:84`

折叠时把 `openKeys` 清空，展开时恢复缓存的 `cachedOpenKeys`，避免折叠状态下出现“展开的子菜单还占空间”的视觉问题。

## 5. 译员平台（translator layout）：顶部 Tab + 三态渲染

### 5.1 页面显式指定 layout：`layout: 'translator'`

来源：`pages/translator/index.vue:230`

译员平台下的页面都在 page 里指定 `layout: 'translator'`，与大客户系统的默认 layout 解耦。

### 5.2 三态渲染：未登录空白 / 无权限提示 / 有权限渲染业务页

来源：`layouts/translator.vue:8`

译员平台 layout 在内容区做了强约束：

- `!isLoggedIn`：不渲染内容（避免 SSR/CSR 状态切换时出现“瞬间能看到内容”）。  
- `isLoggedIn && !isValid`：显示“请开通权限”提示。  
- `isLoggedIn && isValid`：渲染 `<nuxt />`。

权限字段来自 `store/userinfo.isValid`，由 `nuxtServerInit` 初始化（`store/index.js:14`）。

### 5.3 退出标记：`logged_out=1` 防止 SSR 自动回填登录态

来源：`layouts/translator.vue:152`、`store/index.js:26`

译员平台的“退出”不仅清空 Vuex cookie，还会写一个短期 cookie `logged_out=1`，服务端初始化阶段如果检测到该标记会直接认为未登录：

- 退出：`layouts/translator.vue:167`
- SSR 初始化判断：`store/index.js:26`

这是典型的“SSR 登录态回放”问题的工程兜底。

## 6. 历史 Header（Element UI）：为什么还在仓库里

来源：`components/Header/Header.vue:1`、`layouts/default.vue:36`

项目里还保留了一套 Element UI 横向菜单 Header，但当前 `layouts/default.vue` 并未渲染 `<Header />`（只是在 `components` 注册），更像是演进过程中的遗留实现。面试时可以直接说清楚：

- 现在主导航是 AntD 的侧边栏 `Nav.vue`；
- Header 是旧版（或部分页面曾经用过），后续可以删掉 import 或彻底移除以降低认知负担。

## 7. 面试题库（Q&A 速记）

### Q1：为什么要给译员平台单独做一个 layout？

因为它的导航形态、登录/权限策略、以及 UI 主题（`translator-theme`）都与大客户系统完全不同；单独 layout 能把差异收敛在一个地方，页面只负责业务本身（`layouts/translator.vue:92`）。

### Q2：菜单高亮为什么要做 `routeMap` 和 “from 参数” 特判？

因为详情页是从多个入口进入的：开发池/在场池/简历预览/历史订单等。用 `routeMap + query.from` 可以把“用户来自哪里”映射回正确的菜单高亮，避免用户迷路（`components/Nav/Nav.vue:110`）。

### Q3：折叠状态为什么放 Vuex，不放组件 local state？

侧边栏是全局布局的一部分；放 Vuex 可以跨页面保持一致，并可配合持久化（cookie）实现刷新后恢复，体验更稳定（`layouts/default.vue:49`、`store/userinterface.js:2`）。

