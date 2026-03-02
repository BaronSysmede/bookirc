import React from 'react'
import { useXdccStore } from '../../store/useXdccStore'
import { useServerStore } from '../../store/useServerStore'
import { PackTable } from '../xdcc/PackTable'
import { IndexerSearch } from '../xdcc/IndexerSearch'
import type { PackEntry } from '../../../shared/types'

export function XdccPanel(): React.ReactElement {
  const selectedBot = useXdccStore((s) => s.selectedBot)
  const getPacks = useXdccStore((s) => s.getPacks)
  const searchResults = useXdccStore((s) => s.searchResults)
  const activeServerId = useServerStore((s) => s.activeServerId)

  const packs: PackEntry[] = selectedBot
    ? getPacks(selectedBot.serverId, selectedBot.botNick)
    : searchResults

  const handleQueue = async (pack: PackEntry) => {
    const serverId = pack.serverId || activeServerId
    if (!serverId) {
      alert(`Not connected to ${pack.network ?? 'this network'}. Connect first.`)
      return
    }
    try {
      await window.bookirc.queuePack(serverId, pack.botNick, pack.packNumber)
    } catch (err) {
      console.error('Queue failed:', err)
    }
  }

  const handleGetList = () => {
    if (selectedBot) {
      window.bookirc.requestPacklist(selectedBot.serverId, selectedBot.botNick)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#0d0d0f]">
      <IndexerSearch />

      {/* Bot selector + controls */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#16161a] border-b border-zinc-800 shrink-0">
        <span className="text-xs text-zinc-500">Bot:</span>
        <span className="text-xs text-zinc-300">
          {selectedBot ? selectedBot.botNick : <span className="text-zinc-600">none selected</span>}
        </span>
        {selectedBot && (
          <button
            className="ml-2 px-2 py-0.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
            onClick={handleGetList}
          >
            Get List
          </button>
        )}
        <span className="ml-auto text-xs text-zinc-600">
          {packs.length > 0 ? `${packs.length} packs` : ''}
        </span>
      </div>

      {/* Pack table */}
      <div className="flex-1 min-h-0">
        {packs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-zinc-600 flex-col gap-2">
            <span>No packs loaded</span>
            <span className="text-zinc-700">Right-click a bot in the user list → Get List</span>
          </div>
        ) : (
          <PackTable packs={packs} onQueue={handleQueue} />
        )}
      </div>
    </div>
  )
}
