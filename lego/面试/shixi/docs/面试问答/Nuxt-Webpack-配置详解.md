# Nuxt + Webpack 配置详解（big-customer，面向面试）

> 目标：按“能讲清楚设计取舍 + 能指到代码 + 能回答追问”的方式，总结本项目 Nuxt 与 Webpack（含 Babel/loader/splitChunks/SSR 兼容）配置。

## 1. 一句话概括（面试开场）

这是一个 **Nuxt 2（SSR 同构）** 项目，通过：

- `buildDir` 固定为 `nuxt-dist/` 以配合 CI/部署产物目录（`nuxt.config.js:45`）
- `build.publicPath` 按环境切到带版本号的 CDN 目录（`env.js:11`、`nuxt.config.js:133`）
- 在 `build.extend` 里做 SSR 兼容修复（`nuxt.config.js:168`），并通过 `transpile + babel plugins + splitChunks` 控制 UI 库/大依赖的打包方式（`nuxt.config.js:139`、`nuxt.config.js:164`、`nuxt.config.js:193`）

最终实现：**线上 SSR 服务只负责渲染/路由，静态资源由 CDN 承载**（publicPath 决定）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- Nuxt 主配置：`nuxt.config.js:1`
- CDN publicPath 生成：`env.js:1`
- 版本号（决定 CDN 路径）：`version.js:1`
- 插件（UI/HTTP/Vuex 持久化）：`plugins/antd-ui.js:1`、`plugins/element-ui.js:1`、`plugins/http.js:1`、`plugins/persistedstate.js:1`
- SSR 服务入口（Express + Nuxt）：`server/index.js:1`

## 3. 关键配置摘录（对应代码 + 面试高频追问点）

### A) 运行模式与运行时 env（为什么线上 env 看起来“写死”）

来源：`nuxt.config.js:9`

```js
module.exports = {
  mode: 'universal',
  env: {
    NODE_ENV: process.env.NODE_ENV,
    WEBSITE_HOST: process.env.NODE_ENV === 'production' ? 'http://f-sales.youdao.com/' : process.env.WEBSITE_HOST,
    PORT: process.env.NODE_ENV === 'production' ? 10310 : process.env.WEBSITE_PORT,
    API_HOST: process.env.NODE_ENV === 'production' ? 'https://fapi.youdao.com' : process.env.API_HOST,
  },
  server: {
    port: 10310,
    host: "0.0.0.0"
  },
  buildDir: 'nuxt-dist',
}
```

面试讲法：

- `mode: 'universal'` 代表 Nuxt 2 的 SSR 同构模式（服务端渲染 + 客户端 hydrate）。
- `env` 会注入到客户端 bundle（`process.env.*` 在浏览器端也可用），所以这里的 `API_HOST/WEBSITE_HOST` 实际会影响前端跳转/请求逻辑。
- 这里对 `production` 的 `WEBSITE_HOST/PORT/API_HOST` 做了**硬编码覆盖**：线上就算设置了 env，也可能不会生效（典型追问：为什么生产环境变量不走 pm2/k8s env）。
- `server.host = 0.0.0.0` 是容器化/内网部署常见配置，避免只监听 `localhost`。
- `buildDir: 'nuxt-dist'` 会把 Nuxt 的构建产物从默认 `.nuxt/` 改到 `nuxt-dist/`，这会影响 CI 归档、Docker 打包、线上运行目录。

### B) plugins/modules：项目启动前注入哪些能力（UI、HTTP、cookie、proxy）

来源：`nuxt.config.js:67`

```js
plugins: [
  '@/plugins/element-ui',
  '@/plugins/antd-ui',
  { src: '@/plugins/persistedstate' },
  '@/plugins/http',
  '@/plugins/validateForm',
  {
    src: '@/plugins/errorCodeHandler', mode: 'client',
    src: '@/plugins/checkPermission', mode: 'client'
  },
],

modules: [
  '@nuxtjs/axios',
  '@nuxtjs/proxy',
  'cookie-universal-nuxt',
],
```

面试讲法：

- `plugins/*` 是 Nuxt 的“启动期注入点”，用于把 UI 组件库、请求封装、Vuex 持久化等能力统一挂载到 Vue/Nuxt 上下文。
- `@nuxtjs/axios + proxy`：把请求能力做成 Nuxt module，配合 `proxy` 解决跨域/统一 baseURL 的诉求。
- `cookie-universal-nuxt`：在 SSR 场景中，服务端渲染也需要读写 cookie（用于登录态/持久化）。

坑点（面试加分项）：

- 上面 `plugins` 的最后一项对象里写了两个 `src`：在 JS 对象中**后者会覆盖前者**，导致 `errorCodeHandler` 实际不会被加载（只剩 `checkPermission`）。这是一个“配置写法坑”，面试时可以主动指出并给出修复方式：拆成两个对象。

### C) axios + proxy：请求怎么走、跨域怎么处理

来源：`nuxt.config.js:109`

```js
axios: {
  proxy: true
},
proxy: {
  '/qweather': {
    target: 'https://kt65nnb7q3.re.qweatherapi.com',
    pathRewrite: { '^/qweather': '' },
    changeOrigin: true
  }
},
```

面试讲法：

- 在开发环境或 SSR server 侧，通过 Nuxt proxy 把 `/qweather/*` 转发到第三方域名，从而规避浏览器跨域限制并统一请求入口。
- `pathRewrite` 去掉前缀，使得代码侧可以固定写 `/qweather/...`。

### D) publicPath：为什么必须配合“版本化 CDN”

来源：`env.js:6`、`nuxt.config.js:133`

```js
// env.js（节选）
const testEnv = {
  BUILD_PUBLIC_PATH: `https://shared.ydstatic.com/at/new-web/big-customer/test/${TEST_VERSION}/dist/client/`
}
const onlineEnv = {
  BUILD_PUBLIC_PATH: `https://shared.ydstatic.com/at/new-web/big-customer/online/${ONLINE_VERSION}/dist/client/`
}
```

```js
// nuxt.config.js（节选）
build: {
  publicPath: projectEnv.BUILD_PUBLIC_PATH,
  extractCSS: true,
}
```

面试讲法：

- `publicPath` 决定了浏览器加载 JS/CSS chunk 的基础 URL；一旦指向 CDN，就意味着“静态资源必须先上传到 CDN（或其源站 SVN），再发布 SSR 服务”。
- `extractCSS: true` 会把 CSS 抽离成独立文件，配合 CDN 能更好地缓存/复用。

### E) UI 库的 SSR 兼容：为什么需要 babel plugins + transpile

来源：`nuxt.config.js:139`

```js
build: {
  babel: {
    plugins: [
      ['import', { libraryName: 'ant-design-vue', libraryDirectory: 'lib', style: 'css' }, 'ant-design-vue'],
      ['component', { libraryName: 'element-ui', styleLibraryName: 'theme-chalk' }]
    ]
  },
  transpile: [/^element-ui/, /^ant-design-vue/],
}
```

面试讲法（能回答“为什么这么写”）：

- `transpile`：Nuxt SSR 默认会把 `node_modules` 当 externals 处理，很多包不会进服务端 bundle；当依赖包存在 ESM/构建差异时，可能导致 SSR runtime 报错。把 `element-ui / ant-design-vue` 加进 transpile，可强制走 Nuxt/Babel/webpack 编译链。
- `babel-plugin-import`（AntD）：按需引入 `lib` 目录（CJS）并自动引入 CSS，降低 bundle 体积，同时规避 SSR 下 ESM 解析问题。
- `babel-plugin-component`（Element）：按需引入组件并自动带上 `theme-chalk` 样式。

### F) sass/scss loader：为什么指定 node-sass

来源：`nuxt.config.js:152`

```js
loaders: {
  scss: { implementation: require('node-sass') },
  sass: {
    implementation: require('node-sass'),
    sassOptions: { indentedSyntax: true }
  }
},
```

面试讲法：

- 强制 `node-sass` 作为实现，保证 CI/运行时在特定 Node 版本（项目里是 Node14）下行为一致（虽然现代项目更推荐 `sass` / dart-sass）。
- `indentedSyntax: true` 支持 `.sass` 的缩进语法。

### G) extend：SSR externals 修复 + 客户端 moment locale 优化 + 代码分包

来源：`nuxt.config.js:168`

```js
extend(config, ctx) {
  if (ctx.isServer && Array.isArray(config.externals)) {
    config.externals = config.externals.map((external) => {
      if (typeof external !== 'function') return external
      return (context, request, callback) => {
        if (typeof request === 'string' && request.startsWith('nuxt_plugin_')) {
          return callback(null, false)
        }
        return external(context, request, callback)
      }
    })
  }

  if (ctx.isClient) {
    config.plugins = config.plugins || []
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/
      })
    )
  }

  const splitChunks = config.optimization && config.optimization.splitChunks
  const cacheGroups = splitChunks && splitChunks.cacheGroups
  if (cacheGroups) {
    cacheGroups.ui = {
      test: /[\\/]node_modules[\\/](ant-design-vue|element-ui)[\\/]/,
      name: 'ui',
      chunks: 'all',
      priority: 40
    }
    cacheGroups.charts = {
      test: /[\\/]node_modules[\\/]echarts[\\/]/,
      name: 'charts',
      chunks: 'all',
      priority: 30
    }
    cacheGroups.pdf = {
      test: /[\\/]node_modules[\\/](pdfjs-dist|vue-pdf-embed)[\\/]/,
      name: 'pdf',
      chunks: 'all',
      priority: 30
    }
  }
}
```

面试讲法：

- SSR externals 修复：`nuxt_plugin_*` 是 Nuxt 生成的“虚拟模块”，如果被当成 externals 排除，运行时会出现 `Cannot find module 'nuxt_plugin_xxx'`，这里显式把它们强制打进 server bundle。
- `IgnorePlugin`（仅 client）：去掉 `moment` 的 locale 动态引入，减少前端包体积。
- `splitChunks.cacheGroups`：把 UI、图表、PDF 相关大依赖拆成独立 chunk，提升首屏与缓存命中率（不同页面只加载需要的 chunk）。

### H) UI 插件注册：组件库怎么被引入到全局

来源：`plugins/antd-ui.js:1`、`plugins/element-ui.js:1`

```js
// plugins/antd-ui.js（节选）
import Vue from 'vue'
import { Button, Modal, message, notification } from 'ant-design-vue'
Vue.use(Button)
Vue.use(Modal)
Vue.prototype.$message = message
Vue.prototype.$notification = notification
```

```js
// plugins/element-ui.js（节选）
import Vue from 'vue'
import { Button, Dialog, Table } from 'element-ui'
import ElementLocale from 'element-ui/lib/locale'
import locale from 'element-ui/lib/locale/lang/zh-CN'
ElementLocale.use(locale)
Vue.use(Button)
Vue.use(Dialog)
Vue.use(Table)
```

面试讲法：

- 通过 Nuxt plugin 把 UI 组件“集中注册”，避免在页面里反复 import。
- 多 UI 库并存（AntD + Element）会带来体积与风格一致性压力，所以配合了上面的 splitChunks 与按需引入。

### I) HTTP 插件：SSR 下如何携带 cookie、如何设置 baseURL

来源：`plugins/http.js:5`

```js
export default function ({ $axios, redirect, req, route, store }, inject) {
  let cookie = ''
  if (process.server && req.headers.cookie) cookie = req.headers.cookie
  if (process.client) cookie = document.cookie

  const instance = $axios.create({ withCredentials: true, timeout: 30000 })
  instance.onResponse(response => {
    if (response.data.errorCode === 1003) {
      store.commit('SET_AUTH_USER', false)
      const isTranslatorPage = route.fullPath && route.fullPath.startsWith('/translator')
      if (!isTranslatorPage) redirect(`${path.loginUrl}=${process.env.WEBSITE_HOST}${route.fullPath}`)
    }
    return response.data
  })

  instance.setBaseURL(process.env.API_HOST)
  process.server ? instance.setHeader(cookie) : ''
  inject('http', { get: (...args) => instance.get(...args), post: (...args) => instance.post(...args) })
}
```

面试讲法：

- SSR 时服务端请求需要带上用户 cookie（否则后端会认为未登录），所以从 `req.headers.cookie` 读 cookie 并注入请求头。
- baseURL 来自 `process.env.API_HOST`（最终由 `nuxt.config.js:16` 控制），这就是“环境变量决定请求打到哪”的关键路径。

### J) Vuex 持久化：同构下如何做到“服务端/客户端状态一致”

来源：`plugins/persistedstate.js:5`

```js
createPersistedState({
  key: 'vuexnuxt',
  storage: {
    getItem: key => (process.client ? Cookies.getJSON(key) : cookie.parse(req.headers.cookie || '')[key]),
    setItem: (key, value) => {
      if (process.client) Cookies.set(key, value, { expires: 365 })
      else if (app.$cookies) app.$cookies.set(key, value, { maxAge: 60 * 60 * 24 * 365, path: '/' })
    }
  }
})(store)
```

面试讲法：

- 客户端用 `js-cookie`，服务端用 `cookie` 解析 `req.headers.cookie`，并用 `cookie-universal-nuxt` 的 `app.$cookies` 写回 cookie。
- 这是典型 SSR “同构状态”处理：避免出现“客户端有登录态、服务端没有”的闪烁。

## 4. 常见追问（Q&A 速记）

### Q1：为什么要改 `buildDir`？

为了让构建产物落在固定目录 `nuxt-dist/`，便于 CI 归档、Docker 打包和线上运行时定位（`nuxt.config.js:45`）。

### Q2：`publicPath` 改成 CDN 有什么副作用？

静态资源依赖外部可达路径；发布顺序必须保证 CDN 上已存在对应版本资源，否则会出现 chunk 404。优点是缓存命中与首屏资源分发更好（`env.js:11`、`nuxt.config.js:133`）。

### Q3：为什么 UI 库需要 `transpile`？

SSR 场景下 `node_modules` 很容易被 externals 排除或以不兼容方式加载；对 UI 库做 transpile 能让其进入 Nuxt 的编译链，避免运行时报 ESM/CJS 兼容问题（`nuxt.config.js:164`）。

### Q4：`nuxt_plugin_*` 这个修复解决了什么？

解决服务端运行时报 `Cannot find module 'nuxt_plugin_xxx'` 的问题：这些是 Nuxt 生成的虚拟模块，不能被 externals 排除（`nuxt.config.js:169-180`）。

### Q5：为什么要单独拆 `ui/charts/pdf` 三个 chunk？

这些都是体积大、复用高的依赖，把它们拆成稳定 chunk 后，页面切换只需要加载差异部分，且浏览器缓存更有效（`nuxt.config.js:196-213`）。

## 5. 配置坑点与改进建议（面试加分项）

1) `plugins` 最后一项对象里重复写 `src`，导致前者被覆盖：建议拆成两个对象（`nuxt.config.js:75-78`）。  
2) 生产环境 env 被硬编码覆盖：建议改为“只提供默认值”，由部署系统注入（`nuxt.config.js:14-16`）。  
3) `node-sass` 已较老：长期建议迁移到 `sass`（dart-sass），并确保 CI 镜像/Node 版本兼容（`nuxt.config.js:152-161`）。  
4) HTTP 插件里 `cookieParser` 引入未使用：建议移除或补齐用途（`plugins/http.js:3`）。  

