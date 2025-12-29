import { H3Event } from 'h3'
export default async (event: H3Event) => {
  const user = await Promise.resolve({ isLogin: false, userName: 'viking'})
  console.log('the user', user)
  if (!user.isLogin) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
}