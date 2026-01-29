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