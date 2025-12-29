export default defineEventHandler((event) => {
  console.log('new request:' + getRequestURL(event))
})