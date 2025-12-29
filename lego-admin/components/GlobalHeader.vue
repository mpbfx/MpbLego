<template>
    <header>
      <nav>
        <ul class="py-2 px-4 relative w-full flex items-center justify-between border-b border-gray-200 dark:border-gray-800 shadow">
          <li><NuxtLink to="/">Home</NuxtLink></li>
          <li>
            <UDropdown :items="items" :popper="{ placement: 'bottom-start' }">
              <UAvatar
                size="lg"
                :src="user.data?.picture"
                :alt="user.data?.username"
              />
            </UDropdown>
          </li>
        </ul>
      </nav>
    </header>
</template>
<script setup lang="ts">
const user = useCurrentUser()
const items = [
  [{
    label: user.value.data?.username,
    avatar: {
      src: user.value.data?.picture,
      alt: user.value.data?.username
    }
  }],
  [
    {
      label: '编辑个人资料',
      icon: 'i-heroicons-pencil-square-20-solid',
      shortcuts: ['E'],
      click: () => {
        console.log('Edit')
      }
    },
    {
      label: '退出登陆',
      icon: 'i-heroicons-arrow-left-on-rectangle-20-solid',
      shortcuts: ['⌘', 'D']
    }
  ]
]
</script>