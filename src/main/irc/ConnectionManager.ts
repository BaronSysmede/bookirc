import { IrcConnection } from './IrcConnection'
import type { ServerConfig } from '../../shared/types'
import { randomUUID } from 'crypto'

export class ConnectionManager {
  private static instance: ConnectionManager
  private connections = new Map<string, IrcConnection>()

  private constructor() {}

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  async connect(config: ServerConfig): Promise<string> {
    const serverId = randomUUID()
    const conn = new IrcConnection(serverId, config)
    this.connections.set(serverId, conn)
    await conn.connect()
    return serverId
  }

  async disconnect(serverId: string): Promise<void> {
    const conn = this.connections.get(serverId)
    if (conn) {
      conn.disconnect()
      this.connections.delete(serverId)
    }
  }

  getConnection(serverId: string): IrcConnection | undefined {
    return this.connections.get(serverId)
  }

  getAllConnections(): Map<string, IrcConnection> {
    return this.connections
  }

  async sendMessage(serverId: string, target: string, msg: string): Promise<void> {
    const conn = this.connections.get(serverId)
    if (!conn) throw new Error(`No connection for serverId ${serverId}`)
    conn.sendMessage(target, msg)
  }

  async joinChannel(serverId: string, channel: string): Promise<void> {
    const conn = this.connections.get(serverId)
    if (!conn) throw new Error(`No connection for serverId ${serverId}`)
    conn.joinChannel(channel)
  }

  async partChannel(serverId: string, channel: string): Promise<void> {
    const conn = this.connections.get(serverId)
    if (!conn) throw new Error(`No connection for serverId ${serverId}`)
    conn.partChannel(channel)
  }
}
