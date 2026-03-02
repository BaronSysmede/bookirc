import React, { useState } from 'react'
import { useXdccStore } from '../../store/useXdccStore'
import { useServerStore } from '../../store/useServerStore'
import type { PackEntry, IndexerResult } from '../../../shared/types'

type SearchScope = 'bot' | 'network' | 'all'

export function IndexerSearch(): React.ReactElement {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<SearchScope>('all')
  const [searching, setSearching] = useState(false)

  const setSearchResults = useXdccStore((s) => s.setSearchResults)
  const selectedBot = useXdccStore((s) => s.selectedBot)
  const activeServerId = useServerStore((s) => s.activeServerId)
  const activeChannel = useServerStore((s) => s.activeChannel)

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)

    try {
      if (scope === 'bot' && selectedBot) {
        await window.bookirc.requestPacklist(selectedBot.serverId, selectedBot.botNick)
      } else if (scope === 'network' && activeServerId && activeChannel) {
        await window.bookirc.botSearch(activeServerId, activeChannel, query)
      } else {
        // Indexer search
        const results: IndexerResult[] = await window.bookirc.indexerSearch(query, ['sunxdcc', 'ixirc'])
        const packs: PackEntry[] = results.map((r) => ({
          packNumber: r.packNumber,
          gets: r.gets,
          filesize: r.filesize,
          filename: r.filename,
          serverId: '',
          botNick: r.botNick,
          source: r.indexer as 'sunxdcc' | 'ixirc',
          network: r.network,
          channel: r.channel,
        }))
        setSearchResults(packs)
      }
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#16161a] border-b border-zinc-800">
      <select
        className="bg-[#0d0d0f] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
        value={scope}
        onChange={(e) => setScope(e.target.value as SearchScope)}
      >
        <option value="bot">This Bot</option>
        <option value="network">This Network (@search)</option>
        <option value="all">All Indexers</option>
      </select>

      <input
        type="text"
        placeholder="Search files…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        className="flex-1 bg-[#0d0d0f] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accent/60"
      />

      <button
        className="px-3 py-1 text-xs bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50"
        onClick={handleSearch}
        disabled={searching}
      >
        {searching ? '…' : 'Search'}
      </button>
    </div>
  )
}
