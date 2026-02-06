# 简历页 前端面试问答

## 前端面试官：你是如何实现 简历页 的？（从前端技术角度，包含 Vue / HTML / CSS / JS 等）

（在此填写回答正文，保持下面的条目结构不变）

- **Vue 组件分层**：该页是一个“聚合页/编排页”，负责把多个卡片组件组合成一页（`BasicInfoCard / OrderTimeCard / DomainToolCard / LanguageLevelCard / ServicePriceCard / ResumeCard`），并把业务模块（`utils/resource/*`）产出的 data/methods 注入给卡片；卡片本身尽量只负责 UI（view/edit 双态、表单渲染、触发 save/cancel/mode-change 等事件）。  
- **模板（HTML/组件）结构**：页面分为左侧“目录/锚点菜单”和右侧“主体内容”；主体上方有进度条区域，下方是 cards 容器，每个卡片包一层 `card-section` 并挂 `ref` 用于滚动定位。  
- **响应式数据与单向数据流**：页面维护各卡片的“展示态数据”和“编辑态数据”（例如 `basicInfo/basicInfoEditing`），并通过 props 下发；卡片通过 `@save/@cancel/@clear/@mode-change` 把用户意图上抛，页面转调用对应模块方法（例如 `createTranslatorBasicInfoMethods(this)`）去做校验、请求、刷新。  
- **表单校验实现（JS）**：基础信息卡使用 AntD Form（`this.$form.createForm(this)` + `validateFields`）做必填/格式校验；校验失败时优先展示第一个字段错误，避免一次性报一堆信息影响体验。  
- **输入约束与联动**：  
  - 目录导航：点击左侧菜单 -> 根据 `ref` 计算滚动位置 -> 平滑滚动到对应卡片区域，同时在滚动过程中根据可视区域更新 `activeItem/activeIndex`。  
  - 进度条：通过“各模块是否完成/是否可保存”的状态计算 `progressPercent`，并用 `progress-badge` 做百分比视觉反馈。  
  - 城市联动：国家/地区变化时刷新城市候选；中国使用静态城市列表，非中国走远程搜索并 debounce。  
- **异步搜索下拉（Vue 事件 + 父子通信）**：基础信息的城市 `a-select` 开启 `show-search`，通过 `@search="handleCitySearch"` 触发 debounce 搜索；搜索实现放在 `useTranslatorBasicInfo` 中，通过闭包捕获 page 上下文来更新 `cityOptions`。  
- **权限/状态驱动 UI（如有）**：整体登录/权限拦截由 `layouts/translator.vue` 完成；字段级别可编辑控制通过 `isFieldEditable` 统一下发到各卡片（译员平台对部分字段做只读限制），从而让 UI 随“用户状态/资源状态”变化而变化。  
- **性能与体验细节（如有）**：  
  - 滚动联动使用 `isScrolling` 防抖/锁，避免“程序滚动”与“用户滚动”互相抢状态导致高频抖动。  
  - 进度条/菜单指示器用 transform/transition（GPU 友好）实现平滑动画。  
  - 大块配置（如专业列表）提前 `Object.freeze`，避免重复计算与意外修改。  
- **CSS/布局**：  
  - 页整体 `display:flex`，左侧目录 fixed width + `position: sticky`，右侧内容 `flex:1; min-width:0` 防止溢出。  
  - 卡片区用 column flex + gap 控制间距，卡片容器 background/圆角保持统一视觉。  
  - 通过 `body.translator-theme` 覆盖弹窗/按钮主题色，集中管理“译员平台主题”。  
- **可扩展性与复用**：卡片与数据逻辑解耦：同一套卡片组件可复用到资源详情页；而译员平台差异通过独立模块（如 `useTranslatorBasicInfo` 使用专用 API）来隔离，后续新增卡片只需要“引入组件 + 引入 createXxxData/Methods + 在模板编排 ref 与菜单项”。
（在此填写追问补充句，保持此段落位置不变）
---

## 对应代码（节选/伪码）
> 说明：以下代码可用真实代码节选或伪码；若过长可用 `...` 省略，但需保留前端相关结构完整（Vue/HTML/CSS/JS 关键骨架）。

### 1）关联文件定位（页面/组件/工具）
```text
页面（如有）：pages/translator/index.vue
组件：pages/translator/index.vue
相关：layouts/translator.vue
相关：utils/resource/index.js
相关：utils/resource/useTranslatorBasicInfo.js
相关：components/ResourceDetail/Cards/*.vue
```

### 2）组件入口：props / emits / data / computed / watch（节选）

文件：`pages/translator/index.vue`

```js
import {
  createTranslatorBasicInfoData,
  createTranslatorBasicInfoMethods,
  createOrderTimeData,
  createOrderTimeMethods,
  // ...
} from '~/utils/resource'

export default {
  layout: 'translator',
  data() {
    return {
      activeItem: 'basic',
      menuItems: [
        { key: 'basic', label: '基础信息', ref: 'basicRef' },
        // ...
      ],
      basicForm: this.$form.createForm(this),
      ...createTranslatorBasicInfoData(),
      ...createOrderTimeData(),
      // ...
    }
  },
  created() {
    this.basicInfoMethods = createTranslatorBasicInfoMethods(this, {
      onLoadSuccess: (resourceId) => this.loadAllModules(resourceId)
    })
  },
  methods: {
    saveBasicInfo() { return this.basicInfoMethods.saveBasicInfo() },
    // 其他卡片同理：saveXxx/cancelXxx/clearXxx/onXxxModeChange
  }
}
```

### 3）模板结构：view/edit（或 table/form）渲染策略（节选）

文件：`pages/translator/index.vue`

```vue
<div class="translator-page">
  <div class="sidebar">
    <div class="sidebar-menu">
      <div class="indicator" :style="{ transform: `translateY(${activeIndex * 40}px)` }" />
      <div v-for="item in menuItems" :key="item.key" class="menu-item" @click="scrollToSection(item.key)">
        {{ item.label }}
      </div>
    </div>
  </div>

  <div class="main-content">
    <div class="progress-section">
      <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }" />
    </div>

    <div class="cards-container">
      <div ref="basicRef" class="card-section">
        <basic-info-card
          :basic-info="basicInfo"
          :basic-info-editing="basicInfoEditing"
          :basic-form="basicForm"
          @save="saveBasicInfo"
          @cancel="cancelBasicInfo"
          @mode-change="onBasicInfoModeChange"
        />
      </div>
      <!-- 其他卡片同理 -->
    </div>
  </div>
</div>
```

### 4）关键交互与业务规则（节选）

文件：`utils/resource/useTranslatorBasicInfo.js`

```js
export function createTranslatorBasicInfoMethods(context) {
  return {
    async saveBasicInfo() {
      context.basicForm.validateFields(async (err, values) => {
        if (err) return context.$message.error(firstError(err) || '请检查表单填写')
        const payload = {
          translatorName: values.name,
          userEmail: values.email || '',
          username: values.loginAccount || '',
          phone: values.mobile || '',
          nationality: context.basicInfoEditing.country || '',
          country: context.basicInfoEditing.province || '',
          city: context.basicInfoEditing.city || ''
        }
        const res = await context.$http.post(path.translatorUpdateResourceBase, payload)
        if (res.errorCode === 200) {
          await this.loadBasicInfo()
          context.$refs.basicInfoCard?.setMode?.('view')
        }
      })
    }
  }
}
```

### 5）父子通信：父页 API 调用与局部刷新（如有）
文件：`pages/translator/index.vue`

```js
methods: {
  // 子卡片 emits 事件 -> 父页代理到模块方法
  saveBasicInfo() { return this.basicInfoMethods.saveBasicInfo() },

  // 目录点击 -> 父页滚动定位（子卡片只负责渲染）
  scrollToSection(key) {
    const item = this.menuItems.find(i => i.key === key)
    const el = this.$refs[item.ref]
    if (!el) return
    this.activeItem = key
    this.isScrolling = true
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => { this.isScrolling = false }, 400)
  }
}
```

### 6）样式：布局（grid/flex）+ 组件库样式覆盖（节选）

文件：`pages/translator/index.vue`

```scss
.translator-page {
  display: flex;
  gap: 20px;
}

.sidebar {
  width: 160px;
  position: sticky;
  top: 84px;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  min-width: 0;
}
```
