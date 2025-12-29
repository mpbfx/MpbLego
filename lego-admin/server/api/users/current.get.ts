export default defineEventHandler(async (event) => {
  const currentUserData = await UserSchema.findOne({ username: event.context.user.username }).exec()
  return currentUserData?.toJSON()
})
