import { z } from "zod"
export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export type UserLoginType = z.infer<typeof userLoginSchema>

export const userSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPwd: z.string().min(6)
}).refine((data) => data.password === data.confirmPwd, {
  message: "Passwords don't match",
  path: ['confirmPwd']
})

export type UserSignupType = z.infer<typeof userSignupSchema>
