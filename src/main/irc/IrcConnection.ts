import { Client } from 'irc-framework'
import { EventEmitter } from 'events'
import { getMainWindow } from '../index'
import type { ServerConfig } from '../../shared/types'
import { MessageRouter } from './MessageRouter'
import { SaslHandler } from './SaslHandler'

export interface IrcConnectionEvents {
  connected: []
  disconnected: [reason: string]
  error: [err: Error]
}

export class IrcConnection extends EventEmitter {
  public readonly serverId: string
  public readonly config: ServerConfig
  private client: InstanceType<typeof Client>
  private messageRouter: MessageRouter
  private saslHandler: SaslHandler
  private _connected = false

  constructor(serverId: string, config: ServerConfig) {
    super()
    this.serverId = serverId
    this.config = config
    this.client = new Client()
    this.messageRouter = new MessageRouter(serverId, this.client)
    this.saslHandler = new SaslHandler(config)
    this.setupEventForwarding()
  }

  private setupEventForwarding(): void {
    const win = () => getMainWindow()

    // Forward IRC events to renderer
    this.client.on('registered', () => {
      this._connected = true
      const w = win()
      if (w) {
        w.webContents.send('irc:event', {
          type: 'connected',
          serverId: this.serverId,
          timestamp: Date.now(),
        })
      }
      this.emit('connected')
    })

    this.client.on('close', () => {
      this._connected = false
      const w = win()
      if (w) {
        w.webContents.send('irc:event', {
          type: 'disconnected',
          serverId: this.serverId,
          timestamp: Date.now(),
        })
      }
      this.emit('disconnected', 'connection closed')
    })

    this.client.on('socket error', (err: Error) => {
      const w = win()
      if (w) {
        w.webContents.send('irc:event', {
          type: 'error',
          serverId: this.serverId,
          message: err.message,
          timestamp: Date.now(),
        })
      }
      this.emit('error', err)
    })

    // Route all messages
    this.messageRouter.attach()
  }

  get connected(): boolean {
    return this._connected
  }

  get rawClient(): InstanceType<typeof Client> {
    return this.client
  }

  async connect(): Promise<void> {
    const opts: Record<string, unknown> = {
      host: this.config.host,
      port: this.config.port,
      tls: this.config.ssl,
      nick: this.config.nick,
      username: this.config.username || this.config.nick,
      gecos: this.config.realname || 'BookIRC User',
      rejectUnauthorized: false,
    }

    if (this.config.saslEnabled && this.config.password) {
      opts.account = {
        account: this.config.username || this.config.nick,
        password: this.config.password,
      }
    }

    this.client.connect(opts as Parameters<typeof this.client.connect>[0])

    return new Promise((resolve, reject) => {
      const onConnected = () => {
        resolve()
        cleanup()
      }
      const onError = (err: Error) => {
        reject(err)
        cleanup()
      }
      const cleanup = () => {
        this.removeListener('connected', onConnected)
        this.removeListener('error', onError)
      }
      this.once('connected', onConnected)
      this.once('error', onError)
    })
  }

  disconnect(): void {
    this.client.quit('BookIRC')
  }

  sendMessage(target: string, message: string): void {
    this.client.say(target, message)
  }

  joinChannel(channel: string): void {
    this.client.join(channel)
  }

  partChannel(channel: string): void {
    this.client.part(channel)
  }

  sendCTCP(target: string, type: string, message?: string): void {
    const ctcp = message ? `\x01${type} ${message}\x01` : `\x01${type}\x01`
    this.client.say(target, ctcp)
  }

  interceptCTCP(callback: (nick: string, type: string, message: string) => void): void {
    this.client.on('ctcp request', (event: { nick: string; type: string; message: string }) => {
      callback(event.nick, event.type, event.message)
    })
  }
}
