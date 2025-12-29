import type { SortOrder } from 'mongoose'
export default defineEventHandler(async (event) => {
  const queryObj = getQuery(event)
  // currentPage = 1, pageSize = 10
  const currentPage = Number(queryObj.currentPage) || 1
  const pageSize = Number(queryObj.pageSize) || 10
  const { orderBy = 'createdAt', order = 'desc' } = queryObj
  const customSort = {
    [orderBy as string]: order as SortOrder
  }
  const skip = (currentPage - 1) * pageSize
  const users = await UserSchema
    .find({})
    .select(['username', 'nickName', 'type', 'role', 'createdAt', 'updatedAt'])
    .skip(skip)
    .limit(pageSize)
    .sort(customSort)
    .lean()
  const total = await UserSchema.find({}).countDocuments()
  return {
    data: users,
    total,
    pageSize,
    currentPage
  }
})