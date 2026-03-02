import React from 'react'
import { renderMircLine } from '../../lib/mircColors'
import type { IrcMessage } from '../../store/useMessageStore'

interface Props {
  msg: IrcMessage
  ourNick: string
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function MessageLine({ msg, ourNick }: Props): React.ReactElement {
  const isMentioned = msg.message.toLowerCase().includes(ourNick.toLowerCase())

  if (msg.type === 'system') {
    return (
      <div className="flex gap-2 px-3 py-0.5 text-xs text-zinc-600 hover:bg-zinc-900/30">
        <span className="text-zinc-700 shrink-0">{formatTime(msg.timestamp)}</span>
        <span className="italic">{msg.message}</span>
      </div>
    )
  }

  const isNotice = msg.type === 'notice'

  return (
    <div
      className={`flex gap-2 px-3 py-0.5 text-xs hover:bg-zinc-900/30 ${
        isMentioned ? 'bg-accent/10' : ''
      } ${isNotice ? 'text-yellow-300/80' : ''}`}
    >
      <span className="text-zinc-700 shrink-0 font-mono">{formatTime(msg.timestamp)}</span>
      {isNotice ? (
        <span className="text-yellow-600 shrink-0">-{msg.nick}-</span>
      ) : (
        <span
          className="shrink-0 font-medium"
          style={{ color: nickColor(msg.nick) }}
        >
          &lt;{msg.nick}&gt;
        </span>
      )}
      <span className="break-all">{renderMircLine(msg.message)}</span>
    </div>
  )
}

// Simple deterministic color from nick
function nickColor(nick: string): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#14b8a6', '#f59e0b', '#84cc16', '#6366f1',
  ]
  let hash = 0
  for (const c of nick) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0
  return colors[Math.abs(hash) % colors.length]
}
