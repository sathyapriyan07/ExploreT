export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>
}

export async function aiChat(messages: ChatMessage[], opts?: { temperature?: number }) {
  const body = {
    model: import.meta.env.VITE_AI_MODEL || 'openai/gpt-4.1',
    messages,
    temperature: opts?.temperature ?? 0.4,
    max_completion_tokens: 450,
  }

  // Prefer a serverless proxy (Vercel) to avoid exposing API keys.
  // Default provider: Bytez OpenAI-compatible endpoint.
  const proxyRes = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (proxyRes.ok) {
    const data = (await proxyRes.json()) as ChatCompletionResponse
    return data.choices?.[0]?.message?.content?.trim() ?? ''
  } else {
    const text = await proxyRes.text().catch(() => '')
    throw new Error(
      text
        ? `AI proxy error (${proxyRes.status}): ${text}`
        : `AI proxy error (${proxyRes.status})`,
    )
  }
}

export function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
