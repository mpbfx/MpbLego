// 路由 routing /api/test
// 参数 params
// query
// 不同 method
// body

export default defineEventHandler((event) => {
  const { apiKey } = useRuntimeConfig()
  console.log('apiKey',apiKey)
  return Promise.resolve({ name: 'viking' })
})