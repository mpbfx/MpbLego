export default defineAuthResponseHandler(async (event) => {
  console.log('params', event.context.params)
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  return { id, ...query }
})
