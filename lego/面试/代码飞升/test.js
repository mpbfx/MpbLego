// url 解析
var praseUrl = (url) => {
    if (!url.include('?')) return {};
    const queryString = url.split('?')[1];
    const resObj = {};
    queryString.split('&').forEach(str => {
        let [key, value] = str.split('=');
        if (!key) return;
        value = value !== undefined ? decodeURIComponent(value) : true;
        if (resObj.hasOwnProperty(key)) {
            resObj[key] = [].concat(resObj[key], value);
        } else {
            resObj[key] = value;
        }
    })
    return resObj;
}

// 数组转树
var toTree = (list) => {
    let map = {};
    let result = {};
    list.forEach(item => {
        map[item.id] = { ...item, children: [] };
    })
    list.forEach(item => {
        let node = map[item.id];
        if (item.pid) {
            if (map[item.pid]) item.children.push(node);
        } else {
            result.push(node);
        }
    })
    return result;
}

// 洗牌算法
var shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 最频繁标签统计
var findMostFrequentTag = () => {
    const counts = new Map();
    let maxCount = 0;
    let maxTag = '';

    const allElements = document.querySelectorAll('*');
    if (allElements.length === 0) return { name: null, num: 0 };

    allElements.forEach(el => {
        const tagName = el.tagName.toLowerCase();
        const count = (counts.get(tagName) || 0) + 1;
        counts.set(tagName, count);

        if (count > maxCount) {
            maxCount = count;
            maxTag = tagName;
        }
    });
    return { name: maxTag, num: maxCount };
}

// 异步并发数限制
function limit(count, array, iterateFunc) {
    const tasks = [];
    const doingTasks = [];
    let i = 0;

    const enqueue = () => {
        if (i === array.length) {
            return Promise.resolve();
        }

        const task = Promise.resolve().then(() => iterateFunc(array[i++]));
        tasks.push(task);

        const doing = task.then(() =>
            doingTasks.splice(doingTasks.indexOf(doing), 1)
        );
        doingTasks.push(doing);

        const res = doingTasks.length >= count ? Promise.race(doingTasks) : Promise.resolve();
        return res.then(enqueue);
    }

    return enqueue().then(() => Promise.all(tasks));
}

// 异步并发数限制1
class AsyncPool {
    constructor(limit) {
        this.limit = limit;
        this.count = 0;
        this.queue = [];
    }

    add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.run();
        })
    }

    run() {
        while (this.count < this.limit && this.queue.length) {
            const { task, resolve, reject } = this.queue.shift();
            this.count++;

            task()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    this.count--;
                    this.run();
                })
        }
    }
}

// 最多请求3次
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
                })
        }
        makeRequest();
    })
}
// promise.all
function promiseAll(promises) {
    if (!isArray(promises)) {
        return reject(new TypeError('arguments must be an array'));
    }

    const res = [];
    let count = 0;
    const len = promises.length;
    if (len === 0) return resolve(res);

    promises.forEach((promise, idx) => {
        Promise.resolve(promise).then(
            (val) => {
                res[idx] = val;
                count++;
                if (count === len) resolve(res);
            },
            (err) => reject(err));
    })
}

function promiseAllSettled(promises) {
    return new Promise((resolve) => {
        const res = [];
        let count = 0;
        const len = promises.length;
        if (len === 0) return resolve(res);

        promises.forEach((promise, idx) => {
            Promise.resolve(promise).then(
                (value) => {
                    res[idx] = { status: 'fulfilled', value };
                    count++;
                    if (count === len) resolve(res);
                },
                (reason) => {
                    res[idx] = { status: 'rejected', reason };
                    count++;
                    if (count === len) resolve(res);
                }
            )
        })
    })
}

const light = (timer, cb) => {
    return new Promise(resolve => {
        cb();
        setTimeout(resolve, timer);
    })
}

const step = () => {
    Promise.resolve()
        .then(() => light(3000), red)
        .then(() => light(2000, green))
        .then(() => light(1000, yellow))
        .then(step);
}

step();

// 自定义定时器hook
const useTimer = (initialSeconds) => {
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        let intervalId;

        const tick = () => {
            setSeconds((prevseconds) => prevseconds - 1);
        }

        if(seconds > 0){
            intervalId = setInterval(tick, 1000);
        }

        return () => {
            clearInterval(intervalId);
        }
    }, [seconds]);

    const resetTimer = (newSeconds) => {
        setSeconds(newSeconds);
    }

    return { seconds, resetTimer };
}

// vue版本
import { ref, watch, onUnmounted} from 'vue';

const useTimer1 = (initialSeconds) => {
    const seconds = ref(initialSeconds);
    let intervalId = null;

    const clearTimer = () => {
        if(intervalId !== null){
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    const startTimer = () => {
        clearTimer();
        if (seconds.value > 0){
            intervalId = setInterval(() => {
                seconds.value--;
                if(seconds.value <= 0){
                    clearTimer();
                }
            }, 1000);
        }
    }

    watch(seconds, (newVal) => {
        if(newVal > 0 && intervalId === null){
            startTimer();
        }
    })

    startTimer();

    onUnmounted(() => {
        clearTimer();
    })

    const resetTimer = (newSeconds) => {
        seconds.value = newSeconds;
        startTimer();
    }

    return { seconds, resetTimer };
}

export default useTimer1;

// sleep
function sleep(fn, time, ...args){
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(fn(...args));
        }, time);
    })
}

let saySomething = (name) => console.log(`hello, ${name}`);
async function autoPlay(){
    await sleep(saySomething, 1000, 'TianTian');
}


function toTree1(list){
    let map = [];
    let res = [];
    list.forEach(item => {
        map[item.id] = { ...item, children: [] };
    })
    list.forEach(item => {
        const node = map[item.id];
        if(item.pid){
            if(map[item.pid]){
                map[item.pid].children.push(node);
            }
        }else{
            res.push(node);
        }
    })
}

class AsyncPool{
    constructor(limit){
        this.limit = limit;
        this.count = 0;
        this.queue = [];
    }

    add(task){
        return new Promise((resolve, reject) => {
            this.queue.push({task, resolve, reject});
            this.run();
        })
    }

    run() {
        while(this.count < this.limit && this.queue.length){
            const { task, resolve, reject } = this.queue.shift();
            this.count++;

            task()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    this.count--;
                    this.run();
                })
        }
    }
}

Array.prototype.map = function(fn){
    let res = [];
    for(let i = 0; i < arr.length; i++){
        res.push(fn(this[i], i, this));
    }
    return res;
}

Array.prototype.filter = function(fn){
    let res = [];
    for(let i = 0; i < arr.length; i++){
        if(fn(this[i], i, this)){
            res.push(this[i]);
        }
    }
}

Array.prototype.reduce = function(fn, initValue){
    let res, start = 0;
    if(arguments.length !== 1){
        res = initValue;
    }else{
        start = 1;
        res = this[0];
    }
    for(let i = start; i < this.length; i++){
        res = fn(res, this[i], i, this);
    }
    return res;
}

function deepcopy(obj){
    if(!obj || typeof obj !== 'object'){
        return;
    }
    let newObj = Array.isArray(obj) ? [] : {};
    for(let key in obj){
        if(obj.hasOwnProperty(key)){
            newObj[key] = typeof object[key] === 'object' ? deepcopy(obj[key]) : obj[key];
        }
    }
    return newObj;
}

Function.prototype.myCall = function(context, ...args) {
    if (typeof this !== 'function') throw new TypeError('Not a function');
    context = context || window;
    const fnKey = Symbol('fn'); // 使用 Symbol 避免属性冲突
    context[fnKey] = this;
    const result = context[fnKey](...args);
    delete context[fnKey];
    return result;
}

Function.prototype.myApply = function(context, args = []) {
    if (typeof this !== 'function') throw new TypeError('Not a function');
    context = context || window;
    const fnKey = Symbol('fn');
    context[fnKey] = this;
    const result = context[fnKey](...args);
    delete context[fnKey];
    return result;
}

Function.prototype.myBind = function(context, ...args) {
    if (typeof this !== 'function') throw new TypeError('Not a function');
    const fn = this;
    return function F(...innerArgs) {
        const allArgs = [...args, ...innerArgs];
        if (this instanceof F) {
            return new fn(...allArgs);
        }
        return fn.apply(context, allArgs);
    };
}

// 简要验证
const obj = { name: 'Antigravity' };
function sayHi(age) {
    console.log(`Hi, I am ${this.name}, age ${age}`);
    return 'Done';
}

console.log('--- myCall Test ---');
sayHi.myCall(obj, 18);

console.log('--- myBind Test ---');
const bound = sayHi.myBind(obj);
bound(20);


Function.prototype.myCall1 = function(context, ...args){
    if(typeof this !== 'function') throw new TypeError('not a function');
    context = context || window;
    let fnkey = Symbol('fn');
    context[fnkey] = this;
    const result = context[fnkey](...args);
    return result;
}

Function.prototype.myApply1 = function(context, args = []){
    if(typeof this !== 'function') throw new TypeError('not a function');
    context = context || window;
    let fnkey = Symbol('fn');
    context[fnkey] = this;
    const result = context[fnkey](...args);
    return result;
}

Function.prototype.myBind = function(context, ...args){
    return (...newArgs) => {
        return this.call(context, ...args, ...newArgs);
    }
}

Function.prototype.myBind = function(context, ...args){
    return (...newArgs) => {
        return this.call(context, ...args, ...newArgs);
    }
}

Function.prototype.myCall = function(context, ...args){
    if(typeof this !== 'function') return new TypeError('not a function');
    context = context || window;
    const fnkey = Symbol('fn');
    context[fnkey] = this;
    const res = context[fnkey](...args);
    delete context[fnkey];
    return res;
}

Function.prototype.myBind = function(context, ...args){
    return (...newArgs) => {
        return this.call(context, ...args, ...newArgs);
    }
}

function flatten(arr, depth = 1){
    let res = [];
    for(let i = 0; i < arr.length; i++){
        if(Array.isArray(arr) && depth){
            res = res.concat(flat(arr[i]), depth - 1);
        }else{
            res.push(arr[i]);
        }
    }
    return res;
}

function objectFlat(obj = {}){
    const res = {};
    function flat(item, preKey = ''){
        Object.entries(item).forEach(([key, val]) => {
            const newKey = preKey ? `${preKey}.${key}` : key;
            if(val && typeof val === 'object'){
                flat(val, newKey);
            }else{
                res[newKey] = val;
            }
        })
    }
    flat(obj);
    return res;
}

function objectFlat(obj = {}){
    const res = {};
    function flat(item, preKey = ''){
        Object.entries(item).forEach(([key, val]) => {
            const newKey = preKey ? `${preKey}.${key}` : key;
            if(val && typeof val === 'object'){
                flat(val, newKey);
            }else{
                res[newKey] = val;
            }
        })
    }
    flat(obj);
    return res;
}

function objectFlat(obj = {}){
    const res = {};
    function flat(item, preKey = ''){
        Object.entries(item).forEach(([key, val]) => {
            const newKey = preKey ? `${preKey}.${key}` : key;
            if(val && typeof val === 'object'){
                flat(val, newKey);
            }else{
                res[newKey] = val;
            }
        })
    }
    flat(obj);
    return res;
}

function objectFlat(obj = {}){
    let res = {};
    function flat(item, preKey = ''){
        Object.entries(item).forEach(([key, val]) => {
            const newKey = preKey ? `${preKey}.${key}` : key;
            if(val && typeof val === 'object'){
                flat(val, newKey);
            }else{
                res[newKey] = val;
            }
        })
    }
    flat(obj);
    return res;
}


const xhr = new XMLHttpRequest();
xhr.open('GET', url, true);
xhr.onreadystatechange = function(){
    if(this.readyState !== 4) return;
    if(this.status === 200){
        console.log(this.response);
    }else{
        throw new Error(xhr.statusText);
    }
}
xhr.send();

fetch(url)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function(){
    if(this.readyState !== 4) return;
    if(this.status === 200){
        console.log(this.response);
    }else{
        throw new Error(xhr.statusText);
    }
  }
  xhr.send();

  fetch(url)
    .then(res => res.join())
    .then(data => console.log(data))
    .catch(err => console.error(err));

class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(name, fn){
        if(this.events[name]){
            if(!this.events[name].includes(fn)){
                this.events[name].push(fn);
            }
        }else{
            this.events[name] = [fn];
        }
    }

    off(name, fn){
        if(this.events[name]){
            let idx = this.events[name].indexOf(fn);
            if(idx !== -1){
                this.events[name].splice(idx, 1);
            }
        }
    }

    emit(name, ...args){
        if(this.events[name]){
            let tasks = [...this.events[name]];
            for(const fn of tasks){
                fn.call(this, ...args);
            }
        }
    }
}

class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(name, fn){
        if(this.events[name]){
            if(!this.events[name].includes(fn)){
                this.events[name].push(fn);
            }
        }else{
            this.events[name] = [fn];
        }
    }

    off(name, fn){
        if(this.events[name]){
            let idx = this.events[name].indexOf(fn);
            if(idx !== -1){
                this.events[name].splice(idx, 1);
            }
        }
    }

    emit(name, ...args){
        if(this.events[name]){
            let tasks = [...this.events[name]];
            for(const fn of tasks){
                fn.call(this, ...args);
            }
        }
    }
}

class EventEmitter1 {
    constructor() {
        this.events = {};
    }

    on(name, fn){
        if(this.events[name]){
            if(!this.events[name].includes(fn)){
                this.events[name].push(fn);
            }
        }else{
            this.events[name] = [fn];
        }
    }

    off(name, fn){
        if(this.events[name]){
            let idx = this.events[name].indexOf(fn);
            if(idx !== -1){
                this.events[name].splice(idx);
            }
        }
    }

    emit(name, ...args){
        if(this.events[name]){
            let tasks = [...this.events[name]];
            for(const fn of tasks){
                fn.call(this, ...args);
            }
        }
    }
}

function compareVersion(v1, v2){
    let list1 = v1.split('.').map(Number);
    let list2 = v2.split('.').map(Number);
    const maxLength = Math.max(list1.length, list2.length);
    for(let i = 0; i < maxLength; i++){
        const num1 = list1[i] || 0;
        const num2 = list2[i] || 0;

        if(num1 > num2) return 1;
        if(num1 < num2) return -1;
    }
    return 0;
}

Function.prototype.call = function(context, ...args){
    if(typeof this !== 'function') throw new TypeError('error');
    context = context || window;
    let fnkey = Symbol('fn');
    context[fnkey] = this;
    let res = context[key](...args);
    delete context[fnkey];
    return res;
}

Function.prototype.bind = function(context, ...args){
    return (...newArgs) => {
        return this.call(context, ...args, ...newArgs);
    }
}

class Subject{
    constructor(name){
        this.name = name;
        this.status = 'on';
        this.observer = [];
    }

    attach(object){
        this.observer.push(object);
    }

    setState(newState){
        this.state = newState; 
        this.observer.forEach(o => o.fn);
    }
}

class Observer{
    constructor(name){
        this.name = name;
    }

    update(subject){
        return this.name + subject.state; 
    }
}

class EventEmitter{
    constructor(){
        this.events = {};
    }

    on(name, fn){
        if(this.events[name]){
            if(!this.events[name].includes(fn)){
                this.events[name].push(fn);
            }
        }else{
            this.events[name] = [fn];
        }
    }

    off(name, fn){
        if(this.events[name]){
            let idx = this.events[name].indexOf(fn);
            if(idx !== -1){
                this.events[name].splice(idx, 1);
            }
        }
    }

    emit(name, ...args){
        if(this.events[name]){
            let tasks = [...this.events[name]];
            for(const fn of tasks){
                fn.call(this, ...args);
            }
        }
    }
}

let xhr = new XMLHttpRequest();
xhr.open('Get', url, true);
xhr.onreadystatechange = function(){
    if(this.readyState !== 4) return;
    if(this.status === 200){
        console.log(this.response);
    }else{
        throw new Error(xhr.statusText);
    }
}
xhr.send();

fetch(url).then(res => res.json).then(data => console.log(data)).catch(error => console.error(error));

function throttle(fn, delay){
    let lastTime = 0;

    return function(...args){
        let nowTime = new Date().getTime();
        if(nowTime - lastTime > delay){
            fn(...args);
            lastTime = nowTime;
        }
    }
}

function debounce(fn, delay){
    let timer = null;
    return function(...args){
        if(timer){
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn(...args);
        },delay);
    }
}

function bigAdd(a, b){
    a = a + '';
    b = b + '';
    let i = a.length - 1;
    let j = b.length - 1;
    let carry = 0;
    const res = [];

    while(i >= 0 && j >= 0 && carry !== 0){
        let left = i >= 0 ? Number(a[i]) : 0;
        let right = j >= 0 ? Number(b[j]) : 0;
        let result = left + right + carry;
        res.push(result % 10);
        carry = Math.floor(result / 10);
        i--;
        j--;
    }

    return res.reverse().join('');
}

function shuffle(arr){
    for(let i = arr.length - 1; i > 0; i--){
        let j = Math.floor(Math.random * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function findMostFrequentTag1(){
    const counts = new Map();
    let maxCount = 0;
    let maxTag = '';

    const allElements = document.querySelectorAll('*');
    if(allElements.length === 0) return {name: null, num: 0};

    allElements.forEach(el => {
        const tagName = el.tagName.toLowerCase();
        const count = (counts[tagName] || 0) + 1;
        counts.set(tagName, count);

        if(count > maxCount){
            maxCount = count;
            maxTag = tagName;
        }
    })

    return {name: maxTag, num: maxCount}
}

function toTree(arr){
    const map = new Map();
    const res = [];
    arr.forEach(item => {
        map[item.id] = {...item, children: []}
    })

    arr.forEach(item => {
        const node = map[item.id];
        if(item.pid){
            if(map[item.pid]){
                map[item.pid].children.push(node);
            }
        }else{
            res.push(node);
        }
    })

    return res;
}

function sperate(n){
    let s = n + '';
    let count = 0;
    const res = [];
    for(let i = s.length - 1; i >= 0; i--){
        res.push(str[i]);
        count++;
        if(count === 3 && i !== 0){
            res.push(',');
            count = 0;
        }
    }
    return res.reverse().join('');
}

function Parent(age){
    this.age = age;
    this.hobbies = ['reading', 'coding'];
}

Parent.prototype.getAge = function(){
    console.log(this.age);
}

function Child(){}

Child.prototype = new Parent(30);

const child1 = new Child();
const child2 = new Child();

child1.hobbies.push('swimming');

function limit(count, array, iterateFunc){
    const tasks = [];
    const doingTasks = [];
    let i = 0;

    const enqueue = () => {
        if(i === array.length){
            return Promise.resolve();
        }

        const task = Promise.resolve().then(() => iterateFunc(array[i++]));
        tasks.push(task);

        const doing = task.then(() => {
            doingTasks.splice(doingTasks.indexOf(doing), 1);
        })
        doingTasks.push(doing);

        const res = doingTasks.length >= count ? Promise.race(doingTasks) : Promise.resolve();

        return res.then(enqueue);
    }

    return enqueue().then(() => Promise.all(tasks));
}

class AsyncPool{
    constructor(limit){
        this.limit = limit;
        this.count = 0;
        this.queue = [];
    }

    add(task){
        return new Promise((resolve, reject) => {
            this.queue.push({task, resolve, reject});
            this.run();
        })
    }

    run(){
        while(this.count < this.limit && this.queue.length){
            const {task, resolve, reject} = this.queue.shift();
            this.count++;

            task()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    this.count--;
                    this.run();
                })
        }
    }
}

class AsyncPool{
    constructor(limit){
        this.limit = limit;
        this.count = 0;
        this.queue = [];
    }

    add(task){
        return new Promise((reslove, reject) => {
            this.queue.push({task, reslove, reject});
            this.run();
        })
    }

    run(){
        while(this.count < this.limit && this.queue.length){
            const {task, resolve, reject} = this.queue.shift();
            this.count++;

            task()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    this.count--;
                    this.run();
                })
                
        }
    }
}

class AsyncPool{
    constructor(limit){
        this.limit = limit;
        this.count = 0;
        this.queue = [];
    }

    add(task){
        return new Promise((resolve, reject) => {
            this.queue.push({task, resolve, reject});
            this.run();
        })
    }

    run(){
        while(this.limit < this.count && this.queue.length){
            let {task, resolve, reject} = this.queue.shift();
            this.count++;
            task()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    this.count--;
                    this.run();
                })
        }
    }
}


Array.prototype.map = function(fn){
    const res = [];
    for(let i = 0; i < this.length; i++){
        res.push(fn(this[i], i, this));
    }
    return res;
}

Array.prototype.filter = function(fn){
    const res = [];
    for(let i = 0; i < this.length; i++){
        if(fn(this[i], i, this)){
            res.push(this[i]);
        }
    }
    return res;
}

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


function retryRequest(requestFunction, maxAttempts, delay){
    return new Promise((resolve, reject) => {
        let attempts = 0;

        function makeRequest(){
            attempts++;

            requestFunction()
                .then(resolve)
                .catch((error) => {
                    if(attempts < maxAttempts){
                        setTimeout(makeRequest, delay);
                    }else{
                        reject(error);
                    }
                })
        }
        makeRequest();
    })
}

function deepcopy(obj){
    if(!obj || typeof obj !== 'object') return;
    let newObj = Array.isArray(object) ? [] : {};
    for(let key in obj){
        if(obj.hasOwnProperty(key)){
            newObj[key] = typeof obj[key] === 'object' ? deepcopy(obj[key]) : obj[key];
        }
    }
    return newObj;
}

function isEqual(obj1, obj2){
    if(typeof obj1 !== 'object' || typeof obj2 !== 'object'){
        return obj1 === obj2;
    }
    if(obj1 === obj2) return true;
    let key1 = Object.keys(obj1);
    let key2 = Object.keys(obj2);
    if(key1.length !== key2.length) return false;

    for(let key of key1){
        if(!isEqual(obj1[key], obj2[key])) return false;
    }
    return true;
}

function praseUrl(url){
    let resObj = {};
    if(!url.includes('?')) return;
    let praseStr = url.split('?')[1];
    praseStr.split('&').forEach(str => {
        let [key, value] = str.split('=');
        if(!key) return;
        value = value !== undefined ? decodeURIComponent(value) : true;
        if(resObj[key]){
            resObj[key] = [].concat(resObj[key, value]);
        }else{
            resObj[key] = value;
        }
    })
}