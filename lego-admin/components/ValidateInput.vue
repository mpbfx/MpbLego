<template>
<div>
  <div class="relative">
    <input
      :type="type || 'text'"
      class="w-full rounded-lg  p-4 pe-12 text-sm shadow-sm border"
      :placeholder="placeholder"
      v-model="value"
      @blur="handleChange"
      :class="{'border-red-500': errorMessage, 'border-gray-200': !errorMessage }"
    />
  </div>
  <span class=" text-red-500 text-xs italic" v-if="errorMessage">{{ errorMessage }}</span>
</div>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate'
interface InputProps {
  name: string;
  placeholder?: string;
  type?: string;
}
const props = defineProps<InputProps>()
const { value, errorMessage, handleChange } = useField(() => props.name)
</script>