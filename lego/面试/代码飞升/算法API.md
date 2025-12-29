# 算法API

### 数组操作 API（高频使用） 
#### 遍历方法 
```javascript
const arr = [1,2,3,4,5,6,7,8,9,10]

// 1. forEach - 遍历（无返回值）
arr.forEach((item, index, array) => {})

// 2. map - 映射新数组
const newArr = arr.map((item, index) => item * 2)

// 3. filter - 过滤
const filtered = arr.filter(item => item > 5)

// 4. reduce - 累计
const sum = arr.reduce((acc, cur) => acc + cur, 0)

// 5. some - 至少一个满足
const hasEven = arr.some(item => item % 2 === 0)

// 6. every - 所有都满足
const allPositive = arr.every(item => item > 0)
```

#### 增删改查 
```javascript
// 增删
arr.push(1)         // 末尾添加
arr.pop()           // 末尾删除
arr.unshift(1)      // 开头添加
arr.shift()         // 开头删除
arr.splice(1, 2)    // 删除索引1开始的2个元素

// 查找
arr.includes(3)     // 是否包含
arr.indexOf(3)      // 第一个索引
arr.lastIndexOf(3)  // 最后一个索引
arr.find(item => item > 5)  // 查找第一个符合条件的
arr.findIndex(item => item > 5) // 查找第一个符合条件的索引
```

#### 数组操作
```javascript
// 排序
arr.sort((a, b) => a - b)  // 升序
arr.sort((a, b) => b - a)  // 降序

// 切片
arr.slice(1, 4)    // 截取[1,4)
arr.concat([4,5])  // 连接数组

// 扁平化
arr.flat(2)        // 扁平化2层
arr.flatMap(x => [x, x*2])

// 填充
arr.fill(0, 2, 5)  // 用0填充[2,5)
```

#### Es6新特性（数组）
```javascript
const arr = [1, 2, 3, 4, 5]

// findLast / findLastIndex (ES2023)
arr.findLast(x => x % 2 === 0)     // 从后往前找：4
arr.findLastIndex(x => x % 2 === 0) // 索引：3

// at() 方法 (ES2022)
arr.at(-1)          // 5（最后一个，等同 arr[arr.length-1]）
arr.at(-2)          // 4

// flatMap (ES2019)
arr.flatMap(x => [x, x*2]) // [1,2,2,4,3,6,4,8,5,10]

// with() 方法 (ES2023) - 不可变更新
const newArr = arr.with(2, 99) // [1,2,99,4,5] 不改变原数组
```



### 字符串操作 API
#### 基本操作
```javascript
// 遍历
for (let char of str) {}
Array.from(str)  // 转为数组
[...str]         // 扩展运算符

// 查找
str.indexOf('a')      // 首次出现位置
str.lastIndexOf('a')  // 最后出现位置
str.includes('ab')    // 是否包含
str.startsWith('he')  // 是否以...开头
str.endsWith('ld')    // 是否以...结尾
```

#### 截取分割
```javascript
str.slice(1, 4)       // 截取[1,4)
str.substring(1, 4)   // 截取[1,4)（参数为负时转0）
str.substr(1, 3)      // 从1开始截取3个

// 分割
str.split(',')        // 按逗号分割
str.split('')         // 分割为字符数组
```

#### 修改转换
```javascript
str.toLowerCase()     // 转小写
str.toUpperCase()     // 转大写
str.trim()           // 去两端空格
str.replace('a', 'b') // 替换
str.repeat(3)        // 重复3次
```

#### 字符串新方法
```javascript
const str = "hello world"

// padStart / padEnd
'5'.padStart(3, '0')    // "005"
'5'.padEnd(3, '0')      // "500"

// repeat
'na'.repeat(3)          // "nanana"

// matchAll (ES2020)
const regex = /\\w+/g
const matches = [...str.matchAll(regex)]

// replaceAll (ES2021)
'a-b-c'.replaceAll('-', '_') // "a_b_c"
```

### 数学运算 API
#### 常用数学函数
```javascript
Math.abs(-5)         // 绝对值
Math.max(1, 2, 3)    // 最大值
Math.min(1, 2, 3)    // 最小值
Math.pow(2, 3)       // 2的3次方
Math.sqrt(16)        // 平方根
Math.round(3.6)      // 四舍五入
Math.floor(3.6)      // 向下取整
Math.ceil(3.2)       // 向上取整
Math.random()        // [0,1)随机数
```

#### 数值转换
```javascript
parseInt('123')      // 123
parseFloat('3.14')   // 3.14
Number('123')        // 123
num.toFixed(2)       // 保留两位小数
num.toString(2)      // 转为2进制字符串
```



#### 数学常量和方法
```javascript
// 数学常量
Math.PI                 // π
Math.E                  // 自然对数底数e

// ES6 新增数学方法
Math.trunc(3.14)        // 3（取整）
Math.sign(-5)           // -1（符号函数）
Math.cbrt(8)            // 2（立方根）
Math.hypot(3, 4)        // 5（欧几里得距离）

// 数值分隔符 (ES2021)
1_000_000               // 1000000（可读性更好）
```

### 集合数据结构 API
#### Set（集合）
```javascript
const set = new Set([1, 2, 3])

// 增删查
set.add(4)           // 添加
set.delete(1)        // 删除
set.has(2)           // 是否存在
set.clear()          // 清空
set.size             // 大小

// 遍历
for (let item of set) {}
set.forEach(item => {})

// 转换
Array.from(set)      // 转数组
[...set]             // 转数组

const setA = new Set([1, 2, 3])
const setB = new Set([2, 3, 4])

// 并集
new Set([...setA, ...setB])         // {1,2,3,4}

// 交集
new Set([...setA].filter(x => setB.has(x))) // {2,3}

// 差集 (A - B)
new Set([...setA].filter(x => !setB.has(x))) // {1}

// 对称差集
new Set([...setA, ...setB].filter(x => 
    !setA.has(x) || !setB.has(x)
)) // {1,4}
```

#### Map（映射）
```javascript
const map = new Map()

// 增删改查
map.set('key', 'value')
map.get('key')
map.has('key')
map.delete('key')
map.clear()
map.size

// 遍历
for (let [key, value] of map) {}
map.forEach((value, key) => {})

const map = new Map([['a', 1], ['b', 2], ['c', 3]])

// 键值对转数组
map.entries()        // [['a',1], ['b',2], ['c',3]]
Array.from(map)      // 同上
[...map]             // 同上，最常用

// 键转数组
map.keys()           // ['a', 'b', 'c']
Array.from(map.keys()) // ['a', 'b', 'c']
[...map.keys()]      // ['a', 'b', 'c']

// 值转数组  
map.values()          // [1, 2, 3]
Array.from(map.values()) // [1, 2, 3]
[...map.values()]     // [1, 2, 3]

// Map 转对象
Object.fromEntries(map) // {a: 1, b: 2, c: 3}
```

#### Object静态方法
```javascript
Object 静态方法
const obj = {a: 1, b: 2, c: 3}

// 键值对操作
Object.entries(obj)      // [['a',1], ['b',2], ['c',3]]
Object.fromEntries([['a',1], ['b',2]]) // {a:1, b:2}

// 值操作
Object.values(obj)      // [1, 2, 3]
Object.keys(obj)        // ['a', 'b', 'c']

// 属性描述符
Object.getOwnPropertyDescriptors(obj)
Object.defineProperty(obj, 'newProp', {value: 4})
```

### 位运算技巧
#### 基本位运算
```javascript
n & 1         // 判断奇偶
n & (n-1)     // 消除最低位的1
n & -n        // 获取最低位的1
n | (1 << k)  // 将第k位设为1
n & ~(1 << k) // 将第k位设为0
n ^ (1 << k)  // 将第k位取反
```

#### 实用技巧
```javascript
// 判断2的幂
(n & (n-1)) === 0

// 统计1的个数
function countBits(n) {
    let count = 0
    while (n) {
        n &= n - 1
        count++
    }
    return count
}
```



### ES6+ 新特性
#### 解构赋值
```javascript
// 数组解构
const [first, second] = [1, 2]
const [head, ...rest] = [1, 2, 3, 4]

// 对象解构
const { name, age } = { name: 'Tom', age: 20 }
const { name: newName } = { name: 'Tom' }  // 重命名
```

#### 扩展运算符
```javascript
// 数组
const newArr = [...arr1, ...arr2]
const copy = [...arr]

// 对象
const newObj = { ...obj1, ...obj2 }
```

#### 箭头函数
```javascript
const add = (a, b) => a + b
const square = n => n * n
const getObj = () => ({ value: 1 })
```

#### 新特性（更详细可见js篇）
```javascript
// 可选链 ?. (ES2020)
obj?.prop?.subProp
arr?.[0]
func?.()

// 空值合并 ?? (ES2020)
const value = input ?? 'default'  // 只有null/undefined时用默认值

// 逻辑或赋值 ||=, 逻辑与赋值 &&= (ES2021)
a ||= b  // a = a || b
a &&= b  // a = a && b
```

### 


> 更新: 2025-12-14 03:10:24  
> 原文: <https://www.yuque.com/u56987424/lwyx/fdy1cp6bf34sz1kp>