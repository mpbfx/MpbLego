<template>
  <div>
    <pre>{{sort}}</pre>
    <UTable :rows="usersData" :columns="columns" :loading="pending"  v-model:sort="sort" sort-mode="manual" />
    <div class="flex justify-between px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
      <UBadge>共 {{data?.total || '0' }} 条</UBadge>
      <UPagination v-model="currentPage" :page-count="pageCount" :total="data?.total" />

    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
const currentPage = ref(1)
const pageCount= ref(10)
const sort = ref({
  column: 'createdAt',
  direction: 'desc'
})
// https://nuxt.com/docs/getting-started/data-fetching#watch
const { data, pending } = await useFetch('/api/users', {
  query: {
    orderBy: computed(() => sort.value.column),
    order:  computed(() => sort.value.direction),
    currentPage,
    pageCount
  }
})
const usersData = computed(() => data.value?.data.map(user => {
  user.createdAt = dayjs(user.createdAt).format('YYYY-MM-DD HH:mm')
  user.updatedAt = dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm')
  return user
}))
const columns = [{
  key: 'username',
  label: '用户名称'
}, {
  key: 'nickName',
  label: '昵称'
}, {
  key: 'role',
  label: '角色'
}, 
{
  key: 'type',
  label: '类型'
}, {
  key: 'createdAt',
  label: '创建于',
  sortable: true
}, {
  key: 'updatedAt',
  label: '更新于',
  sortable: true
}]
</script>