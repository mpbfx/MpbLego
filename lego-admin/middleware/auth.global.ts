export default defineNuxtRouteMiddleware(async (to, from) => {
  if (to.path === '/login' || to.path === '/signup') {
    return
  }
  const currentUser = useCurrentUser()
  const token = useCookie('token')
  const cookie = useRequestHeader('cookie') as string
  if (!token.value) {
    return navigateTo('/login')
  }
  // token 存在 用户没有登陆
  if (token.value && !currentUser.value.isLogin) {
    const { data, error } = await useFetch('/api/users/current', {
      headers: { cookie, accept: 'application/json' }
    })
    console.log('the error', error.value?.data)
    console.log('the data', data.value)
    if (!error.value) {
      currentUser.value.isLogin = true
      currentUser.value.data = data.value
    } else {
      currentUser.value.isLogin = false
      token.value = null
      navigateTo('/login')
    }
  }
})