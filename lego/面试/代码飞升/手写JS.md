# 手写JS

> <font style="color:rgb(26, 32, 41);">一、JavaScript 基础与核心机制</font>
>
> <font style="color:rgb(26, 32, 41);">二、数据结构与算法</font>
>
> <font style="color:rgb(26, 32, 41);">三、继承与面向对象</font>
>
> <font style="color:rgb(26, 32, 41);">四、异步编程与并发控制</font>
>
> <font style="color:rgb(26, 32, 41);">五、函数式编程技巧</font>
>
> <font style="color:rgb(26, 32, 41);">六、数组与对象操作</font>
>
> <font style="color:rgb(26, 32, 41);">七、浏览器与网络</font>
>
> <font style="color:rgb(26, 32, 41);">八、前端框架与设计模式</font>

### <font style="color:rgb(26, 32, 41);">🧩</font><font style="color:rgb(26, 32, 41);"> 一、JavaScript 基础与核心机制</font>

#### 1.new

```javascript
// [原子模型]: 创空对象 -> 链原型 -> 绑定this执行 -> 返结果
// [逻辑骨架]:
// 1. const obj = Object.create(fn.prototype)
// 2. res = fn.apply(obj, args)
// 3. return (res instanceof Object ? res : obj)
// [通俗讲解]: “模具冲压”。直接拿一张现成的图纸(prototype)复印出一块白板(obj)，再按图纸(fn)加工内容，最后看成品是否合格，不合格就返回原始白板。
function myNew(fn, ...args) {
  if (typeof fn !== 'function') {
    return "Error in params"
  }
  // 1. 创建一个新对象，其原型指向构造函数的 prototype
  const obj = Object.create(fn.prototype)
  // 2. 将构造函数的 this 绑定到新对象，并执行
  let ret = fn.apply(obj, args)
  // 3. 根据构造函数执行结果决定返回新对象还是返回的结果对象
  return ret instanceof Object ? ret : obj
}
```

#### 2.instanceof

```javascript
// [原子模型]: 取左侧原型 -> 循环对比右侧原型 -> 爬坡直到null
// [逻辑骨架]:
// 1. let proto = Object.getPrototypeOf(left)
// 2. while(proto) { if(proto === right.prototype) return true; proto = getPrototypeOf(proto); }
// 3. return false
// [通俗讲解]: “溯源追分”。拿着产品看它身上的模具标签，如果不是目标模具，就顺着标签往上找“模具的模具”，直到找到或者源头为空。
function myInstanceof(left, right) {
  const prototype = right.prototype
  let proto = Object.getPrototypeOf(left)
  while(true) {
    if(proto === null) return false
    if(proto === prototype) return true
    proto = Object.getPrototypeOf(proto)
  }
}
```

#### 3.Object.create（选背）

```javascript
// [原子模型]: 创建临时构造函数 -> 指向原型 -> 返回实例
// [逻辑骨架]:
// 1. function Fn() {}
// 2. Fn.prototype = proto; return new Fn();
// [通俗讲解]: “复印图纸”。直接拿一张现成的图纸(proto)作为新模具的底稿，吐出一个完全符合该图纸规范的新产品。
//实现Object.create方法
function create(proto) {
    function Fn() {};
    Fn.prototype = proto;
    Fn.prototype.constructor = Fn;
    return new Fn();
}
```

#### 4.定义不可枚举的属性（选背）

```javascript
// [原子模型]: 使用 Object.defineProperty -> 设置 enumerable: false
// [逻辑骨架]:
// 1. Object.defineProperty(obj, key, { value, enumerable: false })
// [通俗讲解]: “深藏不露”。给产品装个隐形零件。虽然零件在那执行功能，但别人在清点零件清单(keys)时，根本看不到它。
const obj = {};

// 定义一个不可枚举的属性
Object.defineProperty(obj, 'nonEnumerable', {
  value: 'This property is not enumerable',
  enumerable: false, // 设置为不可枚举
  writable: true,    // 默认为 false，这里设置为可写
  configurable: true // 默认为 false，这里设置为可配置
});

// 尝试枚举对象的属性
for (const key in obj) {
  console.log(key); // 不会打印 'nonEnumerable'
}

console.log(Object.keys(obj)); // 返回空数组，因为 'nonEnumerable' 不可枚举
```

#### 5.对象支持for of

```javascript
// [原子模型]: 实现 [Symbol.iterator] 接口 -> 返回包含 next() 方法的对象 -> next() 返回 {value, done}
// [逻辑骨架]:
// 1. obj[Symbol.iterator] = function() {
//      return { next: () => { if(index < len) return {value, done:false}; else return {done:true}; } }
//    }
// [通俗讲解]: “自动传送带”。给一个大仓库(对象)装上自动传送带，只要外面喊“下一个”，仓库就弹出一个货物，直到清空。
// 为 Object 原型添加可迭代能力
Object.prototype[Symbol.iterator] = function () {
  // 获取对象自身的可枚举键（排除原型链上的属性）
  const keys = Object.keys(this);
  let index = 0;
  return {
    next: () => {
      if (index < keys.length) {
        const key = keys[index];
        index++;
        // 返回当前键值对（符合迭代器规范：value 是键值对，done 为 false）
        return { value: [key, this[key]], done: false };
      } else {
        // 遍历结束，done 为 true
        return { done: true };
      }
    },
  };
};

// 测试用例
const person = { name: "Alice", age: 25, city: "Beijing" };

// 使用 for...of 遍历对象
for (const [key, value] of person) {
  console.log(`${key}:${value}`);
}
```

#### 6.对象比较

```javascript
// [原子模型]: 剥洋葱 -> 基础类型直比 -> 键数对比 -> 递归对比每一项
// [逻辑骨架]:
// 1. if (!isObj) return a === b
// 2. if (keyLenA !== keyLenB) return false
// 3. for(key in a) if(!isEqual(a[key], b[key])) return false
// 4. return true
// [通俗讲解]: “严密质检”。不是看两个包装盒像不像，而是拆开盒子，数数零件数对不对，再把每个零件拿出来一一比对。

function isEqual (obj1, obj2) {
  //不是对象,直接返回比较结果
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2
  }
  //都是对象,且地址相同,返回true
  if (obj2 === obj1) return true;
  //是对象或数组
  let keys1 = Object.keys(obj1)
  let keys2 = Object.keys(obj2)
  //比较keys的个数,若不同,肯定不相等
  if (keys1.length !== keys2.length) return false;
  for (let k of keys1) {
    //递归比较键值对
    if (!isEqual(obj1[k], obj2[k])) {
      return false
    }
  }
  return true;
}

const obj1 = {
  a: 100,
  b: {
    x: 100,
    y: 200
  }
}
const obj2 = {
  a: 200,
  b: {
    x: 100,
    y: 200
  }
}
console.log(isEqual(obj1, obj2)) //false

```

#### 7.url解析

```javascript
// [原子模型]: 分割 ? 取参数串 -> 按 & 分割项 -> 按 = 分割键值对 -> decodeURIComponent 处理
// [逻辑骨架]:
// 1. queryString = url.split('?')[1];
// 2. queryString.split('&').forEach(str => { [k,v] = str.split('='); res[k] = decode(v) })
// [通俗讲解]: “拆箱清点”。物流车到了，先把车厢里的货单(?后面)拿出来，按“&”符号剪成一个个长条，再按“=”切开，把左边当标签、右边当货物收纳。
const parseUrl = (url) => {
  if (!url.includes("?")) return {}
  const queryString = url.split("?")[1]
  const resObj = {}
  queryString.split("&").forEach(str => {
    let [key, value] = str.split("=")
    if (!key) return
    value = value !== undefined ? decodeURIComponent(value) : true
    if (resObj.hasOwnProperty(key)) {
      resObj[key] = [].concat(resObj[key], value)
    } else {
      resObj[key] = value
    }
  })
  return resObj
}
https://example.com/search?q=nodejs&lang=en&lang=zh&user=John%20Doe&flag&empty=&status=undefined&value=null&special=a%25b&malformed=a%&noValue&=onlyKey

```

### <font style="color:rgb(26, 32, 41);">🌳</font><font style="color:rgb(26, 32, 41);"> 二、数据结构与算法</font>

#### 1.数组转树

```javascript
/**
 * 把平铺的数组结构转成树形结构
 */
const arr = [
  { id: "01", name: "张大大", pid: "", job: "项目经理" },
  { id: "02", name: "小亮", pid: "01", job: "产品leader" },
  { id: "03", name: "小美", pid: "01", job: "UIleader" },
  { id: "04", name: "老马", pid: "01", job: "技术leader" },
  { id: "05", name: "老王", pid: "01", job: "测试leader" },
  { id: "06", name: "老李", pid: "01", job: "运维leader" },
  { id: "07", name: "小丽", pid: "02", job: "产品经理" },
  { id: "08", name: "大光", pid: "02", job: "产品经理" },
  { id: "09", name: "小高", pid: "03", job: "UI设计师" },
  { id: "10", name: "小刘", pid: "04", job: "前端工程师" },
  { id: "11", name: "小华", pid: "04", job: "后端工程师" },
  { id: "12", name: "小李", pid: "04", job: "后端工程师" },
  { id: "13", name: "小赵", pid: "05", job: "测试工程师" },
  { id: "14", name: "小强", pid: "05", job: "测试工程师" },
  { id: "15", name: "小涛", pid: "06", job: "运维工程师" },
];

// [原子模型]: 映射表引用(Map) -> 单次遍历 -> 动态挂载/预建占位
// [逻辑骨架]:
// 1. const map = {}, res = [];
// 2. for(const item of list) {
//      map[id] = { ...item, children: map[id]?.children || [] }
//      if(pid) (map[pid] ||= { children: [] }).children.push(map[id])
//      else res.push(map[id])
//    }
// [通俗讲解]: “实时入伙”。零件一边在名册上签到，一边找组织。如果上级还没来，就先在架子上给上级占个空位(children)；如果上级已经到了，直接跳进去。
function toTree(list) {
  const map = {};
  const res = [];
  for (const item of list) {
    const id = item.id;
    const pid = item.pid;
    // 1. 确保当前节点在 map 中存在（如果不存在就创建，如果存在就保留之前的 children）
    if (!map[id]) {
      map[id] = { children: [] };
    }
    // 把真实数据合并进去
    map[id] = { ...item, children: map[id].children };
    // 2. 挂载到父节点
    if (pid) {
      // 如果父节点还没在 map 里，先占个位
      if (!map[pid]) {
        map[pid] = { children: [] };
      }
      map[pid].children.push(map[id]);
    } else {
      // 根节点
      res.push(map[id]);
    }
  }
  return res;
}

let result = toTree(arr);
console.log(result);
```

#### 2.将数字每千分位用逗号隔开

```javascript
// [原子模型]: 转字符串 -> 倒序遍历 -> 计数器(count)满3个插逗号 -> 反转结果
// [逻辑骨架]:
// 1. let str = n.toString(), res = [];
// 2. for(i = len-1; i >= 0; i--) { res.push(str[i]); count++; if(count === 3 && i !== 0) { res.push(','); count = 0; } }
// [通俗讲解]: “分箱包装”。从最后一位往前数，每放满3个零件就塞进一个隔板(逗号)，最后把整个传送带反过来。
function thousandSeparator(n) {
  const str = n.toString();
  const res = [];
  let count = 0;

  // 从后往前遍历每一位数字
  for (let i = str.length - 1; i >= 0; i--) {
    res.push(str[i]);
    count++;

    // 每数够3位，且还没到最开头的一位，就补一个逗号
    if (count === 3 && i !== 0) {
      res.push(',');
      count = 0;
    }
  }

  // 翻转并拼接
  return res.reverse().join('');
}

```

#### 3.洗牌算法

```javascript
// [原子模型]: 倒序遍历 -> 生成随机索引 j -> 交换当前项 i 与 j
// [逻辑骨架]:
// 1. for(i = len-1; i > 0; i--) {
//      const j = floor(random() * (i + 1));
//      [a[i], a[j]] = [a[j], a[i]];
//    }
// [通俗讲解]: “零件乱序”。仓库盘点时，从最后一个货架开始，随机找个前面的货架交换货物，直到最前面一个，保证货物分布彻底随机。
function shuffle(arr) {
  for(let i = arr.length-1; i > 0; i --) {
    let j = Math.floor(Math.random() * (i + 1))
    [arr[i], arr[j]] = [arr[j],arr[i]]
  }
  return arr
}
```

#### 4.大数加法

```javascript
//大数相加  ~~i （字符串转数字）
// [原子模型]: 倒序遍历 -> 逐位相加 -> 维护进位(carry) -> 结果反转
// [逻辑骨架]:
// 1. while(i >= 0 || j >= 0 || carry)
// 2. sum = a[i] + b[j] + carry; carry = Math.floor(sum / 10); res.push(sum % 10)
// 3. return res.reverse().join('')
// [通俗讲解]: “垂直堆叠加法”。因为计算器位不够(超大数)，只能像小学生列竖式一样，从个位开始一个个算，满了10就给左边的工位送个信(carry)。
//大数相加
const getBigInt = (a, b) => {
  a = a + "";
  b = b + "";
  let i = a.length - 1;
  let j = b.length - 1;
  let carry = 0; 
  const res = [];
  while (i >= 0 || j >= 0 || carry !== 0) {
    let left = i >= 0 ? Number(a[i]) : 0;
    let right = j >= 0 ? Number(b[j]) : 0;
    let result = left + right + carry;
    res.push(result % 10);
    carry = Math.floor(result / 10);
    i--;
    j--;
  }
  return res.reverse().join("");
};
```

#### 5.最频繁标签统计

```javascript
// [原子模型]: 遍历所有元素 -> Map 计数 -> 维护 maxCount 和 tagName
// [逻辑骨架]:
// 1. docs.querySelectorAll('*').forEach(el => map[el.tagName]++)
// 2. iterate map find max
// [通俗讲解]: “热销榜单”。派个机器人扫描全工厂所有零件盒的标签，统计每种标签出现的次数，最后看看哪个标签卖得最好。
findMostFrequentTag(); ==> { name: 'div', num: 100 }
function findMostFrequentTag() {
  const counts = new Map();
  let maxCount = 0;
  let maxTag = '';

  const allElements = document.querySelectorAll('*');
  if (allElements.length === 0) return { name: null, num: 0 };

  allElements.forEach(el => {
    const tagName = el.tagName.toLowerCase();
    const count = (counts.get(tagName) || 0) + 1;
    counts.set(tagName, count);

    // 在统计的同时更新最大值，避免二次遍历
    if (count > maxCount) {
      maxCount = count;
      maxTag = tagName;
    }
  });

  return { name: maxTag, num: maxCount };
}
```

#### 6.比较版本号

```javascript
// [原子模型]: split('.') 转数组 -> 逐位对比数字 -> 缺失补 0
// [逻辑骨架]:
// 1. v1Arr = v1.split('.'); v2Arr = v2.split('.');
// 2. for(i = 0; i < maxLen; i++) { if(v1[i] > v2[i]) return 1; ... }
// [通俗讲解]: “版本检阅”。按点号(.)把版本号拆成一节节的管道，从最左边那一节比，如果一样大就比下一节，直到比出输赢。
function compareVersions(v1, v2) {
  // 分割版本字符串为数字数组，缺失部分补0
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);
  
  // 确定需要比较的最大长度
  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  
  for (let i = 0; i < maxLength; i++) {
    // 获取当前段的数字，若不存在则取0
    const num1 = v1Parts[i] || 0;
    const num2 = v2Parts[i] || 0;
    
    if (num1 > num2) return 1;   // v1 > v2
    if (num1 < num2) return -1;  // v1 < v2
  }
  
  return 0; // v1 == v2
}
1.0.0 1.0.1
```

####

### <font style="color:rgb(26, 32, 41);">🧬</font><font style="color:rgb(26, 32, 41);"> 三、继承与面向对象</font>

#### 原型链继承

```javascript
// [原子模型]: Child.prototype = new Parent()
// [逻辑骨架]:
// 1. function Child() {}
// 2. Child.prototype = new Parent();
// [通俗讲解]: “共用样机”。所有新型号(Child)都直接共享同一台现成的老款样机(Parent实例)。
// 问题是：如果样机里的储物箱(引用类型)被改了，所有新型号看到的箱子都会变。
function Parent(age) {
    this.age = age;
    this.hobbies = ['reading', 'coding']; // 用于演示引用类型共享问题
}

Parent.prototype.getAge = function() {
    console.log(this.age);
}

function Child() {}
Child.prototype = new Parent(30); // Parent 的构造函数被调用了一次

const child1 = new Child();
const child2 = new Child();

child1.hobbies.push('swimming');

console.log(child1.hobbies); // ['reading', 'coding', 'swimming']
console.log(child2.hobbies); // ['reading', 'coding', 'swimming'] -> 引用类型被共享，问题验证
```

#### 借用构造函数继承

```javascript
// [原子模型]: Parent.call(this)
// [逻辑骨架]:
// 1. function Child() { Parent.call(this); }
// [通俗讲解]: “聘请设计师”。每台新产品(Child)在组装时，都请老款的设计师(Parent)来贴身安装基础零件。
// 优点：零件都是独立的。缺点：设计师带不走蓝图上的高级技能(原型方法)。
function Parent(age) {
    this.age = age;
}

Parent.prototype.getAge = function() {
    console.log(this.age);
}

function Child(age, name) {
    Parent.call(this, age); // Parent 的构造函数被调用
    this.name = name;
}

const child = new Child(18, 'Tom');
console.log(child.age); // 18
console.log(child.name); // 'Tom'
// child.getAge(); // TypeError: child.getAge is not a function -> 父类原型上的方法无法继承，问题验证
```

#### 组合式继承

```javascript
// [原子模型]: call(属性) + prototype = new Parent(原型)
// [逻辑骨架]:
// 1. function Child() { Parent.call(this); }
// 2. Child.prototype = new Parent();
// [通俗讲解]: “土豪升级方案”。既请设计师贴身安装，又买了一台样机占位。
// 虽然功能全了，但代价是设计师得跑两趟(构造函数调两次)，且仓库里重复堆了两套基础零件。
function Parent(age) {
    this.age = age;
    console.log('Parent constructor called'); // 用于验证调用次数
}

Parent.prototype.getAge = function() {
    console.log(this.age);
}

function Child(age, name) {
    Parent.call(this, age); // 第二次调用 Parent 构造函数
    this.name = name;
}
Child.prototype = new Parent(); // 第一次调用 Parent 构造函数
Child.prototype.constructor = Child; // 修正 constructor 指向

const child = new Child(18, 'Tom');
// 控制台会输出两次 "Parent constructor called"，验证了“调用两次”的问题

// child 实例上有一个 age 属性（来自 Parent.call）
// child.__proto__ (即 Child.prototype) 上也有一个 age 属性（来自 new Parent()）
// 这就是“原型和实例上存在重复属性”
```

#### 原型式继承

```javascript
// [原子模型]: Object.create(obj)
// [逻辑骨架]:
// 1. const child = Object.create(parentObj)
// [通俗讲解]: “纯蓝图复刻”。不通过工厂（构造函数），直接拿着一个现成老产品的蓝图(对象)去克隆出一个简单的后辈。
let Parent = {
  name: 'parent',
  getName: function() {
    console.log(this.name)
  },
  arrayList: [1, 3, 4, 21, 12, 1]
}
const children = Object.create(Parent)
```

#### 寄生式继承

```javascript
// [原子模型]: 封装函数 -> Object.create -> 增强对象 -> 返回
// [逻辑骨架]:
// 1. function create(p) { let c = Object.create(p); c.fn = ...; return c; }
// [通俗讲解]: “蓝图改装”。拿着蓝图复刻(Object.create)后，还没出厂就偷偷给它加装几个额外的零件，把它变成一个更厉害的定制款。
function createChild(parent) {
  let child = Object.create(parent);
  child.sayHello = function() {
    console.log('hello');
  };
  return child;
}
let parent = { name: 'parent' };
let child = createChild(parent);
child.sayHello(); // "hello"
```

#### 极简/寄生组合式继承

```javascript
// [原子模型]: 构造函数里call(属性) -> Object.create建原型 -> 修正constructor
// [逻辑骨架]:
// 1. function Child(...args) { Parent.call(this, ...args); }
// 2. Child.prototype = Object.create(Parent.prototype);
// 3. Child.prototype.constructor = Child;
// [通俗讲解]: “技术集成”。新款产品(Child)不仅雇佣了老款的设计师(Parent.call)来加装基础属性，还直接借用了老款的高级图纸(Object.create)来学会高级技能，最后贴上自己的商标。
function Parent(age){
    this.age=age
}
Parent.prototype.getAge=function(){
    console.log(this.age)
}
function Child(age,name){
    Parent.call(this,age)
    this.name=name
}
Child.prototype = Object.create(Parent.prototype)
Child.prototype.constructor = Child
```

#### ES6class

```javascript
// [原子模型]: class extends + super()
// [逻辑骨架]:
// 1. class Child extends Parent { constructor() { super(); } }
// [通俗讲解]: “标准化生产线”。官方推出的全自动流水线，用最简洁的口令实现了复杂的“寄生组合”组装逻辑，既省内存又高性能。
class Parent {
  constructor(name) {
    this.name = name;
  }
  sayName() {
    console.log(this.name);
  }
}
class Child extends Parent {
  constructor(name, age) {
    super(name);
    this.age = age;
  }
  sayAge() {
    console.log(this.age);
  }
}
let child = new Child('child', 10);
child.sayName(); // "child"
child.sayAge(); // 10
```

### <font style="color:rgb(26, 32, 41);">📦</font><font style="color:rgb(26, 32, 41);">四、异步编程与并发控制</font>

#### 1.异步并发数限制

```javascript
// [原子模型]: 任务池(tasks) + 执行池(doing) -> 限制并发 -> Promise.race 控速
// [逻辑骨架]:
// 1. while (i < array.length) { 
//      const task = iterateFunc(array[i++]);
//      doing.push(task); 
//      task.then(() => doing.splice(indexOf(task), 1));
//      if (doing.length >= limit) await Promise.race(doing);
//    }
// [通俗讲解]: “流水线限流”。只有固定数量的工位(limit)，来一个活儿上一条线。如果线全满了，就得等着，谁先干完(race)谁就把位子腾出来给下一个人。
async function asyncLimit(limit, array, iterateFunc) {
  const results = [];
  const doing = []; // 正在执行的任务池

  for (const item of array) {
    // 1. 启动任务并存入结果数组
    const p = Promise.resolve().then(() => iterateFunc(item));
    results.push(p);

    // 2. 如果限流限制大于 0，则进行并发控制
    if (limit <= array.length) {
      // 任务完成时，从正在执行池中移除自己
      const e = p.then(() => doing.splice(doing.indexOf(e), 1));
      doing.push(e);

      // 3. 如果正在执行的任务达到上限，就等其中任意一个完成
      if (doing.length >= limit) {
        await Promise.race(doing);
      }
    }
  }

  // 4. 最后等所有任务全部执行完并返回结果
  return Promise.all(results);
}

// test
const timeout = i => new Promise(resolve => setTimeout(() => resolve(i), i))
limit(2, [1000, 1000, 1000, 1000], timeout).then((res) => {
  console.log(res)  // 输出所有任务的执行结果
})
```

#### 2.异步并发限制

```javascript
// [原子模型]: 队列存储(que) + 计数器(count) -> 任务完成递归触发 run
// [逻辑骨架]:
// 1. push(task) { que.push(task); run(); }
// 2. run() { if(count < limit && que.len) { task = que.shift(); count++; task().finally(() => { count--; run(); }) } }
// [通俗讲解]: “值班调度”。门口有个计数器(count)，只要在干活的人没满，就让排队的人进去开工。干完一个，计数器减一，再喊下一个开工。
class LimitRequest {
  constructor(limit) {
    this.limit = limit;
    this.count = 0;
    this.queue = [];
  }

  // 添加任务
  push(fn, src) {
    this.queue.push({ fn, src });
    this.run();
  }

  // 执行任务
  run() {
    // 只要队列有活，且人手没满，就继续派活
    if (this.queue.length > 0 && this.count < this.limit) {
      const { fn, src } = this.queue.shift();
      this.count++;

      fn(src)
        .then((res) => console.log('任务成功:', res))
        .catch((err) => console.error('任务失败:', err))
        .finally(() => {
          this.count--;
          this.run(); // 递归调用，尝试处理下一个
        });
    }
  }
}

// 测试
const getData = (src) => new Promise(res => setTimeout(() => res(src), 1000));
const p = new LimitRequest(2);
p.push(getData, 1);
p.push(getData, 2);
p.push(getData, 3);
p.push(getData, 4);
```

**改进版：支持动态添加 + 获取结果**

```javascript
// [核心优势]: 结合上面两种方式的优点
// 1. 支持动态添加任务（像 limitRequest）
// 2. 每个任务返回 Promise，可以 await 获取结果（像 limit 函数）
// 3. 代码简洁易懂，适合面试手写

class AsyncPool {
  constructor(limit) {
    this.limit = limit    // 并发限制数
    this.count = 0        // 当前正在执行的任务数
    this.queue = []       // 等待队列
  }

  // 添加任务，返回 Promise
  add(task) {
    return new Promise((resolve, reject) => {
      // 将任务和对应的 resolve/reject 存入队列
      this.queue.push({ task, resolve, reject })
      this.run()
    })
  }

  // 执行任务
  run() {
    // 当并发数未满且队列中有任务时，持续执行
    while (this.count < this.limit && this.queue.length) {
      const { task, resolve, reject } = this.queue.shift()
      this.count++
      
      task()
        .then(resolve)   // 任务成功，resolve 对应的 Promise
        .catch(reject)   // 任务失败，reject 对应的 Promise
        .finally(() => {
          this.count--
          this.run()     // 任务完成，尝试执行下一个
        })
    }
  }
}

// 测试使用
const pool = new AsyncPool(2)
const p1 = pool.add(() => getData(1))
const p2 = pool.add(() => getData(2))
const p3 = pool.add(() => getData(3))
const p4 = pool.add(() => getData(4))

// 可以单独获取某个任务的结果
p1.then(res => console.log('任务1完成:', res))

// 也可以等待所有任务完成
Promise.all([p1, p2, p3, p4]).then(results => {
  console.log('所有任务完成:', results) // [1, 2, 3, 4]
})
```

#### 3.最多请求3次

```javascript
// [原子模型]: 循环调用 -> catch 时判断次数 -> 没满就等待重试 -> 满了就彻底失败
// [逻辑骨架]:
// 1. while (attempts < max) { try { return await fn(); } catch(e) { attempts++; if(attempts === max) throw e; await sleep(delay); } }
// [通俗讲解]: “顽强快递员”。送货失败了不气馁，等一会再送，直到送够3次还没成功才死心反馈失败。
async function retryRequest(fn, maxAttempts, delay) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      // 尝试执行请求
      return await fn();
    } catch (error) {
      attempts++;
      console.warn(`第 ${attempts} 次尝试失败`);
      
      // 如果达到最大次数，直接抛出错误
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // 否则等待一段时间再试
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 示例用法
const fakeApi = () => Math.random() > 0.8 ? Promise.resolve("成功") : Promise.reject("失败");
retryRequest(fakeApi, 3, 1000)
  .then(res => console.log('最终结果:', res))
  .catch(err => console.error('重试耗尽:', err));
```

#### 4.promise.all

```javascript
// [原子模型]: 返回新Promise -> 计数器(count) + 结果数组(res) -> 遍历执行
// [逻辑骨架]:
// 1. return new Promise((resolve, reject) => {
//      promises.forEach((p, i) => Promise.resolve(p).then(v => { res[i] = v; count++; if(count === len) resolve(res); }).catch(reject))
//    })
// [通俗讲解]: “团队同步”。一队业务员出去谈生意，只要有一个谈崩了全队就失败；要是全都谈成了，就带上所有合同(结果数组)风光回厂。
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const res = [];
    let finishedCount = 0;
    const len = promises.length;

    if (len === 0) return resolve([]);

    promises.forEach((p, index) => {
      // Promise.resolve 包裹，确保 p 是一个 Promise
      Promise.resolve(p)
        .then((value) => {
          res[index] = value;
          finishedCount++;
          // 当所有 Promise 都完成时，resolve 结果
          if (finishedCount === len) resolve(res);
        })
        .catch(reject); // 只要有一个失败，直接整个失败
    });
  });
}

function promiseAllSettled(promises) {
  return new Promise((resolve) => {
    const res = [];
    let finishedCount = 0;
    const len = promises.length;

    if (len === 0) return resolve([]);

    promises.forEach((p, index) => {
      Promise.resolve(p)
        .then((value) => {
          res[index] = { status: 'fulfilled', value };
        })
        .catch((reason) => {
          res[index] = { status: 'rejected', reason };
        })
        .finally(() => {
          finishedCount++;
          if (finishedCount === len) resolve(res);
        });
    });
  });
}
```

#### 6.Promise手写红绿灯

```javascript
// [原子模型]: 封装延时函数 light(timer, cb) -> 异步循环
// [逻辑骨架]:
// 1. const sleep = (t) => new Promise(res => setTimeout(res, t))
// 2. while(true) { await sleep(red); await sleep(green); ... }
// [通俗讲解]: “流水线红绿灯”。设定好每个灯亮的时长(Promise+setTimeout)，通过 await 让代码像排队一样轮流执行，无限循环。
async function trafficLight() {
  const red = () => console.log("🔴 红灯亮 (3s)");
  const green = () => console.log("🟢 绿灯亮 (2s)");
  const yellow = () => console.log("🟡 黄灯亮 (1s)");

  const sleep = (delay) => new Promise(res => setTimeout(res, delay));

  while (true) {
    red();
    await sleep(3000);
    green();
    await sleep(2000);
    yellow();
    await sleep(1000);
  }
}

// trafficLight(); // 启动循环
```

#### 7.定时器hooks（选背）

```javascript
// [原子模型]: useState 存秒数 -> useEffect 开 setInterval -> 组件卸载或更新时 clearInterval
// [逻辑骨架]:
// 1. useEffect(() => { const timer = setInterval(() => setSeconds(s-1), 1000); return () => clearInterval(timer); }, [seconds])
// [通俗讲解]: “车间计时器”。在工作台上装个表，每秒(setInterval)跳动一下更新状态，如果工作台关了(组件卸载)或表坏了，就必须清理掉旧计时器。
import React, { useState, useEffect } from 'react';

// 自定义定时器 Hook
const useTimer = (initialSeconds) => {
  // 使用 useState 来创建 seconds 状态变量，初始值为传入的 initialSeconds
  const [seconds, setSeconds] = useState(initialSeconds);

  // 使用 useEffect 来处理定时器逻辑
  useEffect(() => {
    let intervalId; // 保存定时器的 ID

    // 定义 tick 函数，每秒减少秒数
    const tick = () => {
      setSeconds((prevSeconds) => prevSeconds - 1);
    };

    // 如果 seconds 大于 0，启动定时器
    if (seconds > 0) {
      intervalId = setInterval(tick, 1000);
    }

    // 返回一个清除函数，在组件卸载或定时器重置时执行
    return () => {
      clearInterval(intervalId); // 清除定时器
    };
  }, [seconds]); // useEffect 依赖于 seconds 变量，只有在 seconds 变化时才会执行

  // 定义 resetTimer 函数，用于重置定时器的秒数
  const resetTimer = (newSeconds) => {
    setSeconds(newSeconds);
  };

  // 返回当前秒数和重置定时器函数
  return { seconds, resetTimer };
};

export default useTimer;

```

Vue 3 Composition API 版本：

```typescript
import { ref, watch, onUnmounted } from 'vue';

// 自定义定时器 Hook
const useTimer = (initialSeconds: number) => {
  // 使用 ref 创建响应式的 seconds 变量
  const seconds = ref(initialSeconds);
  let intervalId: number | null = null;

  // 清除定时器的函数
  const clearTimer = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  // 启动定时器的函数
  const startTimer = () => {
    clearTimer(); // 先清除已有的定时器
    if (seconds.value > 0) {
      intervalId = setInterval(() => {
        seconds.value--;
        if (seconds.value <= 0) {
          clearTimer();
        }
      }, 1000);
    }
  };

  // 监听 seconds 变化，当重置时重新启动定时器
  watch(seconds, (newVal) => {
    if (newVal > 0 && intervalId === null) {
      startTimer();
    }
  });

  // 初始启动定时器
  startTimer();

  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearTimer();
  });

  // 重置定时器函数
  const resetTimer = (newSeconds: number) => {
    seconds.value = newSeconds;
    startTimer();
  };

  return { seconds, resetTimer };
};

export default useTimer;
```

#### 8.越来越可怕的异步（串行任务队列）

```javascript
// [原子模型]: 任务队列(queue) -> 链式调用(return this) -> 异步触发执行(execute)
// [逻辑骨架]:
// 1. sleep/print(fn) { queue.push(fn); return this; }
// 2. execute() { for(task of queue) await task(); }
// [通俗讲解]: “预排班计划”。先开一个空的排班表(queue)，把所有的“睡觉”、“打印”任务先写在表上。最后通过 execute() 统一触发，按表里的顺序一个等一个地执行。
class TaskQueue {
  constructor() {
    this.queue = [];
  }

  // 延迟任务
  sleep(time) {
    this.queue.push(() => new Promise(res => setTimeout(res, time)));
    return this; // 返回 this 实现链式调用
  }

  // 打印任务
  print(val) {
    this.queue.push(() => {
      console.log(val);
      return Promise.resolve();
    });
    return this;
  }

  // 启动执行
  async execute() {
    for (const task of this.queue) {
      await task();
    }
    this.queue = []; // 执行完清空队列
  }
}

// 示例
// new TaskQueue().print('开始').sleep(1000).print('1s后').execute();
```

#### 9.实现sleep

```javascript
function sleep(fn, time, ...args) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fn(...args));
    }, time);
  });
}
let saySomething = (name) => console.log(`hello, ${name}`)
async function autoPlay() {
  await sleep(saySomething, 1000, 'TianTian')
  await sleep(saySomething, 1000, '李磊')
  await sleep(saySomething, 1000, '掘金的好友们')
}
autoPlay()
```

####

### <font style="color:rgb(26, 32, 41);">🛠</font><font style="color:rgb(26, 32, 41);"> 五、函数式编程技巧</font>

#### 1.防抖

```javascript
// [原子模型]: 闭包存储 timer -> 每次触发先 clear -> 重新计时
// [逻辑骨架]:
// 1. return (...args) => {
//      if (timer) clearTimeout(timer);
//      timer = setTimeout(() => fn(...args), delay);
//    }
// [通俗讲解]: “急躁的工人”。工人一干活就要先等5秒，如果这5秒内老板又喊他干活，他之前的等待就作废，重新开始记5秒。
function debounce(fn, delay) {
    let timer = null;
    
    // 使用剩余参数 ...args 来接收所有参数
    return function(...args) { 
        // 箭头函数会自动捕获外层 this，所以不需要手动保存 context
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            // 直接调用 fn 并传入 args
            fn(...args); 
        }, delay);
    };
}

```

#### 2.节流

```javascript
// [原子模型]: 闭包存储 lastTime -> 检查当前时间差 -> 够了就执行并更新时间
// [逻辑骨架]:
// 1. return (...args) => {
//      if (now - lastTime > delay) { fn(...args); lastTime = now; }
//    }
// [通俗讲解]: “冷静的闸机”。不管多少人挤破头想进厂，检票闸机每隔10分钟才开一次门，没到点谁也进不来。
function throttle(fn,delay){
    let lastTime=0
    return function(...agrs){
        const nowTime=new Date().getTime()
        if(nowTime-lastTime>delay){
            fn(...agrs)
            lastTime=nowTime
        }
    }

}
```

#### 3.函数柯里化

作用：参数复用、延迟计算

```javascript
// [原子模型]: 闭包存参数 -> 比较参数长度 -> 够了就执行，不够就递归返新函数
// [逻辑骨架]:
// 1. curry(fn, ...args) {
//      if(args.length >= fn.length) return fn(...args);
//      return (...rest) => curry(fn, ...args, ...rest);
//    }
// [通俗讲解]: “零件分步组装”。原本要一口气装完的设备，现在可以先装一部分零件，剩下的零件什么时候送达，什么时候再继续装，直到装完。
const curry = (fn, ...args) => {
  if(args.length >= fn.length) {
    return fn(...args)
  }
  return (...rest) => {
    return curry(fn, ...args, ...rest)
  }
}

// bfe
function curry(fn) {
  return function curried(...args) {
    if(fn.length <= args.length) {
      return fn(...args)
    }
    return (...rest) => {
      return curried(...args, ...rest)
    }
  }
}
```

#### 4.curry/反curry介绍， 手写通用curry化工厂函数，增加占位符实现

**Curry（柯里化）介绍**

柯里化（Currying）是一种将接受多个参数的函数转换成一系列使用一个参数的函数的技术。柯里化的函数每次调用时只接收一个参数，并返回一个新的函数，直到所有参数都被提供，最后返回结果。

例如，一个接受三个参数的函数 `f(a, b, c)` 可以被柯里化为 `f(a)(b)(c)`。

**反柯里化（Uncurrying）介绍**

反柯里化则是柯里化的逆过程，它将一个已经柯里化的函数转换回接受多个参数的原始函数。反柯里化的目的是增加函数的适用性，使其可以接受不同数量的参数。

**手写通用Curry化工厂函数**

更加灵活的柯里化方式，支持我们乱序传入参数，暂时不能确定的参数，传一个空格

```javascript
function curry(fn) {
  return function curried(...args) {
    // 检查是否所有参数都已提供（不包括占位符）
    const allArgsProvided = args.length >= fn.length && args.every(arg => arg !== curry.placeholder);
    if (allArgsProvided) {
      // 如果所有参数都已提供，则调用原始函数
      return fn.apply(this, args);
    } else {
      // 如果参数不足，返回一个新的curry函数，并携带当前的参数和占位符
      return function(...newArgs) {
        const params=args.map(arg => 
          (arg!==curry.placeholder? arg:newArgs.shift())
                             )
        return curried(...params,...newArgs)
      };
    }
  };
}
// 占位符
curry.placeholder = Symbol();
// 示例使用
function add(a, b, c) {
  return a + b + c;
}
const curriedAdd = curry(add);
const addFive = curriedAdd(5);
const addFiveAndSeven = addFive(7);
console.log(addFiveAndSeven(3)); // 输出 15
// 使用占位符
const addFiveToFirstAndThreeToLast = curriedAdd(curry.placeholder, 7)(3);
console.log(addFiveToFirstAndThreeToLast(5)); // 输出 15
```

在上面的代码中，`curry` 函数接受一个原始函数 `fn` 和一个可选的 `placeholders` 对象，用于存储占位符的值。`curry.placeholder` 是一个特殊的符号，用于表示占位符。当调用柯里化后的函数时，如果参数不足，它会返回一个新的函数，直到所有参数都被提供。使用占位符可以在不同的调用中跳过和稍后提供特定的参数。

### <font style="color:rgb(26, 32, 41);">📋</font><font style="color:rgb(26, 32, 41);"> 六、数组与对象操作</font>

#### 1.浅、深拷贝

防止对象的引用共享，保存对象的历史状态，避免对象被意外修改。

浅拷贝可以在以下情况下使用：

* 当对象较大且嵌套层次较深，而只需要复制对象的表面层次时，可以选择浅拷贝。这可以减少内存消耗和复制的时间。
* 当多个对象需要引用相同的属性对象，并且对这些属性对象的修改需要同时反映在所有引用处时，可以使用浅拷贝。
* 当对象之间的共享引用并不会引起问题，并且希望在不同的变量中操作同一对象时，可以使用浅拷贝。这样可以避免创建额外的对象副本，节省内存和处理时间。

```javascript
function shallow(obj) {
  const newObj = {}
  for (const key in obj) {
    newObj[key] = obj[key]
  }
  return newObj
}

#### 1.深拷贝

```javascript
// [原子模型]: 类型判断(基础/引用) -> 递归深挖 -> 闭包记录循环引用
// [逻辑骨架]:
// 1. if(typeof obj !== 'object') return obj;
// 2. if(map.has(obj)) return map.get(obj);
// 3. newObj = Array.isArray(obj) ? [] : {}; map.set(obj, newObj);
// 4. for(key in obj) newObj[key] = deepClone(obj[key], map);
// [通俗讲解]: “原材料克隆”。不只是把货物的标签抄一遍，而是递归进去，把盒子里的零件、零件里的螺丝也全按照原样复制一份，并用记录本(Map)记下复制过的东西防止套路循环。
function deepClone(obj, hash = new WeakMap()) {
  // 基础类型或空，直接返回
  if (obj === null || typeof obj !== 'object') return obj;

  // 处理特殊对象：日期、正则
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);

  // 防环：如果已经克隆过该对象，直接返回记录的结果
  if (hash.has(obj)) return hash.get(obj);

  // 初始化容器
  const newObj = Array.isArray(obj) ? [] : {};
  hash.set(obj, newObj);

  // 递归处理每一个属性
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = deepClone(obj[key], hash);
    }
  }

  return newObj;
}
```

#### 2.flat数组扁平化

```javascript
// [原子模型]: 循环遍历 -> 递归剥开一层数组(depth-1) -> concat 合并
// [逻辑骨架]:
// 1. for(item of arr) {
//      if(isArray(item) && depth > 0) res = res.concat(flat(item, depth-1))
//      else res.push(item)
//    }
// [通俗讲解]: “大箱拆小箱”。收到一个套娃式的包裹，只要发现里面还有小箱子，就拆开把里面的东西倒出来，直到全铺在传送带上。
const flat = (arr, depth = 1) => {
  let res = [] // 必须是 let
  for(let i = 0; i < arr.length; i++) {
    if(Array.isArray(arr[i]) && depth) {
      res = res.concat(flat(arr[i], depth - 1)) // 返回新数组
    } else {
      res.push(arr[i])
    }
  }
  return res
}

// 对象扁平化
function objectFlat(obj = {}) {
  const res = {}
  function flat(item, preKey = '') {
    Object.entries(item).forEach(([key, val]) => {
      const newKey = preKey ? `${preKey}.${key}` : key
      if (val && typeof val === 'object') {
        flat(val, newKey)
      } else {
        res[newKey] = val
      }
    })
  }
  flat(obj)
  return res
}

// 测试
const array=[1,[2,[3,4],2,6],34,6]
const source = { a: { b: { c: 1, d: 2 }, e: 3 }, f: { g: 2 } }
console.log(objectFlat(source));
```

// [原子模型]: 循环遍历(for) -> 执行回调 fn(this[i], i, this) -> push 到新数组或累计结果
// [逻辑骨架]:
// 1. map: res.push(fn(item))
// 2. filter: if(fn(item)) res.push(item)
// 3. reduce: res = fn(res, item)

// Map 实现
Array.prototype.myMap = function(fn) {
  const res = [];
  for (let i = 0; i < this.length; i++) {
    // 只有在元素存在时才执行（跳过空位置）
    if (Object.prototype.hasOwnProperty.call(this, i)) {
      res.push(fn(this[i], i, this));
    }
  }
  return res;
};

// Filter 实现
Array.prototype.myFilter = function(fn) {
  const res = [];
  for (let i = 0; i < this.length; i++) {
    if (Object.prototype.hasOwnProperty.call(this, i)) {
      if (fn(this[i], i, this)) {
        res.push(this[i]);
      }
    }
  }
  return res;
};

// Reduce 实现
Array.prototype.myReduce = function(fn, initialValue) {
  let accumulator = initialValue;
  let startIndex = 0;

  // 如果没有提供初始值，则使用数组第一个元素
  if (arguments.length === 1) {
    if (this.length === 0) {
      throw new TypeError('Reduce of empty array with no initial value');
    }
    accumulator = this[0];
    startIndex = 1;
  }

  for (let i = startIndex; i < this.length; i++) {
    if (Object.prototype.hasOwnProperty.call(this, i)) {
      accumulator = fn(accumulator, this[i], i, this);
    }
  }
  return accumulator;
};
```

#### 6.实现call,apply,bind

```javascript
// [原子模型]: 上下文扩充属性 -> 用 Symbol 避名冲突 -> 隐式绑定执行 (thisArg.fn())
// [逻辑骨架]:
// 1. myCall(thisArg, ...args) {
//      const fn = Symbol(); thisArg[fn] = this;
//      const res = thisArg[fn](...args); delete thisArg[fn]; return res;
//    }
// [通俗讲解]: “临时外派”。我这个技师(函数)，临时去你的地盘(thisArg)干活，在你家的设备上插个优盘(Symbol)运行我的程序，干完拔掉优盘走人。

// 实现 call
Function.prototype.myCall = function(context, ...args) {
  // 处理上下文：null 或 undefined 指向 globalThis(window)
  context = context || window;
  // 包装成对象位，因为要在其上挂载属性
  const target = Object(context);
  const fnKey = Symbol('tempFn');

  // 将当前函数挂载到指定上下文
  target[fnKey] = this;
  const result = target[fnKey](...args);

  // 用完即删
  delete target[fnKey];
  return result;
};

// 实现 apply
Function.prototype.myApply = function(context, argsArray = []) {
  context = context || window;
  const target = Object(context);
  const fnKey = Symbol('tempFn');

  target[fnKey] = this;
  // apply 接受的是参数数组
  const result = target[fnKey](...argsArray);

  delete target[fnKey];
  return result;
};

// 实现 bind
Function.prototype.myBind = function(context, ...args) {
  const self = this;
  return function(...newArgs) {
    // 闭包保存原函数，执行时合并参数
    return self.apply(context, [...args, ...newArgs]);
  };
};
```

### <font style="color:rgb(26, 32, 41);">🌐</font><font style="color:rgb(26, 32, 41);"> 七、浏览器与网络</font>

// [原子模型]: 实例化 XHR -> 设置 open(method, url) -> 监听 onreadystatechange -> 发送 send()
// [通俗讲解]: “发传真”。先买台机器(new XHR)，填好对方地址(open)，盯着显示屏状态(onreadystatechange)，最后按下发送键(send)。
function ajax(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    
    xhr.onreadystatechange = function() {
      // readyState 4 表示请求完成
      if (this.readyState !== 4) return;
      
      if (this.status >= 200 && this.status < 300) {
        resolve(this.response);
      } else {
        reject(new Error(`请求失败: ${this.status} ${this.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('网络连接异常'));
    xhr.send();
  });
}

// ajax('https://api.example.com').then(console.log).catch(console.error);
```

#### 2.二进制转base64（选背）

```javascript
// [原子模型]: 每3个字节(24bit) 为一组 -> 拆为 4个 6bit 索引 -> 查表转换 -> 不足补 '='
// [通俗讲解]: “二进制装箱”。把漫长的 01 串按 24 位一箱打包，每箱拆成 4 个小格(每格6位)，去查 64 字符表。最后如果箱子没装满，就用 '=' 封箱。
function binaryToBase64(binaryStr) {
  const table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let res = "";
  
  // 每 6 位处理一次
  for (let i = 0; i < binaryStr.length; i += 6) {
    let chunk = binaryStr.slice(i, i + 6);
    
    // 如果不足 6 位，右侧补 0
    if (chunk.length < 6) {
      chunk = chunk.padEnd(6, '0');
    }
    
    const index = parseInt(chunk, 2);
    res += table[index];
  }

  // 计算补位 '=' 的个数
  // 原始字节数应该是 8 的倍数。Base64 要求是 24 位的倍数。
  // 这里的二进制逻辑较复杂，面试通常考原理，代码建议记思路。
  const paddingMap = { 8: "==", 16: "=" };
  const originalBitLength = binaryStr.length % 24;
  return res + (paddingMap[originalBitLength] || "");
}
```

#### 3.字符串转base64（选背）

```javascript
function base64encode(text) {
  let base64Code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let res = '';
  let i = 0;
  while (i < text.length) {
    let char1, char2, char3, enc1, enc2, enc3, enc4;
    
    // 三个字符一组，转二进制
    char1 = text.charCodeAt(i++); 
    char2 = text.charCodeAt(i++);
    char3 = text.charCodeAt(i++);

    enc1 = char1 >> 2; // 取第 1 字节的前 6 位
    
    // 三个一组处理
    if (isNaN(char2)) {
      // 只有 1 字节的时候
      enc2 = ((char1 & 3) << 4) | (0 >> 4);
      // 第65个字符用来代替补位的 = 号
      enc3 = enc4 = 64;
    } else if (isNaN(char3)) {
      // 只有 2 字节的时候
      enc2 = ((char1 & 3) << 4) | (char2 >> 4);
      enc3 = ((char2 & 15) << 2) | (0 >> 6);
      enc4 = 64;
    } else {
      enc2 = ((char1 & 3) << 4) | (char2 >> 4); // 取第 1 个字节的后 2 位(3 = 11 << 4 = 110000) + 第 2 个字节的前 4 位
      enc3 = ((char2 & 15) << 2) | (char3 >> 6); // 取第 2 个字节的后 4 位 (15 = 1111 << 2 = 111100) + 第 3 个字节的前 2 位
      enc4 = char3 & 63; // 取最后一个字节的最后 6 位 (63 = 111111)
    }
    
    // 转base64
    res += base64Code.charAt(enc1) + base64Code.charAt(enc2) + base64Code.charAt(enc3) + base64Code.charAt(enc4)
  }

  return res;
}
```

#### 4.模拟实现localstorage（选背）

```javascript
// [原子模型]: Proxy 拦截 get/set -> 映射到内部 Map 存储 -> 维持 localStorage API 特性
// [通俗讲解]: “私人保险柜”。虽然看起来像在给一个普通对象存取属性，其实背后都被代理(Proxy)拦截了，悄悄存进了一个私有的 Map 仓库里。
class LocalArrayStorage {
  constructor() {
    this.store = new Map();
  }

  setItem(key, value) {
    this.store.set(String(key), String(value));
  }

  getItem(key) {
    return this.store.get(String(key)) || null;
  }

  removeItem(key) {
    this.store.delete(String(key));
  }

  clear() {
    this.store.clear();
  }

  get length() {
    return this.store.size;
  }
}

const storageInstance = new LocalArrayStorage();

// 使用 Proxy 模拟原生 localStorage 的属性访问行为
const mockLocalStorage = new Proxy(storageInstance, {
  get(target, prop) {
    // 如果是调用方法 (如 setItem), 直接返回方法
    if (prop in target) {
      return target[prop];
    }
    // 否则作为 key 去获取值
    return target.getItem(prop);
  },
  set(target, prop, value) {
    if (prop in target) {
      target[prop] = value;
    } else {
      target.setItem(prop, value);
    }
    return true;
  }
});

// global.localStorage = mockLocalStorage; // 注册到全局
```

#### 5.实现构造函数，对象中包含构造函数调用次数（选背）

```javascript
const MyConstructor = (function () {
  let count = 0; // 私有变量，记录调用次数

  function InnerConstructor(value) {
    // 检查是否通过 new 调用
    if (!(this instanceof InnerConstructor)) {
      throw new Error("MyConstructor must be called with new.");
    }

    this.value = value; // 公有属性
    count++; // 每次实例化时计数增加
  }

  // 提供访问私有计数的方法
  InnerConstructor.getCount = function () {
    return count;
  };

  return InnerConstructor;
})();

// 测试用例
try {
  const obj1 = new MyConstructor("first");
  console.log(obj1.value); // 输出: first
  console.log(MyConstructor.getCount()); // 输出: 1

  const obj2 = new MyConstructor("second");
  console.log(MyConstructor.getCount()); // 输出: 2

  MyConstructor(); // 抛出错误: MyConstructor must be called with new.
} catch (error) {
  console.error(error.message);
}
```

```javascript
class MyClass {
  static #count = 0; // 静态私有字段，记录调用次数

  constructor(value) {
    // 检查是否通过 new 调用
    if (typeof new.target === "undefined") {
      throw new Error("MyClass must be called with new.");
    }

    this.value = value; // 公有属性
    MyClass.#count++; // 每次实例化时计数增加
  }

  // 提供访问私有计数的方法
  static getCount() {
    return MyClass.#count;
  }
}

// 测试用例
try {
  const obj1 = new MyClass("first");
  console.log(obj1.value); // 输出: first
  console.log(MyClass.getCount()); // 输出: 1

  const obj2 = new MyClass("second");
  console.log(MyClass.getCount()); // 输出: 2

  MyClass(); // 抛出错误: MyClass must be called with new.
} catch (error) {
  console.error(error.message);
}
```

### <font style="color:rgb(26, 32, 41);">🏗</font><font style="color:rgb(26, 32, 41);"> 八、前端框架与设计模式</font>

// [原子模型]: 结构 { 事件名: [回调函数] } -> 存(on) -> 删(off) -> 执行(emit)
// [逻辑骨架]:
// 1. Map 存储事件，键为事件名，值为回调数组。
// 2. emit 遍历执行指定事件下的所有回调。
// [通俗讲解]: “工厂大喇叭”。工厂里设个广播台，有人想听通知就去登记(on)。一旦有事发生了，大喇叭一喊(emit)，所有登记过的人都会收到消息并执行。
class EventEmitter {
  constructor() {
    // 使用 Map 管理事件名和回调列表
    this.events = new Map();
  }

  // 1. 订阅（登记）
  on(name, fn) {
    if (!this.events.has(name)) {
      this.events.set(name, []);
    }
    this.events.get(name).push(fn);
  }

  // 2. 取消订阅（注销）
  off(name, fn) {
    const handlers = this.events.get(name);
    if (!handlers) return;

    // 过滤掉当前要注销的函数
    this.events.set(name, handlers.filter(h => h !== fn));
  }

  // 3. 发布（广播）
  emit(name, ...args) {
    const handlers = this.events.get(name);
    if (!handlers) return;

    // 依次执行
    handlers.forEach(fn => {
      fn.apply(this, args);
    });
  }

  // 4. 一次性订阅
  once(name, fn) {
    const wrapper = (...args) => {
      fn.apply(this, args);
      this.off(name, wrapper); // 执行完立即注销
    };
    this.on(name, wrapper);
  }
}

// 示例
// const bus = new EventEmitter();
// bus.on('work', (task) => console.log('开始干活:', task));
// bus.emit('work', '写代码');
```

#### 2.发布订阅模式升级版（选背）

```javascript
// [原子模型]: 事件配置对象({fn, once, priority}) -> 存储结构调整为 Map + Array -> emit 时排序执行
// [逻辑骨架]:
// 1. on(name, fn, options) { handlers.push({fn, ...options}); handlers.sort((a,b)=>b.priority-a.priority); }
// 2. emit(name) { for(sub of handlers) { sub.fn(); if(sub.once) remove(sub); } }
class AdvancedEventEmitter {
    constructor() {
        // 存储事件及其对应的订阅者信息
        // 结构: { [eventName]: { handlers: Array<{fn: Function, group: string, priority: number, once: boolean}>, groups: Set<string> } }
        this.events = new Map();
    }

    /**
     * 订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} handler - 事件处理函数
     * @param {Object} options - 可选配置项
     * @param {string} options.group - 订阅组名，默认为空字符串
     * @param {number} options.priority - 优先级，数值越大优先级越高，默认为0
     * @returns {Function} 取消订阅的函数
     */
    on(eventName, handler, options = {}) {
        const { group = '', priority = 0 } = options;
        return this._subscribe(eventName, handler, { group, priority, once: false });
    }

    /**
     * 一次性订阅事件（触发一次后自动取消订阅）
     * @param {string} eventName - 事件名称
     * @param {Function} handler - 事件处理函数
     * @param {Object} options - 可选配置项
     * @param {string} options.group - 订阅组名
     * @param {number} options.priority - 优先级
     * @returns {Function} 取消订阅的函数
     */
    once(eventName, handler, options = {}) {
        const { group = '', priority = 0 } = options;
        return this._subscribe(eventName, handler, { group, priority, once: true });
    }

    /**
     * 内部订阅方法
     */
    _subscribe(eventName, handler, { group, priority, once }) {
        if (typeof handler !== 'function') {
            throw new TypeError('Handler must be a function');
        }

        // 获取或初始化该事件的订阅信息
        let eventSubscriptions = this.events.get(eventName);
        if (!eventSubscriptions) {
            eventSubscriptions = {
                handlers: [], // 存储所有处理函数及其配置
                groups: new Set(), // 存储该事件下存在的所有组，便于管理
            };
            this.events.set(eventName, eventSubscriptions);
        }

        // 记录组名
        if (group) {
            eventSubscriptions.groups.add(group);
        }

        // 创建订阅对象并加入列表
        const subscription = { fn: handler, group, priority, once };
        eventSubscriptions.handlers.push(subscription);

        // 根据优先级进行排序，优先级高的先触发（稳定排序）
        eventSubscriptions.handlers.sort((a, b) => b.priority - a.priority);

        // 返回取消订阅的函数
        return () => this.off(eventName, handler, group);
    }

    /**
     * 发布事件
     * @param {string} eventName - 事件名称
     * @param {...any} args - 传递给处理函数的参数
     */
    emit(eventName, ...args) {
        const eventSubscriptions = this.events.get(eventName);
        if (!eventSubscriptions) {
            return false; // 没有该事件的订阅者
        }

        // 遍历处理函数并执行
        // 注意：在遍历过程中可能会遇到once订阅被移除的情况，因此使用for...of并注意索引
        const handlers = eventSubscriptions.handlers;
        for (let i = 0; i < handlers.length; i++) {
            const subscription = handlers[i];
            try {
                // 执行处理函数
                subscription.fn.apply(null, args);

                // 如果是一次性订阅，则移除此订阅
                if (subscription.once) {
                    // 从数组中移除当前项，并调整索引（因为数组发生了变化）
                    handlers.splice(i, 1);
                    i--; // 调整索引，因为当前项已被移除
                    // 如果该订阅属于某个组，检查是否需要清理该组的记录
                    this._cleanupGroupIfNeeded(eventName, subscription.group);
                }
            } catch (error) {
                console.error(`Error occurred in event handler for '${eventName}':`, error);
            }
        }

        // 如果该事件的所有处理函数都被移除了（比如都是once），则清理整个事件
        if (handlers.length === 0) {
            this.events.delete(eventName);
        }
        return true;
    }

    /**
     * 取消订阅
     * @param {string} eventName - 事件名称
     * @param {Function} handler - 要移除的处理函数（可选，若不传则移除整个事件或整个组）
     * @param {string} group - 要移除的组名（可选）
     */
    off(eventName, handler, group = '') {
        const eventSubscriptions = this.events.get(eventName);
        if (!eventSubscriptions) {
            return;
        }

        const handlers = eventSubscriptions.handlers;
        if (!handler && !group) {
            // 移除该事件的所有订阅
            this.events.delete(eventName);
            return;
        }

        // 过滤掉匹配的订阅
        for (let i = handlers.length - 1; i >= 0; i--) {
            const subscription = handlers[i];
            const handlerMatch = handler ? subscription.fn === handler : true;
            const groupMatch = group ? subscription.group === group : true;

            if (handlerMatch && groupMatch) {
                handlers.splice(i, 1); // 移除订阅
                // 如果该订阅属于某个组，检查是否需要清理该组的记录
                this._cleanupGroupIfNeeded(eventName, subscription.group);
            }
        }

        // 清理空事件
        if (handlers.length === 0) {
            this.events.delete(eventName);
        }
    }

    /**
     * 内部方法：检查并清理不再被任何订阅使用的组
     */
    _cleanupGroupIfNeeded(eventName, groupName) {
        if (!groupName) return; // 空组名不需要清理

        const eventSubscriptions = this.events.get(eventName);
        if (!eventSubscriptions) return;

        // 检查是否还有该组的其他订阅
        const hasGroupSubscription = eventSubscriptions.handlers.some(sub => sub.group === groupName);
        if (!hasGroupSubscription) {
            eventSubscriptions.groups.delete(groupName); // 从组集合中移除该组
        }
    }

    /**
     * 获取指定事件的所有订阅组
     * @param {string} eventName - 事件名称
     * @returns {Set<string>} 组名的Set
     */
    getGroups(eventName) {
        const eventSubscriptions = this.events.get(eventName);
        if (!eventSubscriptions) {
            return new Set();
        }
        return new Set(eventSubscriptions.groups); // 返回一个副本
    }

    /**
     * 获取指定事件和组的订阅数量
     * @param {string} eventName - 事件名称
     * @param {string} group - 组名
     * @returns {number} 订阅数量
     */
    getSubscriptionCount(eventName, group = '') {
        const eventSubscriptions = this.events.get(eventName);
        if (!eventSubscriptions) {
            return 0;
        }
        if (!group) {
            return eventSubscriptions.handlers.length;
        }
        return eventSubscriptions.handlers.filter(sub => sub.group === group).length;
    }
}

// 使用示例
const eventBus = new AdvancedEventEmitter();

// 示例1: 基本订阅和发布
const subscription1 = eventBus.on('data', (data) => {
    console.log(`[Default Group] Received data: ${data}`);
}, { priority: 1 }); // 优先级1

eventBus.on('data', (data) => {
    console.log(`[Default Group - Lower Priority] Also received data: ${data}`);
}); // 默认优先级0

eventBus.emit('data', 'Hello World!'); // 会按优先级顺序触发
// 输出:
// [Default Group] Received data: Hello World!
// [Default Group - Lower Priority] Also received data: Hello World!

// 示例2: 一次性订阅
eventBus.once('onceEvent', (msg) => {
    console.log(`This will only fire once: ${msg}`);
}, { priority: 10 }); // 高优先级一次性订阅

eventBus.emit('onceEvent', 'First message'); // 触发并自动移除
eventBus.emit('onceEvent', 'Second message'); // 无输出

// 示例3: 订阅组操作
const handlerA = (msg) => console.log(`[Group A] Msg: ${msg}`);
const handlerB = (msg) => console.log(`[Group A - High Priority] Msg: ${msg}`);
const handlerC = (msg) => console.log(`[Group B] Msg: ${msg}`);

eventBus.on('groupEvent', handlerA, { group: 'groupA' });
eventBus.on('groupEvent', handlerB, { group: 'groupA', priority: 5 }); // groupA 内高优先级
eventBus.on('groupEvent', handlerC, { group: 'groupB' });

console.log('Groups for groupEvent:', [...eventBus.getGroups('groupEvent')]); // ['groupA', 'groupB']
console.log('Count for groupA:', eventBus.getSubscriptionCount('groupEvent', 'groupA')); // 2

eventBus.emit('groupEvent', 'Test Groups'); // 按优先级和组触发
// 输出 (handlerB优先级最高，即使同组):
// [Group A - High Priority] Msg: Test Groups
// [Group A] Msg: Test Groups
// [Group B] Msg: Test Groups

// 取消组"groupA"的所有订阅
eventBus.off('groupEvent', null, 'groupA'); // 传入null表示不指定具体handler
console.log('Count for groupA after off:', eventBus.getSubscriptionCount('groupEvent', 'groupA')); // 0
console.log('Groups for groupEvent after off:', [...eventBus.getGroups('groupEvent')]); // ['groupB']
```

#### 3.观察者模式

```javascript
// [原子模型]: 被观察者(Subject)维护观察者列表 -> 状态改变通知所有观察者执行 update
// [逻辑骨架]:
// 1. Subject { attach(o) { observers.push(o) }; setState(s) { observers.forEach(o => o.update(this)) } }
// 2. Observer { update(subject) { ... } }
// [通俗讲解]: “奶爸奶妈监控”。小宝宝(Subject)是核心，爸爸妈妈(Observer)盯着宝宝。宝宝一哭(setState)，所有盯着的人都会收到通知并跑过来(update)。

class Subject {
  constructor(name) {
    this.name = name;
    this.state = "开心";
    this.observers = []; // 观察者队列
  }

  // 挂载观察者
  attach(observer) {
    this.observers.push(observer);
  }

  // 改变状态并通知
  setState(newState) {
    console.log(`${this.name} 的状态变更为: ${newState}`);
    this.state = newState;
    this.notify();
  }

  notify() {
    this.observers.forEach(o => o.update(this));
  }
}

class Observer {
  constructor(name) {
    this.name = name;
  }

  // 被通知时的行为
  update(subject) {
    console.log(`${this.name} 收到通知，${subject.name} 目前是 ${subject.state} 状态`);
  }
}

// 测试
// const baby = new Subject("宝宝");
// const father = new Observer("爸爸");
// baby.attach(father);
// baby.setState("饿了");
```

#### 4.useState

```javascript
// [原子模型]: 外部数组(states) + 当前指针(cursor) -> 按顺序存取 -> 更新后重置指针并渲染
// [逻辑骨架]:
// 1. const currentCursor = cursor++;
// 2. const setState = (val) => { states[currentCursor] = val; cursor = 0; render(); }
// 3. return [states[currentCursor], setState]
// [通俗讲解]: “工位记录本”。在传送带旁放一排固定的本子(数组)，每个工人(useState调用)每次都按顺序领对应的本子。只要每次工人出场的顺序一样，数据就不会乱。

let states = []; // 存储状态的“大仓库”
let cursor = 0;  // 记录当前操作到第几个状态的“指针”

function myUseState(initialState) {
  const currentCursor = cursor;
  
  // 首次渲染：赋初值
  if (states[currentCursor] === undefined) {
    states[currentCursor] = initialState;
  }

  const setState = (newState) => {
    // 允许传入函数或值
    const nextValue = typeof newState === 'function' 
      ? newState(states[currentCursor]) 
      : newState;
    
    // 更新仓库数据
    states[currentCursor] = nextValue;
    
    // 重要：重置指针，准备下一次渲染的“顺序读取”
    cursor = 0;
    mockRender(); 
  };

  cursor++; // 指针后移，供下一个 useState 使用
  return [states[currentCursor], setState];
}

function mockRender() {
  console.log("--- 开始重新渲染 ---");
  // 在实际环境中，这里会重新执行整个组件函数
}
```

#### <font style="color:rgb(26, 32, 41);"></font>


> 更新: 2025-12-17 16:11:04  
> 原文: <https://www.yuque.com/u56987424/lwyx/satmaf5aohgygt7y>