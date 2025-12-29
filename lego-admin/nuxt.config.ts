// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    'nuxt-mongoose',
    '@nuxt/ui'
  ],
  tailwindcss: {
    exposeConfig: true,
  },
  app: {
    head: {
      link: [{
        rel: 'stylesheet', 
        href: 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css' 
      }],
      charset: 'utf-8',
      title: 'my test app',
      meta: [
        { name: 'description', content: 'my test app desc' } 
      ]
    }
  },
  runtimeConfig: {
    apiKey: '',
    public: {
      apiBase: 'test.com'
    },
    redis: {
      host: '',
      port: 0
    },
    bcrypt: {
      saltRounds: 10
    },
    jwt: {
      secret: '',
      expiresIn: 60 * 60
    }
  },
  // nitro: {
  //   storage: {
  //     redis: {
  //       driver: 'redis',
  //       port: 6379, // Redis port
  //       host: "127.0.0.1", // Redis host
  //       password: "",
  //       db: 0, // Defaults to 0
  //     }
  //   }
  // }
})
