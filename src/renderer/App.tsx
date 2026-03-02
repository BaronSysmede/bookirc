import React, { useEffect, useRef, useState } from 'react'
import { ServerTree } from './components/layout/ServerTree'
import { MessagePane } from './components/layout/MessagePane'
import { UserList } from './components/layout/UserList'
import { XdccPanel } from './components/layout/XdccPanel'
import { DownloadQueuePanel } from './components/layout/DownloadQueue'
import { useServerStore } from './store/useServerStore'
import { useMessageStore } from './store/useMessageStore'
import { useUserListStore } from './store/useUserListStore'
import { useXdccStore } from './store/useXdccStore'
import { useDownloadStore } from './store/useDownloadStore'
import { ConnectDialog } from './components/layout/ConnectDialog'

type BottomTab = 'files' | 'downloads'

export default function App(): React.ReactElement {
  const [bottomTab, setBottomTab] = useState<BottomTab>('files')
  const [showConnect, setShowConnect] = useState(false)
  const addMessage = useMessageStore((s) => s.addMessage)
  const setUsers = useUserListStore((s) => s.setUsers)
  const addPacks = useXdccStore((s) => s.addPacks)
  const updateDownload = useDownloadStore((s) => s.updateDownload)
  const setConnected = useServerStore((s) => s.setConnected)
  const addServer = useServerStore((s) => s.addServer)

  useEffect(() => {
    if (!window.bookirc) {
      console.error('[bookirc] window.bookirc is undefined — preload did not load')
      return
    }
    const removeIrc = window.bookirc.onIrcEvent((e) => {
      if (e.type === 'message' || e.type === 'notice' || e.type === 'privmsg') {
        addMessage(e.serverId, (e.target as string) || e.serverId, {
          id: `${Date.now()}-${Math.random()}`,
          nick: e.nick as string,
          message: e.message as string,
          timestamp: e.timestamp,
          type: e.type as 'message' | 'notice',
        })
      } else if (e.type === 'join' || e.type === 'part' || e.type === 'quit') {
        addMessage(e.serverId, (e.channel as string) || e.serverId, {
          id: `${Date.now()}-${Math.random()}`,
          nick: e.nick as string,
          message: e.type === 'join'
            ? `${e.nick} joined`
            : e.type === 'part'
            ? `${e.nick} left${e.message ? ': ' + e.message : ''}`
            : `${e.nick} quit${e.message ? ': ' + e.message : ''}`,
          timestamp: e.timestamp,
          type: 'system',
        })
      } else if (e.type === 'userlist') {
        setUsers(e.serverId, e.channel as string, e.users as Array<{ nick: string; modes: string[] }>)
      } else if (e.type === 'connected') {
        setConnected(e.serverId, true)
      } else if (e.type === 'disconnected') {
        setConnected(e.serverId, false)
      }
    })

    const removePacklist = window.bookirc.onPacklist((e) => {
      addPacks(e.serverId, e.botNick, e.packs)
    })

    const removeProgress = window.bookirc.onProgress((e) => {
      updateDownload(e)
    })

    return () => {
      removeIrc()
      removePacklist()
      removeProgress()
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-[#0d0d0f] text-zinc-200 select-none">
      {/* Menu bar */}
      <div className="flex items-center h-8 bg-[#16161a] border-b border-zinc-800 px-3 gap-4 shrink-0">
        <span className="font-bold text-accent text-sm tracking-wider">BookIRC</span>
        <button
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          onClick={() => setShowConnect(true)}
        >
          Connect
        </button>
        <button className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
          Settings
        </button>
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: server tree */}
        <div className="w-[200px] shrink-0 border-r border-zinc-800 overflow-hidden">
          <ServerTree />
        </div>

        {/* Center: message pane */}
        <div className="flex-1 min-w-0 flex flex-col">
          <MessagePane />
        </div>

        {/* Right: user list */}
        <div className="w-[180px] shrink-0 border-l border-zinc-800 overflow-hidden">
          <UserList />
        </div>
      </div>

      {/* Bottom panel */}
      <div className="h-[280px] shrink-0 border-t border-zinc-800 flex flex-col">
        {/* Bottom tabs */}
        <div className="flex h-8 bg-[#16161a] border-b border-zinc-800 shrink-0">
          <button
            className={`px-4 text-xs h-full transition-colors ${
              bottomTab === 'files'
                ? 'text-accent border-b-2 border-accent'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setBottomTab('files')}
          >
            File Browser
          </button>
          <button
            className={`px-4 text-xs h-full transition-colors ${
              bottomTab === 'downloads'
                ? 'text-accent border-b-2 border-accent'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setBottomTab('downloads')}
          >
            Downloads
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {bottomTab === 'files' ? <XdccPanel /> : <DownloadQueuePanel />}
        </div>
      </div>

      {showConnect && <ConnectDialog onClose={() => setShowConnect(false)} />}
    </div>
  )
}
