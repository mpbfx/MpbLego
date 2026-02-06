# Docker + GitLab CI/CD 在 big-customer 项目中的落地实现（面向面试）

> 目标：用“从代码到上线”的视角，把本仓库的 Docker 与 GitLab CI/CD 串起来讲清楚；同时给一套可直接用于面试的问答点。

## 1. 一句话概括（面试开场）

这个项目的发布链路是 **Nuxt（SSR）先在 CI 里构建产物 + 上传静态资源到 SVN/CDN**，再 **docker build 打出包含构建产物的镜像推到 Harbor**，最后通过 **ydci 把 K8S 工作负载切镜像到本次提交的 `CI_COMMIT_SHA`**（见 `.gitlab-ci.yml:19`、`.gitlab-ci.yml:60`、`.gitlab-ci.yml:73`）。

## 2. 目录与关键文件（先给面试官“索引”）

- Pipeline 定义：`.gitlab-ci.yml:1`
- 版本号来源（CI 解析依赖其格式）：`version.js:1`
- CDN publicPath 生成逻辑：`env.js:1`
- Nuxt 构建产物目录与 publicPath 入口：`nuxt.config.js:45`、`nuxt.config.js:133`
- 容器启动（SSR server）：`server/index.js:1`
- npm scripts（start/build/test）：`package.json:8`
- Docker 镜像（线上/测试）：`Dockerfile:1`、`Dockerfile_test:1`

## 2.1 关键代码摘录（面试最常被追问的点）

### A) Pipeline 全局配置：DinD + 变量 + stages

来源：`.gitlab-ci.yml:1`

```yml
image: harbor-registry.inner.youdao.com/devops/docker:19.03-ydci

services:
  - name: harbor-registry.inner.youdao.com/devops/docker:20-dind
    entrypoint: ["dockerd-entrypoint.sh", "--tls=false"]
    alias: docker

variables:
  DOCKER_IMAGE_ONLINE_NAME: '$CI_HARBOR_REGISTRY/human-translator/hts-big-customer-onine'
  DOCKER_IMAGE_TEST_NAME: '$CI_HARBOR_REGISTRY/human-translator/hts-big-customer-test'
  buildpath: 'nuxt-dist'
  SVN_TOKEN: '--username $SVN_USERNAME --password $SVN_PASSWORD'

stages:
  - build
  - build-image
  - deploy
```

### B) build（dev）：构建 + SVN 上传 + 刷新 CDN + 切换 Dockerfile

来源：`.gitlab-ci.yml:24`

```yml
build-test-job:
  before_script:
    - export line1=`awk 'NR==1{print}' version.js`
    - export testVersion=`echo $line1 |awk -F ''\''' '{print $2}'`
    - export prodVersion=`echo $line1 |awk -F ''\''' '{print $4}'`
  image: harbor-registry.inner.youdao.com/devops/node:14.17.1-svn
  stage: build
  only:
    - dev
  script:
    - npm install --registry=https://registry.npmmirror.com
    - npm run build:test
    - svn mkdir $CDN_URL -m "$DATE_WITH_TIME" $SVN_TOKEN || echo "$testVersion exists"
    - svn co $CDN_URL $SVN_TOKEN
    - cp -r ./$buildpath/* ./$testVersion/
    - cd ./$testVersion/
    - svn add * --force
    - svn ci -m "version $testVersion $DATE_WITH_TIME" $SVN_TOKEN
    - cd ..
    - refreshCdnHttpStatus=0 && while [ ! $refreshCdnHttpStatus = 302 ];do refreshCdnHttpStatus=`curl -u ${SVN_USERNAME}:${SVN_PASSWORD} -d "request_log=$CDN_PARENT&request_submit==%E6%8F%90++%E4%BA%A4" -i $CDN_REQ | grep HTTP/1.1 | awk '{print $2}'` ;sleep 10 ;done;echo "等待 5 min, cdn刷新结束";sleep 120;echo "刷新时间到了";mv Dockerfile Dockerfile_prod;mv Dockerfile_test Dockerfile;
```

### C) build-image：登录 Harbor + build/push

来源：`.gitlab-ci.yml:51` 与 `.gitlab-ci.yml:116`

```yml
build-image-test-job:
  stage: build-image
  tags:
    - k8s
  only:
    - dev
  script:
    - docker logout $HARBOR_REGISTRY
    - echo $CI_HARBOR_TOKEN | docker login -u $CI_HARBOR_USER --password-stdin $CI_HARBOR_REGISTRY
    - docker build -t $DOCKER_IMAGE_TEST_NAME:$CI_COMMIT_SHA .
    - docker push $DOCKER_IMAGE_TEST_NAME:$CI_COMMIT_SHA
```

### D) deploy：ydci 切 K8S workload 的镜像

来源：`.gitlab-ci.yml:64` 与 `.gitlab-ci.yml:129`

```yml
deploy-dev:
  tags:
    - k8s
  stage: deploy
  only:
    - dev
  script:
    - ydci deploy set-image $DOCKER_IMAGE_TEST_NAME:$CI_COMMIT_SHA -c k8s-dev-common1 -n human-translator-dev1 -w big-customer
```

```yml
deploy-online:
  tags:
    - k8s
  stage: deploy
  only:
    - master
  script:
    - ydci deploy set-image "$DOCKER_IMAGE_ONLINE_NAME:$CI_COMMIT_SHA" -c k8s-prod-common1 -n hts-big-customer-front-online -w hts-translator-front-online-v1
```

### E) Dockerfile（线上/测试）：只装依赖，不在镜像内 build

来源：`Dockerfile:1`、`Dockerfile_test:1`

```dockerfile
FROM harbor-registry.inner.youdao.com/devops/node:14.17.1-svn
RUN mkdir -p /app
COPY . /app
WORKDIR /app
RUN npm install --registry=https://registry.npmmirror.com
CMD [ "npm", "run", "start" ]
```

```dockerfile
FROM harbor-registry.inner.youdao.com/devops/node:14.17.1-svn
RUN mkdir -p /app
COPY . /app
WORKDIR /app
RUN npm install --registry=https://registry.npmmirror.com
CMD [ "npm", "run", "start:test" ]
```

### F) publicPath：根据版本号切到 CDN（决定了为什么必须先上传 SVN/CDN）

来源：`env.js:1`、`nuxt.config.js:133`

```js
// env.js
const version = require('./version')

const ONLINE_VERSION = version.onlineVersion
const TEST_VERSION = version.testVersion

const createEnv = (NODE_ENV = 'development') => {
  const envMap = {}
  const baseEnv = { BUILD_PUBLIC_PATH: '/_nuxt/' }
  const testEnv = {
    BUILD_PUBLIC_PATH: `https://shared.ydstatic.com/at/new-web/big-customer/test/${TEST_VERSION}/dist/client/`
  }
  const onlineEnv = {
    BUILD_PUBLIC_PATH: `https://shared.ydstatic.com/at/new-web/big-customer/online/${ONLINE_VERSION}/dist/client/`
  }
  // ...
  return envMap
}
```

```js
// nuxt.config.js
buildDir: 'nuxt-dist',
build: {
  publicPath: projectEnv.BUILD_PUBLIC_PATH,
  extractCSS: true
}
```

### G) SSR 启动逻辑：生产/测试只 ready，不 build（依赖 `nuxt-dist`）

来源：`server/index.js:1`

```js
const { Nuxt, Builder } = require('nuxt')
const config = require('../nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'

async function start() {
  const nuxt = new Nuxt(config)
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }
  app.use(nuxt.render)
}
start()
```

### H) npm scripts：CI/容器到底跑的哪个命令

来源：`package.json:8`

```json
{
  "scripts": {
    "build": "cross-env NODE_OPTIONS=--max-old-space-size=4096 nuxt build",
    "build:test": "cross-env NODE_ENV=test ... nuxt build",
    "start": "cross-env NODE_ENV=production ... node server/index.js",
    "start:test": "cross-env NODE_ENV=test ... nuxt start"
  }
}
```

### I) 版本号格式要求：为什么 CI 强依赖“第一行 + 单引号”

来源：`version.js:1`

```js
const version = { testVersion: '0.0.3', onlineVersion: '0.0.5' }
module.exports = version
```

## 3. CI/CD 总体链路（从提交到上线）

本仓库的 `.gitlab-ci.yml` 把流水线分为 3 个 stage（`.gitlab-ci.yml:19-22`）：

1) `build`：在 Node 镜像里 `npm install` + `nuxt build`（测试环境用 `npm run build:test`，线上用 `npm run build`），并把 `nuxt-dist` 上传到 SVN 目录（后续被 CDN 同步）。

2) `build-image`：登录 Harbor，执行 `docker build`（使用上一步 artifacts 里的 `nuxt-dist`），打出镜像并 `docker push` 到 Harbor。

3) `deploy`：使用 `ydci deploy set-image` 将对应环境的 K8S workload 镜像更新到本次提交的 `CI_COMMIT_SHA`。

### 3.1 分支/环境映射

- `dev` 分支：走“测试环境”链路（`.gitlab-ci.yml:31-33`、`.gitlab-ci.yml:55-56`、`.gitlab-ci.yml:68-69`）
- `master` 分支：走“线上环境”链路（`.gitlab-ci.yml:96-97`、`.gitlab-ci.yml:120-121`、`.gitlab-ci.yml:133-134`）

这类约定在面试里经常被追问：你们是按分支发布，还是按 tag/release 发布？这个仓库是典型“分支驱动发布”。

## 4. build 阶段：Nuxt 构建 + 静态资源上 SVN/CDN

### 4.1 CI 为何要读 `version.js`

CI 在 `before_script` 用 `awk` 读取 `version.js` 的**第一行**并用单引号分割拿到两个版本号（`.gitlab-ci.yml:26-28`）。

这也解释了 `version.js` 里强调“第一行 + 单引号 + 格式不能变”（`version.js:1-6`）：因为 CI 的解析不是 AST，而是字符串硬拆。

### 4.2 test 环境构建与上传（dev 分支）

关键步骤（`.gitlab-ci.yml:34-45`）：

1. `npm install`（`.gitlab-ci.yml:34`）
2. `npm run build:test` 生成构建产物（`.gitlab-ci.yml:35`），其脚本定义为：

```bash
cross-env NODE_ENV=test ... nuxt build
```

见 `package.json:13`。

3. 通过 SVN 创建/检出目录并上传构建产物（`.gitlab-ci.yml:38-44`）：
   - 目录：`$CDN_BASE + test/ + $testVersion`（`.gitlab-ci.yml:11-13`、`.gitlab-ci.yml:37-38`）
   - 上传内容：从 `nuxt-dist` 拷贝到 `$testVersion` 目录下（`.gitlab-ci.yml:17`、`.gitlab-ci.yml:40`）

4. CDN 刷新：循环请求 `$CDN_REQ`，等待 HTTP 302（`.gitlab-ci.yml:45`）。

### 4.3 online 环境构建与上传（master 分支）

逻辑类似，只是把版本号换为 `prodVersion`，路径换为 `online/`（`.gitlab-ci.yml:99-110`）。

### 4.4 `nuxt-dist` 为什么是关键目录

Nuxt 的构建产物目录被改成了 `buildDir: 'nuxt-dist'`（`nuxt.config.js:45`），这和 CI 的 `buildpath: 'nuxt-dist'`（`.gitlab-ci.yml:17`）严格对应。

面试要点：这意味着项目不是默认的 `.nuxt/`，任何“部署/容器化”都要围绕 `nuxt-dist/` 走。

## 5. CDN publicPath：为什么必须“先上传，再切流量”

### 5.1 publicPath 在哪里定义

`env.js` 根据 `NODE_ENV` 生成 `BUILD_PUBLIC_PATH`（`env.js:6-29`）：

- `test`：`https://shared.ydstatic.com/.../test/${TEST_VERSION}/dist/client/`（`env.js:11-13`）
- `production`：`https://shared.ydstatic.com/.../online/${ONLINE_VERSION}/dist/client/`（`env.js:14-16`）

然后 `nuxt.config.js` 把它用于 `build.publicPath`（`nuxt.config.js:133-135`）。

### 5.2 这对 CI 的约束是什么

只要 `publicPath` 指向带版本的 CDN 目录，那么上线前必须保证：

1) 本次版本的静态资源已经上传到 SVN；  
2) CDN 已经同步并可访问；  
3) 再部署 SSR 服务（镜像切换）也不会出现客户端静态资源 404。

本仓库的顺序就是：build 上传 ->（等待刷新）-> build-image -> deploy。

## 6. build-image 阶段：为什么“镜像里不 build”

### 6.1 Dockerfile 做了什么

线上 Dockerfile（`Dockerfile:1-8`）核心行为：

```dockerfile
COPY . /app
RUN npm install ...
CMD ["npm", "run", "start"]
```

测试 Dockerfile（`Dockerfile_test:1-8`）只把启动命令换成 `start:test`。

这两个 Dockerfile **都没有 `nuxt build`**（注释掉了），意味着构建产物必须来自 CI 的 build job。

### 6.2 为什么 dev 分支会“改名 Dockerfile”

在 `dev` 的 build job 末尾，脚本把 `Dockerfile_test` 重命名为 `Dockerfile`（`.gitlab-ci.yml:45`），目的：让下一阶段的 `docker build ... .` 默认使用“测试启动方式”。

面试追问点（优缺点）：

- 优点：不用改 `docker build` 命令，复用同一套 pipeline。
- 缺点：属于“修改工作区文件来选 Dockerfile”，容易造成 artifacts 内容不可预期；更稳的方式是 `docker build -f Dockerfile_test ...`。

## 7. deploy 阶段：ydci / K8S 的切镜像发布

### 7.1 deploy-dev（dev 分支）

```bash
ydci deploy set-image $DOCKER_IMAGE_TEST_NAME:$CI_COMMIT_SHA \
  -c k8s-dev-common1 -n human-translator-dev1 -w big-customer
```

见 `.gitlab-ci.yml:72-73`。

### 7.2 deploy-online（master 分支）

```bash
ydci deploy set-image "$DOCKER_IMAGE_ONLINE_NAME:$CI_COMMIT_SHA" \
  -c k8s-prod-common1 -n hts-big-customer-front-online -w hts-translator-front-online-v1
```

见 `.gitlab-ci.yml:137-138`。

### 7.3 参数怎么讲（面试可用）

结合命名习惯，这些参数通常可解释为：

- `-c`：目标集群（dev/prod 不同集群）
- `-n`：K8S namespace
- `-w`：workload 名（一般是 Deployment/StatefulSet 级别的对象名）

你不需要死记 `ydci` 的内部实现，但要把“它做的是更新 workload 镜像并触发滚动发布”讲清楚。

## 8. 运行时：SSR server 怎么启动（容器里跑什么）

`server/index.js` 用 Express 承载 Nuxt（`server/index.js:1-36`）：

- `config.dev = process.env.NODE_ENV !== 'production'`（`server/index.js:9`）
- dev 模式会执行 `builder.build()`（`server/index.js:18-21`）
- 非 dev（test/prod）会 `nuxt.ready()`（`server/index.js:21-23`），要求构建产物已存在

这与 Dockerfile 的“镜像内不 build”形成闭环：CI 产物 -> 镜像携带 -> 运行只 ready。

## 9. GitLab 配置点：Variables、Runners、保护规则（面试常问）

### 9.1 Variables 在哪里配

GitLab 常见有三层变量来源：

1) 项目级：Project -> Settings -> CI/CD -> Variables  
2) 组级（继承）：Group -> Settings -> CI/CD -> Variables  
3) 实例级（自建 GitLab）：Admin Area -> Settings/CI/CD -> Variables

本仓库 `.gitlab-ci.yml` 需要的典型敏感变量包括：

- SVN：`SVN_USERNAME`、`SVN_PASSWORD`（`.gitlab-ci.yml:18`、`.gitlab-ci.yml:45`）
- Harbor：脚本里使用的是 `CI_HARBOR_REGISTRY/USER/TOKEN`（`.gitlab-ci.yml:59`），以及 `HARBOR_REGISTRY`（`.gitlab-ci.yml:58`）

面试要点：解释清楚“变量不进仓库、用 masked/protected 管控、分环境隔离”。

### 9.2 Runner 与 tags

`build-image-*` 和 `deploy-*` job 使用了 `tags: [k8s]`（`.gitlab-ci.yml:53-55`、`.gitlab-ci.yml:65-67`），说明它们必须被带 `k8s` tag 的 runner 执行。

面试要点：tags 是“让 job 选择具备特定能力的 runner”的路由机制（例如具备 Docker in Docker、能访问内网 Harbor/K8S）。

## 10. 面试题库（Q&A 速记版）

### Q1：你们的 CI/CD 分几个阶段？每个阶段产出是什么？

- `build`：产出 `nuxt-dist` + 上传到 SVN/CDN（`.gitlab-ci.yml:34-44`）
- `build-image`：产出可部署镜像并推到 Harbor（`.gitlab-ci.yml:59-61` / `.gitlab-ci.yml:124-126`）
- `deploy`：产出“线上/测试环境已经切到新镜像”的发布结果（`.gitlab-ci.yml:73` / `.gitlab-ci.yml:138`）

### Q2：为什么要把静态资源发到 CDN，而不是全放在容器里？

因为 Nuxt 的 `build.publicPath` 指向带版本号的 CDN 路径（`env.js:11-16`、`nuxt.config.js:133-135`），客户端会从 CDN 拉静态资源；SSR 服务只负责渲染与路由。

### Q3：为什么镜像里不执行 `nuxt build`？这样有什么风险？

- 选择：构建放在 CI，镜像只安装依赖并启动（`Dockerfile:5-8`）
- 风险：如果 artifacts 丢了或 `docker build` 没带上 `nuxt-dist`，运行时 `nuxt.ready()` 会因缺产物失败（`server/index.js:21-23`）
- 改进：改用多阶段构建或在 Dockerfile 里 `npm ci && nuxt build`，提升可重复性。

### Q4：`dev` 为啥要 `mv Dockerfile_test Dockerfile`？有没有更好的写法？

是为了让 `docker build ... .` 默认选到测试启动方式（`.gitlab-ci.yml:45`），更稳的方式是 `docker build -f Dockerfile_test ...`，避免修改工作区文件造成 artifacts “污染”。

### Q5：你们怎么回滚？

本链路以 `CI_COMMIT_SHA` 做镜像 tag（`.gitlab-ci.yml:60`、`.gitlab-ci.yml:125`）。回滚的常见做法是把 workload 的镜像 tag 切回某个历史 `CI_COMMIT_SHA`（本质仍是 set-image），或者在 K8S 层用 rollout undo（取决于你们平台/ydci 是否封装）。

### Q6：哪些变量必须是 masked/protected？为什么？

- `SVN_PASSWORD` / `HARBOR_TOKEN` 必须 masked，避免泄漏（面试可强调“日志脱敏”）。
- 若线上只允许 `master` 使用线上凭据，则变量应 protected，避免非保护分支拿到生产权限。

## 11. 可落地的改进建议（面试加分项）

1) 用 `npm ci` 替代 `npm install` 提升可重复构建（对应 `.gitlab-ci.yml:34`、`.gitlab-ci.yml:99`、`Dockerfile:5`）。  
2) 用 `docker build -f Dockerfile_test` 替代 `mv Dockerfile*`（对应 `.gitlab-ci.yml:45`）。  
3) 把 build job 里 “SVN 上传 + CDN 刷新” 抽成脚本/模板，减少重复与手误。  
4) 在 deploy 后增加健康检查/rollout 观察（例如等待 deployment available），避免“切镜像成功但服务不可用”。  
5) 规范变量命名：`CI_HARBOR_*` vs `HARBOR_*` 统一，减少环境耦合（对应 `.gitlab-ci.yml:9-10`、`.gitlab-ci.yml:58-60`）。

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
