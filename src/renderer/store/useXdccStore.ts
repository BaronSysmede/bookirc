import { create } from 'zustand'
import type { PackEntry } from '../../shared/types'

interface XdccStore {
  // key: `${serverId}:${botNick}`
  packLists: Map<string, PackEntry[]>
  addPacks: (serverId: string, botNick: string, packs: PackEntry[]) => void
  getPacks: (serverId: string, botNick: string) => PackEntry[]
  clearPacks: (serverId: string, botNick: string) => void
  selectedBot: { serverId: string; botNick: string } | null
  setSelectedBot: (serverId: string, botNick: string) => void
  searchResults: PackEntry[]
  setSearchResults: (results: PackEntry[]) => void
}

export const useXdccStore = create<XdccStore>((set, get) => ({
  packLists: new Map(),
  selectedBot: null,
  searchResults: [],

  addPacks: (serverId, botNick, packs) =>
    set((s) => {
      const key = `${serverId}:${botNick}`
      const packLists = new Map(s.packLists)
      const existing = packLists.get(key) ?? []
      // Merge, dedup by packNumber
      const merged = [...existing]
      for (const p of packs) {
        const idx = merged.findIndex((x) => x.packNumber === p.packNumber)
        if (idx >= 0) merged[idx] = p
        else merged.push(p)
      }
      merged.sort((a, b) => a.packNumber - b.packNumber)
      packLists.set(key, merged)
      return { packLists }
    }),

  getPacks: (serverId, botNick) => {
    const key = `${serverId}:${botNick}`
    return get().packLists.get(key) ?? []
  },

  clearPacks: (serverId, botNick) =>
    set((s) => {
      const key = `${serverId}:${botNick}`
      const packLists = new Map(s.packLists)
      packLists.delete(key)
      return { packLists }
    }),

  setSelectedBot: (serverId, botNick) =>
    set(() => ({ selectedBot: { serverId, botNick } })),

  setSearchResults: (results) =>
    set(() => ({ searchResults: results })),
}))
