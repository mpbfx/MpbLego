# ServicePriceCard 前端面试问答

## 前端面试官：你是如何实现 ServicePriceCard 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：`ServicePriceCard` 负责“展示与交互壳”（分组表格、编辑表单、VM 价格备注编辑、setMode 暴露）；复杂业务规则（保存/删除/置无效、币种一致性、重复项处理、批量更新币种、接口调用与刷新）集中在 `utils/resource/useServicePrice.js`，由父页 `pages/resourceManagement/resourceDetail/_id.vue` 统一创建 methods 并注入给卡片，保证资源详情页与译员平台能共享同一套业务逻辑。
- **模板（HTML/组件）结构**：采用 `CardWrapper` 的 `mode` 槽位实现 view/add 两态：
  - view：按领域分组输出多个 `a-table`（每个领域一个 card），用 slot 自定义 index、价格显示、备注两行省略、状态、操作列。
  - add/edit：用 `a-form + grid-form` 展示领域/语言对/服务/价格/单位/币种/速度/备注等字段；VM 价格备注在 view 与 add 态均可编辑，避免被卡片模式限制。
- **响应式数据与单向数据流**：卡片通过 props 接收 `servicePrices/servicePriceEditing/vmPriceRemark/vmPriceRemarkEditing` 等状态；操作通过 props 形式的回调（`onServiceDomainChange/onClickDeleteServicePrice/saveVmPriceRemark/...`）交给父页处理。VM 备注用 `.sync` 回传（`update:vm-price-remark`），并用本地 `vmPriceRemarkLocal` 解决“编辑态输入体验 + 父子同步”的问题。
- **表单校验实现（JS）**：不依赖 AntD Form rules，而是把校验与业务流程放在 `saveServicePrice()` 中做“条件必填校验 + 交互式确认（$confirm）”，例如：字段不全直接 `this.$message.error`；币种不一致弹窗确认是否批量统一；重复的有效价格弹窗确认是否把旧价置无效并新增。
- **输入约束与联动**：
  - 速度字段：根据 `domain/serviceType` 动态决定 label、placeholder、options（配音/AI 配音优先，其次游戏/影视领域）。
  - 价格字段：`a-input-number` 限制最小值、精度（如 3 位小数），避免非数值输入。
  - 领域/服务变更：会清空 speed（`onServiceDomainChange/onServiceTypeChange`），避免“旧速度 + 新条件”不匹配。
- **异步搜索下拉（Vue 事件 + 父子通信）**：语言下拉来自父页的 `languageList`，并统一走 `filterOption` 做搜索过滤；如果要改成远程搜索，也可以沿用“卡片触发 → 父页请求 → props 回传”的模式。
- **权限/状态驱动 UI（如有）**：通过 `priceEditable` 控制是否显示添加入口与操作列（无效/删除）；通过 `showVmPriceRemark` 控制 VM 备注区显隐；父页还会在“新建资源未保存基础信息”时隐藏该卡片（`v-if="!isNewResource || isBasicInfoSaved"`）。
- **性能与体验细节（如有）**：
  - 列表展示按语言对/服务排序（`loadServicePrices()` 内 sort），降低人工查找成本。
  - 删除/置无效/保存后只刷新服务价格列表（`loadServicePrices()`），并可写入操作记录（`addOperationRecord`）。
  - VM 备注编辑用本地值 + watch 同步，避免一边输入一边被 props 覆盖导致光标跳动。
- **CSS/布局**：
  - 编辑态用 CSS Grid 做表单栅格（`grid-form` + `grid-span-*`），复杂字段（速度/备注）可跨列。
  - `/deep/` 覆盖 Ant Design Vue 表单控件高度/对齐，保证与资源详情页其它卡片一致。
  - 分组卡片（领域）加边框与 tag，表格 zebra row 视觉更清晰。
- **可扩展性与复用**：`useServicePrice` 把“数据结构 + 方法集”抽离出来；卡片只要遵循相同的 props/回调协议即可复用，未来新增字段（例如更多速度维度/更多币种策略）主要改业务模块，不必大改 UI 组件。

补充：为了把“Vue / HTML / CSS / JS”讲清楚（且不改变上面条目结构），我会从以下前端点回答追问：

1) Vue（Nuxt + Vue2）
- 模式协议：`CardWrapper` 通过 `v-slot="{ mode }"` 统一 view/add/edit 的渲染协议，卡片只按 `mode` 切分表格视图与表单视图。
- 单向数据流：父页持有 `servicePrices/servicePriceEditing/vmPriceRemark*`，卡片只通过回调（`onServiceDomainChange/saveServicePrice/...`）触发意图，避免 UI 组件里耦合接口与复杂规则。
- 受控输入：VM 备注用 `.sync`（`update:vm-price-remark`）+ 本地 `vmPriceRemarkLocal` 解决“输入过程中 props 覆盖导致光标跳动”的常见问题。

2) JavaScript（校验/确认/规则）
- 这里的“校验”更偏业务流程：字段齐全性校验、币种一致性确认、重复有效价格确认（旧价置无效 + 新增）等更适合放在 `useServicePrice.saveServicePrice()` 中集中处理。
- 映射与兼容：速度字段会根据 `domain/serviceType` 分发到不同后端字段（如 game/film/dubbing speed），避免 UI 层到处写 if/else。

3) HTML（表格 + 表单语义）
- view：按领域分组多个 `a-table`，slot 自定义 index/价格/备注省略/状态/操作列，做到“列配置可复用 + 展示可定制”。
- add/edit：`a-form-item` 负责 label/错误提示一致性；`a-input-number` 限制最小值/精度，避免非数字输入。

4) CSS（grid + 覆盖组件库）
- grid 负责表单字段对齐，跨列（`grid-span-*`）给“速度/备注”等可变宽字段更好的排版空间。
- `scoped` 控制范围，`/deep/` 只用于覆盖 AntD 内部结构且加父级前缀，避免污染其它卡片。

（如果面试官追问“为什么把业务规则放在 useServicePrice 而不是组件里？”：我会补充规则需要跨页面复用且与接口/操作记录强耦合，放在可复用模块更利于统一维护；组件只关心 UI 状态与输入输出协议，从而降低改动成本。）

---

## 对应代码（节选/伪码）

> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）

讲解要点（前端视角）：
- `ServicePriceCard` 负责“展示 + 输入”，`useServicePrice` 负责“规则 + 接口 + 映射 + 刷新”，父页负责“聚合与权限/状态编排”。
- 列配置（表格列）与数据转换（如 `transformServicePrice`）抽到 config/utils，能让多个页面/卡片共享同一套展示规则。

```text
页面：pages/resourceManagement/resourceDetail/_id.vue（资源详情页）
组件：components/ResourceDetail/Cards/ServicePriceCard.vue
相关：utils/resource/useServicePrice.js、utils/resourceDetailTransform.js（transformServicePrice）、config/resourceDetailConfig.js（表格列配置）、components/ResourceDetail/CardWrapper.vue
```

### 2）组件入口：props / emits / data / computed / watch（节选）

讲解要点（Vue）：
- props 同时承载“数据”（`servicePrices/servicePriceEditing/vmPriceRemark`）与“能力”（`onClickDeleteServicePrice/saveVmPriceRemark/...`），让卡片保持受控、可复用。
- VM 备注本地值（`vmPriceRemarkLocal`）一般配合 watch 做单向同步：只在进入编辑态/外部刷新时更新，避免输入过程中被覆盖。

文件：`components/ResourceDetail/Cards/ServicePriceCard.vue`

```js
export default {
  data() {
    return { vmPriceRemarkLocal: '' }
  },
  computed: {
    getSpeedLabel() {
      const domain = this.servicePriceEditing.domain
      const service = this.servicePriceEditing.serviceType
      if (service === '配音' || service === 'AI配音') return '配音速度'
      if (domain === '游戏') return '游戏速度'
      if (domain === '影视') return '影视速度'
      return '服务速度'
    },
    speedOptions() {
      const domain = this.servicePriceEditing.domain
      const service = this.servicePriceEditing.serviceType
      if (service === '配音' || service === 'AI配音') return ['120分钟以下/10天', '120-180分钟/10天', '180分钟以上/10天']
      if (domain === '游戏') return ['3K字以下', '3-5K字', '5-8K字', '8K字以上']
      if (domain === '影视') return ['90分钟以下', '90-180分钟', '180-270分钟', '270分钟以上']
      return ['－']
    }
  },
  watch: {
    vmPriceRemark: { handler(v) { this.vmPriceRemarkLocal = v }, immediate: true },
    vmPriceRemarkLocal(v) {
      if (this.vmPriceRemarkEditing) this.$emit('update:vm-price-remark', v)
    }
  },
  methods: {
    setMode(mode) {
      this.$refs.cardWrapper?.setMode?.(mode)
    }
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

讲解要点（HTML/Vue 模板）：
- view：按领域循环渲染多个 `a-table`，slot 负责“展示细节”，数据源保持结构稳定。
- add/edit：表单用 grid 做布局，复杂字段通过 `grid-span-*` 跨列；语言对用两个 select + 箭头组合，符合用户阅读习惯。
- 备注的“两行省略 + tooltip”属于典型长文本处理，避免撑破表格布局。

文件：`components/ResourceDetail/Cards/ServicePriceCard.vue`

```vue
<template>
  <card-wrapper title="服务价格" :show-add="priceEditable" @mode-change="$emit('mode-change', $event)">
    <template v-slot="{ mode }">
      <!-- 查看态：按领域分组展示表格 -->
      <div v-if="mode === 'view'">
        <div v-for="domain in servicePriceDomains" :key="domain" class="price-domain-card">
          <div class="domain-tag">{{ domain }}领域</div>
          <a-table :columns="servicePriceColumns" :data-source="servicePrices.filter(p => p.domain === domain)" :pagination="false">
            <template slot="priceInfo" slot-scope="text, record">
              {{ record.price !== null && record.price !== undefined ? record.price : '－' }}/{{ record.unit }}
            </template>
            <template slot="action" slot-scope="text, record">
              <template v-if="priceEditable">
                <a v-if="record.status === 1" @click="onClickInvalidateServicePrice(record)">无效</a>
                <a @click="onClickDeleteServicePrice(record)">删除</a>
              </template>
            </template>
          </a-table>
        </div>

        <!-- VM 价格备注：独立于卡片模式的“内嵌编辑区” -->
        <div v-if="showVmPriceRemark" class="vm-price-remark-section">
          <template v-if="!vmPriceRemarkEditing">
            <span>{{ vmPriceRemark || '暂无' }}</span>
            <a @click="startEditVmPriceRemark">编辑</a>
          </template>
          <template v-else>
            <a-textarea v-model="vmPriceRemarkLocal" />
            <a @click="saveVmPriceRemark">保存</a>
            <a @click="cancelEditVmPriceRemark">取消</a>
          </template>
        </div>
      </div>

      <!-- 添加/编辑态：表单 -->
      <a-form v-else class="edit-form">
        <div class="grid-form" :style="gridStyles.four">
          <a-form-item required label="领域">
            <a-select v-model="servicePriceEditing.domain" @change="onServiceDomainChange">...</a-select>
          </a-form-item>
          <a-form-item required label="语言对">
            <div class="language-pair-select">
              <a-select v-model="servicePriceEditing.sourceLanguage" show-search :filter-option="filterOption">...</a-select>
              <span class="arrow">→</span>
              <a-select v-model="servicePriceEditing.targetLanguage" show-search :filter-option="filterOption">...</a-select>
            </div>
          </a-form-item>
          <a-form-item class="grid-span-3" :label="getSpeedLabel">
            <a-select v-model="servicePriceEditing.speed">
              <a-select-option v-for="opt in speedOptions" :key="opt" :value="opt">{{ opt }}</a-select-option>
            </a-select>
          </a-form-item>
        </div>
      </a-form>
    </template>
  </card-wrapper>
</template>
```

### 4）关键交互与业务规则（节选）

讲解要点（JS/业务流）：
- 保存链路通常是：前置校验 →（必要时）confirm →（必要时）批量更新币种/旧价置无效 → create/update → `loadServicePrices()` 刷新 → 写操作记录。
- “重复有效价格”与“币种一致性”都属于业务规则，放在方法里集中处理更可维护，也便于复用到译员平台。

文件：`utils/resource/useServicePrice.js`

```js
async saveServicePrice() {
  // 1) 条件必填校验（只要填了任意字段，就要求关键字段完整）
  if (!servicePriceEditing.domain) return message.error('请选择领域')
  if (!servicePriceEditing.sourceLanguage) return message.error('请选择源语言')
  if (!servicePriceEditing.targetLanguage) return message.error('请选择目标语言')
  if (!servicePriceEditing.serviceType) return message.error('请选择服务')
  if (servicePriceEditing.price == null) return message.error('请输入价格')
  if (!servicePriceEditing.currency) return message.error('请选择币种')

  // 2) 币种一致性：不一致 -> confirm 是否批量统一 -> updateAllCurrencies()
  const { isConsistent, existingCurrency } = checkCurrencyConsistency()
  if (!isConsistent && existingCurrency) {
    const ok = await confirm(`当前币种（${currency}）和历史币种（${existingCurrency}）不一致，是否统一？`)
    if (!ok) return
    const success = await updateAllCurrencies(currency)
    if (!success) return message.error('批量更新币种失败，请重试')
  }

  // 3) 重复有效价格：有重复 -> confirm 是否把旧价置无效 -> update old status=-1
  const duplicate = servicePrices.find(p => sameKey(p, servicePriceEditing) && p.status === 1)
  if (duplicate) {
    const ok = await confirm('已有有效价格，是否将历史价格置无效并创建新的？')
    if (!ok) return
    await invalidate(duplicate)
  }

  // 4) 组装后端字段（speed 根据 domain/serviceType 分发到 gameSpeed/filmSpeed/dubbingSpeed）
  // 5) create/update 接口 -> loadServicePrices() 刷新 -> 记录 lastServicePriceInput
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）

讲解要点（页面职责）：
- 父页统一创建 `createServicePriceMethods(this, ...)` 并注入 `addOperationRecord/getLabelByValue` 等回调，保证“保存后刷新 + 记录日志”对所有卡片一致。
- 卡片通过事件/props 触发，父页代理到 methods，便于统一做权限拦截、loading 管理与错误兜底。

文件：`pages/resourceManagement/resourceDetail/_id.vue`

```js
// 父页创建可复用 methods（集中处理接口/规则/刷新）
this.servicePriceMethods = createServicePriceMethods(this, {
  addOperationRecord: () => this.loadOperationRecords(),
  getLabelByValue: (value) => this.getLabelByValue(value)
})

// 通过 props/事件把能力注入给卡片
onServicePriceModeChange(mode) { this.servicePriceMethods.onServicePriceModeChange(mode) }
onServiceDomainChange(v) { this.servicePriceMethods.onServiceDomainChange(v) }
onServiceTypeChange(v) { this.servicePriceMethods.onServiceTypeChange(v) }
onClickDeleteServicePrice(record) { this.servicePriceMethods.onClickDeleteServicePrice(record) }
onClickInvalidateServicePrice(record) { this.servicePriceMethods.onClickInvalidateServicePrice(record) }

// VM 备注：卡片用 update:vm-price-remark 回写（.sync），父页持有最终状态
startEditVmPriceRemark() { this.servicePriceMethods.startEditVmPriceRemark() }
cancelEditVmPriceRemark() { this.servicePriceMethods.cancelEditVmPriceRemark() }
saveVmPriceRemark() { return this.servicePriceMethods.saveVmPriceRemark() }
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

讲解要点（CSS）：
- grid 负责字段对齐，`min-width: 0` 与省略策略保证长文本在窄屏下不撑破布局。
- 覆盖 AntD 样式时以卡片根节点作为前缀，避免全局影响（尤其是 `/deep/`）。

文件：`components/ResourceDetail/Cards/ServicePriceCard.vue`

```scss
.edit-form {
  .grid-form {
    display: grid;
    grid-template-columns: repeat(var(--cols, 3), 1fr);
    column-gap: 16px;
    .grid-span-2 { grid-column: span 2; }
    .grid-span-3 { grid-column: span 3; }
  }

  /deep/ .ant-form-item {
    display: flex;
    margin-bottom: 16px;
  }

  /deep/ .ant-form-item-label {
    flex: 0 0 72px;
    line-height: 32px;
    text-align: right;
  }
}
```
