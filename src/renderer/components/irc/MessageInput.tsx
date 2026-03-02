import React, { useState, useRef, KeyboardEvent } from 'react'
import { useServerStore } from '../../store/useServerStore'
import { useMessageStore } from '../../store/useMessageStore'

export function MessageInput(): React.ReactElement {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const activeServerId = useServerStore((s) => s.activeServerId)
  const activeChannel = useServerStore((s) => s.activeChannel)
  const addChannel = useServerStore((s) => s.addChannel)
  const addMessage = useMessageStore((s) => s.addMessage)

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !value.trim()) return

    const text = value.trim()
    setValue('')

    if (!activeServerId || !activeChannel) return

    // Handle /commands
    if (text.startsWith('/')) {
      const [cmd, ...args] = text.slice(1).split(' ')
      const cmdLower = cmd.toLowerCase()

      if (cmdLower === 'join') {
        const channel = args[0]
        if (channel) {
          addChannel(activeServerId, channel)
          await window.bookirc.joinChannel(activeServerId, channel)
        }
      } else if (cmdLower === 'part') {
        const channel = args[0] || activeChannel
        await window.bookirc.partChannel(activeServerId, channel)
      } else if (cmdLower === 'msg' || cmdLower === 'privmsg') {
        const [target, ...rest] = args
        if (target && rest.length) {
          await window.bookirc.sendMessage(activeServerId, target, rest.join(' '))
        }
      } else if (cmdLower === 'nick') {
        const newNick = args[0]
        if (newNick) {
          await window.bookirc.sendMessage(activeServerId, '', `/nick ${newNick}`)
        }
      } else if (cmdLower === 'whois') {
        const target = args[0]
        if (target) {
          await window.bookirc.sendMessage(activeServerId, '', `/whois ${target}`)
        }
      } else if (cmdLower === 'me') {
        const action = args.join(' ')
        await window.bookirc.sendMessage(activeServerId, activeChannel, `\x01ACTION ${action}\x01`)
        addMessage(activeServerId, activeChannel, {
          id: `${Date.now()}`,
          nick: '* You',
          message: action,
          timestamp: Date.now(),
          type: 'message',
        })
      } else {
        // Unknown command — send raw
        await window.bookirc.sendMessage(activeServerId, activeChannel, text)
      }
    } else {
      // Regular message
      await window.bookirc.sendMessage(activeServerId, activeChannel, text)
      addMessage(activeServerId, activeChannel, {
        id: `${Date.now()}`,
        nick: 'You',
        message: text,
        timestamp: Date.now(),
        type: 'message',
      })
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#16161a] border-t border-zinc-800">
      <span className="text-zinc-600 text-xs shrink-0">{activeChannel || ''}</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={activeChannel ? `Message ${activeChannel}` : 'No channel selected'}
        className="flex-1 bg-[#0d0d0f] border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accent/60"
      />
    </div>
  )
}
