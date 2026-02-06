# 测试与工程化（Jest + vue-jest）实现详解（big-customer，面向面试）

> 目标：用“测试栈怎么配、怎么跑、覆盖率怎么统计、怎么写一个可维护的组件测试”的方式，总结本项目现有的 Jest 单测体系，并配对应代码摘录（含文件:行号）。

## 1. 一句话概括（面试开场）

本项目使用 **Jest + vue-jest + @vue/test-utils** 做 Vue/Nuxt 组件单测：通过 `jest.config.js` 配置 alias 映射、`.vue`/`.js` 的 transform，以及 coverage 统计范围；当前仓库内有一个示例测试 `test/Logo.spec.js`（`jest.config.js:1`、`test/Logo.spec.js:1`）。

## 2. 关键文件索引（面试官要“看代码”时直接指路）

- Jest 配置：`jest.config.js:1`
- Babel 测试环境配置：`.babelrc:1`
- 示例单测：`test/Logo.spec.js:1`
- npm test 入口：`package.json:16`

## 3. Jest 配置详解（你要能解释每一项为什么存在）

来源：`jest.config.js:1`

```js
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^vue$': 'vue/dist/vue.common.js'
  },
  moduleFileExtensions: ['js', 'vue', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '.*\\.(vue)$': 'vue-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/components/**/*.vue',
    '<rootDir>/pages/**/*.vue'
  ]
}
```

面试讲法：

- `moduleNameMapper`：
  - `@/` 与 `~/` 是 Nuxt 常用 alias，这里映射到 `<rootDir>`，保证测试里 `import Xxx from '@/components/...'` 能解析。
  - `^vue$ -> vue.common.js`：强制使用带 compiler 的构建（或兼容 Jest 环境下的 Vue 版本解析）。
- `transform`：
  - `babel-jest` 处理 `.js`（让你能用现代语法/按 `.babelrc` 编译）。
  - `vue-jest` 处理 `.vue` 单文件组件。
- `collectCoverageFrom`：
  - 覆盖率统计会包含 `components/` 与 `pages/` 下所有 `.vue`，即使没有写到测试里也会纳入统计（这会推动你补齐关键页面/组件测试）。

## 4. Babel（test 环境）为什么要配

来源：`.babelrc:1`

```json
{
  "env": {
    "test": {
      "presets": [
        ["@babel/preset-env", { "targets": { "node": "current" } }]
      ]
    }
  }
}
```

面试讲法：

- Jest 跑在 Node 环境；`targets.node = current` 可以让测试编译结果贴合当前 Node 版本，减少 polyfill 需求。

## 5. 现有示例测试怎么写（最小可运行范式）

来源：`test/Logo.spec.js:1`

```js
import { mount } from '@vue/test-utils'
import Logo from '@/components/Logo.vue'

describe('Logo', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(Logo)
    expect(wrapper.isVueInstance()).toBeTruthy()
  })
})
```

面试讲法：

- `mount` 会完整渲染组件（包含子组件）；如果只想测当前组件而不关心子组件，可以用 `shallowMount`。
- 这个用例属于“烟雾测试”（smoke test）：证明组件能被渲染，适合做最基础的回归保障。

## 6. 如何在本项目里写“更有价值”的单测（面试可回答的方法论）

建议优先覆盖三类组件/页面：

1) **纯展示组件**：断言渲染的文本/结构/props 驱动变化。  
2) **表单类组件**：断言校验提示、输入联动、提交 payload。  
3) **请求驱动页面（Nuxt 页面）**：把 `$http`/`$axios` mock 掉，断言“请求参数正确 + 成功/失败 UI 分支正确”。

对应本项目的典型 mock 点：

- mock `$http.get/post`（见 `plugins/http.js:59` 注入方式）
- mock Vuex store（`store/index.js:1`、`store/userinfo.js:1`）
- 对于使用 AntD/Element 的页面，必要时 stub 掉复杂组件（`stubs: { 'a-table': true }` 等）

## 7. 面试题库（Q&A 速记）

### Q1：为什么要用 vue-jest？

因为 Vue SFC（`.vue`）不是原生 JS，Jest 需要通过 transformer 把 template/script/style 转成可执行模块（`jest.config.js:8-11`）。

### Q2：你们怎么做 alias（@/~/）在测试里可用？

用 `moduleNameMapper` 映射到 `<rootDir>`（`jest.config.js:2-6`）。

### Q3：覆盖率配置会有什么副作用？

`collectCoverageFrom` 覆盖 `components` 与 `pages` 全量 `.vue`，即使没写测试也计入 denominator；优点是推动补测试，缺点是初期覆盖率可能很难看，需要分阶段推进（`jest.config.js:13-16`）。

## 8. 改进建议（面试加分项）

1) 补齐 Jest 的 `testEnvironment`、`setupFilesAfterEnv` 等（如果后续要用更多 DOM API/全局 mock，会更清晰）。  
2) 给 `$http` 提供可复用的 mock 工具（例如 `test/helpers/http-mock.js`），避免每个 spec 重复写 mock。  
3) 按模块补充“关键路径测试”：比如 translator 的订单/薪资页（`pages/translator/orders.vue:183`、`pages/translator/salary.vue:84`）可以做“请求成功/失败分支 + 参数拼装”的单测。  

