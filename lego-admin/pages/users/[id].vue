<template>
  <div>
    <Head>
      <Title>{{ data?.name }}</Title>
      <Meta name="description" :content="data?.name" />
      <Style type="text/css" children="body { background-color: green; }" ></Style>
    </Head>
    <h1>user detail page - {{route.params.id}}</h1>
    <div v-if="data">
      <h2>{{ data.name }}</h2>
      <h2>{{ data.username}}</h2>
      <pre>{{data}}</pre>
    </div>
    <div v-if="pending">Loading...</div>
  </div>
</template>
<script setup lang="ts">
import type { UserData } from '@/types/user'
// definePageMeta({
//   middleware: [
//     (to, from) => {
//       if (to.params.id === '2') {
//         return abortNavigation('error here')
//       }
//     },
//     'auth']
// })
const route = useRoute()
const userId = route.params.id
// useHead({
//   title: 'the user detail page',
//   meta: [
//     { name: 'description', content: 'user detail page desc'}
//   ]
// })

// const data = ref<UserData | null>(null)
// const { data: cachedUser } = useNuxtData(`user/${userId}`)
// if (cachedUser.value) {
//   data.value = cachedUser.value
// } else {
//   const { data: fetchedUser, pending } = await useAsyncData(`user/${userId}`, 
//     () => $fetch<UserData>(`https://jsonplaceholder.typicode.com/users/${userId}`),
//     { lazy: true })
//   data.value = fetchedUser.value
// 
const { data, pending } = await useFetch<UserData>(`https://jsonplaceholder.typicode.com/users/${route.params.id}`, {
  pick: ['name', 'username'],
  lazy: true,
  server: false
})

// useSeoMeta({
//   title: () => `the user detail page - ${data.value?.name}`,
//   description: 'user detail page desc'
// })

</script>
