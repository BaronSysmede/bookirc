import { ConnectionManager } from '../irc/ConnectionManager'
import { DownloadQueue } from './DownloadQueue'
import { DccTransfer } from './DccTransfer'
import { AppConfig } from '../config/AppConfig'
import * as net from 'net'
import * as http from 'http'
import * as https from 'https'

interface DccSendOffer {
  filename: string
  ip: string
  port: number
  filesize: number
  token?: string // for passive DCC
}

function ipIntToStr(ipInt: number): string {
  return [
    (ipInt >>> 24) & 0xff,
    (ipInt >>> 16) & 0xff,
    (ipInt >>> 8) & 0xff,
    ipInt & 0xff,
  ].join('.')
}

async function getExternalIp(stored: string): Promise<string> {
  if (stored) return stored
  return new Promise((resolve) => {
    https.get('https://api4.my-ip.io/ip', (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => (data += chunk.toString()))
      res.on('end', () => resolve(data.trim()))
    }).on('error', () => resolve(''))
  })
}

export class DccNegotiator {
  private connectionManager: ConnectionManager
  private downloadQueue: DownloadQueue
  private config: AppConfig
  private watchedBots = new Set<string>()

  constructor(cm: ConnectionManager, queue: DownloadQueue, config: AppConfig) {
    this.connectionManager = cm
    this.downloadQueue = queue
    this.config = config
  }

  private botKey(serverId: string, botNick: string): string {
    return `${serverId}:${botNick.toLowerCase()}`
  }

  watchForBot(serverId: string, botNick: string): void {
    const key = this.botKey(serverId, botNick)
    if (this.watchedBots.has(key)) return
    this.watchedBots.add(key)

    const conn = this.connectionManager.getConnection(serverId)
    if (!conn) return

    conn.interceptCTCP((nick: string, type: string, message: string) => {
      if (nick.toLowerCase() !== botNick.toLowerCase()) return
      if (type !== 'DCC') return
      this.handleDccCTCP(serverId, nick, message)
    })
  }

  private async handleDccCTCP(serverId: string, botNick: string, message: string): Promise<void> {
    // DCC SEND <filename> <ip> <port> <size> [token]
    const parts = message.split(' ')
    if (parts[0] !== 'SEND') return

    const rawFilename = parts[1]
    const filename = rawFilename.replace(/^"/, '').replace(/"$/, '')
    const ipInt = parseInt(parts[2], 10)
    const port = parseInt(parts[3], 10)
    const filesize = parseInt(parts[4], 10)
    const token = parts[5] // for passive DCC

    const ip = isNaN(ipInt) ? parts[2] : ipIntToStr(ipInt)
    const isPassive = port === 0

    const downloadDir = this.config.get('downloadDir')
    const filePath = require('path').join(downloadDir, filename)

    if (isPassive) {
      // Passive DCC: we open server, bot connects to us
      await this.handlePassiveDcc(serverId, botNick, filename, filesize, token!, filePath)
    } else {
      // Active DCC: we connect to bot's IP:port
      const transfer = new DccTransfer({
        serverId,
        botNick,
        filename,
        filePath,
        filesize,
        ip,
        port,
        downloadQueue: this.downloadQueue,
      })
      await transfer.start()
    }
  }

  private async handlePassiveDcc(
    serverId: string,
    botNick: string,
    filename: string,
    filesize: number,
    token: string,
    filePath: string
  ): Promise<void> {
    const conn = this.connectionManager.getConnection(serverId)
    if (!conn) return

    const externalIp = await getExternalIp(this.config.get('externalIp'))

    // Create TCP server for bot to connect to
    const server = net.createServer()
    await new Promise<void>((resolve) => server.listen(0, resolve))

    const address = server.address() as net.AddressInfo
    const ourPort = address.port

    // Send CTCP reply with our IP:port
    const ipParts = externalIp.split('.').map(Number)
    const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]
    conn.sendCTCP(botNick, 'DCC', `SEND ${filename} ${ipInt} ${ourPort} ${filesize} ${token}`)

    // Wait for bot to connect (30s timeout)
    const socket = await new Promise<net.Socket>((resolve, reject) => {
      const timeout = setTimeout(() => {
        server.close()
        reject(new Error('Passive DCC timeout: bot did not connect'))
      }, 30000)

      server.once('connection', (sock) => {
        clearTimeout(timeout)
        server.close()
        resolve(sock)
      })
    })

    const transfer = new DccTransfer({
      serverId,
      botNick,
      filename,
      filePath,
      filesize,
      socket,
      downloadQueue: this.downloadQueue,
    })
    await transfer.start()
  }
}
