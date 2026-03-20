import Bytez from 'bytez.js'
import { json, readJson } from './_lib/http.js'

function toOpenAiLike(content) {
  return {
    id: 'explorex-chat',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
  }
}

function extractAssistantText(output) {
  if (typeof output === 'string') return output
  if (output && typeof output === 'object') {
    const maybe = output.choices?.[0]?.message?.content
    if (typeof maybe === 'string') return maybe
  }
  if (Array.isArray(output)) {
    for (let i = output.length - 1; i >= 0; i--) {
      const msg = output[i]
      const content = msg?.content ?? msg?.message
      if (msg?.role === 'assistant' && typeof content === 'string' && content.trim()) return content
    }
  }
  try {
    return JSON.stringify(output)
  } catch {
    return String(output ?? '')
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  const key = process.env.BYTEZ_KEY
  if (!key) {
    return json(res, 500, { error: 'Missing BYTEZ_KEY on server' })
  }
  if (String(key).startsWith('gsk_')) {
    return json(res, 500, {
      error:
        'BYTEZ_KEY looks like a Groq key (gsk_*). Set BYTEZ_KEY to your Bytez API key.',
    })
  }

  try {
    const body =
      req.body && typeof req.body === 'object'
        ? req.body
        : req.body && typeof req.body === 'string'
          ? JSON.parse(req.body)
          : await readJson(req)

    const sdk = new Bytez(String(key))
    const modelId =
      body.model || process.env.BYTEZ_MODEL || process.env.VITE_AI_MODEL || 'openai/gpt-4.1'

    const messages = Array.isArray(body.messages) ? body.messages : []
    const temperature =
      typeof body.temperature === 'number' ? body.temperature : undefined

    const { error, output } = await sdk
      .model(String(modelId))
      .run(messages, temperature !== undefined ? { temperature } : undefined)

    if (error) {
      return json(res, 502, { error })
    }

    const content = extractAssistantText(output).trim()
    return json(res, 200, toOpenAiLike(content || ''))
  } catch (e) {
    return json(res, 500, { error: e instanceof Error ? e.message : 'Proxy error' })
  }
}
