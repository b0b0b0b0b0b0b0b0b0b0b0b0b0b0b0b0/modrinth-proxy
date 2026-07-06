const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const staticRoot = path.join(__dirname, '.next', 'static')
const STATIC_PREFIX = '/_next/static/'

const MIME = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json; charset=utf-8',
}

function resolveStaticFile(urlPath) {
  const relative = decodeURIComponent(urlPath.slice(STATIC_PREFIX.length))
  const filePath = path.normalize(path.join(staticRoot, relative))
  const relativeCheck = path.relative(staticRoot, filePath)
  if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
    return null
  }
  return filePath
}

function serveStatic(req, res, urlPath) {
  const filePath = resolveStaticFile(urlPath)
  if (!filePath) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      handle(req, res, parse(req.url, true))
      return
    }

    const ext = path.extname(filePath)
    res.statusCode = 200
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
    res.setHeader('Content-Length', String(stat.size))
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    const stream = fs.createReadStream(filePath)
    stream.on('error', () => {
      if (!res.headersSent) {
        res.statusCode = 500
      }
      res.end()
    })
    stream.pipe(res)
  })
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    const pathname = parsedUrl.pathname || ''

    if (pathname.startsWith(STATIC_PREFIX)) {
      serveStatic(req, res, pathname)
      return
    }

    handle(req, res, parsedUrl)
  }).listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
