import { createServer } from 'http'
import { readFile, createReadStream } from 'fs'
const server = createServer()
server.on('request', (req, res) => {
  const src = createReadStream('./big.file')
  src.pipe(res)
});
server.listen(8000);
