# 服务端入口：server/index.js 详解（big-customer，面向面试）

> 目标：把本项目 Nuxt2 的“生产启动方式（Express 托管 Nuxt SSR）/ dev 构建方式 / 端口与 host 从哪里来 / 为什么没有自建 API”讲清楚，并配关键代码指路（`file:line`）。

## 1. 一句话概括（面试开场）

这个项目的生产形态是：**用 Express 启一个 Node 进程，把 Nuxt 作为中间件挂上去做 SSR 渲染**；开发模式下额外调用 `new Builder(nuxt).build()` 触发 Nuxt 编译（`server/index.js:19`）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- Express + Nuxt 入口：`server/index.js:1`
- Nuxt 配置（server/port、buildDir、plugins 等）：`nuxt.config.js:1`
- 生产/测试 CDN publicPath 生成：`env.js:5`、`version.js:1`

## 3. 启动流程拆解（server/index.js）

### 3.1 初始化 Nuxt：读取 nuxt.config.js，并根据 NODE_ENV 决定 dev

来源：`server/index.js:8`

```js
const config = require('../nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'
const nuxt = new Nuxt(config)
```

面试讲法：

- `config.dev` 会影响 Nuxt 是否走热更新/编译链路；
- 这也是为什么 “dev 模式要 build，prod 模式 ready 即可”。

### 3.2 dev 模式 build，prod 模式 ready

来源：`server/index.js:19`

```js
if (config.dev) {
  const builder = new Builder(nuxt)
  await builder.build()
} else {
  await nuxt.ready()
}
```

### 3.3 host / port 从哪里来：从 Nuxt options.server 读取

来源：`server/index.js:15`、`nuxt.config.js:41`

`server/index.js` 并不直接读 `process.env.PORT`，而是：

```js
const { host, port } = nuxt.options.server
app.listen(port, host)
```

因此实际监听地址主要由 `nuxt.config.js` 的 `server` 字段决定（当前写死为 `0.0.0.0:10310`）。

### 3.4 Nuxt 渲染中间件挂载（以及一个小坑）

来源：`server/index.js:26`

当前顺序是：

```js
app.use(nuxt.render)
app.use(cookieParser())
```

这意味着如果未来你想在 Express 里加自定义 API，并希望在这些 API 里通过 `req.cookies` 拿 cookie，需要把 `cookieParser()` 放到相关路由/中间件之前；否则 cookie 解析不会生效。

另外，目前项目没有自建 API 路由，基本把所有业务请求都交给 Nuxt（前端）通过 `$http` 去打后端（`plugins/http.js:57`）。

## 4. buildDir / publicPath：线上如何做到静态资源走 CDN

来源：`nuxt.config.js:45`、`nuxt.config.js:125`、`env.js:5`

关键点：

- `buildDir: 'nuxt-dist'`：把 Nuxt 构建产物放到 `nuxt-dist/`（不是默认的 `.nuxt/`）。
- `build.publicPath`：通过 `env.js` + `version.js` 组合出来，在 test/prod 环境把 `/_nuxt/` 指到对应 CDN 版本目录。

面试讲法：

“SSR 仍在 Node 上跑，但静态资源（JS/CSS chunk）走 CDN，能显著降低源站压力，也便于灰度/回滚。”

## 5. 面试题库（Q&A 速记）

### Q1：为什么不用 `nuxt start`，而是自建一个 Express 入口？

因为 Express 入口更可控：可以统一接入日志、增加自定义 serverMiddleware、做健康检查、或在未来扩展内部 API。当前项目虽然没扩展 API，但保留了这种能力（`server/index.js:1`）。

### Q2：端口怎么配置？为什么 nuxt.config.js 里写死了 10310？

实际监听端口来自 `nuxt.options.server`，当前配置在 `nuxt.config.js:41` 固定为 `10310`。如果要做多环境/动态端口，建议把 `server.port` 改成读 `process.env.WEBSITE_PORT`（并确保 PM2/Docker 注入该 env）。

### Q3：cookieParser 在这里的作用是什么？

当前代码里没有自建 API，所以基本没被使用；如果后续要在 Express 层处理 cookie（比如 SSR 前置鉴权、健康检查白名单等），才需要把 `cookieParser()` 放在对应路由前面（`server/index.js:27`）。

