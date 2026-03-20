export function stripHtml(input?: string | null) {
  if (!input) return ''
  return input.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}
