import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  // /api/users/* 这样的 api 中，只有 /api/users/login 和 /api/users/signup 不需要验证，其他都需要验证
  const regex = /^\/api\/users\/(?!login$|signup$).*/
  if (!regex.test(event.path)) {
    return
  }
  const config = useRuntimeConfig()
  const token = getCookie(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unauthorized',
    })
  }
  try {
    const userData = jwt.verify(token, config.jwt.secret)
    event.context.user = userData
  } catch (err) {
    deleteCookie(event, 'token')
    throw createError({
      statusCode: 400,
      statusMessage: 'Token 已过期'
    })
  }
})