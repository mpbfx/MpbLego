<template>
  <div>
    <h1>Welcome to the homepage</h1>
  </div>
</template>
<script setup lang="ts">
import { z } from 'zod'
const mySchema = z.string().email({ message: 'should be email'})
const result = mySchema.safeParse('123')
console.log(result)
if (!result.success) {
  console.log(result.error.issues)
}
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})
type LoginData = z.infer<typeof loginSchema>
</script>
