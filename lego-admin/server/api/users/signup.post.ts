import bcrypt from 'bcrypt'
import { userSignupSchema } from '@/validators/user'
export default defineEventHandler(async (event) => {
  const result = await runValidate(userSignupSchema, event)
  const config = useRuntimeConfig()
  const { email, password } = result.data
  const user = await UserSchema.findOne({ username: email }).lean()
  if (user) {
    throw createError({
      statusCode: 409,
      statusMessage: '该邮箱已经被注册，请直接登录'
    })
  }
  const hash = await bcrypt.hash(password, config.bcrypt.saltRounds)
  const userCreatedData = { username: email, password: hash, email }
  const newUser = await UserSchema.create(userCreatedData)
  return newUser
})