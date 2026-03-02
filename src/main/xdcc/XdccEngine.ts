import { ConnectionManager } from '../irc/ConnectionManager'
import { BotQueryManager } from './BotQueryManager'
import { DccNegotiator } from './DccNegotiator'
import { DownloadQueue } from './DownloadQueue'
import { getMainWindow } from '../index'
import { AppConfig } from '../config/AppConfig'
import { randomUUID } from 'crypto'
import type { PackEntry } from '../../shared/types'

export class XdccEngine {
  private static instance: XdccEngine
  private connectionManager: ConnectionManager
  private botQueryManager: BotQueryManager
  private downloadQueue: DownloadQueue
  private dccNegotiator: DccNegotiator
  private config: AppConfig

  private constructor() {
    this.connectionManager = ConnectionManager.getInstance()
    this.config = AppConfig.getInstance()
    this.botQueryManager = new BotQueryManager(this.connectionManager)
    this.downloadQueue = new DownloadQueue(this.config)
    this.dccNegotiator = new DccNegotiator(this.connectionManager, this.downloadQueue, this.config)
  }

  static getInstance(): XdccEngine {
    if (!XdccEngine.instance) {
      XdccEngine.instance = new XdccEngine()
    }
    return XdccEngine.instance
  }

  async requestPacklist(serverId: string, botNick: string): Promise<void> {
    await this.botQueryManager.requestPacklist(serverId, botNick)
  }

  async botSearch(serverId: string, channel: string, term: string): Promise<void> {
    await this.botQueryManager.triggerSearch(serverId, channel, term)
  }

  async queuePack(serverId: string, botNick: string, packNum: number): Promise<string> {
    const conn = this.connectionManager.getConnection(serverId)
    if (!conn) throw new Error(`No connection for serverId ${serverId}`)

    // Register DCC interceptor for this bot
    this.dccNegotiator.watchForBot(serverId, botNick)

    // Send xdcc send command
    conn.sendMessage(botNick, `xdcc send #${packNum}`)

    const queueEntryId = randomUUID()
    const win = getMainWindow()
    if (win) {
      win.webContents.send('xdcc:queueUpdate', {
        id: queueEntryId,
        serverId,
        botNick,
        packNum,
        status: 'queued',
        timestamp: Date.now(),
      })
    }
    return queueEntryId
  }

  async pauseDownload(id: string): Promise<void> {
    this.downloadQueue.pause(id)
  }

  async resumeDownload(id: string): Promise<void> {
    this.downloadQueue.resume(id)
  }

  async cancelDownload(id: string): Promise<void> {
    this.downloadQueue.cancel(id)
  }
}
