---
tags:
  - 前端
  - 八股
  - JavaScript
  - ES6
  - 异步
---

# JS

> 笔者将从以下方面展开JS八股的学习
>
> 1. 基本概念与数据类型
> 2. 异步编程与事件循环
> 3. 面向对象与原型系统
> 4. ES6核心特性
> 5. 浏览器环境与API
> 6. DOM/BOM与性能优化
> 7. 高级主题与安全

### 基本概念与数据类型
d
#### js底层是什么

* 不同的 JavaScript 引擎可能有不同的底层实现，但大多数主流引擎（如 V8）都使用 C/C++ 编写
* V8 引擎负责将 JavaScript 代码编译为机器码并执行
* JavaScript 的执行机制涉及即时编译（JIT），在运行时生成机器代码，而不是提前编译。这种机制使得 JavaScript 在运行时能够动态优化性能，而这些底层功能也是通过 C/C++ 实现的

#### JS数据类型和区别（必背）

1. 分为普通数据类型和引用数据类型
2. 普通数据类型包括Numer、String、BIgint、Boolean、symbol、undefined、null；

引用数据类型object（对象、普通数组、日期、函数、正则表达式）

3. 普通数据类型： 栈内存、直接存储数据值、赋值时复制数据值、比较时比较数据值

引用数据类型:堆内存、存储指针、赋值时赋值指针、比较时比较指针地址

4. symbol：唯一不可变	通常用作对象的键	无法通过for in或者Object.keys（）

需要使用Object.getOwnPropertySymbols

5. bigint ：构造函数/n   不能与numer混用	需要显示转换

#### JS最大安全整数

在JavaScript中，数字类型是基于IEEE 754标准的双精度浮点数，这导致整数表示存在一个安全范围

1. **什么是最大安全整数？**

JavaScript中的最大安全整数是**9007199254740991**（即2⁵³ - 1），可以通过`Number.MAX_SAFE_INTEGER`访问。

2. **为什么存在安全整数限制？**

JavaScript使用64位双精度浮点数表示所有数字：

* 1位符号位
* 11位指数位
* 52位尾数位

整数范围受限于尾数位的精度：

* 最大安全整数：2⁵³ - 1 = 9007199254740991
* 最小安全整数：-9007199254740991

3. **安全整数范围测试**

```javascript
// 安全范围内的整数
console.log(Number.isSafeInteger(42)); // true
console.log(Number.isSafeInteger(9007199254740991)); // true

// 安全范围外的整数
console.log(Number.isSafeInteger(9007199254740992)); // false
console.log(Number.isSafeInteger(-9007199254740992)); // false

```

4. **超出安全范围的后果**

当整数超出安全范围时，会出现精度丢失、计算错误、不可预测行为

5. **最佳实践**

***处理ID时**：优先使用字符串而非数字
***金融计算时**：使用专门库如decimal.js
***大整数运算时**：使用BigInt类型
***时间戳处理时**：确保在安全范围内
***API设计时**：避免返回超出安全范围的整数

#### ==的类型转换

1. **字符串与数字**：字符串会尝试被转换为数字后再进行比较。

```javascript
'123' == 123; // true，字符串 '123' 转换为数字 123
'  123  ' == 123; // true，字符串两端空格会被忽略
'hello' == 123; // false，'hello' 转换为 NaN，NaN 不等于任何值

```

2. **布尔值与非布尔值**：布尔值先被转换为数字（`true`转为 `1`，`false`转为 `0`），然后再进行比较。

```javascript
true == 1;  // true，true 转换为 1
false == 0; // true，false 转换为 0
true == 2;  // false，1 != 2

```

3. **对象与原始值**：对象会通过调用自身的 `valueOf()`或 `toString()`方法尝试转换为原始值，然后再进行比较。

```javascript
[1, 2, 3] == '1,2,3'; // true，数组调用 toString() 转换为字符串
const obj = { valueOf: () => 42 };
obj == 42; // true，对象通过 valueOf() 转换为数字 42

```

4. `null`**和 **`undefined`：在 `==`比较中，`null`和 `undefined`相互相等，并且不等于其他任何值（除了彼此）

```javascript
null == undefined; // true
null == 0;        // false
undefined == '';  // false

```

5. `NaN`：`NaN`与任何值比较（包括自己）都返回 `false`

```javascript
NaN == NaN; // false
NaN == 42;  // false

```

`==`**的常见“陷阱”**

由于隐式类型转换规则复杂，`==`可能导致一些反直觉的结果：

```javascript
'' == '0';          // false，同为字符串，直接比较值，显然不同
0 == '';            // true，空字符串转换为数字 0
0 == '0';           // true，字符串 '0' 转换为数字 0

false == 'false';   // false，字符串 'false' 转换为 NaN，false 转换为 0，NaN != 0
false == '0';       // true，字符串 '0' 转换为数字 0，false 转换为 0

[] == ![];          // true，![] 是 false (对象 true，取反为 false)，然后 false 转换为 0，空数组通过 valueOf/toString 转换为空字符串，空字符串再转换为 0，所以 0 == 0
[] == 0;            // true，空数组转换为数字 0
[''] == '';         // true，数组['']通过 toString() 转换为空字符串

```

#### null和undefined（必背）

1. undefined：

* 含义：变量未定义或者未初始化、typeof值为undefined、未赋值默认为undefined
* \==比较：undefined == null 为 true
* 用法：函数未赋值/函数形参未传递实参/函数无返回值/访问不存在的场景

2. null：

* 含义：对象为空或显示释放对象、typeof值为Object、显示赋值、
* \===比较：undefined == null为false
* 用法：对象为空或者释放对象。

3. \==会进行类型转换  ===不会进行类型转换
4. 底层数据类型以二进制形式表示 000 null实际是Null类型的唯一值，而不是object
5. 使用null使变量变成游离状态，不再引用任何对象，等待垃圾回收器回收

#### 总结对比表 (LEGO 项目视角)

| 特性           | Undefined (在 LEGO 中)                            | Null (在 LEGO 中)                                   |
| :------------- | :------------------------------------------------ | :-------------------------------------------------- |
| **典型场景**   | 可选属性 (`copiedComponent?`)、函数缺省参         | DOM Ref (`elementRef.value`)、状态重置              |
| **语义**       | "还没定义" 或 "缺席"                              | "定义了，但是具体的空值"                            |
| **Typeof**     | `'undefined'`                                     | `'object'` (注意这是 JS 的历史遗留 Bug)             |
| **JSON序列化** | `JSON.stringify({a: undefined})` -> `{}` (被忽略) | `JSON.stringify({a: null})` -> `{"a": null}` (保留) |

#### weakmap、map、obj 介绍与区别（必背）

1. 在JavaScript中，`WeakMap`、`Map` 和普通对象（`obj`）都是用于存储键值对的数据结构
2. **Map**

* 键的范围不限于字符串或符号，可以是任何类型的数据。
* 保持键值对的插入顺序。
* 有迭代器，可以直接进行迭代。
* 可以很容易地获取大小（键值对的数量）。
* 键的相等性基于`===`，即严格相等。

3. **WeakMap**

* 键必须是对象，不能是原始数据类型。
* 键对对象的引用是弱引用，这意味着如果键对象没有被其他地方引用，垃圾回收机制可以回收它，即使它被用作`WeakMap`的键。
* 没有`size`属性，无法获取`WeakMap`的大小。
* 不可迭代，没有提供迭代器。
* 没有`clear`方法。

4. **普通对象（obj）**

* 键只能是字符串或符号，如果使用其他类型的值作为键，它们会被转换为字符串。
* 不保持插入顺序
* 不提供迭代器，不能直接迭代对象的键值对
* 没有直接的方法来获取对象的大小

5. **结合 LEGO 项目的应用与思考**

* **普通对象 (Obj) 的应用**：
  * 在 `editor.ts` 中，`ComponentData` 的 `props` 属性（如 `textDefaultProps`）就是一个典型的普通对象。
  * **原因**：我们需要将画布数据保存到后端，普通对象可以被直接 `JSON.stringify` 序列化，而 `Map` 和 `WeakMap` 不能被直接序列化。
  * **场景**：存储组件属性 (`props`)、页面设置 (`page.setting`) 等配置信息。

* **Map 的潜在应用 (优化思路)**：
  * 目前 `editor.ts` 中使用 `components` 数组存储所有组件，查找特定 ID 组件时使用 `find` 方法（`O(n)` 复杂度）。
  * **优化**：如果我们有成千上万个图层，可以使用 `Map<string, ComponentData>` 来存储组件，以 ID 为键。这样查找组件的复杂度由 `O(n)` 降低为 `O(1)`。
  * **代价**：需要手动处理序列化（转为数组保存）和反序列化。

* **WeakMap 的底层应用**：
  * 虽然我们在业务代码中没有直接使用 `new WeakMap`，但这正是 LEGO 项目核心框架 Vue 3 的基石。
  * **原理**：Vue 3 的响应式系统 (`reactive`) 内部使用 `WeakMap` 来存储 `target` (原始对象) 到 `depsMap` (依赖集合) 的映射。
  * **优势**：当组件销毁（如删除图层）时，对应的响应式对象如果没有其他引用，会自动被垃圾回收，避免了内存泄漏。

#### 判断变量类型（必背）

| typeof                             | 无法判断引用数据类型                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| instanceof                         | 无法检测基本数据类型、对于夸框架的对象检测不准确                                                        |
| Obejct.prototype.toString().call() | 最精准、可以判断任何数据类型                                                                            |
| constructor                        | 访问实例的构造函数判断其与某个类是否相同 无法访问null或者undefined/如果原型链被修改，可能导致判断不准确 |

**LEGO 项目应用场景**：

* **typeof**：
  * 在 `helper.ts` 的 `getImageDimensions` 中，通过 `typeof url === 'string'` 判断传入的是图片 URL 还是 `File` 对象。
  * 在 `editor.ts` 的 `updateComponent` 中，用于判断 `key` 和 `value` 是否为简单的 `string` 类型。
* **instanceof**：
  * 在 `Uploader.vue` 中，利用 `result instanceof Promise` 判断图片上传前的校验钩子 (`beforeUpload`) 返回的是布尔值还是 Promise，从而支持异步校验。
  * 在 `helper.ts` 的 `uploadFile` 中，判断 `file` 是否为 `File` 实例，若不是则包装成 `new File()`。
* **Object.prototype.toString.call()**：
  * 项目中广泛使用的 `lodash-es` 库中的 `cloneDeep`（用于撤销重做、组件复制等逻辑）底层正是通过该方法精准识别 `Array`、`Date` 等类型以实现正确的深拷贝。

#### 数组去重（必背）

1. 遍历数组，利用对象的唯一性来去重
2. 利用set去重   代码简洁、效率高、适合现代浏览器环境
3. 利用filter和indexOf去重
4. 利用双指针去重
5. 利用reduce+includes
6. 对象属性、set>filter+indexOf>双指针>reduce+includes

**LEGO 项目应用场景**：

*   **唯一分类提取 (Set)**：
    *   **场景**：在首页模板列表中，如果需要提取所有模板的 `category` 属性用于生成顶部的过滤 Tab Bar。
    *   **实现**：`const categories = [...new Set(testData.map(item => item.category))]`。这是 `Set` 最典型的用法，代码极其简洁且性能优异。
*   **组件属性渲染 (Object Key)**：
    *   **场景**：在 `PropsTable.vue` 中，我们需要将组件的原始 `props` 转换为对应的表单配置。
    *   **实现**：利用 `reduce` 遍历属性，并将结果存入对象的 Key 中（`result[newKey] = newItem`）。这无意识中利用了**对象属性的唯一性**，确保了每一个组件属性（如 `fontSize`）只会被渲染成一个编辑项。
*   **多选组件合并 (filter + indexOf)**：
    *   **场景**：假设未来支持多选图层，当用户按住 `Shift` 连续点击图层时，我们会将新 ID 加入 `selectedIds` 数组。
    *   **实现**：在加入前需要判断 `indexOf` 是否为 -1，或者在操作完成后统一用 `filter` 去重，确保选中的 ID 不会重复。
*   **面试加分点**：
    *   在项目中，如果遇到**复杂对象数组**（如根据 `id` 去重组件对象列表），简单的 `Set` 无法直接生效，此时通常会结合 `reduce` 配合一个辅助的 `Map` 或对象来手动实现根据特定字段去重。

#### 数组和伪数组区别（必背）

1. **数组 (Array)**：`typeof` 值为 `'object'`，但 `Array.isArray()` 返回 `true`。长度可变，可以使用所有数组方法（`push`, `map`, `filter` 等），可以使用 `for...of` 和 `forEach` 遍历。
2. **伪数组 (Array-like)**：`typeof` 值为 `'object'`，不能通过 `Array.isArray()` 校验。拥有 `length` 属性和索引，但不能直接使用数组原型方法。常见的伪数组有：`arguments`、`NodeList`、`FileList`、`HTMLCollection`。

**将伪数组转换为数组时：**

* **现代推荐**：`Array.from(pseudoArray)` 或 `[...pseudoArray]`（展开运算符）。
* **传统方法**：`Array.prototype.slice.call(pseudoArray)` 或 `[].slice.call(pseudoArray)`。
* **特性**：长度由 `length` 决定，如果索引不连续，转换后会补位生成连续数组。

**LEGO 项目实战场景：**

* **文件上传 (`Uploader.vue`)**：
  * **场景**：在图片上传组件中，通过 `e.target.files` 获取到的文件列表是一个 `FileList` 对象，它是一个典型的**伪数组**。
  * **应用**：虽然我们可以通过 `files[0]` 获取单个文件，但如果需要对多个文件进行过滤（`filter`）或转换格式（`map`），必须先使用 `Array.from(files)`。
* **DOM 节点操作**：
  * **场景**：在使用原生 DOM API（如集成第三方库或极致性能优化）时，`document.querySelectorAll('.layer-item')` 返回的是 `NodeList`。
  * **应用**：若要对获取到的图层 DOM 元素进行链式操作（如批量修改样式后返回新数组），需要转换：`[...nodes].filter(el => el.classList.contains('active'))`。
* **函数参数处理**：
  * **场景**：在一些高度抽象的工具函数中，如果需要处理不确定数量的参数且未使用 ES6 剩余参数（`...args`），则会用到 `arguments`。
  * **应用**：通过 `Array.prototype.slice.call(arguments)` 将其转为数组，以便利用数组方法进行逻辑归纳。

#### map和foreach（必背）

| 特性               | **map**                                                       | **forEach**                                                                    |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **返回值**         | 返回一个**新数组**，包含处理后的元素                          | 返回 `undefined`                                                               |
| **是否修改原数组** | **不修改**原数组                                              | **不直接修改**。但可通过回调函数内的操作（如通过索引或修改对象属性）改变原数组 |
| **主要用途**       | **数据转换/映射**：基于原数组生成新结构的数据                 | **执行操作/副作用**：遍历数组并对每个元素执行操作，如打印、DOM操作、API调用等  |
| **链式调用**       | **支持**。因为它返回数组，可继续调用 `filter`、`reduce`等方法 | **不支持**。因为它返回 `undefined`                                             |
| **性能特点**       | 由于需要创建并返回新数组，在**处理大数据集时相对稍慢**        | 不创建新数组，**性能相对快一点**                                               |

**LEGO 项目应用场景：**

*   **数据结构转换 (Map)**：
    *   **代码示例**：在 `propsMap.tsx` 中，通过 `fontFamilyArr.map(font => { ... })` 将简单的字符串数组转换为 Ant Design Select 组件所需的 `Option` 对象数组。
    *   **核心意图**：**“我要一个新形态的数据”**。在编辑器中，所有的模板展示、组件列表渲染逻辑几乎都离不开 `map`。
*   **批量异步任务 (forEach)**：
    *   **代码示例**：在 `Uploader.vue` 中，执行 `filesList.value.forEach(readyFile => postFile(readyFile))`。
    *   **核心意图**：**“我要对每一项做个操作”**。这里不是为了得到新数组，而是触发上传接口（副作用）。
*   **组件全局注册**：
    *   **代码示例**：在 `configAntD.ts` 中，使用 `components.forEach(component => app.use(component))` 循环注册 Ant Design 的组件。
    *   **核心意图**：利用 `forEach` 简洁地遍历数组并执行配置操作。

**面试核心避坑点：**
1.  **不要在 `map` 里写副作用**（如修改全局变量或发送请求），如果不需要返回值，请使用 `forEach`。
2.  **`forEach` 不支持 `break` 或 `continue`**，如果需要提前退出循环，请使用 `for...of` 或 `some()` / `every()`。

#### 闭包（必背）

1. 含义：一个函数和其词法环境的引用绑定在一起，使得函数可以访问外部作用域的变量，即使这个函数在其外部作用域之外执行
2. 形成原因：作用域链
3. 作用：延长了局部变量的作用周期、在函数外部访问内部的局部变量
4. 影响：容易造成 内存泄露、内存溢出
5. 使用场景：模仿块级作用域（es6之前没有块级作用域）、实现柯里化（将一个多参数函数转换一系列单参数函数）、在构造函数中定义特权方法（访问私有变量）、Vue实现数据响应式监听

#### 闭包的缺陷（必背）

| **缺陷类型**   | **问题描述**                   | **解决方式**                    |
| :------------- | :----------------------------- | :------------------------------ |
| 内存泄漏       | 保留不必要的引用导致内存不释放 | 及时释放引用、避免大对象保留    |
| 性能问题       | 频繁创建闭包影响性能           | 减少闭包数量、使用 let 替代 var |
| 调试困难       | 作用域变量难以追踪             | 使用调试工具、合理结构设计      |
| 作用域污染     | 全局变量被错误使用             | 使用模块化、IIFE 隔离作用域     |
| 变量共享问题   | 循环中闭包共享变量导致错误值   | 使用 let、IIFE、立即绑定变量    |
| 可读性与维护性 | 闭包嵌套复杂，难以理解         | 简化逻辑、合理封装              |

#### 如何消除闭包（必背）

1. **使用WeakMap或WeakSet**：这些数据结构允许存储对象引用，但不会阻止垃圾回收。当对象不再被其他地方引用时，可以被回收。不过这种方法需要手动管理，可能比较复杂
2. **手动销毁闭包**：如果闭包是某个对象的属性或方法，可以通过删除对象属性或替换方法来销毁闭包。例如，将对象上的方法设置为null
3. **利用函数的作用域**：在闭包内部定义一个清理函数，当需要清除时调用这个函数，手动释放资源

| **方法**           | **适用场景**         | **优点**           | **缺点**               |
| :----------------- | :------------------- | :----------------- | :--------------------- |
| 解除引用           | 简单闭包，无复杂依赖 | 直接、高效         | 需手动调用             |
| 显式销毁方法       | 需控制资源释放的时机 | 灵活、可控         | 需在闭包中设计销毁接口 |
| `Symbol`/`WeakMap` | 私有属性管理         | 非强引用、安全访问 | 需额外维护映射关系     |

**LEGO 项目应用场景：**

*   **Vue 3 Composition API (`setup`)**：
    *   **场景**：在 `Editor.vue` 的 `setup` 函数中，定义的所有方法（如 `addItem`, `setActive`）都是闭包。它们捕获了外部定义的 `store`、`route` 和各种 `ref` 响应式变量。
    *   **原理**：虽然 `setup` 只执行一次，但返回的方法会在组件的整个生命周期内持有这些引用。这是 Vue 3 开发中最核心的闭包实践。
*   **工具函数处理 (`helper.ts`)**：
    *   **场景**：`getImageDimensions` 函数返回一个 `Promise`。`resolve` 和 `reject` 被传给 `img.onload` 回调，这形成了一个闭包，使得异步加载完成后仍能正确触发 Promise 状态变更。
*   **资源手动清理 (防止泄漏)**：
    *   **代码示例**：在 `helper.ts` 的 `downloadFile` 函数中，使用 `URL.createObjectURL` 创建了临时链接后，紧接着通过 `setTimeout(() => { URL.revokeObjectURL(link.href)}, 10000)` 手动释放内存。
    *   **价值**：这是**消除闭包负面影响**的典型做法。如果不手动 revoke，浏览器会一直保留由于闭包引用的 Blob 数据，直到页面关闭，导致内存占用持续上升。

**面试加分点：**
*   在 Vue 3 中，大部分闭包的生命周期是跟随组件的。组件卸载时，Vue 内部会自动处理依赖收集的清理。但如果是通过 `document.addEventListener` 手动绑定的闭包（如热键），必须在 `onUnmounted` 中通过 `removeEventListener` 手动解绑，否则会造成严重的内存泄漏。

#### 一个页面上怎么检查有没有内存溢出的风险

* 使用浏览器的开发者工具*

Chrome DevTools

***Memory 面板**：这是检测内存泄漏的主要工具。你可以通过以下步骤使用它：
  * 打开 Chrome DevTools（F12 或右键页面选择“检查”）。
  * 导航到 **Memory** 面板。
  * 点击 **“Record”** 按钮开始记录内存使用情况。
  * 执行可能导致内存泄漏的操作（如打开和关闭弹窗）。
  * 再次点击 **“Record”** 停止记录。
  * 查看内存图表，观察内存使用情况。如果内存下限（即常驻内存）不断上升，可能表明存在内存泄漏。

* 使用 JavaScript 内存泄漏检测工具*

**HeapDump**

***heapdump** 是一个 Node.js 模块，可以生成内存快照并保存为文件，供后续分析。
***使用方法**：
  * 安装 heapdump：`npm install heapdump`
  * 在代码中引入 heapdump 并生成快照。
  * 使用 Chrome DevTools 或其他工具分析生成的快照文件。

* 使用静态代码分析工具*

**ESLint**

***ESLint** 是一个 JavaScript 代码静态分析工具，可以检测潜在的内存泄漏问题。
***配置规则**：
  * 配置 ESLint 规则，检测未清理的定时器、事件监听器、闭包等。
  * 例如，配置 `no-unused-vars` 和 `no-undef` 规则，确保代码中没有未使用的变量或未定义的变量。

* 使用性能分析工具*

**Performance 面板**

***Performance 面板** 是 Chrome DevTools 中的一个工具，可以记录和分析页面的性能数据。
***使用方法**：
  * 打开 Performance 面板。
  * 点击 **“Record”** 按钮开始记录。
  * 执行操作后，停止记录。
  * 查看性能数据，分析内存使用情况。

Flame Chart

***Flame Chart** 是 Performance 面板中的一个视图，可以显示函数调用的时间线和内存分配情况。
***使用方法**：
  * 在 Performance 面板中，选择 **Flame Chart** 视图。
  * 分析函数调用的时间线，识别可能导致内存泄漏的函数。

* 使用内存泄漏检测工具*

sIEve

***sIEve** 是一个专门用于检测 Internet Explorer 内存泄漏的工具，可以监控 DOM 对象的引用数目。
***使用方法**：
  * 下载并运行 sIEve。
  * 访问需要测试的网页。
  * 查看 sIEve 的输出，识别泄漏的 DOM 对象。

#### 什么是作用域（选背）

1. 作用域是一个变量或函数的可访问范围，作用域控制着变量或函数的可见性和生命周期
2. **全局作用域**：可以全局访问

* 最外层函数和最外层定义的变量拥有全局作用域
* window上的对象属性方法拥有全局作用域
* 为定义直接复制的变量自动申明拥有全局作用域
* 过多的全局作用域变量会导致变量全局污染，命名冲突

3. **函数作用域**：只能在函数中访问使用哦

* 在函数中定义的变量，都只能在内部使用，外部无法访问
* 内层作用域可以访问外层，外层不能访问内层作用域

4. **ES6中的块级作用域**：只在代码块中访问使用

* 使用ES6中新增的let、const声明的变量，具备块级作用域，块级作用域可以在函数中创建（由{}包裹的代码都是块级作用域）
* let、const申明的变量不会变量提升，const也不能重复申明

5. 块级作用域主要用来解决由变量提升导致的变量覆盖问题

**LEGO 项目实战场景：**
* **全局作用域**：在 `index.html` 中通过 `<script>` 引入的全局库，或 `window.config` 等全局配置。
* **函数作用域**：`setup()` 函数内部。在 `Editor.vue` 的 `setup` 中定义的变量 `currentWorkId` 在函数外部无法直接访问。
* **块级作用域**：在 `onMounted` 钩子内部的 `if` 分支中定义局部常量。

#### 什么是作用域链（必背）

1. 作用域链是 JavaScript 中用于查找变量和函数的一种机制
2. 作用域链是由当前执行环境中的变量对象以及其父级执行环境的变量对象组成的。当代码在一个执行环境中执行时，如果需要访问一个变量或者函数，JavaScript 引擎会首先在当前执行环境的变量对象中查找，如果找不到，它会向上一级的执行环境中查找，直到找到对应的变量或者函数，或者达到全局执行环境为止。
3. 作用域链的形成是由函数定义时的位置来决定的，而不是函数调用时的位置。这意味着函数的作用域链是在函数定义时确定的，而不是在函数调用时确定的。
4. 作用域链的重要性在于它决定了变量和函数的访问权限。一个变量或者函数能否在当前执行环境中被访问到，取决于它是否在当前执行环境的作用域链上。

**LEGO 项目实战案例 (`Editor.vue`)**：
在编辑器核心逻辑中，作用域链是代码组织的基础：
```typescript
// 1. 全局作用域: 包含导入的 Hooks
export default defineComponent({
  setup() {
    // 2. setup 函数作用域: 定义了变量 store
    const store = useStore()
    
    const addItem = (component: any) => {
      // 3. addItem 内部作用域: 
      // 通过作用域链向上查找到 setup 作用域中的 store
      store.commit('addComponent', component)
    }
    return { addItem }
  }
})
```
**面试加分点**：
* **词法作用域**：作用域链在代码**定义时**就确定了。例如 `addItem` 永远能访问到其定义环境 `setup` 中的变量。
* **性能优化**：变量层级越深查找越慢。在高频循环中，建议将深层变量缓存到局部作用域以提高查询效率。

#### JS变量提升（必背）

1. 使用var声明的变量和函数会在执行前被提升到作用域的顶部  赋值不会提升 函数声明>变量声明
2. let和const声明的变量也会被提升，但不会初始化  变量初始化之前访问会爆出ReferenceError,形成TDZ暂时性死区

#### 真假值的隐式转换

1. **JavaScript 中的假值**

这是最需要牢记的部分，因为假值的数量是**有限的**。只要记住这几个，剩下的所有值都是真值。

JavaScript 中只有 **7 个**假值：

* `false`: 布尔值 `false` 本身。
* `0`: 数字零。包括 `+0` 和 `-0`。
* `-0`: 负零。虽然在数学上 `0` 和 `-0` 相等，但它们在 JavaScript 内部是不同的值，不过都属于假值。
* `0n`: BigInt 零。这是 ES2020 引入的新类型。
* `""`, `''`, `**`**\`: 空字符串。长度为 0 的字符串。
* `null`: 表示“空”或“无值”的特殊关键字。
* `undefined`: 表示变量已声明但未赋值，或对象属性不存在的特殊关键字。
* `NaN`: 表示“不是一个数字”（Not-a-Number）的特殊数字值。这是一个非常容易混淆的假值！

**重要提示：** **所有不在这个列表里的值，都是真值。**

2. **常见的真值（举几个例子）**

为了加深理解，我们来看一些典型的真值：

***非零数字**: `1`, `-1`, `3.14`, `Infinity`, `-Infinity`
***非空字符串**: `"0"`, `"false"`, `" "`, `"hello"` (注意：`"0"` 和 `"false"` 作为字符串是真值！)
***所有对象**: `{}`, `[]`, `new Date()`, `/regex/`
***所有数组**: `[]` (空数组是真值！这是最常见的坑之一)
***函数**: `function() {}`
***Symbol**: `Symbol()`

#### 严格模式是什么?

JavaScript 的严格模式（Strict Mode）是一种在更严格的条件下执行代码的模式，通过在脚本或函数开头添加 `"use strict"` 指令启用。它并非语句，而是一种字面量声明，旨在强化语法规则、提高代码质量并减少潜在错误。

**严格模式的主要特点**

1. **语法错误检查更严格**\
   严格模式会捕获一些常见的编码错误，例如：
   * 禁止使用未声明的变量（直接抛出 `ReferenceError`）。
   * 禁止对只读属性（如 `undefined`、`NaN`）赋值。
   * 禁止删除不可删除的属性（如 `delete Object.prototype`）。
2. **消除不安全操作**
   * 禁止使用 `with` 语句（因其可能导致作用域混乱）。
   * 禁止 `eval` 和 `arguments` 的特殊行为（如修改 `eval` 或 `arguments` 的值）。
3. **优化性能**\
   严格模式下的代码更易于 JavaScript 引擎优化，因为某些不安全或模糊的行为被禁止，引擎可以更高效地执行代码。

**启用方式**

***全局启用**：在脚本文件顶部添加 `"use strict"`，整个脚本将按严格模式执行。

```javascript
"use strict";
// 此处代码均为严格模式

```

***函数级启用**：在函数体内第一行添加 `"use strict"`，仅该函数生效。

```javascript
function strictFunction() {
  "use strict";
  // 仅此函数为严格模式
}

```

**严格模式的优势**

***提升代码健壮性**：通过早期暴露错误，减少运行时隐患。
***兼容未来标准**：严格模式的部分规则（如禁止 `arguments.callee`）为后续 ECMAScript 版本铺路。\
  严格模式是现代 JavaScript 开发的推荐实践，尤其适用于大型项目或需要高可靠性的场景。

#### js对象中，可枚举性是什么?

可枚举性(enumerable)用来控制所描述的属性，是否将被包括在for.in循环之中(除非属性名是一个Symbol)。具体来说，如果一个属性的enumerable为false，下面三个操作不会取到该属性。

* for..in循环
* Object.keys方法
* JSON.stringify方法

```javascript
var o = {a:1,b:2 };
o.c=3;
Object.defineProperty(o,"d",{
  value:4,
  enumerable:false,
});
o.d;
// 4
for(var key ino)console.log(o[key]);
// 1
// 2
// 3
Object.keys(o);//["a","b”,"c”]
JSON.stringify(o); //=>"{a:1,b:2,c:3}

```

上面代码中，d属性的enumerable为false，所以一般的遍历操作都无法获取该属性，使得它有点像"秘密”属性，但还是可以直接获取它的值。

至于fo..in循环和Object.keys方法的区别，在于前者包括对象继承自原型对象的属性，而后者只包括对象本身的属性。如果需要获取对象自身的所有属性，不管enumerable的值，可以使用Object.getOwnPropertyNames方法可枚举属性是指那些内部“可枚举” 标志设置为 true 的属性。对于通过直接的赋值和属性初始化的属性，该标识值默认为即为 true。但是对于通过 Object.defineProperty 等定义的属性，该标识值默认为 false。

**LEGO 项目实战理解：**

*   **数据纯净度保障**：在乐高编辑器中，组件对象（`ComponentData`）在被 Vue 响应式后，内部会多出许多框架自带的标记属性（如 `__v_raw`）。通过将这些属性设为“不可枚举”，可以确保我们在调用 `JSON.stringify(component)` 进行保存操作时，生成的 JSON 字符串**只包含**我们定义的 `props`、`name` 等业务字段，而不会混入繁杂的框架内部标记，确保了前后端交互数据的洁净。
*   **隐藏内部状态**：如果我们需要在图层对象上临时挂载一个不可序列化的复杂对象（如一个 DOM 节点的原始引用，用于做辅助计算），通过 `enumerable: false`，可以防止这些非 JSON 安全的数据在循环遍历或打印日志时造成干扰或报错。
*   **面试避坑点**：
    *   通过 `obj.prop = value` 的方式定义的属性默认是**可枚可写可删**的。
    *   如果你在面试中被问到“如何让一个属性在 `Object.keys()` 中消失但依然可以访问”，答案就是设置 `enumerable: false`。

#### 判断数组的方式（必背）

1. 通过Object.prototype.toString.call()做判断 `Object.prototype.toString.call(obj).slice(8,-1) === 'Array'`;
2. 通过原型链做判断 `obj.__proto__ === Array.prototype`;
3. 通过ES6的Array.isArray()做判断 `Array.isArray(obj)`;
4. 通过instanceof做判断 `obj instanceof Array`

**深度解析与区别：**
*   **`Array.isArray()`**：**项目首选**。语法简洁，且能跨 `iframe` 正确识别数组，是现代开发的标准。
*   **`Object.prototype.toString.call()`**：**最稳健**。它是 JS 底层最可靠的类型识别方案，返回 `[object Array]`，常用于编写底层通用库。
*   **`instanceof`**：**原理性检查**。检查构造函数的 `prototype` 是否出现在对象的原型链上。缺点是在多窗口（multi-window/iframe）环境下会失效。
*   **`__proto__`**：**理解原型链**。直接对比原型对象。缺点是原型可被篡改，且 `__proto__` 非标准属性，生产环境严禁使用。

**LEGO 项目实战案例：**

*   **多属性批量更新 (`editor.ts`)**：
    *   **场景**：在编辑器中，有些操作（如“重置大小”）需要同时修改 `width` 和 `height`。我们的 `updateComponent` 指令支持传入单个字符串或字符串数组。
    *   **应用**：代码中通过 `Array.isArray(key)` 来实现分流逻辑。如果是数组，则启用 `map` 循环处理；如果是字符串，则走单值更新流程。这保证了底层接口的**高度灵活和复用性**。
*   **撤销重做逻辑**：
    *   **场景**：在记录操作历史（History）时，我们需要存储属性的旧值。
    *   **应用**：通过判断 `key` 是否为数组，决定是缓存单变量值还是缓存一个值的数组快照，确保撤销操作时数据结构的严格一致。

#### 伪数组转化成数组（必背）

1. **ES6 展开运算符**：`[...arrayLike]` （最推荐，代码最简洁）
2. **`Array.from()`**：`Array.from(arrayLike)` （最语义化，且能处理没有 `iterator` 接口但有 `length` 的对象）
3. **借用 `slice` 方法**：`Array.prototype.slice.call(arrayLike)`
4. **借用 `splice` 方法**：`Array.prototype.splice.call(arrayLike, 0)`
5. **借用 `concat` 方法**：`Array.prototype.concat.apply([], arrayLike)`

**LEGO 项目实战案例：**

*   **多文件批量预处理 (`Uploader.vue`)**：
    *   **场景**：用户多选图片上传时，`input.files` 返回的是一个 **`FileList`**（伪数组）。
    *   **应用**：如果我们需要对这些文件先进行过大的文件过滤（`filter`）或者批量计算尺寸，就必须先转换。
    *   **代码实战**：`const files = [...e.target.files];` 转换后即可流畅使用 `files.forEach` 或 `files.filter` 等 ES6 数组方法。
*   **编辑器批量图层操作**：
    *   **场景**：虽然项目主要使用数据驱动（Vue），但在某些原生交互插件中（如热键逻辑），如果使用 `document.querySelectorAll` 获取了一组 DOM 节点。
    *   **应用**：通过 `Array.from(nodes)` 转换后，可以方便地利用 `map` 将 DOM 节点转换为对应的属性 ID 集合，进行后续的业务处理。

**面试核心提示：**
*   **展开运算符 vs Array.from**：展开运算符要求对象必须是 **可迭代的 (Iterable)**；而 `Array.from` 更强大，只要对象有 `length` 属性就能转。在 LEGO 项目这类现代 TS/JS 环境中，直接用这两种方式即可，不需要再用旧式的 `call/apply` 方法。

#### 深拷贝浅拷贝的方法（必背）

**一、核心区别**

| **特性**     | **浅拷贝**                      | **深拷贝**                         |
| :----------- | :------------------------------ | :--------------------------------- |
| **复制内容** | 复制引用（指向同一内存地址）    | 复制实际值（独立内存地址）         |
| **适用场景** | 简单对象/数组，无需修改嵌套数据 | 复杂对象/数组，需完全独立副本      |
| **性能**     | 高效（仅复制引用）              | 低效（需递归复制所有嵌套内容）     |
| **实现方式** | `Object.assign()`、展开运算符等 | 递归拷贝、`JSON.parse()`、第三方库 |

---

**二、浅拷贝方法**

**1. 使用 **`Object.assign()`

```javascript
const original = { a: 1, b: { c: 2 } };
const shallowCopy = Object.assign({}, original);

```

• **特点**：

• 复制 `original` 的所有**顶层属性**。

• 对象 `b` 仍为引用，修改 `shallowCopy.b.c` 会影响 `original.b.c`。

**2. 展开运算符（ES6+）**

```javascript
const shallowCopy = { ...original };

```

• **特点**：

• 语法更简洁，功能与 `Object.assign()` 一致。

• 支持数组浅拷贝：`const shallowArray = [...array];`

**3. **`slice()`** / **`concat()`**（数组专用）**

```javascript
const array = [1, 2, 3];
const shallowArray = array.slice(); // 或 array.concat([]);

```

---

**三、深拷贝方法**

**1. 递归拷贝（手动实现）**

```javascript
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj; // 基础类型直接返回
  }
  const copy = Array.isArray(obj) ? [] : {}; // 判断数组或对象
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepCopy(obj[key]); // 递归调用
    }
  }
  return copy;
}

const original = { a: 1, b: { c: 2 } };
const deepCopy = deepCopy(original);

```

• **特点**：

• 完全独立副本，修改嵌套数据不会互相影响。

• 需手动处理所有嵌套层级，复杂对象可能遗漏某些属性（如 `Symbol`）。

**2. **`JSON.parse()`**（简单场景）**

```javascript
const original = { a: 1, b: { c: 2 } };
const deepCopy = JSON.parse(JSON.stringify(original));

```

• **特点**：

• **局限性**：

◦ 丢失函数、`undefined`、`Symbol` 等类型。

◦ 无法处理循环引用（会抛出 `RangeError`）。

• 适用于纯 JSON 格式的数据。

**3. 使用第三方库**

• **Lodash** 的 `cloneDeep()`：

```javascript
import _ from 'lodash';
const deepCopy = _.cloneDeep(original);

```

• **优势**：

• 处理复杂对象更可靠（支持函数、递归引用等）。

• 性能优化（缓存机制）。

---

**四、总结**

| **方法**         | **代码示例**                           | **适用场景**               |
| :--------------- | :------------------------------------- | :------------------------- |
| 浅拷贝           | `{ ...original }` 或 `Object.assign()` | 快速复制，无需修改嵌套数据 |
| 深拷贝（手动）   | 递归函数 `deepCopy()`                  | 完全独立副本，复杂对象     |
| 深拷贝（JSON）   | `JSON.parse(JSON.stringify(obj))`      | 纯 JSON 数据，简单嵌套     |
| 深拷贝（第三方） | Lodash `cloneDeep()`                   | 大型项目，复杂数据类型     |

**LEGO 项目实战案例：**

*   **浅拷贝的应用 (Vuex 状态更新)**：
    *   **场景**：在编辑器中修改页面基础设置（如标题、描述）时。
    *   **应用**：利用解构赋值 `state.page = { ...state.page, title: '新标题' }`。
    *   **意图**：符合 Vue 的单向数据流和响应式原理，通过生成一个“新引用”的对象触发视图更新。
    *   **深度辨析（为什么是浅拷贝？）**：展开运算符 `{ ...state.page }` 只会克隆对象的第一层属性。对于 `PageData` 中的 `title` (String) 和 `id` (Number)，确实生成了独立的副本；但对于嵌套的 **`props` (Object)**，它仅仅复制了内存地址的引用。
    *   **证明**：执行 `const newPage = { ...state.page }` 后，`newPage.props === state.page.props` 依然返回 `true`。这就意味着如果你修改 `newPage.props.backgroundColor`，原始的 `state.page.props` 也会跟着变。所以在处理多层结构且需要完全隔离时，必须退回到 `cloneDeep`。
*   **深拷贝的应用 (撤销重做 History)**：
    *   **场景**：在 `src/store/editor.ts` 中，每当产生一步可撤销的操作时，需要记录快照。
    *   **应用**：使用 `data: cloneDeep(component)` 存入 `histories` 数组。
    *   **关键原因**：组件的 `props` 是一个深度嵌套的对象。如果不进行深拷贝，历史快照中的属性将与当前状态共享同一块内存内存；当用户后续继续操作时，历史记录里的值会同步“变掉”，导致撤销功能失效。
*   **深拷贝的应用 (组件复制粘贴)**：
    *   **场景**：用户执行“拷贝图层”并“粘贴”的操作。
    *   **应用**：使用 `const clone = cloneDeep(state.copiedComponent)` 创建副本。
    *   **意图**：确保创建出的新图层是一个完全独立的副本。修改新图层属性时（如改变背景色），绝对不能影响到被原始图层。

#### object.assign和扩展运算法是深拷贝还是浅拷贝，两者区别

1. 都是浅拷贝
2. Object.assign()方法接收的第一个参数作为目标对象，后面的所有参数作为源对象。然后把所有的源对象合并到目标对象中。它会修改了一个对象，因此会触发 ES6 setter。
3. 扩展操作符（…）使用它时，数组或对象中的每一个值都会被拷贝到一个新的数组或对象中。它不复制继承的属性或类的属性，但是它会复制ES6的 symbols 属性。

#### Javscript数组的常用方法有哪些?

* push():在数组末尾添加一个或多个元素，并返回新数组的长度
* pop():移除并返回数组末尾的元素
* unshift():在数组开头添加一个或多个元素，并返回新数组的长度
* shift():移除并返回数组开头的元素
* concat():合并两个或更多数组，并返回新的合并后的数组，不会修改原始数组
* slice():从数组中提取指定位置的元素，返回一个新的数组，不会修改原始数组
* splice():从指定位置删除或替换元素，可修改原始数组
* indexof():查找指定元素在数组中的索引，如果不存在则返回-1
* lastIndexof():从数组末尾开始查找指定元素在数组中的索引，如果不存在则返回-1
* includes():检查数组是否包含指定元素，返回一个布尔值
* join():将数组中的所有元素转为字符串，并使用指定的分隔符连接它们
* reverse():颠倒数组中元素的顺序，会修改原始数组
* sort():对数组中的元素进行排序，默认按照字母顺序排序，会修改原始数组
* filter():创建一个新数组，其中包含符合条件的所有元素
* map():创建一个新数组，其中包含对原始数组中的每个元素进行操作后的结果
* reduce():将数组中的元素进行累积操作，返回一个单一的值
* foreach():对数组中的每个元素执行提供的函数

**LEGO 项目实战场景：**

*   **`push()`**：当用户点击左侧组件列表时，在 `editor.ts` 的 `addComponent` 中使用 `state.components.push(component)` 将新元素添加到画布数组末尾。
*   **`filter()`**：
    *   **删除图层**：在 `deleteComponent` 中使用 `state.components.filter(c => c.id !== id)`。
        *   **逻辑理解**：`filter` 会保留返回 `true` 的项。这里的条件是“ID 不相等”，所以除了要删除的那一项外，其他项都会被**保留**，从而实现删除效果。
    *   **文件列表**：在 `Uploader.vue` 中，通过 `filter` 移除已选中的文件或筛选状态为 `'ready'` 的待上传文件。
*   **`map()`**：
    *   **URL 参数生成**：在 `helper.ts` 的 `objToQueryString` 中，利用 `map` 将对象键值对转换为 `key=value` 字符串数组，再配合 `join('&')` 生成请求参数。
    *   **模板预设**：将原始组件模板数组通过 `map` 注入默认属性（`defaultProps`）生成最终的渲染数据。
*   **`find()` / `findIndex()`**：
    *   在编辑器中，通过 `state.components.find()` 查找当前选中的元素（Active Element）以渲染右侧属性面板。
    *   使用 `findIndex()` 记录被删除元素的原始索引，以便在“撤销 (Undo)”操作时能将其精确地插回原位。
*   **`includes()`**：在 `beforeUploadCheck` 工具函数中，通过 `['image/jpeg', 'image/png'].includes(file.type)` 快速校验上传文件格式。
*   **`slice()`**：在历史记录管理中，当用户在撤销过程中执行了新操作，利用 `state.histories.slice(0, state.historyIndex)` 删掉废弃的“未来”快照。

#### 空数组调用reduce会发生什么

当对一个**空数组**调用 `reduce()`方法，并且**没有提供初始值参数**时，JavaScript 会抛出一个 `TypeError`错误。这是因为 `reduce()`在空数组上无法确定累积器的初始值。

下面的代码会引发错误：

```javascript
const emptyArray = [];
// 没有提供初始值
const result = emptyArray.reduce((accumulator, currentValue) => accumulator + currentValue);
// 抛出: TypeError: Reduce of empty array with no initial value

```

为了解决这个问题，**必须为 **`reduce()`**方法提供初始值**，作为其第二个参数。这样，即使数组为空，`reduce()`也会使用这个初始值作为结果返回。

以下是修复后的安全写法：

```javascript
const emptyArray = [];
const initialValue = 0; // 提供初始值
const result = emptyArray.reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);
console.log(result); // 输出: 0

```

#### 数组的reduce方法

reduce()方法在JavaScript中是一个高阶函数，用于对数组中的每个元素进行累积操作，最终返回一个单一的值

具体来说，reduce()方法接受两个参数:回调函数和可选的初始值。回调函数在每个数组元素上被调用，并且可以接受四个参数:

累积值(上一次回调函数的返回值或初始值)、当前值、当前索引和原始数组。

reduce()方法的执行过程如下:

* 如果提供了初始值，则将其作为累积值(accumulator)，否则使用数组的第一个元素作为初始累积值.
* 对于数组中的每个元素，都调用回调函数，并传递当前累积值、当前值、当前索引和原始数组作为参数。
* 回调函数返回的值作为下一次调用的累积值。
* 最终，reduce()方法返回最后一次调用回调函数的返回值

以下是一个示例，演示了如何使用 reduce()方法计算数组中所有元素的总和:

```javascript
const numbers=[1,2,3,4,5];
const sum = numbers.reduce((accumulator, currentValue)=> accumulator + currentValue);
console.log(sum); //输出:154

```

在上述代码中，使用 reduce()方法对 numbers 数组中的每个元素进行累加操作，并将结果存储在 sum 变量中。

reduce()方法非常强大，可以用于解决各种累积计算问题，如求和、求平均值、查找最大/最小值等。

它提供了一种简洁而灵活的方式来处理数组数据，并生成一个单一的结果。

**LEGO 项目实战场景：**

*   **属性表单转换 (`PropsTable.tsx`)**：
    *   **场景**：在属性设置面板中，我们需要将组件的原始 `props`（单纯的数据）转换为一套包含“表单类型”、“校验规则”的复杂 UI 配置对象。
    *   **实现**：利用 `reduce` 遍历属性对象，将每个属性名映射为对应的 `FormProps` 配置。
    ```typescript
    const finalProps = computed(() => {
      return reduce(props.props, (result, value, key) => {
        const item = mapPropsToForms[key]
        if (item) {
          result[key] = { ...item, value } // 将单一值累积成复杂的 UI 配置对象
        }
        return result
      }, {} as { [key: string]: FormProps })
    })
    ```
*   **编辑器图层状态统计**：
    *   **场景**：计算当前画布中“已隐藏”的图层总数。
    *   **实现**：`const hiddenCount = components.reduce((acc, c) => c.isHidden ? acc + 1 : acc, 0)`。相比 `filter().length`，它可以在一次遍历中直接产出统计数值。

**面试核心避坑点：**
*   **初值异常**：如果数组为空且没有提供初始值参数（第二个参数），调用 `reduce` 会抛出 **`TypeError`**。在 LEGO 这类处理动态接口数据的项目中，**养成手动给初值（如 0 或 {}）的习惯至关重要**。
*   **计算属性性能**：在 Vue 的 `computed` 中使用 `reduce` 进行大数据量转换时，避免在回调内部执行 `cloneDeep` 等高开销操作，应直接操作累积器 `result`。

#### '1'.toString()为什么不会报错?

其实在这个语句运行的过程中做了这样几件事情:

```javascript
var s=new Object('1');
  s.tostring();
  s = null;

```

* 第一步: 创建Object类实例。注意为什么不是String? 由于Symbol和BigInt的出现，对它们调用new都会报错目前ES6规范也不建议用new来创建基本类型的包装类，
* 第二步: 调用实例方法。
* 第三步:执行完方法立即销毁这个实例。

整个过程体现了 基本包装类型 的性质，而基本包装类型恰恰属于基本数据类型，包括Boolean，Number和String。

#### Math.ceil()、Math.round()、Math.floor()三者的区别是什么?（必背）

* Math.ceil()上取整
* Math.round()四舍五入
* Math.floor()下取整

#### isNaN和Number.isNaN 函数有什么区别?

NaN

* 全局属性 NaN 的值表示不是一个数字(Not-A-Number)。在 JavaScript 中，NaN 最特殊的地方就是，我们不能使用相等运算符(==和 ===)来判断一个值是否是 NaN，因为 NaN == NaN 和 NaN === NaN 都会返回 false。因此，必须要有一个判断值是否是 NaN 的方法。

isNaN方法简介

* 函数 isNaN 接收参数后，会尝试将这个参数转换为数值，任何不能被转换为数值的的值都会返回 true，因此非数字值传入也会返回 true ，会影响 NaN 的判断。
* 函数 Number.isNaN 会首先判断传入参数是否为数字，如果是数字再继续判断是否为 NaN ，不会进行数据类型的转换，这种方法对于 NaN 的判断更为准确。

**总结**

和全局函数 isNaN()相比，Number.iNaN()不会自行将参数转换成数字，只有在参数是值为 NaN 的数字时，才会返回 true。

Number.isNaN()方法确定传递的值是否为NaN，并且检查其类型是否为Number。它是原来的全局isNaN()的更稳妥的版本。

#### object.is()与比较操作符“===”、“==”的区别?（必背）

* 使用双等号(==)进行相等判断时，如果两边的类型不一致，则会进行强制类型转化后再进行比较
* 使用三等号(===)进行相等判断时，如果两边的类型不一致时，不会做强制类型准换，直接返回 false
* 使用 Object.is 来进行相等判断时，一般情况下和三等号的判断相同，它处理了一些特殊的情况，比如-0和-+0 不再相等，两个 NaN 是相等的。

#### for...in和for...of的区别（必背）

1. for...in和for...of都是JavaScript中的循环语句，而for…of 是ES6新增的遍历方式，允许遍历一个含有iterator接口的数据结构并且返回各项的值，和ES3中的for…in的区别如下
2. for…of 遍历获取的是对象的键值，for…in 获取的是对象的键名；
3. for… in 会遍历对象的整个原型链，性能非常差不推荐使用，而 for … of 只遍历当前对象不会遍历原型链；
4. 对于数组的遍历，for…in 会返回数组中所有可枚举的属性(包括原型链上可枚举的属性)，for…of 只返回数组的下标对应的属性值；

总结：for...in 循环主要是为了遍历对象而生，不适用于遍历数组；for...of 循环可以用来遍历数组、类数组对象，字符串、Set、Map 以及 Generator 对象

#### typeof NaN 的结果是什么?

NaN 指“不是一个数字”(notanumber)，NaN 是一个"警戒值”(sentinel value，有特殊用途的常规值)，用于指出数字类型中的错误情况，即“执行数学运算没有成功，这是失败后返回的结果”。

```javascript
typeof NaN; //"number"

```

NaN 是一个特殊值，它和自身不相等，是唯一一个非自反(自反，reflexive，即x===x不成立)的值。而 NaN!== NaN 为true。

#### 怎么使用 setTimeout 实现 setInterval?

* setInterval 的作用是每隔一段指定时间执行一个函数，但是这个执行不是真的到了时间立即执行，它真正的作用是每隔一段时间将事件加入事件队列中去，只有当当前的执行栈为空的时候，才能去从事件队列中取出事件执行。
* 所以可能会出现这样的情况，就是当前执行栈执行的时间很长，导致事件队列里边积累多个定时器加入的事件，当执行栈结束的时候，这些事件会依次执行，因此就不能到间隔一段时间执行的效果。
* 针对 setInterval 的这个缺点，我们可以使用 setTimeout 递归调用来模拟 setInterval，这样我们就确保了只有一个事件结束了，我们才会触发下一个定时器事件，这样解决了 setInterval 的问题。

```javascript
// 思路是使用递归函数，不断地去执行setTimeout 从而达到 setInterval 的效果1
function mySetInterval(fn,timeout){
  // 控制器，控制定时器是否继续执行4
  var timer = {
    flag:true
  };

  // 设置递归函数，模拟定时器执行。
  function interval(){
    if(timer.flag){
      fn();
      setTimeout(interval,timeout);
    }
  }
  // 启动定时器
  setTimeout(interval,timeout);
  // 返回控制器
  return timer;
}

// 通俗理解：
// 这就是“跑完一圈，再约下一圈”。
// 1. interval 函数执行时，先干活 (fn())。
// 2. 活干完了，通过 setTimeout(interval, timeout) 再预约下一次执行。
// 3. 这里的 timer.flag 就像一个电闸，开关一拉（设为 false），递归链条就断了，定时器也就停了。
// 4. 相比原生 setInterval，这种写法能保证前一个任务执行完，休息够 timeout 时间后，才开始下一个任务，避免了“任务堆积”问题。

**LEGO 项目实战场景：**

*   **输入防抖 (Debounce) 的变种**：
    *   **场景**：在 `editor.ts` 中，我们有一个 `debounceChange` 函数，用于将频繁的属性修改操作合并成一次历史记录。
    *   **原理**：虽然它是为了“推迟执行”，但和这个模拟逻辑有异曲同工之妙——**利用 `setTimeout` 控制执行时机**。每次新操作进来，先 `clearTimeout`（拉电闸取消上一轮预约），然后重新 `setTimeout`（预约新的一轮）。
*   **作品自动保存 (轮询)**：
    *   **场景**：如果项目需要实现“每隔 30 秒自动保存草稿”。
    *   **应用**：**强烈建议使用这种递归 `setTimeout` 写法**。
    *   **原因**：因为“保存”是一个异步请求接口，受网络影响可能耗时很久。如果用 `setInterval`，可能会导致上一轮保存请求还没返回，下一轮请求又发出去了，导致请求排队甚至雪崩。用递归正如上图逻辑：**“等这次保存完了，再等 30 秒，再发起下一次”**，稳健性极高。

**LEGO 项目中的真实实现 (`useSaveWork.ts`)：**
我们采用了**组合式 Hook** 来封装保存逻辑，实现了三重保障：
1.  **自动保存 (setInterval)**：
    *   在 `onMounted` 中启动一个 `50秒` 的定时器。
    *   **关键判定**：通过 `isDirty` 标识（Vuex 中的状态，只要修改过属性就变 true）。只有当 `isDirty && currentWorkId` 时才真正调用接口，避免无效请求。
2.  **路由拦截 (onBeforeRouteLeave)**：
    *   当用户跳转页面时，检查 `isDirty`。如果未保存，弹出 `AntD Modal` 询问用户“是否保存？”，阻断路由跳转。
3.  **手动保存**：允许用户点击顶部导航栏的主动保存按钮。

```typescript
// useSaveWork.ts 核心代码简化
if (!disableSideEffects) {
  onMounted(() => {
    timer = setInterval(() => {
      // 只有“脏了”才保存
      if (isDirty.value) {
        saveWork()
      }
    }, 1000 * 50)
  })
}
```
**面试官追问：这里为什么用了 `setInterval` 而不是刚才推荐的递归 `setTimeout`？**
*   **答**：因为 50 秒的间隔足够长，且我们的 `isDirty` 检查非常轻量（纯本地 boolean 判断）。且项目体量目前较小，并发冲突概率低。但在高并发或保存频率极高（如 5秒一次）的场景下，我会重构为递归 `setTimeout` 方案。


#### 匿名函数（选背）

* 匿名函数在声明时不用带上函数名 没有函数提升
* 匿名函数可以有效的保证在页面上写入Javascript，而不会造成全局变量的污染。

#### new fn与new fn()有什么区别吗?

用 new 创建构造函数的实例时，通常情况下 new 的构造函数后面需要带括号(譬如:new Parent())。有些情况下 new 的构造函数后带括号和不带括号的情况一致，譬如:

```javascript
function Parent(){
  this.num =1;
}
console.log(new Parent());//输出Parent对象{num:1}
console.log(new Parent);//输出Parent对象:{num:1}

```

但有些情况下new的构造函数后带括号和不带括号的情况并不一致，譬如:

```javascript
function Parent(){
  this.num =1;
}
console.log(new Parent().num);//1
console.log(new Parent.num);//报错

```

结果分析:

从报错信息来看， new Parent.num 执行顺序是这样的:先执行Parent.num，此时返回结果为 undefined;后执行 new，因 new 后面必须跟构造函数，所以new undefined 会报错。

* new Parent().num相当于(new Parent()).num，所以结果返回1
* new Parent.num代码相当于new(Parent.num);，

由此看来 new 的构造函数后跟括号优先级会提升

#### eval是做什么的

它的功能是把对应的字符串解析成 JS 代码并运行

应该避免使用 eval ，不安全，非常耗性能(2 次，一次解析成 js 语句，一次执行)由 JSON 字符串转换为JSON对象的时候可以用 eval，var obj =eval('('+ str +')')

#### js函数有哪几种声明方式?有什么区别?

有 表达式 和 声明式 两种函数声明方式

函数的声明式写法为: function test(){}，这种写法会导致函数提升，所有通过 function 关键字声明的.

变量都会被解释器优先编译，不管声明在什么位置都可以调用它，但是它本身并不会被执行。

```javascript
test();//测试
function test(){
  console.log("测试");
}
test();// 测试

```

函数的表达式写法为: var test = function(){}，这种写法不会导致函数提升，必须先声明后调用，不然就会报错。

```javascript
test();// 报错:TypeError:test is not a function1
var test =function(){
  console.log("测试");
};

```

二者的区别

```javascript
//函数声明式
function greeting(){
  console.log("hello world");
}
//函数表达式5
var greeting = function(){
  console.log("hello world");
}

```

* 函数声明式变量会声明提前 函数表达式变量不会声明提前
* 函数声明中的 函数名 是必需的，而函数表达式中的 函数名则是可选的
* 函数表达式可以在定义的时候直接在表达式后面加()执行，而函数声明则不可以
* 自执行函数即使带有函数名，它里面的函数还是属于函数表达式

**LEGO 项目实战场景：**

*   **函数声明 (Function Declaration)**：
    *   **场景**：在 `PropsTable.tsx` 和 `helper.ts` 等文件中，定义工具函数。
    *   **代码**：`function capitalizeFirstLetter(string: string) { ... }`
    *   **优势**：利用**变量提升**特性，这些工具函数可以在文件的任何地方被调用（哪怕调用写在定义之前），让代码结构更灵活，主逻辑更清晰。
*   **函数表达式 (Function Expression)**：
    *   **场景**：在 `store/index.ts` 中定义的 `actionWrapper` 高阶函数。
    *   **代码**：
    ```typescript
    export function actionWrapper(...) {
      // 返回一个异步函数表达式
      return async (context: ActionContext<any, any>, payload: ActionPayload = {}) => {
        // 具体业务逻辑...
      }
    }
    ```
    *   **优势**：这里返回的 `async` 函数就是一个典型的匿名函数表达式。它被赋值给变量或作为返回值传递。在闭包、回调函数、高阶函数（如防抖、节流）中，我们几乎总是使用函数表达式。
*   **立即执行函数 (IIFE)**：
    *   **场景**：虽然现代模块化（ES Modules）已经天然隔离了作用域，但在某些老旧的第三方库初始化代码中，你依然会看到 `(function(){ ... })()` 的身影，用于防止全局变量污染。

#### forEach中return有效果吗?如何中断forEach循环?（选背）

在forEach中用return不会返回，函数会继续执行。

中断方法

1. 使用try监视代码块，在需要中断的地方抛出异常，
2. 官方推荐方法(替换方法):用every和some替代forEach函数:

* every在碰到return false的时候，中止循环。
* some在碰到return true的时候，中止循环。

### 异步编程与事件循环

#### Promise（必背）

1. Promise 对象是异步编程的一种解决方案。Promise 是一个构造函数，接收一个函数作为参数，返回一个 Promise 实例。
2. 一个 Promise 实例有三种状态，分别是\_pending、**fulfilled ** *和* rejected\_。实例的状态只能由 pending 转变 *fulfilled * 或者 rejected 状态，并且状态一经改变，无法再被改变了。
3. 状态的改变是通过传入的 resolve() 和 reject() 函数来实现的，当我们调用resolve回调函数时，会执行Promise对象的then方法传入的第一个回调函数，当我们调用reject回调函数时，会执行Promise对象的then方法传入的第二个回调函数，或者catch方法传入的回调函数。
4. Promise的实例有**两个过程**：

* pending -> fulfilled : Resolved（已完成）
* pending -> rejected：Rejected（已拒绝）
* 一旦从进行状态变成为其他状态就永远不能更改状态了。

**通俗理解：Promise 就像一个“外卖订单”**
*   **Pending**：骑手正在送餐路上，结果未知。
*   **Fulfilled/Resolved**：外卖安全送达，你收到了餐（Data）。
*   **Rejected**：骑手摔了或者店家没货，订单取消，你收到了致歉（Error）。
*   **状态不可逆**：外卖要么送达，要么取消，不可能既送达了又取消。一旦结果定下来（Settled），就再也不会变了。
*   **Promise 嵌套**（文档中的情况二）：就像汉堡店接了单，但发现没面包了，要先去隔壁买面包。那么“汉堡订单”的成败，完全取决于“买面包”这个内部行动的结果。

**在通过new创建Promise对象时，我们需要传入一个回调函数，我们称之为executor **

✓ 这个回调函数会被立即执行，并且给传入另外两个回调函数resolve、reject；

✓ 当我们调用resolve回调函数时，会执行Promise对象的then方法传入的回调函数；

✓ 当我们调用reject回调函数时，会执行Promise对象的catch方法传入的回调函数；

情况一：如果resolve传入一个普通的值或者对象，那么这个值会作为then回调的参数；

情况二：如果resolve中传入的是另外一个Promise，那么这个新Promise会决定原Promise的状态：

情况三：如果resolve中传入的是一个对象，并且这个对象有实现then方法，那么会执行该then方法，并且根据then方法的结 果来决定Promise的状态：

**then方法接受两个参数**：

fulfilled的回调函数：当状态变成fulfilled时会回调的函数；

reject的回调函数：当状态变成reject时会回调的函数；

**Promise有三种状态，那么这个Promise处于什么状态呢？**

当then方法中的回调函数本身在执行的时候，那么它处于pending状态；

当then方法中的回调函数返回一个结果时，那么它处于fulfilled状态，并且会将结果作为resolve的参数；

✓ 情况一：返回一个普通的值；

✓ 情况二：返回一个Promise；

✓ 情况三：返回一个thenable值；

当then方法抛出一个异常时，那么它处于reject状态

**LEGO 项目实战场景：**

*   **文件上传全生命周期 (`Uploader.vue`)**：
    *   **场景**：文件上传是一个典型的异步链式操作（准备 -> 校验 -> 上传 -> 响应）。
    *   **代码分析**：
    ```typescript
    // 1. 发起请求：axios.post 本身返回一个 Promise
    axios.post(url, data).then(resp => {
      // 2. Fulfilled 状态：上传成功，修改文件状态为 success
      readyFile.status = 'success'
      emit('success', { resp })
    }).catch(e => {
      // 3. Rejected 状态：网络错误或后端报错，修改状态为 error
      readyFile.status = 'error'
      emit('error', { error: e }) 
    }).finally(() => {
      // 4. Finally：无论成功失败，都清空 input 以便下次选择
      fileInput.value.value = ''
    })
    ```
*   **支持异步校验的钩子函数**：
    *   **场景**：组件不仅支持同步校验文件（返回 boolean），还支持异步校验（如查询后端该文件名是否已存在）。
    *   **实现**：判断 `props.beforeUpload` 的返回值。如果返回值是 `Promise` 实例（`result instanceof Promise`），则等待其 `resolve` 后再执行上传；如果 `reject` 则中断流程。这是 Promise 在设计组件接口时的经典应用。

#### Promise方法（必背）

1. promise.then()  对应resolve成功的处理
2. promise.catch()对应reject失败的处理
3. promise.all()可以完成并行任务，将多个Promise实例数组，包装成一个新的Promise实例，返回的实例就是普通的Promise。有一个失败，代表该Primise失败。当所有的子Promise完成，返回值时全部值的数组
4. promise.race()类似promise.all()，区别在于有任意一个完成就算完成
5. promise.allSettled() 返回一个在所有给定的 promise 都已经 fulfilled 或 rejected 后的 promise ，并带有一个对象数组，每个对象表示对应的promise 结果。

#### promise.then的第二个参数

| **特性**       | `then`**的第二个参数**                          | `.catch()`**方法**                       |
| :------------- | :---------------------------------------------- | :--------------------------------------- |
| **捕获范围**   | 仅捕获**当前** Promise 或其**之前**未处理的拒绝 | 捕获**整个链**中**之前**所有未处理的拒绝 |
| **链式调用**   | 需要每次调用 `then`时都传递                     | 可以链式调用，通常放在链的末尾           |
| **代码简洁性** | 相对繁琐                                        | 更简洁，易于阅读和维护                   |

#### Promise.all() 和 Promise.allSelected() （必背）

1. Promise.all() 和 Promise.allSettled() 都是用来处理多个 Promise 实例的方法
2. all: 只有当所有Promise实例都resolve后，才会resolve返回一个由所有Promise返回值组成的数组。如果有一个Promise实例reject，就会立即被拒绝，并返回拒绝原因
3. allSettled： 等所有Promise执行完毕后，不管成功或失败，把每个Promise状态信息放到一个数组里面返回。

#### JavaScript 中如何取消请求（选背）

JavaScript 实现异步请求就靠浏览器提供的两个 API -- XMLHttpRequest 和 Fetch。我们平常用的较多的是Promise 请求库 axios，它基于 XMLHttpRequest.

本篇带来 XMLHttpRequest、Fetch 和 axios 分别是怎样“取消请求”的

**取消 XMLHttpRequest 请求**

当请求已经发送了，可以使用 XMLHttpRequest.abort()方法取消发送，代码示例如下

```javascript
const xhr = new XMLHttpRequest();
xhr.open('GET','<http://127.0.0.1:3000/api/get>',true);
xhr.send();
setTimeout(()=>{
  xhr.abort();
}，1000);

```

取消请求，readyState 会变成 XLHttpRequest.UNSENT(0);请求的 xhrstatus 会被设为0;

**取消 Fetch 请求**

取消 Fetch 请求，需要用到 AbortController API。我们可以构造一个controller 实例:const controller =new Abortcontroller()，controller 它有一个只读属性 AbortController.signal，可以作为参数传入到 fetch中，用于将控制器与获取请求相关联;

```javascript
const controller =new AbortController();
void(async function(){
  const response = await fetch('<http://127.0.0.1:3000/api/get>',{
    signal:controller.signal,
  });
  const data = await response.json();
})();
setTimeout(()=>{
  controller.abort();
}，1000);

```

#### Promise 的 finally 怎么实现的?

Promise.prototype.finally 方法是 ES2018 引入的一个方法，用于在 Promise 执行结束后无论成功与否都会执行的操作。在实际应用中，finally 方法通常用于释放资源、清理代码或更新 UI界面等操作。以下是一个简单的实现方式:

```javascript
Promise.prototype.finally=function(callback){
  const P=this.constructor;
  return this.then(
    value =>P.resolve(callback()).then(()=>value),
    reason =>P.resolve(callback()).then(()=>{ throw reason })
  )
}

```

我们定义了一个名为 finally 的函数，它使用了 Promise 原型链的方式实现了 finally 方法。该函数接收一个回调函数作为参数，并返回一个新的 Promise 对象。如果原始 Promise 成功，则会先调用 callback 函数，然后将结果传递给下一个 Promise;如果失败，则会先调用 callback 函数，然后将错误信息抛出

可以看到，在实现中，我们首先通过 this.constructor 获取当前 Promise 实例的构造函数，然后分别处理 Promise的 resolved 和 rejected 状态的情况。在 resolved 状态时，我们先调用 calback 函数，然后将结果传递给新创建的 Promise 对象;在 rejected 状态时，我们也是先调用 callback 函数，然后将错误信息抛出

这样，我们就完成了 Promise.prototype.finally 方法的实现。

#### promise.catch后面的.then还会执行吗?（必背）

会继续执行。

虽然Promise是开发过程中使用非常频繁的一个技术点，但是它的一些细节可能很多人都没有去关注过。我们都知道.then，.catch，.finally 都可以链式调用，其本质上是因为返回了一个新的Promise实例。catch语法形式如下:

```javascript
Ap.catch(onRejected);

```

* .catch 只会处理 rejected 的情况，并且也会返回一个新的 Promise 实例
* .catch(onRejected)与then(undefined，onRejected)在表现上是一致的

事实上，catch(onRejected)从内部调用了then(undefined,onRejected)

* 如果.catch(onRejected)的 onRejected 回调中返回了一个状态为 rejected的Promise 实例，那么.catch 返回的 Promise实例的状态也将变成rejected 。
* 如果 .catch(onRejected)的 onRejected 回调中抛出了异常，那么 .catch 返回的 Promise 实例的状态也将变成 rejected。
* 其他情况下，.catch 返回的 Promise实例的状态将是 fulfilled

#### Promise中的值穿透是什么?（必背）

解释:.then 或者 .catch 的参数期望是函数，传入非函数则会发生值穿透。当then中传入的不是函数，则这个then返回的promise的data，将会保存上一个的promise.data,这就是发生值穿透的原因。而且每一个无效的then所返回的promise的状态都为resolved.

```javascript
Promise.resolve(1)
  .then(2)// 注意这里传入的是数字，不是函数！发生穿透，数据 1 直接流过
  .then(Promise.resolve(3)) // 传入的是对象，不是函数！继续穿透，数据 1 继续流过
  .then(console.log) // 传入的是函数，接收到数据 1，输出 1

```
上面代码的输出是 1

**通俗理解：**
`.then()` 就像接力赛的选手，它**只接受“函数”**作为接棒者。如果你往 `.then()` 里塞了数字、对象或者 `undefined`，Promsie 机制会认为“这里没人接棒”，于是直接把手里的数据“穿透”传给下一棒。

**如何修复（不穿透）？**
必须用**函数**包裹你的逻辑：
```javascript
Promise.resolve(1)
    .then(() => 2) // 传入了一个函数，该函数返回 2
    .then(data => console.log(data)) // 输出 2
```

#### 对async/await的理解（必背）

1. async/await其实是Generator 语法糖，效果都能用then链来实现，是为优化then链而开发的。通过async关键字声明一个异步函数， await 用于等待一个异步方法执行完成，并会阻塞执行

2. async 函数返回的是一个 Promise 对象，如果在函数中 return 一个变量，async 会把这个直接量通过 Promise.resolve() 封装成 Promise 对象。如果没有返回值，返回 Promise.resolve(undefined)

3. 如果方法内无await节点

* return 一个字面量则会得到一个{PromiseStatus:resolved}的Promise
* throw 一个Error则会得到一个{PromiseStatus: rejected}的Promise

4. 如果方法内有await节点

* async会返回一个{PromiseStatus:pending}的Promise(发生切换，异步等待Promise的执行结果)
* Promise的resolve会使得await的代码节点获得相应的返回结果，并继续向下执行
* Promise的reject 会使得await的代码节点自动抛出相应的异常，终止向下继续执行

**LEGO 项目实战场景 (`Editor.vue` - publish函数)：**

我们来看看“发布作品”这个功能的实现，它完美展示了 `async/await` 的价值：
```typescript
const publish = async () => {
  // 1. 同步代码：清空选中状态
  store.commit('setActive', '')
  
  // 2. 异步等待：等待 Vue DOM 更新完成
  // 如果用 .then，这里就要开始缩进一层了
  await nextTick() 
  
  try {
    // 3. 异步等待：截图并上传（耗时操作）
    // await 会“暂停”在这里，直到 publishWork 完成（Resolve）
    // 如果 publishWork 内部报错（Reject），会直接跳到 catch
    await publishWork(el) 
    
    // 4. 只有上面成功了，才会执行这一行
    showPublishForm.value = true
  } catch(e) {
    // 5. 捕获上面 await 抛出的错误（Reject）
    console.error(e)
  } finally {
    // 6. 无论成功失败，都执行清理操作
    canvasFix.value = false
  }
}
```
**总结：**
如果不用 `async/await`，上面那段代码会变成 `nextTick().then(() => publishWork().then(...).catch(...))` 的嵌套地狱。使用 `await` 后，代码逻辑从上到下像流水账一样清晰，错误处理也回归到了最原始的 `try/catch`。

#### generator 是怎么做到中断和恢复的?

Generator 是一种特殊的函数类型，可以在函数执行过程中暂停和恢复执行。它通过使用 yield 表达式来实现中断和恢复执行的功能。

当 Generator 函数被调用时，它并不会立即执行，而是返回一个迭代器对象。每次调用迭代器对象的 next()方法时，Generator 函数会从上一次执行的位置继续执行，直到遇到下一个 yield 表达式或函数结束。此时，Generator函数将返回一个包含当前值和执行状态的对象，其中 value 属性表示 yield 表达式的结果，done 属性表示是否执行完毕。

例如，下面是一个简单的 Generator 函数示例:

```javascript
function* myGenerator(){
  console.log('step 1');
  yield;
  console.log('step 2');
  yield;
  console.log('Step 3');
}
const gen =myGenerator();
gen.next();//输出 Step 1
gen.next();//输出Step 2
gen.next();//输出 Step 3

```

在这个示例中，myGenerator()函数包含三个yield 表达式，每次调用迭代器对象的 next()方法都会从上一次执行的位置继续执行，直到遇到下一个 yield 表达式或函数结束,

当执行第一个 gen.next()方法时，输出 Step 1，并暂停执行，将控制权交回给调用者。当再次调用 gen.next()方法时，继续执行后面的代码，输出 Step 2，并再次暂停执行。最后，再次调用 gen.next()方法时，完成函数的执行，输出 Step 3，并返回一个包含 value 和 done 属性的对象。通过使用 yield 表达式和迭代器对象，Generator 函数可以实现中断和恢复执行的功能，从而提供更灵活、更高效的 JavaScript 编程方式。

#### async/await对比Promise的优势（必背）

1. 代码可读性高，Promise虽然摆脱了回掉地狱，但自身的链式调用会影响可读性。
2. 相对Promise更优雅，传值更方便。
3. 对错误处理友好，可以通过try/catch捕获，Promise的错误捕获非常冗余
4. async/await基于Promise。async把promise包装了一下，async函数更简洁，不需要像promise一样需要写then，不需要写匿名函数处理promise的resolve值。

**深度对比解析：**

1.  **错误捕获的大一统能力**：
    *   **Promise**: 需要同时维护同步的 `try/catch` 和异步的 `.catch()`，容易遗漏。
    *   **Async/Await**: **同一个 `try/catch` 块** 可以同时捕获同步逻辑错误（如 JSON 解析失败）和异步请求错误（如网络 404），大大降低了心智负担。
2.  **避免“变量传递噩梦”**：
    *   **场景**：当步骤 3 需要用到步骤 1 的结果时。
    *   **Promise**: 必须使用嵌套（回调地狱）或者定义外部变量。
    *   **Async/Await**: 代码像同步逻辑一样执行，`const res1 = await step1()` 定义的变量在后续每一行都能直接访问，完全消灭了作用域隔离问题。
    ```javascript
    // Async/Await: 清晰、扁平、变量共享方便
    const user = await getUser(id);
    const posts = await getPosts(user.id); // 直接使用上一行的 user
    const comments = await getComments(posts[0].id); // 直接使用上一行的 posts
    ```

#### async/await对Generator的改进（必背）

1. 内置执行器：async内置了执行器，无需手动调用next方法
2. 更广的适用性：await后面可以跟Promise对象和原始类型的值
3. 更好的语义：async表示函数里有异步操作 await表示需要等待结果
4. async是Generator函数的语法糖，**async函数返回值是promise对象**，比generator函数返回值 iterator对象更方便，*可使用 await 代替then 指定下一步操作(await==promise.then)*

#### 事件循环（必背）

1. 概念：

* 事件循环是JS实现异步编程的核心
* 通过任务队列的方式管理同步任务和异步任务的执行顺序
* 保证代码高效运行

2. 过程：

* 同步任务直接进入调用栈 异步任务被挂起
* 直到异步操作完成后 将回调函数加入任务队列
* 直到同步任务执行结束 从任务队列中取出加入调用栈

3. 异步任务分为宏任务和微任务 宏任务执行结束后 会检查并调用其微任务队列

* 常见宏任务：<script>内部的代码、setTimeOut和setTimeInterval的回调、ajax请求的回调、postMeaasge和MessageChannel的回调、io操作
* 常见微任务：Primise的回调，MutationObserver的回调，process.nextTick

4. 常见执行顺序：调用栈中的同步任务、所有微任务、渲染页面、取出任务队列中的下一个宏任务、重复

**通俗理解（消除"谁先谁后"的误区）：**
*   **第一个"宏任务"就是整个 `<script>` 标签里的同步代码。** 代码从上到下执行时，遇到 `setTimeout` 就扔进"宏任务队列"，遇到 `Promise.then` 就扔进"微任务队列"。
*   **当前这轮宏任务（同步代码）执行完毕后**，会**优先清空微任务队列**（全部执行完！），然后才会去取下一个宏任务。
*   **执行顺序流程图**：
    ```
    宏任务(script) -> [清空所有微任务] -> 渲染 -> 宏任务(setTimeout回调) -> [清空所有微任务] -> ...
    ```
*   **经典面试题输出**：`console.log(1); setTimeout(cb, 0); Promise.resolve().then(cb2); console.log(4);` 输出为 `1 -> 4 -> cb2 -> cb`。

#### 如果最后一个微任务又产生了新的微任务（必背）

* JavaScript 事件循环中，微任务队列的处理规则是：必须在本轮一次性清空。因此，如果最后一个微任务又产生了新的微任务，事件循环会继续执行这个新产生的微任务，直到微任务队列再次被清空，然后才会继续执行后续的宏任务或进行渲染
* 简单来说，微任务队列的清空过程是一个“**持续执行直到为空**”的过程。事件循环会不断地从微任务队列中取出任务执行，如果在此期间执行某个微任务时又产生了新的微任务（例如在一个 `Promise.then`回调中又返回了新的 Promise），那么这个新微任务会被立刻加入到当前微任务队列的末尾
* 事件循环不会离开微任务队列去执行其他操作，而是会继续检查并执行这个新加入的微任务，直到微任务队列被彻底清空。

#### try/catch能捕获异步代码的错误吗

以下面的代码为例：

```javascript
try {
  setTimeout(() => {
    throw new Error('err')
  }, 200)
} catch (err) {
  console.log(err)
}

```

`setTimeout`是一个异步函数，它的回调函数会在指定的延时后被放入事件队列，等待当前执行栈清空后才执行。因此，当 `setTimeout`的回调函数执行并抛出错误时，外层的 `try...catch`代码块已经执行完毕，无法捕获异步回调中抛出的错误

对于异步代码的错误，需要结合 `Promise.catch`、`async/await`或事件监听等机制来处理

#### Js实现异步的方式（必背）

| 方式                          | 描述                                                       | 优点                                                         | 缺点/注意事项                                                                                |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **1. 回调函数**               | 将函数作为参数传递给另一个函数，在异步操作完成后调用该函数 | 实现简单，广泛兼容                                           | 1. 回调地狱，代码难以维护   2. 无法直接用try/catch捕获错误   3. 每个任务只能指定一个回调函数 |
| **2. 事件监听**               | 通过事件监听器处理异步操作结果                             | 适用于事件驱动的场景，松耦合                                 | 代码结构松散，难以追踪流程                                                                   |
| **3. setTimeout/setInterval** | 通过定时器延迟执行代码                                     | 简单易用，适合简单延迟任务                                   | 不适合复杂的异步逻辑，难以管理多个定时器                                                     |
| **4. Promise**                | 使用Promise对象处理异步操作                                | 1. 解决了回调地狱问题   2. 支持链式调用   3. 错误处理更清晰  | 1. 无法取消Promise   2. 错误需要通过回调函数捕获（.catch）                                   |
| **5. 生成器 (yield)**         | 使用function*和yield关键字实现异步操作                     | 1. 异步语义清晰   2. 可以暂停和恢复函数执行                  | 1. 手动迭代函数复杂   2. 实现逻辑相对复杂                                                    |
| **6. async/await**            | 基于Promise，使用async/await关键字实现异步操作             | 1. 代码看起来像同步代码，易于理解   2. 支持try-catch捕获错误 | 如果多个异步操作没有依赖性，使用async/await可能导致性能降低                                  |

#### JavaScript脚本延迟加载的方式有哪些?（必背）

延迟加载是等页面加载完成后再加载 JavaScript 文件。js 延迟加载有助于提高页面加载速度，一般有以下几种方式:

1. defer 属性: 给 js 脚本添加 defer 属性，这个属性会让脚本的加载与文档的解析同步解析，然后在文档解析完成后再执行这个脚本文件，这样的话就能使页面的渲染不被阻塞。多个设置了 defer 属性的脚本按规范来说按最早声明顺序执行的，但是在一些浏览器中可能不是这样。
2. async 属性: 给 js 脚本添加 async 属性，这个属性会使脚本异步加载，不会阻塞页面的解析过程，但是当脚本加载完成后立即执行 js 脚本，这个时候如果文档没有解析完成的话同样会阻塞。多个 async 属性的脚本的执行顺序是不可预测的，一般不会按照代码的顺序依次执行。
3. 动态创建 DOM 方式: 动态创建 DOM 标签的方式，可以对文档的加载事件进行监听，当文档加载完成后再动态的创建 script 标签来引入 js 脚本
4. 使用 setTimeout 延迟方法: 设置一个定时器来延迟加载js脚本文件
5. 让 JS 最后加载: 将 js 脚本放在文档的底部，来使 js 脚本尽可能的在最后来加载执行

#### 判断异步函数

在JavaScript中，判断一个函数是否是异步函数（async function）可以通过几种不同的方式来实现。以下是一些常用的方法：

**1. 使用 **`instanceof`** 操作符**

异步函数是 `AsyncFunction` 构造函数的实例，因此可以使用 `instanceof` 来判断：

```javascript
function isAsyncFunction(func) {
  return func instanceof AsyncFunction;
}
// 示例
async function asyncFunc() {}
console.log(isAsyncFunction(asyncFunc)); // true
console.log(isAsyncFunction(function() {})); // false

```

**2. 检查函数的 **`constructor`** 属性**

异步函数的 `constructor` 属性指向 `AsyncFunction`：

```javascript
function isAsyncFunction(func) {
  return func.constructor.name === 'AsyncFunction';
}
// 示例
async function asyncFunc() {}
console.log(isAsyncFunction(asyncFunc)); // true
console.log(isAsyncFunction(function() {})); // false

```

**3. 使用 **`Object.prototype.toString`** 方法**

`Object.prototype.toString` 方法可以用来获取对象的类型字符串，对于异步函数，它将返回 `[object AsyncFunction]`：

```javascript
function isAsyncFunction(func) {
  return Object.prototype.toString.call(func) === '[object AsyncFunction]';
}
// 示例
async function asyncFunc() {}
console.log(isAsyncFunction(asyncFunc)); // true
console.log(isAsyncFunction(function() {})); // false

```

#### js 中的倒计时，怎么实现纠正偏差（选背）

在前端实现中我们一般通过 setTimeout 和 setInterval 方法来实现一个倒计时效果。但是使用这些方法会存在时间偏差的问题，这是由于js的程序执行机制造成的，setTimeout 和 setInterval的作用是隔一段时间将回调事件加入到事件队列中，因此事件并不是立即执行的，它会等到当前执行栈为空的时候再取出事件执行，因此事件等待执行的时间就是造成误差的原因。

一般解决倒计时中的误差的有这样两种办法

1. 第一种是通过前端定时向服务器发送请求获取最新的时间差，以此来校准倒计时时间
2. 第二种方法是前端根据偏差时间来自动调整间隔时间的方式来实现的。这一种方式首先是以 setTimeout 递归的方式来实现倒计时，然后通过一个变量来记录已经倒计时的秒数。每一次函数调用的时候，首先将变量加一，然后根据这个变量和每次的间隔时间，我们就可以计算出此时无偏差时应该显示的时间。然后将当前的真实时间与这个时间相减，这样我们就可以得到时间的偏差大小，因此我们在设置下一个定时器的间隔大小的时候，我们就从间隔时间中减去这个偏差大小，以此来实现由于程序执行所造成的时间误差的纠正。

#### 说说对 requestIdleCallback 的理解

requestIdleCallback 可以帮助我们优化 Web 应用程序的性能和响应速度，减少资源的浪费。

* 一个浏览器 API，允许我们在浏览器空闲时执行一些任务，提高网页的性能和响应速度。
* 通常情况下，JavaScript 代码会占用主线程，从而阻塞了其他的任务。当页面需要进行一些复杂计算、渲染大量的DOM元素等操作时，就会导致用户的交互体验变得缓慢和卡顿。
* requestIdleCallback 的作用就是将一些非关键性的任务从主线程中分离出来，等到浏览器闲置时再执行。这样就可以避免占用主线程，提高页面的响应速度和流畅度。

**使用方法：**

```

1. 使用 requestIdlecallback 需要传入一个回调函数，该函数会在浏览器空闲时被调用。
2. 回调函数的参数是一个IdleDeadline 对象，它包含有关浏览器还剩余多少时间可供执行任务的信息。
3. 根据该对象的时间戳信息，开发人员可以自行决定是否继续执行任务或推迟执行。

```

### 面向对象与原型系统

#### this指向（必背）

1. 在对象内部的方法中指向对象
2. 全局执行上下文指向对象（浏览器指向window，nodejs指向global）
3. 构造函数指向新创建的对象
4. 嵌套函数的this不会继承外部函数的this

**通俗理解（“你在哪间办公室办公？”）：**
`this` 的指向就像是一个人的**临时身份卡**：
- **公共区闲逛（全局调用）**：你在公共休息区闲逛，身份卡属于大楼物业（即 `window`，严格模式下没领卡则是 `undefined`）。
- **作为公司正式工（对象方法）**：你在 A 公司的大楼里工作（`A.work()`），此时你的身份卡就代表 A 公司（`this` 指向 `A`）。
- **由于新建项目任命（new）**：你被任命去组建并接管一个新项目部（`new Project()`），你手中的身份卡就是这个**刚刚建成的新部门**。
- **由于外包借调（call/apply/bind）**：虽然你是原公司的员工，但你临时接到命令去帮 B 公司（`thisArg`）处理任务，此时你必须佩带 B 公司的临时工作牌。

#### 如何判断是否为空对象（必背）

| Object.keys()    | 直观、性能较好 | 不继承原型链属性   | `Object.keys(obj).length === 0`                                                                  |
| :--------------- | :------------- | :----------------- | :----------------------------------------------------------------------------------------------- |
| JSON.stringify() | 简单易懂       | 性能较低、有局限性 | `JSON.stringify(obj) === '{}'`                                                                   |
| for...in 循环    | 兼容性好       | 性能较差           | `for (let key in obj)``{ ` `if (obj.hasOwnProperty(key)) { ` `return false; } } ` `return true;` |

**通俗理解（“检查公司是否只是个空壳”）：**
- **Object.keys()（查部门名单）**：HR拿出一份“部门登记册”，如果登记册上一个名字都没有（长度为0），说明公司是空的。它最守规矩，只看公司内部部门，不看母公司的资产。
- **JSON.stringify()（全景合影）**：给公司拍一张全景照片。如果洗出来的照片里只有一个边框 `{}`，说明里面啥也没有。这方法最简单粗暴，但如果碰到部门里藏着“商业机密”（如函数、Symbol），它可能拍不出来。
- **for...in（保安巡逻）**：派个保安在公司里挨个办公室推门走一圈。只要推开一扇门发现里面有人（属性），立马对讲机喊话：“公司没空！”。

#### call、apply、bind的作用及区别（必背）

1. 都可以改变函数执行时的this指向 call、apply在改变this指向时 立刻执行函数 / 返回一个改变了this指向的新函数 不会立刻执行
2. func.call(thisArg,arg1,arg2.....)   对象继承、伪数组转换为真数组
3. func.apply(thisArg,\[argsArray]) 获取数组中的max-min、数组合并
4. func.bind(thisArg,arg1,arg2.....) vue或者react框架中绑定this

**通俗理解（“借调外部顾问”）：**
- **call/apply（单次出差）**：把 A 公司的技术员（方法）派去处理 B 公司（`thisArg`）的任务。`call` 像现场面试，得一个一个问题问（参数一个个传）；`apply` 像拿标书，直接一叠表格（数组）递过去。
- **bind（长期顾问合同）**：不立刻出差，而是和 A 公司的技术员签一张“为 B 公司效力”的终身合约，以后他无论何时干活，潜意识里都默认是在为 B 公司服务。

#### new变量时发生了什么

创建⼀个新对象，并将其原型指向构造函数的 prototype，然后调用构造函数初始化对象。

```javascript
function myNew(fn, ...args) {
  // 检查传⼊的第⼀个参数是否为函数
  if (Object.prototype.toString.call(fn) !== "[object Function]") {
    return "Error in params"; // 如果不是函数，返回错误信息
  }
  // 创建⼀个新对象，并将其原型指向构造函数的 prototype
  const obj = {};
  obj.__proto__ = Object.create(fn.prototype);
  // 调⽤构造函数，并将 this 绑定到新对象
  let ret = fn.call(obj, ...args);
  // 如果构造函数返回⼀个对象，则返回该对象；否则返回新对象
  return ret instanceof Object ? ret : obj;
}

```

**通俗理解（“成立新公司的四个标准动作”）：**
1. **注册空壳公司**：先领一个空的商业名额（创建一个空对象 `{}`）。
2. **挂牌入网**：在工商局系统里，把这家新公司关联到它的“母版图纸”下（将 `__proto__` 指向 `prototype`）。这样新公司就能共享母公司的专利和技术（方法）。
3. **注入资金与装修**：请工程队按照图纸施工（执行构造函数），往新公司里安排经理、配置电脑（初始化属性 `this.xxx`）。
4. **老板领钥匙**：如果装修完工程队没卷款跑路（没返回其他对象），就把新公司的公章交给老板（返回新对象）。

#### 对象方法解构的this绑定丢失

对象方法中的 `this`指向取决于**调用方式**。当你通过 `obj.method()`形式调用时，`this`指向 `obj`。但若将方法赋值给一个新变量再调用，就相当于**直接调用函数**，而非通过对象属性调用。此时：

* 在**非严格模式**下，`this`会指向全局对象（浏览器中为 `window`，Node.js 中为 `global`）
* 在**严格模式**（`'use strict'`）下，`this`为 `undefined`

**通俗理解（员工离职比喻）：**
*   **正常上班**：`company.sayName()` -> 员工通过公司门禁刷卡，他知道自己属于这个公司（`this` 指向 `company`）。
*   **被猎头挖走**：`const fn = company.sayName; fn();` -> 员工被"拆"出来单独工作，没有刷任何公司的卡，他就迷失了（`this` 丢失）。

**代码证明：**
```javascript
const person = { name: '张三', greet() { console.log(this.name); } };
person.greet();        // 输出: 张三 (通过 person 调用，this 指向 person)
const { greet } = person;
greet();               // 输出: undefined (解构后直接调用，this 丢失)
```

**解决方案**：使用 `bind` 提前绑定 `this`。
```javascript
const bindedGreet = person.greet.bind(person);
bindedGreet(); // 输出: 张三
```

##### 如何保持原 `this`指向

若需在解构后维持原 `this`指向，可参考以下方法：

1. **调用时使用 **`.bind()`**方法**：`bind()`会创建一个新函数，其 `this`值永久绑定到指定对象

```javascript
const extractedFunc = obj.sayHi.bind(obj); // 使用 bind 绑定 this
extractedFunc(); // 输出："Frontend Expert"

```

2. **使用箭头函数定义方法**：箭头函数**不绑定自己的 **`this`，其 `this`值**继承自定义时的外层作用域**

因此若 `obj.sayHi`是箭头函数，解构后 `this`通常指向定义 `obj`时的外层 `this`（常是 `window`或 `undefined`），而非 `obj`本身。

```javascript
const obj2 = {
  name: 'Frontend Expert',
  sayHi: () => {
    console.log(this.name); // 这里的 this 是定义 obj2 时的外层 this
  }
};
const extractedFunc2 = obj2.sayHi;
extractedFunc2(); // 输出：undefined（因为外层 this 可能没有 name 属性）

```

**通俗理解（“流淌在血液里的籍贯”）：**
箭头函数本质上是**“把出生证明绣在衣服上的流浪汉”**。他不需要在入职某个公司时（对象方法调用）领身份卡，因为他出生的那一刻，就永久记住了他出生地（定义时的外层环境）的身份。无论他被“挖走”（解构）到哪，他执行时永远只认他出生时的那个老板。

#### 解构赋值遇到不存在的属性怎么做

**默认值详解与注意事项**

**基本用法**：在解构模式中，使用 `=`操作符直接为变量指定默认值。**默认值仅在解构目标的属性值为严格等于 **`undefined`**时才会生效**。如果属性值为 `null`，则不会使用默认值

```javascript
const { nonExistentProp = 'default', nullProp = 'default' } = { nullProp: null };
console.log(nonExistentProp); // 'default'
console.log(nullProp); // null (因为 null !== undefined)

```

**嵌套解构与默认值结合**：对于嵌套较深的对象，可以**为每一层的解构都设置默认值**，通常是一个空对象 `{}`，这样可以避免在尝试解构 `undefined`或 `null`时抛出错误。

```javascript
// 假设 response 数据中，user 或 user.profile 可能不存在
const { user: { profile: { name = 'Anonymous' } = {} } = {} } = apiResponse || {};
console.log(name); // 即使 apiResponse、user 或 profile 缺失，name 也会有默认值 'Anonymous'

```

**函数参数中的解构默认值**：在函数参数中使用解构赋值时，**建议同时为参数本身设置一个默认的空对象**（如 `= {}`），以防止调用函数时未传递参数导致的错误。

```javascript
function createUser({ name = 'Anonymous', age = 18, email = 'none@provided.com' } = {}) {
  // 函数体
}
createUser(); // 安全调用，所有参数使用默认值

```

**可选链操作符 (?.) 的配合使用**

在处理可能不存在的深层嵌套属性时，解构赋值配合 ES2020 引入的**可选链操作符（Optional Chaining Operator）**`?.` 可以写出更简洁安全的代码

```javascript
```javascript
// 假设我们有一个对象，但不确定 someObj 或 someObj.deeply 是否存在
const deeplyNestedValue = someObj?.deeply?.nested?.property ?? 'defaultValue';

```

**通俗理解（“领取物资的保障计划”）：**
- **默认值（备用方案）**：你去前台领“办公电脑”（解构属性）。如果库房里刚好没货了（`undefined`），前台会根据规定发给你一台“备用笔记本”（默认值）。
- **连环兜底（防止公司倒闭）**：如果公司连“库房”这个房间都没建（`apiResponse` 是 `null`），你直接去敲库房的门会被撞得头破血流（报错）。所以我们会设置 `{user: {profile: {}} = {}} = {}` 这种层层兜底，确保就算公司还没开业，你也不至于受伤，顶多领到一份“默认合同”。

#### 如果new一个箭头函数会怎么样?（必背）

箭头函数是ES6中的提出来的，它没有prototype，也没有自己的this指向，更不可以使用arguments参数，所以不能New一个箭头函数。

new操作符的实现步骤如下:

1. 创建一个空的简单]avaScript对象(即{});
2. 为步骤1新创建的对象添加属性\_proto\_将该属性链接至构造函数的原型对象;
3. 将步骤1新创建的对象作为this的上下文;
4. 如果该函数没有返回对象，则返回this。

所以，上面的第二、三步，箭头函数都是没有办法执行的。

**通俗理解（“临时工无法成立子公司”）：**
箭头函数在 JS 世界里就像是**“纯外包临时工”**：
1. **没工位（this）**：他没资格在公司里占个位置，干活只能蹭别人的电脑。
2. **没公章（prototype）**：他兜里没有“母公司印章”，没法去工商局作为母体去注册并关联新公司。
所以，当你强行要 `new` 一个箭头函数时，JS 监工会告诉你：“这人连印章都没有，怎么当老板开分公司？”

#### 原型和原型链（必背）

1. js通过构造函数来创建对象，每个构造函数内部都会一个原型prototype属性，它指向另外一个对象，这个对象包含了可以由该构造函数的所有实例共享的属性和方法
2. 当访问对象的一个属性或方法时，当对象身上不存在该属性方法时，就会沿着原型链向上查找，直到查找到该属性方法位置。
3. 原型链的顶层原型是Object.prototype，如果这里没有就只指向null

**通俗理解（“公司的技能共享墙”）：**
- **原型（Prototype）**：好比公司的**“公共专利墙”**。如果你想让全国成千上万个分厂（实例）都能瞬间学会“新型组装法”，你没必要给每个厂都发通知，直接把技术贴在总部的专利墙上即可。
- **原型链（Prototype Chain）**：是一套**“遇到难题找上级”**的求助机制。分厂员工想用某个工具，先翻翻身边的工具箱（自有属性）；没有的话，去翻分厂的公告栏（原型）；还没有，就去总部的专利库（父级原型）；最后还没找到，那就是真的没有（返回 `undefined` 或报错）。

#### 继承的方式（必背）

| 继承方法         | 优点                               | 缺点                       |
| ---------------- | ---------------------------------- | -------------------------- |
| 原型链继承       | 写法简单                           | 共享引用类型属性，无法传参 |
| 借用构造方法继承 | 解决了引用类型属性共享问题         | 无法复用父类原型方法       |
| 组合式继承       | 结合了原型链继承和借用构造方法继承 | 父类构造函数会被调用两次   |
| 原型式继承       | 无需单独创建构造函数               | 引用类型属性共享           |
| 寄生式继承       | 写法简单                           | 父类方法无法复用           |
| 寄生组合式继承   | 高效，避免重复属性，保持原型链     | /                          |
| es6 class        | 语法简洁支持super                  | 部分浏览器不支持           |

**通俗理解（“资产与技术的传承方式”）：**
- **原型链继承（纯家产继承）**：就像**“共享一个银行账号”**。所有分厂（子类）没钱了都直接从母厂（父类）账号刷卡。但有个大坑：如果一个分厂把卡里的钱花光了（修改了引用类型属性），其他分厂也跟着没钱花。
- **借用构造函数继承（自主创业，自备资金）**：每个分厂在开业那天，都把母厂的技术员叫过来，在自己厂房里按同样的流程重新配置一套办公家具（初始化属性）。这样每个厂的家当都是独立的，互不干扰，但缺点是没法用到母厂贴在“公章墙”上的先进技术（原型方法）。
- **寄生组合式继承（最完美的接班方案）**：既让每个子厂拥有独立的“启动资金和设备”（属性独立），又让它们能够联网共享母厂的“专利技术中心”（原型共享）。这是目前最推荐、也最接近 ES6 `class` 背后的做法。

#### js的原型链，日常的使用场景（选背）

***实现对象继承**：通过原型链，子对象可以继承父对象的属性和方法，避免重复代码。例如：

```javascript
function Parent() {
  this.name = "Parent";
}
Parent.prototype.sayHello = function() {
  console.log("Hello");
};
function Child() {
  this.age = 10;
}
Child.prototype = new Parent();
const child = new Child();
console.log(child.name); // 输出: Parent
child.sayHello(); // 输出: Hello

```

***共享方法或属性**：在多个实例中共享相同的方法或属性，减少内存占用。例如，通过构造函数的 `prototype` 属性为所有实例添加公共方法：

```javascript
function Animal() {}
Animal.prototype.eat = function() {
  console.log("Eating...");
};
const dog = new Animal();
const cat = new Animal();
dog.eat(); // 输出: Eating...
cat.eat(); // 输出: Eating...

```

***动态扩展对象功能**：通过修改原型对象，动态为现有对象或其构造函数添加新功能。例如：

```javascript
Array.prototype.customPush = function(item) {
  this[this.length] = item;
  return this.length;
};
const arr = [1, 2, 3];
arr.customPush(4); // 输出: 4
console.log(arr); // 输出: [1, 2, 3, 4]

```

**通俗理解（“原型链在公司的三大妙用”）：**
- **家产继承**：儿子不用奋斗也能开上老爸的车（子类继承父类方法），实现代码的“躺赢”。
- **公共饮水机（节省内存）**：没必要给 1000 个员工每人买一个饮水机（方法分配到每个实例），在茶水间放一个（放在 Prototype 上），大家渴了都去那喝，这样公司空间和经费（内存）省下一大截。
- **工服订制（扩展内置对象）**：老板觉得所有员工都该穿工装，就给“人类”这个模版加了穿衣功能（`Array.prototype.xxx`），结果所有员工甚至未来入职的新人，瞬间都拥有了穿工装的功能。

#### 说说你对 new.target 的理解

new.target 属性允许你检测函数或构造方法是否是通过new运算符被调用的；new.target 返回一个指向构造方法或函数的引用。在普通的函数通过new运算符被初始化的函数或构造方法中，数调用中，new.target 的值是undefined。

我们可以使用它来检测，一个函数是否是作为构造函数通过new被调用的。

```javascript
function Foo(){
  if(!new.target) throw "Foo()must be called with new";
    console.log("Foo instantiated with new");
}
Foo();//throws "Foo()must be called with new"
new Foo(); //logs "Foo instantiated with new"

```

**通俗理解（“入职身份验证器”）：**
`new.target` 就像是办公室门口的**红外扫描仪**：
- 如果你正正经经地拿着入职合同（使用 `new` 启动），扫描仪会显示：“欢迎新员工入职（返回构造函数引用）”。
- 如果你只是随便推门进来（直接调用函数 `Foo()`），扫描仪就会报警显示 `undefined`，你可以据此把这些“不请自来”的人踢出去（抛出错误）。

#### 说说你对 ToPrimitive 的理解

ToPrimitive 是一个抽象操作，用于将一个值转换为原始值(primitive value)，即字符串、数字或布尔值在 JavaScript 中，当需要将一个非原始值用作原始值时，会自动调用 ToPrimitive 操作。例如，在使用加法运算符时，如果其中一个操作数不是原始值，则会将其转换为原始值，这就是通过调用 ToPrimitive 来实现的。ToPrimitive 操作的实现方式如下:

如果该值已经是原始类型，则直接返回该值，

如果该值是对象，则按照以下步骤进行转换:

* 调用 valueOf()方法并返回结果，如果结果是原始类型则直接返回该结果
* 调用 toString()方法并返回结果，如果结果是原始类型则直接返回该结果
* 如果都不是原始类型，则抛出 TypeError 异常

**通俗理解（“进入特定安检口的变身术”）：**
想象一个复杂的对象（比如一辆装满货物的卡车）要通过一个**“只收硬币”的自动收费站（比如加法运算 `+`）**，它必须完成“标准化变身”：
1. **第一优先级（valueOf）**：收费站先问：“你车里有没有现成的面值硬币？”（调用 `valueOf`）。如果有，直接拿走。
2. **第二优先级（toString）**：如果车里没硬币，收费站会说：“那你把车上的货物清单写成一张纸条（字符串）给我吧”（调用 `toString`）。
3. **最终处理**：如果变出来的东西收费站还是看不懂（不是数字、字符串或布尔值），收费站就会直接报警（抛出 `TypeError`）。

### ES6核心特性

#### ES6箭头函数（必背）

1. 特点：

* 没有this
* 不能使用new
* 没有arguments
* 没有原型和super
* 不能使用yield
* 不能直接返回对象字面量

2. 场景：

* 简单的函数表达式、内层函数表达式
* 定义对象上的方法、事件处理程序

#### 箭头函数和普通函数（必背）

| **特性**                   | **普通函数**                                      | **箭头函数**                                       |
| :------------------------- | :------------------------------------------------ | :------------------------------------------------- |
| **语法**                   | 使用 `function`  关键字声明                       | 使用箭头 `=>`  定义，通常更简洁                    |
| **this 绑定**              | 动态绑定，取决于调用方式                          | 静态绑定，继承自定义时的父级词法作用域             |
| **构造函数**               | 可用作构造函数，支持 `new`  调用                  | 不能用作构造函数，不支持 `new`  调用               |
| **arguments 对象**         | 有自己的 `arguments`  对象                        | 没有自己的 `arguments`  对象，需用 rest 参数替代   |
| **prototype 属性**         | 有 `prototype`  属性                              | 没有 `prototype`  属性                             |
| **call/apply/bind 重定向** | 可使用这些方法改变 `this`  指向                   | 无法通过这些方法改变 `this`  指向                  |
| **适用场景**               | 方法、构造函数、需要动态上下文或 arguments 的场景 | 回调函数、需要继承外部 this 的场景、简短函数表达式 |

#### 拓展符的使用场景（必背）

* 函数调用时展开数组，等价于apply
* 数组构造时展开数组，多个数组合并为一个数组
* 字符串展开为字符数组
* 对象构造时展开对象，只适用于可迭代对象
* 剩余参数

#### let const var 相关（必背）

var没有块级作用域，只有函数作用域。var只有在function{ }内部才有作用域的概念，其他地方没有。意味着函数以外用var定义的变量是同一个，我们所有的修改都是针对他的

1. let和const增加**块级作用域**（JS没有块级作用域）
2. let和const存在**暂时性死区**，不存在**变量提升**，不能在初始化前引用，调用 返回 uninitialized
3. let和const禁止**重复声明**，不能重新声明
4. let和const不会成为全局对象属性，var声明的变量自动成为全局对象属性
5. var 存在变量提升（执行前，编译器对代码预编译，当前作用域的变量/函数提升到作用域顶部），let约束变量提升。let和var都发生了变量提升，只是es6进行了约束，在我们看来，就像let禁止了变量提升
6. 使用var，我们能对变量多次声明，后面声明的变量会覆盖前面的声明

```javascript
var a = 123
if (true) {
  a = 'abc' // ReferenceError 因为下面的 let
  let a;
}

```

const实际保证的并不是变量的值，而是变量指向的内存地址

#### ES6新特性（必背）

1. **变量声明**：

* let：用于声明块级作用域变量，避免了ES5中var的变量提升问题，使变量仅在代码块内有效
* const：用于声明常量，即一旦赋值后不可重新赋值，常用于存储不可变的值

2. **箭头函数**：箭头函数简化了函数表达式的语法，并且自动绑定外层函数的this值，避免了传统函数中this指向不明确的问题
3. **模板字符串** 特点： 使用反引号（\`）包裹字符串，可以直接嵌入变量或表达式，支持多行字符串。
4. **解构赋值 **特点：可以从数组或对象中提取值，并赋给多个变量
5. **类与模块化** 特点

* 类：提供了一种更直观的面向对象编程方式，是ES5构造函数的语法糖
* 模块化：支持import和export，可以在编译时确定模块依赖关系

6. **Promise**

* Promise：用于处理异步操作，避免回调地狱。

7. **扩展运算符与剩余参数 **

* 扩展运算符（…）：用于展开数组或对象
* 剩余参数（…）：用于收集函数的剩余参数。

#### ES6~ES12

**ES7 (2016)**

***数组 includes 方法**：解决 `indexOf`无法检测 `NaN`以及语义不直观的问题。
***指数运算符 **``：解决幂运算依赖 `Math.pow`函数，使代码更简洁。

**ES8 (2017)**

***async/await**：解决异步编程中“回调地狱”和 Promise 链式调用不够直观的问题，让异步代码看起来像同步代码。
***Object.values 和 Object.entries**：解决对象遍历时只能获取键(`Object.keys`)的问题，方便地获取值或键值对。
***字符串填充 padStart/padEnd**：解决字符串格式化（如日期、金额前导补零）需要手动拼接的问题。

**ES9 (2018)**

***异步迭代 for-await-of**：解决遍历一系列异步操作（如数据流）时，无法直接使用循环语法的问题。
***对象 Rest/Spread 操作符**：解决对象的浅拷贝、合并和提取部分属性时操作繁琐的问题。

**ES10 (2019)**

***数组 flat 和 flatMap**：解决多维数组降维（扁平化）操作需要递归或循环的问题。
***Object.fromEntries**：解决将键值对列表（如 Map、二维数组）反向转换为对象不够方便的问题，与 `Object.entries`功能相反。
***字符串 trimStart 和 trimEnd**：更明确地解决只去除字符串开头或末尾空白符的需求，替代模糊的 `trimLeft`和 `trimRight`。

**ES11 (2020)**

***可选链操作符 **`?.`：解决深层访问对象属性时，需要逐层判断中间层级是否存在（防止 `Cannot read property of undefined`错误）的冗余代码问题。
***空值合并操作符 **`??`：解决使用逻辑或 `||`设置默认值时，会意外排除假值（如 `0`, `''`）的问题，确保只在值为 `null`或 `undefined`时才使用默认值。
***Promise.allSettled**：解决需要等待一组异步操作全部完成（无论成功或失败）后再执行后续逻辑的场景，而 `Promise.all`会在一个失败后立即中断。
***动态导入 import()**：解决按需加载模块（懒加载）以提高初始加载性能的问题，实现代码分割。

**ES12 (2021)**

***String.prototype.replaceAll**：解决替换字符串中所有匹配子串时需要全局正则表达式的问题，使全局替换更简单直观。
***逻辑赋值操作符 (&&=, ||=, ??=)**：解决将逻辑判断与赋值操作结合时代码冗余的问题，实现简写。
***Promise.any**：解决等待一组异步操作中第一个成功的需求，与 `Promise.race`（关注第一个完成的）不同，它忽略失败，直到有一个成功。
***WeakRef**：解决直接创建对对象的“弱引用”，允许其被垃圾回收，主要用于实现大型对象的缓存或映射，而不会导致内存泄漏。

#### ES6中的 Reflect 对象有什么用?

Reflect 对象不是构造函数，所以创建时不是用 new 来进行创建。在 ES6 中增加这个对象的目的:

1. 将 Object 对象的一些明显属于语言内部的方法(比如 Object.defineProperty)，放到 Reflect 对象上。现阶段，某些方法同时在 Obiect 和 Reflect 对象上部署，未来的新方法将只部署在 Reflect 对象上。也就是说，从Reflect 对象上可以拿到语言内部的方法。
2. 修改某些 Object 方法的返回结果，让其变得更合理。比如，Object.defineProperty(obj,name,desc)在无法定义属性时，会抛出一个错误，而 Reflect.defineProperty(obj,name, desc)则会返回 false。
3. 让 Object 操作都变成函数行为。某些 Object 操作是命令式，比如 name in obj和 delete obj\[name]，而Reflect.has(obj, name)和 Reflect.deleteProperty(obj, name)让它们变成了函数行为。

Reflect 对象的方法与 Proxy 对象的方法一一对应，只要是 Proxy 对象的方法，就能在 Reflect 对象上找到对应的方法。这就让 Proxy 对象可以方便地调用对应的 Refect 方法，完成默认行为，作为修改行为的基础。也就是说，不管 Proxy 怎么修改默认行为，你总可以在 Reflect 上获取默认行为。

```javascript

var loggedobj= new Proxy(obj,{
  get(target,name){
    console.log("get",target,name);
    return Reflect.get(target, name);
  },
  deleteProperty(target,name){
    console.log("delete"+ name);
    return Reflect.deleteProperty(target,name);
  },
  has(target,name){
    console.log("has" + name);
    return Reflect.has(target,name);
  },
);

```

上面代码中，每一个 Proxy 对象的拦截操作(get、delete、has)，内部都调用对应的 Reflect 方法，保证原生行为能够正常执行。添加的工作，就是将每一个操作输出一行日志。

#### 什么是尾调用优化和尾递归

| 特性         | 尾调用 (Tail Call)                                          | 尾递归 (Tail Recursion)                                |
| ------------ | ----------------------------------------------------------- | ------------------------------------------------------ |
| **定义**     | 一个函数的**最后一步操作**是调用另一个函数。                | 一个函数在**最后一步调用自身**（是尾调用的特殊形式）。 |
| **核心目的** | 优化函数调用机制，减少栈帧开销。                            | 优化递归算法，避免深层递归时的栈溢出。                 |
| **优化关键** | 调用后无需保留当前函数的任何上下文。                        | 递归调用后没有其他操作，结果直接返回。                 |
| **优化效果** | 可复用当前栈帧，使调用栈深度与循环类似，维持在常数级 O(1)。 | 将递归的空间复杂度从 O(n) 降为 O(1)。                  |

#### const修饰常量怎么让它可变（选背）

一、方法 1：使用对象/数组包裹

通过将常量定义为对象或数组的引用，修改其内部属性不会改变引用地址，因此可以绕过 `const` 的限制：

```javascript
// 方案示例
const constant = { value: 10 };

// 修改属性（合法）
constant.value = 20;
console.log(constant.value); // 20

// 尝试重新赋值（非法，仍报错）
constant = { value: 30 }; // TypeError: Assignment to constant variable.

```

**通俗理解（“保险箱与内部零件”）：**
`const` 就像是公司分配给你的一个**“固定保险箱”**。
- **锁死的是位置**：公司规定这个保险箱不能搬走，也不能换成别的箱子（你不能给变量重新赋值指向另一个对象）。
- **内部是自由的**：虽然箱子位置固定了，但你可以打开箱子，更换里面的零件、存或取钞票（修改对象的属性）。
所以，`const` 锁死的是**“地址（引用）”**，而不是**“内容”**。

**特点**：

• 允许修改对象/数组的嵌套属性。

• 无法直接替换整个对象（如 `constant = {}` 仍会报错）。

• 适用于需要「部分可变」的场景（如配置参数）。

---

**二、方法 2：使用闭包封装可变状态**

通过闭包将变量私有化，暴露修改接口：

```javascript
function createMutableConstant(initialValue) {
  let value = initialValue;
  return {
    get() {
      return value;
    },
    set(newValue) {
      value = newValue;
    }
  };
}

// 使用示例
const mutableConst = createMutableConstant(10);
console.log(mutableConst.get()); // 10
mutableConst.set(20);
console.log(mutableConst.get()); // 20

```

**特点**：

• 完全控制变量的读写。

• 需手动封装接口，代码冗余。

• 适用于需要封装私有状态的场景（如单例模式）。

***

**三、方法 3：利用 **`Proxy`** 或 **`Reflect`

通过代理（`Proxy`）拦截属性访问，动态修改值：

```javascript
const mutableConst = new Proxy(
  {},
  {
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  }
);

mutableConst.value = 10; // 正常修改
console.log(mutableConst.value); // 10

```

**特点**：

• 支持动态属性名和嵌套修改。

• 性能开销较高，需谨慎使用。

• 适用于需要灵活拦截操作的场景（如数据校验）。

#### 解释下如下代码的意图:Array.prototype.slice.apply(arguments)

* arguments 为类数组对象，并不是真正的数组。
* slice可以实现数组的浅拷贝。

由于 arquments不是真正的数组，所以没有slice方法，通过apply可以调用数组对象的slice方法，从而将arquments 类数组转换为数组

### 浏览器环境与API

#### Axios（必背）

1. 基于Promise的Http库，支持在浏览器和node中发送请求，拦截器是axios的一个功能，允许开发者在请求发送前和响应返回后对请求和响应做处理
2. 请求拦截器：

* 携带token
* 设置时间戳

3. 响应拦截器：

* 处理数据
* 判断响应状态

4. 原理：使用一个chain数组存储拦截器方法和dispatchRequest,请求拦截器方法添加到数组前面，使用promise链式调用，按顺序执行chain中方法
5. 特点：

* 基于Proimise支持异步操作
* 代码简洁，跨平台
* 可拦截请求和响应，方便统一处理
* 自动转换JSON ，自动将请求数据和响应数据转换为json

#### ajax、axios、fetch有什么区别?（必背）

**AJAX**

Aiax 即"AsynchronousJavascriptAndXML”(异步 JavaScript 和 XML)，是指一种创建交互式网页应用的网页开发技术。它是一种在无需重新加载整个网页的情况下，能够更新部分网页的技术。通过在后台与服务器进行少量数据交换，Aiax 可以使网页实现异步更新。这意味着可以在不重新加载整个网页的情况下，对网页的某部分进行更新。传统的网页(不使用 Ajax)如果需要更新内容，必须重载整个网页页面。其缺点如下:

* 本身是针对MVC编程，不符合前端MVVM的浪潮。
* 基于原生XHR开发，XHR本身的架构不清晰。
* 不符合关注分离(Separation of Concerns)的原则
* 配置和调用方式非常混乱，而且基于事件的异步模型不友好。.

---

**Fetch**

fetch号称是ajax替代品，是在ES6出现的，使用了ES6中的promise对象。Fetch是基于promise设计的。Fetch的代码结构比起ajax简单多。fetch不是ajax的进一步封装，而是原生is，没有使用XMLHtpRequest对象。fetch的优点:

* 语法简洁，更加语义化
* 基于标准 Promise 实现，支持 async/await
* 更加底层，提供的API丰富(request，response)
* 脱离了XHR，是ES规范里新的实现方式

fetch的缺点:

* fetch只对网络请求报错，对400，500都当做成功的请求，服务器返回 400，500 错误码时并不会 reject，只有网络错误这些导致请求不能完成时，fetch 才会被 reject.
* fetch默认不会带cookie，需要添加配置项: fetch(url,{credentials: 'include”})
* fetch不支持abort，不支持超时控制，使用setTimeout及Promise.reject的实现的超时控制并不能阻止请求过程继续在后台运行，造成了流量的浪费
* fetch没有办法原生监测请求的进度，而XHR可以

**Axios**

Axios 是一种基于Promise封装的HTTP客户端，其特点如下:

* 浏览器端发起XMLHttpRequests请求.
* node端发起http请求
* 支持Promise API
* 监听请求和返回
* 对请求和返回进行转化
* 取消请求
* 自动转换json数据
* 客户端支持抵御XSRF攻击

#### Axios和Fecth的区别

| 特性                | **Axios**                                                     | **Fetch**                                                                 |
| ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **默认行为**        | 返回的 Promise 直接处理响应数据（包括错误）                   | 返回的 Promise 仅返回网络请求的状态（即使响应码是 4xx 或 5xx 也不算失败） |
| **请求/响应拦截器** | 支持请求和响应拦截器，方便统一处理请求和响应                  | 不支持，需要手动封装                                                      |
| **错误处理**        | 对 HTTP 状态码 4xx 和 5xx 会自动抛出错误                      | 只会在网络错误或无法解析响应时抛出错误，不会自动抛出 4xx 或 5xx 错误      |
| **JSON 解析**       | 自动解析 JSON 数据，无需手动调用                              | 需要手动调用 `.json()`来解析响应数据                                      |
| **浏览器兼容性**    | 在 IE 浏览器中不支持，需要 polyfill                           | 原生支持现代浏览器，IE11 及以下需要 polyfill                              |
| **请求取消**        | 支持设置请求超时，提供较好的超时管理                          | 通过 AbortController 也可以实现取消请求功能                               |
| **上传/下载进度**   | 支持上传和下载的进度监控                                      | 不直接支持进度监控，需额外手动实现                                        |
| **请求数据格式**    | 支持 JSON、FormData、Blob 等多种格式，支持自定义 Content-Type | 需要手动设置 Content-Type 和请求体格式                                    |
| **浏览器支持**      | 支持现代浏览器，IE11 及以下需要 polyfill                      | 原生支持现代浏览器，IE11 及以下需要 polyfill                              |
| **体积**            | 较大，需要额外引入库                                          | 较小，原生 fetch 不需要外部依赖                                           |

#### 跨域资源（必背）

并非所有Web资源都不受跨域限制。事实上，许多资源的加载都受到跨域限制:

* Web字体加载受跨域限制，需要正确配置CORS
* 图片的像素信息获取(例如在canvas中操作)受跨域限制
* XMLHttpRequest和Fetch API的请求默认受跨域限制
* WebGL纹理加载受跨域限制

#### token可以放在cookie里吗

1. token通常用于验证用户身份 uid 时间戳 签名
2. 将token刚在cookie里，不设置过期时间，关闭浏览器cookie失效 方便管理 但需要注意CSRF
3. token签发验证流程：

客户端登录 —— 服务端验证 —— 签发token —— 客户端存储token —— 客户端发送请求 —— 服务端验证token

#### Messagechannel是什么，有什么使用场景?

1. Messagechannel 是一个 JavaScript API，用于在两个独立的执行环境(如 Web Workers 或者不同的browsingcontexts)之间建立双向通信的通道
2. Messagechannel提供了两个通信端点(port1和 port2)，可以在两个不同的执行环境之间传递消息，并通过事件监听的方式来处理这些消息。使用场景包括但不限于:

* Web Workers 通信:在 Web 开发中，Messagechannel 通常用于在主线程和 Web Worker 之间建立通信通道，以便主线程与 Worker 之间传递消息和数据。
* 不同浏览上下文(browsing context)之间的通信:在现代浏览器中，多个标签页、iframe 或者其他类型的browsing context 可以通过 Messagechannel 实现通信。
* SharedWorker 通信: Messagechanne1 可以用于在主线程和 Shared Worker 之间建立通信通道4.服务端和客户端之间的通信: Messagechanne1 可以用于客户端(如浏览器)与服务端(如 WebSocket 服务器)之间的通信，特别是在与 WebSocket 或其他类似技术结合使用时。
* 异步任务处理:在某些场景中，使用 essagechanne1可以更方便地处理异步任务，因为它提供了独立于主线程的通信通道。

#### 前后端通信方式（必背）

1. 轮询-客户端定时向服务端发送请求，检查有无数据更新/实现简单,无需过多修改/频繁请求增加服务器负担 请求时间过长数据更新不及时 过短浪费网络带宽和CPU资源 适用于小型应用 事实性不高的场景
2. 长轮询-客户端发送请求，服务端保持连接，有数据更新时返回/减少不必要请求，时效性较好/保持连接消耗资源，长时间无数据更新客户端超时
3. iframe流：页面嵌入一个隐藏的iframe 通过其src属性与服务器建立长连接 服务器通过iframe推送数据/实时到达，浏览器兼容性好/维护长连接开销
4. websocket：基于TCP的双向通信协议，客户端和服务端建立持久连接，数据帧格式序列传输/实时性高，性能优越，节省网络带宽资源/浏览器，重连
5. SSE：服务器向客户端单向推送数据，基于HTTP/使用简单，轻量级，支持断线重连

#### websocket的开启用的是什么方法

**开启 WebSocket 连接**

使用 `WebSocket` 构造函数创建连接：

```javascript
const socket = new WebSocket("ws://example.com/socket");

```

参数说明：

`ws://example.com/socket` 是 WebSocket 服务器的地址，协议可以是 `ws`（非加密）或 `wss`（加密）。

连接建立后，可以通过监听事件来处理数据传输，例如 `onopen`、`onmessage`、`onerror` 和 `onclose`7。

2. 相关事件处理

连接成功时触发：

```javascript
socket.onopen = function(event) {
  console.log("WebSocket 连接已建立");
};

```

接收到消息时触发：

```javascript
socket.onmessage = function(event) {
  console.log("收到消息：" + event.data);
};

```

连接关闭时触发：

```javascript
socket.onclose = function(event) {
  console.log("WebSocket 连接已关闭");
};

```

发生错误时触发：

```javascript
socket.onerror = function(event) {
  console.error("WebSocket 错误：" + event);
};

```

3. 发送和关闭连接

发送数据：

```javascript
socket.send("Hello, WebSocket!");

```

关闭连接：

```javascript
socket.close();

```

#### SSE和websocket传送的数据格式是否有区别（选背）

* SSE：*

***纯文本格式**：SSE 使用纯文本格式传输数据，每条消息以 `data:` 开头，以两个换行符 `\n\n` 结尾。例如：

```plain
data: {"name": "John", "message": "Hello"}

```

***支持事件类型**：可以通过 `event:` 字段指定事件类型，客户端可以监听特定事件

```plain
event: update
    data: {"status": "success"}

```

***支持自定义字段**：如 `id`（用于断点恢复）、`retry`（重连间隔）等。

* WebSocket：*

***二进制或文本格式**：WebSocket 支持发送文本（如 JSON）或二进制数据（如图像、音频、视频等）。数据以帧（Frame）的形式传输，每帧包含控制信息和应用数据。
***灵活的数据结构**：数据可以是任意格式，无需特定的解析规则，但需要客户端和服务器共同定义数据结构。

#### 如何判断当前脚本运行在浏览器还是 node 环境中?

```javascript
this === window ?'browser':'node';

```

通过判断 Global 对象是否为 window，如果不为 window，当前脚本没有运行在浏览器中

#### XML和JSON的区别

这两者都是自描述的，可以被许多编程语言解析和使用。

JSON和XML之间的区别

* JSON是JavaScript Object Notation;XML是可扩展标记语言。
* JSON是基于JavaScript语言;XML源自SGML。
* JSON是一种表示对象的方式;XML是一种标记语言，使用标记结构来表示数据项。
* JSON不提供对命名空间的任何支持;XML支持名称空间。
* JSON支持数组;XML不支持数组。
* XML的文件相对难以阅读和解释;与XML相比，JSON的文件非常易于阅读
* JSON不使用结束标记:XML有开始和结束标签。
* JSON的安全性较低:XML比ISON更安全。
* JSON不支持注释;XML支持注释:
* JSON仅支持UTF-8编码;XML支持各种编码

#### **csv和xlsx的区别**

利用sheet.js实现两种格式的导出

* csv：纯文本
* xlsx：二进制压缩包

前端生成excel的优点：减少服务器资源消耗

缺点：计算性能比服务器差

#### 前端的页面截图怎么实现?

* 使用浏览器自带的截图功能:在 Chrome 浏览器中，可以通过右键菜单或者快捷键 Ctrl + Shift +P打开“命令菜单”，然后输入“截图“并选择相应选项即可。
* 使用第三方插件或工具:例如 Awesome Screenshot、Nimbus Screenshot 等浏览器插件，或者html2canvas、dom-to-image等JavaScript 库
* 使用 Canvas 绘制:通过 Canvas API 可以绘制出页面内容，并将其导出为图片格式。具体实现可以参考Fabric.js、Puppeteer 等库。
* 使用服务器端渲染:对于需要生成动态内容或者需要进行复杂操作的页面，可以使用服务器端渲染技术(如Node.is 或 PHP)来生成网页截图。

以上这些方法备有优缺点。

* 使用浏览器截图功能简单便捷，但是可能无法自定义截图范围和格式，
* 使用第三方插件或工具需要安装额外的软件，而且可能存在安全风险
* 使用 Canvas 绘制需要掌握一定的 Canvas 编程知识，而且可能会影响性能使用服务器端渲染则需要对服务器编程有一定的了解。

#### defer和async加载脚本的区别（必背）

1. 默认 无两者 浏览器会立刻加载并执行脚本 阻塞HTML的解析和渲染
2. async 脚本的加载与HTML文档的解析和渲染并行执行（异步加载）加载完成后立刻执行 适用于与不依赖DOM和其他脚本的独立脚本
3. defer 脚本的加载与HTML文档的解析和渲染并行执行（异步加载） 脚本的执行会延迟到HTML的解析和渲染完成之后 适用于需要操作dom和依赖其他脚本的脚本
4. JS可以操作DOM，如果在修改DOM的时候渲染页面，可能导致渲染结果不一致/JS引擎和GUI线程设置为互斥关系，js执行时，GUI渲染线程会被挂起
5. js执行时间过长，会导致渲染过程不连贯，产生阻塞感

#### 页面加载的过程中，JS 文件是不是一定会阻塞 DOM 和 CSSOM 的构建?

不一定

JavaScript阻塞DOM和CSSOM的构建的情况主要集中在以下两个方面

**JavaScript文件被放置在head标签内部**

当]avaScript文件被放置在head标签内部时，浏览器会先加载JavaScript文件并执行它，然后才会继续解析HTML文档。因此，如果JavaScript文件过大或服务器响应时间过长，就会导致页面一直处于等待状态，进而影响DOM和CSSOM的构建。

**JavaScript代码修改了DOM结构**

在JavaScript代码执行时，如果对DOM结构进行了修改，那么浏览器需要重新计算布局(reflow)和重绘(repaint)，这个过程会较为耗时，并且会阻塞DOM和CSSOM的构建。除此之外，还有一些情况下JavaScript并不会阻塞DOM和CSSOM的构建:

**通过设置 script 标签的 async、defer 属性避免阻塞DOM和CSSOM的构建**

* async:异步加载JavaScript文件，脚本的下载和执行将与其他工作同时进行(例如从服务器请求其他资源、渲染页面等)，而不必等到脚本下载完成才开始这些操作。因此，在使用 async 属性时，脚本的加载和执行是异步的，并且不保证脚本在页面中的顺序。
* defer属性 :属性也告诉浏览器立即下载脚本文件，但有一个重要的区别:当文档解析时，脚本不会执行。直到文档解析完成后才执行。这意味着脚本将按照它们在页面上出现的顺序执行，并且在执行之前，整个文档已经被解析完毕了。

**Web Workers :**

Web Workers 是一种运行在后台线程的JavaScript脚本，它不会阻塞DOM和CSSOM的构建，并且可以利用多核CPU提高JavaScript代码执行速度。

总结

在一定情况下，JavaScript的执行会阻塞DOM和CSSOM的构建。

但是，在实际应用中，我们可以通过设置 script 标签的 async、defer 属性、使用Web Workers等方式来避免这个问题。

#### 怎么使用 js 动态生成海报?

**方案一:DOM->canvas->image**

将目标 DOM 节点绘制到 canvas 画布，然后利用 canvas 相关的 API 以图片形式导出。可简单标记为绘制阶段和导出阶段两个步骤:

绘制阶段:选择希望绘制的 DOM 节点，根据DOM的 nodeType 属性调用 canvas 对象的对应 API，将目标 DOM 节点绘制到 canvas 画布(例如对于 img 标签的绘制使用 drawImage 方法)。

导出阶段:通过 canvas的 toDataURL或 getImageData 等对外接口，最终实现画布内容的导出。

**方案二:DOM->svg->canvas->image**

将 html 作为 svg 的外联元素，利用 svg 的 API 导出为图片

**方案三:使用Node]s 调用浏览器方法**

在后端生成海报，比如可以使用nodeJS，通过puppter等库，调用浏览器的 page 对象，基于page.screenshots 截图并保存到磁盘。

#### postMessage 有哪些使用场景?

window.postMessage定义

window.postMessage()方法可以安全地实现跨源通信。window.postMessage()方法提供了一种受控机制来规避此限制，只要正确的使用，这种方法就很安全

用途

可用于两个不同的Ifrom(不同源)之间的通讯语法

```javascript
otherWindow.postMessage(message,targetOrigin,[transfer]);

```

参数说明

**data**

从其他 window 中传递过来的对象。

**origin**

调用 postMessage 时消息发送方窗口的 origin,这个字符串由 协议、“://”、域名、":端口号”拼接而成。例

如“\[https://example.org(]\(https://example.org()隐含端囗 443)"、"\[http://example.net(]\(http://example.net()隐含端口 80)”、"<http://example.com:8080>”。请注意，这个origin不能保证是该窗口的当前或未来origin，因为postMessage被调用后可能被导航到不同的位置。

**source**

对发送消息的窗口对象的引用; 可以使用此来在具有不同origin的两个窗口之间建立双向通信。

#### 为什么部分请求中，参数需要使用 encodeURIComponent 进行转码?

一般来说，URL只能使用英文字母、阿拉伯数字和某些标点符号，不能使用其他文字和符号。这是因为网络标准RFC 1738做了硬性规定:

> "..only alphanumerics \[0-9a-zA-Z], the special characters "$-\_.+!*'()," \[not including the quotes - ed], andreserved characters used for their reserved purposes may be used unencoded within a URL.

这意味着，如果URL中有汉字，就必须编码后使用。但是麻烦的是，RFC1738没有规定具体的编码方法，而是交给应用程序(浏览器)自己决定。这导致"URL编码"成为了一个混乱的领域。

不同的操作系统、不同的浏览器、不同的网页字符集，将导致完全不同的编码结果。如果程序员要把每一种结果都考虑进去，是不是太恐怖了?有没有办法，能够保证客户端只用一种编码方法向服务器发出请求?就是使用Javascript先对URL编码，然后再向服务器提交，不要给浏览器插手的机会。因为javascript的输出总是一致的，所以就保证了服务器得到的数据是格式统一的。

Javascript语言用于编码的函数，一共有三个

1. 最古老的一个就是escape()。虽然这个函数现在已经不提倡使用了但是由于历史原因，很多地方还在使用它，所以有必要先从它讲起。具体规则是，除了ASCII字母、数字、标点符号"@* +-.""以外，对其他所有字符进行编码,
2. encodeURI()是Javascript中真正用来对URL编码的函数。它着眼于对整个URL进行编码，因此除了常见的符号以外，对其他一些在网址中有特殊含义的符号";/?:@ &=+$，#"，也不进行编码。编码后，它输出符号的utf-8形式，并且在每个字节前加上%。
3. 最后一个Javascript编码函数是encodeURIComponent()，与encodeURI()的区别是，它用于对URL的组成部分进行个别编码，而不用于对整个URL进行编码。

因此，";/?:@&=+$，#"，这些在encodeURI()中不被编码的符号，在encodeURIComponent()中统统会被编码。至于具体的编码方法，两者是一样。它对应的解码函数是decodeURIComponent()

#### 什么是 Polyfill

Polyfil 指的是用于实现浏览器并不支持的原生 API 的代码。比如说 querySelectorAll 是很多现代浏览器都支持的原生 Web API，但是有些古老的浏览器并不支持，那么假设有人写了一段代码来实现这个功能使这些浏览器也支持了这个功能，那么这就可以成为一个 Polyfill

#### 怎么实现扫描二维码实现PC登录

二维码登录本质

二维码登录本质上也是一种登录认证方式。既然是登录认证，要做的也就两件事情:

* 告诉系统我是谁
* 向系统证明我是谁

扫描二维码登录的一般步骤

* 扫码前，手机端应用是已登录状态，PC端显示一个二维码，等待扫描
* 手机端打开应用，扫描PC端的二维码，扫描后，会提示“已扫描，请在手机端点击确认"
* 用户在手机端点击确认，确认后PC端登录就成功了

具体流程

生成二维码

* PC端向服务端发起请求，告诉服务端，我要生成用户登录的二维码，并且把PC端设备信息也传递给服务端
* 服务端收到请求后，它生成二维码ID，并将二维码ID与PC端设备信息进行绑定
* 然后把二维码ID返回给PC端
* PC端收到二维码ID后，生成二维码(二维码中肯定包含了ID)
* 为了及时知道二维码的状态，客户端在展现二维码后，PC端不断的轮询服务端，比如每隔一秒就轮询一次，请求服务端告诉当前二维码的状态及相关信息，或者直接使用websocket，等待在服务端完成登录后进行通知

扫描二维码

* 用户用手机去扫描PC端的二维码，通过二维码内容取到其中的二维码ID
* 再调用服务端API将移动端的身份信息与二维码ID一起发送给服务端
* 服务端接收到后，它可以将身份信息与二维码ID进行绑定，生成临时token。然后返回给手机端
* 因为PC端一直在轮询二维码状态，所以这时候二维码状态发生了改变，它就可以在界面上把二维码状态更新为已扫描

状态确认

* 手机端在接收到临时token后会弹出确认登录界面，用户点击确认时，手机端携带临时token用来调用服务端的接口，告诉服务端，我已经确认
* 服务端收到确认后，根据二维码ID绑定的设备信息与账号信息，生成用户PC端登录的token
* 这时候PC端的轮询接口，它就可以得知二维码的状态已经变成了"已确认"。并且从服务端可以获取到用户登录的token
* 到这里，登录就成功了，后端PC端就可以用token去访问服务端的资源了

### DOM/BOM与性能优化

#### 事件流（必背）

1. 事件流分为三个阶段：捕获阶段、目标阶段、冒泡阶段。
2. 过程如下：

捕获阶段：事件从最外层的节点，也就是文档对象开始，逐级向下传播，直到事件的目标节点上。

目标阶段：事件到达目标节点，触发目标节点上的事件处理函数。

冒泡阶段：事件从目标节点开始，逐级向上传播，直到到达最外层节点（文档对象）

3. 事件冒泡和捕获的区别？

事件冒泡和事件捕获是两种不同的事件传播方式，默认是冒泡，它们的区别在于传播方向不同：

事件冒泡是从自下而上，从子元素冒泡到父元素，执行父元素上的事件处理。

事件捕获是事件从文档的根元素开始，逐级向下传播到较为具体的元素（即从父元素到子元素）。

4. 如何阻止事件冒泡

普通浏览器：event.stopPropagation()

IE浏览器：event.cancelBubble = true;

#### 事件代理/事件委托（必背）

**原理**

事件委托，把一个或者一组元素的事件委托到它的父层或者更外层元素上，真正绑定事件的是外层元素，不是目标元素

* 只指定一个事件处理程序，管理某一类型 所有事件
* 把一个元素响应事件（click、keydown......）的函数委托到另一个元素，冒泡阶段完成

使用事件委托，只需在DOM树中尽量高的一层添加一个事件处理程序

优点

* 节省内存，减少dom操作
* 不需要给子节点注销事件
* 动态绑定事件
* 提高性能
* 新添加的元素还会有之前的事件

#### 不会冒泡的事件有哪些?

在 JavaScript 和浏览器中，绝大多数事件都会按照 DOM 事件流模型冒泡，即事件会从目标元素开始向上冒泡到它的父元素，并最终到达 document 元素。然而，也有一些事件是不会冒泡的。这些事件通常直接在目标元素上触发，并不会向上传播。

* focus:当元素获得焦点时触发，例如通过键盘或鼠标点击。这是一个不会冒泡的事件
* blur :当元素失去焦点时触发。这也是一个不会冒泡的事件
* focusin:与 focus 类似，但会在元素或其父元素上触发(冒泡)，因此这个事件是特例
* focusout:与 blur 类似，但会在元素或其父元素上触发(冒泡)，因此这个事件是特例
* load:当图像、音频、视频或其他资源加载完成时触发。例如，在 img元素上触发的 load 事件不会冒泡
* unload:当页面即将被导航离开时触发。这通常用于执行清理工作，也不会冒泡
* stop:通常与 media 元素相关，例如 audio 或 video 元素。这是在媒体播放停止时触发的事件
* readystatechange:当 document的 readystate 改变时触发。这通常在页面加载时使用。
* scroll:当元素滚动时触发。这个事件在某些浏览器中可能会冒泡

这些事件通常直接在目标元素上触发，并且不会传播到父元素上

#### mouseEnter 和 mouseOver 有什么区别?

mouseenter 和 mouseover是两个用于处理鼠标进入元素时的事件，但它们在一些关键点上有所不同:

1. 事件冒泡:

* mouseenter:在鼠标指针首次进入特定元素(或其子元素)时触发。当鼠标进入元素时，会触发该元素的 mouseenter 事件，但不会在元素的子元素上冒泡。该事件通常用于检测鼠标首次进入元素时的动作。
* mouseover :这个事件在鼠标指针移动到某个元素上时触发，不论它是直接在这个元素上触发还是在其子元素上触发。当鼠标进入一个元素时，它会在该元素上触发 mouseover 事件，然后冒泡到父元素。

2. 事件触发范围:

* mouseenter:当鼠标进入元素自身时触发，只在目标元素上触发，不会因为鼠标移动到其子元素上而再次触发。
* mouseover:不仅在目标元素上触发，也在其子元素上触发。所以，如果鼠标从一个子元素移动到另一个子元素，这些元素的父元素会触发多个 mouseover事件。

3. 事件对象的属性

* mouseenter:事件对象通常会有 relatedTarget 属性，它指向鼠标移动前的那个元素。如果relatedTarget 指向目标元素或为 nu11，那么事件就不会触发。
* mouseover:事件对象也会有relatedTarget 属性，通常指向从中离开的那个元素。

4. 使用场景

* mouseenter 更适合用来检测鼠标首次进入某个元素时的行为。
* mouseover 更适合用来检测鼠标在元素或其子元素之间移动时的行为，因为它冒泡

在实际使用时，如果你只想在鼠标首次进入元素时触发某些行为(比如显示一个提示)，可以使用mouseenter;

如果你希望在鼠标移动到某个元素或其子元素上时都触发某些行为(比如动态改变样式)，可以用mouseover

#### script标签放在header里和放在body底部里有什么区别?（必背）

将<script> 标签放在<head>和<body> 底部，会对页面的加载和性能产生不同的影响:

1. **<script>标签放在 <head>部分**

优点:

* 预加载: 浏览器在渲染页面之前，会先下载和解析所有在 <head>部分的脚本文件。这样可以确保脚本在页面加载过程中随时可以被调用。
* 全局可用性: 一些脚本，特别是需要在页面一加载就运行的脚本，适合放在<head>中。

缺点:

* 阻塞渲染: 浏览器在遇到 <script> 标签时会暂停 HTML 的解析和渲染，直到脚本下载并执行完毕。这可能

会导致页面加载变慢，尤其是当脚本文件较大或者需要从远程服务器下载时

* 页面白屏时间延长: 用户可能会看到页面在加载过程中有一段时间的白屏，直到脚本加载完成

2. **<script>标签放在<body>底部**

优点:

* 非阻塞渲染:将<script>标签放在<body> 底部意味着浏览器可以优先下载和渲染 HTML 内容，这样用户可以更快地看到页面内容
* 更好的用户体验: 用户不会因为等待脚本加载而长时间看到空白页面。页面内容会先显示出来，然后再执行脚本，这提高了页面的响应速度和用户体验。

缺点:

延迟脚本执行: 如果某些脚本需要在页面加载之前运行(如某些初始化脚本)，放在 <body>底部可能会导致这些脚本运行延迟，影响功能。

3. **现代优化技术**

defer 属性:在<head>部分使用<script>标签时，可以添加 defer 属性。这个属性会告诉浏览器异步下载脚本，但在页面解析完成后再执行脚本。这样既可以保持脚本全局可用，又不会阻塞页面染。

```javascript
<script src="script.js" defer></script>

```

async 属性:async 属性也用于异步加载脚本，但它会在脚本下载完成后立即执行，不考虑页面的解析进度。这对某些独立的、不会依赖于其他脚本或 DOM 结构的脚本很有用。

```javascript
<script src="script.js" async></script>

```

**总结**

* <head>部分:适合需要立即执行的脚本，但可能阻塞页面渲染
* <body>底部:适合一般脚本，能提高页面加载性能和用户体验
* 使用 defer或 async:现代浏览器支持这些属性，可以同时兼顾性能和功能需求。

#### offsetWidth/offsetHeight,clientWidth/clientHeight 与scrollWidth/scrollHeight 的区别?

clientWidth/clientHeight 返回的是元素的内部宽度，它的值只包含 content +padding，如果有滚动条，不包含滚动条

clientTop 返回的是上边框的宽度

clientLeft 返回的左边框的宽度

ofsetWidth/offsetHeight 返回的是元素的布局宽度，它的值包含 content+ padding+ border 包含了滚动条

offsetTop 返回的是当前元素相对于其 offsetParent 元素的顶部的距离。

offsetLeft 返回的是当前元素相对于其 offsetParent 元素的左部的距离

scrollWidth/scrollHeight 返回值包含 content + padding + 溢出内容的尺寸。

scrolTop 属性返回的是一个元素的内容垂直滚动的像素数。

scrollLeft 属性返回的是元素滚动条到元素左边的距离,

#### 获取 DOM 元素（必背）

* querySelector('CSS选择器')：
* querySelectorAll('CSS选择器')：
* getElementById('id')：通过 ID 获取。
* getElementsByTagName('div')：通过标签名获取。
* getElementsByClassName('w')：通过类名获取。

#### 监听鼠标事件

**1. 基础事件监听**

***方法**：使用`addEventListener`绑定事件到DOM元素。
***常用事件类型**：
  * `click`：单击（左键按下并释放）
  * `dblclick`：双击
  * `mousedown`/`mouseup`：按下/释放鼠标按键（可区分左、中、右键）
  * `mousemove`：实时追踪鼠标移动
  * `mouseenter`/`mouseleave`：进入/离开元素（不冒泡）
  * `mouseover`/`mouseout`：进入/离开元素（冒泡，子元素触发）

**2. 高级技巧**

**事件委托**：

将事件绑定到父元素，通过`event.target`判断子元素，减少监听器数量

```javascript
document.getElementById('parent').addEventListener('click', (event) => {
  if (event.target.classList.contains('child')) {
    console.log('Child element clicked');
  }
});

```

**组合键判断**：

通过`event.ctrlKey`、`event.shiftKey`等实现快捷键功能

```javascript
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault(); // 阻止默认保存行为
    saveContent();
  }
});

```

#### 鼠标双击事件优化

原生事件支持

Web端通过`dblclick`事件直接监听双击行为，无需手动实现时间间隔检测：

```javascript
const element = document.getElementById('myElement');
element.addEventListener('dblclick', (event) => {
  console.log('双击触发', event.clientX, event.clientY);
});

```

**优势**：浏览器原生支持，无额外延迟，性能高效

***事件对象属性**：
  * `event.clientX/Y`：鼠标相对于视口的坐标。
  * `event.target`：触发事件的元素

**与单击事件的冲突解决**

双击事件会默认触发两次`click`事件，需通过定时器管理状态：

```javascript
let clickCount = 0;
let timer = null;

element.addEventListener('click', (event) => {
  clickCount++;
  if (clickCount === 1) {
    timer = setTimeout(() => {
      // 单击逻辑
      clickCount = 0;
    }, 300);
  } else if (clickCount === 2) {
    clearTimeout(timer);
    // 双击逻辑
    clickCount = 0;
  }
});

```

***关键点**：
  * 设定时间阈值（通常为300ms），超时则判定为单击
  * 双击时清除单击定时器，避免冲突

#### addEventListener()和attachEvent()的区别（必背）

* addEventListener()是符合W3C规范的标准方法;attachEvent()是IE低版本的非标准方法
* addEventListener()支持事件冒泡和事件捕获;而 attachEvent()只支持事件冒泡
* addEventListener() 的第一个参数中,事件类型不需要添加 on ;attachEvent()需要添加'on'
* 如果为同一个元素绑定多个事件，addEventListener()会按照事件绑定的顺序依次执行attachEventO 会按照事件绑定的顺序倒序执行

#### addEventListener 第三个参数

```javascript
addEventListener(type,listener);
addEventListener(type,listener,options);
addEventListener(type,listener,useCapture);

```

type 表示监听事件类型的大小写敏感的字符串,listener 当所监听的事件类型触发时，会接收到一个事件通知(实现了 Event 接口的对象)对象。listener 必须是一个实现了 EventListener 接口的对象，或者是一个函数。有关回调本身的详细信息，请参阅事件监听回调

* options 可选一个指定有关 listener 属性的可选参数对象。可用的选项如下:
* capture可选一个布尔值，表示 listener会在该类型的事件捕获阶段传播到该 EventTarget 时触发。
* once 可选一个布尔值，表示 listener在添加之后最多只调用一次。如果为 true，listener 会在其被调用之后自动移除。
* passive 可选一个布尔值，设置为true时，表示 listener永远不会调用 preventDefault()。如果listener 仍然调用了这个函数，客户端将会忽略它并抛出一个控制台警告。查看使用 passive 改善滚屏性能以了解更多。
* signal 可选Abortsignal，该 Abortsignal 的 abort()方法被调用时，监听器会被移除。

usecapture 可选一个布尔值，表示在 DOM 树中注册了 listener 的元素，是否要先于它下面的EventTarget 调用该 listener。

当 useCapture(设为 true)时，沿着 DOM 树向上冒泡的事件不会触发listener。当一个元素嵌套了另一个元素，并且两个元素都对同一事件注册了一个处理函数时，所发生的事件冒泡和事件捕获是两种不同的事件传播方式。

事件传播模式决定了元素以哪个顺序接收事件。进一步的解释可以查看DOM Level 3 事件及 JavaScript 事件顺序文档。如果没有指定，usecapture 默认为 false 。

备注: 对于事件目标上的事件监听器来说，事件会处于“目标阶段”，而不是冒泡阶段或者捕获阶段。捕获阶段的事件监听器会在任何非捕获阶段的事件监听器之前被调用。

#### window.requestAnimationFrame

window.requestAnimationFrame()告诉浏览器--执行一个动画，并且要求浏览器在下次重绘之前调用指定

的回调函数更新动画。

* 该方法需要传入一个回调函数作为参数，该回调函数会在浏览器下一次重绘之前执行
* 与setTimeout相比，requestAnimationFrame最大的优势是由系统来决定回调函数的执行时机。
* 具体一点讲，如果屏幕刷新率是60Hz,那么回调函数就每16.7ms被执行一次，如果刷新率是75Hz，那么这个时间间隔就变成了1000/75=13.3ms，
* 换句话说就是，requestAnimationFrame的步伐跟着系统的刷新步伐走。它保证回调函数在屏幕每一次的刷新间隔中只被执行一次，这样就不会引起丢帧现象，也不会导致动画出现卡顿的问题这个API的调用很简单，

**如下所示:**

```javascript
const element = document.getElementById('some-element-you-want-to-animate');
let start;

function step(timestamp){
  if(start === undefined)
    start = timestamp;
  const elapsed=timestampstart;
  //这里使用`Math.min()`确保元素刚好停在200px的位置
  element.style.transform ='translateX('+ Math.min(0.1*elapsed, 200)+ 'px)';

  if(elapsed<2000){//在两秒后停止动画
    window.requestAnimationFrame(step);
  }
}
window.requestAnimationFrame(step);

```

除此之外，requestAnimationFrame还有以下两个优势:

1. **CPU节能**:使用setTimeout实现的动画，当页面被隐藏或最小化时，setTimeout 仍然在后台执行动画任务，由于此时页面处于不可见或不可用状态，刷新动画是没有意义的，完全是浪费CPU资源。而RAF则完全不同，当页面处理未激活的状态下，该页面的屏幕刷新任务也会被系统暂停，因此跟着系统步伐走的RAF也会停止渲染，当页面被激活时，动画就从上次停留的地方继续执行，有效节省了CPU开销。
2. **函数节流**:在高频率事件(resize,scroll等)中，为了防止在一个刷新间隔内发生多次函数执行，使用RAF可保证每个刷新间隔内，函数只被执行一次，这样既能保证流畅性，也能更好的节省函数执行的开销。一个刷新间隔内函数执行多次时没有意义的，因为显示器每16.7ms刷新一次，多次绘制并不会在屏幕上体现出来。

##### RAF执行非常耗时的同步任务

1. **阻塞渲染与界面冻结**

浏览器渲染页面的过程是逐帧进行的，通常每秒60帧（约16.7毫秒/帧）。在这个过程中，JavaScript执行、样式计算、布局（重排）、绘制（重绘）等任务都需要在这一帧的时间内完成。

当你将一个耗时很长的同步任务（例如一个复杂的数学计算、大规模循环、同步的DOM操作等）放入 rAF 回调中时，它会独占浏览器的主线程。由于JavaScript是单线程的，这意味着在它执行完毕之前，后续的样式计算、布局、绘制、甚至其他JavaScript任务都会被阻塞。

* 直观表现：页面会出现卡顿、无响应的状态，动画和交互都会完全停止，直到该任务执行完毕。
* 监控指标：浏览器的FPS（每秒帧数）会急剧下降甚至降为0。

这直接违背了使用 rAF 来创建流畅动画的初衷

2. **延迟后续帧的回调**

rAF 的设计是每次重绘前调用一次。但如果当前帧的回调函数执行时间远远超过了一帧的预算时间（如16.7ms），那么浏览器无法按时开始下一帧的渲染工作。

这会导致后续的 rAF 回调被严重延迟。即使你的耗时任务最终执行完了，下一个 rAF 回调也不会立刻被触发，它必须等待下一次VSync信号（垂直同步）后的重绘时机。这就造成了动画的不连贯和跳帧现象。

3. **任务被中断或合并**

虽然 rAF 回调会集中DOM操作以减少重排重绘，但超长的执行时间可能会让浏览器无法优化。有时，为了性能，浏览器可能会合并多次本应分别执行的渲染更新，用户看到的是跳跃式的变化，不是平滑过渡。

#### 如何获取页面滚动值（选背）

为确保在所有浏览器和文档模式下都能正确获取滚动距离，建议采用以下优先级顺序：

1. **首选**：`window.pageYOffset`（现代浏览器）
2. **备选**：`document.documentElement.scrollTop`（标准模式）
3. **最后**：`document.body.scrollTop`（怪异模式）

##### 获取垂直滚动距离的兼容性写法

```javascript
var scrollTop = window.pageYOffset ||

  window.scrollY ||

  document.documentElement.scrollTop ||

  document.body.scrollTop ||

  0;

```

##### 获取水平滚动距离的兼容性写法

```javascript
var scrollLeft = window.pageXOffset ||

  window.scrollX ||

  document.documentElement.scrollLeft ||

  document.body.scrollLeft ||

  0;

```

#### 判断元素是否在视口内

| **特性**       | `getBoundingClientRect()`            | `Intersection Observer API`                |
| :------------- | :----------------------------------- | :----------------------------------------- |
| **原理**       | 同步计算元素位置                     | 异步观察交叉状态                           |
| **性能**       | 频繁调用可能导致性能问题（强制重排） | **高性能**，由浏览器优化，避免布局抖动     |
| **使用便利性** | 需手动监听 `scroll`, `resize`事件    | **自动监听**，无需手动处理事件             |
| **功能**       | 相对基础                             | **功能强大**，支持阈值、根元素、边距等配置 |
| **兼容性**     | **兼容性极好**（包括 IE）            | 现代浏览器支持良好，**IE 11 及以下不支持** |

#### document.write和innerHTML有什么区别

* document.write是直接写入到页面的内容流，如果在写之前没有调用document.open,浏览器会自动调用open。
* 每次写完关闭之后重新调用该函数，会导致页面被重写
* innerHTML则是DOM页面元素的一个属性，代表该元素的html内容。你可以精确到某一个具体的元素来进行更改。如果根修改document的内容，则需要修改document.documentElement.innerElement。
* innerHTML将内容写入某个DOM节点，不会导致页面全部重绘
* innerHTML很多情况下都优于document.write，其原因在于其允许更精确的控制要刷新页面的那一个部分。

#### 怎么预防用户快速连续点击，造成数据多次提交?（必背）

* 为了防止重复提交，前端一般会在第一次提交的结果返回前，将提交按钮禁用。实现的方法有很多种:
* css设置 pointer-events为none
* 增加变量控制，当变量满足条件时才执行点击事件的后续代码(比如给按钮的点击事件增加防抖)
* 如果按钮使用 button 标签实现，可以使用 disabled 属性加遮罩层，比如一个全屏的loading，避免触发按钮的点击事件

#### 怎么实现大型文件上传?

大文件快速上传的方案，其实无非就是将 文件变小，也就是通过 **压缩文件资源** 或者 **文件资源分块** 后再上传具体来说，可以考虑以下几种方法:

1. 分片上传(Chunked Upload):

将大文件拆分成小的文件块(chunk)，然后通过多个并行的请求依次上传这些文件块。服务器接收到每个文件块后进行存储，最后合并所有文件块以还原原始文件。这种方法可以降低单个请求的负载，并允许在网络中断或上传失败时可以从断点续传。

2. 流式上传(Streaming Upload):

客户端使用流方式逐步读取文件的内容，并将数据流通过 POST 请求发送给服务器。服务器端能够逐步接收并处理这些数据流，而无需等待完整的文件上传完成。这种方法适用于较大的文件，减少了内存占用和传输延迟。

3. 使用专门的文件上传服务:

有一些第三方服务可供使用，例如云存储服务(如 Amazon S3、Google Cloud3Storage)、文件传输协议(如 FTP、SFTP)等。这些服务通常提供了高可靠性、可扩展性和安全性，并且针对大文件上传进行了优化。

4. 压缩文件上传:

如果可能，可以在客户端先对文件进行压缩，然后再进行上传。压缩后的文件大小更小，可以4减少上传时间和网络带宽消耗。

5. 并发上传:

通过多个并行的请求同时上传文件的不同部分，以加快整个上传过程。这需要服务器端支持并发上传并正确处理分片或部分文件的合并。

6. 断点续传:

记录上传进度和状态，以便在网络中断或上传失败后能够从上次中断的位置继续上传。可以使用客户端或服务器端的断点续传机制来实现。

***问题 1:谁负责资源分块?谁负责资源整合?***

当然这个问题也很简单，肯定是前端负责分块，服务端负责整合:

***问题 2:前端怎么对资源进行分块?***

首先是选择上传的文件资源，接着就可以得到对应的文件对象 File，而 File.prototype.slice 方法可以实现资源的分块，当然也有人说是 Blob.prototype.slice方法，因为Blob.prototype.slice ===File.prototype.slice

***问题 3:服务端怎么知道什么时候要整合资源?如何保证资源整合的有序性?***

由于前端会将资源分块，然后单独发送请求，也就是说，原来1个文件对应1个上传请求，现在可能会变成1个文件对应n个上传请求，所以前端可以基于 Promise.a 将这多个接口整合，上传完成在发送一个合并的请求，通知服务端进行合并。

合并时可通过 nodejs 中的读写流(readStream/writeStream)，将所有切片的流通过管道(pipe)输入最终文件的流中。

在发送请求资源时，前端会定好每个文件对应的序号，并将当前分块、序号以及文件 hash 等信息一起发送给服务端，服务端在进行合并时，通过序号进行依次合并即可。

***问题 4:如果某个分块的上传请求失败了，怎么办?***

一旦服务端某个上传请求失败，会返回当前分块失败的信息，其中会包含文件名称、文件 hash、分块大小以及分块序号等，前端拿到这些信息后可以进行重传，同时考虑此时是否需要将Promise.all替换为 Promise.alSettled 更方便。

#### 怎么实现虚拟列表?

虚拟列表是一种优化长列表渲染性能的技术，只渲染可见区域内的部分内容，从而大幅降低了页面渲染的复杂度。

具体而言，实现虚拟列表需要以下步骤:

***计算可见区域**:首先需要计算出当前可见区域内的列表项数量和位置
***渲染可见区域**:只渲染当前可见区域内的列表项，而不是整个列表。
***动态调整列表高度**:由于只渲染了部分列表项，因此需要动态调整列表容器的高度，以确保滚动条可以正确地显示并且用户可以滚动整个列表。
***延迟加载非可见区域**:当用户滚动列表时，需要根据当前滚动位置动态加载非可见区域的列表项，以便在用户滚动到该区域时能够及时显示。

在实现虚拟列表的过程中，还可以使用一些技术来优化渲染性能，包括:

***虚拟 DOM**:使用虚拟 DOM 技术可以减少每次重新渲染时需要操作真实 DOM 的次数，从而提高渲染性能。
***懒加载**:懒加载可以延迟加载非可见区域的列表项，从而减少不必要的网络请求和资源占用。
***缓存**:缓存可以在滚动时快速复用已经渲染的列表项，从而减少重新染的次数。
***预测算法**:使用预测算法可以根据当前滚动位置和滚动速度来预测用户可能查看的区域，并提前加载该区域的列表项，以提高用户体验。

总之，实现虚拟列表需要计算可见区域、渲染可见区域、动态调整列表高度和延迟加载非可见区域等步骤，并且需要使用一些技术来优化渲染性能。虚拟列表可以大幅提高长列表的渲染性能，并提高用户体验。

#### 为什么推荐将静态资源放到cdn上?（选背）

**静态资源是什么**

静态资源

静态资源是指在不同请求中访问到的数据都相同的静态文件。例如:图片、视频、网站中的文件(html、cssjs)、软件安装包、apk文件、压缩包文件等。

动态资源

动态资源是指在不同请求中访问到的数据不相同的动态内容。例如:网站中的文件(asp、jsp、php、perl、cgi)、API接口、数据库交互请求等。

**CDN是什么**

* 内容分发网络，是建立并覆盖在承载网之上，由分布在不同区域的边缘节点服务器群组成的分布式网络
* CDN加速的本质是缓存加速，将服务器上存储的静态内容缓存在CDN节点上，当访问这些静态内容时，无需访问服务器源站，就近访问CDN节点即可获取相同内容，从而达到加速的效果，同时减轻服务器源站的压力
* CDN应用广泛，解决因分布、带宽、服务器性能带来的访问延迟问题，适用于站点加速、点播、直播等场景。使用户可就近取得所需内容，解决 Internet网络拥挤的状况，提高用户访问网站的响应速度和成功率。由于访问动态内容时，每次都需要访问服务器，由服务器动态生成实时的数据并返回
* 因此CDN的缓存加速不适用于加速动态内容，CDN无法缓存实时变化的动态内容。对于动态内容请求，CDN节点只能转发回服务器源站，没有加速效果。

**CDN的作用**

1. 加速网站的访问
2. 为了实现跨运营商、跨地域的全网覆盖

互联不互通、区域ISP地域局限、出口带宽受限制等种种因素都造成了网站的区域性无法访问。CDN加速可以覆盖全球的线路，通过和运营商合作，部署IDC资源，在全国骨干节点商，合理部署CDN边缘分发存储节点，充分利用带宽资源，平衡源站流量。

3. 为了保障你的网站安全

CDN的负载均衡和分布式存储技术，可以加强网站的可靠性，相当无无形中给你的网站添加了一把保护伞，应对绝大部分的互联网攻击事件。防攻击系统也能避免网站遭到恶意攻击。

4. 为了异地备援

当某个服务器发生意外故障时，系统将会调用其他临近的健康服务器节点进行服务，进而提供接近100%的可靠性，这就让你的网站可以做到永不宕机。

5. 为了节约成本投入

使用CDN加速可以实现网站的全国铺设，你根据不用考虑购买服务器与后续的托管运维，服务器之间镜像同步，也不用为了管理维护技术人员而烦恼，节省了人力、精力和财力。6.为了让你更专注业务本身CDN加速厂商一般都会提供一站式服务，业务不仅限于CDN，还有配套的云存储、大数据服务、视频云服务等，而且一般会提供7x24运维监控支持，保证网络随时畅通，你可以放心使用。并且将更多的精力投入到发展自身的核心业务之上。

**CDN工作原理**

当用户点击网站页面上的内容URL，经过本地DNS系统解析，DNS系统会最终将域名的解析权交给CNAME指向的CDN专用DNS服务器。

CDN的DNS服务器将CDN的全局负载均衡设备IP地址返回用户。

用户向CDN的全局负载均衡设备发起内容URL访问请求。

CDN全局负载均衡设备根据用户IP地址，以及用户请求的内容URL，选择一台用户所属区域的区域负载均衡设备，告诉用户向这台设备发起请求。

区域负载均衡设备会为用户选择一台合适的缓存服务器提供服务，选择的依据包括:根据用户IP地址，判断哪一台服务器距用户最近;根据用户所请求的URL中携带的内容名称，判断哪一台服务器上有用户所需内容;查询各个服务器当前的负载情况，判断哪一台服务器尚有服务能力。基于以上这些条件的综合分析之后，区域负载均衡设备会向全局负载均衡设备返回一台缓存服务器的IP地址。

全局负载均衡设备把服务器的IP地址返回给用户。

用户向缓存服务器发起请求，缓存服务器响应用户请求，将用户所需内容传送到用户终端。如果这台缓存服务器上并没有用户想要的内容，而区域均衡设备依然将它分配给了用户，那么这台服务器就要向它的上一级缓存服务器请求内容，直至追溯到网站的源服务器将内容拉到本地。DNS服务器根据用户IP地址，将域名解析成相应节点的缓存服务器IP地址，实现用户就近访问。使用CDN服务的网站，只需将其域名解析权交给CDN的GSLB设备，将需要分发的内容注入CDN，就可以实现内容加速了。

**当没有CDN时**

今天我们看到的网站系统基本上都是基于B/S架构的。B/S架构，即Browser-Server(浏览器 服务器)架构。

用户通过浏览器等方式访问网站的过程:

* 用户在自己的浏览器中输入要访问的网站域名，
* 浏览器向本地DNS服务器请求对该域名的解析。
* 本地DNS服务器中如果缓存有这个域名的解析结果，则直接响应用户的解析请求。
* 本地DNS服务器中如果没有关于这个域名的解析结果的缓存，则以递归方式向整个DNS系统请求解析，获得应答后将结果反馈给浏览器。
* 浏览器得到域名解析结果，就是该域名相应的服务设备的IP地址。
* 浏览器向服务器请求内容、
* 服务器将用户请求内容传送给浏览器

#### 导致页面加载白屏时间长的原因有哪些，怎么进行优化?

**一、白屏时间**

白屏时间:即用户点击一个链接或打开浏览器输入URL地址后，从屏幕空白到显示第一个画面的时间。

**二、白屏时间的重要性**

当用户点开一个链接或者是直接在浏览器中输入URL开始进行访问时，就开始等待页面的展示。页面渲染的时间越短，用户等待的时间就越短，用户感知到页面的速度就越快。这样可以极大的提升用户的体验，减少用户的跳出，提升页面的留存率。

**三、白屏的过程**

从输入url，到页面的画面展示的过程

1. 首先，在浏览器地址栏中输入url
2. 浏览器先查看浏览器缓存-系统缓存-路由器缓存，如果缓存中有，会直接在屏幕中显示页面内容。若没有，则跳到第三步操作。
3. 在发送http请求前，需要域名解析(DNS解析)，解析获取相应的IP地址。
4. 浏览器向服务器发起tcp连接，与浏览器建立tcp三次握手。
5. 握手成功后，浏览器向服务器发送http请求，请求数据包。
6. 服务器处理收到的请求，将数据返回至浏览器
7. 浏览器收到HTTP响应
8. 读取页面内容，浏览器渲染，解析htmI源码
9. 生成Dom树、解析css样式、js交互,渲染显示页面浏览器下载HTML后，首先解析头部代码，进行样式表下载，然后继续向下解析HTML代码，构建DOM树，同时进行样式下载。当DOM树构建完成后，立即开始构造CSSOM树。理想情况下，样式表下载速度够快，DOM树和CSSOM树进入一个并行的过程，当两棵树构建完毕，构建染树，然后进行绘制。Tips:浏览器安全解析策略对解析HTML造成的影响:

当解析HTML时遇到内联JS代码，会阻塞DOM树的构建，会先执行完JS代码:当CSS样式文件没有下载完成时，浏览器解析HTML遇到了内联]S代码，此时，浏览器暂停]S脚本执行，暂停HTML解析。直到CSS文件下载完成，完成CSSOM树构建，重新恢复原来的解析

JavaScript 会阻塞 DOM 生成，而样式文件又会阻塞 JavaScript 的执行，所以在实际的工程中需要重点关注JavaScript 文件和样式表文件，使用不当会影响到页面性能的。

**四、白屏-性能优化**

1. DNS解析优化

针对DNS Lookup环节，我们可以针对性的进行DNS解析优化:

* DNS缓存优化
* DNS预加载策略
* 稳定可靠的DNS服务器

2. TCP网络链路优化

* 多花点钱吧

3. 服务端处理优化

* 服务端的处理优化，是一个非常庞大的话题，会涉及到如Redis缓存、数据库存储优化或是系统内的各种中间件以及Gzip压缩等..

4. 浏览器下载、解析、渲染页面优化

* 根据浏览器对页面的下载、解析、渲染过程，可以考虑一下的优化处理
* 尽可能的精简HTML的代码和结构
* 尽可能的优化CSS文件和结构
* 一定要合理的放置JS代码，尽量不要使用内联的JS代码
* 将渲染首屏内容所需的关键CSS内联到HTML中，能使CSS更快速地下载。在HTML下载完成之后就能渲染了，页面渲染的时间提前，从而缩短首屏渲染时间:
* 延迟首屏不需要的图片加载，而优先加载首屏所需图片(offsetTop\<clientHeight)

```javascript
document.documentElement.clientHeight//获取屏幕可视区域的高度1
element.offsetTop//获取元素相对于文档顶部的高度2

```

因为JavaScript 会阻塞 DOM 生成，而样式文件又会阻塞 JavaScript 的执行，所以在实际的工程中需要重点关注JavaScript 文件和样式表文件，使用不当会影响到页面性能的。

#### 怎么使用 js 实现拖拽功能?

一个元素的拖拽过程，我们可以分为三个步骤:

* 第一步是鼠标按下目标元素
* 第二步是鼠标保持按下的状态移动鼠标
* 第三步是鼠标抬起，拖拽过程结束

这三步分别对应了三个事件，mousedown 事件，mousemove 事件和 mouseup 事件。只有在鼠标按下的状态移动鼠标我们才会执行拖拽事件，因此我们需要在 mousedown 事件中设置一个状态来标识鼠标已经按下，然后在mouseup 事件中再取消这个状态。在 mousedown 事件中我们首先应该判断，目标元素是否为拖拽元素，如果是拖拽元素，我们就设置状态并且保存这个时候鼠标的位置。然后在 mousemove 事件中，我们通过判断鼠标现在的位置和以前位置的相对移动，来确定拖拽元素在移动中的坐标。最后 mouseup 事件触发后，清除状态，结束拖拽事件。

#### 移动端的点击事件的有延迟，时间是多久，为什么会有?怎么解决这个延时?

移动端点击有 300ms 的延迟是因为移动端会有双击缩放的这个操作，因此浏览器在 click 之后要等待 300ms，看用户有没有下一次点击，来判断这次操作是不是双击。

有三种办法来解决这个问题:

* 通过 meta 标签禁用网页的缩放。
* 通过 meta 标签将网页的 viewport 设置为 ideal viewport.
* 调用一些js库，比如 FastClick

click 延时问题还可能引起点击穿透的问题，就是如果我们在一个元素上注册了 touchStart 的监听事件，这个事件会将这个元素隐藏掉，我们发现当这个元素隐藏后，触发了这个元素下的一个元素的点击事件，这就是点击穿透。

#### flexible.js实现移动端适配的原理是什么?

> flexible.js 官方已不再维护，目前推行 vw 适配方案，本答案只是为了分析它的原理。

flexible.js存在的目的，是为了让网页在各终端上的展示效果就像缩放设计稿图片一样，在不同屏幕上等比缩放，每一个元素与整体比例保持不变，真实还原设计稿。

基本原理

* 设页面宽度为P(单位px)
* 设计稿宽度为750px
* 设html基准值为X(单位px)

首先将页面分为100份，份的单位为F

设1F的像素值为A(单位px/F)

那么:

* P=100F*A
* A = P/100F

当P为750时，A=7.5px/F，即一份为7.5px

有没有感觉这个A有点熟悉，没错它就是X，上面份的单位F其实就是rem。(html font-size的基准值单位虽然写为px，但其实是px/F，这点你知道就可以了)现在懂了吧。

rem的原理就是份，我们根据设计稿得到元素的份，写到代码中的也是份，现在只要动态改变html的基准值，就能够在不同屏幕下适配，从而还原设计稿尺寸了。

所以flexible.js的原理主要是:

window.onresize =function(){html.size = P/100 + 'px'}

当然针对高清屏，它还会设置“viewport scale”，以缩放页面，解决类似高清屏下无法实现1px边框等问题

需要注意的是，基准值其实是个动态值，只是在写代码时，我们是按照设计稿宽度计算的基准值写的rem，即以设计稿为标准进行屏幕适配的(将设计稿用代码还原成UI界面)，但在实际运行时，页面宽度是动态的，所以基准值也是动态的哦。

### 高级主题与安全

#### 什么行为会引发内存泄漏（必背）

1. 意外的全局变量：由于使用未声明的变量，而意外创建一个全局变量，而使这个变量一直留在内存中无法回收。
2. 被遗忘的计时器或回调函数：设置了 setInterval 定时器，而忘记取消它，如果循环函数有对外部变量的引用的话，那么这个变量会被一直留在内存中，而无法被回收。
3. 脱离 DOM 的引用：获取一个 DOM 元素的引用，而后面这个元素被删除，由于一直保留了对这个元素的引用，所以它也无法被回收。
4. 闭包：不合理的使用闭包，从而导致某些变量一直被留在内存当中

#### 内存泄漏解决方法（必背）

1. **合理管理对象引用**

* 避免使用不必要的全局变量，及时将不再使用的对象引用置为`null`或`undefined`。
* 在PyTorch等深度学习框架中，正确管理Tensor的引用计数，避免Tensor占用过多显存。

2. **移除无用的事件监听器**

* 在组件卸载或页面关闭时，手动移除事件监听器，避免内存泄漏。

3. **清理异步操作**

* 在组件销毁时，取消未完成的异步请求、定时器或Promise，确保资源释放。

4. **使用内存泄漏检测工具**

* 在C#或嵌入式开发中，使用工具如MemFault检测和分析内存泄漏。
* 在前端开发中，利用浏览器的开发者工具（如Performance面板）定位内存泄漏问题。

5. **优化垃圾回收机制**

* 在支持自动GC的语言（如JavaScript、Python）中，尽量避免手动操作内存，依赖GC机制自动回收。
* 在C/C++等无自动GC的语言中，确保动态分配的内存被及时释放。

#### 在项目中是如何捕获 JavaScript 错误的?有哪些方式?（必背）

* 使用 try...catch 捕获同步代码错误
* 利用 window.onerror 捕获运行时错误
* 使用 window.addEventListener('unhandledrejection') 捕获未处理的 Promise 异常
* 使用 ErrorBoundary(React项目)捕获组件染错误
* 日志上报(埋点)系统+source map 映射调试

#### AST语法树是什么?

AST是抽象语法树的缩写，它是一种用于表示程序源代码结构的树状数据结构。AST可以将源代码解析为一个由节点组成的树形结构，每个节点代表着代码中的一个特定语法结构或语义概念。在编译过程中，AST扮演了重要的角色。它被用于分析、转换和生成代码。以下是一些常见的使用情况:

1. **解析和验证:**

通过解析源代码，将其转换为AST之后，可以对代码进行验证和静态分析。这包括检查语法错误、类型错误、变量引用等，并发现潜在的问题或优化机会。

2. **优化和转换:**

AST可以用于执行各种优化操作，例如消除冗余代码、提取共享表达式、内联函数调用等。它还能够进行代码转换，例如将ES6代码转换为ES5兼容的代码、将模板编译为染函数等

3. **生成代码:**

从AST中可以再次生成目标代码，如JavaScript、HTML、CSS等。这使得可以将源代码翻译为其他语言、在不同平台上执行代码等。

AST通常是由多个节点组成的树状结构，每个节点代表一个语法单位或表达式。节点之间的关系通过父子关系或兄弟关系来表示程序的结构，在不同的编程语言和工具中，AST可能有不同的表示方式和节点类型

通过使用AST，开发人员可以更好地理解和分析代码的结构，从而进行静态分析、优化和转换等操作。它也为很多编程工具提供了基础，如编译器、静态代码分析工具和IDE等。

#### 项目上线出现白屏问题，你是如何排查的?（必背）

* 检查是否有主 JS 加载失败(查看 Chrome DevTools Network)
* 查看是否有资源跨域、CDN 缓存、source等问题
* 控制台是否有报错(如模块加载失败、运行时错误)
* index.html是否渲染，或根组件是否挂载成功
* 加入loading skeleton 或 fallback 机制防止页面完全空白

#### 什么是 PWA?

PWA的中文名叫做渐进式网页应用，早在2014年，W3C公布过 Service Worker 的相关草案，但是其在生产环境被 Chrome 支持是在 2015 年。因此，如果我们把 PWA 的关键技术之- Service Worker 的出现作为 PWA 的诞生时间，那就应该是 2015 年。

自 2015 年以来，PWA 相关的技术不断升级优化，在用户体验和用户留存两方面都提供了非常好的解决方案。PWA 可以将 Web 和 App 各自的优势融合在一起:渐进式、可响应、可离线、实现类似 App 的交互、即时更新安全、可以被搜索引擎检索、可推送、可安装、可链接。需要特别说明的是，PWA 不是特指某一项技术，而是应用了多项技术的 Web App。其核心技术包括 AppManifest、Service Worker、Web Push，等等,

#### 什么是点击穿透，怎么解决?

在发生触摸动作约300ms之后，移动端会模拟产生click动作，它底下的具有点击特性的元素也会被触发，这种现象称为点击穿透。

常见场景

* 情景一:蒙层点击穿透问题，点击蒙层(mask)的关闭按钮，蒙层消失后发现触发了按钮下面元素的click事件。
* 情景二:跨页面点击穿透问题:如果按钮下面恰好是一个有href属性的a标签，那么页面就会发生跳转
* 情景三:另一种跨页面点击穿透问题:这次没有mask了，直接点击页内按钮跳转至新页，然后发现新页面中对应位置元素的click事件被触发了
* 情景四:不过概率很低，就是新页面中对应位置元素恰好是a标签，然后就发生连续跳转了

发生的条件

* 上层元素监听了触摸事件，触摸之后该层元素消失
* 下层元素具有点击特性(监听了click事件或默认的特性(a标签、input、button标签))

解决点击穿透的方法

* 方法一:书写规范问题，不要混用touch和click。既然touch之后300ms会触发click，只用touch或者只用click就自然不会存在问题了。
* 方法二:吃掉(或者说是消费掉)touch之后的click，依旧用tap，只是在可能发生点击穿透的情形做额外的处理，拿个东西来挡住、或者tap后延迟350毫秒再隐藏mask、pointer-events、在下面元素的事件处理器里做检测(配合全局flag)等。

#### JSBridge是什么?

JSBridge是给 JavaScript 提供调用 Native 功能的接口，让混合开发中的前端部分可以方便地使用 Native 的功能(例如:地址位置、摄像头)。

实际上，JSBridge 就像其名称中的Bridge的意义一样，是 Native 和非 Native 之间的桥梁，它的核心是构建Native 和非 Native 间消息通信的通道，而且这个通信的通道是双向的。

```javascript
双向通信的通道:
JS 向 Native 发送消息:调用相关功能、通知 Native 当前 S 的相关状态等。
Native 向 JS 发送消息:回溯调用结果、消息推送、通知 S 当前 Native 的状态等

```

#### 微前端

1. *微前端定义*

微前端是一种前端架构模式，它借鉴了微服务的理念，将一个大型的前端应用拆分成多个小型、独立的前端应用。这些小型应用可以独立开发、测试、部署和维护，从而提高开发效率和系统的可维护性。微前端的核心思想包括独立部署、松耦合集成、共享资源和独立生命周期。

2. *微前端解决了哪些问题？*

**技术栈多样化**：不同团队可以使用各自擅长的技术栈进行开发，然后将这些应用集成到一个统一的界面中。

**团队协作与并行开发**：每个团队可以独立地开发、测试、部署自己的应用，无需等待其他团队完成。

**应用的可维护性和可扩展性**：通过将应用拆分成多个小型的、可独立部署的微应用，使得每个微应用都可以独立地进行升级和扩展。

**遗留系统的集成与兼容**：可以将遗留系统封装为微应用，与新开发的应用一起集成到统一的界面中。

3. *微前端的特点*

**简单、松耦合的代码库**：将庞大的整体拆分成可控的小块，并明确他们之间的依赖关系，使得代码库更小、更内聚、可维护性更高。

**增量升级**：由于每个应用都是独立的，因此可以独立地进行升级、更新甚至重写部分前端功能，而无需影响整个应用。

**独立部署**：每个微前端都可以独立地进行部署，这大大提高了团队的自治性和可扩展性。

**团队自治**：每个团队可以独立地开发、测试、部署自己的应用，无需等待其他团队，从而提高了开发效率。

4. *微前端的应用场景*

**大型Web应用**：对于体量庞大的Web应用，微前端架构能够将其拆解成多个可以独立开发、部署和运行的微型应用。

**兼容历史应用与增量开发**：在需要兼容遗留系统的同时，使用新框架或技术去开发新功能时，微前端架构是一个理想的选择。

**应用聚合**：大型互联网公司或企业内部通常会部署大量的应用和服务。为了向用户或员工提供统一、高效的体验，可以使用微前端技术将这些应用和服务聚合在一起。

**团队间共享**：不同的应用之间可能存在可以共享的功能和服务。通过微前端架构，这些共享的功能和服务可以被封装成独立的模块，并在不同的团队之间进行高质量的共享，从而提高研发效率。

5. *微前端的实现方式*

**Iframe方式**：每个子应用通过独立的 Iframe 嵌入到主应用中，子应用拥有自己的全局上下文，避免了相互影响。

**Web Components方式**：Web Components 提供了一个原生的封装机制，可以将子应用作为组件嵌入主应用中，不同技术栈的子应用通过 Web Components 进行集成。

**JavaScript脚本加载方式**：通过动态加载 JavaScript 文件，将每个子应用的脚本通过 URL 引入到主应用中，主应用根据需要渲染和销毁子应用。

**模块化加载工具**：使用框架来实现微前端的加载和管理，支持子应用的独立生命周期管理，并提供了子应用之间的通信机制。

6. *微前端的实施步骤*

**需求分析**：确定应用的需求和微前端的适用性。

**架构设计**：选择合适的微前端架构模式和技术栈。

**模块划分**：将应用划分为若干独立的模块，每个模块有明确的功能边界。

**开发和测试**：独立开发和测试每个模块，确保模块的独立性和稳定性。

**集成和部署**：通过主应用集成各个模块，并进行统一的部署和运维。

#### 实现微前端有哪些技术方案?

单纯根据对概念的理解，很容易想到实现微前端的重要思想就是将应用进行拆解和整合，通常是一个父应用加上一些子应用，那么使用类似Nginx配置不同应用的转发，或是采用iframe来将多个应用整合到一起等等这些其实都属于微前端的实现方案:

**Nginx路由转发**

通过Nginx配置反向代理来实现不同路径映射到不同应用，例如www.abc.com/app1对应app1www.abc.com/app2对应app2，这种方案本身并不属于前端层面的改造，更多的是运维的配置优点:简单，快速，易配置

缺点:在切换应用时会触发浏览器刷新，影响体验

**iframe嵌套**

父应用单独是一个页面，每个子应用嵌套一个iframe，父子通信可采用postMessage或者contentWindow方式优点:实现简单，子应用之间自带沙箱，天然隔离，互不影响缺点:iframe的样式显示、兼容性等都具有局限性;太过简单而显得lowWeb Components

每个子应用需要采用纯Web Components技术编写组件，是一套全新的开发模式优点:每个子应用拥有独立的script和css，也可单独部署缺点:对于历史系统改造成本高，子应用通信较为复杂易踩坑

**组合式应用路由分发**

每个子应用独立构建和部署，运行时由父应用来进行路由管理，应用加载，启动，卸载，以及通信机制优点:纯前端改造，体验良好，可无感知切换，子应用相互隔离缺点:需要设计和开发，由于父子应用处于同一页面运行，需要解决子应用的样式冲突，变量对象污染，通信机制等技术点

#### 微前端可以解决什么问题?

任何新技术的产生都是为了解决现有场景和需求下的技术痛点，微前端也不例外:

* 拆分和细化*

当下前端领域，单页面应用(SPA)是非常流行的项目形态之一，而随着时间的推移以及应用功能的丰富，单页应用变得不再单一而是越来越庞大也越来越难以维护，往往是改一处而动全身，由此带来的发版成本也越来越高。微前端的意义就是将这些庞大应用进行拆分，并随之解耦，每个部分可以单独进行维护和部署，提升效率。

* 整合历史系统*

在不少的业务中，或多或少会存在一些历史项目，这些项目大多以采用老框架类似(Backbone.js，Angularjs 1)的B端管理系统为主，介于日常运营，这些系统需要结合到新框架中来使用还不能抛弃，对此我们也没有理由浪费时间和精力重写旧的逻辑。而微前端可以将这些系统进行整合，在基本不修改来逻辑的同时来同时兼容新老两套系统并行运行。

微前端架构具备以下几个核心价值:

* 技术栈无关：主框架不限制接入应用的技术栈，微应用具备完全自主权
* 独立开发、独立部署：微应用仓库独立，前后端可独立开发，部署完成后主框架自动完成同步更新
* 增量升级：在面对各种复杂场景时，我们通常很难对一个已经存在的系统做全量的技术栈升级或重构，而微前端是一种非常好的实施渐进式重构的手段和策略
* 独立运行时：每个微应用之间状态隔离，运行时状态不共享

#### base64编码图片，为什么会让数据量变大?

Base64编码的思想是是采用64个基本的ASCII码字符对数据进行重新编码。它将需要编码的数据拆分成字节数组。以3个字节为一组。按顺序排列24位数据，再把这24位数据分成4组，即每组6位。再在每组的的最高位前补两个0凑足一个字节。这样就把一个3字节为一组的数据重新编码成了4个字节。当所要编码的数据的字节数不是3的整倍数，也就是说在分组时最后一组不够3个字节。这时在最后一组填充1到2个0字节。并在最后编码完成后在结尾添加1到2个"="

(注BASE64字符表:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/)从以上编码规则可以得知，通过Base64编码，原来的3个字节编码后将成为4个字节，即字节增加了33.3%，数据量相应变大。所以20M的数据通过Base64编码后大小大概为20M*133.3%=26.67M

#### babel

Babel是现代JavaScript开发中不可或缺的工具，它允许开发者使用最新的JavaScript特性，同时确保代码在旧浏览器中也能正常运行。下面我将全面讲解Babel的工作原理、配置和使用方法。

##### 什么是Babel？

Babel是一个JavaScript编译器（或转译器），主要功能是将ECMAScript 2015+（ES6+）代码转换为向后兼容的JavaScript版本，以便在当前和旧版浏览器环境中运行。

##### Babel的核心工作原理

Babel的工作流程可以分为三个主要阶段：

1. **解析（Parsing）**：将源代码转换为抽象语法树（AST）
2. **转换（Transforming）**：对AST进行遍历和修改
3. **生成（Generation）**：将修改后的AST转换为新代码

##### 现代Babel最佳实践

1. **使用@babel/preset-env**：根据目标环境自动确定需要的转换和polyfill
2. **按需引入polyfill**：使用`useBuiltIns: "usage"`减少打包体积
3. **使用core-js@3**：提供更完整的ES+特性支持
4. **配置浏览器目标**：使用browserslist定义支持的范围
5. **区分开发和生产环境**：开发环境可包含调试工具，生产环境优化体积

#### XSS（必背）

XSS 的核心是 **“向网页中注入恶意脚本，在用户浏览器中执行”**。攻击者想方设法将可执行的恶意代码（通常是 JavaScript）注入到网页中，当其他用户浏览该网页时，代码就会执行。

类型：反射性XSS,存储型XSS,DOM型XSS

防范措施：输入过滤，输出编码，CSP,设置cookie的httponly

#### CSRF（必背）

CSRF 的核心是 **“利用用户的登录状态，冒充用户执行非本意的操作”**。攻击者诱骗已经登录了目标网站（如银行网站）的用户，去访问一个恶意链接或页面，从而以用户的身份执行一些操作（如转账、改密码）。

过程：用户访问A,未退出，点击表单或者链接跳转的接口为转账，服务器识别到为正确的cookie，成功转账。

防范措施：同源策略检查，csrf tokens，设置cookie的samesite，双重cookie

#### CommonJS和ESM（必背）

1. CommonJS规范最初是为了让JavaScript能够在任何地方运行而制定的，在Node.js环境中得到了广泛应用

* CommonJS的核心思想是将每个文件视为一个独立模块，每个模块拥有自己的作用域，不会污染全局作用域
* 在CommonJS中，通过`module.exports`或`exports`对象导出模块功能，通过`require()`函数导入其他模块
* 这种规范的特点是动态加载，模块的依赖关系在运行时确定，因此可以在条件语句中使用`require()`
* CommonJS主要适用于服务器端JavaScript开发，特别是Node.js环境

2. ESM（ES6 Module）则是ECMAScript 2015引入的官方模块化标准，旨在为JavaScript提供统一的模块化解决方案。

* ESM的设计思想是尽可能静态化，使得编译时就能确定模块的依赖关系以及输入和输出的变量。
* 在ESM中，使用`export`关键字导出模块功能，使用`import`关键字导入其他模块。
* 与CommonJS不同，ESM支持静态分析和树摇（tree-shaking）优化，有助于减少最终打包文件的体积。
* ESM既适用于浏览器环境，也适用于Node.js环境，是现代前端开发的主流模块化方案

两种规范的主要区别在于：

* CommonJS是同步加载的，更适合服务器端环境；而ESM支持异步加载，更适合浏览器环境
* 此外，CommonJS的模块是运行时加载的，而ESM的模块是编译时加载的，这使得ESM在性能优化方面具有优势
* 在实际开发中，Node.js默认使用CommonJS，但也支持ESM；而浏览器环境则主要使用ESM

> 更新: 2025-12-14 04:52:36
> 原文: <https://www.yuque.com/u56987424/lwyx/ngcpgangiuihcq4g>
