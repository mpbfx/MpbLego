import express from 'express'

const app = express()
app.get('/api/slow', (req, res) => {
  console.time('slowApi')
  const baseNumber = 7
  let result = 0
  for (let i = Math.pow(baseNumber, 7); i >= 0; i--) {
    result += Math.tan(i) * Math.atan(i)
  }
  console.timeEnd('slowApi')
  console.log(`Result number is ${result} - on process ${process.pid}`);
  res.send(`Result number is ${result}`)
})
app.listen(3000, () => {
  console.log('App listening on port 3000')
})