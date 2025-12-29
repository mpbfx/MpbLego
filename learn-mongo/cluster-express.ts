import cluster from 'cluster'
import { cpus } from 'os'
import process from 'process'
import express from 'express'

function startExpress() {
  const app = express()
  console.log(`Worker ${process.pid} started`)
  app.get('/api/slow', (req, res) => {
    console.time('slowApi');
    const baseNumber = 7;
    let result = 0;   
    for (let i = Math.pow(baseNumber, 7); i >= 0; i--) {       
      result += Math.tan(i) * Math.atan(i)
    }
    console.timeEnd('slowApi')
    console.log(`Result number is ${result} - on process ${process.pid}`);
    res.send(`Result number is ${result}`)
    // 在响应的时候，发送消息
    process.send({ cmd: 'notify' })
  })
  app.listen(3000, () => {
    console.log('App listening on port 3000')
  })
}
if (cluster.isPrimary) {
  console.log(`Master ${process.pid} running`)
  const cpuLength = cpus().length
  console.log('cpus cores', cpuLength)
  let numReqs = 0 

  function messageHandler(msg) {
    if (msg.cmd && msg.cmd === 'notify') {
      numReqs += 1
    }
  }
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`)
  }, 1000)
  // 为每个 cpu fork 一个对应的子进程
  for (let i = 0; i < cpuLength; i++) {
    cluster.fork()
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`)
    cluster.fork()
  })
  // console.log(cluster.workers)
  // 循环监听 worker 的 message 事件
  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler)
  }
} else {
  // 被启动的叫 Worker 进程，顾名思义就是干活的『工人』。它们接收请求，对外提供服务。
  startExpress()
}