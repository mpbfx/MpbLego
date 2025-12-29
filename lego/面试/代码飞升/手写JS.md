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
function myNew(fn, ...args) {
  if(Object.prototype.toString.call(fn) !== "[object Function]") {
    return "Error in params"
  }
  const obj = {}
  obj.__proto__ = Object.create(fn.prototype)
  let ret = fn.call(obj, ...args)
  return ret instanceof Object ? ret : obj
}
```

#### 2.instanceof

```javascript
function instanceof(left, right) {
  const prototype = right.prototype
  let proto = Object.getPrototypeOf(left)
  while(true) {
    if(proto === null) return false
    if(proto === prototype) return ture
    proto = Object.getPrototypeOf(proto)
  }
}
```

#### 3.Object.create（选背）

```javascript
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
const parseUrl = (url) => {
  const tmpUrl = url.split("?")[1]
  const resObj = {}
  for(const str of tmpUrl.split("&")) {
    let [key, value] = str.split("=")
    value = decodeURIComponent(value)
    if(resObj.hasOwnProperty(key)) {
      resObj[key] = [].concat(resObj[key], value)
    } else if(value == "undefined") { // !!!
      resObj[key] = true
    } else {
      resObj[key] = value 
    }
  }
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

// * 数组转树  递归求解
//  */
function toTree(list, parId) {
  let len = list.length;
  function loop(parId) {
    let res = [];
    for (let i = 0; i < len; i++) {
      let item = list[i];
      if (item.pid === parId) {
        item.children = loop(item.id);
        res.push(item);
      }
    }
    return res;
  }
  return loop(parId);
}

let result = toTree(arr, "");
console.log(result);
```

#### 2.将数字每千分位用逗号隔开

```javascript
toLocaleString()
const n=123456
const thousandSeparator = function (n) {
  //先转字符串
  n = n.toString();
  let count = 0;
  const arr = [];
  for (let i = n.length - 1; i >= 0; i--) {
    count++;
    if (count < 4) {
      arr.push(n[i]);
    } else {
      arr.push(...[".", n[i]]);
      count = 1;
    }
  }
  return arr.reverse().join("");
};

```

#### <font style="color:rgb(52, 53, 65);">3.洗牌算法</font>

```javascript
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
const getBigInt = (a, b) => {
  a = a + "";
  b = b + "";
  let i = a.length - 1;
  let j = b.length - 1;
  let curry = 0; 
  const res = [];
  while (i >= 0 || j >= 0 || curry !== 0) {
    let left = i >= 0 ? Number(a[i]) : 0;
    let right = j >= 0 ? Number(b[j]) : 0;
    let result = left + right + curry;
    res.push(result % 10);
    curry = Math.floor(result / 10);
    i--;
    j--;
  }
  return res.reverse().join("");
};
```

#### 5.写函数实现，找出当前页面DOM树中出现次数最多的html标签及次数？

```javascript
findMostFrequentTag(); ==> { name: 'div', num: 100 }
function findMostFrequentTag(){
  const obj=new Map()
  document.querySelectorAll('*').foreach(item=>{
    if(obj.has(item.tagName)){
      obj.set(item.tagName,obj.get(item)+1)
    }
    else{
      obj.set(item.tagName,1)
    }
  })
  let max=0
  let tag=null
  for(const [key,value] of obj){
    if(value >max){
      max=value
      tag=key
    }
  }
  return{name:tag,num:max}
}
```

#### 6.比较版本号

```javascript
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
// 修正后
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
let Parent={
  name:'parent',
  getName:function(){
    console.log(this.name)
  },
  arrayList:[1,3,4,21,12,1]
}
const children=object.create(Parent)
```

#### 寄生式继承

```javascript
function createchild(parent){
  let child=object.create(parent);
  chiid.sayhe1lo = function(){
    console.log(he11o');
  };
  return child;
}
let parent={name:parent};
let child=createchild(parent);
child.sayhello();//"he1lo"
```

#### 寄生组合式继承

```javascript
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
Child.prototype=Object.create(Parent.prototype)
Child.prototype.construct=Child
```

#### ES6class

```javascript
class parent{
  constructor(name){
    this.name = name;
  }
  sayname(){
    conso1e.log(this.name);
  }
}
c1ass Chiid extends parent{
  constructor(name,age){
    super(name);
    this.age = age;
  }
  sayAge(){
   console.log(this.age); 
  }
}
letchild = new child('child',10);
chiid.sayname();//"chi1d"
chi1d.sayage()//10
```

### <font style="color:rgb(26, 32, 41);">📦</font><font style="color:rgb(26, 32, 41);">四、异步编程与并发控制</font>

#### <font style="color:rgb(44, 62, 80);">1.异步并发数限制</font>

```javascript
function limit(count, array, iterateFunc) {
  const tasks = []  // 存储所有任务的 Promise 对象
  const doingTasks = []  // 存储正在执行的任务的 Promise 对象
  let i = 0  // 任务数组的索引
  const enqueue = () => {  // 加入任务队列的函数
    if (i === array.length) {  // 如果任务全部加入队列，则返回一个 resolved 状态的 Promise
      return Promise.resolve()
    }
    const task = Promise.resolve().then(() => iterateFunc(array[i++]))  // 使用 Promise.resolve().then 将迭代任务加入微任务队列，避免立即执行
    tasks.push(task)  // 将任务的 Promise 对象加入 tasks 数组中
    // doing 并不是自己调用自己，而是一个表示当前任务完成时的 Promise 对象。
    const doing = task.then(() => doingTasks.splice(doingTasks.indexOf(doing), 1))  // 当任务完成时，从 doingTasks 数组中移出该任务的 Promise 对象
    doingTasks.push(doing)  // 将该任务的完成状态加入 doingTasks 数组中
    const res = doingTasks.length >= count ? Promise.race(doingTasks) : Promise.resolve()  // 判断是否需要等待某个任务完成后再继续添加任务
    return res.then(enqueue)  // 如果还有任务没有开始执行，则继续添加任务
  };
  return enqueue().then(() => Promise.all(tasks))  // 在所有任务执行完成后，使用 Promise.all 返回所有任务的执行结果
}

// test
const timeout = i => new Promise(resolve => setTimeout(() => resolve(i), i))
limit(2, [1000, 1000, 1000, 1000], timeout).then((res) => {
  console.log(res)  // 输出所有任务的执行结果
})
```

#### 2.异步并发限制

```javascript
//模拟接口请求
function getData(src) {
  return new Promise((resolve,reject)=>{
    setTimeout(() => {
      resolve(src)
    }, 1000);
  })
}

/*异步并发限制*/
function limitRequest(limit) {
  this.que = []
  this.limit = limit
  this.count = 0
  //添加任务
  this.push = function(task) {
    this.que.push(task)
    this.run()
  }
  //执行任务
  this.run = function() {
    //1.如果队列非空,并且当前正在运行个数<limit
    if(this.que.length && this.count<this.limit) {
      let task = this.que.shift()
      this.count++
      task.fn(task.src).then(msg=>{
        console.log(msg)
        this.count--
        this.run()
      })
    }
  }
}


//测试使用
let p = new limitRequest(2)//一次性最多执行2个任务
p.push({fn:getData,src:1})
p.push({fn:getData,src:1})
p.push({fn:getData,src:1})
p.push({fn:getData,src:1})
```

#### 3.最多请求3次

```javascript
function retryRequest(requestFunction, maxAttempts, delay) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function makeRequest() {
      attempts++;

      requestFunction()
        .then(resolve)
        .catch((error) => {
          if (attempts < maxAttempts) {
            setTimeout(makeRequest, delay);
          } else {
            reject(error);
          }
        });
    }

    makeRequest();
  });
}

// 示例用法：
const maxAttempts = 3;
const delay = 1000; // 1秒钟
const fakeApiRequest = () => {
  return new Promise((resolve, reject) => {
    // 模拟一个请求，这里可以替换成实际的请求逻辑
    const success = Math.random() < 0.8; // 模拟80%的成功率
    if (success) {
      resolve('请求成功');
    } else {
      reject('请求失败');
    }
  });
};

retryRequest(fakeApiRequest, maxAttempts, delay)
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error('最大重试次数已达到，请求失败：', error);
  });
```

#### 4.promise.all

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const res = []
    let len = promises.length
  	if(!len) resolve(res)
    function fulfill(idx, val) {
      res[idx] = val
      len--
      if(!len) {
        resolve(res)
      } 
    }

    promises.forEach((promise, idx) => {
      Promise.resolve(promise).then((val) => fulfill(idx, val)).catch(e => reject(e))
    })
  })
}

Promise.allSettled = function(promises) {
  return new Promise((resolve) => {
    const results = promises.map((promise) => {
      return promise.then(
        (value) => {
          return { status: 'fulfilled', value };
        },
        (reason) => {
          return { status: 'rejected', reason };
        }
      );
    });

    Promise.all(results).then((settledResults) => {
      resolve(settledResults);
    });
  });
};

const promises = [
  Promise.resolve('First'),
  Promise.reject('Rejected'),
  Promise.resolve('Third')
];

Promise.all(promises)
  .then(results => console.log(results))
  .catch(error => console.error(error));

const promises = [
  Promise.resolve('First'),
  Promise.reject('Rejected'),
  Promise.resolve('Third')
];

Promise.allSettled(promises)
  .then(results => console.log(results))
  .catch(error => console.error(error));
// res
[
  { status: 'fulfilled', value: 'First' },
  { status: 'rejected', reason: 'Rejected' },
  { status: 'fulfilled', value: 'Third' }
]

```

#### 6.Promise手写红绿灯

```javascript
function red(){
  console.log("red");
}
function green(
  console.log("green");
}
function yellow(){
  conso1e.log("ye11ow");
}

const light = function(timer,cb){
  return new promise(resolve=>{
    cb();
    settimeout(()=>{
      resolve()
    },timer);
  });
}
const step = function(){
  promise.resolve().then(()=>{
    return light(3000,red)
      .then(()=>{
        return light(2000,green)
      }.then(()=>{
        return light(1000,yellow)
      }).then(()=>{
        return step()
      })
step();
```

#### 7.定时器hooks（选背）

```javascript
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

#### 8.越来越可怕的异步

```javascript
class Task {
  constructor() {
    this.queue = [];
  }

  sleep(time) {
    const sleepTask = () => {
      return new Promise((resolve) => {
        setTimeout(resolve, time);
      });
    };

    this.queue.push(sleepTask);
    return this;
  }

  async print(value) {
    const printTask = () => {
      return new Promise((resolve) => {
        console.log(value);
        resolve();
      });
    };

    this.queue.push(printTask);

    await this.executeQueue();
    return this;
  }

  async executeQueue() {
    for (const task of this.queue) {
      await task();
    }
    this.queue = [];
  }
}

// 示例用法
async function example() {
  const task = new Task();

  await task.sleep(1000); // 等1s
  await task.print(1);   // 输出1
  await task.sleep(2000); // 等2s
  await task.sleep(3000); // 等3s
  await task.print(2);   // 输出2
  await task.print(3);   // 输出3
  await task.print(4);   // 输出4

  // 之后还可以继续输入指令继续执行
}

example();
```

#### 9.实现sleep

```javascript
function sleep(fn, time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(fn);
        }, time);
    });
}
let saySomething = (name) => console.log(`hello,${name}`)
async function autoPlay() {
    let demo = await sleep(saySomething('TianTian'),1000)
    let demo2 = await sleep(saySomething('李磊'),1000)
    let demo3 = await sleep(saySomething('掘金的好友们'),1000)
}
autoPlay()
```

####

### <font style="color:rgb(26, 32, 41);">🛠</font><font style="color:rgb(26, 32, 41);"> 五、函数式编程技巧</font>

#### 1.防抖

```javascript
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

function deepCopy(obj) {
  if(obj instanceof Date) return new Date(obj)
  if(obj instanceof RegExp) return new RegExp(obj)
  if(obj instanceof Error) return new Error(obj.message)
  if(obj instanceof Function) return funtion(...args) {
    return obj.call(this, ...args)
  }
  if(!obj || typeof obj !== "object") return obj
  const newObj = Array.isArray(obj) ? [] : {}
  for (const key in obj) {
    if(obj.hasOwnProperty(key)){
      if(typeof obj[key] === "object") { // att obj[key]
        newObj[key] = deepCopy(obj[key])
      } else {
        newObj[key] = obj[key]
      }
    }
  }
  return newObj
}
```

#### 2.flat数组扁平化

```javascript
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

#### 3.实现数组 API

```javascript
Array.prototype.map = function(fn) {
  const res = []
  for(let i = 0; i < this.length; i++) {
    res.push(fn(this[i], i, this)) 
  }
  return res
}

Array.prototype.filter = function(fn) {
  const res = []
  for(let i = 0; i < this.length; i++) {
    if(fn(this[i], i, this)) {
      res.push(this[i])
    }
  }
  return res
}

Array.prototype.reduce = function(fn, initValue) {
  let res, start = 0
  if(arguments.length !== 1) {
    res = initValue
  } else {
    res = this[0]
    start = 1
  }
  for(let i = start; i < this.length; i++) {
    res = fn(res, this[i], i, this)
  }
  return res
}
```

#### 6.实现call,apply,bind

```javascript
// 实现call
Function.prototype.mycall = function () {
    let [thisArg, ...args] = [...arguments]   
    thisArg = Object(thisArg) || window
    let fn = Symbol()
    thisArg[fn] = this
    let result = thisArg[fn](...args)
    delete thisArg[fn]
    return result
}
// 实现apply
Function.prototype.myapply = function () {
    let [thisArg, args] = [...arguments];  
    thisArg = Object(thisArg)
    let fn = Symbol()
    thisArg[fn] = this;
    let result = thisArg[fn](...args);
    delete thisArg.fn;
    return result;
}

// 实现bind
Function.prototype.mybind = function(context, ...args){
    return (...newArgs) => {
        return this.call(context,...args, ...newArgs)
    }
}
```

### <font style="color:rgb(26, 32, 41);">🌐</font><font style="color:rgb(26, 32, 41);"> 七、浏览器与网络</font>

#### 1.Ajax

```javascript
const xhr = new XMLHttpRequest();
xhr.open("GET", url, true);
xhr.onreadystatechange = function () {
  if (this.readyState !== 4) return;
  if (this.status === 200) {
    console.log(this.response);
  } else {
    throw new Error(xhr.statusText);
  }
};
xhr.send();
```

#### 2.二进制转base64（选背）

```javascript
// 将二进制数据每 6bit 位替换成一个 base64 字符
function binaryTobase64(code) {
  let base64Code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let res = '';
  // 1 bytes = 8bit，6bit 位替换成一个 base64 字符
  // 所以每 3 bytes 的数据，能成功替换成 4 个 base64 字符
    
  // 对不足 24 bit (也就是 3 bytes) 的情况进行特殊处理
  if (code.length % 24 === 8) {
    code += '0000';
    res += '=='
  }
  if (code.length % 24 === 16) {
    code += '00';
    res += '='
  }

  let encode = '';
  // code 按 6bit 一组，转换为
  for (let i = 0; i < code.length; i += 6) {
    let item = code.slice(i, i + 6);
    encode += base64Code[parseInt(item, 2)];
  }
  return encode + res;
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
'use strict'
const valuesMap = new Map()

class LocalStorage {
  getItem (key) {
    const stringKey = String(key)
    if (valuesMap.has(key)) {
      return String(valuesMap.get(stringKey))
    }
    return null
  }

  setItem (key, val) {
    valuesMap.set(String(key), String(val))
  }

  removeItem (key) {
    valuesMap.delete(key)
  }

  clear () {
    valuesMap.clear()
  }

  key (i) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to execute 'key' on 'Storage': 1 argument required, but only 0 present.") // this is a TypeError implemented on Chrome, Firefox throws Not enough arguments to Storage.key.
    }
    let arr = Array.from(valuesMap.keys())
    return arr[i]
  }

  get length () {
    return valuesMap.size
  }
}
const instance = new LocalStorage()

global.localStorage = new Proxy(instance, {
  set: function (obj, prop, value) {
    if (LocalStorage.prototype.hasOwnProperty(prop)) {
      instance[prop] = value
    } else {
      instance.setItem(prop, value)
    }
    return true
  },
  get: function (target, name) {
    if (LocalStorage.prototype.hasOwnProperty(name)) {
      return instance[name]
    }
    if (valuesMap.has(name)) {
      return instance.getItem(name)
    }
  }
})
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

#### 1.发布订阅模式

```javascript
class EventEmitter {
  constructor() {
    this.arrayList = {}
  }
  on(name, fn) {
    if(this.arrayList[name] && !this.arrayList[name].include(fn)) {
      this.arrayList[name].push(fn)
    } else {
      this.arrayList[name] = [fn]
    }
  }
  off(name, fn) {
    if(this.arrayList[name]) {
      let idx = this.arrayList[name].indexOf(name)
      this.arrayList[name].splice(idx, 1)
    }
  }
  emit(name, ...args) {
    if(this.arrayList[name]) {
      let task = [...arrayList[name]]
      for(const fn of task) {
        fn.call(this, ...args)
      }
    }
  }
}
```

#### 2.发布订阅模式升级版（选背）

```javascript
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
class Subject {  // 被观察者：小宝宝
  constructor(name)  {
    this.name = name;
    this.state = "开心的";
    this.observer = [];
  }

  attach(o) {
    this.observer.push(o);
  }

  setState(newState) {
    this.state = newState;
    this.observer.forEach(o => o.update(this));
  }

}

class Observer { // 观察者：爸爸 妈妈
  constructor(name) {
    this.name = name;
  }

  update(baby) {
    console.log("当前"+this.name+"被通知了，当前小宝宝的状态是："+baby.state);
  }
}

// 爸爸妈妈需要观察小宝宝的心理变化
let baby = new Subject("小宝宝");
let father = new Observer("爸爸");
let mother = new Observer("妈妈");

baby.attach(father);
baby.attach(mother);
baby.setState("我饿了");
```

#### 4.useState

```javascript
let stateQueue = [];
let currentIndex = 0;
// 模拟 useState 实现
function useState(initialState) {
  // 记录当前索引（对应第几个 useState 调用）
  const index = currentIndex++;
  // 如果是首次渲染或状态队列中该位置未初始化，就用初始值
  if (!stateQueue[index]) {
    stateQueue[index] = initialState;
  }
  // 生成更新状态的函数，更新后触发重新渲染
  const setState = (newState) => {
    if(typeof newState === 'function'){
      stateQueue[index] = newState(stateQueue[index]);
    }else{
      stateQueue[index] = newState;
    }
    currentIndex = 0;
    // 重新渲染组件（调用 render 函数）
    render();
  };
  return [stateQueue[index], setState];
}
```

#### <font style="color:rgb(26, 32, 41);"></font>


> 更新: 2025-12-17 16:11:04  
> 原文: <https://www.yuque.com/u56987424/lwyx/satmaf5aohgygt7y>