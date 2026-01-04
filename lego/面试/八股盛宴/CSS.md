---
tags:
  - 前端
  - 八股
  - CSS
  - 样式
  - 布局
---

# CSS

> 1. **基础概念与核心机制**
> 2. **布局与定位技术**
> 3. **响应式与移动适配**
> 4. **动画与变换**
> 5. **元素样式与视觉效果**
> 6. **性能优化与工程化**
> 7. **特殊问题解决方案**

### 基础概念与核心机制

#### 盒模型（必背）

box-sizing

* CSS盒模型定义了盒子的各个部分，margin，border，padding，content
* 标准盒模型 **content-box** 定义的height和width其实是content  padding+border决定了盒子的大小
* 怪异盒模型 **border-box** 设置的height和width包含了padding和border   设置的宽高就是盒子的宽高
* 默认是标准盒模型

#### 文档流（必背）

浏览器在渲染页面时默认的布局方式，指元素按照其在 HTML 中的**自然顺序**依次排列的规则

##### **1. 文档流的特点**

***默认布局方式**：除非通过 CSS 显式修改（如 `float`、`position`、`flex`），否则所有元素均处于文档流中。
***排列方向**：
  * **块级元素**：垂直排列（如 `<div>`、`<p>`），独占一行。
  * **行内元素**：水平排列（如 `<span>`、`<a>`），宽度由内容决定。
***空间占用**：文档流中的元素会占据其对应位置，后续元素无法重叠。（外边距合并 选大的而不是简单合并）

##### **2. 脱离文档流的情况**

当元素脱离文档流时，其布局不再影响其他元素的位置，常见方式包括：

1. float（高度坍塌）

2. absolute（相对于最近的设置了relative的父级元素定位）/fixed(固定)

#### 样式优先级（必背）

！important > ( 行内| 外链、嵌入） > (id选择器) > （类|伪类|属性）>  (后代|伪元素) > (子选择器|相邻选择器) > > 通配符 > 继承 > 浏览器默认

解释与使用：

```css
/* 状态伪类 */
a:hover { color: red; }          /* 悬停时变红 */
input:focus { border-color: blue; } /* 输入框聚焦时边框变蓝 */

/* 结构伪类 */
li:first-child { font-weight: bold; } /* 列表第一项加粗 */
tr:nth-child(odd) { background: #eee; } /* 表格奇数行灰色背景 */

/* 否定伪类 */
div:not(.hidden) { display: block; } /* 排除 class="hidden" 的 div */

```

```css
/* 精确匹配 */
input[type="password"] { width: 200px; } /* 密码输入框 */

/* 部分匹配 */
a[href^="http"]::after { content: " ↗"; } /* 外部链接添加图标 */
img[src$=".jpg"] { border: 1px solid #ccc; } /* JPG 图片加边框 */

/* 独立单词匹配 */
div[class~="warning"] { color: orange; } /* 匹配 class="alert warning" */

```

```css
div p {
  color: red;  /* 选中 div 内所有层级的 <p> 元素 */
}

```

```css
.tooltip::after {
  content: "提示文字";
  display: block;
  background: #333;
  color: white;
}

```

```css
ul > li {
  color: red;  /* 仅选中 ul 的直接子级 li */
}
//仅匹配直接子元素，不匹配更深层级的后代。

```

```css
严格相邻关系：
仅匹配紧邻的下一个兄弟元素
<h2>标题</h2>
<p>被选中（紧邻 h2）</p>
<p>不被选中（非紧邻）</p>  <!-- 不匹配 -->

h2 + p {
  margin-top: 0;  /* 选中紧跟在 h2 后的 p 元素 */
}

```

#### CSS 选择器优先级计算规则（必背）

SS 优先级是由 **特异性（Specificity）** 决定的。特异性是一个由四个值组成的序列，可以理解为 `0,0,0,0`。比较时，**从左到右**逐位比较，数字大的优先级高。

这四位分别代表：

1. **内联样式** (千位)：直接在 HTML 标签的 `style`属性中设置的样式，记作 `1,0,0,0`。本题中不涉及
2. **ID 选择器** (百位)：每使用一个 `#id`选择器，百位+1
3. **类、属性、伪类选择器** (十位)：每使用一个 `.class`、`[type="text"]`、`:hover`等选择器，十位+1
4. **元素、伪元素选择器** (个位)：每使用一个 `div`、`p`、`::before`等选择器，个位+1

#### 继承

**可继承**

* 字体属性
  * `font-family`、`font-size`、`font-weight`、`font-style`
  * `color`、`line-height`、`text-align`、`text-indent（文本缩进）`
  * `letter-spacing(字符间距)`、`word-spacing(字间隔)`、`text-transform(控制文本大小写)`
* 列表
  * `list-style-type`、`list-style-image`、`list-style-position`
* 其他
  * `visibility(元素可见)`、`cursor（悬浮光标）`、`direction（方向）`、`white-space（换行显示）`

**不可继承**

***盒模型相关**：
  * `width`、`height`、`margin`、`padding`、`border`
  * `display`、`box-sizing`、`overflow`
***定位与布局**：
  * `position`、`top`、`left`、`z-index`、`float`
***背景与装饰**：
  * `background`、`background-color`、`background-image`
  * `opacity`、`box-shadow`、 text-decoration 、border
*** 其他**：
  * `vertical-align`、`table-layout`、`flex`、`grid` 相关属性

#### 不可继承属性实现继承

| **关键字** | **作用** | **示例** |
| :--- | :--- | :--- |
| `inherit` | **强制元素继承其父元素该属性的值** | `border: inherit;` |
| `initial` | 将属性设置为其**初始默认值**，而非继承父元素的值 | `width: initial;`  /* 可能恢复为 auto */ |
| `unset` | 如果属性**默认可继承**，则行为同 `inherit` ；否则行为同 `initial` | `color: unset;`  /* 若颜色可继承则继承，否则重置 */ |
| `revert` | 将属性值恢复为**浏览器默认样式表**或**用户自定义样式表**中定义的值 | `display: revert;`  /* 可能恢复为 block 或 inline */ |

#### display（布局）

| **属性值** | **作用** |
| --- | --- |
| none | 不显示，会从文档流中移除 |
| block | 块类型。默认宽度为父元素宽度，可设置宽高，换行显示 |
| inline | **默认**！！！行内元素类型。默认宽度为内容宽度，**不可设置宽高**，同行显示，可设置内外边距，但只对左右起作用，只能容纳文本或其他行内元素。 |
| inline-block | 默认宽度为内容宽度，可设置宽高，同行显示 |
| list-item | 显示为列表项（默认 `<li>` 的行为） |
| table | 模拟表格行为（如 `display: table-cell`） |
| inherit | 继承 |
| flex | display: flex; /* 启用弹性布局 */justify-content: center; /* 水平对齐 */align-items: center; /* 垂直对齐 */ |
| grid | display: grid; grid-template-columns: 1fr 2fr; /* 列宽比例 */gap: 10px; /* 间距 */ |

#### css3新特性（了解）

1. 选择器增强

***属性选择器**：\ `[attr^="val"]`（开头匹配）、`[attr$="val"]`（结尾匹配）、`[attr*="val"]`（包含匹配）。
***伪类/伪元素**：\ `:nth-child()`、`:not()`、`::selection`（文本选中样式）、`:target`（URL 锚点匹配）。

2. 盒模型与布局

***弹性盒子（Flexbox）**：\ `display: flex`，实现灵活的一维布局（水平/垂直对齐、动态分配空间）。
***网格布局（Grid）**：\ `display: grid`，二维布局系统，支持行列精确控制。
***盒模型扩展**：\ `box-sizing: border-box`（边框和内边距计入宽度）。

3. 视觉效果

***圆角与阴影**：\ `border-radius`（圆角）、`box-shadow`（盒子阴影）、`text-shadow`（文本阴影）。
***渐变背景**：\ `linear-gradient()`（线性渐变）、`radial-gradient()`（径向渐变）。
***透明度**：\ `opacity`、`rgba()`/`hsla()`（带透明度的颜色）。

4. 动画与过渡

***过渡（Transition）**：\ `transition: property duration timing-function`（如悬停效果）。
***动画（Animation）**：\ `@keyframes` 定义动画序列，`animation` 控制播放（如旋转、淡入淡出）。

5. 响应式设计

* 媒体查询 `@media (max-width: 768px)`，适配不同屏幕尺寸。

6. 其他

***自定义字体**：\ `@font-face` 引入外部字体。
***变形（Transform）**：\ `transform: rotate()/scale()/translate()`（2D/3D 变换）。

#### css样式文件类型（必背）

主要有三种：**内联样式**、**内部样式表**和**外部样式表**。它们各有特点，适用于不同的场景。下面这个表格汇总了它们的核心区别，帮你快速了解全貌。

| **类型** | **写法/引入方式** | **作用范围** | **主要优点** | **主要缺点** | **优先级 (由高到低)** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **内联样式** | 在HTML标签的`style`属性中直接编写 | **单个标签** | 优先级最高，调试方便 | 难以维护，代码冗余，违背结构与样式分离原则 | **最高** |
| **内部样式表** | 在HTML文档`<head>`内的`<style>`标签中编写 | **当前HTML页面** | 比内联样式更易于维护，页面内可复用 | 不能在多个HTML页面间复用 | **居中** |
| **外部样式表** | 通过`<link>`标签引入独立的`.css`文件 | **所有引入的页面** | 最佳可维护性和复用性，利于团队协作，减少代码冗余 | 页面加载初期需要额外的HTTP请求（但可通过缓存优化） | **最低** |

#### type类型（了解）

* button 定义可点击的按钮（大多与 JavaScript 使用来启动脚本）
* checkbox 定义复选框
* color 定义拾色器
* date 定义日期字段（带有 calendar 控件）
* datetime 定义日期字段（带有 calendar 和 time 控件）
* datetime-local 定义日期字段（带有 calendar 和 time 控件）
* month 定义日期字段的月（带有 calendar 控件） week 定义日期字段的周（带有 calendar 控件）
* time 定义日期字段的时、分、秒（带有 time 控件）
* email 定义用于 e-mail 地址的文本字段 file 定义输入字段和 "浏览..." 按钮，供文件上传
* hidden 定义隐藏输入字段
* image 定义图像作为提交按钮
* number 定义带有
* spinner 控件的数字字段
* password 定义密码字段。字段中的字符会被遮蔽
* radio 定义单选按钮。
* range 定义带有 slider 控件的数字字段
* reset 定义重置按钮。重置按钮会将所有表单字段重置为初始值
* search 定义用于搜索的文本字段
* submit 定义提交按钮。提交按钮向服务器发送数据
* tel 定义用于电话号码的文本字段
* text 默认。定义单行输入字段，用户可在其中输入文本，默认是 20 个字符
* url 定义用于 URL 的文本字段。

#### border-width和outline-width

* border-width:默认值medium,定义中等的上边框（在设置border:solid red时，才会默认border-width为medium，medium具体值根据浏览器缩放比例大小决定 100%时chrome为2.4px）
* outline-width:默认值medium,规定中等的轮廓

#### **em 与 rem 的区别**（必背）

| **特性** | `em` | `rem`**(Root Em)** |
| :--- | :--- | :--- |
| **参照基准** | 当前元素或父元素的字体大小 | **根元素 (**`html`**)** 的字体大小 |
| **受嵌套影响** | **是**，多层嵌套时计算复杂 | **否**，在任何层级使用，都直接参照根元素字体大小，计算简单且可预测 |
| **主要用途** | 用于需要**相对于其直接上下文（父元素或自身字体）** 进行缩放的组件内部布局 | 用于需要**全局一致**的布局、间距和字体大小，便于整体控制响应式缩放 |

#### clear的作用？

| **属性值** | **作用** | **适用场景** |
| :--- | :--- | :--- |
| `none` | 默认值，允许元素两侧存在浮动元素。 | 无需清除浮动时。 |
| `left` | 元素的左侧不允许有浮动元素，会下移到左侧所有浮动元素的下方。 | 只需清除左侧浮动时。 |
| `right` | 元素的右侧不允许有浮动元素，会下移到右侧所有浮动元素的下方。 | 只需清除右侧浮动时。 |
| `both` | 元素左右两侧均不允许有浮动元素，会下移到所有浮动元素的下方。 | **最常见**，需要完全清除左右两侧浮动影响时。 |
| `inherit` | 继承父元素的 `clear`属性值。 | 需要从父元素继承清除浮动行为时（注意：IE8 及更早版本不支持此值）。 |

#### 不同浏览器资源前缀

mozilla内核 (firefox,flock等) -mOz

webkit内核(safari,chrome等) -webkit

opera内核(opera浏览器)  -o

trident内核(ie浏览器) -ms

#### white-space、text-overflow、overflow三个属性的含义

white-space:属性设置如何处理元素内的空白

* normal:默认。空白会被浏览器忽略。.
* pre: 空白会被浏览器保留。其行为方式类似 HTML 中的 pre 标签
* nowrap:文本不会换行，文本会在在同一行上继续，直到遇到 br 标签为止。
* pre-wrap:保留空白符序列，但是正常地进行换行。
* pre-line:合并空白符序列，但是保留换行符。
* inherit:规定应该从父元素继承 white-space 属性的值

text-overflow:clip | ellipsis |string;

* clip：修剪文本
* ellipsis：显示省略符号来代表被修剪的文本
* string：使用给定的字符串来代表被修剪的文本

overflow

* visible：默认值，内容不会被修剪会呈现在元素框之外
* hidden：内容会被修剪，并且其余内容是不可见的
* scroll：内容会被修剪，但是浏览器会显示滚动条以便查看其余的内容
* auto：如果内容被修剪，则浏览器会显示滚动条以便查看其余的内容
* inherit：规定应该从父元素继承overflow 属性的值

#### outline

1. `outline-color`

***描述**：此属性用于**规定轮廓的颜色**。您可以使用颜色名称、十六进制代码、RGB值等来设置颜色。

2. `outline-style`

***描述**：此属性用于**规定轮廓的样式**。常见的值包括 `solid`（实线）、`dotted`（点线）、`dashed`（虚线）、`double`（双线）等。

3. `outline-width`

***描述**：此属性用于**规定轮廓的宽度**。您可以使用像 `thin`（细）、`medium`（中）、`thick`（粗）这样的关键字，或者使用具体的尺寸值（如 `2px`）。

4. `inherit`

***描述**：这是一个特殊的值，可用于以上任何属性。它规定**该元素的轮廓属性设置应从其父元素继承**。

#### `list-style-type`

| **列表类型** | **属性值** | **说明** |
| --- | :--- | :--- |
| **无序列表** | `disc` | 实心圆点（默认值） |
| | `circle` | 空心圆 |
| | `square` | 实心方块 |
| **有序列表** | `decimal` | 阿拉伯数字 (1, 2, 3) |
| | `decimal-leading-zero` | 带前导零的数字 (01, 02) |
| | `lower-roman` | 小写罗马数字 (i, ii) |
| | `upper-roman` | 大写罗马数字 (I, II) |
| | `lower-alpha` | 小写英文字母 (a, b) |
| | `upper-alpha` | 大写英文字母 (A, B) |
| **通用** | `none` | 不显示项目符号 |

#### 复合属性（选背）

border-radius是由

* border-top-left-radius
* border-top-right-radius
* border-bottom-leftradius
* border-bottom-right-radius组合而来

text-decoration是由

* text-decoration-line
* textdecoration-style
* text-decoration-color
* textdecoration-thickness组合而来;

margin是由

* margin-top
* margin-right
* margin-bottom
* margin-bottom组合而来;

transition是由

* transition-property
* transition-duration
* transition-timing-function
* transition-delay组合而来。

#### position（必会）

position属性的不同值对于实现网页布局非常重要,每种定位方式都有其适用场景

* fixed定位是相对于浏览器窗口进行定位,而不是相对于父元素。使用fixed定位的元素会固定在浏览器窗口的某个位置,即使页面滚动也不会移动
* static是默认值,元素按照正常文档流进行排列,不会受到top、bottom、left、right等属性的影响
* relative定位是相对定位,元素相对于它原本在文档流中的位置进行偏移,通过topright、bottom、left属性控制偏移量。原本的位置会被保留
* absolute绝对定位的参考点是最近的非static定位的祖先元素。如果所有祖先元素都是static定位,则相对于文档的根元素html进行定位。使用absolute定位的元素会脱离文档流

#### id属性

根据 **HTML5规范**，如果一个元素拥有 `id`属性，并且 `window`对象上尚不存在同名的属性，那么该 `id`值就会成为 `window`对象的一个属性，其值就是这个DOM元素本身

例如，有这样的HTML：

```javascript
<div id="myElement">Hello World</div>

```

在JavaScript中，你可以直接通过 `window.myElement`或全局变量 `myElement`来访问这个元素：

```javascript
console.log(myElement); // 输出: <div id="myElement">Hello World</div>
console.log(myElement === window.myElement); // 输出: true

```

尽管可以直接通过 `id`访问元素，但在实际开发中，**通常建议使用 **`document.getElementById()` 等方法。主要原因包括：

***可读性和明确性**：`document.getElementById('myId')`明确表达了意图，代码更容易被他人理解。
***避免意外覆盖**：防止因全局变量被意外覆盖而导致的难以调试的问题。
***兼容性更一致**：所有现代浏览器都完全支持此方法，行为一致。
***元素加载时机**：通过 `id`直接访问全局变量时，如果脚本在执行时元素还未被浏览器解析加载，则访问到的可能是 `undefined`。而 `getElementById`在操作已加载的DOM元素时更安全可靠

#### <object>（了解即可）

* 在HTML中，`<object>`元素是一个多功能且强大的容器，主要用于嵌入图像、嵌套浏览上下文（如其他网页），或由浏览器插件处理的资源（如Flash、PDF等）。它提供了一种比早期如 `<applet>`（用于Java小程序）或 `<embed>`更标准化和灵活的方式来集成外部内容
* `<object>`元素的核心在于其数据（data）和类型（type），浏览器依靠这些信息来决定如何加载和处理资源。下面我们来看看它的一些关键属性。

**主要属性**

`<object>`元素拥有众多属性，用于精确控制资源的加载和呈现方式。虽然有些属性在现代HTML规范中已不再推荐使用（deprecated），但了解它们仍有其意义。

| **属性名** | **类型** | **说明** |
| :--- | :--- | :--- |
| **data** | URL | **必需**（除非在容器内声明）。指定对象数据的地址（URL）。 |
| **type** | MIME type | 指定 data 属性所指定数据的 MIME 类型。浏览器根据此值判断能否处理该资源，从而避免加载不支持的插件。 |
| **name** | 字符串 | 为对象定义名称，通常用于表单提交时标识该控件产生的数据。 |
| **form** | 表单 ID | 指定对象所属的一个或多个 `<form>`元素（ID）。即使不在表单标签内，其数据也可随指定表单提交。 |
| **usemap** | #+map name | 关联一个 `<map>`元素的名称为图像定义热点区域（image map）。值为 `#`加上 `<map>`元素的 name。 |
| **width** | 像素或百分比 | 定义对象的显示宽度。 |
| **height** | 像素或百分比 | 定义对象的显示高度。 |
| **archive** | URL 列表 | ~~已废弃~~。一个以空格分隔的 URL 列表，指向包含与对象相关资源的归档文件。 |
| **border** | 像素 | ~~已废弃~~。定义对象周围的边框宽度。应使用 CSS `border`属性替代。 |
| **classid** | URI | ~~已废弃~~。用于标识浏览器需要加载的插件或控件的实现位置（如旧版 ActiveX 控件的 CLSID）。 |
| **codebase** | URI | ~~已废弃~~。为浏览器解析 `classid`、`data`和 `archive`中相对 URL 提供基础路径。 |
| **codetype** | MIME type | ~~已废弃~~。指定 `classid`所引插件代码的 MIME 类型，浏览器可提前知悉以避免加载不支持的插件。 |
| **declare** | (declare) | ~~已废弃~~。布尔属性。如果设置，则指示浏览器只声明此对象而不立即实例化。后续可通过其他对象或脚本的引用来实例化它。 |
| **standby** | 文本 | ~~已废弃~~。指定在对象加载过程中显示的简短提示文本。 |
| **typemustmatch** | Boolean | 一个布尔属性。如果设置，则要求 `type`属性必须与 data 指向资源的实际 MIME 类型匹配，浏览器才会加载该内容。这增强了安全性，防止插件处理非预期类型的数据。 |

`<object>`元素的使用场景多样，以下是一些常见示例：

1. **嵌入 PDF 文档**

使用 `type="application/pdf"`告知浏览器嵌入的是 PDF 资源。许多现代浏览器（如 Chrome）内置了 PDF 查看器。

```html
<object data="/docs/spec.pdf" type="application/pdf" width="100%" height="500px">
  <p>您的浏览器不支持嵌入 PDF。请<a href="/docs/spec.pdf">下载文件</a>查看。</p>
</object>

```

2. **嵌入图像**

可以作为 `<img>`标签的替代方案，尤其是在需要向后兼容或使用图像映射时。

```html
<object data="chart.svg" type="image/svg+xml" width="400" height="300">
  <img src="chart.png" alt="销售额图表（SVG不支持的备选方案）">
</object>

```

3. **嵌入由插件处理的内容（如传统 Flash）**

虽然 Flash 已被淘汰，但其用法是经典案例。`type`属性让浏览器知道需要 `application/x-shockwave-flash`插件来处理该资源。

```html
<object data="movie.swf" type="application/x-shockwave-flash" width="550" height="400">
  <param name="movie" value="movie.swf">
  <param name="quality" value="high">
  <p>您的浏览器未安装 Flash 插件或不再支持。</p>
</object>

```

#### 如何表示红色

* red
* #f00
* rgb(100%,0%,0%)
* hsl(0,100%,50%)

### 布局与定位技术

#### 布局模型（必背）

1. 标准文档流（Flow） 元素自上而下按顺序垂直延伸分布.
2. 浮动模型 (Float)   浮动
3. 定位模型 设置position
4. flexbox弹性盒子
5. grid网格布局

#### 浮动（必背）

* 作用 设置了浮动的图片可以实现**文字环绕图片** 设置浮动的**块级元素可以排列在同一行** 设置浮动的行**内元素可以设置宽高**，并按照浮动方向对齐排列
* 特点 设置了浮动的**元素脱标不占位置** 浮动可以进行模式转换
* 影响 父级元素没有设置宽高会**坍塌** 父级元素后面的兄弟盒子会受影响 浮动元素的后面兄弟元素布局会受影响
* 清除浮动的方法

```css
1. 伪元素清除法
.clearfix::after {
    content: "";
    display: block;
    clear: both;
  }
2. 父元素触发BFC
.parent {
  overflow: hidden; /* 或 auto/scroll */
}
3. 空元素清除法
<div class="parent">
  <div class="float-left">左浮动</div>
  <div class="float-right">右浮动</div>
  <div style="clear: both;"></div>  <!-- 关键代码 -->
</div>

```

#### 水平居中的方法（必背）

元素为行内元素，设置父元素 text-align:center

如果块级元素（元素宽度固定），margin:0 auto

如果元素为绝对定位，position:absolute left:50% transform:translateX(-50%)

使用 flex-box 布局，display:flex justify-content:center

#### 垂直居中的方法（必背）

文本垂直居中设置 line-height 为 height 值

块级元素（元素高度固定）margin:auto 0

使用 flex 布局，设置为 align-item:center

将显示方式设置为表格，display:table-cell ,同时设置 vertial-align: middle

绝对定位 posistion:absoulte  top:50%，transform:translateY(-50%)

#### 未知宽高水平居中（必背）

1. 绝对定位+transform

```javascript
.parent{
  position:relavite
}
.child{
  position:absolute,
  left:50%,
  top:50%,
  transform:translate(-50%,-50%)
}

```

2. Flextable .parent{display:flex,justify-content:center,align-items:center}
3. Grid .parent{display:flex,justify-content:center,align-items:center}
4. table .parent{display:table-cell,text-align:center.vertical:middle} .child{display:inline-block}

#### Flex（必背）

***在 Flexbox 布局中， Flex 容器和 Flex 项目之间的关系永远是父子关系。**
* 当一个元素变成了 Flex 容器之后，它的子元素，包括其伪元素 ::before 、::after 和 文本节点 都将成为 **Flex 项目**
***注意，HTML 中的可替代元素是无法成为 Flex 容器的，比如img、 input、 select等元素！**

Flexbox 中的主轴由 flex-direction 属性设置，默认情况下，主轴沿行方向（内联轴 Inline Axis）分布，如果该属性为 column ，则主轴沿列方向（块轴 Block Axis）分布：

Flexbox 布局中有一个强大的特性，当 Flex 容器有剩余空间时：

* 可以使用主轴的对齐方式 justify-content 来分配主尺寸的剩余空间；
* 可以使用侧轴的对齐方式 align-items 来分配侧尺寸的剩余空间。

**Flex 容器属性：**

* flex-direction 指定主轴的方向
* flex-wrap：控制 flex 项目是否换行 默认 nowrap
* 需要同时显式设置 flex-direction 和 flex-wrap 属性时，那么可以使用它们的简写属性 **flex-flow**
* justify-content
  * justify-content: flex-start;    /* 左对齐（默认） */
  * justify-content: flex-end;      /* 右对齐 */
  * justify-content: center;        /* 居中 */
  * justify-content: space-between; /* 两端对齐 */
  * justify-content: space-around;  /* 均匀分布（两侧有间隙） */
  * justify-content: space-evenly;  /* 完全均匀分布 */
* align-content 控制**多行**子项在交叉轴的对齐（需启用 `flex-wrap: wrap`）。
* align-items
* gap

**Flex 项目属性：**

* order  控制子项的**排列顺序**（数值越小越靠前）
*  flex （flex-grow flex-shrink flex-basis）
* align-self（覆盖父容器的 `align-items` 设置，单独控制子项在**交叉轴**的对齐。）#？

Flexbox 布局中的 align-content 属性值和 justify-content 属性值相比多出了一个 stretch 值。

* align-items 用于 Flex 容器上，控制 Flex 行（所有 Flex 项目所在行）在侧轴上对齐方式；
* align-self 用于 Flex 项目上，控制单个 Flex 项目在侧轴上对齐方式。

#### "flex: auto;“是什么意思（了解）

flex 是复合属性，是flex-grow,flex-shrink和 flex-basis 的简写，默认值为0 1 auto，后两个属性可选。

flex-grow 属性定义项目的放大比例，默认为0，即如果存在剩余空间也不放大

flex-shrink 属性定义了项目的缩小比例，默认为1，即如果空间不足，该项目将缩小

flex-basis 属性定义了在分配多余空间之前，项目占据的主轴空间(相当于我们设置的width)

而 flex:auto;是 flex:1 1 auto;的简写，即元素尺寸可以弹性增大，也可以弹性变小，具有十足的弹性，但在尺寸不足时会优先最大化内容尺寸。

**使用场景:**

当希望元素**充分利用剩余空间**，但是各自的**尺寸按照各自内容进行分配**的时候，适合使用flex:auto

flex:auto 多用于内容固定，或者内容可控的布局场景，例如导航数量不固定，每个导航文字数量也不固定的导航效果就适合使用 flex:auto 效果来实现 ？

#### 脱离文档流有哪些方法?（必背）

一、什么是文档流?

将窗体自上而下分成一行一行，并在每行中按从左至右依次排放元素，称为文档流，也称为普通流。

这个应该不难理解，HTML中全部元素都是盒模型，盒模型占用一定空间，依次排放在HTML中，形成了文档流。

二、什么是脱离文档流?

元素脱离文档流之后，将不再在文档流中占据空间，而是处于浮动状态(可以理解为漂浮在文档流的上方)。脱离文档流的元素的定位基于正常的文档流，当一个元素脱离文档流后，依然在文档流中的其他元素将忽略该元素并填补其原先的空间。

三、怎么脱离文档流?

**float**

使用float可以脱离文档流。

注意!!!:使用foat脱离文档流时，其他盒子会无视这个元素，但其他盒子内的文本依然会为这个元素让出位置，环绕在该元素的周围。

**absolute**

absolute称为绝对定位，其实博主觉得应该称为相对定位，因为使用absolute脱离文档流后的元素，是相对于该元素的父类(及以上，如果直系父类元素不满足条件则继续向上查询)元素进行定位的，并且这个父类元素的position必须是非static定位的(static是默认定位方式)。

**fixed**

完全脱离文档流，相对于浏览器窗口进行定位。(相对于浏览器窗口就是相对于html)。

#### 浮动元素重叠规则

行内元素与浮动元素发生重叠，边框、背景、内容都会显示在浮动元素之上

块级元素与浮动元素发生重叠，边框、背景会显示在浮动元素之下，内容会显示在浮动元素之上

#### 两栏布局 三栏布局（必会）

一般两栏布局指的是**左边一栏宽度固定，右边一栏宽度自适应**，两栏布局的具体实现：

* 利用浮动，将左边元素宽度设置为200px，并且设置向左浮动。将右边元素的margin-left设置为200px，宽度设置为auto（默认为auto，撑满整个父元素）。
* 利用浮动，左侧元素设置固定大小，并左浮动，右侧元素设置overflow: hidden; 这样右边就触发了BFC，BFC的区域不会与浮动元素发生重叠，所以两侧就不会发生重叠。
* 利用flex布局，将左边元素设置为固定宽度200px，将右边的元素设置为flex:1。
* 利用绝对定位，将父级元素设置为相对定位。左边元素设置为absolute定位，并且宽度设置为200px。将右边元素的margin-left的值设置为200px。
* 利用绝对定位，将父级元素设置为相对定位。左边元素宽度设置为200px，右边元素设置为绝对定位，左边定位为200px，其余方向定位为0。

三栏布局一般指的是页面中一共有三栏，**左右两栏宽度固定，中间自适应的布局**，三栏布局的具体实现：

* 利用flex布局，左右两栏设置固定大小，中间一栏设置为flex:1。
* 利用**绝对定位**

```html
<div class="container">
  <div class="left">左侧导航（150px）</div>
  <div class="center">主内容（自适应）</div>
  <div class="right">右侧边栏（200px）</div>
</div>

<style>
  .container {
    position: relative; /* 定位基准 */
    height: 100vh;      /* 需显式定义高度（绝对定位元素不占文档流） */
    padding: 0 200px 0 150px; /* 预留左右空间 */
  }
  .left {
    position: absolute;
    left: 0;
    top: 0;
    width: 150px;
    background: #ffd6a5;
  }
  .center {
    width: 100%; /* 自适应剩余宽度 */
    background: #caffbf;
  }
  .right {
    position: absolute;
    right: 0;
    top: 0;
    width: 200px;
    background: #9bf6ff;
  }
</style>

```

* grid 布局

```css
.container{
  display: grid;
  /* 核心代码：左右两栏固定宽度，中间自适应宽度 */
  grid-template-columns: 200px auto 200px;
}

```

#### 圣杯布局和双飞翼布局（重点 最好手动实现一下）

**圣杯布局**

```html
<div class="container">
  <div class="center">主内容（优先加载）</div>
  <div class="left">左侧导航</div>
  <div class="right">右侧边栏</div>
</div>

<style>
  .container {
    padding: 0 200px 0 150px; /* 为左右栏预留空间 */
  }
  .center {
    float: left;
    width: 100%; /* 占满容器 */
    background: lightgreen;
  }
  .left {
    float: left;
    width: 150px;
    margin-left: -100%;     /* 拉到最左侧 */
    position: relative;
    left: -150px;           /* 定位到预留空间 */
    background: lightblue;
  }
  .right {
    float: left;
    width: 200px;
    margin-left: -200px;    /* 拉到最右侧 */
    position: relative;
    right: -200px;          /* 定位到预留空间 */
    background: coral;
  }
</style>

```

**双飞翼布局**

```html
<div class="container">
  <div class="center-wrap">
    <div class="center">主内容（优先加载）</div>
  </div>
  <div class="left">左侧导航</div>
  <div class="right">右侧边栏</div>
</div>

<style>
  .center-wrap {
    float: left;
    width: 100%; /* 占满容器 */
  }
  .center {
    margin: 0 200px 0 150px; /* 为左右栏留出空间 */
    background: lightgreen;
  }
  .left {
    float: left;
    width: 150px;
    margin-left: -100%;     /* 拉到与中间栏同一行左侧 */
    background: lightblue;
  }
  .right {
    float: left;
    width: 200px;
    margin-left: -200px;    /* 拉到与中间栏同一行右侧 */
    background: coral;
  }
</style>

```

#### 实现行内元素中三部分内容以1:1:1的比例分配

* position:relative 设置元素的定位方式为相对定位,这是实现弹性布局的基础。
* -webkit-box-fex:1和box-flex:1是较早期的弹性布局属性,主要用于兼容日版WebKit内核浏览器
* -webkit-flex:1和flex:1是现代弹性布局标准属性,flex:1是flex-grow:1、flex-shrink:1和flex-basis:0%的简写,指定了弹性项目如何分配容器中的可用空间。设置为1表示这些元素会平均分配空间。

#### 第二个子元素高度

代码块：

```html
<div class="container">
  <div style="height: 100px"></div>
  <div style="min-height: 10px"></div>
</div>
<style>
  .container {
    display: flex;
  }
  .container > div {
    width: 100px;
  }
</style>

```

**参考答案**

**答案：100px**

Flex布局会默认：

* 把所有子项变成水平排列
* 默认不自动换行
* 让子项与其内容等宽，并把所有子项的高度变为最高子项的高度

#### 清除浮动的几种方式，各自的优缺点（必背）

* 在浮动元素后添加一个空的 `div` 并设置 `clear: both`

 **缺点**：需要添加无意义的空标签，不符合语义化。

* 伪元素清除法 .parent::after { content: ""; display: block; clear: both; }

  **优点**：无需额外 HTML 标签，广泛兼容。

* 父级 div 定义 overflow:hidden（父元素触发 BFC）

**注意**：`overflow: hidden` 可能会隐藏溢出内容，

#### 常见的CSS布局

**流体布局**

![1754381483273-3a3f00fb-b7fe-4e08-a74c-f2830110ac1f.png](./img/A4OC9L3lCpWSDH5g/1754381483273-3a3f00fb-b7fe-4e08-a74c-f2830110ac1f-389892.png)

![1754381490257-49c1494b-d4e8-466b-9b36-b63946c7cbef.png](./img/A4OC9L3lCpWSDH5g/1754381490257-49c1494b-d4e8-466b-9b36-b63946c7cbef-347273.png)

**圣杯布局**

![1754381520420-46cfd6f7-6049-4103-a334-668b24088302.png](./img/A4OC9L3lCpWSDH5g/1754381520420-46cfd6f7-6049-4103-a334-668b24088302-453277.png)

**双飞翼布局**

![1754381576500-bb4119e4-37b6-4a53-b3ff-d4ad172f4cb9.png](./img/A4OC9L3lCpWSDH5g/1754381576500-bb4119e4-37b6-4a53-b3ff-d4ad172f4cb9-770917.png)

#### position: fixed 一定是相对于浏览器窗口进行定位吗?

`position: fixed` **默认**是相对于浏览器窗口（视口）进行定位，但它的定位基准可以通过 CSS 的 `transform`、`perspective` 或 `filter` 属性被改变。如果 `fixed` 元素的**任意祖先元素**设置了以上任一属性，该元素的定位基准会变成这个祖先元素（而非视口）

#### 绝对定位和相对定位

| **特性** | **相对定位 (Relative Positioning)** | **绝对定位 (Absolute Positioning)** |
| :--- | :--- | :--- |
| **定位基准** | 相对于元素自身的**原始位置**进行偏移 | 相对于最近的**已定位祖先元素**（`position`非 `static`），若无则相对于**初始包含块**（通常是 `<html>`或浏览器视口） |
| **文档流** | **不脱离**文档流。元素移动后，**原有空间保留**，不影响周围元素的布局 | **完全脱离**文档流。元素**不占空间**，后续元素会占据其原位置 |
| **偏移属性** | 使用 `top`, `right`, `bottom`, `left`相对于自身原始位置偏移 | 使用 `top`, `right`, `bottom`, `left`相对于其定位基准进行定位 |
| **元素宽高** | 保持不变 | 默认由内容撑开，但可自由设置宽高（类似行内块元素） |
| **常见应用场景** | 微调元素位置、作为绝对定位子元素的参照容器（“父相子绝”） | 弹出层、模态框、精确对齐、重叠效果、固定位置的元素（常与相对定位父元素配合） |

#### 理解z- index 属性作用

* 在CSS中，z-index属性用于控制定位元素在垂直于页面方向(堆叠方向)上的层叠顺序
* 具有较高z-index值的元素会覆盖具有较低z-index值的元素
* 当元素没有设置z-index 时，默认按照它们在HTML文档中出现的顺序堆叠，后面的元素会覆盖前面的元素

一旦元素的 `position`值被设置为 `relative`, `absolute`, `fixed`, 或 `sticky`，它就脱离了默认的文档流规则，`z-index`属性便开始发挥作用，允许你精细地控制它们之间的上下覆盖关系

| **定位类型 (Position)** | **脱离文档流** | **z-index 是否生效** | **常见用途** |
| :--- | :--- | :--- | :--- |
| `static` (默认) | 否 | **否** | 普通文档流布局 |
| `relative` | 否（保留原空间） | 是 | 微调元素自身位置，作为绝对定位的容器 |
| `absolute` | 是 | 是 | 相对于最近定位祖先进行绝对定位 |
| `fixed` | 是 | 是 | 相对于浏览器视口固定定位 |
| `sticky` | 否（滚动时表现为 fixed） | 是 | 元素在滚动时达到特定位置后固定 |

* 默认层叠顺序

在同一个层叠上下文中，如果没有设置 `z-index`，浏览器会按照以下规则从低到高堆叠元素

1. 根元素 (`<html>`) 的背景和边框
2. 定位元素且 `z-index`为负值
3. 正常的块级元素（按 HTML 顺序）
4. 浮动元素
5. 正常的行内元素（按 HTML 顺序）
6. 定位元素且 `z-index: auto`或 `0`（按 HTML 顺序）
7. 定位元素且 `z-index`为正值（值越大越靠上）

### 响应式与移动适配（了解 不常见）

#### 响应式布局如何实现（选背）

1. **使用CSS框架**\ Tailwind CSS 是一种流行的实用优先CSS框架，可以帮助开发者快速构建响应式布局。它提供了响应式设计工具类，能够轻松适配不同屏幕尺寸**2**。
2. **媒体查询**\ 媒体查询是CSS3的核心功能之一，允许开发者根据不同的屏幕尺寸或设备特性应用不同的样式规则。例如，可以为小屏幕、平板和桌面设备分别设置不同的布局和样式**2**。
3. **弹性布局（Flexbox）**\ Flexbox 是一种CSS布局模式，可以更灵活地分配空间和对齐元素，尤其适合响应式设计。它能够自动调整元素的大小和位置，以适应不同的屏幕尺寸**3**。
4. **移动端适配与HTML5**\ 在移动端开发中，可以使用HTML5的viewport元标签来控制页面的缩放和布局。同时，结合CSS媒体查询，可以确保页面在各种设备上都能正常显示。
5. **网格布局（Grid）**\ CSS Grid 提供了一种二维布局系统，适合创建复杂的响应式布局。它可以同时处理行和列，非常适合需要精确控制元素位置的场景**2**。
6. **使用CSS的**`if()`**函数**\ 从Chrome 137开始，CSS引入了`if()`函数，允许在样式中直接编写条件逻辑，进一步简化了响应式设计的复杂性。

#### CSS Container Queries

CSS Container Queries是 CSS 的一项强大新特性，它允许你根据组件父容器自身的尺寸（而非浏览器视口或设备屏幕尺寸）来应用样式规则。这为实现真正模块化和自适应的组件级响应式设计提供了可能

| **特性** | **CSS Container Queries (容器查询)** | **Media Queries (媒体查询)** |
| :--- | :--- | :--- |
| **查询依据** | **父容器**的尺寸 | **视口**或设备的尺寸 |
| **作用范围** | **组件级别**的样式调整 | **全局页面布局**的调整 |
| **设计目标** | 实现组件内部样式的自适应，使组件能根据其**所在容器环境**灵活变化 | 实现页面整体布局对不同**屏幕尺寸**的响应 |
| **耦合性** | **低**，组件样式与具体容器解耦，复用性强 | **高**，组件样式与全局视口绑定，复用性较差 |
| **灵活性** | **高**，组件能独立适应任何容器环境 | **相对较低**，依赖于全局视口 |

##### 核心价值与解决的问题

容器查询的核心价值在于实现了 **“组件级”** 或 **“容器级”** 的响应式设计。它解决了传统媒体查询在复杂布局和组件化开发中的一些痛点：

1. **组件复用性**：一个设计良好的组件（如一个卡片、一个导航栏），只需编写一次容器查询逻辑，就可以被放置在任何尺寸的容器中并自动适配，无需因为其在不同页面或不同位置而重复编写媒体查询代码。这使得组件真正实现了 **“一次编写，随处自适应”**
2. **布局灵活性**：在传统的媒体查询中，如果一个组件被嵌套在侧边栏、栅格列或弹窗等不同尺寸的容器内部，媒体查询无法感知这些容器的具体尺寸，可能导致布局错乱或空白空间浪费。容器查询则能精准地根据其直接父容器的尺寸进行调整，布局更加精细和合理

##### 基本使用方法

使用容器查询通常需要两个步骤

1. **定义容器**：使用 `container-type`属性将一个元素声明为查询容器。最常用的是 `inline-size`，表示基于容器的内联方向尺寸（通常指宽度）进行查询

```css
.card-container {
  container-type: inline-size;
  /* 可选：为容器命名，便于在复杂场景下精确指向 */
  container-name: my-container;
  /* 也可使用简写属性 */
  /* container: my-container / inline-size; */
}

```

2. **编写查询规则**：使用 `@container`规则，根据容器的尺寸条件来修改其内部元素的样式。

```css
@container my-container (min-width: 600px) {
  .card {
    /* 当容器宽度大于等于600px时，将卡片布局改为水平 */
    display: flex;
    flex-direction: row;
  }
}

@container my-container (max-width: 599px) {
  .card {
    /* 当容器宽度小于600px时，保持垂直堆叠 */
    flex-direction: column;
  }
}

```

##### 常见应用场景

***自适应卡片组件**：同一卡片在主页大图区、侧边栏小图区或搜索结果的紧凑列表中，能自动调整布局和内容显示方式
***响应式导航菜单**：导航菜单在顶部通栏、侧边抽屉或移动端折叠时，能根据其容器尺寸改变排列方向或显隐样式
***动态字体大小**：让容器内的字号或行高随容器宽度变化，提升可读性
***设计系统与组件库**：构建高度自适应的组件，使其在不同集成环境中都能良好运作

#### 媒体查询

* `all`: 适用于所有设备
* `screen`: 这是我们最常用的类型，针对电脑屏幕、平板、智能手机等带有屏幕的设备。我们写的绝大部分 CSS 默认就是应用于屏幕
* `print`: 专门针对打印机或打印预览模式。你可以使用 `@media print { ... }`来定义只在打印文档时生效的样式，比如隐藏不必要的按钮、将背景色设置为白色以节省墨水、调整文字颜色为纯黑等
* `speech`: 适用于屏幕阅读器等朗读内容的发声设备

### 动画与变换

#### css 中的animation、transition、transform 有什么区别?（必背）

在 CSS 中，animation、transition 和 transform 是用来创建动画效果的关键属性，它们各自具有不同的作用和特点。

**animation:**

* animation 属性允许创建一个**在指定时间内播放的动画效果**，可以包括多个关键帧。通过指定关键帧动画的名称、持续时间、动画方式(timing function)、延迟时间、播放次数等来控制动画的效果。
* animation 属性可以实现更复杂的动画效果，例如循环动画、无限次播放等

**transition:**

* transition 属性用于指定在**元素状态改变时，要以何种方式过渡到新状态**。通过指定过渡的属性、持续时间、动画方式(timing function)、延迟时间等来控制过渡效果
* transition 属性适用于元素从一种状态平滑过渡到另一种状态，例如颜色、大小、位置等属性的变化

**transform:**

* transform 属性用于**对元素进行变形，例如平移、旋转、缩放、倾斜等**
* 通过 transform 属性，可以改变元素的变形属性来创建动画效果。
* transform 属性通常与 transition 或 animation 结合使用，使得变形动画更加平滑。

**总结**

* animation 属性用于创建复杂的动画序列
* transition 属性用于在状态变化时平滑过渡
* transform 属性用于对元素进行变形

#### CSS3 中transition 和 animation 的属性分别有哪些?（手动实现一下）

#### `animation-fill-mode`的主要属性值

| **属性值** | **中文含义** | **动画开始前 (during **`animation-delay`**)** | **动画结束后** | **简单理解** |
| :--- | :--- | :--- | :--- | :--- |
| `none` | **无** | 使用元素自身的样式 | 恢复元素自身的样式 | **默认行为**。动画结束后元素会跳回初始状态。 |
| `forwards` | **forwards** | 使用元素自身的样式 | **保持**动画**最后一帧**的样式 | **播完就停**在结束状态。 |
| `backwards` | **向后** | **立即应用**动画**第一帧**的样式 | 恢复元素自身的样式 | **延迟期间**就显示**开始状态**。 |
| `both` | **两者** | **立即应用**动画**第一帧**的样式 | **保持**动画**最后一帧**的样式 | **兼顾** `backwards`和 `forwards`的效果。 |

#### `animation-timing-function`的主要取值

| **类型** | **属性值** | **效果描述** | **适用场景** |
| --- | :--- | :--- | :--- |
| **关键字** | `ease` | **默认值**。慢速开始，加速，然后慢速结束 | 大多数元素的默认变化，感觉自然 |
| | `linear` | **匀速**运动 | 机械、稳定、持续的变化 |
| | `ease-in` | **慢速开始**，逐渐加速 | 由静止开始的进入动画 |
| | `ease-out` | **快速开始**，逐渐减速至结束 | 逐渐停止的离开动画 |
| | `ease-in-out` | **慢速开始和结束**，中间加速 | 兼具启动和停止感的平滑变化 |
| **贝塞尔曲线** | `cubic-bezier(n,n,n,n)` | **自定义**速度曲线，n为0-1数值 | 需要特定或独特节奏时（如弹跳） |
| **步进函数** | `steps(n, <jumpterm>)` | 将动画分为**n个等距步骤**（跳变） | 时钟秒针、打字机效果、帧动画 |
| | `step-start` | 等同于 `steps(1, jump-start)` | 立即跳到结束状态，整个周期保持 |
| | `step-end` | 等同于 `steps(1, jump-end)` | 整个周期保持开始状态，结束时跳到结束状态 |

#### 使用css实现无限循环动画

```css
.anima {
  animation-name: likes; // 动画名称
  animation-direction: alternate; // 动画在奇数次 (1、3、5...) 正向播放，在偶数次 (2、4、6...) 反向播放
  animation-timing-function: linear; // 动画执行方式，linear: 匀速；ease: 先慢再快后慢；ease-in: 由慢到快
animation-delay: 0s; // 动画延迟时间
animation-iteration-count: infinite; // 动画播放次数，infinite: 一直播放
animation-duration: 1s; // 动画完成时间
}

@keyframes likes {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(0.9);
  }
  50% {
    transform: scale(0.85);
  }
  75% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

```

#### CSS动画和JS实现的动画分别有哪些优缺点?

##### **CSS动画**

**优点：**

1. **性能高效**：浏览器对 CSS 动画（如 `transition` 和 `animation`）有原生优化，通常使用 GPU 加速（尤其在变换 `transform` 和透明度 `opacity` 属性时），帧率更稳定，占用主线程资源少。
2. **代码简洁**：通过少量代码即可实现常见动画效果（如淡入淡出、位移、缩放），易于维护。
3. **声明式语法**：直接通过 CSS 规则定义动画，无需编写逻辑代码，对设计师友好。
4. **自动处理兼容性**：浏览器会自动处理一些底层细节（如帧同步和回退）。

**缺点：**

1. **灵活性有限**：难以实现复杂逻辑（如动态路径、交互式动画或依赖数据变化的动画）。
2. **控制能力弱**：缺乏精细控制（如暂停、反转、实时调整参数），尽管有 `animation-play-state` 等属性，但仍不如 JS 强大。
3. **兼容性问题**：某些高级特性（如 `animation-composition`）可能需要考虑浏览器支持。
4. **调试困难**：动画曲线或关键帧的调试不如 JS 直观。

---

##### **JavaScript 动画（例如使用 **`requestAnimationFrame`** 或 GSAP 等库）**

**优点：**

1. **极致灵活**：可完全控制动画的每一帧，实现复杂交互（如游戏动画、滚动触发、物理效果）。
2. **动态响应**：易于与数据绑定（如 React/Vue 状态驱动），实时调整参数（如速度、方向）。
3. **丰富的控制接口**：支持暂停、重启、反转、序列化等操作，并可监听动画事件（如开始、结束）。
4. **兼容性处理**：可通过代码降级解决浏览器兼容问题，库（如 GSAP）通常已封装优化。

**缺点：**

1. **性能开销大**：若实现不当（如频繁操作 DOM 或未使用 GPU 加速），可能阻塞主线程，导致卡顿。
2. **代码复杂度高**：需要编写更多逻辑，维护成本较高。
3. **依赖执行环境**：在 JavaScript 被禁用或执行缓慢的设备上可能失效。

#### CSS3实现幻灯片效果（手敲）

![1754381649737-e62b1d6e-70a6-4a73-ac67-55dad1c67e09.png](./img/A4OC9L3lCpWSDH5g/1754381649737-e62b1d6e-70a6-4a73-ac67-55dad1c67e09-464305.png)![1754381660116-f02390b0-fabb-44e1-87e3-3a7b87ce8a2b.png](./img/A4OC9L3lCpWSDH5g/1754381660116-f02390b0-fabb-44e1-87e3-3a7b87ce8a2b-005170.png)

#### `transition-timing-function`

| **时间函数** | **等效 cubic-bezier 值** | **运动特点** | **常见应用场景** |
| :--- | :--- | :--- | :--- |
| `ease` | `cubic-bezier(0.25,0.1,0.25,1)` | **慢-快-慢**（开始稍快，中间加速，末尾减速） | 多数元素的默认过渡效果，如按钮悬停、淡入淡出 |
| `linear` | `cubic-bezier(0,0,1,1)` | **匀速运动** | 进度条加载、匀速旋转的动画 |
| `ease-in` | `cubic-bezier(0.42,0,1,1)` | **慢速开始，加速结束**（起步慢，结尾快） | 元素从屏幕外加速进入、需要强调离开动作的场景 |
| `ease-out` | `cubic-bezier(0,0,0.58,1)` | **快速开始，减速结束**（起步快，结尾慢） | 元素减速进入屏幕、弹窗出现 |
| `ease-in-out` | `cubic-bezier(0.42,0,0.58,1)` | **慢速开始和结束**，中间加速（对称的缓动） | 页面内元素的移动、状态切换 |

### 元素样式与视觉效果

#### display:none;与visibility:hidden;的区别（必背）

联系:它们都能让元素不可见

区别:

* display:none;会让元素完全从渲染树中消失，**渲染的时候不占据任何空间**:visibility:hidden;不会让元素从渲染树消失渲染师元素继续占据空间，只是内容不可见
* display:none ;**是非继承属性**,子孙节点消失由于元素从渲染树消失造成,通过修改子孙节点属性无法显示 ;visibility: hidden;是继承属性子孙节点消失由于继承了 hidden ， 通过设置 visibility:visible;可以让子孙节点显式
* 修改常规流中元素的 **display 通常会造成文档重排** 。修改 visibility 属性只会造成本元素的重绘。
* 读屏器不会读取 display:none 元素内容;会读取 visibility:hidden元素内容

#### 行内元素和块级元素有什么区别（必背）

**行内元素(Inline Elements):**

* 默认情况下，行内元素在水平方向上以行内的方式显示，不会独占一行
* 行内元素只能容纳文本或其他行内元素，不能容纳块级元素。
* 行内元素的宽度和高度由其内容决定，无法设置固定的宽度和高度。
* 行内元素可以设置左右的外边距(margin)和内边距(padding)，但上下外边距和内边距对行内元素不起作用。
* 等常见的行内元素包括<span>、<strong>、<a>、<em>、<img>

**块级元素(Block-level Elements)：**

* 默认情况下，块级元素会独占一行的空间，即使它们宽度没有填满父元素的水平空间
* 块级元素可以包含其他块级元素和行内元素，
* 块级元素的宽度、高度、内外边距都可以通过 CSS 设置。
* 块级元素会自动在其前后创建换行
* 常见的块级元素包括<div>、<p>、<h1>-<h6>、<ol>、<li>、<table>、<ul>等

通过 CSS 的 display 属性可以修改元素的显示方式，例如将行内元素设置为块级元素或将块级元素设置为行内元素，这样可以改变元素在页面中的布局和显示效果，

#### css属性与行内/块级元素

##### 只对块级元素生效的CSS样式属性

* width 和 height:这些属性用于设置元素的宽度和高度，只有块级元素才能接受这些属性的设定。
* margin 和 padding:虽然这些属性可以应用于所有元素，但是当设置块级元素的外边距(margin)和内边距(padding)时，它们会影响元素周围的空间布局
* float:这个属性用于将元素从常规的文档流中移除，并向左或向右浮动。块级元素可以浮动，而行内元素则不能，
* clear:这个属性用于设置元素的哪一侧不允许相邻的浮动元素，只有块级元素可以具有清除浮动的效果，
* display:当设置为 block 时，这个属性会将元素显示为块级元素，覆盖元素原本的显示类型。

##### 只对行内元素生效的css样式

* vertical-align:这个属性用于设置行内元素的垂直对齐方式，例如设置图像或文本的垂直对产位置
* text-align:虽然这个属性通常用于块级元素来设置文本的水平对齐，但它也可以应用于行内元素，尤其是当这些元素作为块级元素的内容时
* line-height:这个属性设置行内元素的行高，即行内元素的垂直间距
* white-space:这个属性控制如何处理元素内的空白字符，对于行内元素，它可以用来防止文本换行或折叠空白
* word-spacing和letter-spacing:这些属性分别用于设置单词间的间距和字母间的间距，只对行内元素有效

#### ::before 和::after 中双冒号和单冒号有什么区别、作用?

在 CSS 中，`::before` 和 `::after` 是**伪元素（Pseudo-elements）**，用于在元素的内容前或后插入生成的内容。而单冒号（`:`）和双冒号（`::`）的区别主要在于 **CSS 规范的历史演变**和**语法明确性**。

* 单冒号(:) 	css2
* 双冒号(::)	css3

#### :伪类  ::伪元素（必背）

另外，伪类与伪元素的区别有:

* 伪类与伪元素都是用于向选择器加特殊效果
* 伪类与伪元素的本质区别就是**是否抽象创造了新元素**
* 伪类只要不是互斥可以叠加使用
* 伪元素在一个选择器中只能出现一次，并且只能出现在未尾
* 伪类与伪元素优先级分别与类、标签优先级相同

#### 知道css有个content属性吗?有什么作用?有什么应用?

css的 content 属性专门应用在 before/after 伪元素上， 用于来插入生成内容 。最常见的应用是利用伪类清除浮动。

![1754381719050-320beab7-4911-4ff4-a7cf-1325823f8529.png](./img/A4OC9L3lCpWSDH5g/1754381719050-320beab7-4911-4ff4-a7cf-1325823f8529-613972.png)

#### CSS中，有哪些方式可以隐藏页面元素?有什么区别?（必背）

通过 css实现隐藏元素方法有如下:

* display:none
* visibility:hidden
* opacity:0
* 设置height、width模型属性为0
* position:absolute
* clip-path

#### 爱恨原则 （了解）

a :link、a:hover、a:visited、a:active中，定义CSS时候的顺序不同，也会直接导致链接显示的效果不同。为了保证每个效果都能正确的触发定义时的顺序应该为:link、visited、hover、active

这主要与 **CSS 的层叠规则**有关。当多个规则拥有相同的特异性（specificity）时，**后出现的规则会覆盖先出现的规则**

链接的不同状态可能会同时满足多个条件。例如：

* 一个**未访问的链接**在被鼠标悬停时，同时匹配 `a:link`和 `a:hover`。
* 一个**已访问的链接**在被鼠标悬停时，同时匹配 `a:visited`和 `a:hover`。
* 一个链接在被**点击的瞬间**，同时匹配 `a:link`(或 `a:visited`) 和 `a:active`。

如果顺序不正确，例如把 `a:hover`放在了 `a:link`和 `a:visited`前面，那么后面定义的 `a:link`/ `a:visited`就会覆盖掉 `a:hover`的样式，导致悬停效果看不见**67**。

**最佳实践**

1. **合并相同样式**：如果某些状态的样式相同，可以合并它们以简化代码

```css
/* 合并未访问和已访问的样式 */
a:link,
a:visited {
  color: #551a8b;
  text-decoration: underline;
}
/* 合并悬停和激活的样式 */
a:hover,
a:active {
  color: #ff0000;
  text-decoration: none;
}

```

2. **提升可访问性**：确保悬停和激活状态的样式变化足够明显，并且始终为聚焦状态 `:focus`定义样式（通常与 `:hover`相同），这对于键盘导航的用户至关重要

```css
a:hover,
a:focus { /* 把 :focus 和 :hover 放在一起 */
  color: #ff0000;
  text-decoration: underline;
}
a:active {
  /* ... */
}

```

3. **作用域控制**：你可以为页面中不同区域的链接指定不同的样式，只需加上更具体的选择器

```css
/* 只改变主导航内的链接颜色 */
.primary-nav a:link {
  color: white;
}
.primary-nav a:visited {
  color: #eeeeee;
}
/* 页脚的链接保持默认样式 */

```

遵循 **LVHA** 顺序是编写可靠 CSS 的一个小但重要的细节

#### rgba()和opacity的透明效果有什么不同?（了解）

rgba()和 opacity 都能实现透明效果，但最大的不同是 opacity 作用于元素， 以及元素内的所有内容的透明度，

而 rgba()只作用于元素的颜色或其背景色 。(设置 rgba 透明的元素的子元素不会继承透明效果!)

#### 怎么实现一个1.5px的线

1. **使用transform缩放（最常用）**

```css
.thin-line {
  height: 1px;
  background: #333;
  transform: scaleY(0.5);
  transform-origin: 0 0;
}

```

2. **使用线性渐变**

```css
.thin-line {
  height: 1px;
  background: linear-gradient(to bottom, #333, #333 50%, transparent 50%);
}

```

3. **使用box-shadow**

```css
.thin-line {
  height: 1px;
  box-shadow: 0 0.5px 0 0 #333;
}

```

4. **使用伪元素**

```css
.element::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: #333;
  transform: scaleY(0.5);
  transform-origin: 0 0;
}

```

5. **使用SVG（适合复杂图形）**

```html
<svg height="1.5" width="100%">
  <line x1="0" y1="0.75" x2="100%" y2="0.75" stroke="#333" stroke-width="1.5" />
</svg>

```

#### CSS 如何使用服务端的字体?

@font-face {

font-family : name ;

src : url(url) ;

sRules }

字体名称 name

url：使用绝对或相对地址指定OpenType字体

sRules：样式表定义

设置嵌入HTML文档的字体。

嵌入HTML文档的字体是指将OpenType字体(压缩的TrueType字体)文件映射到客户端系统，用来提供HTML文档使用该字体，或取代客户端系统已有的同名字体。

示例:

@font-face {

font-family: dreamy；

font.weight: bold；

src: url(<http://www.example.c>om/font.eot);

}

### 性能优化与工程化（了解）

#### 如果使用CSS提高页面性能?（必背）

实现方式有很多种，主要有如下:

1. 内联首屏关键CSS
2. 异步加载CSS
3. 资源压缩
4. 合理使用选择器
5. 减少使用昂贵的属性
6. 不要使用@import

#### Sass、Less 是什么?为什么要使用他们?

他们都是 CSS 预处理器，是 CSS 上的一种抽象层。他们是一种特殊的语法/语言编译成 CSS。 例如 Less 是一种动态样式语言，将 CSS 赋予了动态语言的特性，如变量，继承，运算，函数，LESS 既可以在客户端上运行 (支持IE 6+,Webkit,Firefox)，也可以在服务端运行(借助 Node.is)。为什么要使用它们?

* 结构清晰，便于扩展。 可以方便地屏蔽浏览器私有语法差异。封装对浏览器语法差异的重复处理， 减少无意义的机械劳动。
* 可以轻松实现多重继承。 完全兼容 CSS 代码，可以方便地应用到老项目中。LESS 只是在 CSS 语法上做了扩展，所以老的 CSS 代码也可以与 LESS 代码一同编译。

#### CSS预处理器/后处理器是什么?为什么要使用它们?

预处理器，如:sass，stylus，用来预编译sass 或者 less，增加了 css 代码的复用性。层级less，变量，循环，函数等对编写以及开发UI组件都极为方便。mixin

后处理器，如:postCss，通常是在完成的样式表中根据 css 规范处理 css，让其更加有效。目前最常做的是给css属性添加浏览器私有前缀，实现跨浏览器兼容性的问题。

css 预处理器为 css 增加一些编程特性，无需考虑浏览器的兼容问题，可以在 cSS 中使用变量，简单的逻辑程序，函数等在编程语言中的一些基本的性能，可以让 css 更加的简洁，增加适应性以及可读性，可维护性等。其它css预处理器语言:Sass(Scss)，Less,stylus，Turbine，Swithch css，css Cacheer，DTCsS 。

使用原因:

* 结构清晰， 便于扩展
* 可以很方便的屏蔽浏览器私有语法的差异
* 可以轻松实现多重继承
* 完美的兼容了csS 代码，可以应用到老项目中

#### 为什么有时候用translate来改变位置而不是使用position进行定位?（必备）

translate 是 transform 属性的一个值。

改变transform或opacity不会触发浏览器重新布局(reflow)或重绘(repaint)，只会触发复合(compositions)。而改变绝对定位会触发重新布局，进而触发重绘和复合

transform使浏览器为元素创建一个 GPU 图层，但改变绝对定位会使用到 CPU。

因此translate()更高效，可以缩短平滑动画的绘制时间。

而translate改变位置时，元素依然会占据其原始空间，绝对定位就不会发生这种情况。

#### html和css中的图片加载与渲染规则是什么样的?

是不是会感觉这个和我们图像加载渲染没啥关系一样，事实并非如此，因为img、picture或者background-image都是DOM树或样式规则中的一部分，那么咱们套用进来，图片加载和染的时机有可能是下面这样:

* 解析HTML时，如果遇到img或picture标签，将会加载图片
* 解析加载的样式，遇到background-image时，并不会加载图片，而会构建样式规则树加载JavaScript，执行JavaScript代码，如果代码中有创建img元素之类，会添加到DOM树中;如查有添加background-image规则，将会添加到样式规则树中
* DOM树和样式规则匹配时构建渲染树，如果DOM树节点匹配到样式规则中的backgorund-image，则会加载背景图片
* 计算元素(图片)位置进行布局
* 开始渲染图片，浏览器将呈现渲染出来的图片

上面套用浏览器渲染页面的机制，但图片加载与渲染还是有一定的规则。因为，页面中不是所有的<img>(或picture)元素引入的图片和background-image引入的背景图片都会加载的。那么就引发出新问题了，什么时候会真正的加载，加载规则又是什么?

先概括一点:

> Web页面中不是所有的图片都会加载和渲染!

我们可以归纳为:

<img>、<picture>和设置background-image的元素遇到display:none时，图片会加载，但不会渲染。

<img>、<picture>和设置background-image的元素祖先元素设置display:none时，background-image不会渲染也不会加载，而img和picture引入的图片不会渲染但会加载

<img>、<picture>和background-image引入相同路径相同图片文件名时，图片只会加载一次

样式文件中background-image引入的图片，如果匹配不到DOM元素，图片不会加载

伪类引入的background-image，比如:hover，只有当伪类被触发时，图片才会加载

#### 说说对 CSS 预编语言的理解，以及它们之间的区别

CSS 预编语言是一种基于 CSS 的扩展语言，可以更加方便和高效地编写 CSS 代码。其主要作用是为 CSS 提供了变量、函数、嵌套、继承、混合等功能，以及更加易于维护和组织的代码结构。常见的 CSS 预编语言有 Sass、Less 和 Stylus 等，它们之间的区别如下:

* 1.语法不同:Sass 和 Less 使用类似于 CSS 的语法规则，而 Stylus 则使用了更加简洁和灵活的缩进式语法
* 2.变量定义方式不同:Sass 使用 $符号来定义变量，Less 使用 @ 符号，Stylus 则直接使用变量名即可
* 3.操作符和函数库不同:Sass 和 Less 支持常见的操作符和函数库，例如运算符、颜色处理、字符串处理等，而Stylus 的函数库更加强大，支持更多的特性和功能。
* 4.编译方式不同:Sass 和 Less 都需要通过编译器进行编译，可以将预编译的代码转换成标准的 CSS 代码。而Stylus 则可以直接在浏览器中解析和执行，可以动态调整样式和布局。

总之，CSS 预编语言是一种非常有用的工具，可以提高 CSS 开发的效率和可维护性。选择哪种预编语言取决于项目需求和个人喜好，需要根据具体情况来进行选择。

### 特殊问题解决方案

#### BFC（必背）

> 块格式化上下文（Block Formatting Context）

有几种方法可以为元素生成BFC：

1. 元素是浮动元素（float 不是 none）
2. 元素是绝对定位元素（position 为 absolute 或 fixed）
3. 元素的display属性为 inline-block, table-cell, table-caption, flex, inline-flex 或 grid
4. 元素是overflow属性不为 visible 的块级元素
5. 元素是弹性布局中的项目（子元素），且父元素的display属性为 flex 或 inline-flex

BFC基本概念：块级格式化上下文，独立的渲染区域。

① 在BFC这个元素的 垂直方向  边距会发⽣重叠

② BFC的区域不会与浮动元素的box重叠，可以用来清除 浮动布局

③ BFC是⼀个 独立 的容器，外面的元素不会影响里面的元素，同时，里面的元素不会影响外⾯的元素。

④ 计算BFC元素高度的时候， 浮动元素也会参与计算

#### 怎么触发BFC，BFC有什么应用场景?

具有 BFC特性的元素可以看作是隔离了的独立容器，容器里面的元素不会在布局上影响到外面的元素，并且BFC具有普通容器所没有的一些特性。

通俗一点来讲，可以把 BFC 理解为一个封闭的大箱子，箱子内部的元素无论如何翻江倒海，都不会影响到外部。除了 BFC，还有:

* IFC(行级格式化上下文)-inline内联
* GFC(网格布局格式化上下文)-display:grid
* FFC(自适应格式化上下文)-display:flex或display:inline-flex

注意:同一个元素不能同时存在于两个 BFC 中。

**BFC的触发方式**

* MDN上对于BFC的触发条件写的很多，总结一下常见的触发方式有(只需要满足一个条件即可触发 BFC 的特性):根元素，即 <html>.
* 浮动元素:float 值为 leftright
* overflow值不为visible，即为 auto、scrollhi➍澥意琭箓ヤ璞释冫殼阔枺ự≌沨鷙毜珉作螭护Ặ勢
* flexdisplay值为 inline-block、table-cell、table-captiontableinline-table、inline-flex、grid、inline-grid
* 绝对定位元素:position值为 absolutefixed

**BFC的特性**

* BFC 是页面上的一个独立容器，容器里面的子元素不会影响外面的元素。
* BFC 内部的块级盒会在垂直方向上一个接一个排列
* 同一BFC 下的相邻块级元素可能发生外边距折叠，创建新的 BFC 可以避免外边距折叠
* 每个元素的外边距盒(margin box)的左边与包含块边框盒(border box)的左边相接触(从右向左的格式的冯鉦狒话，则相反)，即使存在浮动
* 浮动盒的区域不会和 BFC 重叠
* 计算 BFC 的高度时，浮动元素也会参与

#### z-index属性在什么情况下会失效?

通常 z-index 的使用是在有两个重叠的标签，在一定的情况下控制其中一个在另一个的上方或者下方出现。z-index值越大就越是在上层。z-index元素的position属性需要是relative，absolute或是fixed。

**z-index属性在下列情况下会失效:**

* 父元素position为relative时，子元素的z-index失效。解决:父元素position改为absolute或static:
* 元素没有设置position属性为非static属性。解决:设置该元素position属性为relative，absolute或fixed中一种:
* 元素在设置z-index的同时还设置了float浮动。解决:float去除，改为 display:inline-block

#### 为何CSS不支持父选择器?

这个问题的答案和“为何CSS相邻兄弟选择器只支持后面的元素，而不支持前面的兄弟元素?"是一样的。浏览器解析HTML文档，是从前往后，由外及里的。所以，我们时常会看到页面先出现头部然后主体内容再出现的加载情况。

但是，如果CSS支持了父选择器，那就必须要页面所有子元素加载完毕才能渲染HTML文档，因为所谓"父选择器”就是后代元素影响祖先元素，如果后代元素还没加载处理，如何影响祖先元素的样式?于是，网页渲染呈现速度就会大大减慢，浏览器会出现长时间的白板。加载多少HTML就可以渲染多少HTML，在网速不是很快的时候，就显得尤为的必要。比方说你现在看的这篇文章，只要文章内容加载出来就可以了，就算后面的广告脚本阻塞了后续HTML文档的加载，我们也是可以阅读和体验。但是，如果支持父选择器，则整个文档不能有阻塞，页面的可访问性则要大大降低。

有人可能会说，要不采取加载到哪里就渲染到哪里的策略?这样子问题更大，因为会出现加载到子元素的时候，父元素本来渲染的样式突然变成了另外一个样式的情况，体验非常不好。

"相邻选择器只能选择后面的元素”也是一样的道理，不可能说后面的HTML加载好了，还会影响前面HTML的样式。

所以，从这一点来讲，CSS支持“父选择器“或者”前兄弟选择器”的可能性要比其他炫酷的CSS特性要低，倒不是技术层面，而是CSS和HTML本身的渲染机制决定的。当然，以后的事情谁都说不准，说不定以后网速都是每秒几个G的，网页加载速度完全就忽略不计，说不定就会支持了。

#### margin重叠（了解）

**Margin 重叠**是指在某些情况下，两个或更多相邻元素的外边距（margin）可能会合并成一个较大的外边距，而不是简单地相加。这种现象可能会在垂直方向上发生，导致元素之间的间距比预期的要大。

Margin 重叠是由 CSS 规范定义的行为，通常会在以下情况下发生：

1. **相邻兄弟元素重叠**：当两个相邻的兄弟元素之间没有任何内容、边框或填充来分隔它们时，它们的上下外边距可能会重叠。例如：

```plain
htmlCopy code
<div class="box"></div>
<div class="box"></div>

```

上面的代码中，两个相邻的 **.box** 元素之间的外边距会重叠，实际的间距可能是 20px 而不是 40px。

2. **父元素与第一个/最后一个子元素重叠**：当父元素的外边距与它的第一个或最后一个子元素的外边距重叠时，可能会导致外边距合并。这种情况通常发生在没有边框、填充或内联内容来分隔父元素和子元素时。

```plain
htmlCopy code
<div class="parent">
  <div class="child"></div>
</div>

```

在上面的例子中，父元素和子元素之间的外边距可能会重叠，导致实际的间距可能是 30px 而不是 50px。

Margin 重叠是一种正常的 CSS 行为，但有时可能会引起布局上的困惑。为了避免不希望的 Margin 重叠，可以考虑以下方法：

* 使用内边距（padding）来代替外边距，避免元素之间直接相邻。
* 使用 **overflow: hidden;** 或 **overflow: auto;** 触发 BFC（块级格式化上下文），从而阻止 Margin 重叠。
* 使用空的或透明的边框来分隔相邻元素，以阻止 Margin 重叠。

> 更新: 2025-12-15 03:53:02
> 原文: <https://www.yuque.com/u56987424/lwyx/wuacfysct5s3esba>
