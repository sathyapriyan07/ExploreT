export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const key = process.env.GROQ_API_KEY
  if (!key) {
    res.status(500).json({ error: 'Missing GROQ_API_KEY on server' })
    return
  }

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    })

    const text = await upstream.text()
    res.setHeader('content-type', 'application/json')
    res.status(upstream.status).send(text)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Proxy error' })
  }
}
