import { create } from 'zustand'

export interface ChannelState {
  name: string
  topic?: string
  unread: number
  active: boolean
}

export interface ServerState {
  id: string
  host: string
  nick: string
  connected: boolean
  channels: Map<string, ChannelState>
}

interface ServerStore {
  servers: Map<string, ServerState>
  activeServerId: string | null
  activeChannel: string | null

  addServer: (id: string, host: string, nick: string) => void
  removeServer: (id: string) => void
  setConnected: (id: string, connected: boolean) => void
  addChannel: (serverId: string, channel: string) => void
  removeChannel: (serverId: string, channel: string) => void
  setActiveChannel: (serverId: string, channel: string) => void
  incrementUnread: (serverId: string, channel: string) => void
  clearUnread: (serverId: string, channel: string) => void
}

export const useServerStore = create<ServerStore>((set) => ({
  servers: new Map(),
  activeServerId: null,
  activeChannel: null,

  addServer: (id, host, nick) =>
    set((s) => {
      const servers = new Map(s.servers)
      servers.set(id, { id, host, nick, connected: false, channels: new Map() })
      return { servers, activeServerId: id }
    }),

  removeServer: (id) =>
    set((s) => {
      const servers = new Map(s.servers)
      servers.delete(id)
      return { servers }
    }),

  setConnected: (id, connected) =>
    set((s) => {
      const servers = new Map(s.servers)
      const srv = servers.get(id)
      if (srv) servers.set(id, { ...srv, connected })
      return { servers }
    }),

  addChannel: (serverId, channel) =>
    set((s) => {
      const servers = new Map(s.servers)
      const srv = servers.get(serverId)
      if (!srv) return {}
      const channels = new Map(srv.channels)
      if (!channels.has(channel)) {
        channels.set(channel, { name: channel, unread: 0, active: false })
      }
      servers.set(serverId, { ...srv, channels })
      return { servers }
    }),

  removeChannel: (serverId, channel) =>
    set((s) => {
      const servers = new Map(s.servers)
      const srv = servers.get(serverId)
      if (!srv) return {}
      const channels = new Map(srv.channels)
      channels.delete(channel)
      servers.set(serverId, { ...srv, channels })
      return { servers }
    }),

  setActiveChannel: (serverId, channel) =>
    set(() => ({ activeServerId: serverId, activeChannel: channel })),

  incrementUnread: (serverId, channel) =>
    set((s) => {
      const servers = new Map(s.servers)
      const srv = servers.get(serverId)
      if (!srv) return {}
      const channels = new Map(srv.channels)
      const ch = channels.get(channel)
      if (ch) channels.set(channel, { ...ch, unread: ch.unread + 1 })
      servers.set(serverId, { ...srv, channels })
      return { servers }
    }),

  clearUnread: (serverId, channel) =>
    set((s) => {
      const servers = new Map(s.servers)
      const srv = servers.get(serverId)
      if (!srv) return {}
      const channels = new Map(srv.channels)
      const ch = channels.get(channel)
      if (ch) channels.set(channel, { ...ch, unread: 0 })
      servers.set(serverId, { ...srv, channels })
      return { servers }
    }),
}))
