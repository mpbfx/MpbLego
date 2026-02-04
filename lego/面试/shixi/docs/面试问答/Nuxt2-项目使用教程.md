# Nuxt2 使用教程（big-customer，面向面试）

> 目标：把本项目里 Nuxt2 的“真实用法”整理成一份可复述教程：**怎么组织 pages/layouts/store/middleware/plugins，SSR 与 client-only 如何取舍，nuxt.config.js 里哪些配置是为了解决什么问题**。每个点都能指到代码（`file:line`）。

---

## 1. 项目整体形态：Nuxt2 SSR（universal）+ 自定义 Node 服务

### 1.1 Nuxt 运行模式

- Nuxt 模式：`nuxt.config.js:10`（`mode: 'universal'`）
- 构建目录：`nuxt.config.js:45`（`buildDir: 'nuxt-dist'`，和 CI/CD 上传产物联动）

### 1.2 自定义服务入口（Express 托管 Nuxt render）

项目不是 `nuxt start` 的默认 server，而是 `server/index.js` 里用 express 包一层：
- `server/index.js:1`

关键逻辑：
- dev 模式用 `Builder(nuxt).build()`（`server/index.js:18`）
- 生产模式 `nuxt.ready()`（`server/index.js:21`）
- `app.use(nuxt.render)` 把 Nuxt 渲染中间件挂上（`server/index.js:26`）

面试讲法：
“Nuxt 的 render 是一个 express middleware，因此可以把 Nuxt 作为 SSR 层嵌到已有 Node 服务里，方便后续加网关/鉴权/日志等。”

注意：当前文件里 `cookieParser()` 放在 `nuxt.render` 之后（`server/index.js:26`、`server/index.js:27`），所以 **Nuxt 渲染路径不会经过 cookieParser**（这会影响你在 runbook 里说的‘cookie 解析不生效’类问题）。

---

## 2. `nuxt.config.js`：你需要能讲清楚的“几块核心配置”

### 2.1 环境变量注入（`env`）

- `nuxt.config.js:11`

项目把 `API_HOST/WEBSITE_HOST/PORT` 注入到 Nuxt 的 `process.env`，并且在 production 分支做了硬编码兜底（`nuxt.config.js:14`～`nuxt.config.js:16`）。

面试讲法：
- 优点：SSR/CSR 都能拿到同一份 env（比如 `plugins/http.js` 里用 `process.env.API_HOST`）。
- 风险：production 硬编码会让多环境部署（灰度/预发）变难，需要结合 CI/CD 或 pm2 env 更规范地注入。

### 2.2 全局 CSS + UI 框架

- 全局 CSS：`nuxt.config.js:59`（AntD 与 Element 的 CSS 都全量引入）
- UI 插件：`nuxt.config.js:67`（`@/plugins/antd-ui`、`@/plugins/element-ui`）

### 2.3 modules：axios + proxy + cookie

- `nuxt.config.js:88`
  - `@nuxtjs/axios`：统一 HTTP 基础能力（但项目大多通过自封装的 `$http/$api` 用）
  - `@nuxtjs/proxy`：开发期代理（如 `/qweather`，见 `nuxt.config.js:114`）
  - `cookie-universal-nuxt`：让 SSR/CSR 都能读写 cookie（在 `plugins/persistedstate.js` 用到 `app.$cookies`）

### 2.4 build：为 SSR 兼容与性能做的定制

- `build.publicPath`：`nuxt.config.js:134`（与 CDN/version 发布策略相关）
- `babel-plugin-import`：`nuxt.config.js:139`
  - AntD 走 `libraryDirectory: 'lib'`（CJS）以避免 SSR 侧 require ESM 报错（`nuxt.config.js:136`～`nuxt.config.js:145`）
- `transpile`：`nuxt.config.js:164`（SSR bundle 允许打入 ant-design-vue/element-ui）
- `extend`：
  - 解决 `nuxt_plugin_xxx` 在 server build 被 externals 掉导致运行时报错（`nuxt.config.js:169`～`nuxt.config.js:179`）
  - splitChunks 做 `ui/charts/pdf` 分包（`nuxt.config.js:195`～`nuxt.config.js:214`）

面试讲法：
“这些配置本质上都在解决 Nuxt SSR 的两个经典问题：**依赖形态（ESM/CJS/externals）**与**大体积依赖的分包策略**。”

---

## 3. `pages/` 路由体系：文件即路由 + 动态路由

### 3.1 文件即路由（你负责模块入口）

- 订单列表：`pages/orderManagement/orderList.vue:1` → `/orderManagement/orderList`
- 订单详情：`pages/orderManagement/orderDetail.vue:1` → `/orderManagement/orderDetail`（通过 query `?id=`）
- 资源开发列表：`pages/resourceManagement/interpreterAndSuppliers.vue:1`
- 资源在场列表：`pages/resourceManagement/onSite.vue:1`
- 资源详情（动态路由）：`pages/resourceManagement/resourceDetail/_id.vue:1` → `/resourceManagement/resourceDetail/:id`
- 译员平台首页：`pages/translator/index.vue:1` → `/translator`（并使用自定义 layout）

### 3.2 动态路由 `_id.vue`

资源详情通过 `params.id` 判断新建/编辑：
- `pages/resourceManagement/resourceDetail/_id.vue:1578`

面试讲法：
“Nuxt2 动态路由用下划线文件名。这个页面把 `id === 'new'` 作为新建态，返回空数据结构；编辑态走并行请求提升首屏。”

---

## 4. `asyncData`：SSR 预取数据（你项目里最常用的 Nuxt 特性）

### 4.1 `asyncData` 的特点（必须会背）

- 在组件实例创建之前执行，因此 **不能用 `this`**
- SSR 与 CSR（路由切换）都会跑
- 返回对象会 merge 到组件 data

### 4.2 订单列表：用 query 回放页面状态

- `pages/orderManagement/orderList.vue:863`

典型逻辑：
- 从 `query` 解析筛选条件 → 拼接 payload → 首次就能渲染“带筛选的列表”（支持从外部直达）

### 4.3 订单详情：并发拉取（Promise.all）

- `pages/orderManagement/orderDetail.vue:257`

典型逻辑：
- `Promise.all` 并发拉取订单/客户/生产/操作记录/收益等，降低 SSR 首屏等待。

### 4.4 资源详情：并发拉取 + 容错（Promise.allSettled）

- `pages/resourceManagement/resourceDetail/_id.vue:1654`

典型逻辑：
- `allSettled` 允许“非关键接口失败不阻塞页面”（基础信息是必需的，所以单独严格校验）。

---

## 5. `layouts/`：多子系统的布局隔离（译员平台是独立 layout）

### 5.1 页面指定 layout

译员平台首页声明：
- `pages/translator/index.vue:230`（`layout: 'translator'`）

### 5.2 translator layout 做了什么

- `layouts/translator.vue:1`

核心点（面试讲法）：
- layout 作为“壳”，决定：顶部导航、登录/退出、权限提示、以及 `<nuxt />` 渲染出口
- 同时它在 `mounted` 给 `body` 加主题 class（用于样式覆盖），并在 `beforeDestroy` 移除（`layouts/translator.vue:48`、`layouts/translator.vue:59`）

---

## 6. `middleware/`：路由级别的权限与登录控制

### 6.1 middleware 的运行时机

Nuxt middleware 可以在服务端渲染与客户端路由切换时运行，用来做：
- 鉴权
- 重定向
- 访问控制

### 6.2 项目里的 checkPermission middleware

- `middleware/checkPermission.js:4`

关键点：
- `/translator` 路由直接放行（译员平台不走大客户权限体系）：`middleware/checkPermission.js:9`
- 其他路由按 label 检查，失败 redirect 到 `/`：`middleware/checkPermission.js:27`

---

## 7. `store/`：Vuex + `nuxtServerInit`（SSR 首屏把用户态注入）

### 7.1 nuxtServerInit 的价值

在 SSR 首次请求时，Nuxt 会调用 `store/index.js` 的 `nuxtServerInit`：
- `store/index.js:10`

项目用它来：
- 拉取用户信息（大客户系统/译员平台分支逻辑）
- 写入 userinfo module、auth 状态
- 拉汇率等全局配置（大客户系统）

译员平台的特殊处理（退出标记）：
- 如果请求 cookie 含 `logged_out=1`，则直接认为未登录：`store/index.js:22`

面试讲法：
“nuxtServerInit 是 SSR ‘首屏带用户态’的关键，否则页面会先渲染未登录，再在客户端补齐导致闪烁。”

---

## 8. `plugins/`：注入 `$http/$api`、UI 组件、持久化

### 8.1 `$http` 注入（你项目的主 HTTP 通道）

- `plugins/http.js:5`（`inject('http', http)`）
- SSR 侧 cookie 转发：`plugins/http.js:8`～`plugins/http.js:14`、`plugins/http.js:58`
- 登录失效（errorCode 1003）重定向（并对 `/translator` 放行）：`plugins/http.js:34`～`plugins/http.js:40`

### 8.2 `$api` 注入（axios 另一套封装）

- `plugins/axios.js:65`（`inject('api', api)`）

### 8.3 vuex 持久化（SSR/CSR 都能读写 cookie）

- `plugins/persistedstate.js:5`

关键点：
- client：用 js-cookie 读写
- server：用 `cookie-universal-nuxt` 提供的 `app.$cookies` 写入（`plugins/persistedstate.js:16`）

---

## 9. SSR 兼容：什么时候用 `<client-only>` / `process.client`

你项目里典型的 SSR 兼容写法有两类：

1) `<client-only>` 包第三方组件（PDF/复杂 UI）：
- `components/PdfPreviewModal.vue:28`

2) 代码里 guard：`if (process.client) { ... }`（访问 window/document/ResizeObserver 等）：
- `pages/translator/resumePreview.vue:140`

面试讲法：
“SSR 下没有 window/document；要么用 client-only 延迟渲染，要么用 process.client 做运行时分支。”

