const buckets = new Map()

export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || now > current.resetAt) {
    const next = { count: 1, resetAt: now + windowMs }
    buckets.set(key, next)
    return { ok: true, remaining: limit - 1, resetAt: next.resetAt }
  }

  current.count += 1
  if (current.count > limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt }
  }

  return { ok: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt }
}

