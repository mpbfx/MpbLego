/* eslint-disable no-undef */
import 'lego-components/dist/lego-components.css'
// https://laracasts.com/discuss/channels/vite/vite-with-laravel-and-vue-3-show-blank-screen
import { createSSRApp } from 'vue'
import LegoComponents from 'lego-components'

const vueApp = createSSRApp({
  data: () => {
    return {
      components: window.COMPONENT_DATA || []
    }
  },
  template: '<final-page :components="components"></final-page>'
})
vueApp.use(LegoComponents)
vueApp.mount('#app')

