# 常见故障排查 Runbook（big-customer，面向面试）

> 目标：把项目里最容易踩坑/线上最常见告警按“**症状 → 可能原因 → 快速定位 → 处理方案/回滚**”整理成可复述的 Runbook，并给出对应代码指路。

## 0. 总览：这项目最“爱出问题”的三条链路

1) **构建产物 & CDN publicPath**：`buildDir=nuxt-dist` + `BUILD_PUBLIC_PATH` 指向带版本号的 CDN 目录（`nuxt.config.js:45`、`nuxt.config.js:133`、`env.js:12`、`version.js:1`）  
2) **鉴权 & Cookie**：下载/预览普遍依赖 cookie（`credentials: 'include'`），否则 401/302 导致空白（`components/PdfPreviewModal.vue:178`、`utils/resource/useResumeFile.js:206`）  
3) **GitLab CI/CD**：构建后把 `nuxt-dist` 上 SVN/CDN，再 build/push 镜像并 `ydci deploy set-image`（`.gitlab-ci.yml:24`、`.gitlab-ci.yml:58`、`.gitlab-ci.yml:72`）

模块背景与页面入口总览（我负责部分）见：`docs/面试问答/项目背景-我负责模块-总览.md:1`。

---

## 1. CI/CD 相关

### 1.1 Pipeline 通过但线上页面静态资源 404（`/_nuxt/*.js` 或 CDN URL 404）

**症状**

- 页面能打开 HTML，但控制台大量 `ChunkLoadError` / 404
- Network 里请求的静态资源路径类似：  
  `https://shared.ydstatic.com/at/new-web/big-customer/online/<version>/dist/client/_nuxt/...`

**可能原因**

- `publicPath` 指向的版本目录和 SVN/CDN 实际上传的版本不一致（常见：`version.js` 更新后未触发对应环境 pipeline 或上传失败）
- CDN 刷新/同步未完成就切流（项目里是“循环等 302 + sleep 120”兜底，但仍可能不稳）

**快速定位**

- 看构建侧 publicPath 生成：`env.js:12`（test/online）+ `version.js:1`（版本号来自第一行）  
- 看 Nuxt 最终 publicPath：`nuxt.config.js:133`  
- 看 CI 上传是否成功：`.gitlab-ci.yml:40`（`cp -r ./nuxt-dist/* ./<version>/`）+ `.gitlab-ci.yml:43`（`svn ci`）  

**处理方案**

- 重新跑对应分支 pipeline（`dev` 走 test CDN，`master` 走 online CDN）：`.gitlab-ci.yml:31`、`.gitlab-ci.yml:96`
- 确认 `version.js` 第一行格式没变（CI 用 awk 解析第一行）：`.gitlab-ci.yml:26`、`version.js:1`
- 回滚策略：把 `version.js` 恢复到上一版本号并重跑 pipeline（保证 publicPath 回到已有资源目录）

**关键代码**

```js
// env.js:12
BUILD_PUBLIC_PATH: `https://shared.ydstatic.com/at/new-web/big-customer/test/${TEST_VERSION}/dist/client/`

// nuxt.config.js:133
build: { publicPath: projectEnv.BUILD_PUBLIC_PATH }
```

---

### 1.2 CI 失败：`version.js` 解析不到版本号

**症状**

- pipeline 早期阶段失败，日志显示版本变量为空或 awk 报错

**原因**

- `version.js` 第一行格式被改了（必须单引号、必须第一行）

**定位**

- `.gitlab-ci.yml:26` 直接 `awk 'NR==1{print}' version.js` 并用单引号分割提取

**处理**

- 恢复 `version.js:1` 为固定格式（只改数字，不改结构）

---

### 1.3 镜像已 push 但未部署（或部署到错误环境）

**症状**

- Harbor 里能看到新 tag（`$CI_COMMIT_SHA`），但集群没更新

**定位**

- dev 部署：`.gitlab-ci.yml:73`（`-c k8s-dev-common1 -n human-translator-dev1 -w big-customer`）
- online 部署：`.gitlab-ci.yml:138`（`-c k8s-prod-common1 -n hts-big-customer-front-online ...`）

**处理**

- 确认 runner tag 命中（本项目 build-image/deploy 都标了 `k8s`）：`.gitlab-ci.yml:52`、`.gitlab-ci.yml:65`
- 看 `ydci deploy set-image` 输出是否成功

---

## 2. 运行时/环境变量相关

### 2.1 生产环境设置了 `API_HOST/WEBSITE_HOST` 但不生效

**症状**

- 线上请求仍打到固定域名，或 `process.env.API_HOST` 看起来“被覆盖”

**原因**

- Nuxt 配置里对 production 写死了 env（不是读取 pm2/k8s 注入）：

```js
// nuxt.config.js:14
API_HOST: process.env.NODE_ENV === 'production' ? 'https://fapi.youdao.com' : process.env.API_HOST
```

**定位**

- `nuxt.config.js:11`～`nuxt.config.js:19`
- pm2 的 env 也有配置（但 production 里会被 Nuxt 这一层覆盖）：`ecosystem.config.js:39`

**处理**

- 需要多环境可配置：把 `nuxt.config.js` 的 production 硬编码改成读环境变量（或只提供默认值），并在部署环境注入
- 临时绕过：用 `env_test/env_production` 明确跑不同 env（pm2 场景）

---

### 2.2 本地启动 SSR 服务端口/host 不对，容器里访问不到

**症状**

- 本地或容器内启动 OK，但宿主机访问不到

**定位**

- Nuxt server 绑定：`nuxt.config.js:41`（host=0.0.0.0, port=10310）

**处理**

- 确认容器端口映射正确（`10310`）
- 确认没有被其它进程占用

---

## 3. 登录态/权限相关

### 3.1 页面按钮/入口权限“看起来没生效”

**症状**

- UI 上应该隐藏/禁用的功能仍可见或可点

**原因（项目现状）**

- `checkPermission` 当前固定 `return true`，导致权限判断被短路（`config/permission.js:49`～`config/permission.js:52`）

**定位**

- 入口：`middleware/checkPermission.js:2` 调用 `checkPermission`  
- 配置表：`config/permission.js:1`（`permissionTable`）

**处理**

- 恢复真实权限校验：把 `return true` 改回 `return visible`
- 面试讲法：这是“临时放开/灰度期”常见做法，但上线必须后端兜底 + 前端展示收敛

---

### 3.2 Nuxt 插件里 `errorCodeHandler` 没生效（或 `checkPermission` 插件没生效）

**症状**

- 预期的全局错误码处理/权限指令没有执行

**原因**

- `plugins` 配置里同一个对象写了两次 `src`，后写会覆盖前写，导致只加载到其中一个：

```js
// nuxt.config.js:75
{
  src: '@/plugins/errorCodeHandler', mode: 'client',
  src: '@/plugins/checkPermission', mode: 'client'
},
```

**定位**

- `nuxt.config.js:67`～`nuxt.config.js:79`

**处理**

- 拆成两个对象（一个插件一个对象）

---

## 4. 上传/下载/预览相关

### 4.1 上传能选中文件但“上传失败/上传到错误环境”

**症状**

- 本地开发上传失败；或上传后在生产能看到文件、测试环境看不到

**原因**

- 上传接口是绝对 URL 且硬编码生产域名：

```js
// config/path.js:94
uploadFile: 'https://fapi.youdao.com/zuul/base-api/uploadFile',
```

**定位**

- `config/path.js:94`
- 资源简历上传：`utils/resource/useResumeFile.js:104`
- 合同上传：`pages/resourceManagement/resourceDetail/_id.vue:3771`

**处理**

- 正确做法：让 `uploadFile` 也走 `baseURL`（跟 `downloadFile` 一致），或按环境变量注入上传域名

---

### 4.2 下载/预览空白（或提示 401/302）

**症状**

- PDF 预览弹窗一直 loading/空白
- 新开页预览跳转到登录页

**原因**

- 下载接口需要 cookie，但请求未携带 `credentials: 'include'`（尤其是 fetch/预览 iframe 场景）

**定位**

- 预览弹窗 fetch：`components/PdfPreviewModal.vue:178`
- 简历预览页 fetch：`pages/translator/resumePreview.vue:177`、`pages/resourceManagement/resumePreview/_id.vue:226`

**处理**

- 保证所有下载/预览请求都带 `credentials: 'include'`
- 兜底：预览失败时直接提供下载按钮（项目里已做）：`components/PdfPreviewModal.vue:184`

---

### 4.3 下载文件名乱码/丢失

**症状**

- 下载出来文件名变成一串编码、或变成 `download.pdf`

**原因**

- query 参数里 `fileName` 未 encode，或后端 `Content-Disposition` 不稳定

**定位**

- 统一做了 `encodeURIComponent(fileName)`：`utils/resource/useResumeFile.js:203`、`pages/resourceManagement/resourceDetail/_id.vue:3825`

**处理**

- 前端统一封装 `buildDownloadUrl(keyName, fileName)`，避免遗漏编码
- 下载用 `blob + a[download]` 强制文件名（项目已广泛采用）

---

## 5. SSR/服务端入口相关

### 5.1 服务端自定义中间件/解析 cookie 不生效

**症状**

- 期望在 Express 层读取 cookie，但读不到

**原因**

- 当前 `cookieParser()` 被放在 `nuxt.render` 之后，基本不会执行到（`server/index.js:26`～`server/index.js:28`）

**定位**

```js
// server/index.js:26
app.use(nuxt.render)
app.use(cookieParser())
```

**处理**

- 需要 Express 层处理 cookie 时：把 `cookieParser()` 放到 `nuxt.render` 之前，或在 Nuxt middleware 内处理 cookie（项目也集成了 `cookie-universal-nuxt`：`nuxt.config.js:88`）

---

## 6. 快速自检清单（面试“线上故障你怎么排”）

1) 先看静态资源：是否 404、publicPath 是否带版本号、版本目录 CDN 是否存在（`env.js:12`、`version.js:1`）。
2) 再看鉴权：下载/预览是否带 cookie（`credentials: 'include'`），是否被重定向登录。
3) 再看环境变量：production 是否被 Nuxt 配置硬编码覆盖（`nuxt.config.js:14`～`nuxt.config.js:16`）。
4) 最后看 pipeline：SVN 上传是否成功、`ydci deploy set-image` 是否执行成功（`.gitlab-ci.yml:40`、`.gitlab-ci.yml:73`）。
