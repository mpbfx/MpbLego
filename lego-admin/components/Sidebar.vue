<template>
  <div>
    <UVerticalNavigation :links="links" />
  </div>  
</template>
<script setup lang="ts">
const links = [{
  label: '用户管理',
  icon: 'i-heroicons-user',
  to: '/users'
}, {
  label: '海报管理',
  icon: 'i-heroicons-clipboard-document-check',
  to: '/posters'
}, {
  label: '模版管理',
  icon: 'i-heroicons-book-open',
  to: `/templates`
}]

</script>