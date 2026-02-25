# 环境变量 & 多环境管理 & CDN 版本策略详解（big-customer，面向面试）

> 目标：把项目中"多环境怎么切换、CDN 静态资源怎么按版本发布、env.js / version.js / nuxt.config.js 三者怎么联动"讲清楚。

## 1. 一句话概括（面试开场）

本项目通过 `cross-env` 注入 `NODE_ENV`，驱动 `env.js` 生成环境特定配置（最关键的是 `BUILD_PUBLIC_PATH`——CDN 地址），在 `nuxt.config.js` 中消费该配置设置 `build.publicPath`，使构建产物的静态资源指向对应环境的 CDN 路径。同时，`version.js` 管理测试/线上版本号，CI 流水线按版本号上传到 SVN/CDN。

---

## 2. 关键文件索引

| 文件                    | 说明                                                |
| ----------------------- | --------------------------------------------------- |
| `version.js:1`          | 测试 & 线上版本号（CI 脚本解析）                    |
| `env.js:1`              | 根据 `NODE_ENV` 生成 `BUILD_PUBLIC_PATH` 等环境变量 |
| `nuxt.config.js:5-6`    | 引入 env.js，获取 `projectEnv`                      |
| `nuxt.config.js:10-20`  | `env` 对象：注入运行时环境变量                      |
| `nuxt.config.js:140`    | `build.publicPath`：指向 CDN                        |
| `package.json:7-16`     | 各环境 npm scripts                                  |
| `ecosystem.config.js:1` | PM2 多环境配置                                      |
| `.gitlab-ci.yml:1`      | CI/CD 流水线 + CDN 上传                             |

---

## 3. 环境全景（三套环境，三条路径）

| 环境 | NODE_ENV      | 触发分支             | API_HOST                   | publicPath（CDN）                                               |
| ---- | ------------- | -------------------- | -------------------------- | --------------------------------------------------------------- |
| 开发 | `development` | 本地 `npm run dev`   | `hts-api.inner.youdao.com` | `/_nuxt/`（本地）                                               |
| 测试 | `test`        | GitLab `dev` 分支    | `at-test1.youdao.com`      | `https://shared.ydstatic.com/.../test/{version}/dist/client/`   |
| 生产 | `production`  | GitLab `master` 分支 | `fapi.youdao.com`          | `https://shared.ydstatic.com/.../online/{version}/dist/client/` |

---

## 4. 核心代码摘录

### A) version.js：版本号的"单一来源"

来源：`version.js:1`

```js
const version = { testVersion: '0.0.3', onlineVersion: '0.0.5' }
module.exports = version
// 此文件不要修改格式！！！ 需要用单引号，不要用双引号
// gitlab script 中脚本通过此格式提取测试版本号以及线上版本号
```

面试讲法：

- 版本号 **只维护这一个文件**，CI 脚本通过 `awk` 解析第一行提取。
- 每次发布只需改 `testVersion` 或 `onlineVersion`，上游自动消费。
- **格式敏感**：必须单引号、变量在第一行，否则 CI 解析断裂——这是实际踩过的坑。

### B) env.js：环境 → CDN 路径映射

来源：`env.js:1`

```js
const version = require('./version')
const ONLINE_VERSION = version.onlineVersion
const TEST_VERSION = version.testVersion

const createEnv = (NODE_ENV = 'development') => {
  const envMap = {}
  const baseEnv = {
    BUILD_PUBLIC_PATH: '/_nuxt/'
  }
  const testEnv = {
    BUILD_PUBLIC_PATH: `https://shared.ydstatic.com/at/new-web/big-customer/test/${TEST_VERSION}/dist/client/`
  }
  const onlineEnv = {
    BUILD_PUBLIC_PATH: `https://shared.ydstatic.com/at/new-web/big-customer/online/${ONLINE_VERSION}/dist/client/`
  }
  const matchEnv = NODE_ENV => {
    switch (NODE_ENV) {
      case 'production':
        Object.assign(envMap, baseEnv, onlineEnv)
        break
      case 'test':
        Object.assign(envMap, baseEnv, testEnv)
        break
    }
  }
  matchEnv(NODE_ENV)
  return envMap
}

module.exports = createEnv
```

面试讲法：

- 开发环境不走 CDN，`publicPath` 保持默认 `/_nuxt/`。
- 测试/生产环境的 `publicPath` 指向 CDN 的**版本化路径**，避免缓存冲突。
- **注意**：`development` 不进 switch → 返回空对象 → Nuxt 使用默认值 `/_nuxt/`。

### C) nuxt.config.js：消费 env.js

来源：`nuxt.config.js:5-6, 10-20, 140`

```js
const createEnv = require('./env')
const projectEnv = createEnv(process.env.NODE_ENV) // 传入当前环境

module.exports = {
  env: {
    NODE_ENV: process.env.NODE_ENV,
    WEBSITE_HOST:
      process.env.NODE_ENV === 'production'
        ? 'http://f-sales.youdao.com/'
        : process.env.WEBSITE_HOST,
    PORT:
      process.env.NODE_ENV === 'production' ? 10310 : process.env.WEBSITE_PORT,
    API_HOST:
      process.env.NODE_ENV === 'production'
        ? 'https://fapi.youdao.com'
        : process.env.API_HOST
  },
  // ...
  build: {
    publicPath: projectEnv.BUILD_PUBLIC_PATH // CDN 路径
  }
}
```

面试讲法：

- `build.publicPath` 决定了构建产物中所有 JS/CSS 的 `src` 前缀。
- 生产环境：浏览器加载 `https://shared.ydstatic.com/.../online/0.0.5/dist/client/xxx.js`
- 如果 `NODE_ENV` 不对（例如 undefined），`publicPath` 为空 → **所有静态资源 404** → 页面白屏。

### D) package.json 多环境 scripts

来源：`package.json:7-16`

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development ... nodemon server/index.js",
    "dev_online": "cross-env NODE_ENV=development ... API_HOST=https://fapi.youdao.com ...",
    "build": "cross-env NODE_ENV=production NODE_OPTIONS=--max-old-space-size=4096 nuxt build",
    "build:test": "cross-env NODE_ENV=test NODE_OPTIONS=--max-old-space-size=4096 ... nuxt build",
    "start": "cross-env NODE_ENV=production ... node server/index.js"
  }
}
```

面试讲法：

- `cross-env` 解决 Windows/Linux 环境变量设置语法差异。
- `NODE_OPTIONS=--max-old-space-size=4096`：Nuxt 构建内存开销大，默认 1.7GB 会 OOM。
- `dev_online` 是"本地开发连线上 API"的调试模式——方便定位"是前端还是后端的问题"。

### E) ecosystem.config.js（PM2 多环境）

来源：`ecosystem.config.js:1`

```js
module.exports = {
  apps: [
    {
      name: 'big-customer',
      script: './server/index.js',
      max_memory_restart: '4G',
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        API_HOST: 'http://hts-api.inner.youdao.com/hts-sales'
      },
      env_test: {
        NODE_ENV: 'test',
        API_HOST: 'https://at-test1.youdao.com/hts-sales'
      },
      env_production: {
        NODE_ENV: 'production',
        API_HOST: 'https://fapi.youdao.com'
      }
    }
  ]
}
```

面试讲法：

- PM2 通过 `--env production` 切换配置：`pm2 start ecosystem.config.js --env production`。
- `max_memory_restart: '4G'`：Node SSR 长时间运行可能内存泄漏，超 4G 自动重启。
- `autorestart: true`：进程崩溃后自动重启，保证可用性。

---

## 5. CI/CD 中的 CDN 上传流程

来源：`.gitlab-ci.yml:89-114`

```
stages: build → build-image → deploy

build-online-job:
  ① npm install → npm run build（生成 nuxt-dist/）
  ② 从 version.js 提取版本号（awk 解析第一行）
  ③ svn mkdir CDN_URL（按版本号创建目录）
  ④ 将 nuxt-dist/ 内容拷贝到 SVN 目录
  ⑤ svn commit → 触发 CDN 刷新
  ⑥ 等待 CDN 刷新完成（轮询 HTTP 状态码）
  ⑦ artifacts 传递到下一阶段

build-image-online-job:
  ⑧ docker build（包含 artifacts 中的构建产物）
  ⑨ docker push 到 Harbor

deploy-online:
  ⑩ ydci deploy set-image（K8s 滚动更新）
```

面试讲法：

- **构建和运行分离**：CI 阶段构建 + 上传 CDN；Docker 镜像只负责运行 `npm start`（不再 build）。
- **CDN 按版本隔离**：每个版本有独立路径（`.../online/0.0.5/`），上一版本的资源不受影响，**支持快速回滚**。
- **CDN 刷新等待**：上传完后轮询刷新状态 + sleep 120s，确保用户访问到的是最新资源。

---

## 6. 踩坑实录：NODE_ENV 缺失导致生产事故

> 详见 `docs/生产环境部署失败排查全记录.md` 和 `docs/面试问答/生产环境排障-实战复盘-详解.md`

**根因**：某次 commit 修改 `package.json` 的 `build` 脚本时遗漏了 `NODE_ENV=production` → `env.js` 的 `matchEnv` 不匹配任何分支 → `BUILD_PUBLIC_PATH` 为 undefined → `publicPath` 错误 → 浏览器从错误路径加载 JS/CSS → 404 → 页面白屏 → K8s 健康检查失败 → Pod 反复重启。

**核心教训**：`NODE_ENV` 是构建链的**根依赖**，缺失会导致级联故障。

---

## 7. 面试题库（Q&A 速记）

### Q1：你们怎么做多环境管理的？

三套环境（dev/test/prod），通过 `cross-env` 注入 `NODE_ENV`，`env.js` 据此生成 CDN 路径等配置，`nuxt.config.js` 消费。CI 按分支（dev→test、master→prod）自动触发对应流水线。

### Q2：为什么静态资源要上 CDN？

Nuxt 构建产物（JS/CSS）体积大、更新频率高。上 CDN 后：1) 用户就近加载，减少延迟；2) 减轻 Node SSR 服务器的带宽压力；3) 按 `publicPath` 版本化，避免缓存冲突。

### Q3：CDN 版本号怎么管理的？

维护在 `version.js` 中，每次发布前手动递增。CI 脚本用 `awk` 解析提取，作为 SVN/CDN 路径的一部分。好处是简单直接，风险低；坏处是人工维护容易遗漏——改进方向是 CI 自动递增。

### Q4：如果 CDN 上传成功但刷新未生效怎么办？

用户会加载到旧版本资源。CI 中做了轮询等待（检查 HTTP 302 + sleep 120s）保证刷新完成。如果仍有问题，可在浏览器强制刷新或等待 CDN TTL 过期。

### Q5：`publicPath` 的作用是什么？

Webpack/Nuxt 构建时，`publicPath` 决定了产物中所有 `<script src>` 和 `<link href>` 的前缀路径。设为 CDN 地址后，浏览器会从 CDN 加载这些资源，而不是从 Node 服务器加载。

---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「多环境管理与 CDN 发布」这部分，我主导完成了：env.js 设计、CI 流水线 CDN 上传、版本号管理规范、生产事故排查与根因修复。

### 量化结果（请按真实数据替换）

- 关键指标：CDN 命中率、构建成功率 从 X 优化到 Y。
- 交付效率：发布流程从 X 分钟 缩短到 Y 分钟。
- 稳定性：因环境配置引起的线上事故从 X 次下降到 0 次。

### 分时长回答（背诵版）

- 30 秒：  
  三套环境通过 `NODE_ENV` + `env.js` + `version.js` 联动管理 CDN 路径和 API 地址，CI 自动按分支构建部署。

- 90 秒：  
  构建链路：`cross-env` 注入环境 → `env.js` 按环境生成 CDN 路径 → `nuxt.config.js` 消费 `publicPath` → CI 构建后上传到 SVN CDN → Docker 打包 → K8s 部署。版本号维护在 `version.js`，CI 脚本自动解析。曾因遗漏 `NODE_ENV` 导致生产白屏，排查后加了环境变量校验。

- 3 分钟：
  1. 背景：三套环境的差异与需求。
  2. 设计：env.js + version.js + nuxt.config.js 的联动。
  3. CI/CD：GitLab CI 分支策略 + CDN 上传 + Docker + K8s。
  4. 踩坑：NODE_ENV 缺失的连锁故障。
  5. 改进：环境变量校验 + CI 检查 + 版本号自动递增。
