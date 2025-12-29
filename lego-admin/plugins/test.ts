export default defineNuxtPlugin(nuxtApp => {
  const user = {
    name: 'viking'
  }
  nuxtApp.hooks.hook('app:created', () => {
    console.log('vueApp created here')
  })
  nuxtApp.hooks.hook('app:mounted', () => {
    console.log('vueApp mounted')
  })
  // nuxtApp.vueApp.use('', )
  // nuxtApp.vueApp.component('', )
  // nuxtApp.vueApp.directive('')
  nuxtApp.provide('author', user)
})
