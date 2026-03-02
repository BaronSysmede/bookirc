import React, { useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useServerStore } from '../../store/useServerStore'
import { useMessageStore } from '../../store/useMessageStore'
import { MessageLine } from '../irc/MessageLine'
import { MessageInput } from '../irc/MessageInput'

export function MessagePane(): React.ReactElement {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const activeChannel = useServerStore((s) => s.activeChannel)
  const servers = useServerStore((s) => s.servers)
  const getMessages = useMessageStore((s) => s.getMessages)

  const messages = activeServerId && activeChannel
    ? getMessages(activeServerId, activeChannel)
    : []

  const ourNick = activeServerId
    ? (servers.get(activeServerId)?.nick ?? '')
    : ''

  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 20,
  })

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' })
    }
  }, [messages.length])

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="px-3 py-1.5 bg-[#16161a] border-b border-zinc-800 text-xs text-zinc-400 shrink-0 flex items-center gap-2">
        {activeChannel ? (
          <>
            <span className="text-accent">{activeChannel}</span>
            <span className="text-zinc-700">—</span>
            <span className="text-zinc-600 truncate">
              {messages.length} messages
            </span>
          </>
        ) : (
          <span className="text-zinc-600">No channel selected</span>
        )}
      </div>

      {/* Virtualized message list */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto min-h-0"
      >
        <div
          style={{ height: virtualizer.getTotalSize() + 'px', position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const msg = messages[item.index]
            return (
              <div
                key={item.key}
                data-index={item.index}
                ref={virtualizer.measureElement}
                style={{ position: 'absolute', top: item.start + 'px', left: 0, right: 0 }}
              >
                <MessageLine msg={msg} ourNick={ourNick} />
              </div>
            )
          })}
        </div>
      </div>

      <MessageInput />
    </div>
  )
}
