import { create } from 'zustand'

export interface ChannelUser {
  nick: string
  modes: string[]
  isOp: boolean
  isVoice: boolean
  isBot: boolean
}

interface UserListStore {
  // key: `${serverId}:${channel}`
  userLists: Map<string, ChannelUser[]>
  setUsers: (serverId: string, channel: string, users: Array<{ nick: string; modes: string[] }>) => void
  getUsers: (serverId: string, channel: string) => ChannelUser[]
  addUser: (serverId: string, channel: string, user: { nick: string; modes: string[] }) => void
  removeUser: (serverId: string, channel: string, nick: string) => void
  renameUser: (serverId: string, channel: string, oldNick: string, newNick: string) => void
}

function toChannelUser(u: { nick: string; modes: string[] }): ChannelUser {
  const modesStr = u.modes.join('')
  return {
    nick: u.nick,
    modes: u.modes,
    isOp: modesStr.includes('@') || modesStr.includes('o'),
    isVoice: modesStr.includes('+') || modesStr.includes('v'),
    isBot: u.nick.toLowerCase().includes('bot') || u.nick.toLowerCase().includes('xdcc'),
  }
}

export const useUserListStore = create<UserListStore>((set, get) => ({
  userLists: new Map(),

  setUsers: (serverId, channel, users) =>
    set((s) => {
      const key = `${serverId}:${channel}`
      const userLists = new Map(s.userLists)
      userLists.set(key, users.map(toChannelUser))
      return { userLists }
    }),

  getUsers: (serverId, channel) => {
    const key = `${serverId}:${channel}`
    return get().userLists.get(key) ?? []
  },

  addUser: (serverId, channel, user) =>
    set((s) => {
      const key = `${serverId}:${channel}`
      const userLists = new Map(s.userLists)
      const existing = userLists.get(key) ?? []
      if (!existing.find((u) => u.nick === user.nick)) {
        userLists.set(key, [...existing, toChannelUser(user)])
      }
      return { userLists }
    }),

  removeUser: (serverId, channel, nick) =>
    set((s) => {
      const key = `${serverId}:${channel}`
      const userLists = new Map(s.userLists)
      const existing = userLists.get(key) ?? []
      userLists.set(key, existing.filter((u) => u.nick !== nick))
      return { userLists }
    }),

  renameUser: (serverId, channel, oldNick, newNick) =>
    set((s) => {
      const key = `${serverId}:${channel}`
      const userLists = new Map(s.userLists)
      const existing = userLists.get(key) ?? []
      userLists.set(key, existing.map((u) => u.nick === oldNick ? { ...u, nick: newNick } : u))
      return { userLists }
    }),
}))
