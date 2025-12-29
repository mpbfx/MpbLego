import type { EventHandler } from 'h3'

export const defineAuthResponseHandler = (handler: EventHandler) => {
  return defineEventHandler(async (event) => {
    // do something before the route handler
    const isLogin = await useStorage('redis').hasItem('currentUser')
    if (!isLogin) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }
    const response = await handler(event)
    // do something after the route handler
    return { ...response }
  })
}