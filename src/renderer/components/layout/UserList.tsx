import React from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { useServerStore } from '../../store/useServerStore'
import { useUserListStore } from '../../store/useUserListStore'
import { useXdccStore } from '../../store/useXdccStore'

export function UserList(): React.ReactElement {
  const activeServerId = useServerStore((s) => s.activeServerId)
  const activeChannel = useServerStore((s) => s.activeChannel)
  const getUsers = useUserListStore((s) => s.getUsers)
  const setSelectedBot = useXdccStore((s) => s.setSelectedBot)

  const users = activeServerId && activeChannel
    ? getUsers(activeServerId, activeChannel)
    : []

  const ops = users.filter((u) => u.isOp)
  const voices = users.filter((u) => !u.isOp && u.isVoice)
  const regular = users.filter((u) => !u.isOp && !u.isVoice)

  const handleGetList = (nick: string) => {
    if (!activeServerId) return
    setSelectedBot(activeServerId, nick)
    window.bookirc.requestPacklist(activeServerId, nick)
  }

  const handleSearch = (nick: string) => {
    if (!activeServerId || !activeChannel) return
    const term = prompt(`Search term for @search in ${activeChannel}:`)
    if (term) window.bookirc.botSearch(activeServerId, activeChannel, term)
  }

  const renderUser = (nick: string, prefix: string) => (
    <ContextMenu.Root key={nick}>
      <ContextMenu.Trigger asChild>
        <div className="px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-800/50 cursor-default flex items-center gap-1">
          <span className={`text-zinc-500 w-3 text-center ${prefix === '@' ? 'text-yellow-500' : prefix === '+' ? 'text-green-500' : ''}`}>
            {prefix}
          </span>
          <span className="truncate">{nick}</span>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="bg-[#1c1c22] border border-zinc-700 rounded shadow-xl z-50 min-w-[160px] py-1">
          <ContextMenu.Item
            className="px-3 py-1.5 text-xs text-zinc-300 hover:bg-accent hover:text-white cursor-pointer outline-none"
            onSelect={() => handleGetList(nick)}
          >
            Get List
          </ContextMenu.Item>
          <ContextMenu.Item
            className="px-3 py-1.5 text-xs text-zinc-300 hover:bg-accent hover:text-white cursor-pointer outline-none"
            onSelect={() => handleSearch(nick)}
          >
            @search this channel
          </ContextMenu.Item>
          <ContextMenu.Separator className="border-t border-zinc-700 my-1" />
          <ContextMenu.Item
            className="px-3 py-1.5 text-xs text-zinc-300 hover:bg-accent hover:text-white cursor-pointer outline-none"
            onSelect={() => {
              if (activeServerId) window.bookirc.sendMessage(activeServerId, nick, '')
            }}
          >
            Private Message
          </ContextMenu.Item>
          <ContextMenu.Item
            className="px-3 py-1.5 text-xs text-zinc-300 hover:bg-accent hover:text-white cursor-pointer outline-none"
            onSelect={() => {
              if (activeServerId) window.bookirc.sendMessage(activeServerId, activeChannel || '', `/whois ${nick}`)
            }}
          >
            Whois
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )

  return (
    <div className="h-full bg-[#16161a] overflow-y-auto py-2">
      <div className="px-2 py-1 text-xs text-zinc-500 uppercase tracking-wider font-semibold">
        Users ({users.length})
      </div>
      {ops.length > 0 && (
        <>
          <div className="px-2 py-0.5 text-[10px] text-zinc-600 uppercase tracking-wider">Ops</div>
          {ops.map((u) => renderUser(u.nick, '@'))}
        </>
      )}
      {voices.length > 0 && (
        <>
          <div className="px-2 py-0.5 text-[10px] text-zinc-600 uppercase tracking-wider">Voice</div>
          {voices.map((u) => renderUser(u.nick, '+'))}
        </>
      )}
      {regular.length > 0 && (
        <>
          <div className="px-2 py-0.5 text-[10px] text-zinc-600 uppercase tracking-wider">Users</div>
          {regular.map((u) => renderUser(u.nick, ' '))}
        </>
      )}
    </div>
  )
}
