# HTTP 封装与错误处理详解（big-customer，面向面试）

> 目标：把项目里 HTTP 请求是如何“在 SSR/CSR 都能用、能携带 cookie、能统一处理错误码、能兼容多种 Content-Type”的实现讲清楚，并配关键代码摘录。

## 1. 一句话概括（面试开场）

本项目基于 `@nuxtjs/axios`，在 Nuxt plugin 里创建 axios 实例并注入：

- 主要是 `$http`（`plugins/http.js:5`）：封装 `get/post`，支持 `query/json/formData` 三种提交格式，统一处理 `errorCode`（如 `1003` 未登录跳转、`2005` 资源不存在）并在 SSR 时尝试透传 cookie。
- 另有一套 `$api`（`plugins/axios.js:3`）：更轻量，只做 `1003` 跳转与 baseURL/cookie 设置，属于“历史/并存实现”。

对应代码摘录（注入点）：

```js
// plugins/http.js:90
inject('http', http) // -> this.$http / app.$http
```

```js
// plugins/axios.js:60
inject('api', api) // -> this.$api / app.$api
```

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- Nuxt axios/module 配置：`nuxt.config.js:88`、`nuxt.config.js:109`
- 主要 HTTP 封装（注入 `$http`）：`plugins/http.js:1`
- 另一套 axios 封装（注入 `$api`）：`plugins/axios.js:1`
- 后端接口路径枚举：`config/path.js:1`
- 错误码文案：`config/errorCodeMsg.js:1`
- 登录态/未登录兜底跳转（与 HTTP 相关）：`store/index.js:14`、`docs/面试问答/权限鉴权-实现详解.md:1`

## 3. 关键配置摘录（Nuxt 层：axios + proxy）

来源：`nuxt.config.js:88`

```js
modules: [
  '@nuxtjs/axios',
  '@nuxtjs/proxy',
  'cookie-universal-nuxt',
],

axios: {
  proxy: true,
},

proxy: {
  '/qweather': {
    target: 'https://kt65nnb7q3.re.qweatherapi.com',
    pathRewrite: { '^/qweather': '' },
    changeOrigin: true
  }
}
```

面试讲法：

- `@nuxtjs/axios` 提供 `$axios` 注入点；我们再基于 `$axios.create()` 创建业务实例（`$http/$api`）。
- `proxy` 规则用于把第三方接口统一挂到本域路径下（解决跨域、隐藏真实域名、统一请求入口）。

## 4. 关键代码摘录（业务层：$http 封装）

### A) SSR/CSR cookie 获取：为什么要做“同构透传”

来源：`plugins/http.js:5`

```js
let cookie = ''
if (process.server) {
  if (req.headers.cookie) cookie = req.headers.cookie
} else {
  cookie = document.cookie
}
```

面试讲法：

- SSR 渲染时，服务端请求如果不带浏览器 cookie，后端会认为“未登录”，导致首屏就 1003。
- CSR 下 cookie 由浏览器自动带，但某些跨域/域名策略仍可能要求 `withCredentials`。

### B) axios 实例创建：withCredentials + timeout

来源：`plugins/http.js:19`

```js
const instance = $axios.create({
  headers: {
    common: { Accept: 'text/plain, */*' },
  },
  withCredentials: true,
  timeout: 30000,
})
```

面试讲法：

- `withCredentials: true` 让浏览器在跨域请求时也携带 cookie（前提是后端 CORS 允许）。
- `timeout` 统一配置，避免请求“悬挂”。

### C) 统一响应处理：errorCode -> 业务动作（跳登录/置状态）

来源：`plugins/http.js:28`

```js
instance.onResponse(response => {
  if (response.data.errorCode === 2005) {
    // 资源未找到（当前逻辑留空/注释）
  }
  if (response.data.errorCode === 1003) {
    store.commit('SET_AUTH_USER', false)
    const isTranslatorPage = route.fullPath && route.fullPath.startsWith('/translator')
    if (!isTranslatorPage) {
      redirect(`${path.loginUrl}=${process.env.WEBSITE_HOST}${route.fullPath}`)
    }
  }
  return response.data
})
```

面试讲法：

- 项目把后端返回的 `errorCode` 当成统一协议层字段；`onResponse` 里做集中处理，页面侧只关心业务数据。
- `1003` 既影响路由跳转，也会把 `authUser` 置为 `false`，与全局登录态联动。
- “译员平台”允许未登录访问某些页面，所以做了 `/translator` 特判。

### D) baseURL 设置：请求到底发到哪

来源：`plugins/http.js:57`

```js
instance.setBaseURL(process.env.API_HOST)
```

面试讲法：

- `API_HOST` 由 Nuxt 的 `env` 注入（见 `nuxt.config.js:16`），不同环境（dev/test/prod）会指向不同后端。

### E) post 支持多种数据格式：query/json/formData

来源：`plugins/http.js:67`

```js
post: (url, data, type) => {
  if (type === 'query') {
    return instance({
      method: 'post',
      url,
      data: qs.stringify(data),
      headers: { post: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' } }
    })
  }
  if (type === 'json') {
    return instance({ method: 'post', url, data })
  }
  if (type === 'formData') {
    return instance({
      method: 'post',
      url,
      data,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
  return instance({ method: 'post', url, data })
}
```

面试讲法：

- `query`：适配老接口（`application/x-www-form-urlencoded`）。
- `json`：标准 JSON body。
- `formData`：文件上传或复杂表单。

### F) 注入方式：页面里怎么用

来源：`plugins/http.js:5`

```js
inject('http', http)
```

面试讲法：

- 在组件/页面中可通过 `this.$http.get/post` 或在 `asyncData/context` 里通过 `app.$http` 使用。

## 5. $api（plugins/axios.js）：为什么项目里有两套封装

来源：`plugins/axios.js:3`

```js
const api = $axios.create({ withCredentials: true })
api.onResponse(response => {
  if (response.data.errorCode === 1003) {
    redirect(`${path.loginUrl}=${process.env.WEBSITE_HOST}${route.fullPath}`)
  }
})
api.setBaseURL(process.env.API_HOST)
process.server ? api.setHeader(cookie) : ''
inject('api', api)
```

面试讲法（建议说清“现状 + 取舍”）：

- `$api` 更像“原始 axios 实例”，只处理 1003 跳转；
- `$http` 封装更完整（post 格式、错误处理、store 联动）；
- 工程上建议收敛为一套，避免同一错误码在两处维护。

## 6. 错误码体系（如何回答“你们怎么做统一错误处理”）

来源：`config/errorCodeMsg.js:1`

```js
const errorCodeMsg = {
  1000: '服务暂时不可用',
  2005: '请求的资源未找到',
  2011: '接口没有权限',
}
```

面试讲法：

- 错误码文案集中维护，UI 层可统一 toast / modal；
- 但“跳转/登出”这类副作用应在请求层集中处理（本项目的 1003 就是）。

## 7. 坑点与改进建议（面试加分项）

1) SSR cookie 透传：`instance.setHeader(cookie)` 的调用方式可疑，通常需要显式设置 header 名（例如 `setHeader('cookie', cookie)`）；如果 SSR 请求没带 cookie，会导致首屏频繁 1003（`plugins/http.js:58`、`plugins/axios.js:62`）。  
2) `plugins/http.js` 引入了 `cookie-parser` 但未使用（`plugins/http.js:3`），建议移除。  
3) `$api` 与 `$http` 并存会导致调用方混乱与策略不一致，建议统一并补充单元测试/契约测试。  
4) `onResponse` 里直接 `return response.data` 会改变 axios 返回值形态：调用方拿不到 headers/status；这是取舍（更方便，但失去低层信息）。  
5) 目前 `2005` 的处理是注释状态（`plugins/http.js:29-33`），建议落地统一的“404 页面/提示策略”。

## 8. 面试题库（Q&A 速记）

### Q1：SSR 项目里，为什么 HTTP 层一定要处理 cookie？

因为 SSR 的请求发生在 Node 端，浏览器不会自动带 cookie；如果不从 `req.headers.cookie` 取出并透传到后端，后端会把请求视为未登录，导致首屏渲染错误或重定向。

### Q2：你们如何处理“未登录”？

后端用 `errorCode === 1003` 表示未登录/授权失败；请求层集中处理：置 `authUser=false` 并跳转登录（`plugins/http.js:34-41`）。

### Q3：为什么 post 要支持三种格式？

因为后端接口历史不一致：部分接口要 `x-www-form-urlencoded`，部分要 JSON，上传类要 multipart；封装后页面只要传 `type` 即可（`plugins/http.js:67-96`）。
