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


---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「Nuxt 工程架构与运行时治理」这部分，我主导完成了：方案拆解、风险评估、核心代码落地、联调上线与复盘沉淀。主导范围覆盖：插件注入、构建配置、运行入口与配置管理。

### 量化结果（请按真实数据替换）

- 关键指标：构建时长、首屏体积、发布成功率 从 X 优化到 Y。
- 交付效率：同类需求交付周期从 X 天 缩短到 Y 天。
- 稳定性：相关线上问题从 X 个/迭代下降到 Y 个/迭代。
- 可维护性：重复逻辑与临时补丁占比下降 X%。

### 故障复盘卡片（与本文主题相关）

1) 现象：插件或构建配置变更引发回归。  
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
  这部分是我主导落地的，核心目标是把「Nuxt 工程架构与运行时治理」做到稳定、可扩展、可复用，重点解决一致性和线上可维护性。

- 90 秒：
  我按“问题-方案-结果”推进：先定义边界与关键风险，再做结构化改造和统一约定，最后用测试、监控和流程门禁固化成果，确保同类问题不反复出现。

- 3 分钟：
  按“背景、挑战、方案、落地、结果、复盘”展开：
  1) 业务背景与约束。  
  2) 当前痛点与失败案例。  
  3) 方案选择与取舍依据。  
  4) 实施路径与跨团队配合。  
  5) 指标结果与后续优化计划。
