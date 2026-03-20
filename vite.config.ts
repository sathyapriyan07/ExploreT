import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'

import wikiHandler from './api/wiki.js'
import searchHandler from './api/search.js'
import weatherHandler from './api/weather.js'
import nearbyHandler from './api/nearby.js'
import chatHandler from './api/chat.js'

function groqProxyPlugin(): Plugin {
  return {
    name: 'explorex-groq-proxy',
    configureServer(server) {
      server.middlewares.use('/api/wiki', (req, res) => wikiHandler(req, res))
      server.middlewares.use('/api/search', (req, res) => searchHandler(req, res))
      server.middlewares.use('/api/weather', (req, res) => weatherHandler(req, res))
      server.middlewares.use('/api/nearby', (req, res) => nearbyHandler(req, res))
      server.middlewares.use('/api/chat', (req, res) => chatHandler(req, res))

      server.middlewares.use('/api/groq', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(Buffer.from(c)))
        req.on('end', async () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8') || '{}'
            const body = JSON.parse(raw)

            const key =
              process.env.GROQ_API_KEY ||
              process.env.VITE_GROQ_API_KEY
            if (!key) {
              res.statusCode = 500
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing GROQ_API_KEY' }))
              return
            }

            const upstream = await fetch(
              'https://api.groq.com/openai/v1/chat/completions',
              {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  authorization: `Bearer ${key}`,
                },
                body: JSON.stringify(body),
              },
            )

            const text = await upstream.text()
            res.statusCode = upstream.status
            res.setHeader('content-type', 'application/json')
            res.end(text)
          } catch (e) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                error: e instanceof Error ? e.message : 'Proxy error',
              }),
            )
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load env so GROQ_API_KEY in .env.local is available to the dev server.
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v
  }

  return {
    plugins: [react(), groqProxyPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
