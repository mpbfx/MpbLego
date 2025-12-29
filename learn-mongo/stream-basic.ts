import { createReadStream, createWriteStream } from 'fs'
import { createGzip } from 'zlib'
const readableSrc = createReadStream('./text.txt')
const writeDesc = createWriteStream('./text.gz')
// readableSrc.pipe(writeDesc)
// readableSrc.on('data', chunk => {
//   writeDesc.write(chunk)
// })
// readableSrc.on('end', () => {
//   writeDesc.end()
// })
readableSrc.pipe(createGzip()).pipe(writeDesc)