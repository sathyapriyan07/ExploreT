import * as React from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { aiChat, type ChatMessage } from '@/services/ai'
import { getLastViewedPlace } from '@/utils/history'

type UIMessage = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Plan a 3-day trip',
  'Nearby places to visit',
  'Budget-friendly itinerary',
  'Best hotels and areas to stay',
]

function systemPrompt() {
  const last = getLastViewedPlace()
  return `You are ExploreX, an AI travel assistant.\n\nBehaviors:\n- Be concise and actionable.\n- Suggest 5-8 places max.\n- If user gives a destination, include day-wise plan when asked.\n\nContext:\n- Last viewed place: ${last ?? 'unknown'}\n`
}

export function Chatbot() {
  const [open, setOpen] = React.useState(false)
  const [input, setInput] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [messages, setMessages] = React.useState<UIMessage[]>([
    {
      role: 'assistant',
      content:
        'Ask me to plan a trip, find nearby places, or recommend hotels for a destination.',
    },
  ])

  async function send(text: string) {
    const content = text.trim()
    if (!content) return
    setInput('')
    setPending(true)
    setMessages((prev) => [...prev, { role: 'user', content }])

    try {
      const history: ChatMessage[] = [
        { role: 'system', content: systemPrompt() },
        ...messages
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content } as ChatMessage)),
        { role: 'user', content },
      ]
      const reply = await aiChat(history, { temperature: 0.4 })
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply || 'I could not generate a response.',
        },
      ])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            e instanceof Error ? `AI error: ${e.message}` : 'AI request failed',
        },
      ])
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Card className="w-[360px] overflow-hidden border-white/10 bg-card/80 shadow-[var(--shadow-soft)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                <div className="text-sm font-semibold tracking-tight">
                  ExploreX AI
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="max-h-[420px] space-y-3 overflow-y-auto overflow-x-hidden p-3 pr-2 scrollbar-hide overscroll-contain">
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="secondary"
                      onClick={() => void send(s)}
                      disabled={pending}
                    >
                      {s}
                    </Button>
                  ))}
                </div>

                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'rounded-2xl border border-white/10 px-3 py-2 text-sm leading-relaxed',
                      m.role === 'assistant'
                        ? 'bg-background/40 text-foreground'
                        : 'bg-primary text-primary-foreground shadow-[var(--shadow-glow)]',
                    )}
                  >
                    {m.content}
                  </div>
                ))}

                {pending ? (
                  <div className="rounded-2xl border border-white/10 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                    Thinking…
                  </div>
                ) : null}
              </div>

              <form
                className="flex items-center gap-2 border-t border-white/10 p-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  void send(input)
                }}
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about a destination…"
                  disabled={pending}
                />
                <Button
                  size="icon"
                  type="submit"
                  disabled={pending || !input.trim()}
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Button
              className="h-12 w-12 rounded-full shadow-[var(--shadow-soft)]"
              onClick={() => setOpen(true)}
              aria-label="Open chat"
            >
              <MessageCircle className="size-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
