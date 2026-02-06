# 合同页 前端面试问答

## 前端面试官：你是如何实现 合同页 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：页面组件把合同签约流程拆成“状态头部 +（可选）操作按钮 + 只读信息展示 +（可选）结算信息编辑/展示 + PDF 预览弹窗”；核心数据来自两个接口：资源基础信息（状态/签约时间）和合同结算信息。  
- **模板（HTML/组件）结构**：顶部 status-header 根据 `contractStatus` 切换图标与文案；当状态为完成/终止且存在盖章合同时显示“查看/下载”按钮；信息展示区根据账户类型用多个 `v-if` 精准控制字段展示（例如外币/对公/人民币个人等）。  
- **响应式数据与单向数据流**：资源状态与 resourceId 来自 store（`userinfo`）；页面创建时先刷新最新状态（并写回 store），再基于 `resourceId` 拉取合同数据。对“resourceId 可能尚未就绪”的情况用定时重试兜底，保证首次进入也能加载。  
- **表单校验实现（JS）**：该页大部分是只读展示；如存在编辑态（结算信息编辑）则通常在提交时做必要字段校验并转换成后端需要的字段格式（本页当前实现以展示为主）。  
- **输入约束与联动**：  
  - 状态联动：通过 store 的 `resourceStatus` 映射出 `contractStatus`（签约中/审核中/完成/终止），从而驱动 UI（按钮、文案、字段区块）渲染。  
  - resourceId 就绪联动：`loadContractInfo` 先判断 `resourceId`，不存在则延迟重试，避免空参数请求。  
  - 文件联动：后端返回 `contractFile/url`，用于拼接预览与下载链接；预览走内部 PDF 弹窗，下载走 fetch blob。  
- **异步搜索下拉（Vue 事件 + 父子通信）**：如果结算信息存在下拉输入（账户类型等），用 `filterOption` 做本地模糊匹配；页面层负责过滤逻辑，组件层只做渲染与触发。  
- **权限/状态驱动 UI（如有）**：由 `layouts/translator.vue` 做登录/有效性校验；此外导航项根据 `resourceStatus` 过滤（例如合同页要求状态达到一定值），保证用户只看到当前可用入口。  
- **性能与体验细节（如有）**：  
  - 合同信息与基础信息并行请求（`Promise.all`），减少等待。  
  - 预览 URL 采用 `encodeURIComponent` 处理文件名，避免中文名导致链接失效。  
  - 下载使用 `fetch(..., { credentials: 'include' })` 保持 cookie 认证，并用 Blob + `a[download]` 实现无刷新下载。  
- **CSS/布局**：  
  - 页面宽度限制 `max-width: 960px; margin: 0 auto`，阅读更聚焦。  
  - 信息行采用 label 固定宽 + value 自适应的 flex 结构，字段多时也能对齐。  
  - 状态色与主题色统一为译员平台红色，视觉一致。  
- **可扩展性与复用**：字段展示采用“按账户类型分支”的纯模板策略，新增字段只需添加对应 `v-if` 区块；接口映射集中在 `loadContractInfo` 的数据转换处，便于维护与测试。
（在此填写追问补充句，保持此段落位置不变）
---

## 对应代码（节选/伪码）
> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）
```text
页面（如有）：pages/translator/contract.vue
组件：pages/translator/contract.vue
相关：layouts/translator.vue
相关：config/path.js
相关：store/userinfo.js（或 store 下 userinfo 模块）
相关：components/PdfPreviewModal.vue（若使用）
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`pages/translator/contract.vue`

```js
export default {
  layout: 'translator',
  data() {
    return {
      resourceId: null,
      sealedContractFile: '',
      sealedContractFileName: '',
      pdfPreviewVisible: false,
      pdfPreviewUrl: '',
      contractInfo: {}
    }
  },
  computed: {
    resourceStatus() { return this.$store.state.userinfo?.resourceStatus },
    contractStatus() {
      const status = Number(this.resourceStatus)
      if (status === 100 || status === 120) return 'completed'
      if (status === 110) return 'terminated'
      return 'signing'
    }
  },
  created() {
    this.loadContractStatus()
    this.loadContractInfo()
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`pages/translator/contract.vue`

```vue
<div class="translator-contract">
  <div class="status-header">
    <div class="status-title" :class="statusClass">{{ statusTitle }}</div>
    <div class="status-desc">{{ statusDesc }}</div>
  </div>

  <div v-if="(contractStatus === 'completed' || contractStatus === 'terminated') && hasSealedContract" class="action-buttons">
    <a-button type="primary" @click="viewContract">查看合同协议</a-button>
    <a-button type="primary" @click="downloadContract">下载合同协议</a-button>
  </div>

  <div v-if="contractStatus === 'completed' || contractStatus === 'terminated'" class="info-card">
    <div class="info-row"><span class="info-label">签约时间</span><span class="info-value">{{ contractInfo.signDate }}</span></div>
    <!-- 不同账户类型字段通过 v-if 精确控制 -->
  </div>
</div>
```

### 4）关键交互与业务规则（节选）

文件：`pages/translator/contract.vue`

```js
async loadContractInfo() {
  if (!this.resourceId) {
    setTimeout(() => this.loadContractInfo(), 500)
    return
  }

  const [contractRes, baseRes] = await Promise.all([
    this.$http.get(path.getResourceContractByResourceId, { resourceId: this.resourceId }),
    this.$http.get(path.translatorGetResourceBase)
  ])

  const signDate = baseRes?.data?.signDate ? this.formatTimestamp(baseRes.data.signDate) : ''
  const data = Array.isArray(contractRes.data) ? contractRes.data[0] : contractRes.data

  this.sealedContractFile = data.contractFile || ''
  this.sealedContractFileName = data.url || ''
  this.contractInfo = {
    signDate,
    accountType: data.accountType || '',
    receiverName: data.payeeName || '',
    // ...
  }
}

viewContract() {
  this.pdfPreviewUrl = `${path.baseURL}${path.translatorDownloadFile}?keyName=${this.sealedContractFile}&fileName=${encodeURIComponent(this.sealedContractFileName)}`
  this.pdfPreviewVisible = true
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）
文件：`layouts/translator.vue`

```js
computed: {
  navItems() {
    // 根据 userinfo.resourceStatus 过滤菜单项（合同页可能要求 minStatus）
    return this.allNavItems.filter(item => item.minStatus == null || this.resourceStatus >= item.minStatus)
  }
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`pages/translator/contract.vue`

```scss
.status-header {
  display: flex;
  align-items: center;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}

.info-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  .info-label { width: 120px; flex-shrink: 0; color: #999; }
  .info-value { flex: 1; color: #333; }
}
```

---

## 补充：主导职责、量化结果、复盘与分时长回答

### 主导职责（可直接说）

在「译员端流程与可用性保障」这部分，我主导完成了：方案拆解、风险评估、核心代码落地、联调上线与复盘沉淀。主导范围覆盖：流程分支、鉴权链路、文件预览下载。

### 量化结果（请按真实数据替换）

- 关键指标：登录态一致性、预览/下载成功率、页面可用率 从 X 优化到 Y。
- 交付效率：同类需求交付周期从 X 天 缩短到 Y 天。
- 稳定性：相关线上问题从 X 个/迭代下降到 Y 个/迭代。
- 可维护性：重复逻辑与临时补丁占比下降 X%。

### 故障复盘卡片（与本文主题相关）

1) 现象：登录态与权限挡板不一致。  
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
  这部分是我主导落地的，核心目标是把「译员端流程与可用性保障」做到稳定、可扩展、可复用，重点解决一致性和线上可维护性。

- 90 秒：
  我按“问题-方案-结果”推进：先定义边界与关键风险，再做结构化改造和统一约定，最后用测试、监控和流程门禁固化成果，确保同类问题不反复出现。

- 3 分钟：
  按“背景、挑战、方案、落地、结果、复盘”展开：
  1) 业务背景与约束。  
  2) 当前痛点与失败案例。  
  3) 方案选择与取舍依据。  
  4) 实施路径与跨团队配合。  
  5) 指标结果与后续优化计划。
