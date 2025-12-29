import * as Redis from 'ioredis'

const redis = new Redis(6379)
const pub = new Redis(6379)
const sub = new Redis(6379)
async function run() {
  try {
    // await redis.set('name', 'viking', 'ex', 10)
    const result = await redis.get('name')
    console.log(result)
    // array
    await redis.lpush('software', 'mysql', 'redis')
    const arr = await redis.lrange('software', 0, 10)
    console.log(arr)
    // object
    await redis.hmset('person', { name: 'viking', age: 30 })
    const obj = await redis.hgetall('person')
    console.log(obj)
    // pub/sub
    // sub
    const r = await sub.subscribe('channel-1')
    console.log(r)
    sub.on('message', (channel, message) => {
      console.log(`Received ${message} from ${channel}`)
    })
    // pub
    setTimeout(() => {
      pub.publish('channel-1', 'hello')
    }, 1000)
  } catch (e) {
    console.error(e)
  } finally {
    // redis.disconnect()
  }
}
run()