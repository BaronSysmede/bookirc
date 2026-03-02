import React from 'react'
import { useServerStore } from '../../store/useServerStore'

export function ServerTree(): React.ReactElement {
  const servers = useServerStore((s) => s.servers)
  const activeServerId = useServerStore((s) => s.activeServerId)
  const activeChannel = useServerStore((s) => s.activeChannel)
  const setActiveChannel = useServerStore((s) => s.setActiveChannel)

  const serverList = Array.from(servers.values())

  return (
    <div className="h-full bg-[#16161a] overflow-y-auto py-2">
      <div className="px-3 py-1 text-xs text-zinc-500 uppercase tracking-wider font-semibold">
        Servers
      </div>
      {serverList.length === 0 && (
        <div className="px-3 py-2 text-xs text-zinc-600">No connections</div>
      )}
      {serverList.map((srv) => {
        const channels = Array.from(srv.channels.values())
        return (
          <div key={srv.id}>
            <div className="flex items-center gap-1.5 px-3 py-1 text-xs">
              <span
                className={`w-1.5 h-1.5 rounded-full ${srv.connected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-zinc-300 font-medium truncate">{srv.host}</span>
              <span className="text-zinc-600 ml-auto">{srv.nick}</span>
            </div>
            {channels.map((ch) => {
              const isActive = activeServerId === srv.id && activeChannel === ch.name
              return (
                <button
                  key={ch.name}
                  className={`w-full text-left pl-7 pr-3 py-0.5 text-xs flex items-center gap-1 transition-colors ${
                    isActive
                      ? 'bg-accent/20 text-accent'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  onClick={() => setActiveChannel(srv.id, ch.name)}
                >
                  <span className="text-zinc-600">#</span>
                  <span className="truncate">{ch.name.replace(/^#/, '')}</span>
                  {ch.unread > 0 && (
                    <span className="ml-auto bg-accent text-white text-[10px] px-1 rounded-full">
                      {ch.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
