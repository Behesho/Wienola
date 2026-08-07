import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, 'dist')
const indexHtml = path.join(distDir, 'index.html')

if (!existsSync(indexHtml)) {
  console.error(
    'dist/index.html not found. Run "npm run build" before starting the server.',
  )
  process.exit(1)
}

const app = express()
const port = process.env.PORT || 3000

app.use(express.static(distDir))

// SPA fallback: any route that isn't a static file (e.g. /login, /register)
// is served index.html so React Router can handle it client-side.
app.get('*', (req, res) => {
  res.sendFile(indexHtml)
})

app.listen(port, () => {
  console.log(`Lasten-Wien server listening on port ${port}`)
})
