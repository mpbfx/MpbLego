export default defineNitroPlugin((app) => {
  console.log('nitro app', app)
  // app.hooks.hook('request', (event) => {
  //   console.log("on request", event.path)
  // })
  // app.hooks.hook('beforeResponse', (event, { body }) => {
  //   console.log("on response", event.path, { body })
  // })
})