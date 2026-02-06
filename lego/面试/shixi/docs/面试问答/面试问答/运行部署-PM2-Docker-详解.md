# 运行与部署（PM2 / Docker / Nuxt SSR）实现详解（big-customer，面向面试）

> 目标：把项目“如何启动、如何区分环境、如何在容器/进程管理器中运行”的真实实现讲清楚，并配对应代码摘录（含文件:行号）。

## 1. 一句话概括（面试开场）

这个项目的运行形态是 **Express 承载 Nuxt SSR**（`server/index.js:1`），通过 `NODE_ENV` 区分 dev 与非 dev：dev 会在运行时 `builder.build()`，而 test/prod 只 `nuxt.ready()` 依赖已构建产物（`server/index.js:18`）。本地/传统机器通常用 `npm run dev/start` 或 PM2（`ecosystem.config.js:1`）管理进程；容器化则通过 Dockerfile 启动 `npm run start` 或 `npm run start:test`（`Dockerfile:8`、`Dockerfile_test:8`）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- SSR 服务入口（Express + Nuxt）：`server/index.js:1`
- Nuxt server 监听地址/端口 + 构建目录：`nuxt.config.js:41`、`nuxt.config.js:45`
- npm scripts（dev/build/start/test）：`package.json:8`
- PM2 多环境：`ecosystem.config.js:1`
- Docker 运行方式：`Dockerfile:1`、`Dockerfile_test:1`
- CI 如何构建并交付产物：`docs/面试问答/Docker-GitLabCI-CD-详解.md:1`

## 3. 运行入口：Express 承载 Nuxt（SSR）

来源：`server/index.js:1`

```js
const express = require('express')
const { Nuxt, Builder } = require('nuxt')
const app = express()

const config = require('../nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'

async function start() {
  const nuxt = new Nuxt(config)
  const { host, port } = nuxt.options.server

  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  app.use(nuxt.render)
  app.listen(port, host)
}
start()
```

面试讲法：

- 这是典型 Nuxt 2 SSR 自定义 server：用 Express 把 Nuxt 的 `render` 当 middleware。
- `config.dev` 的判定只看 `NODE_ENV !== 'production'`：因此 `NODE_ENV=test` 也会走 “dev=true” 的分支（这一点很容易被追问）。
- `builder.build()` 发生在运行时，会显著增加冷启动时间；所以生产/测试通常只 `nuxt.ready()`，要求构建产物（`nuxt-dist/`）已存在。

## 4. Nuxt 监听地址/端口与构建目录（对部署最关键）

来源：`nuxt.config.js:41`

```js
server: {
  port: 10310,
  host: "0.0.0.0"
},
buildDir: 'nuxt-dist',
```

面试讲法：

- `host: 0.0.0.0`：容器/内网部署必须监听所有网卡，否则外部访问不到。
- `buildDir: 'nuxt-dist'`：改变 Nuxt 默认产物目录，CI/Docker/运行都要围绕它（这也是你们 CI 用 `nuxt-dist` 的原因）。

## 5. 环境变量与启动命令（npm scripts）

来源：`package.json:8`

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development ... nodemon server/index.js --watch server",
    "build": "cross-env ... nuxt build",
    "start": "cross-env NODE_ENV=production ... node server/index.js",
    "build:test": "cross-env NODE_ENV=test ... nuxt build",
    "start:test": "cross-env NODE_ENV=test ... nuxt start"
  }
}
```

面试讲法：

- `dev`：用 `nodemon` 监听 `server/`，适合本地开发。
- `start`：生产模式跑自定义 Express server（`node server/index.js`），而不是 `nuxt start`。
- `start:test`：测试环境直接 `nuxt start`（注意这与 `start` 的运行方式不同）。

## 6. 生产环境 env 的“覆盖”逻辑（面试常问的坑）

来源：`nuxt.config.js:11`

```js
env: {
  WEBSITE_HOST: process.env.NODE_ENV === 'production' ? 'http://f-sales.youdao.com/' : process.env.WEBSITE_HOST,
  PORT: process.env.NODE_ENV === 'production' ? 10310 : process.env.WEBSITE_PORT,
  API_HOST: process.env.NODE_ENV === 'production' ? 'https://fapi.youdao.com' : process.env.API_HOST,
},
```

面试讲法：

- 这里对 `production` 做了硬编码默认值：即使部署系统（PM2/K8S）传了 `API_HOST/WEBSITE_HOST`，也可能被覆盖。
- 如果线上希望“通过环境注入切后端/域名”，通常会把写法改成“优先 env，缺省再 fallback”。

## 7. PM2：多环境进程管理怎么配

来源：`ecosystem.config.js:1`

```js
apps: [{
  name: 'big-customer',
  script: './server/index.js',
  exec_mode: 'fork',
  out_file: './big-customer-logs/out.log',
  error_file: './big-customer-logs/err.log',
  max_memory_restart: '4G',
  autorestart: true,
  env: {
    NODE_ENV: 'development',
    WEBSITE_HOST: 'http://hts-sales-local.inner.youdao.com:10310/',
    WEBSITE_PORT: 10310,
    API_HOST: 'http://hts-api.inner.youdao.com/hts-sales',
  },
  env_test: {
    NODE_ENV: 'test',
    WEBSITE_HOST: 'http://hts-sales-nuxt.inner.youdao.com/',
    WEBSITE_PORT: 10310,
    API_HOST: 'https://at-test1.youdao.com/hts-sales',
  },
  env_production: {
    NODE_ENV: 'production',
    WEBSITE_HOST: 'http://f-sales.youdao.com/',
    WEBSITE_PORT: 10310,
    API_HOST: 'https://fapi.youdao.com',
  }
}]
```

面试讲法：

- PM2 通过 `--env test/production` 选择 `env_test/env_production`，把这些变量注入到 Node 进程。
- `max_memory_restart` 是“超过内存阈值自动重启”的保护措施（对 SSR 服务常见）。
- 日志落盘位置固定：`big-customer-logs/out.log`、`big-customer-logs/err.log`。

## 8. Docker：容器里到底跑什么

### A) 线上容器：启动 `npm run start`（自定义 Express server）

来源：`Dockerfile:1`

```dockerfile
FROM harbor-registry.inner.youdao.com/devops/node:14.17.1-svn
COPY . /app
WORKDIR /app
RUN npm install --registry=https://registry.npmmirror.com
CMD [ "npm", "run", "start" ]
```

对应 `start` 脚本：

来源：`package.json:12`

```bash
cross-env NODE_ENV=production ... node server/index.js
```

### B) 测试容器：启动 `npm run start:test`（Nuxt 自带 server）

来源：`Dockerfile_test:1`

```dockerfile
CMD [ "npm", "run", "start:test" ]
```

面试讲法：

- 该项目容器里**不做构建**（Dockerfile 注释了 `npm run build`），依赖 CI 先生成 `nuxt-dist` 并把产物带进镜像（详见 `docs/面试问答/Docker-GitLabCI-CD-详解.md:1`）。
- “线上跑自定义 server、测试跑 `nuxt start`”是一个重要差异点，面试时要能解释清楚为什么这样设计（历史/兼容/平台约束）。

## 9. 面试题库（Q&A 速记）

### Q1：为什么生产环境不在运行时 build？

因为 SSR 服务运行时 build 会拉长冷启动/重启时间且更易失败；生产应在 CI 里 build，运行时只 `nuxt.ready()` 或 `nuxt start`（`server/index.js:18`）。

### Q2：PM2 多环境怎么切换？

通过 ecosystem 的 `env_*`：例如 `pm2 start ecosystem.config.js --env test` 会使用 `env_test` 注入变量（`ecosystem.config.js:32`）。

### Q3：容器化部署最关键的 Nuxt 配置是什么？

`server.host = 0.0.0.0`（否则容器外访问不到）和 `buildDir = nuxt-dist`（决定构建产物位置）（`nuxt.config.js:41`、`nuxt.config.js:45`）。

### Q4：为什么“同一项目 test/prod 启动方式不同”？

本项目线上通过自定义 Express server 启动（`server/index.js`），测试镜像走 `nuxt start`（`package.json:14`）。这通常来自历史演进或部署平台差异；工程上建议统一入口，减少环境差异导致的问题。

## 10. 坑点与改进建议（面试加分项）

1) `config.dev` 的判断只排除 `production`，会让 `NODE_ENV=test` 也触发 runtime build：建议明确区分 `development/test/production`（`server/index.js:9`、`server/index.js:18`）。  
2) `nuxt.config.js` 对生产 env 的硬编码覆盖会削弱部署系统的可配置性：建议改为“优先 process.env，缺省再 fallback”。  
3) Dockerfile 使用 `npm install` 而非 `npm ci`：可重复性差，建议替换（`Dockerfile:5`）。  


---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「交付部署与环境一致性」这部分，我主导完成了：方案拆解、风险评估、核心代码落地、联调上线与复盘沉淀。主导范围覆盖：流水线、镜像、部署编排与回滚。

### 量化结果（请按真实数据替换）

- 关键指标：发布耗时、回滚耗时、发布失败率 从 X 优化到 Y。
- 交付效率：同类需求交付周期从 X 天 缩短到 Y 天。
- 稳定性：相关线上问题从 X 个/迭代下降到 Y 个/迭代。
- 可维护性：重复逻辑与临时补丁占比下降 X%。

### 故障复盘卡片（与本文主题相关）

1) 现象：环境变量或资源版本不一致。  
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
  这部分是我主导落地的，核心目标是把「交付部署与环境一致性」做到稳定、可扩展、可复用，重点解决一致性和线上可维护性。

- 90 秒：
  我按“问题-方案-结果”推进：先定义边界与关键风险，再做结构化改造和统一约定，最后用测试、监控和流程门禁固化成果，确保同类问题不反复出现。

- 3 分钟：
  按“背景、挑战、方案、落地、结果、复盘”展开：
  1) 业务背景与约束。  
  2) 当前痛点与失败案例。  
  3) 方案选择与取舍依据。  
  4) 实施路径与跨团队配合。  
  5) 指标结果与后续优化计划。
