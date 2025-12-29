<template>
  <h1>Hello {{message}} - {{counter}}</h1>
  <button @click="counter++">Increase</button>
</template>

<script setup lang="ts">

defineProps<{ message: string }>()
const counter = ref(1)
useKeyPress('j', () => {
  counter.value++
})
</script>