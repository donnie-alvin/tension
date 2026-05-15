import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http'
import { pathToFileURL } from 'node:url'

import { FileIndexingQueue, submitIndexingRequest } from '@traycer/repo-indexer'

export interface ApiRuntimeOptions {
  port?: number
  host?: string
  queue?: FileIndexingQueue
}

export interface ApiRuntime {
  name: '@traycer/api'
  role: 'http-api'
  start(): Promise<{ host: string; port: number }>
  close(): Promise<void>
}

export function createApiRuntime(options: ApiRuntimeOptions = {}): ApiRuntime {
  const host = options.host ?? process.env.API_HOST ?? '127.0.0.1'
  const port =
    options.port ?? Number.parseInt(process.env.API_PORT ?? '3001', 10)
  const queue = options.queue ?? new FileIndexingQueue()
  const server = createServer((request, response) => {
    handleRequest(request, response, queue).catch((error) => {
      writeJson(response, 500, {
        error: error instanceof Error ? error.message : String(error),
      })
    })
  })

  return {
    name: '@traycer/api',
    role: 'http-api',
    start() {
      return new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, host, () => {
          const address = server.address()
          const listeningPort =
            typeof address === 'object' && address ? address.port : port

          server.off('error', reject)
          resolve({ host, port: listeningPort })
        })
      })
    },
    close() {
      return closeServer(server)
    },
  }
}

export const apiRuntime = createApiRuntime()

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  queue: FileIndexingQueue,
): Promise<void> {
  if (request.method === 'GET' && request.url === '/health') {
    writeJson(response, 200, { ok: true })
    return
  }

  if (request.method === 'POST' && request.url === '/repo-indexes') {
    const receipt = await submitIndexingRequest(await readJson(request), queue)
    writeJson(response, 202, receipt)
    return
  }

  writeJson(response, 404, { error: 'not_found' })
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  response.writeHead(statusCode, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  apiRuntime
    .start()
    .then(({ host, port }) => {
      process.stdout.write(`api listening on http://${host}:${port}\n`)
    })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.stack : String(error)}\n`,
      )
      process.exitCode = 1
    })
}
