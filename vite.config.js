import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { runChat } from './server/aiCore.js'

// Local dev: serves /api/chat (same as the Vercel function) using keys from .env
const devApi = (env) => ({
  name: 'dev-api-chat',
  configureServer(server) {
    server.middlewares.use('/api/chat', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        return res.end('Method not allowed')
      }
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', async () => {
        try {
          const { prompt, language } = JSON.parse(body || '{}')
          const out = await runChat({ prompt, language, env })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ text: out.text }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ text: 'Server error: ' + e.message }))
        }
      })
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') // includes non-VITE_ vars
  return { plugins: [react(), devApi(env)] }
})