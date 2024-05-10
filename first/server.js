import {createServer} from 'node:http'

let server = createServer()

server.on('request', (_req, res) => {
  console.log('hi')
  res.end('response')
})

server.listen(3000)
