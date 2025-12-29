<template>
  <div>
    <GlobalHeader></GlobalHeader>
    <div class="flex min-h-screen">
      <div class="w-[250px] border-r border-gray-300 pt-5 px-2">
        <Sidebar />
      </div>
      <div class="flex-1 bg-gray-100 pt-3 px-3">
        <slot/>
      </div>
    </div>
  </div>
</template>
