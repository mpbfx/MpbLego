<template>
<div class="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-lg text-center">
    <h1 class="text-2xl font-bold sm:text-3xl">注册成为会员</h1>

    <p class="mt-4 text-gray-500">
      输入以下信息来完成注册
    </p>
  </div>
  <form @submit="signup" class="mx-auto mb-0 mt-8 max-w-md space-y-4">
    <ValidateInput 
      name="email"
      placeholder="输入电子邮箱地址"
    />
    <ValidateInput 
      name="password"
      type="password"
      placeholder="输入密码"
    />
    <ValidateInput 
      name="confirmPwd"
      type="password"
      placeholder="再次输入密码"
    />
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500">
        已经有账户了?
        <NuxtLink class="underline" to="/login">登陆</NuxtLink>
      </p>
      <button
        type="submit"
        class="inline-block rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white disabled:opacity-75"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? '读取中...' : '注册'}}
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
    {{callbackMessage.message}}
  </div>
</div>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { userSignupSchema } from '../validators/user'

definePageMeta({
  layout: 'custom'
})

const callbackMessage = ref({
  isShow: false,
  isValid: true,
  message: ''
})
const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(userSignupSchema)
})

const signup = handleSubmit(async (values) => {
  console.log(values)
  try {
    await $fetch('/api/users/signup', { body: values, method: 'POST' })
    callbackMessage.value = {
      isShow: true,
      isValid: true,
      message: '注册成功 两秒后跳转到登陆'
    }
    setTimeout(() => {
      navigateTo('/login')
    }, 2000)
  } catch (e: any) {
    callbackMessage.value = {
      isShow: true,
      isValid: false,
      message: e.data.statusMessage
    }
  }
})
</script>