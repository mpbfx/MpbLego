import type { ZodType } from 'zod'
import type { H3Event } from 'h3'
// https://zod.dev/?id=writing-generic-functions
export const runValidate  = async <T>(schema: ZodType<T>, event: H3Event) => {
  // https://unjs.io/blog/2023-08-15-h3-towards-the-edge-of-the-web#runtime-type-safe-request-utils
  const result = await readValidatedBody(event, body => schema.safeParse(body))
  if (!result.success) {
    throw createError({
      statusCode: 403,
      statusMessage: '验证失败',
      data: result.error.format()
    })
  }
  return result
}