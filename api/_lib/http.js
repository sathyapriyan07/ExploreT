export function json(res, status, data) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(data))
}

export function getClientIp(req) {
  const xff = req.headers?.['x-forwarded-for']
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim()
  const real = req.headers?.['x-real-ip']
  if (typeof real === 'string' && real.length) return real
  return req.socket?.remoteAddress || 'unknown'
}

export function parseUrl(req) {
  const u = new URL(req.url || '/', 'http://localhost')
  return u
}

export async function readJson(req) {
  const chunks = []
  for await (const c of req) chunks.push(Buffer.from(c))
  const raw = Buffer.concat(chunks).toString('utf8') || '{}'
  return JSON.parse(raw)
}

export async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

