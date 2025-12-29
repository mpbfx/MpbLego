<template>
<div class="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-lg text-center">
    <h1 class="text-2xl font-bold sm:text-3xl">用户登陆</h1>

    <p class="mt-4 text-gray-500">
      输入用户名密码完成登陆
    </p>
  </div>

  <form @submit="login" class="mx-auto mb-0 mt-8 max-w-md space-y-4">
    <ValidateInput 
      name="email"
      placeholder="输入邮箱地址"
    />
    <ValidateInput 
      name="password"
      type="password"
      placeholder="输入密码"
    />
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500">
        没有账户?
        <NuxtLink class="underline" to="/signup">注册新账户</NuxtLink>
      </p>

      <button
        type="submit"
        class="inline-block rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white disabled:opacity-75"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? '读取中...' : '登陆'}}
      </button>
    </div>
  </form>
  <div
    v-if="callbackMessage.isShow"
    class="rounded border-s-4 p-4 mt-4 mx-auto max-w-lg"
    :class="{ 
      'border-red-500 bg-red-50 text-red-500': !callbackMessage.isValid , 
      'border-green-500 bg-green-50 text-green-500': callbackMessage.isValid 
    }"
  >
    {{ callbackMessage.message }}
  </div>
</div>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { userLoginSchema } from '../validators/user'
definePageMeta({
  layout: 'custom'
})
const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(userLoginSchema)
})

const currentUser = useCurrentUser()
const callbackMessage = ref({
  isShow: false,
  isValid: true,
  message: ''
})
const login = handleSubmit(async (values) => {
  console.log(values)
  try {
    const result = await $fetch('/api/users/login', { body: values, method: 'POST' })
    callbackMessage.value = {
      isShow: true,
      isValid: true,
      message: '登陆成功 两秒后跳转到首页'
    }
    currentUser.value.isLogin = true
    currentUser.value.data = result
    setTimeout(() => {
      navigateTo('/')
    }, 2000)
  } catch  (e : any) {
    console.log(e.data)
    callbackMessage.value = {
      isShow: true,
      isValid: false,
      message: e.data.statusMessage
    }
  }
})
</script>