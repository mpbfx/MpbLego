import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { userLoginSchema } from '~/validators/user'
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const result = await runValidate(userLoginSchema, event)
  const { email, password } = result.data
  const user = await UserSchema.findOne({ email }).exec()
  console.log('the user', user)
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: '该用户不存在或者密码错误'
    })
  } else {
    const verifyPwd = await bcrypt.compare(password, user.password)
    if (!verifyPwd) {
      throw createError({
        statusCode: 404,
        statusMessage: '该用户不存在或者密码错误'
      })
    }
  }
  const userData = { username: user.username, _id: user._id }
  const token = jwt.sign(userData, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

  setCookie(event, 'token', token, { maxAge: config.jwt.expiresIn })
  return user.toJSON()
})
