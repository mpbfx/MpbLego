# BOM/DOM API

### <font style="color:#C75C00;">DOM 文档对象模型</font>
#### 节点选择器（完整版）
```javascript
// 基础选择
document.getElementById('id')
document.getElementsByClassName('class')
document.getElementsByTagName('div')
document.getElementsByName('name')

// 现代选择器
document.querySelector('.class')        // 第一个匹配元素
document.querySelectorAll('div.active') // 所有匹配元素

// 特殊选择
document.documentElement              // <html>
document.head                         // <head>
document.body                         // <body>
document.title                        // 页面标题
document.forms                        // 所有表单
document.images                       // 所有图片
document.links                        // 所有链接
```

#### 节点遍历和关系
```javascript
const el = document.querySelector('#test')

// 父子关系
el.parentNode
el.parentElement
el.children                    // 子元素（只有元素节点）
el.childNodes                  // 所有子节点（包含文本节点等）
el.firstChild / el.lastChild
el.firstElementChild / el.lastElementChild

// 兄弟关系
el.previousSibling / el.nextSibling
el.previousElementSibling / el.nextElementSibling

// 检查关系
el.contains(otherEl)           // 是否包含后代
el.compareDocumentPosition(otherEl) // 节点位置关系
```

#### 元素创建和操作
```javascript
// 创建元素
document.createElement('div')
document.createTextNode('文本')
document.createDocumentFragment() // 文档片段（性能优化）
el.cloneNode(true)               // 深度克隆

// 添加删除
parent.appendChild(newChild)
parent.insertBefore(newNode, referenceNode)
parent.replaceChild(newChild, oldChild)
parent.removeChild(childNode)
el.remove()                      // 直接删除自己

// 现代API
parent.append(el1, el2, textNode)  // 末尾添加多个
parent.prepend(el1, el2)           // 开头添加多个
el.before(newEl)                   // 在前面插入
el.after(newEl)                    // 在后面插入
el.replaceWith(newEl)              // 替换自己
```

#### 属性和数据集
```javascript
// 标准属性
el.id = 'newId'
el.className = 'class1 class2'
el.classList.add('new-class')
el.classList.remove('old-class')
el.classList.toggle('active')
el.classList.contains('active')

// 自定义属性
el.setAttribute('data-id', '123')
el.getAttribute('data-id')
el.hasAttribute('data-id')
el.removeAttribute('data-id')

// 🔥 dataset API
el.dataset.userId = '123'        // data-user-id
el.dataset.userName = 'John'     // data-user-name
```

#### 样式操作
```javascript
// 内联样式
el.style.color = 'red'
el.style.backgroundColor = '#fff'
el.style.setProperty('--color', 'red') // CSS变量

// 计算样式
getComputedStyle(el).color      // 最终计算的样式

// class操作
el.className = 'btn btn-primary'
el.classList.add('active')
el.classList.remove('disabled')

// 现代样式API
el.matches('.active')           // 是否匹配选择器
el.closest('.container')        // 向上查找匹配的祖先
```

#### 内容操作
```javascript
el.innerHTML = '<span>HTML</span>'
el.outerHTML                    // 包含自身的HTML

// 文本内容
el.textContent = '纯文本'        // 推荐（防XSS）
el.innerText = '文本'           // 考虑样式（性能较差）

// 表单值
input.value = '文本'
checkbox.checked = true
select.selectedIndex = 1
```

### <font style="color:#C99103;">DOM 事件系统</font>
#### 事件绑定
```javascript
// 传统方式
el.onclick = function(e) { }

// 现代事件监听
el.addEventListener('click', handler, options)
el.removeEventListener('click', handler)

// 事件选项
{
  capture: false,    // 捕获阶段
  once: true,       // 只触发一次
  passive: true     // 不调用preventDefault()（性能优化）
}

// 事件委托
parent.addEventListener('click', function(e) {
  if (e.target.matches('.item')) {
    // 处理子元素点击
  }
})
```

#### 事件对象
```javascript
element.addEventListener('click', function(e) {
  // 事件目标
  e.target              // 触发事件的元素
  e.currentTarget       // 绑定事件的元素
  
  // 鼠标事件
  e.clientX, e.clientY // 相对视口
  e.pageX, e.pageY     // 相对文档
  e.offsetX, e.offsetY // 相对目标元素
  
  // 键盘事件
  e.key, e.code        // 按键标识
  e.ctrlKey, e.shiftKey // 修饰键
  
  // 事件控制
  e.preventDefault()   // 阻止默认行为
  e.stopPropagation() // 阻止冒泡
  e.stopImmediatePropagation() // 阻止其他监听器
})
```

#### 常用事件类型
```javascript
// 鼠标事件
'click', 'dblclick', 'mousedown', 'mouseup'
'mousemove', 'mouseenter', 'mouseleave'
'mouseover', 'mouseout', 'contextmenu'

// 键盘事件
'keydown', 'keyup', 'keypress'

// 表单事件
'focus', 'blur', 'input', 'change'
'submit', 'reset', 'focusin', 'focusout'

// 窗口事件
'resize', 'scroll', 'load', 'unload'
'DOMContentLoaded', 'beforeunload'

// 触摸事件
'touchstart', 'touchmove', 'touchend'
'touchcancel'

// 其他事件
'copy', 'paste', 'cut', 'wheel'
```

### <font style="color:#8CCF17;">BOM 浏览器对象模型</font>
#### Window 对象
```javascript
// 窗口尺寸
window.innerWidth, window.innerHeight     // 视口尺寸
window.outerWidth, window.outerHeight     // 浏览器窗口尺寸
window.screenLeft, window.screenTop       // 窗口位置

// 导航和URL
window.location.href = 'https://example.com'
window.location.protocol    // "https:"
window.location.host        // "example.com:8080"
window.location.hostname    // "example.com"
window.location.port        // "8080"
window.location.pathname    // "/path"
window.location.search      // "?id=1"
window.location.hash        // "#section"

// 导航方法
window.location.assign('https://example.com')
window.location.replace('https://example.com') // 无历史记录
window.location.reload()

// 历史记录
window.history.length
window.history.back()
window.history.forward()
window.history.go(-2)       // 后退2页
window.history.pushState(state, title, url) // 添加历史记录
window.history.replaceState(state, title, url) // 替换当前记录
```

#### 2. 屏幕信息
```javascript
// 屏幕对象
window.screen.width, window.screen.height      // 屏幕分辨率
window.screen.availWidth, window.screen.availHeight // 可用区域
window.screen.colorDepth       // 颜色深度
window.screen.pixelDepth       // 像素深度
window.screen.orientation      // 屏幕方向

// 设备像素比
window.devicePixelRatio        // 物理像素/逻辑像素
```

#### 3. 定时器
```javascript
// 定时执行
const timeoutId = setTimeout(() => {}, 1000)
clearTimeout(timeoutId)

// 间隔执行
const intervalId = setInterval(() => {}, 1000)
clearInterval(intervalId)

// 动画帧（推荐用于动画）
function animate() {
    // 动画逻辑
    requestAnimationFrame(animate)
}
requestAnimationFrame(animate)
cancelAnimationFrame(animationId)
```

#### 4. 对话框
```javascript
// 警告框
window.alert('警告信息')

// 确认框
const isConfirm = window.confirm('确定删除？')

// 输入框
const userInput = window.prompt('请输入姓名', '默认值')

// 打印
window.print()
```

### <font style="color:#01B2BC;">存储 API</font>
#### 1. Cookie
```javascript
// 设置cookie
document.cookie = 'name=value; expires=日期; path=/; domain=.example.com; secure'

// 读取cookie
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=')
    acc[name] = decodeURIComponent(value)
    return acc
}, {})

// 删除cookie
document.cookie = 'name=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
```

#### 2. Web Storage
```javascript
// localStorage - 永久存储
localStorage.setItem('key', 'value')
localStorage.getItem('key')
localStorage.removeItem('key')
localStorage.clear()
localStorage.length

// sessionStorage - 会话存储
sessionStorage.setItem('key', 'value')

// 存储对象
localStorage.setItem('user', JSON.stringify({name: 'John'}))
const user = JSON.parse(localStorage.getItem('user'))

// 存储事件
window.addEventListener('storage', (e) => {
    console.log('存储变化:', e.key, e.newValue, e.oldValue)
})
```

#### 3. IndexedDB
```javascript
//打开数据库
const request = indexedDB.open('MyDatabase', 1)

request.onsuccess = (e) => {
    const db = e.target.result
    // 数据库操作
}

request.onupgradeneeded = (e) => {
    const db = e.target.result
    // 创建对象存储
    const store = db.createObjectStore('users', {keyPath: 'id'})
}
```

### <font style="color:#213BC0;">元素几何信息</font>
#### 1. 位置和尺寸
```javascript
const el = document.getElementById('element')

// 偏移尺寸
el.offsetWidth, el.offsetHeight      // 包含边框和内边距
el.offsetLeft, el.offsetTop         // 相对offsetParent

// 客户端尺寸
el.clientWidth, el.clientHeight      // 包含内边距，不含边框
el.clientLeft, el.clientTop          // 边框宽度

// 滚动尺寸
el.scrollWidth, el.scrollHeight      // 内容总尺寸
el.scrollLeft, el.scrollTop          // 滚动位置

// 相对视口位置
const rect = el.getBoundingClientRect()
rect.left, rect.top                  // 相对视口
rect.width, rect.height
rect.x, rect.y                       // 别名
```

#### 2. 滚动操作
```javascript
// 元素滚动
el.scrollTo(x, y)
el.scrollBy(dx, dy)
el.scrollIntoView({behavior: 'smooth'})

// 窗口滚动
window.scrollTo({top: 100, behavior: 'smooth'})
window.scrollBy(0, 100)
window.scrollX, window.scrollY       // 当前滚动位置

// 检查元素是否可见
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect()
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
    )
}
```

### <font style="color:#0C68CA;">高级 DOM API</font>
#### 1. MutationObserver
```javascript
// 监听DOM变化
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            console.log('子节点变化')
        }
    })
})

observer.observe(el, {
    childList: true,          // 子节点变化
    attributes: true,         // 属性变化
    subtree: true,            // 监听所有后代
    attributeFilter: ['class'] // 只监听class属性
})

observer.disconnect() // 停止监听
```

#### 2. IntersectionObserver
```javascript
// 元素可见性监听
const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // 进入视口
            entry.target.classList.add('visible')
        }
    })
}, {
    threshold: 0.5,    // 50%可见时触发
    rootMargin: '50px' // 提前50px触发
})

io.observe(el)
```

#### 3. Performance API
```javascript
// 性能测量
performance.now() // 高精度时间戳

// 导航计时
const navigation = performance.getEntriesByType('navigation')[0]
navigation.domContentLoadedEventEnd - navigation.navigationStart

// 资源计时
performance.getEntriesByType('resource').forEach(resource => {
    console.log(resource.name, resource.duration)
})
```

### <font style="color:#4C16B1;">现代浏览器 API</font>
#### 1. 网络状态
```javascript
// 在线状态
window.addEventListener('online', () => console.log('在线'))
window.addEventListener('offline', () => console.log('离线'))
navigator.onLine // 当前状态

// 网络信息
navigator.connection.downlink    // 下行速度(Mbps)
navigator.connection.effectiveType // 网络类型('4g')
navigator.connection.addEventListener('change', updateNetworkStatus)
```

#### 2. 剪贴板 API
```javascript
// 读取剪贴板
navigator.clipboard.readText().then(text => {
    console.log('剪贴板内容:', text)
})

// 写入剪贴板
navigator.clipboard.writeText('要复制的文本')

// 剪贴板事件
document.addEventListener('copy', (e) => {
    e.clipboardData.setData('text/plain', '自定义内容')
    e.preventDefault()
})
```

#### 3. 全屏 API
```javascript
// 进入全屏
el.requestFullscreen().catch(err => {
    console.error('全屏失败:', err)
})

// 退出全屏
document.exitFullscreen()

// 全屏事件
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        console.log('进入全屏')
    } else {
        console.log('退出全屏')
    }
})
```





> 更新: 2025-12-14 03:10:24  
> 原文: <https://www.yuque.com/u56987424/lwyx/qu4xitaqu8ik6vsg>