import { create } from 'zustand'

export interface IrcMessage {
  id: string
  nick: string
  message: string
  timestamp: number
  type: 'message' | 'notice' | 'system'
}

const RING_SIZE = 2000

interface MessageStore {
  // key: `${serverId}:${channel}`
  buffers: Map<string, IrcMessage[]>
  addMessage: (serverId: string, target: string, msg: IrcMessage) => void
  getMessages: (serverId: string, target: string) => IrcMessage[]
  clearBuffer: (serverId: string, target: string) => void
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  buffers: new Map(),

  addMessage: (serverId, target, msg) =>
    set((s) => {
      const key = `${serverId}:${target}`
      const buffers = new Map(s.buffers)
      const existing = buffers.get(key) ?? []
      const updated = existing.length >= RING_SIZE
        ? [...existing.slice(1), msg]
        : [...existing, msg]
      buffers.set(key, updated)
      return { buffers }
    }),

  getMessages: (serverId, target) => {
    const key = `${serverId}:${target}`
    return get().buffers.get(key) ?? []
  },

  clearBuffer: (serverId, target) =>
    set((s) => {
      const key = `${serverId}:${target}`
      const buffers = new Map(s.buffers)
      buffers.delete(key)
      return { buffers }
    }),
}))
