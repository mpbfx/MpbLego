import redisDriver from 'unstorage/drivers/redis'

export default defineNitroPlugin((app) => { 
  const storage = useStorage()
  const { redis } = useRuntimeConfig()
  const driver = redisDriver({
    host: redis.host,
    port: redis.port
  })
  storage.mount('redis', driver)
})