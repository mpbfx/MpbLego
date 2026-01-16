# LEGO 编辑器部署到 GitHub Pages

> 目标：在 GitHub Pages 上发布编辑器前端构建产物。

## 1. 关键配置
- `vue.config.js` 支持 GitHub Pages 的 `publicPath`：  
  - 通过 `VUE_APP_GH_PAGES=true` 启用。  
  - 通过 `VUE_APP_GH_PAGES_BASE=/<仓库名>/` 指定基础路径。
- 构建脚本：`npm run build`（配合上述环境变量）。

## 2. GitHub Actions 自动部署
本仓库已新增工作流：`.github/workflows/deploy-gh-pages.yml`，会在 `main/master` 分支 push 后自动构建并发布。

**发布流程：**
1. 确保仓库开启 Pages（Settings → Pages → Source: GitHub Actions）。
2. push 到 `main` 或 `master`。
3. Actions 执行 `npm ci` → `npm run build` → 上传 `dist` → 部署。

## 3. 本地构建验证
```bash
cd lego
VUE_APP_GH_PAGES=true VUE_APP_GH_PAGES_BASE=/你的仓库名/ npm run build
```

## 4. 常见问题
- **页面空白或资源 404**：检查 `VUE_APP_GH_PAGES_BASE` 是否与仓库名一致。
- **自定义域名**：在 Pages 设置里配置 Custom Domain，并在 `publicPath` 设置为 `/`。
