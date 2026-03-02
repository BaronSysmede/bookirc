import { ConnectionManager } from '../irc/ConnectionManager'
import { PacklistParser } from './PacklistParser'
import { getMainWindow } from '../index'
import type { PackEntry } from '../../shared/types'

const END_OF_LIST_PATTERNS = [
  /total\s+of\s+\d+\s+pack/i,
  /\d+\s+pack[s]?\s+listed/i,
  /end\s+of\s+list/i,
  /\*\*\*\s+end/i,
]

export class BotQueryManager {
  private connectionManager: ConnectionManager
  private parser: PacklistParser
  private activeQueries = new Map<string, {
    packs: PackEntry[]
    timer: NodeJS.Timeout | null
    page: number
  }>()

  constructor(cm: ConnectionManager) {
    this.connectionManager = cm
    this.parser = new PacklistParser()
  }

  private queryKey(serverId: string, botNick: string): string {
    return `${serverId}:${botNick}`
  }

  async requestPacklist(serverId: string, botNick: string): Promise<void> {
    const conn = this.connectionManager.getConnection(serverId)
    if (!conn) throw new Error(`No connection ${serverId}`)

    const key = this.queryKey(serverId, botNick)
    if (this.activeQueries.has(key)) return // already fetching

    const state = { packs: [] as PackEntry[], timer: null as NodeJS.Timeout | null, page: 1 }
    this.activeQueries.set(key, state)

    // Listen for private messages from this bot
    const client = conn.rawClient
    const onMsg = (event: { nick: string; target: string; message: string }) => {
      if (event.nick.toLowerCase() !== botNick.toLowerCase()) return
      if (event.target !== conn.config.nick) return // must be PM

      this.handleBotLine(serverId, botNick, event.message, state)
    }

    client.on('privmsg', onMsg)

    // Send !list command
    conn.sendMessage(botNick, '!list')

    // 30s silence timeout
    state.timer = setTimeout(() => {
      client.removeListener('privmsg', onMsg)
      this.activeQueries.delete(key)
      this.flushPacks(serverId, botNick, state.packs)
    }, 30000)
  }

  private handleBotLine(
    serverId: string,
    botNick: string,
    line: string,
    state: { packs: PackEntry[]; timer: NodeJS.Timeout | null; page: number }
  ): void {
    // Reset silence timer
    if (state.timer) {
      clearTimeout(state.timer)
      state.timer = setTimeout(() => {
        this.flushPacks(serverId, botNick, state.packs)
        this.activeQueries.delete(this.queryKey(serverId, botNick))
      }, 30000)
    }

    // Check end of list
    const isEnd = END_OF_LIST_PATTERNS.some((p) => p.test(line))
    if (isEnd) {
      if (state.timer) clearTimeout(state.timer)
      this.flushPacks(serverId, botNick, state.packs)
      this.activeQueries.delete(this.queryKey(serverId, botNick))
      return
    }

    // Try to parse as pack entry
    const pack = this.parser.parseLine(line, serverId, botNick)
    if (pack) {
      state.packs.push(pack)
    }
  }

  private flushPacks(serverId: string, botNick: string, packs: PackEntry[]): void {
    if (packs.length === 0) return
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('xdcc:packlist', {
        serverId,
        botNick,
        packs,
        timestamp: Date.now(),
      })
    }
  }

  async triggerSearch(serverId: string, channel: string, term: string): Promise<void> {
    const conn = this.connectionManager.getConnection(serverId)
    if (!conn) throw new Error(`No connection ${serverId}`)
    // Try both @search and @find
    conn.sendMessage(channel, `@search ${term}`)
    setTimeout(() => conn.sendMessage(channel, `@find ${term}`), 500)
  }
}
