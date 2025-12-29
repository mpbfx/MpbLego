import http from 'http'
import cluster from 'cluster'
import { cpus } from 'os'
import process from 'process'

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} running`)
  const cpuLength = cpus().length
  console.log('cpus cores', cpuLength)
  // 为每个 cpu fork 一个对应的子进程
  for (let i = 0; i < cpuLength; i++) {
    cluster.fork()
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`)
  })
} else {
  // 被启动的叫 Worker 进程，顾名思义就是干活的『工人』。它们接收请求，对外提供服务。
  http.createServer((req, res) => {
    res.writeHead(200)
    res.end('hello world')
  }).listen(8000)
  console.log(`Worker ${process.pid} started`)
}